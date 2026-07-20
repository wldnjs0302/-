import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { Pencil, Eraser } from "lucide-react";
import { cn } from "../lib/utils";

interface HandwritingInputProps {
  onComplete: (signature: string) => void;
  placeholder?: string;
  className?: string;
}

export interface HandwritingInputRef {
  clear: () => void;
  getImageData: () => string;
}

const HandwritingInput = forwardRef<HandwritingInputRef, HandwritingInputProps>(({ onComplete, placeholder, className }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState<"draw" | "erase">("draw");
  const [hasContent, setHasContent] = useState(false);

  useImperativeHandle(ref, () => ({
    clear: () => {
      clear();
    },
    getImageData: () => {
      return canvasRef.current?.toDataURL() || "";
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        
        // No background fill to keep it transparent
        
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 16;
        ctx.lineCap = "square";
        ctx.lineJoin = "bevel";
      }
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = ('nativeEvent' in e && 'touches' in (e.nativeEvent as TouchEvent)) 
      ? (e.nativeEvent as TouchEvent).touches[0].clientX - rect.left 
      : ('clientX' in e ? e.clientX : (e as any).touches[0].clientX) - rect.left;
    
    // Simpler event handling for cross-platform
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    return { 
      x: clientX - rect.left, 
      y: clientY - rect.top 
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getPos(e);
    ctx.globalCompositeOperation = mode === "draw" ? "source-over" : "destination-out";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = mode === "draw" ? 16 : 40; // Thicker eraser
    ctx.lineCap = mode === "draw" ? "square" : "round";
    ctx.lineJoin = mode === "draw" ? "bevel" : "round";
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasContent(true);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      onComplete(canvasRef.current?.toDataURL() || "");
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasContent(false);
    onComplete("");
  };

  return (
    <div className={cn("relative group", className)}>
      {placeholder && !hasContent && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
          <span className="font-hand text-6xl tracking-widest text-gray-400">{placeholder}</span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="w-full h-full cursor-crosshair touch-none relative z-10"
      />
      <div className="absolute bottom-4 right-4 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => setMode("draw")} 
          className={cn("p-2 rounded-full border bg-white shadow-sm transition-colors", mode === "draw" ? "text-black border-black" : "text-gray-400")}
        >
          <Pencil size={16} />
        </button>
        <button 
          onClick={() => setMode("erase")} 
          className={cn("p-2 rounded-full border bg-white shadow-sm transition-colors", mode === "erase" ? "text-black border-black" : "text-gray-400")}
        >
          <Eraser size={16} />
        </button>
      </div>
    </div>
  );
});

export default HandwritingInput;
