import { readFileSync, writeFileSync } from 'fs';

const files = [
  'src/components/P2Identity.tsx',
  'src/components/P5Selection.tsx',
  'src/components/P6Analysis.tsx',
  'src/components/P8Report.tsx'
];

files.forEach(f => {
  let content = readFileSync(f, 'utf8');
  content = content.replace(/bg-black text-white border border-black rounded-full/g, 'bg-black text-white hover:bg-white hover:text-black border border-black rounded-full');
  writeFileSync(f, content, 'utf8');
});
