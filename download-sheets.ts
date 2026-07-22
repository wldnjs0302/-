import fs from "fs";

async function downloadCSV(url: string, filename: string) {
  try {
    const response = await fetch(url);
    const text = await response.text();
    fs.writeFileSync(filename, text);
    console.log(`Successfully downloaded ${filename}`);
  } catch (err: any) {
    console.error(`Error downloading ${filename}:`, err.message || err);
  }
}

async function run() {
  const gahunUrl = "https://docs.google.com/spreadsheets/d/1HRVjZBZs9zNZk9W-wCEU4NkzRjQ7OSo8/export?format=csv";
  const jikhyeokUrl = "https://docs.google.com/spreadsheets/d/1gHDBidmTE1q_yMTsao9fvREi3y5TMIQH/export?format=csv";

  await downloadCSV(gahunUrl, "gahun.csv");
  await downloadCSV(jikhyeokUrl, "jikhyeok.csv");
}

run();
