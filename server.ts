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
const RATE_LIMIT = 5; // requests per window
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const PRODUCT_CACHE_MS = 24 * 60 * 60 * 1000;

type ProductIndexDocument = {
  productId: string;
  postId: string;
  affiliateLink: string;
  platform: string;
  name: string;
  price: number;
  currency: string;
  productUrl?: string;
  imageUrl?: string;
  clickCount?: number;
  conversionScore?: number;
  lastClickedAt?: admin.firestore.Timestamp;
  updatedAt: admin.firestore.FieldValue | admin.firestore.Timestamp;
};

const getProductIndexDocId = (productId: string) => encodeURIComponent(productId);

const buildProductIndexDocument = (postId: string, product: any): ProductIndexDocument | null => {
  if (!product?.id || !product?.affiliateLink) return null;

  return {
    productId: product.id,
    postId,
    affiliateLink: product.affiliateLink,
    platform: product.platform || 'AliExpress',
    name: product.name || '',
    price: Number(product.price) || 0,
    currency: product.currency || 'USD',
    productUrl: product.productUrl || product.affiliateLink,
    imageUrl: product.imageUrl || '',
    clickCount: Number(product.clickCount) || 0,
    conversionScore: Number(product.conversionScore) || 0,
    ...(product.lastClickedAt ? { lastClickedAt: admin.firestore.Timestamp.fromDate(new Date(product.lastClickedAt)) } : {}),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
};

const getProductSearchCacheDocId = (cacheKey: string) => encodeURIComponent(cacheKey);

const createPostSlug = (title: string, fallback: string): string => {
  const slug = String(title || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || fallback;
};

const syncProductIndexForPost = async (post: any) => {
  if (!post?.id) throw new Error('Post id is required to sync product index');

  const existingIndexes = await db.collection('productIndex').where('postId', '==', post.id).get();
  const batch = db.batch();
  let operationCount = 0;

  existingIndexes.docs.forEach(doc => {
    batch.delete(doc.ref);
    operationCount += 1;
  });

  const indexedProducts = Array.isArray(post.products) ? post.products : [];
  indexedProducts.forEach((product: any) => {
    const indexDoc = buildProductIndexDocument(post.id, product);
    if (!indexDoc) return;

    batch.set(db.collection('productIndex').doc(getProductIndexDocId(indexDoc.productId)), indexDoc);
    operationCount += 1;
  });

  if (operationCount > 0) {
    await batch.commit();
  }
};

const deleteProductIndexForPost = async (postId: string) => {
  const existingIndexes = await db.collection('productIndex').where('postId', '==', postId).get();
  if (existingIndexes.empty) return;

  const batch = db.batch();
  existingIndexes.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
};

const recordClickAndUpdateProductStats = async (click: {
  postId: string;
  productId: string;
  platform: string;
  affiliateLink: string;
  referrer?: string | null;
  userAgent?: string | null;
}) => {
  const clickedAt = admin.firestore.Timestamp.now();
  const clickRef = db.collection('clicks').doc();
  const postRef = db.collection('posts').doc(click.postId);
  const indexRef = db.collection('productIndex').doc(getProductIndexDocId(click.productId));

  await db.runTransaction(async transaction => {
    const [postSnapshot, indexSnapshot] = await Promise.all([
      transaction.get(postRef),
      transaction.get(indexRef)
    ]);

    const indexedProduct = indexSnapshot.exists ? indexSnapshot.data() as ProductIndexDocument : null;
    const post = postSnapshot.exists ? postSnapshot.data() as any : null;
    const products = Array.isArray(post?.products) ? post.products : [];
    const existingProduct = products.find((product: any) => product.id === click.productId);
    const currentClickCount = Math.max(
      Number(indexedProduct?.clickCount) || 0,
      Number(existingProduct?.clickCount) || 0
    );
    const nextClickCount = currentClickCount + 1;
    const conversionScore = nextClickCount;

    transaction.set(clickRef, {
      ...click,
      clickedAt
    });

    transaction.set(indexRef, {
      productId: click.productId,
      postId: click.postId,
      platform: click.platform,
      affiliateLink: click.affiliateLink,
      name: indexedProduct?.name || existingProduct?.name || '',
      price: indexedProduct?.price || existingProduct?.price || 0,
      currency: indexedProduct?.currency || existingProduct?.currency || 'USD',
      productUrl: indexedProduct?.productUrl || existingProduct?.productUrl || click.affiliateLink,
      imageUrl: indexedProduct?.imageUrl || existingProduct?.imageUrl || '',
      clickCount: nextClickCount,
      conversionScore,
      lastClickedAt: clickedAt,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    if (postSnapshot.exists) {
      const updatedProducts = products.map((product: any) => {
        if (product.id !== click.productId) return product;

        return {
          ...product,
          clickCount: nextClickCount,
          conversionScore,
          lastClickedAt: clickedAt.toDate().toISOString()
        };
      });

      transaction.update(postRef, {
        products: updatedProducts,
        updatedAt: new Date().toISOString()
      });
    }
  });
};

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
         if (!post?.id) return res.status(400).json({ error: 'Post id is required' });

         const normalizedProducts = Array.isArray(post.products)
           ? post.products.map((product: any) => ({ ...product, postId: post.id }))
           : [];
         const normalizedPost = {
           ...post,
           slug: post.slug || createPostSlug(post.title, post.id),
           products: normalizedProducts
         };

         await db.collection('posts').doc(normalizedPost.id).set(normalizedPost);
         await syncProductIndexForPost(normalizedPost);
         res.status(201).json({ status: 'created' });
     } catch (e) {
         console.error(e);
         res.status(500).json({ error: e instanceof Error ? e.message : 'Unknown error' });
     }
  });

  app.delete("/api/posts/:id", adminAuth, async (req, res) => {
      try {
          await db.collection('posts').doc(req.params.id).delete();
          await deleteProductIndexForPost(req.params.id);
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
    const requestedPlatform = String(platform || 'AliExpress');

    try {
        const normalizedKeyword = String(keyword).trim().toLowerCase();
        const cacheKey = `${requestedPlatform}::${normalizedKeyword}`;
        const now = Date.now();
        const cacheRef = db.collection('productSearchCache').doc(getProductSearchCacheDocId(cacheKey));
        const cacheDoc = await cacheRef.get();
        const cachedData = cacheDoc.exists ? cacheDoc.data() : null;
        const firestoreExpiresAt = cachedData?.expiresAt?.toMillis?.() || 0;
        const cachedProducts = cachedData?.data || cachedData?.results;
        if (cachedProducts && firestoreExpiresAt > now) {
          return res.json(cachedProducts);
        }

        let results = [];
        if (requestedPlatform === 'AliExpress') {
            results = await aliExpressProvider.search(keyword as string);
        }

        const sanitizedResults = JSON.parse(JSON.stringify(results));
        const expiresAt = now + PRODUCT_CACHE_MS;
        await cacheRef.set({
          cacheKey,
          keyword: String(keyword),
          normalizedKeyword,
          platform: requestedPlatform,
          data: sanitizedResults,
          expiresAt: admin.firestore.Timestamp.fromMillis(expiresAt),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json(sanitizedResults);
    } catch (e) {
        console.error(e);
        res.json([]);
    }
  });

  app.post("/api/product-index/rebuild", adminAuth, async (req, res) => {
    try {
      const snapshot = await db.collection('posts').get();
      for (const doc of snapshot.docs) {
        await syncProductIndexForPost({ id: doc.id, ...doc.data() });
      }

      res.json({ status: 'rebuilt', indexedPosts: snapshot.size });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to rebuild product index' });
    }
  });

  app.post("/api/clicks", async (req, res) => {
    const { postId, productId, platform, affiliateLink, referrer, userAgent } = req.body || {};
    if (!postId || !productId || !platform || !affiliateLink) {
      return res.status(400).json({ error: 'postId, productId, platform, affiliateLink are required' });
    }

    try {
      await recordClickAndUpdateProductStats({
        postId,
        productId,
        platform,
        affiliateLink,
        referrer: referrer || null,
        userAgent: userAgent || req.get('user-agent') || null
      });
      res.status(201).json({ status: 'recorded' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to record click' });
    }
  });

  app.get("/go/:productId", async (req, res) => {
    const { productId } = req.params;

    try {
      const productIndexDoc = await db.collection('productIndex').doc(getProductIndexDocId(productId)).get();
      if (!productIndexDoc.exists) {
        return res.status(404).send('Product not found');
      }

      const product = productIndexDoc.data() as ProductIndexDocument;
      if (!product.affiliateLink) {
        return res.status(404).send('Product link not found');
      }

      await recordClickAndUpdateProductStats({
        postId: product.postId,
        productId: product.productId,
        platform: product.platform,
        affiliateLink: product.affiliateLink,
        referrer: req.get('referer') || null,
        userAgent: req.get('user-agent') || null
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
