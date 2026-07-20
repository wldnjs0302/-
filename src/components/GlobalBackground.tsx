import React, { useMemo } from "react";

// Chunky, abstract, raw polygons - no letters, no symbols
const CHUNKY_SHAPES = [
  // Chunky Rock 1
  "M 10 50 L 50 10 L 120 20 L 180 70 L 150 120 L 170 180 L 90 190 L 30 150 Z",
  // Chunky Rock 2
  "M 30 30 L 100 10 L 180 50 L 160 100 L 190 150 L 120 180 L 40 160 L 10 100 Z",
  // Solid Blob 1
  "M 40 20 L 120 10 L 180 80 L 150 160 L 80 190 L 10 140 Z",
  // Solid Blob 2
  "M 10 80 L 60 20 L 150 40 L 190 100 L 140 180 L 50 160 Z",
  // Wedge Plate
  "M 20 40 L 140 20 L 180 140 L 90 180 L 40 130 Z",
  // Irregular Diamond
  "M 90 10 L 180 70 L 120 180 L 20 110 Z",
  // Angular Plate 1
  "M 20 20 L 160 30 L 180 160 L 60 190 Z",
  // Angular Plate 2
  "M 40 10 L 180 10 L 150 120 L 80 180 Z",
  // Geometric Shard
  "M 10 90 L 100 10 L 190 60 L 120 190 Z",
  // Trapezoidal Rock
  "M 60 20 L 140 20 L 180 160 L 20 160 Z"
];

// Unified very light gray tones to make the background subtle and soft
const BG_COLORS = [
  "#F3F4F6", "#F9FAFB", "#F4F4F5", "#FAFAFA", "#F8F9FA"
];

function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

// 10x6 layout grids (Only applies to the first 100vh / first 10 rows)
// 1 = Shape allowed, 0 = Shape hidden (Avoids main content)
const PAGE_LAYOUTS: Record<string, string[]> = {
  P1: [
    "110011", "110011", "100001", "100001", "100001", "100001", "100001", "110011", "111111", "111111",
  ],
  P2: [
    "110011", "100001", "000000", "000000", "000000", "000000", "000000", "000000", "100001", "110011",
  ],
  P3: [
    "111111", "100001", "000000", "000000", "000000", "000000", "000000", "000000", "100001", "111111",
  ],
  P4: [
    "110011", "100001", "000000", "000000", "000000", "000000", "000000", "000000", "100001", "110011",
  ],
  P5: [
    "111111", "110011", "100001", "100001", "100001", "100001", "100001", "110011", "111111", "111111",
  ],
  P6: [
    "110011", "100001", "100001", "000000", "000000", "000000", "000000", "100001", "110011", "111111",
  ],
  P7: [
    "000000", "000000", "000000", "100001", "100001", "100001", "100001", "100001", "111111", "111111",
  ],
  P8: [
    "111111", "110011", "100001", "100001", "100001", "100001", "100001", "100001", "110011", "111111",
  ],
  default: [
    "110011", "110011", "100001", "100001", "100001", "100001", "100001", "110011", "111111", "111111",
  ]
};

export default function GlobalBackground({ currentPage = "P1" }: { currentPage?: string }) {
  const layout = PAGE_LAYOUTS[currentPage] || PAGE_LAYOUTS.default;

  // We memoize the random generation so it doesn't flicker on re-renders, 
  // but we still want a gorgeous composition.
  const shapes = useMemo(() => {
    const rng = mulberry32(77777); 
    const generated: any[] = [];
    
    // We want highly varying sizes, but preventing overlaps.
    // Instead of a rigid grid, let's create large virtual 'blocks' down the page.
    // Left side panel and Right side panel.
    const TOTAL_PAGES = 8; // Roughly 800vh
    
    for (let page = 0; page < TOTAL_PAGES; page++) {
      // Very dense background
      const MAX_ATTEMPTS = 600; // try many times
      const TARGET_SHAPES = 35 + Math.floor(rng() * 10); 
      let placed = 0;
      
      for (let attempt = 0; attempt < MAX_ATTEMPTS && placed < TARGET_SHAPES; attempt++) {
        // Spread evenly across the width, not just edges
        // Vastly varying sizes: from small 4vw fragments to 16vw geometric planes
        const sizeVw = 4 + rng() * 12; 
        
        // Random placement across the screen
        const baseX = rng() * 100 - (sizeVw / 2); // Allow spilling off left/right
        const baseY = (page * 100) + (rng() * 100); 
        
        // Ensure strictly no overlap for clear separation
        let overlaps = false;
        for (const existing of generated) {
           const dx = (baseX + sizeVw/2) - (existing.x + existing.size/2);
           const dy = (baseY + sizeVw/2) - (existing.y + existing.size/2);
           const dist = Math.sqrt(dx*dx + dy*dy);
           // 1.05 multiplier guarantees no box overlaps and leaves comfortable gaps
           if (dist < (sizeVw/2 + existing.size/2) * 1.05) { 
             overlaps = true;
             break;
           }
        }
        
        if (!overlaps) {
          generated.push({
            id: `shape-${page}-${placed}`,
            x: baseX,
            y: baseY,
            size: sizeVw,
            path: CHUNKY_SHAPES[Math.floor(rng() * CHUNKY_SHAPES.length)],
            color: BG_COLORS[Math.floor(rng() * BG_COLORS.length)],
            rotation: rng() * 360,
            scaleX: rng() > 0.5 ? 1 : -1,
            scaleY: rng() > 0.5 ? 1 : -1,
            isStroke: false,
            opacity: 1, // Solid light gray background colors
            // Calculate which layout grid cell this corresponds to (0-9 rows, 0-5 cols)
            gridRow: Math.min(9, Math.max(0, Math.floor((baseY % 100) / 10))),
            gridCol: Math.min(5, Math.max(0, Math.floor(baseX / 16.66))),
          });
          placed++;
        }
      }
    }
    return generated;
  }, []);

  return (
    <div className="absolute inset-0 z-[0] pointer-events-none overflow-hidden">
      {shapes.map((el) => {
        // Is this shape's center allowed on the current page layout?
        const isLayoutActive = layout[el.gridRow] ? layout[el.gridRow][el.gridCol] === '1' : true;
        
        return (
          <div
            key={el.id}
            className="absolute flex items-center justify-center transition-opacity duration-1000 ease-in-out"
            style={{
              top: `${el.y}vh`,
              left: `${el.x}vw`,
              width: `${el.size}vw`,
              height: `${el.size}vw`,
              opacity: isLayoutActive ? el.opacity : 0,
            }}
          >
            <div
              className="w-full h-full"
              style={{
                transform: `rotate(${el.rotation}deg) scaleX(${el.scaleX}) scaleY(${el.scaleY})`,
              }}
            >
              <svg
                className="w-full h-full"
                viewBox="0 0 200 200"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid meet"
              >
                <path fill={el.color} d={el.path} />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}


