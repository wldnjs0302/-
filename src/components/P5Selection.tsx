import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { ImageItem } from "../types";
import { cn } from "../lib/utils";
import { CustomButton } from "./CustomButton";
import { handleImageError } from "../utils/imageRetry";

interface P5SelectionProps {
  images: ImageItem[];
  onComplete: (selected: ImageItem[]) => void;
}

type FilterStage = 1 | 2 | 3;

export default function P5Selection({ images, onComplete }: P5SelectionProps) {
  const [stage, setStage] = useState<FilterStage>(1);
  const [currentPool, setCurrentPool] = useState<ImageItem[]>(images);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    if (stage === 1) {
      setCurrentPool(images);
    }
  }, [images, stage]);

  const stageConfig = {
    1: { target: 30, label: "마음에 드는 30개의 이미지를 골라보세요" },
    2: { target: 20, label: "마음에 드는 20개의 이미지를 골라보세요" },
    3: { target: 10, label: "마음에 드는 10개의 이미지를 골라보세요" },
  };

  const targetCount = stageConfig[stage].target;

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      if (newSelected.size < targetCount) {
        newSelected.add(id);
      }
    }
    setSelectedIds(newSelected);
  };

  const handleNext = () => {
    const nextPool = currentPool.filter(img => selectedIds.has(img.id));
    if (stage < 3) {
      setStage((stage + 1) as FilterStage);
      setCurrentPool(nextPool);
      setSelectedIds(new Set());
    } else {
      onComplete(nextPool);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-transparent select-none">
      {/* Central Interface (Perfectly Vertically Centered - Event penetrating) */}
      <div className="z-20 text-center flex flex-col items-center justify-center gap-4 py-8 pointer-events-none">
        <div className="flex flex-col items-center pointer-events-auto">
          <span className="text-black font-dandan text-4xl md:text-5xl tabular-nums tracking-wide">
            {selectedIds.size} <span className="text-black/30 text-3xl font-normal">/</span> {targetCount}
          </span>
          <p className="text-black/60 font-dandan tracking-wide text-2xl mt-1.5">{stageConfig[stage].label}</p>
        </div>
        
        <CustomButton
          onClick={handleNext}
          disabled={selectedIds.size < targetCount}
          className={cn(
            "px-12 h-[54px] text-sm font-bold tracking-widest uppercase transition-all duration-300 pointer-events-auto",
            selectedIds.size < targetCount 
              ? "opacity-30 cursor-not-allowed filter grayscale" 
              : "opacity-100"
          )}
        >
          넘어가기
        </CustomButton>

        {/* Circular Indicators */}
        <div className="flex justify-center gap-1.5 mt-1 pointer-events-auto">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all duration-300",
                stage === s ? "bg-black scale-125" : "bg-black/10"
              )} 
            />
          ))}
        </div>
      </div>

      {/* Orbiting Images */}
      <div className="absolute inset-0 flex items-center justify-center animate-[spin_80s_linear_infinite] hover:[animation-play-state:paused] pointer-events-none group/orbit">
        {currentPool.map((img, idx) => {
          const total = currentPool.length;
          const angle = (idx / total) * 360;
          const isSelected = selectedIds.has(img.id);
          
          const isLargePool = currentPool.length >= 40;
          const isMediumPool = currentPool.length >= 20 && currentPool.length < 40;

          // Expand the orbital radius structurally to completely prevent overlapping and keep hover spaces clean
          const radius = window.innerWidth < 768 
            ? (isLargePool ? 160 : isMediumPool ? 130 : 100) 
            : (isLargePool ? 340 : isMediumPool ? 280 : 220);

          // Staggered rings with a small offset to allow slight, beautiful overlap as requested
          let radiusOffset = 0;
          if (isLargePool) {
            radiusOffset = ((idx % 3) - 1) * 30; // Subtle 3 concentric rings: -30px, 0px, +30px
          } else if (isMediumPool) {
            radiusOffset = (idx % 2 === 0 ? -20 : 20); // Subtle 2 concentric rings: -20px, +20px
          } else {
            radiusOffset = (idx % 2 === 0 ? -15 : 15);
          }
          const baseRadius = radius + radiusOffset;

          // Stable center: We do NOT shift the coordinates on hover.
          // This keeps the center stationary, completely solving the hover-leave bouncing loop!
          const currentRadius = baseRadius;

          // Dynamically scale image size so dense groups fit cleanly and selected groups have room to look detailed
          const sizeClass = isLargePool 
            ? "w-[40px] h-[40px] md:w-[56px] md:h-[56px]" 
            : isMediumPool 
              ? "w-[56px] h-[56px] md:w-[76px] md:h-[76px]" 
              : "w-[72px] h-[72px] md:w-[100px] md:h-[100px]";

          // Pre-calculate exact polar coordinate centers so they don't jump around on state changes
          const rad = (angle * Math.PI) / 180;
          const targetX = Math.cos(rad) * currentRadius;
          const targetY = Math.sin(rad) * currentRadius;

          const isHovered = hoveredId === img.id;

          return (
            <motion.div
              key={img.id}
              className={cn(
                "absolute pointer-events-auto cursor-pointer flex items-center justify-center bg-transparent rounded-full",
                sizeClass
              )}
              style={{
                x: targetX,
                y: targetY,
                rotate: angle, // Fixed angle rotation during parent layout spin
                zIndex: isHovered ? 150 : (isSelected ? 30 : 10), // Hovered item is always cleanly on top
              }}
              onMouseEnter={() => setHoveredId(img.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => toggleSelect(img.id)}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: 1, 
                // Keep outer wrapper scale and position stable so hit testing is perfectly stationary
                scale: 1.0, 
                x: targetX,
                y: targetY
              }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              exit={{ opacity: 0, scale: 0 }}
            >
              {/* Stable, stationary transparent hitbox that never shifts, keeping hover state perfectly locked */}
              <div 
                className="absolute inset-0 bg-transparent pointer-events-auto rounded-full z-20" 
              />

              <motion.div
                animate={{
                  // The inner container shifts outward slightly in X (aligned with rotated parent angle) and scales moderately
                  scale: isHovered ? 1.6 : (isSelected ? 1.1 : 1.0),
                  x: isHovered ? 10 : 0,
                }}
                transition={{ type: "spring", stiffness: 220, damping: 24 }}
                className="flex items-center justify-center animate-none z-10 w-full h-full"
              >
                <div className="animate-[spin_80s_linear_infinite] group-hover/orbit:[animation-play-state:paused] flex items-center justify-center w-full h-full" style={{ animationDirection: 'reverse' }}>
                  <div
                    className={cn(
                      "relative flex items-center justify-center transition-all duration-300 bg-transparent border-0 outline-none focus:outline-none w-full h-full",
                      sizeClass,
                      isSelected 
                        ? "opacity-100 filter drop-shadow-[0_16px_32px_rgba(0,0,0,0.30)] scale-110" 
                        : "opacity-45 hover:opacity-100 filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.12)] hover:drop-shadow-[0_12px_24px_rgba(0,0,0,0.25)]"
                    )}
                    style={{ 
                      transform: `rotate(${-angle}deg)` // Rotate img inversely to keep it perfectly upright
                    }} 
                  >
                    {/* Elegant Minimal Checkmark Badge Overlay for Selected Items */}
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 bg-black text-white w-5 h-5 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-40 transform scale-110 inline-flex">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    
                    <img 
                      src={img.url} 
                      referrerPolicy="no-referrer"
                      loading="eager"
                      className="w-full h-full object-contain pointer-events-none select-none" 
                      alt="" 
                      onError={handleImageError}
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
