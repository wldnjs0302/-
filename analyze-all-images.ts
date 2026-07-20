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

async function analyzeImage(num: number): Promise<ImageAnalysis> {
  const imgPath = path.join(process.cwd(), "public", "choijiwon", `${num}.png`);
  if (!fs.existsSync(imgPath)) {
    throw new Error(`File does not exist: ${imgPath}`);
  }

  const b64 = fs.readFileSync(imgPath).toString("base64");

  const prompt = `Analyze this image (which is image number ${num} in Choi Jiwon's user collection) and extract its exact physical and visual content in Korean.
Your description MUST be 100% literal and describe what is physically shown in the picture (e.g., if it's a food dish like a pork cutlet (돈까스), bread, cake, cat, drawing, scenery, etc., describe exactly those objects, colors, and textures). DO NOT use abstract metaphors like "기다림의 의자" unless that is literally what is in the picture.

Please respond with a JSON object containing exactly these three fields:
1. "subject": A very brief, human-like, humble literal title naming the main visible object or theme (e.g., "돈까스 정식", "소금빵", "바스크 치즈케이크", "고양이", "푸른 산맥"). Max 5 words.
2. "feature": A descriptive sentence detailing the physical appearance of the subject (e.g., "바삭해 보이는 튀김옷과 촉촉하게 잘 익혀진 속의 붉은 고깃살이 돋보이는 돈까스").
3. "focus": A descriptive sentence explaining the visual focus, arrangement, color contrast, or texture harmony of the scene (e.g., "양배추의 하얀 빛깔과 방울토마토의 빨간색 대비가 돋보이며 질감이 잘 살아남").

Your output MUST be valid JSON matching this schema:
{
  "subject": "string",
  "feature": "string",
  "focus": "string"
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        text: prompt
      },
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
  console.log("Starting analysis of all 50 images in /public/choijiwon...");
  const results: Record<number, ImageAnalysis> = {};

  // Let's run them in batches of 5 to avoid rate limits and keep it fast
  const batchSize = 5;
  for (let i = 1; i <= 50; i += batchSize) {
    const promises = [];
    const end = Math.min(i + batchSize - 1, 50);
    for (let j = i; j <= end; j++) {
      promises.push(
        (async (num) => {
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              console.log(`Analyzing image ${num}... (Attempt ${attempt}/3)`);
              const res = await analyzeImage(num);
              results[num] = res;
              console.log(`Successfully analyzed image ${num}: ${res.subject}`);
              break;
            } catch (err: any) {
              console.error(`Error on image ${num}, attempt ${attempt}:`, err.message || err);
              if (attempt === 3) {
                // Hard fallback
                results[num] = {
                  subject: `시각 이미지 ${num}`,
                  feature: `추출된 시각 이미지 ${num}번의 고유한 형태와 배치 양식`,
                  focus: `전반적인 형태의 조화와 균형감`
                };
              } else {
                await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
              }
            }
          }
        })(j)
      );
    }
    await Promise.all(promises);
    // Cool-down between batches
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  fs.writeFileSync(
    path.join(process.cwd(), "src", "data", "choijiwon_analyzed.json"),
    JSON.stringify(results, null, 2),
    "utf8"
  );
  console.log("Analysis complete! Saved to src/data/choijiwon_analyzed.json");
}

main().catch(console.error);
