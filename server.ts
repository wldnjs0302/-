import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import AdmZip from "adm-zip";

// Global error handlers to capture startup crashes in Cloud Run logs
process.on("uncaughtException", (err) => {
  console.error("[Fatal] Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Fatal] Unhandled Rejection at:", promise, "reason:", reason);
});

import { findPredefinedUser, getGlobalImageConfig, rawChoiJiwonSheet, rawLeeYoonSeopSheet, rawGwangeoSheet, rawGahunSheet, rawJikhyeokSheet, rawPyeonganSheet } from "./src/data/userMapping";
import globalImageMap from "./src/data/globalImageMap.json";
import rawChoiJiwonAnalyzed from "./src/data/choijiwon_analyzed.json";
import rawGwangeoAnalyzed from "./src/data/gwangeo_analyzed.json";
import rawLeeYoonSeopAnalyzed from "./src/data/leeyoonseop_analyzed.json";
import {
  imgData,
  normalizeTrait,
  getImgNumFromId,
  isCustomImage,
  getImageSpecificExplanation,
  getPredefinedImageInfo
} from "./src/data/fallbackAnalysis";

dotenv.config();

// Initialize Firebase SDK for persistent cloud Firestore
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDocs, collection, deleteDoc, getDocFromServer, setLogLevel } from "firebase/firestore";

// Robust environment detection: Force production if running from bundled dist
if (!process.env.NODE_ENV) {
  if (typeof __filename !== "undefined" && (__filename.includes("server.cjs") || __filename.includes("dist"))) {
    process.env.NODE_ENV = "production";
  }
}
console.log(`[Startup] Initial NODE_ENV: ${process.env.NODE_ENV}`);

let firebaseApp: any = null;
let db: any = null;

function getDb() {
  if (db) return db;
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (!fs.existsSync(configPath)) {
      console.warn("[Firebase] Warning: firebase-applet-config.json not found. Using local fallback.");
      return null;
    }
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (!firebaseApp) {
      firebaseApp = initializeApp(firebaseConfig);
      setLogLevel("error");
    }
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    return db;
  } catch (err) {
    console.error("[Firebase] Initialization error:", err);
    return null;
  }
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testFirebaseConnection() {
  try {
    const firestoreDb = getDb();
    if (firestoreDb) {
      await getDocFromServer(doc(firestoreDb, "test", "connection"));
      console.log("[Firebase] Firestore connection test successful.");
    } else {
      console.log("[Firebase] Firestore config not available on startup.");
    }
  } catch (error) {
    console.log("[Firebase] Firestore offline or pending initial schema validation.");
  }
}
// Non-blocking test initialized during startServer()

function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item));
  }
  if (typeof obj === 'object') {
    const clean: any = {};
    for (const key of Object.keys(obj)) {
      if (obj[key] !== undefined) {
        clean[key] = sanitizeForFirestore(obj[key]);
      } else {
        clean[key] = null;
      }
    }
    return clean;
  }
  return obj;
}

// Simple in-memory cache for /api/user-images to optimize disk I/O and latency
interface CacheEntry {
  timestamp: number;
  data: {
    success: boolean;
    isCustom: boolean;
    images: any[];
  };
}
const userImagesCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 25000; // 25 seconds of in-memory cache to reduce redundant disk reads on navigation


function getLiveImageConfig(num: number): { trait: string; weights?: Record<string, number> } {
  try {
    const key = String(num);
    const cfg = (globalImageMap as any)[key];
    if (cfg) {
      if (typeof cfg === "string") {
        return { trait: cfg };
      }
      return {
        trait: cfg.trait || "형태",
        weights: cfg.weights
      };
    }
  } catch (err) {
    console.error("Error in getLiveImageConfig helper:", err);
  }
  return getGlobalImageConfig(num);
}

let aiInstance: any = null;
function getAi() {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required but missing.");
    }
    aiInstance = new GoogleGenAI({ 
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

async function generateContentWithRetry(params: any, retries = 3, delayMs = 1500): Promise<any> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await getAi().models.generateContent(params);
    } catch (err: any) {
      lastError = err;
      const errMsg = String(err?.message || err || "");
      const isHardQuota = errMsg.includes("current quota") || errMsg.includes("plan and billing") || errMsg.includes("GenerateRequestsPerDay") || errMsg.includes("billing details");
      const status = err?.status || err?.code || (err?.message && err.message.includes("503") ? 503 : 0);
      const isTransient = status === 503 || status === 429 || (err?.message && (err.message.includes("high demand") || err.message.includes("overloaded") || err.message.includes("UNAVAILABLE")));
      
      if (isTransient && !isHardQuota && i < retries - 1) {
        console.log(`[Gemini Retry] Received transient error (${errMsg}). Retrying in ${delayMs}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      } else {
        if (isHardQuota) {
          console.warn(`[Gemini Retry] Hard quota limit detected: ${errMsg}. Bypassing retries to fall back instantly.`);
        }
        throw err;
      }
    }
  }
  throw lastError;
}

const activeExtractions: { [key: string]: Promise<void> | null } = {
  choijiwon: null,
  gwangeoreulchajaseo: null,
  leeyoonseop: null,
  parkgahun: null,
  jeonjinhyeok: null,
  jeongpyeongan: null,
};

// 1. Refined environment detection for AI Studio and Cloud Run
const kService = process.env.K_SERVICE || "";
const isAisDev = kService.includes("-dev-");
const isAisPre = kService.includes("-pre-");
// AI Studio Dev/Shared Preview is determined by DEFAULT_APP_PORT or K_SERVICE contains '-dev-' or '-pre-'
const isStudioWorkspace = isAisDev || isAisPre || !!process.env.DEFAULT_APP_PORT;

// Is running in a deployed Cloud Run container (either Dev, Shared or Production)
const isCloudRun = !!kService;

// Real production is when it's K_SERVICE but NOT a studio workspace
const isRealProduction = !!(kService && !isStudioWorkspace);

// We run in production mode if we are in real production OR in the Shared Preview (pre) container
const isProdRun = isRealProduction || isAisPre;

if (isProdRun) {
  process.env.NODE_ENV = "production";
}

// EROFS Protection: Cloud Run requires /tmp for any write operations
const WRITABLE_DIR = isCloudRun ? '/tmp/app-assets' : process.cwd();

// Ensure writable directory exists as early as possible
if (isCloudRun && !fs.existsSync(WRITABLE_DIR)) {
  try {
    fs.mkdirSync(WRITABLE_DIR, { recursive: true });
    console.log(`[Startup] Created WRITABLE_DIR: ${WRITABLE_DIR}`);
  } catch (err) {
    console.error(`[Startup] Failed to create WRITABLE_DIR: ${WRITABLE_DIR}`, err);
  }
}

async function ensureChoiJiwonImages() {
  const publicDir = path.join(process.cwd(), 'public', 'choijiwon');
  const distDir = path.join(process.cwd(), 'dist', 'choijiwon');
  const tmpDir = path.join(WRITABLE_DIR, 'choijiwon');

  const checkDirHasImages = (dir: string): boolean => {
    try {
      if (!fs.existsSync(dir)) return false;
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
      return files.length >= 48;
    } catch (e) {
      return false;
    }
  };

  if (checkDirHasImages(tmpDir) || checkDirHasImages(publicDir) || checkDirHasImages(distDir)) {
    console.log("Choi Jiwon images are already available in one of the search paths.");
    return;
  }

  if (activeExtractions.choijiwon) {
    console.log("Choi Jiwon extraction already in progress. Waiting for it to complete...");
    return activeExtractions.choijiwon;
  }

  activeExtractions.choijiwon = (async () => {
    console.log("Choi Jiwon images missing or incomplete. Automatically restoring from secure Google Drive backup...");
    const fileId = "1_w2iCD6LRbV-ETTltCsJbjv-8btstcuk";
    const url = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (buffer.length < 5000) {
        console.log("Failed download from drive (returned HTML error page or short response).");
        return;
      }

      const zip = new AdmZip(buffer);
      const entries = zip.getEntries();

      // Extract to public, dist and base writable directories
      const dirsToExtract = [tmpDir];
      if (!isCloudRun) {
        dirsToExtract.push(publicDir);
        if (fs.existsSync(path.join(process.cwd(), 'dist'))) {
          dirsToExtract.push(distDir);
        }
      }

      for (const targetDir of dirsToExtract) {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
      }

      for (const entry of entries) {
        if (!entry.isDirectory) {
          const tempFileName = entry.entryName.split('/').pop() || '';
          // Skip macOS metadata files
          if (entry.entryName.includes("__MACOSX") || tempFileName.startsWith("._")) {
            continue;
          }
          const match = tempFileName.match(/(\d+)\.png$/i);
          if (match) {
            const num = match[1];
            const fileData = entry.getData();
            for (const targetDir of dirsToExtract) {
              fs.writeFileSync(path.join(targetDir, `${num}.png`), fileData);
            }
          }
        }
      }

      console.log(`Successfully restored Choi Jiwon's 50 images to ${dirsToExtract.join(' and ')}!`);
    } catch (err: any) {
      console.log("Failed to dynamically restore Choi Jiwon's backup images:", err.message || err);
      throw err;
    }
  })();

  try {
    await activeExtractions.choijiwon;
  } finally {
    activeExtractions.choijiwon = null;
  }
}

