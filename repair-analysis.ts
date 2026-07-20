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
  results = JSON.parse(fs.readFileSync(mapPath, "utf8"));
}

async function analyzeImage(num: number): Promise<ImageAnalysis> {
  const imgPath = path.join(process.cwd(), "public", "choijiwon", `${num}.png`);
  if (!fs.existsSync(imgPath)) {
    throw new Error(`File does not exist: ${imgPath}`);
  }

  const b64 = fs.readFileSync(imgPath).toString("base64");

  const prompt = `Analyze this image (image number ${num} in the collection) and extract its exact physical and visual content in Korean.
Your description MUST be 100% literal and describe what is physically shown in the picture (e.g. if it is a food dish like pork cutlet (돈까스), bread, cake, cat, drawing, scenery, coffee, etc., describe exactly those objects, colors, and textures). DO NOT use abstract metaphors like "기다림의 의자" unless that is literally what is in the picture.

Please respond with a JSON object containing exactly these three fields:
1. "subject": A very brief, human-like, humble literal title naming the main visible object or theme (e.g., "소금빵", "바스크 치즈케이크", "고양이", "초록 정원"). Max 5 words.
2. "feature": A descriptive sentence detailing the physical appearance of the subject (e.g., "노릇노릇하고 부드럽게 구워진 소금빵 두 개가 흰 접시 위에 나란히 보입니다").
3. "focus": A descriptive sentence explaining the visual focus, arrangement, color contrast, or texture harmony of the scene (e.g., "빵 표면의 노릇한 윤기와 소금 결정들의 세부 질감이 부드러운 노란 조명 아래 돋보입니다").

Your output MUST be valid JSON matching this schema:
{
  "subject": "string",
  "feature": "string",
  "focus": "string"
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
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
  console.log("Checking and repairing image analysis placeholders...");
  let repairedCount = 0;
  const LIMIT = 10;
  
  for (let i = 1; i <= 50; i++) {
    const key = String(i);
    const existing = results[key];
    const isPlaceholder = !existing || existing.subject.startsWith("시각 이미지") || !existing.feature || existing.feature.includes("추출된 시각 이미지");
    
    if (isPlaceholder) {
      if (repairedCount >= LIMIT) {
        console.log(`Reached limit of ${LIMIT} repaired images in this run. Stopping to prevent timeout.`);
        break;
      }
      console.log(`Image ${i} is a placeholder or missing. Repairing...`);
      let success = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          // Delay to stay well within 15 RPM rate limit
          await new Promise(resolve => setTimeout(resolve, 5500));
          const res = await analyzeImage(i);
          results[key] = res;
          console.log(`[Success] Repaired image ${i}: ${res.subject}`);
          // Save incrementally so we don't lose progress if interrupted
          fs.writeFileSync(mapPath, JSON.stringify(results, null, 2), "utf8");
          success = true;
          repairedCount++;
          break;
        } catch (err: any) {
          console.error(`[Error] Image ${i}, Attempt ${attempt}/3:`, err.message || err);
          if (attempt < 3) {
            console.log("Waiting 15 seconds before retry...");
            await new Promise(resolve => setTimeout(resolve, 15000));
          }
        }
      }
      if (!success) {
        console.error(`[Fatal] Failed to repair image ${i} after 3 attempts.`);
      }
    } else {
      console.log(`Image ${i} is already fully analyzed: ${existing.subject}`);
    }
  }
  
  console.log(`Repair process complete in this run! Repaired ${repairedCount} images.`);
}

main().catch(console.error);
