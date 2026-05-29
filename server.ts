import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as admin from 'firebase-admin';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };
import { aliExpressProvider } from './src/lib/providers/aliExpress';
import { GoogleGenAI } from "@google/genai";

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});
const db = admin.firestore();
db.settings({ databaseId: firebaseConfig.firestoreDatabaseId });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// Simple rate limiter state: { [ip]: { count: number, timestamp: number } }
const rateLimiter = new Map<string, { count: number, resetTime: number }>();
const productSearchCache = new Map<string, { data: unknown[]; expiresAt: number }>();
const RATE_LIMIT = 5; // requests per window
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const PRODUCT_CACHE_MS = 24 * 60 * 60 * 1000;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Simple Admin Auth Middleware
  const adminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const password = req.headers['x-admin-password'];
    // In production, use a proper environment variable for this
    if (password === 'admin123') { 
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
  };

  // API routes
  app.get("/api/posts", async (req, res) => {
    try {
        const snapshot = await db.collection('posts').get();
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(posts);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e instanceof Error ? e.message : 'Unknown error' });
    }
  });

  app.post("/api/posts", adminAuth, async (req, res) => {
     try {
         const post = req.body;
         await db.collection('posts').doc(post.id).set(post);
         res.status(201).json({ status: 'created' });
     } catch (e) {
         console.error(e);
         res.status(500).json({ error: e instanceof Error ? e.message : 'Unknown error' });
     }
  });

  app.delete("/api/posts/:id", adminAuth, async (req, res) => {
      try {
          await db.collection('posts').doc(req.params.id).delete();
          res.json({ status: 'deleted' });
      } catch (e) {
          console.error(e);
          res.status(500).json({ error: e instanceof Error ? e.message : 'Unknown error' });
      }
  });

  app.post("/api/generate-post", adminAuth, async (req, res) => {
    const topic = req.body.topic;
    const ip = req.ip || 'unknown';

    // Rate limiting
    const now = Date.now();
    const tracker = rateLimiter.get(ip) || { count: 0, resetTime: now + WINDOW_MS };
    if (now > tracker.resetTime) {
      tracker.count = 0;
      tracker.resetTime = now + WINDOW_MS;
    }
    if (tracker.count >= RATE_LIMIT) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    tracker.count++;
    rateLimiter.set(ip, tracker);

    try {
      const prompt = `
        You are an AI Search/AEO expert editor for "Things2buy".
        Create a detailed, highly structured, and analytical shopping guide for "${topic}" optimized for AI Answer Engines (Perplexity, Google AI Overviews).
        
        Adopt a critical, balanced, and skeptical tone. Do not just promote; analyze.
        Explicitly highlight potential risks, caveats for Korean users, and reasons why someone might NOT want a product.

        Return a JSON object with the following structure:
        {
          "title": "Catchy, authoritative title",
          "excerpt": "Engaging, objective 2-sentence summary",
          "category": "One of: Travel, Event, Anniversary, Tech, Home",
          "tags": ["Array", "of", "5", "tags"],
          "coverImageQuery": "A search query for a relevant cover image on Unsplash",
          "content": "A single string containing Markdown formatted content with the following exact structure:
          # ${topic}
          
          ## Quick Answer
          [Direct, concise answer in 2-3 sentences]

          ## Who This Is For
          - [Point 1]
          - [Point 2]
          - [Point 3]

          ## Top Picks Summary
          | Rank | Product | Best For | Price | Pros | Cons | Reliability |
          | --- | --- | --- | --- | --- | --- | --- |
          
          ## How We Chose
          - Criteria 1
          - Criteria 2

          ## Product Comparison
          [Critical comparison analysis]

          ## Buying Guide
          [Helpful, objective buying advice]

          ## FAQ
          ### Are ${topic} safe for children?
          [Answer]
          ### How long should top-tier ${topic} last?
          [Answer]
          ### Which type is best for travel?
          [Answer]

          ## Disclosure
          This page may contain affiliate links.",
          "products": [
            {
              "name": "Product name 1",
              "selectionCriteria": "Criteria used for selection",
              "rationale": "Detailed reason why this is recommended, including pros/cons",
              "risks": "Risks (e.g., shipping, AS, quality, durability issues)",
              "koreanUserCaveats": "Specific considerations for Korean users (shipping time, warranty, plug types, compliance)",
              "reliabilityGrade": "High / Medium / Low",
              "searchKeyword": "Search query for AliExpress"
            },
            {
              "name": "Product name 2",
              "selectionCriteria": "Criteria used for selection",
              "rationale": "Detailed reason why this is recommended, including pros/cons",
              "risks": "Risks (e.g., shipping, AS, quality, durability issues)",
              "koreanUserCaveats": "Specific considerations for Korean users (shipping time, warranty, plug types, compliance)",
              "reliabilityGrade": "High / Medium / Low",
              "searchKeyword": "Search query for AliExpress"
            },
            {
              "name": "Product name 3",
              "selectionCriteria": "Criteria used for selection",
              "rationale": "Detailed reason why this is recommended, including pros/cons",
              "risks": "Risks (e.g., shipping, AS, quality, durability issues)",
              "koreanUserCaveats": "Specific considerations for Korean users (shipping time, warranty, plug types, compliance)",
              "reliabilityGrade": "High / Medium / Low",
              "searchKeyword": "Search query for AliExpress"
            }
          ]
        }
      `;

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = result.response.text();
      const content = JSON.parse(responseText);

      // Log generation
      await db.collection('logs').add({
        topic,
        prompt,
        output: content,
        cost: 0, // Placeholder
        createdBy: 'admin',
        createdAt: admin.firestore.Timestamp.now()
      });

      res.json(content);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to generate' });
    }
  });

  // Product API
  app.get("/api/products/search", adminAuth, async (req, res) => {
    const { keyword, platform } = req.query;
    if (!keyword) return res.status(400).json({ error: 'Keyword required' });

    try {
        const cacheKey = `${String(platform || 'AliExpress')}::${String(keyword).trim().toLowerCase()}`;
        const cached = productSearchCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
          return res.json(cached.data);
        }

        let results = [];
        if (platform === 'AliExpress') {
            results = await aliExpressProvider.search(keyword as string);
        }
        productSearchCache.set(cacheKey, {
          data: results,
          expiresAt: Date.now() + PRODUCT_CACHE_MS
        });
        res.json(results);
    } catch (e) {
        console.error(e);
        res.json([]);
    }
  });

  app.post("/api/clicks", async (req, res) => {
    const { postId, productId, platform, affiliateLink, referrer, userAgent } = req.body || {};
    if (!postId || !productId || !platform || !affiliateLink) {
      return res.status(400).json({ error: 'postId, productId, platform, affiliateLink are required' });
    }

    try {
      await db.collection('clicks').add({
        postId,
        productId,
        platform,
        affiliateLink,
        referrer: referrer || null,
        userAgent: userAgent || req.get('user-agent') || null,
        clickedAt: admin.firestore.Timestamp.now()
      });
      res.status(201).json({ status: 'recorded' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to record click' });
    }
  });

  app.get("/go/:productId", async (req, res) => {
    const { productId } = req.params;
    const postId = req.query.postId as string | undefined;

    try {
      const snapshot = await db.collection('posts').get();
      let targetPostId = postId || '';
      let product: any = null;

      for (const doc of snapshot.docs) {
        const data = doc.data() as any;
        const products = Array.isArray(data.products) ? data.products : [];
        const found = products.find((p: any) => p.id === productId);
        if (found) {
          targetPostId = targetPostId || doc.id;
          product = found;
          break;
        }
      }

      if (!product || !product.affiliateLink) {
        return res.status(404).send('Product not found');
      }

      await db.collection('clicks').add({
        postId: targetPostId,
        productId,
        platform: product.platform || 'AliExpress',
        affiliateLink: product.affiliateLink,
        referrer: req.get('referer') || null,
        userAgent: req.get('user-agent') || null,
        clickedAt: admin.firestore.Timestamp.now()
      });

      res.redirect(302, product.affiliateLink);
    } catch (e) {
      console.error(e);
      res.status(500).send('Failed to redirect');
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // Explicitly handle SPA fallback for dev mode
    app.use('*', (req, res, next) => {
        if (req.originalUrl.startsWith('/api')) return next();
        res.sendFile(path.join(process.cwd(), 'index.html'));
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