async function ensureGwangeoImages() {
  const publicDir = path.join(process.cwd(), 'public', 'gwangeoreulchajaseo');
  const distDir = path.join(process.cwd(), 'dist', 'gwangeoreulchajaseo');
  const tmpDir = path.join(WRITABLE_DIR, 'gwangeoreulchajaseo');

  const checkDirHasImages = (dir: string): boolean => {
    try {
      if (!fs.existsSync(dir)) return false;
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
      return files.length >= 48;
    } catch (e) {
      return false;
    }
  };

  if (checkDirHasImages(tmpDir) || checkDirHasImages(publicDir) || checkDirHasImages(distDir)) {
    console.log("Gwangeo images are already available in one of the search paths.");
    return;
  }

  if (activeExtractions.gwangeoreulchajaseo) {
    console.log("Gwangeo extraction already in progress. Waiting for it to complete...");
    return activeExtractions.gwangeoreulchajaseo;
  }

  activeExtractions.gwangeoreulchajaseo = (async () => {
    console.log("Gwangeo images missing or incomplete. Automatically restoring from secure Google Drive backup...");
    const fileId = "19Oh0JmF1gn1SyiQmmxFNxVddN4TCVAaF";
    const url = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (buffer.length < 5000) {
        console.log("Failed download from drive (returned HTML error page or short response).");
        return;
      }

      const zip = new AdmZip(buffer);
      const entries = zip.getEntries();

      // Extract to public, dist and base writable directories
      const dirsToExtract = [tmpDir];
      if (!isCloudRun) {
        dirsToExtract.push(publicDir);
        if (fs.existsSync(path.join(process.cwd(), 'dist'))) {
          dirsToExtract.push(distDir);
        }
      }

      for (const targetDir of dirsToExtract) {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
      }

      for (const entry of entries) {
        if (!entry.isDirectory) {
          const tempFileName = entry.entryName.split('/').pop() || '';
          // Skip macOS metadata files
          if (entry.entryName.includes("__MACOSX") || tempFileName.startsWith("._")) {
            continue;
          }
          const match = tempFileName.match(/(\d+)\.png$/i);
          if (match) {
            const num = match[1];
            const fileData = entry.getData();
            for (const targetDir of dirsToExtract) {
              fs.writeFileSync(path.join(targetDir, `${num}.png`), fileData);
            }
          }
        }
      }

      console.log(`Successfully restored Gwangeo's 50 images to ${dirsToExtract.join(' and ')}!`);
    } catch (err: any) {
      console.log("Failed to dynamically restore Gwangeo's backup images:", err.message || err);
      throw err;
    }
  })();

  try {
    await activeExtractions.gwangeoreulchajaseo;
  } finally {
    activeExtractions.gwangeoreulchajaseo = null;
  }
}

async function ensureLeeYoonSeopImages() {
  const publicDir = path.join(process.cwd(), 'public', 'leeyoonseop');
  const distDir = path.join(process.cwd(), 'dist', 'leeyoonseop');
  const tmpDir = path.join(WRITABLE_DIR, 'leeyoonseop');

  const checkDirHasImages = (dir: string): boolean => {
    try {
      if (!fs.existsSync(dir)) return false;
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
      return files.length >= 48;
    } catch (e) {
      return false;
    }
  };

  if (checkDirHasImages(tmpDir) || checkDirHasImages(publicDir) || checkDirHasImages(distDir)) {
    console.log("Lee Yoonseop images are already available in one of the search paths.");
    return;
  }

  if (activeExtractions.leeyoonseop) {
    console.log("Lee Yoonseop extraction already in progress. Waiting for it to complete...");
    return activeExtractions.leeyoonseop;
  }

  activeExtractions.leeyoonseop = (async () => {
    console.log("Lee Yoonseop images missing or incomplete. Automatically restoring from secure Google Drive backup...");
    const fileId = "1NU7Nt27Q-Y96V0U9gQzw4VJaIdqXF33d";
    const url = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (buffer.length < 5000) {
        console.log("Failed download from drive (returned HTML error page or short response).");
        return;
      }

      const zip = new AdmZip(buffer);
      const entries = zip.getEntries();

      // Extract to public, dist and base writable directories
      const dirsToExtract = [tmpDir];
      if (!isCloudRun) {
        dirsToExtract.push(publicDir);
        if (fs.existsSync(path.join(process.cwd(), 'dist'))) {
          dirsToExtract.push(distDir);
        }
      }

      for (const targetDir of dirsToExtract) {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
      }

      for (const entry of entries) {
        if (!entry.isDirectory) {
          const tempFileName = entry.entryName.split('/').pop() || '';
          // Skip macOS metadata files
          if (entry.entryName.includes("__MACOSX") || tempFileName.startsWith("._")) {
            continue;
          }
          const match = tempFileName.match(/(\d+)\.png$/i);
          if (match) {
            const num = match[1];
            const fileData = entry.getData();
            for (const targetDir of dirsToExtract) {
              fs.writeFileSync(path.join(targetDir, `${num}.png`), fileData);
            }
          }
        }
      }

      console.log(`Successfully restored Lee Yoonseop's 50 images to ${dirsToExtract.join(' and ')}!`);
    } catch (err: any) {
      console.log("Failed to dynamically restore Lee Yoonseop's backup images:", err.message || err);
      throw err;
    }
  })();

  try {
    await activeExtractions.leeyoonseop;
  } finally {
    activeExtractions.leeyoonseop = null;
  }
}

async function ensureParkGahunImages() {
  const publicDir = path.join(process.cwd(), 'public', 'parkgahun');
  const distDir = path.join(process.cwd(), 'dist', 'parkgahun');
  const tmpDir = path.join(WRITABLE_DIR, 'parkgahun');

  const checkDirHasImages = (dir: string): boolean => {
    try {
      if (!fs.existsSync(dir)) return false;
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
      return files.length >= 48;
    } catch (e) {
      return false;
    }
  };

  if (checkDirHasImages(tmpDir) || checkDirHasImages(publicDir) || checkDirHasImages(distDir)) {
    console.log("Park Gahun images are already available in one of the search paths.");
    return;
  }

  if (activeExtractions.parkgahun) {
    console.log("Park Gahun extraction already in progress. Waiting for it to complete...");
    return activeExtractions.parkgahun;
  }

  activeExtractions.parkgahun = (async () => {
    console.log("Park Gahun images missing or incomplete. Automatically restoring from secure Google Drive backup...");
    const fileId = "1gn_yeBC8Y3Y4AZHTODZvaJxaEcRUjPUd";
    const url = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (buffer.length < 5000) {
        console.log("Failed download from drive (returned HTML error page or short response).");
        return;
      }

      const zip = new AdmZip(buffer);
      const entries = zip.getEntries();

      const dirsToExtract = [tmpDir];
      if (!isCloudRun) {
        dirsToExtract.push(publicDir);
        if (fs.existsSync(path.join(process.cwd(), 'dist'))) {
          dirsToExtract.push(distDir);
        }
      }

      for (const targetDir of dirsToExtract) {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
      }

      for (const entry of entries) {
        if (!entry.isDirectory) {
          const tempFileName = entry.entryName.split('/').pop() || '';
          if (entry.entryName.includes("__MACOSX") || tempFileName.startsWith("._")) {
            continue;
          }
          const match = tempFileName.match(/(\d+)\.png$/i);
          if (match) {
            const num = match[1];
            const fileData = entry.getData();
            for (const targetDir of dirsToExtract) {
              fs.writeFileSync(path.join(targetDir, `${num}.png`), fileData);
            }
          }
        }
      }

      console.log(`Successfully restored Park Gahun's 50 images to ${dirsToExtract.join(' and ')}!`);
    } catch (err: any) {
      console.log("Failed to dynamically restore Park Gahun's backup images:", err.message || err);
      throw err;
    }
  })();

  try {
    await activeExtractions.parkgahun;
  } finally {
    activeExtractions.parkgahun = null;
  }
}

async function ensureJeonJinhyeokImages() {
  const publicDir = path.join(process.cwd(), 'public', 'jeonjinhyeok');
  const distDir = path.join(process.cwd(), 'dist', 'jeonjinhyeok');
  const tmpDir = path.join(WRITABLE_DIR, 'jeonjinhyeok');

  const checkDirHasImages = (dir: string): boolean => {
    try {
      if (!fs.existsSync(dir)) return false;
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
      return files.length >= 48;
    } catch (e) {
      return false;
    }
  };

  if (checkDirHasImages(tmpDir) || checkDirHasImages(publicDir) || checkDirHasImages(distDir)) {
    console.log("Jeon Jinhyeok images are already available in one of the search paths.");
    return;
  }

  if (activeExtractions.jeonjinhyeok) {
    console.log("Jeon Jinhyeok extraction already in progress. Waiting for it to complete...");
    return activeExtractions.jeonjinhyeok;
  }

  activeExtractions.jeonjinhyeok = (async () => {
    console.log("Jeon Jinhyeok images missing or incomplete. Automatically restoring from secure Google Drive backup...");
    const fileId = "12UMRpLTRtbkibhALEyRhaEWxeTBYG7hg";
    const url = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (buffer.length < 5000) {
        console.log("Failed download from drive (returned HTML error page or short response).");
        return;
      }

      const zip = new AdmZip(buffer);
      const entries = zip.getEntries();

      const dirsToExtract = [tmpDir];
      if (!isCloudRun) {
        dirsToExtract.push(publicDir);
        if (fs.existsSync(path.join(process.cwd(), 'dist'))) {
          dirsToExtract.push(distDir);
        }
      }

      for (const targetDir of dirsToExtract) {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
      }

      for (const entry of entries) {
        if (!entry.isDirectory) {
          const tempFileName = entry.entryName.split('/').pop() || '';
          if (entry.entryName.includes("__MACOSX") || tempFileName.startsWith("._")) {
            continue;
          }
          const match = tempFileName.match(/(\d+)\.png$/i);
          if (match) {
            const num = match[1];
            const fileData = entry.getData();
            for (const targetDir of dirsToExtract) {
              fs.writeFileSync(path.join(targetDir, `${num}.png`), fileData);
            }
          }
        }
      }

      console.log(`Successfully restored Jeon Jinhyeok's 50 images to ${dirsToExtract.join(' and ')}!`);
    } catch (err: any) {
      console.log("Failed to dynamically restore Jeon Jinhyeok's backup images:", err.message || err);
      throw err;
    }
  })();

  try {
    await activeExtractions.jeonjinhyeok;
  } finally {
    activeExtractions.jeonjinhyeok = null;
  }
}

