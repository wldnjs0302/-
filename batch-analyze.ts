import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not defined.");
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
  try {
    results = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  } catch {}
}

async function analyzeBatch(numbers: number[]): Promise<Record<string, ImageAnalysis>> {
  console.log(`Analyzing batch of images: ${numbers.join(", ")}...`);
  const contents: any[] = [];
  
  contents.push({
    text: `You are given ${numbers.length} images numbered ${numbers.join(", ")} from a user's collection.
Analyze each of these images and describe their physical, literal, and visual content in Korean.
Your descriptions MUST be 100% literal and describe what is physically shown in each picture (e.g., if it is a food dish like a pork cutlet (안심 돈까스), salt bread (소금빵), cake, beverage, cat, scenery, etc., describe exactly those objects, colors, and textures). DO NOT use abstract metaphors like "기다림의 의자" unless that is literally what is in the picture.

Please output your response as a single valid JSON object mapping each image number (as a string key, e.g., "1", "2") to an object containing exactly these three fields:
1. "subject": A very brief, human-like, humble literal title naming the main visible object or theme (e.g., "안심 돈까스", "소금빵", "바스크 치즈케이크", "고양이", "푸른 산맥"). Max 5 words.
2. "feature": A descriptive sentence detailing the physical appearance of the subject (e.g., "노릇하게 구워진 소금빵 두 개가 깔끔한 흰 접시 위에 나란히 놓여 있습니다").
3. "focus": A descriptive sentence explaining the visual focus, arrangement, color contrast, or texture harmony of the scene (e.g., "황금빛 빵 표면의 윤기와 흰 소금 알갱이의 질감이 부드러운 전구 조명 아래서 돋보입니다").

Example response schema:
{
  "1": {
    "subject": "소금빵",
    "feature": "노릇하게 구워진 소금빵 두 개가 접시 위에 놓여 있습니다",
    "focus": "빵 표면의 윤기와 소금 질감이 강조되어 보입니다"
  }
}`
  });

  for (const num of numbers) {
    const imgPath = path.join(process.cwd(), "public", "choijiwon", `${num}.png`);
    if (fs.existsSync(imgPath)) {
      const b64 = fs.readFileSync(imgPath).toString("base64");
      contents.push({ text: `--- IMAGE NUMBER ${num} ---` });
      contents.push({
        inlineData: {
          mimeType: "image/png",
          data: b64
        }
      });
    }
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: contents,
    config: {
      responseMimeType: "application/json"
    }
  });

  if (!response.text) {
    throw new Error("No response text from Gemini");
  }

  const cleanText = response.text.trim().replace(/^```json/, "").replace(/```$/, "").trim();
  return JSON.parse(cleanText) as Record<string, ImageAnalysis>;
}

async function main() {
  console.log("Checking which images are missing or placeholders...");
  
  const missingNumbers: number[] = [];
  for (let i = 1; i <= 50; i++) {
    const key = String(i);
    const existing = results[key];
    const isPlaceholder = !existing || existing.subject.startsWith("시각 이미지") || !existing.feature || existing.feature.includes("추출된 시각 이미지");
    if (isPlaceholder) {
      missingNumbers.push(i);
    }
  }

  console.log(`Found ${missingNumbers.length} missing/placeholder images:`, missingNumbers.join(", "));

  if (missingNumbers.length === 0) {
    console.log("All 50 images are already successfully analyzed! Nothing to do.");
    return;
  }

  // Split into batches of 6 images to avoid payload sizes or API rate limit issues
  const batchSize = 6;
  const batches: number[][] = [];
  for (let i = 0; i < missingNumbers.length; i += batchSize) {
    batches.push(missingNumbers.slice(i, i + batchSize));
  }

  console.log(`Created ${batches.length} batches of size ${batchSize}.`);

  for (let bIdx = 0; bIdx < batches.length; bIdx++) {
    const batch = batches[bIdx];
    console.log(`Processing batch ${bIdx + 1}/${batches.length}: [${batch.join(", ")}]`);
    let success = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const batchResults = await analyzeBatch(batch);
        for (const [key, val] of Object.entries(batchResults)) {
          results[key] = val;
          console.log(`[Success] Analyzed image ${key}: ${val.subject}`);
        }
        fs.writeFileSync(mapPath, JSON.stringify(results, null, 2), "utf8");
        success = true;
        break;
      } catch (err: any) {
        console.error(`Error on batch [${batch.join(", ")}], attempt ${attempt}:`, err.message || err);
        if (attempt < 3) {
          console.log("Waiting 8 seconds before retrying...");
          await new Promise(resolve => setTimeout(resolve, 8000));
        }
      }
    }
    if (!success) {
      console.error(`Failed to analyze batch [${batch.join(", ")}] after 3 attempts.`);
    }
    // Cooldown sleep of 5 seconds to satisfy standard free tier rate limits
    if (bIdx < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  console.log("Batch image analysis complete! Total images analyzed:", Object.keys(results).length);
}

main().catch(console.error);
