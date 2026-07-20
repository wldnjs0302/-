import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("No API key");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function getSubject(num: number): Promise<string> {
  const imgPath = path.join(process.cwd(), "public", "choijiwon", `${num}.png`);
  if (!fs.existsSync(imgPath)) {
    return "NOT_FOUND";
  }
  const b64 = fs.readFileSync(imgPath).toString("base64");
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { text: "What is physically in this picture? Describe the main subject in 2-3 words in Korean (e.g., 원숭이 인형, 초콜릿 케이크, 소금빵, 말차 라떼)." },
        { inlineData: { mimeType: "image/png", data: b64 } }
      ]
    });
    return response.text ? response.text.trim() : "EMPTY";
  } catch (err: any) {
    return "ERROR: " + err.message;
  }
}

async function main() {
  console.log("Checking subjects on disk for target images...");
  const targets = [5, 6, 7, 8, 9, 10, 34, 35];
  const outLines: string[] = [];
  for (const num of targets) {
    const sub = await getSubject(num);
    const line = `Image ${num}: ${sub}`;
    console.log(line);
    outLines.push(line);
    // Sleep 3 seconds to avoid rate limit
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  fs.writeFileSync("subjects.txt", outLines.join("\n"), "utf8");
}

main().catch(console.error);
