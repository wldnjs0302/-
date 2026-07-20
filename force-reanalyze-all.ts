import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not defined in environment variables.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

interface ImageAnalysis {
  subject: string;
  feature: string;
  focus: string;
}

const mapPath = path.join(process.cwd(), "src", "data", "choijiwon_analyzed.json");
let results: Record<string, ImageAnalysis> = {};

if (fs.existsSync(mapPath)) {
  results = JSON.parse(fs.readFileSync(mapPath, "utf8"));
}

async function analyzeImage(num: number): Promise<ImageAnalysis> {
  const imgPath = path.join(process.cwd(), "public", "choijiwon", `${num}.png`);
  if (!fs.existsSync(imgPath)) {
    throw new Error(`File does not exist: ${imgPath}`);
  }

  const b64 = fs.readFileSync(imgPath).toString("base64");

  const prompt = `Analyze this image (which is image number ${num} in Choi Jiwon's user collection) and extract its exact physical and visual content in Korean.
Your description MUST be 100% literal and describe what is physically shown in the picture (e.g., if it's a monkey doll (원숭이 모형/인형), a pork cutlet (돈까스), bread, cake, cat, drawing, scenery, coffee, etc., describe exactly those objects, colors, and textures). DO NOT use abstract metaphors like "기다림의 의자" unless that is literally what is in the picture.

Please respond with a JSON object containing exactly these three fields:
1. "subject": A very brief, human-like, humble literal title naming the main visible object or theme (e.g., "원숭이 인형", "돈까스 정식", "소금빵", "바스크 치즈케이크", "고양이", "푸른 산맥"). Max 5 words.
2. "feature": A descriptive sentence detailing the physical appearance of the subject (e.g., "바삭해 보이는 튀김옷과 촉촉하게 잘 익혀진 속의 붉은 고깃살이 돋보이는 돈까스").
3. "focus": A descriptive sentence explaining the visual focus, arrangement, color contrast, or texture harmony of the scene (e.g., "양배추의 하얀 빛깔과 방울토마토의 빨간색 대비가 돋보이며 질감이 잘 살아남").

Your output MUST be valid JSON matching this schema:
{
  "subject": "string",
  "feature": "string",
  "focus": "string"
}`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: [
      { text: prompt },
      {
        inlineData: {
          mimeType: "image/png",
          data: b64
        }
      }
    ],
    config: {
      responseMimeType: "application/json"
    }
  });

  if (!response.text) {
    throw new Error("No response text from Gemini");
  }

  const cleanText = response.text.trim().replace(/^```json/, "").replace(/```$/, "").trim();
  return JSON.parse(cleanText) as ImageAnalysis;
}

async function main() {
  console.log("Starting FORCE analysis of all 50 images in /public/choijiwon using gemini-3.5-flash...");
  
  for (let i = 1; i <= 50; i++) {
    const key = String(i);
    console.log(`Analyzing image ${i}/50...`);
    let success = false;
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const res = await analyzeImage(i);
        results[key] = res;
        console.log(`[Success] Analyzed image ${i}: ${res.subject}`);
        // Save incrementally
        fs.writeFileSync(mapPath, JSON.stringify(results, null, 2), "utf8");
        success = true;
        break;
      } catch (err: any) {
        console.error(`[Error] Image ${i}, Attempt ${attempt}/5:`, err.message || err);
        const isRateLimit = err.message && (err.message.includes("429") || err.message.includes("Quota exceeded") || err.message.includes("RESOURCE_EXHAUSTED"));
        if (isRateLimit) {
          console.log("Rate limit hit. Waiting 45 seconds before retrying...");
          await new Promise(resolve => setTimeout(resolve, 45000));
        } else {
          console.log("Waiting 5 seconds before retrying...");
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }
    if (!success) {
      console.error(`[Fatal] Failed to analyze image ${i} after 5 attempts.`);
    }
    // Respectful delay between successful requests
    await new Promise(resolve => setTimeout(resolve, 4000));
  }
  
  console.log("FORCE analysis of all 50 images completed successfully!");
}

main().catch(console.error);