async function ensureJeongPyeonganImages() {
  const publicDir = path.join(process.cwd(), 'public', 'jeongpyeongan');
  const distDir = path.join(process.cwd(), 'dist', 'jeongpyeongan');
  const tmpDir = path.join(WRITABLE_DIR, 'jeongpyeongan');

  const checkDirHasImages = (dir: string): boolean => {
    try {
      if (!fs.existsSync(dir)) return false;
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
      return files.length >= 48;
    } catch (e) {
      return false;
    }
  };

  if (checkDirHasImages(tmpDir) || checkDirHasImages(publicDir) || checkDirHasImages(distDir)) {
    console.log("Jeong Pyeongan images are already available in one of the search paths.");
    return;
  }

  if (activeExtractions.jeongpyeongan) {
    console.log("Jeong Pyeongan extraction already in progress. Waiting for it to complete...");
    return activeExtractions.jeongpyeongan;
  }

  activeExtractions.jeongpyeongan = (async () => {
    console.log("Jeong Pyeongan images missing or incomplete. Automatically restoring from secure Google Drive backup...");
    const fileId = "1hdkBAyjpbCv6lJkQbXNdM1BYK2M2x_lZ";
    const url = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (buffer.length < 5000) {
        console.log("Failed download from drive (returned HTML error page or short response).");
        return;
      }

      const zip = new AdmZip(buffer);
      const entries = zip.getEntries();

      const dirsToExtract = [tmpDir];
      if (!isCloudRun) {
        dirsToExtract.push(publicDir);
        if (fs.existsSync(path.join(process.cwd(), 'dist'))) {
          dirsToExtract.push(distDir);
        }
      }

      for (const targetDir of dirsToExtract) {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
      }

      for (const entry of entries) {
        if (!entry.isDirectory) {
          const tempFileName = entry.entryName.split('/').pop() || '';
          if (entry.entryName.includes("__MACOSX") || tempFileName.startsWith("._")) {
            continue;
          }
          const match = tempFileName.match(/(\d+)\.png$/i);
          if (match) {
            const num = match[1];
            const fileData = entry.getData();
            for (const targetDir of dirsToExtract) {
              fs.writeFileSync(path.join(targetDir, `${num}.png`), fileData);
            }
          }
        }
      }

      console.log(`Successfully restored Jeong Pyeongan's 50 images to ${dirsToExtract.join(' and ')}!`);
    } catch (err: any) {
      console.log("Failed to dynamically restore Jeong Pyeongan's backup images:", err.message || err);
      throw err;
    }
  })();

  try {
    await activeExtractions.jeongpyeongan;
  } finally {
    activeExtractions.jeongpyeongan = null;
  }
}

