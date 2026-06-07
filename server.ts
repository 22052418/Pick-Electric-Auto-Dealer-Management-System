import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase integration
const configPath = path.resolve(__dirname, "firebase-applet-config.json");
let db: any = null;
if (fs.existsSync(configPath)) {
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // APIs
  app.get("/api/vehicles", async (req, res) => {
    if (!db) return res.status(500).json({ error: "DB not initialized" });
    try {
      const snapshot = await getDocs(collection(db, "vehicles"));
      const vehicles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(vehicles);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/vehicles", async (req, res) => {
    if (!db) return res.status(500).json({ error: "DB not initialized" });
    try {
      const docRef = await addDoc(collection(db, "vehicles"), req.body);
      res.json({ id: docRef.id, ...req.body });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/vehicles/:id", async (req, res) => {
    if (!db) return res.status(500).json({ error: "DB not initialized" });
    try {
      await updateDoc(doc(db, "vehicles", req.params.id), req.body);
      res.json({ id: req.params.id, ...req.body });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/vehicles/:id", async (req, res) => {
    if (!db) return res.status(500).json({ error: "DB not initialized" });
    try {
      await deleteDoc(doc(db, "vehicles", req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Sales
  app.get("/api/sales", async (req, res) => {
    if (!db) return res.status(500).json({ error: "DB not initialized" });
    try {
      const snapshot = await getDocs(collection(db, "sales"));
      const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(sales);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/sales", async (req, res) => {
    if (!db) return res.status(500).json({ error: "DB not initialized" });
    try {
      const docRef = await addDoc(collection(db, "sales"), req.body);
      res.json({ id: docRef.id, ...req.body });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Inventory
  app.get("/api/inventory", async (req, res) => {
    if (!db) return res.status(500).json({ error: "DB not initialized" });
    try {
      const snapshot = await getDocs(collection(db, "inventory"));
      const inventory = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(inventory);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/inventory", async (req, res) => {
    if (!db) return res.status(500).json({ error: "DB not initialized" });
    try {
      const docRef = await addDoc(collection(db, "inventory"), req.body);
      res.json({ id: docRef.id, ...req.body });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/inventory/:id", async (req, res) => {
    if (!db) return res.status(500).json({ error: "DB not initialized" });
    try {
      await updateDoc(doc(db, "inventory", req.params.id), req.body);
      res.json({ id: req.params.id, ...req.body });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
