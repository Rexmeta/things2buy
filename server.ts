import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as admin from 'firebase-admin';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});
const db = admin.firestore();
db.settings({ databaseId: firebaseConfig.firestoreDatabaseId });

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
