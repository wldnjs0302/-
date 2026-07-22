const fs = require("fs");

function normalizeTrait(cat) {
  if (!cat) return "";
  cat = cat.trim();
  if (cat.includes("선명")) return "선명";
  if (cat === "으미") return "의미";
  if (cat === "방법" || cat === "방벙" || cat === "방법론") return "방법론";
  if (cat === "현태") return "형태";
  if (cat === "직괸") return "직관";
  return cat;
}

function parseCSV(filename) {
  const content = fs.readFileSync(filename, "utf8");
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== "");
  
  // Skip header
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    // Basic CSV cell parsing (simple split by comma is enough since values do not contain commas or are simple strings)
    const parts = lines[i].split(",");
    if (parts.length >= 6) {
      const imgName = parts[1].trim();
      const match = imgName.match(/(\d+)/);
      if (!match) continue;
      const num = parseInt(match[1], 10);
      const desc = parts[2] ? parts[2].trim() : "";
      const main = normalizeTrait(parts[3]);
      const sub1 = normalizeTrait(parts[4]);
      const sub2 = normalizeTrait(parts[5]);
      rows.push({ num, main, sub1, sub2, desc });
    }
  }
  
  // Sort by num
  rows.sort((a, b) => a.num - b.num);
  return rows;
}

const gahun = parseCSV("gahun.csv");
const jikhyeok = parseCSV("jikhyeok.csv");
const pyeongan = parseCSV("pyeongan.csv");

console.log("GAHUN LENGTH:", gahun.length);
console.log("JIKHYEOK LENGTH:", jikhyeok.length);
console.log("PYEONGAN LENGTH:", pyeongan.length);

// Generate typescript code
function toTSArray(name, rows) {
  let out = `export const raw${name}Sheet = [\n`;
  rows.forEach(r => {
    out += `  { num: ${r.num}, main: "${r.main}", sub1: "${r.sub1}", sub2: "${r.sub2}" },\n`;
  });
  out += `];`;
  return out;
}

fs.writeFileSync("output_gahun.ts", toTSArray("Gahun", gahun));
fs.writeFileSync("output_jikhyeok.ts", toTSArray("Jikhyeok", jikhyeok));
fs.writeFileSync("output_pyeongan.ts", toTSArray("Pyeongan", pyeongan));

// Let's also compute scores for PREDEFINED_USERS profile!
// How are scores computed?
// Let's look at how we can aggregate counts of main, sub1, and sub2 to get scores for each of the 10 categories.
// We can assign weights to main (e.g. 5 points), sub1 (e.g. 3 points), sub2 (e.g. 1 point), and scale them to a range like 30-97.
// Or we can just calculate frequency and map linearly to 30-97 range, where the dominantTrait gets the highest score (e.g. 96).
// Let's compute actual frequency of traits for each user to get a highly customized real result!
function calculateScores(rows) {
  const counts = {};
  const traits = ["대상", "의미", "감각", "직관", "질감", "선명", "색감", "방법론", "취향", "형태"];
  traits.forEach(t => counts[t] = 0);
  
  rows.forEach(r => {
    if (counts[r.main] !== undefined) counts[r.main] += 5;
    if (counts[r.sub1] !== undefined) counts[r.sub1] += 3;
    if (counts[r.sub2] !== undefined) counts[r.sub2] += 1.5;
  });
  
  // Find min and max
  let minVal = Infinity;
  let maxVal = -Infinity;
  traits.forEach(t => {
    if (counts[t] < minVal) minVal = counts[t];
    if (counts[t] > maxVal) maxVal = counts[t];
  });
  
  // Linearly map to 30 ~ 96
  const scores = {};
  traits.forEach(t => {
    let score = 30;
    if (maxVal > minVal) {
      score = Math.round(30 + ((counts[t] - minVal) / (maxVal - minVal)) * 66);
    } else {
      score = 65;
    }
    scores[t] = score;
  });
  
  // Dominant trait is the one with highest score
  let dominantTrait = "대상";
  let maxScore = -1;
  traits.forEach(t => {
    if (scores[t] > maxScore) {
      maxScore = scores[t];
      dominantTrait = t;
    }
  });
  
  return { dominantTrait, scores };
}

console.log("Gahun scores:", calculateScores(gahun));
console.log("Jikhyeok scores:", calculateScores(jikhyeok));
console.log("Pyeongan scores:", calculateScores(pyeongan));
