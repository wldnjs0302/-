const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require("path");

async function downloadImages() {
  console.log("Downloading Gwangeo...");
  const fileId2 = "19Oh0JmF1gn1SyiQmmxFNxVddN4TCVAaF";
  const url2 = `https://drive.usercontent.google.com/download?id=${fileId2}&export=download&confirm=t`;
  const response2 = await fetch(url2);
  const arrayBuffer2 = await response2.arrayBuffer();
  const zip2 = new AdmZip(Buffer.from(arrayBuffer2));
  
  const publicDir2 = path.join(process.cwd(), "public", "gwangeoreulchajaseo");
  if (!fs.existsSync(publicDir2)) fs.mkdirSync(publicDir2, { recursive: true });
  
  const distDir2 = path.join(process.cwd(), "dist", "gwangeoreulchajaseo");
  if (!fs.existsSync(distDir2)) fs.mkdirSync(distDir2, { recursive: true });
  
  zip2.getEntries().forEach((entry) => {
    if (!entry.isDirectory && entry.entryName.match(/\.(png|jpg|jpeg)$/i)) {
      const match = entry.entryName.match(/(\d+)\.(png|jpg|jpeg)$/i);
      if (match && !entry.entryName.includes("__MACOSX") && !entry.entryName.split('/').pop().startsWith("._")) {
        const fileData = entry.getData();
        fs.writeFileSync(path.join(publicDir2, `${match[1]}.${match[2]}`), fileData);
        fs.writeFileSync(path.join(distDir2, `${match[1]}.${match[2]}`), fileData);
      }
    }
  });
  console.log("Done.");
}

downloadImages().catch(console.error);
