import fs from 'fs';
import path from 'path';

const srcDir1 = path.join(process.cwd(), 'public', '최지원');
const srcDir2 = path.join(process.cwd(), 'public', '최지원');
const destDir = path.join(process.cwd(), 'public', 'choijiwon');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir);
}

if (fs.existsSync(srcDir1)) {
  const files = fs.readdirSync(srcDir1);
  for (const file of files) {
    fs.copyFileSync(path.join(srcDir1, file), path.join(destDir, file));
  }
} else if (fs.existsSync(srcDir2)) {
  const files = fs.readdirSync(srcDir2);
  for (const file of files) {
    fs.copyFileSync(path.join(srcDir2, file), path.join(destDir, file));
  }
}
console.log('Done mapping images to /public/choijiwon');