async function startServer() {
  const app = express();
  
  // 2. Port assignment logic: Respect process.env.PORT if specified (crucial for Cloud Run and workspace verification), otherwise fallback to the standard port 3000
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

  console.log(`[Startup] Mode: ${isRealProduction ? 'Production (Cloud Run)' : 'Development/Shared'} (isStudioWorkspace=${isStudioWorkspace})`);
  console.log(`[Startup] Port: ${PORT} (from PORT_ENV=${process.env.PORT})`);
  console.log(`[Startup] Writable Storage: ${WRITABLE_DIR}`);
  console.log(`[Startup] Writable Dir: ${WRITABLE_DIR}`);

  app.use(express.json({ limit: '10mb' }));
  app.get("/api/health", (req, res) => { res.json({ status: "ok" }); });

  // CORS headers integration to ensure smooth cross-origin asset downloads in iframe sandboxes
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
  });

  // On-demand static image loader and extractor
  // Define static asset search paths including the writable temporary directory
  const handleOnDemandAsset = async (folder: string, filename: string, res: any, next: any) => {
    const publicPath = path.join(process.cwd(), 'public', folder, filename);
    const distPath = path.join(process.cwd(), 'dist', folder, filename);
    const tmpPath = path.join(WRITABLE_DIR, folder, filename);
    
    let chosenPath = null;
    if (fs.existsSync(tmpPath)) {
      chosenPath = tmpPath;
    } else if (fs.existsSync(publicPath)) {
      chosenPath = publicPath;
    } else if (fs.existsSync(distPath)) {
      chosenPath = distPath;
    }

    if (chosenPath) {
      return res.sendFile(chosenPath);
    }

    console.log(`On-demand asset request: /${folder}/${filename} not found. Triggering download/extraction...`);
    try {
      if (folder === 'choijiwon') {
        await ensureChoiJiwonImages();
      } else if (folder === 'gwangeoreulchajaseo') {
        await ensureGwangeoImages();
      } else if (folder === 'leeyoonseop') {
        await ensureLeeYoonSeopImages();
      } else if (folder === 'parkgahun') {
        await ensureParkGahunImages();
      } else if (folder === 'jeonjinhyeok') {
        await ensureJeonJinhyeokImages();
      } else if (folder === 'jeongpyeongan') {
        await ensureJeongPyeonganImages();
      }
      
      const newChosenPath = fs.existsSync(tmpPath) ? tmpPath : (fs.existsSync(publicPath) ? publicPath : (fs.existsSync(distPath) ? distPath : null));
      if (newChosenPath) {
        return res.sendFile(newChosenPath);
      }
    } catch (err) {
      console.error(`Failed to retrieve asset on-demand for /${folder}/${filename}:`, err);
    }
    next();
  };

  app.get('/choijiwon/:filename', (req, res, next) => {
    handleOnDemandAsset('choijiwon', req.params.filename, res, next);
  });
  app.get('/gwangeoreulchajaseo/:filename', (req, res, next) => {
    handleOnDemandAsset('gwangeoreulchajaseo', req.params.filename, res, next);
  });
  app.get('/leeyoonseop/:filename', (req, res, next) => {
    handleOnDemandAsset('leeyoonseop', req.params.filename, res, next);
  });
  app.get('/parkgahun/:filename', (req, res, next) => {
    handleOnDemandAsset('parkgahun', req.params.filename, res, next);
  });
  app.get('/jeonjinhyeok/:filename', (req, res, next) => {
    handleOnDemandAsset('jeonjinhyeok', req.params.filename, res, next);
  });
  app.get('/jeongpyeongan/:filename', (req, res, next) => {
    handleOnDemandAsset('jeongpyeongan', req.params.filename, res, next);
  });

  // API Route to serve the live global image map dynamically from bundled data
  app.get("/api/global-image-map", (req, res) => {
    try {
      return res.json(globalImageMap);
    } catch (err) {
      console.error("Error serving /api/global-image-map:", err);
      res.status(500).json({ error: "Server error reading image map" });
    }
  });

  // API Route to detect and serve images for any user dynamically
  app.get("/api/user-images", async (req, res) => {
    const name = (req.query.name as string || "").trim();
    console.log("Request for images for user:", name);
    if (!name) {
      return res.status(400).json({ error: "Name parameter is required" });
    }

    // Check Memory Cache to prevent heavy disk reads on rapid screen navigation
    const cached = userImagesCache.get(name);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      console.log(`[Cache Hit] Serving images for user "${name}" from Memory Cache`);
      return res.json(cached.data);
    }

    const nfcName = name.normalize("NFC");
    const nfdName = name.normalize("NFD");
    const lowercaseName = name.toLowerCase();

    const predefinedUser = findPredefinedUser(name);
    if (predefinedUser) {
      const folder = predefinedUser.folderName;
      try {
        if (folder === 'choijiwon') {
          await ensureChoiJiwonImages();
        } else if (folder === 'gwangeoreulchajaseo') {
          await ensureGwangeoImages();
        } else if (folder === 'leeyoonseop') {
          await ensureLeeYoonSeopImages();
        } else if (folder === 'parkgahun') {
          await ensureParkGahunImages();
        } else if (folder === 'jeonjinhyeok') {
          await ensureJeonJinhyeokImages();
        } else if (folder === 'jeongpyeongan') {
          await ensureJeongPyeonganImages();
        }
      } catch (err) {
        console.error(`Failed to ensure images for ${folder} on API request:`, err);
      }
    }
    console.log("Predefined User Check:", predefinedUser);
    console.log("Public directory contents:", fs.readdirSync(path.join(process.cwd(), "public")));

    const searchDirs = [
      path.join(process.cwd(), "public"),
      path.join(process.cwd(), "dist"),
      WRITABLE_DIR
    ];

    let matchedDir: string | null = null;
    let folderBaseName: string | null = null;

    if (predefinedUser) {
      const candPath = path.join(process.cwd(), "public", predefinedUser.folderName);
      if (fs.existsSync(candPath) && fs.statSync(candPath).isDirectory()) {
        matchedDir = candPath;
        folderBaseName = predefinedUser.folderName;
        console.log("Found matchedDir directly:", matchedDir);
      } else {
        console.log("Could not find matchedDir directly:", candPath);
      }
    }

    if (!matchedDir) {
      for (const baseDir of searchDirs) {
        if (!fs.existsSync(baseDir)) continue;
        try {
          const items = fs.readdirSync(baseDir);
          for (const item of items) {
            const itemPath = path.join(baseDir, item);
            if (!fs.statSync(itemPath).isDirectory()) continue;

            const normalizedItem = item.normalize("NFC");
            const isTargetPredef = predefinedUser && (normalizedItem === predefinedUser.folderName || normalizedItem === predefinedUser.name);
            
            if (
              normalizedItem === nfcName ||
              normalizedItem.normalize("NFD") === nfdName ||
              normalizedItem.toLowerCase() === lowercaseName ||
              isTargetPredef
            ) {
              matchedDir = itemPath;
              folderBaseName = item;
              break;
            }
          }
        } catch (e) {
          console.error("Error searching custom directories:", e);
        }
        if (matchedDir) break;
      }
    }

    if (matchedDir && folderBaseName) {
      try {
        let customWeights: Record<string, { trait?: string; weights?: Record<string, number> }> = {};
        const weightsJsonPath = path.join(matchedDir, "weights.json");
        if (fs.existsSync(weightsJsonPath)) {
          try {
            const data = fs.readFileSync(weightsJsonPath, "utf-8");
            customWeights = JSON.parse(data);
            console.log(`Successfully loaded custom weights.json for ${folderBaseName} from disk.`);
          } catch (e) {
            console.error("Error reading custom weights.json:", e);
          }
        }

        const files = fs.readdirSync(matchedDir)
          .filter(f => {
            const low = f.toLowerCase();
            return low.endsWith(".png") || low.endsWith(".jpg") || low.endsWith(".jpeg");
          })
          .sort((a, b) => {
            const numA = parseInt(a);
            const numB = parseInt(b);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            return a.localeCompare(b);
          });

        if (files.length > 0) {
          console.log(`Found matching dynamic image directory: "${folderBaseName}" on disk. Serving ${files.length} images.`);
          const traits = ["대상", "의미", "감각", "직관", "질감", "선명", "색감", "방법론", "취향", "형태"];
          
          const itemsCount = 50; 
          const images = Array.from({ length: itemsCount }).map((_, i) => {
            const fileIndex = i % files.length;
            const fileName = files[fileIndex];
            const imageNumber = i + 1;

            const baseProperties = {
              color: "#000000",
              intuition: 30 + (imageNumber * 13) % 46,
              aesthetics: 30 + (imageNumber * 17) % 46,
              rationality: 30 + (imageNumber * 19) % 46,
            };

            const globalCfg = getLiveImageConfig(imageNumber);
            let activeTrait = globalCfg.trait;
            const categoryWeights: Record<string, number> = {};

            const normName = name.normalize("NFC").trim();
            const normNameNFD = name.normalize("NFD").trim();
            const isChoiJiwonName = (predefinedUser && predefinedUser.folderName === "choijiwon") || normName === "최지원" || normNameNFD === "최지원".normalize("NFD") || normName.toLowerCase() === "choijiwon" || normName.toLowerCase() === "choi jiwon" || normName.replace(/\s+/g, "") === "최지원";
            const isLeeYoonSeopName = (predefinedUser && predefinedUser.folderName === "leeyoonseop") || normName === "이윤섭" || normNameNFD === "이윤섭".normalize("NFD") || normName.toLowerCase() === "leeyoonseop" || normName.toLowerCase() === "lee yoonseop" || normName.replace(/\s+/g, "") === "이윤섭" || normName === "이윤서" || normNameNFD === "이윤서".normalize("NFD") || normName.toLowerCase() === "leeyoonseo" || normName.replace(/\s+/g, "") === "이윤서";
            const isGwangeoName = (predefinedUser && predefinedUser.folderName === "gwangeoreulchajaseo") || normName === "광어를 찾아서" || normNameNFD === "광어를 찾아서".normalize("NFD") || normName.toLowerCase() === "gwangeoreulchajaseo" || normName.toLowerCase() === "gwangeo" || normName.replace(/\s+/g, "") === "광어를찾아서";
            const isGahunName = (predefinedUser && predefinedUser.folderName === "parkgahun") || normName === "박가현" || normNameNFD === "박가현".normalize("NFD") || normName.toLowerCase() === "parkgahun" || normName.replace(/\s+/g, "") === "박가현";
            const isJikhyeokName = (predefinedUser && predefinedUser.folderName === "jeonjinhyeok") || normName === "전진혁" || normNameNFD === "전진혁".normalize("NFD") || normName.toLowerCase() === "jeonjinhyeok" || normName.replace(/\s+/g, "") === "전진혁";
            const isPyeonganName = (predefinedUser && predefinedUser.folderName === "jeongpyeongan") || normName === "정평안" || normNameNFD === "정평안".normalize("NFD") || normName.toLowerCase() === "jeongpyeongan" || normName.replace(/\s+/g, "") === "정평안";

            const isPredefinedName = isChoiJiwonName || isLeeYoonSeopName || isGwangeoName || isGahunName || isJikhyeokName || isPyeonganName;

            if (isChoiJiwonName) {
              const sheetRow = rawChoiJiwonSheet.find((r: any) => r.num === imageNumber);
              if (sheetRow) {
                activeTrait = sheetRow.main;
                traits.forEach(t => {
                  categoryWeights[t] = 10 + (imageNumber * t.charCodeAt(0)) % 16;
                });
                categoryWeights[sheetRow.main] = 95;
                categoryWeights[sheetRow.sub1] = 75;
                categoryWeights[sheetRow.sub2] = 55;
              }
            } else if (isLeeYoonSeopName) {
              const sheetRow = rawLeeYoonSeopSheet.find((r: any) => r.num === imageNumber);
              if (sheetRow) {
                activeTrait = sheetRow.main;
                traits.forEach(t => {
                  categoryWeights[t] = 10 + (imageNumber * t.charCodeAt(0)) % 16;
                });
                categoryWeights[sheetRow.main] = 95;
                categoryWeights[sheetRow.sub1] = 75;
                if (sheetRow.sub2) {
                  categoryWeights[sheetRow.sub2] = 55;
                }
              }
            } else if (isGwangeoName) {
              const sheetRow = rawGwangeoSheet.find((r: any) => r.num === imageNumber);
              if (sheetRow) {
                activeTrait = sheetRow.main;
                traits.forEach(t => {
                  categoryWeights[t] = 10 + (imageNumber * t.charCodeAt(0)) % 16;
                });
                categoryWeights[sheetRow.main] = 95;
                categoryWeights[sheetRow.sub1] = 75;
                if (sheetRow.sub2) {
                  categoryWeights[sheetRow.sub2] = 55;
                }
              }
            } else if (isGahunName) {
              const sheetRow = rawGahunSheet.find((r: any) => r.num === imageNumber);
              if (sheetRow) {
                activeTrait = sheetRow.main;
                traits.forEach(t => {
                  categoryWeights[t] = 10 + (imageNumber * t.charCodeAt(0)) % 16;
                });
                categoryWeights[sheetRow.main] = 95;
                categoryWeights[sheetRow.sub1] = 75;
                if (sheetRow.sub2) {
                  categoryWeights[sheetRow.sub2] = 55;
                }
              }
            } else if (isJikhyeokName) {
              const sheetRow = rawJikhyeokSheet.find((r: any) => r.num === imageNumber);
              if (sheetRow) {
                activeTrait = sheetRow.main;
                traits.forEach(t => {
                  categoryWeights[t] = 10 + (imageNumber * t.charCodeAt(0)) % 16;
                });
                categoryWeights[sheetRow.main] = 95;
                categoryWeights[sheetRow.sub1] = 75;
                if (sheetRow.sub2) {
                  categoryWeights[sheetRow.sub2] = 55;
                }
              }
            } else if (isPyeonganName) {
              const sheetRow = rawPyeonganSheet.find((r: any) => r.num === imageNumber);
              if (sheetRow) {
                activeTrait = sheetRow.main;
                traits.forEach(t => {
                  categoryWeights[t] = 10 + (imageNumber * t.charCodeAt(0)) % 16;
                });
                categoryWeights[sheetRow.main] = 95;
                categoryWeights[sheetRow.sub1] = 75;
                if (sheetRow.sub2) {
                  categoryWeights[sheetRow.sub2] = 55;
                }
              }
            } else {
              const fileCustom = customWeights[fileName];
              if (fileCustom) {
                if (fileCustom.trait) {
                  activeTrait = fileCustom.trait;
                }
                if (fileCustom.weights) {
                  traits.forEach(t => {
                    if (fileCustom.weights![t] !== undefined) {
                      categoryWeights[t] = fileCustom.weights![t];
                    }
                  });
                }
              } else if (globalCfg.weights) {
                traits.forEach(t => {
                  if (globalCfg.weights![t] !== undefined) {
                    categoryWeights[t] = globalCfg.weights![t];
                  }
                });
              }
            }

            if (Object.keys(categoryWeights).length === 0) {
              categoryWeights[activeTrait] = 85 + (imageNumber * 7) % 15;
              const otherTraits = traits.filter(t => t !== activeTrait);
              const secondTraitIndex = (imageNumber * 3) % otherTraits.length;
              const secondTrait = otherTraits[secondTraitIndex];
              categoryWeights[secondTrait] = 45 + (imageNumber * 11) % 31;

              traits.forEach(t => {
                if (categoryWeights[t] === undefined) {
                  categoryWeights[t] = 10 + (imageNumber * t.charCodeAt(0)) % 16;
                }
              });
            } else if (!isPredefinedName) {
              traits.forEach(t => {
                if (categoryWeights[t] === undefined) {
                  categoryWeights[t] = 5;
                }
              });
            }

            return {
              id: `${name}-img-${imageNumber}`,
              url: `/${encodeURIComponent(folderBaseName!)}/${fileName}`,
              properties: baseProperties,
              categoryWeights,
              description: `${name}님의 시각적 파편입니다.`,
              tags: [name, activeTrait],
              trait: activeTrait
            };
          });

          const responsePayload = { success: true, isCustom: true, images };
          userImagesCache.set(name, { timestamp: Date.now(), data: responsePayload });
          return res.json(responsePayload);
        }
      } catch (err: any) {
        console.error("Error reading matched directory files:", err);
      }
    }

    console.log(`No disk directory matches user "${name}". Serving stable local fallback images.`);
    const fallbackTraits = ["대상", "의미", "감각", "직관", "질감", "선명", "색감", "방법론", "취향", "형태"];

    const images = Array.from({ length: 50 }).map((_, i) => {
      const idx = i + 1;
      const globalCfg = getLiveImageConfig(idx);
      const koreanTrait = globalCfg.trait;
      const categoryWeights: Record<string, number> = {};

      const normName = name.normalize("NFC").trim();
      const normNameNFD = name.normalize("NFD").trim();
      const isChoiJiwonName = (predefinedUser && predefinedUser.folderName === "choijiwon") || normName === "최지원" || normNameNFD === "최지원".normalize("NFD") || normName.toLowerCase() === "choijiwon" || normName.toLowerCase() === "choi jiwon" || normName.replace(/\s+/g, "") === "최지원";
      const isLeeYoonSeopName = (predefinedUser && predefinedUser.folderName === "leeyoonseop") || normName === "이윤섭" || normNameNFD === "이윤섭".normalize("NFD") || normName.toLowerCase() === "leeyoonseop" || normName.toLowerCase() === "lee yoonseop" || normName.replace(/\s+/g, "") === "이윤섭" || normName === "이윤서" || normNameNFD === "이윤서".normalize("NFD") || normName.toLowerCase() === "leeyoonseo" || normName.replace(/\s+/g, "") === "이윤서";
      const isGwangeoName = (predefinedUser && predefinedUser.folderName === "gwangeoreulchajaseo") || normName === "광어를 찾아서" || normNameNFD === "광어를 찾아서".normalize("NFD") || normName.toLowerCase() === "gwangeoreulchajaseo" || normName.toLowerCase() === "gwangeo" || normName.replace(/\s+/g, "") === "광어를찾아서";
      const isGahunName = (predefinedUser && predefinedUser.folderName === "parkgahun") || normName === "박가현" || normNameNFD === "박가현".normalize("NFD") || normName.toLowerCase() === "parkgahun" || normName.replace(/\s+/g, "") === "박가현";
      const isJikhyeokName = (predefinedUser && predefinedUser.folderName === "jeonjinhyeok") || normName === "전진혁" || normNameNFD === "전진혁".normalize("NFD") || normName.toLowerCase() === "jeonjinhyeok" || normName.replace(/\s+/g, "") === "전진혁";
      const isPyeonganName = (predefinedUser && predefinedUser.folderName === "jeongpyeongan") || normName === "정평안" || normNameNFD === "정평안".normalize("NFD") || normName.toLowerCase() === "jeongpyeongan" || normName.replace(/\s+/g, "") === "정평안";

      const isPredefinedName = isChoiJiwonName || isLeeYoonSeopName || isGwangeoName || isGahunName || isJikhyeokName || isPyeonganName;

      const fallbackUrl = isGwangeoName 
        ? `/gwangeoreulchajaseo/${idx}.png` 
        : (isLeeYoonSeopName 
            ? `/leeyoonseop/${idx}.png` 
            : (isGahunName 
                ? `/parkgahun/${idx}.png` 
                : (isJikhyeokName 
                    ? `/jeonjinhyeok/${idx}.png` 
                    : (isPyeonganName 
                        ? `/jeongpyeongan/${idx}.png` 
                        : `/choijiwon/${idx}.png`
                      )
                  )
              )
          );

      let activeTrait = koreanTrait;

      if (isChoiJiwonName) {
        const sheetRow = rawChoiJiwonSheet.find((r: any) => r.num === idx);
        if (sheetRow) {
          activeTrait = sheetRow.main;
          fallbackTraits.forEach(t => {
            categoryWeights[t] = 10 + (idx * t.charCodeAt(0)) % 16;
          });
          categoryWeights[sheetRow.main] = 95;
          categoryWeights[sheetRow.sub1] = 75;
          categoryWeights[sheetRow.sub2] = 55;
        }
      } else if (isLeeYoonSeopName) {
        const sheetRow = rawLeeYoonSeopSheet.find((r: any) => r.num === idx);
        if (sheetRow) {
          activeTrait = sheetRow.main;
          fallbackTraits.forEach(t => {
            categoryWeights[t] = 10 + (idx * t.charCodeAt(0)) % 16;
          });
          categoryWeights[sheetRow.main] = 95;
          categoryWeights[sheetRow.sub1] = 75;
          if (sheetRow.sub2) {
            categoryWeights[sheetRow.sub2] = 55;
          }
        }
      } else if (isGwangeoName) {
        const sheetRow = rawGwangeoSheet.find((r: any) => r.num === idx);
        if (sheetRow) {
          activeTrait = sheetRow.main;
          fallbackTraits.forEach(t => {
            categoryWeights[t] = 10 + (idx * t.charCodeAt(0)) % 16;
          });
          categoryWeights[sheetRow.main] = 95;
          categoryWeights[sheetRow.sub1] = 75;
          if (sheetRow.sub2) {
            categoryWeights[sheetRow.sub2] = 55;
          }
        }
      } else if (isGahunName) {
        const sheetRow = rawGahunSheet.find((r: any) => r.num === idx);
        if (sheetRow) {
          activeTrait = sheetRow.main;
          fallbackTraits.forEach(t => {
            categoryWeights[t] = 10 + (idx * t.charCodeAt(0)) % 16;
          });
          categoryWeights[sheetRow.main] = 95;
          categoryWeights[sheetRow.sub1] = 75;
          if (sheetRow.sub2) {
            categoryWeights[sheetRow.sub2] = 55;
          }
        }
      } else if (isJikhyeokName) {
        const sheetRow = rawJikhyeokSheet.find((r: any) => r.num === idx);
        if (sheetRow) {
          activeTrait = sheetRow.main;
          fallbackTraits.forEach(t => {
            categoryWeights[t] = 10 + (idx * t.charCodeAt(0)) % 16;
          });
          categoryWeights[sheetRow.main] = 95;
          categoryWeights[sheetRow.sub1] = 75;
          if (sheetRow.sub2) {
            categoryWeights[sheetRow.sub2] = 55;
          }
        }
      } else if (isPyeonganName) {
        const sheetRow = rawPyeonganSheet.find((r: any) => r.num === idx);
        if (sheetRow) {
          activeTrait = sheetRow.main;
          fallbackTraits.forEach(t => {
            categoryWeights[t] = 10 + (idx * t.charCodeAt(0)) % 16;
          });
          categoryWeights[sheetRow.main] = 95;
          categoryWeights[sheetRow.sub1] = 75;
          if (sheetRow.sub2) {
            categoryWeights[sheetRow.sub2] = 55;
          }
        }
      } else if (globalCfg.weights) {
        fallbackTraits.forEach(t => {
          if (globalCfg.weights![t] !== undefined) {
            categoryWeights[t] = globalCfg.weights![t];
          }
        });
      } else {
        categoryWeights[koreanTrait] = 85 + (idx * 7) % 15;
        const otherTraits = fallbackTraits.filter(t => t !== koreanTrait);
        const secondTraitIndex = (idx * 3) % otherTraits.length;
        const secondTrait = otherTraits[secondTraitIndex];
        categoryWeights[secondTrait] = 45 + (idx * 11) % 31;
      }

      if (!isPredefinedName) {
        fallbackTraits.forEach(t => {
          if (categoryWeights[t] === undefined) {
            categoryWeights[t] = 10 + (idx * t.charCodeAt(0)) % 16;
          }
        });
      }

      const baseProperties = {
        color: "#000000",
        intuition: 30 + (idx * 13) % 46,
        aesthetics: 30 + (idx * 17) % 46,
        rationality: 30 + (idx * 19) % 46,
      };

      return {
        id: `img-placeholder-${idx}`,
        url: fallbackUrl,
        properties: baseProperties,
        categoryWeights,
        description: `이 데이터는 ${name}님의 무의식 속에 잠재된 ${koreanTrait} 성향을 상징하고 반영하는 미학적 시각 지표입니다.`,
        tags: [name, koreanTrait],
        trait: koreanTrait
      };
    });

    const responsePayload = { success: true, isCustom: false, images };
    userImagesCache.set(name, { timestamp: Date.now(), data: responsePayload });
    return res.json(responsePayload);
  });

  // API Route to analyze selected images using Gemini Multimodal or high-fidelity fallback
  app.post("/api/analyze-selected", async (req, res) => {
    const responseData: Record<string, { title: string; desc: string; detail: string }> = {};
    const { images } = req.body;
    if (!Array.isArray(images)) {
      return res.status(400).json({ error: "images array required" });
    }

    const userNameVal = req.body.userName ? String(req.body.userName).trim() : "사용자";

    if (!process.env.GEMINI_API_KEY) {
      console.log("[Warn] GEMINI_API_KEY is not defined. Instantly falling back to high-fidelity offline visual analytics.");
      images.forEach((img: any, idx: number) => {
        if (!responseData[img.id]) {
          const imgNum = getImgNumFromId(img.id, idx);
          responseData[img.id] = getImageSpecificExplanation(imgNum, img.trait, userNameVal, img.id, img.url);
        }
      });
      return res.json({ success: true, analysis: responseData, isFallback: true });
    }

    try {
      const imageInfos: Array<{
        id: string;
        origTitle: string;
        origDesc: string;
        trait: string;
        mimeType: string;
        b64: string;
      }> = [];

      images.forEach((img: any) => {
        if (isCustomImage(img.id, img.url)) {
          let b64 = "";
          let mimeType = "image/png";

          if (img.url && img.url.startsWith("data:")) {
            const parts = img.url.split(",");
            b64 = parts[1];
            const mimeMatch = parts[0].match(/:(.*?);/);
            if (mimeMatch) {
              mimeType = mimeMatch[1];
            }
          } else if (img.url) {
            let decodedPath = decodeURIComponent(img.url);
            if (decodedPath.startsWith("/")) {
              decodedPath = decodedPath.substring(1);
            }
            const fullPathInPublic = path.join(process.cwd(), "public", decodedPath);
            const fullPathInDist = path.join(process.cwd(), "dist", decodedPath);
            let chosenPath = "";
            if (fs.existsSync(fullPathInPublic)) {
              chosenPath = fullPathInPublic;
            } else if (fs.existsSync(fullPathInDist)) {
              chosenPath = fullPathInDist;
            }

            if (chosenPath) {
              try {
                const buffer = fs.readFileSync(chosenPath);
                b64 = buffer.toString("base64");
                if (chosenPath.endsWith(".png")) mimeType = "image/png";
                else if (chosenPath.endsWith(".jpg") || chosenPath.endsWith(".jpeg")) mimeType = "image/jpeg";
              } catch (e) {
                console.error("Failed to read dynamic file for Gemini analysis:", e);
              }
            }
          }

          if (b64) {
            imageInfos.push({
              id: img.id,
              origTitle: img.description || "사용자 맞춤 이미지",
              origDesc: img.description || "사용자 생성 시각 피사체",
              trait: img.trait,
              mimeType,
              b64
            });
          }
        } else {
          const idx = getImgNumFromId(img.id, 0);
          const current = getPredefinedImageInfo(idx, userNameVal);
          let b64 = "";
          let mimeType = "image/png";

          if (img.url) {
            let decodedPath = decodeURIComponent(img.url);
            if (decodedPath.startsWith("/")) {
              decodedPath = decodedPath.substring(1);
            }
            const fullPathInPublic = path.join(process.cwd(), "public", decodedPath);
            const fullPathInDist = path.join(process.cwd(), "dist", decodedPath);
            let chosenPath = "";
            if (fs.existsSync(fullPathInPublic)) {
              chosenPath = fullPathInPublic;
            } else if (fs.existsSync(fullPathInDist)) {
              chosenPath = fullPathInDist;
            }

            if (chosenPath) {
              try {
                const buffer = fs.readFileSync(chosenPath);
                b64 = buffer.toString("base64");
                if (chosenPath.endsWith(".png")) mimeType = "image/png";
                else if (chosenPath.endsWith(".jpg") || chosenPath.endsWith(".jpeg")) mimeType = "image/jpeg";
              } catch (e) {
                console.error("Failed to read actual preset file for Gemini analysis:", e);
              }
            }
          }

          if (!b64) {
            const localPath = path.join(process.cwd(), "public", "choijiwon", `${idx}.png`);
            if (fs.existsSync(localPath)) {
              b64 = fs.readFileSync(localPath).toString("base64");
            }
          }

          imageInfos.push({
            id: img.id,
            origTitle: current.subject,
            origDesc: current.feature,
            trait: img.trait || "형태",
            mimeType,
            b64
          });
        }
      });

      const systemPrompt = `You are an expert in visual psychology and objective cognitive-aesthetic analysis.
Analyse the selected images chosen by "${userNameVal}" according to their active psychological traits ("대상", "의미", "감각", "직관", "질감", "선명", "색감", "방법론", "취향", "형태") that are highly active for each image choice.

Your ultimate goal is to generate exceptionally clear, objective, professional, and visually grounded analysis results in concise, elegant, and refined Korean.

[PROMPT CRITICAL DIRECTIVES & STYLE GUIDELINES]
1. Absolute Physical Image Alignment (구체적인 실제 피사체 및 물리적 시각요소 지목 의무):
   - You MUST look directly at the actual visual canvas contents in the provided image files (inlineData).
   - If the image contains a food dish like a pork cutlet (donkasu, 돈까스), freshly baked salt bread (갓 나온 듯한 소금빵), sushi, flowers, a cat, scenery, or any real-world object, YOU MUST EXTREMELY CLEARLY DESCRIBE THOSE ACTUAL OBJECTS in your written analysis.
   - 누구의 눈에도 명확히 보이는 물리적 특징(예: 사물의 동글동글한 형태, 특유의 따뜻한 오렌지빛 색조, 비례감 넘치는 배열의 밀도, 대각선 사선의 경사, 표면의 오돌토돌함, 부드러운 그림자의 경계 등)을 구체적으로 꼭 집어내세요. 추상적이거나 모호한 미술 용어로 넘어가기보다, 누구나 바로 알아볼 수 있게 친절하고 직관적으로 인과관계를 지목하여 설명해 주어야 합니다. ("누구나 한눈에 알 수 있게 집어주기")
   - The provided "origTitle" and "origDesc" are only default templates/hints. If they contradict what is actually shown in the image (for example, if the text hints say "새벽녘 가로등" but the image shows "소금빵" or "바삭한 돈까스"), IGNORE THE HINT TEXT COMPLETELY and analyze the real picture that you see.
   - Describe what part or visual quality of this real item (e.g., the golden soft crust of the baked salt bread, the crispy texture of the fried cutlet, the neat alignment of food on the dish, the round pottery curves) triggered the active psychological trait.

2. Deep Visual-Trait Connection:
   - You MUST explain "in what way" and "from which precise physical/visual feature" of this specific image the active psychological trait is felt.
   - Connect the literal visual details (e.g., exact color tones, shadow paths, grain, textures, grid intersections, natural soft light, empty canvas space, or small growing plants) with the trait.
   - AVOID generic/boilerplate explanations like "이 이미지는 마음의 위로를 줍니다" or "따뜻함을 선사합니다". Instead, specify the exact trigger: e.g., "우둘투둘하게 튀겨진 바삭한 황금빛 단면", "노릇노릇하고 따뜻하게 피어오른 갓 구운 소금빵의 표면 윤기와 알갱이" 등.
   - STRICT LIMIT: Do NOT use any emotional, poetic, or overly abstract language. Do NOT use terms like "오랜 정취", "은은한 이야기", "추억", "기억", "향수", "정황", "마음의 이정표", "위로와 치유", "안목을 투영", "영적 교감", "영혼의 울림", "마음의 상처", "안도감", "마음의 평온", "맑은 안목", "아늑한 서사", "다정다감한 시선", "깊은 사색", "따뜻한 시선", "감성적인 시선" 등. Keep it entirely objective, physical, aesthetic, and logical.
   - SENTENCE ENDING RULE (문장 종결 규칙):
     - Every description sentence (in "desc") MUST end with a clear statement explaining that the psychological trait is revealed or proven by the specific physical/visual elements previously described in the image.
     - The sentence MUST conclude in a form like: "...[specific physical/visual detail] 부분에서 이러한 [trait_name]적 성향(지표)이 드러납니다." or "...[specific physical/visual detail]의 배치/형태적 특징에서 해당 성향이 나타납니다."
     - NEVER end sentences with soft, emotional descriptions or summaries of the user's mind, eye, or personality (e.g. Do NOT end with: "~~님의 시선입니다", "~~님의 안목을 보여줍니다", "~~적 감성을 담아냅니다"). Focus strictly on how the visual elements in the image demonstrate the trait.

3. Trait-Specific Analysis Guidance:
   - "대상" (Object): Highlight the single strong focal point or clear subject standing securely. Connect to "${userNameVal}"'s cognitive focus on definite physical subjects, self-reliant attention, and structured priority.
   - "의미" (Symbolism): Decipher logical stories, context, or analog qualities in minor details. Reflect how "${userNameVal}" is a thoughtful observer of contextual meaning, analyzing implicit relationships.
   - "감각" (Sensation/Comfort): Emphasize composition, soft lighting balance, or immediate physical comfort. Mirror "${userNameVal}"'s refined environmental sensitivity and preference for visually comfortable layouts.
   - "직관" (Intuition): Capture the prompt charisma, bold contrast, or clear patterns. Link to "${userNameVal}"'s rapid pattern recognition and spontaneous yet refined decision-making style.
   - "질감" (Texture): Highlight tangible material details (wood grains, stonework, water patterns). Show how "${userNameVal}" values authentic substance, structural depth, and honest material qualities.
   - "선명" (Clarity/Order): Focus on neat vertical/horizontal alignments, stark contrast, and tidy grids. Relate to "${userNameVal}"'s logical preference for clear boundaries, system order, and noise reduction.
   - "색감" (Color/Palette): Decode the temperature and harmony of the palette. Explain how "${userNameVal}"'s perception responds to color grading, balancing visual environments with tailored hues.
   - "방법론" (Methodology/Framing): Celebrate structural framing, scale contrast, or clean composition. Reflect "${userNameVal}"'s analytical curiosity and appreciation for deliberate design.
   - "취향" (Taste/Uniqueness): Accentuate rare, non-standard subjects or independent, self-contained layouts. Recognize "${userNameVal}"'s independent visual style and integrity to choose specific aesthetic configurations.
   - "형태" (Form/Geometry): Focus on structural symmetry, curves, or geometric bases. Associate with "${userNameVal}"'s seek for structural balance, stability, and geometric harmony.

4. Expected Output Structure & Constraints:
   - Provide your analysis in a SINGLE unified JSON object.
   - For the "desc" field, you MUST write exactly 1-2 continuous, very short, concise, and clear sentences (maximum 80-120 Korean characters total). Keep it punchy, direct, objective, and clear.
   - CRITICAL DESCRIPTION GUIDELINES: Do NOT use rigid templates or repetitive boilerplate sentence formulas. Write a fully customized, unique explanation based strictly on what is physically visible in the image.
     - Avoid awkward run-on Korean connectors. Write complete, independent, and grammatically perfect sentences.

     - CRITICAL formatting rule: Do NOT use any Markdown bold markers (such as asterisks '**') or any other formatting characters inside the JSON value fields. Keep all text plain, natural, and clean.
     - CRITICAL language rule: Do NOT use tactile words (such as '촉각', '촉감', '피부에 와닿는다', '손끝에 느껴진다', '만져질 듯', '감싸 쥐는' 등) in your analysis. Focus purely on visual elements, geometry, color, light, and composition.
     - The JSON keys must exactly match the Original ID values (such as "img-placeholder-1" or "최지원-img-1") of each analysed image.
     - Value fields: "title" (a clean, professional title describing the subject and trait, e.g., "초코퍼지케익 포스터 [대상적 지표]"), "desc" (the 1-2 short objective sentences adhering to the constraints above), "detail" ("이 이미지는 ${userNameVal}님의 <active trait> 성향을 구성하는 핵심 시각 지표입니다.").

Response JSON Format:
{
  "exact_image_id_here": {
    "title": "격자 그림자 [선명적 지표]",
    "desc": "정갈한 격자 문틀의 기하학적 형태와 대칭적인 빛의 분할이 조화롭게 구성되어 있습니다. 이는 물리적인 균형과 명확한 공간 구획을 선호하는 선명적 성향을 분석하는 지표입니다.",
    "detail": "이 이미지는 ${userNameVal}님의 선명 성향을 구성하는 핵심 시각 지표입니다."
  }
}`;

      const parts: any[] = [];
      parts.push({ text: systemPrompt });

      imageInfos.forEach((info) => {
        parts.push({ text: `--- START OF ANALYSIS FOR IMAGE ID: "${info.id}" ---` });
        parts.push({ text: `Preconfigured Text Hint (Subject): "${info.origTitle || "시각적 무늬"}"` });
        parts.push({ text: `Preconfigured Text Hint (Description): "${info.origDesc || "미적 단면"}"` });
        parts.push({ text: `Target Active Psychological Trait: "${normalizeTrait(info.trait)}"` });
        parts.push({ text: `CRITICAL INSTRUCTION FOR THIS IMAGE: Inspect the actual image content provided in 'inlineData' below. If you observe something different from the 'Preconfigured Text Hint' (for example: if you see a food dish like a pork cutlet (돈까스), salt bread (소금빵), baked cheese cake, a cat, green trees, flowers, or a real-world object), you MUST ignore the 'Preconfigured Text Hint' completely! Instead, analyze and clearly describe the actual food/object shown in the image (e.g., '고소하고 바삭하게 튀겨진 브라운 톤의 돈까스', '노릇노릇하고 포근하게 구워진 치즈케이크', '노릇한 소금빵의 부드러움과 윤기') and explain specifically how that physical visual aspect triggers the Target Active Psychological Trait "${normalizeTrait(info.trait)}".` });
        parts.push({
          inlineData: {
            mimeType: info.mimeType,
            data: info.b64
          }
        });
        parts.push({ text: `--- END OF ANALYSIS FOR IMAGE ID: "${info.id}" ---` });
      });

      let isFallback = false;
      const modelName = "gemini-3.5-flash";
      
      let timeoutId: NodeJS.Timeout;
      const geminiTimeout = new Promise<any>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Gemini API call timed out after 12 seconds")), 12000);
      });

      const response = await Promise.race([
        generateContentWithRetry({
          model: modelName,
          contents: {
            parts: parts
          },
          config: {
            responseMimeType: "application/json",
          }
        }),
        geminiTimeout
      ]);
      clearTimeout(timeoutId!);

      if (response && response.text) {
        const rawText = response.text.trim();
        console.log("Raw Gemini Response received length:", rawText.length);
        let cleanedText = rawText;
        if (cleanedText.startsWith("```")) {
          cleanedText = cleanedText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
        }
        try {
          const parsed = JSON.parse(cleanedText);
          const parsedKeys = Object.keys(parsed);
          
          images.forEach((img, idx) => {
            let val = parsed[img.id];

            if (!val) {
              const matchedKey = parsedKeys.find(k => {
                const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, "");
                const cleanId = img.id.toLowerCase().replace(/[^a-z0-9]/g, "");
                return cleanK === cleanId || cleanK.includes(cleanId) || cleanId.includes(cleanK);
              });
              if (matchedKey) {
                val = parsed[matchedKey];
              }
            }

            if (!val) {
              const imgNum = getImgNumFromId(img.id, idx);
              const matchedKey = parsedKeys.find(k => {
                const match = k.match(/(\d+)$/);
                return match ? parseInt(match[1], 10) === imgNum : false;
              });
              if (matchedKey) {
                val = parsed[matchedKey];
              }
            }

            if (!val && parsedKeys[idx]) {
              val = parsed[parsedKeys[idx]];
            }

            let titleVal = "";
            let descVal = "";
            let detailVal = "";
            if (val && typeof val === "object") {
              titleVal = (val.title || "").trim();
              descVal = (val.desc || "").trim();
              detailVal = (val.detail || "").trim();
            } else if (typeof val === "string") {
              descVal = val.trim();
            }

            if (descVal) {
              responseData[img.id] = {
                title: titleVal || `${img.origTitle || "시각적 무늬"}의 '${normalizeTrait(img.trait)}'`,
                desc: descVal,
                detail: detailVal || `이 이미지는 당신의 ${normalizeTrait(img.trait)}적 감각과 교감하는 소중한 마음의 이정표입니다.`
              };
            }
          });
          console.log("Successfully parsed unified Gemini response.");
        } catch (parseErr: any) {
          console.error("Failed to parse Gemini JSON:", parseErr.message, "Cleaned raw output was:", cleanedText);
          isFallback = true;
        }
      } else {
        isFallback = true;
      }

      images.forEach((img, idx) => {
        if (!responseData[img.id]) {
          const imgNum = getImgNumFromId(img.id, idx);
          responseData[img.id] = getImageSpecificExplanation(imgNum, img.trait, userNameVal, img.id, img.url);
        }
      });

      return res.json({ success: true, analysis: responseData, isFallback });

    } catch (err: any) {
      console.warn("[Gemini Bypass] Unified Gemini API generateContent call is using fallback:", err?.message || err);
      console.log("Unified analyze-selected trigger: Falling back to elegant pre-configured visual analytics.");
      images.forEach((img, idx) => {
        if (!responseData[img.id]) {
          const imgNum = getImgNumFromId(img.id, idx);
          responseData[img.id] = getImageSpecificExplanation(imgNum, img.trait, userNameVal, img.id, img.url);
        }
      });
      return res.json({ success: true, analysis: responseData, isFallback: true });
    }
  });

  const RESULTS_FILE_PATH = path.join(WRITABLE_DIR, "completed_results.json");

  function writeCompletedResults(results: any[]) {
    if (isCloudRun) return; // Skip local file writing in Cloud Run
    try {
      const dir = path.dirname(RESULTS_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(RESULTS_FILE_PATH, JSON.stringify(results, null, 2), "utf8");
    } catch (err) {
      console.error("Error writing completed results locally:", err);
    }
  }

  async function readCompletedResults(): Promise<any[]> {
    try {
      const firestoreDb = getDb();
      if (!firestoreDb) {
        throw new Error("Firestore database is not available");
      }
      const colRef = collection(firestoreDb, "results");
      const snapshot = await getDocs(colRef);
      const results: any[] = [];
      snapshot.forEach((docSnap) => {
        results.push(docSnap.data());
      });
      results.sort((a, b) => {
        const timeA = a.timestamp || "";
        const timeB = b.timestamp || "";
        return timeB.localeCompare(timeA);
      });
      return results;
    } catch (err) {
      console.error("Error reading from Firestore results, falling back to local file:", err);
      try {
        if (fs.existsSync(RESULTS_FILE_PATH)) {
          return JSON.parse(fs.readFileSync(RESULTS_FILE_PATH, "utf8"));
        }
      } catch (localErr) {
        console.error("Error reading fallback local completed_results.json:", localErr);
      }
      return [];
    }
  }

  async function saveResult(newEntry: any) {
    try {
      const firestoreDb = getDb();
      if (!firestoreDb) {
        throw new Error("Firestore database is not available");
      }
      const cleanEntry = sanitizeForFirestore(newEntry);
      await setDoc(doc(firestoreDb, "results", cleanEntry.id), cleanEntry);
      console.log(`[Firestore Save] Saved result for user: ${cleanEntry.userData?.name}, id: ${cleanEntry.id}`);
    } catch (dbErr) {
      console.error("Failed to save to Firestore:", dbErr);
    }
    try {
      const results = await readCompletedResults();
      if (!results.some(r => r.id === newEntry.id)) {
        results.unshift(newEntry);
        writeCompletedResults(results);
      }
    } catch (localErr) {
      console.error("Local file backup failed during save:", localErr);
    }
  }

  async function deleteResult(id: string) {
    try {
      const firestoreDb = getDb();
      if (!firestoreDb) {
        throw new Error("Firestore database is not available");
      }
      await deleteDoc(doc(firestoreDb, "results", id));
      console.log(`[Firestore Delete] Deleted result with id: ${id}`);
    } catch (dbErr) {
      console.error("Failed to delete from Firestore:", dbErr);
    }
    try {
      let results = await readCompletedResults();
      results = results.filter((r: any) => r.id !== id);
      writeCompletedResults(results);
    } catch (localErr) {
      console.error("Local file update failed during delete:", localErr);
    }
  }

  async function importResults(parsedRecords: any[]) {
    const firestoreDb = getDb();
    for (const record of parsedRecords) {
      try {
        if (!firestoreDb) {
          throw new Error("Firestore database is not available");
        }
        const cleanRecord = sanitizeForFirestore(record);
        await setDoc(doc(firestoreDb, "results", cleanRecord.id), cleanRecord);
      } catch (dbErr) {
        console.error(`Failed to import record ${record.id} to Firestore:`, dbErr);
      }
    }
    try {
      const results = await readCompletedResults();
      const updatedResults = [...parsedRecords, ...results];
      writeCompletedResults(updatedResults);
    } catch (localErr) {
      console.error("Local file backup failed during import:", localErr);
    }
  }

  app.post("/api/save-result", async (req, res) => {
    try {
      const { userData, middleName, creationUrl, lastNameSignature, selectedImages } = req.body;
      if (!userData || !userData.name) {
        return res.status(400).json({ error: "Invalid user data provided" });
      }

      const now = new Date();
      const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
      const timestampStr = kstTime.toISOString().replace('T', ' ').substring(0, 19);
      const newId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      const newEntry = {
        id: newId,
        userData,
        middleName,
        creationUrl,
        lastNameSignature,
        selectedImages,
        timestamp: timestampStr
      };

      await saveResult(newEntry);

      console.log(`[Admin Save] Saved result for user: ${userData.name}, id: ${newId}`);
      res.json({ success: true, id: newId });
    } catch (err: any) {
      console.error("Error in /api/save-result:", err);
      res.status(500).json({ error: "Failed to save user result" });
    }
  });

  app.get("/api/admin/results", async (req, res) => {
    try {
      const passcode = req.query.passcode as string;
      const adminPasscode = process.env.ADMIN_PASSCODE || "admin123";

      if (passcode !== adminPasscode) {
        return res.status(401).json({ error: "Invalid passcode" });
      }

      const results = await readCompletedResults();
      res.json({ success: true, results });
    } catch (err) {
      console.error("Error in /api/admin/results:", err);
      res.status(500).json({ error: "Failed to retrieve results" });
    }
  });

  app.post("/api/admin/delete-result", async (req, res) => {
    try {
      const { passcode, id } = req.body;
      const adminPasscode = process.env.ADMIN_PASSCODE || "admin123";

      if (passcode !== adminPasscode) {
        return res.status(401).json({ error: "Invalid passcode" });
      }

      if (!id) {
        return res.status(400).json({ error: "Missing result id" });
      }

      const results = await readCompletedResults();
      const exists = results.some((r: any) => r.id === id);
      
      if (!exists) {
        return res.status(404).json({ error: "Result not found" });
      }

      await deleteResult(id);
      console.log(`[Admin Delete] Deleted result with id: ${id}`);
      res.json({ success: true });
    } catch (err) {
      console.error("Error in /api/admin/delete-result:", err);
      res.status(500).json({ error: "Failed to delete result" });
    }
  });

  app.post("/api/admin/import-results", async (req, res) => {
    try {
      const { passcode, newRecords } = req.body;
      const adminPasscode = process.env.ADMIN_PASSCODE || "admin123";

      if (passcode !== adminPasscode) {
        return res.status(401).json({ error: "Invalid passcode" });
      }

      if (!Array.isArray(newRecords)) {
        return res.status(400).json({ error: "newRecords must be an array" });
      }

      const results = await readCompletedResults();
      
      const parsedRecords = newRecords.map((item: any) => {
        const now = new Date();
        const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        const timestampStr = item.timestamp || kstTime.toISOString().replace('T', ' ').substring(0, 19);
        const newId = item.id || `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        return {
          id: newId,
          userData: {
            name: item.userData?.name || item.name || "익명",
            signature: item.userData?.signature || item.signature || "",
            gender: item.userData?.gender || item.gender || "male",
            age: item.userData?.age || item.age || "adult"
          },
          middleName: item.middleName || "Harmonious",
          creationUrl: item.creationUrl || "",
          lastNameSignature: item.lastNameSignature || "",
          selectedImages: Array.isArray(item.selectedImages) ? item.selectedImages : [],
          timestamp: timestampStr
        };
      });

      await importResults(parsedRecords);

      console.log(`[Admin Import] Imported ${parsedRecords.length} records.`);
      res.json({ success: true, count: parsedRecords.length });
    } catch (err) {
      console.error("Error in /api/admin/import-results:", err);
      res.status(500).json({ error: "Failed to import results" });
    }
  });

  app.post("/api/admin/update-image-map", (req, res) => {
    try {
      const { passcode, imageMap } = req.body;
      const adminPasscode = process.env.ADMIN_PASSCODE || "admin123";

      if (passcode !== adminPasscode) {
        return res.status(401).json({ error: "Invalid passcode" });
      }

      if (!imageMap || typeof imageMap !== "object") {
        return res.status(400).json({ error: "imageMap must be an object" });
      }

      const mapFilePath = path.join(process.cwd(), "src", "data", "globalImageMap.json");
      if (isCloudRun) {
        console.warn("[Admin Image Map] Skipping local file write in production.");
        userImagesCache.clear();
        return res.json({ success: true, warning: "Stored in memory for this session (Firestore persistence pending)" });
      }
      const dir = path.dirname(mapFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(mapFilePath, JSON.stringify(imageMap, null, 2), "utf8");
      userImagesCache.clear(); // Clear the memory cache instantly so updated values are fetched
      console.log("[Admin Image Map] Overwrote globalImageMap.json successfully.");
      res.json({ success: true });
    } catch (err) {
      console.error("Error in /api/admin/update-image-map:", err);
      res.status(500).json({ error: "Failed to update global image map" });
    }
  });

  app.post("/api/admin/verify-passcode", (req, res) => {
    try {
      const { passcode } = req.body;
      const adminPasscode = process.env.ADMIN_PASSCODE || "admin123";

      if (passcode === adminPasscode) {
        return res.json({ success: true });
      } else {
        return res.status(401).json({ success: false, error: "Invalid passcode" });
      }
    } catch (err) {
      console.error("Error in /api/admin/verify-passcode:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // API Route for OCR
  app.post("/api/recognize", async (req, res) => {
    const fallbackNames = ["최지원", "하온", "지우", "서연", "도윤", "수안", "하임", "정인", "이선"];
    const fallbackLocations = ["서울", "부산", "제주", "경주", "인천", "양양", "속초", "수원"];
    const target = req.body.target;

    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ error: "No image provided" });
      }

      console.log("Recognition request received. Image data length:", image.length, "Target:", target);
      
      let base64Data = image;
      if (image.includes(',')) {
        base64Data = image.split(',')[1];
      }

      if (!base64Data) {
        console.log("Extracted base64 data is empty, using fallback directly");
        const isName = target === "name";
        const fallbackText = isName
          ? "최지원"
          : fallbackLocations[Math.floor(Math.random() * fallbackLocations.length)];
        return res.json({ text: fallbackText, isFallback: true });
      }
      
      const modelsToTry = ["gemini-flash-latest", "gemini-3.1-flash-lite", "gemini-3.5-flash"];
      let response;
      let apiFailed = true;

      for (const modelName of modelsToTry) {
        try {
          console.log(`Trying OCR with model: ${modelName}`);
          response = await getAi().models.generateContent({
            model: modelName, 
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: "image/png",
                    data: base64Data,
                  },
                },
                {
                  text: "Extract the handwritten Korean text from this image. It is either a person's name or a city name in Korea. The brush strokes are dark on a light background. Respond ONLY with the recognized Hangul characters (2-5 characters typically). If you cannot read anything clearly, respond with 'Unknown'.",
                },
              ],
            },
          });
          
          if (response && response.text) {
            apiFailed = false;
            console.log(`OCR successful with model: ${modelName}`);
            break;
          }
        } catch (err: any) {
          console.log(`Gemini API model ${modelName} request rate limited or offline. Proceeding...`);
        }
      }

      let extractedText = "";
      if (!apiFailed && response && response.text) {
        extractedText = response.text.trim();
      }

      extractedText = extractedText.replace(/[^ㄱ-ㅎㅏ-ㅣ가-힣]/g, "");

      if (apiFailed || !extractedText || extractedText.toLowerCase().includes("unknown")) {
        console.log("Falling back to simulated recognition due to limitation or unreadable signature. apiFailed:", apiFailed);
        const isName = target === "name" || (!target && extractedText.length <= 4);
        extractedText = isName
          ? "최지원"
          : fallbackLocations[Math.floor(Math.random() * fallbackLocations.length)];
      }

      console.log("OCR Result returned:", extractedText);
      res.json({ text: extractedText, isFallback: apiFailed });
    } catch (error: any) {
      console.log("OCR Exception caught. Handled successfully with local fallback guarantee.");
      const fallbackText = target === 'name' ? "최지원" : fallbackLocations[Math.floor(Math.random() * fallbackLocations.length)];
      res.json({ text: fallbackText, isFallback: true });
    }
  });

  // Global Error Handler Middleware to guarantee JSON responses
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Express global error caught:", err);
    res.status(err.status || 500).json({
      error: "Temporarily busy or congested",
      text: req.body?.target === "location" ? "제주" : "하온",
      isFallback: true
    });
  });

  // Vite middleware for development or static file serving
  if (process.env.NODE_ENV !== "production" && !isProdRun) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        cors: true
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const publicPath = path.join(process.cwd(), 'public');
    
    // Serve from build outputs AND the writable temporary storage
    app.use(express.static(distPath));
    app.use(express.static(publicPath));
    app.use(express.static(WRITABLE_DIR));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    
    // Test Firebase connection in the background after the server starts listening
    testFirebaseConnection().catch(err => console.error("[Startup] Firebase test failed:", err));
  });
}

startServer();
