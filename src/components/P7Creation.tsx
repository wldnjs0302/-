import React, { useState, useRef, useEffect, MouseEvent as ReactMouseEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ImageItem } from "../types";
import { ArrowRight, Pencil, Eraser, Check, Trash2, Plus, Minus, Hand, MoveHorizontal, RotateCcw, RotateCw, Undo, Redo } from "lucide-react";
import { cn } from "../lib/utils";
import { CustomButton } from "./CustomButton";
import { handleImageError } from "../utils/imageRetry";

interface P7CreationProps {
  selectedImages: ImageItem[];
  middleName: string;
  userName: string;
  onComplete: (creationUrl: string, lastNameSignature: string) => void;
}

const BODY_SHAPES = [
  {
    id: 'b1',
    name: '사유하는 선',
    description: '내면을 채우는 균형의 감각',
    imgUrl: '/body1.png',
    renderSvg: () => (
      <img src="/body1.png" className="w-full h-full object-contain pointer-events-none select-none" alt="사유하는 선" referrerPolicy="no-referrer" />
    )
  },
  {
    id: 'b2',
    name: '흐르는 곡선',
    description: '물결치듯 유연한 사고',
    imgUrl: '/body2.png',
    renderSvg: () => (
      <img src="/body2.png" className="w-full h-full object-contain pointer-events-none select-none" alt="흐르는 곡선" referrerPolicy="no-referrer" />
    )
  },
  {
    id: 'b3',
    name: '기하학적 블록',
    description: '단단하고 곧은 의지의 기둥',
    imgUrl: '/body3.png',
    renderSvg: () => (
      <img src="/body3.png" className="w-full h-full object-contain pointer-events-none select-none" alt="기하학적 블록" referrerPolicy="no-referrer" />
    )
  },
  {
    id: 'b4',
    name: '유기적 파동',
    description: '리드미컬하고 다채로운 호기심',
    imgUrl: '/body4.png',
    renderSvg: () => (
      <img src="/body4.png" className="w-full h-full object-contain pointer-events-none select-none" alt="유기적 파동" referrerPolicy="no-referrer" />
    )
  },
  {
    id: 'b5',
    name: '사유자의 무브',
    description: '안정적 궤도 속 깊은 관조',
    imgUrl: '/body5.png',
    renderSvg: () => (
      <img src="/body5.png" className="w-full h-full object-contain pointer-events-none select-none" alt="사유자의 무브" referrerPolicy="no-referrer" />
    )
  }
];

const SILHOUETTES = [
  { id: 's1', url: '/shape1.png', headTop: -104 },
  { id: 's2', url: '/shape2.png', headTop: -88 },
  { id: 's3', url: '/shape3.png', headTop: -60 },
  { id: 's4', url: '/shape4.png', headTop: -90 },
  { id: 's5', url: '/shape5.png', headTop: -104, scale: 0.94 },
  { id: 's6', url: '/shape6.png', headTop: -88 },
  { id: 's7', url: '/shape7.png', headTop: -98 },
  { id: 's8', url: '/shape8.png', headTop: -88 },
  { id: 's9', url: '/shape9.png', headTop: -90 },
  { id: 's10', url: '/shape10.png', headTop: -95 },
];

const DECO_INSET = 16; // 16px inset gives perfect head proportions and allows decorating down to the body connection

const COLORS = ["#FF6B00", "#FF0000", "#00FF00", "#0000FF", "#000000", "#FFFFFF"];

const STICKER_CATEGORIES = [
  { 
    id: 'sensory', 
    icon: '👁️', 
    label: '감각', 
    items: ['👁️', '👀', '👄', '👅', '👃', '👂', '🤚', '🧠', '🦴', '🦷', '👣', '🩸', '🕶️', '👓'] 
  },
  { 
    id: 'graphic', 
    icon: '✨', 
    label: '키치', 
    items: ['🌀', '🌟', '✨', '🔥', '💧', '⚡', '🌈', '🍒', '🍀', '🛸', '🎈', '🎨', '🪐', '👾', '🚀', '🔮'] 
  },
  { 
    id: 'symbol', 
    icon: '🗝️', 
    label: '상징', 
    items: ['🧬', '💿', '🗝️', '💎', '🕯️', '📌', '⚓', '🎲', '🎡', '🎭', '♟️', '🧱', '🧿', '🧩', '🧲', '🔔'] 
  },
  { 
    id: 'deco', 
    icon: '🖤', 
    label: '데코', 
    items: ['🖤', '❤️', '🔥', '💤', '💭', '🗯️', '💢', '💘', '🎀', '🎁', '🎉', '🧸', '💌', '🌸', '🌹'] 
  }
];

interface PlacedItem {
  id: string;
  type: 'image' | 'sticker';
  src?: string;
  content?: string;
  x: number;
  y: number;
  scale: number;
  rotate?: number;
}

export default function P7Creation({ selectedImages, middleName, userName, onComplete }: P7CreationProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [profileType, setProfileType] = useState(0);
  const [bodyType, setBodyType] = useState(0);
  const targetProfileTypeRef = useRef<number | null>(null);

  const selectProfileType = (index: number) => {
    targetProfileTypeRef.current = index;
    setProfileType(index);
  };

  const targetBodyTypeRef = useRef<number | null>(null);

  const selectBodyType = (index: number) => {
    targetBodyTypeRef.current = index;
    setBodyType(index);
  };

  const getKoreanMiddleName = (name: string): string => {
    if (!name) return "조화";
    const upper = name.toUpperCase();
    if (upper === "HARMONIOUS") return "조화";
    if (/[a-zA-Z]/.test(name)) {
      if (upper.includes("OBJECT") || upper.includes("TARGET")) return "대상";
      if (upper.includes("MEANING")) return "의미";
      if (upper.includes("SENSATION") || upper.includes("SENSORY")) return "감각";
      if (upper.includes("INTUITION")) return "직관";
      if (upper.includes("TEXTURE")) return "질감";
      if (upper.includes("CLARITY") || upper.includes("CLEAR")) return "선명";
      if (upper.includes("COLOR")) return "색감";
      if (upper.includes("METHOD")) return "방법론";
      if (upper.includes("TASTE") || upper.includes("PREFERENCE")) return "취향";
      if (upper.includes("SHAPE") || upper.includes("FORM")) return "형태";
      return "조화"; 
    }
    return name;
  };
  
  // Customization state
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [tool, setTool] = useState<'move' | 'draw' | 'erase'>('move');
  const [color, setColor] = useState("#FF6B00");
  const [activeStickerTab, setActiveStickerTab] = useState(0);
  
  // Undo/Redo history states
  interface HistoryEntry {
    placedItems: PlacedItem[];
    canvasDrawing: string | null;
  }
  const [history, setHistory] = useState<HistoryEntry[]>([{ placedItems: [], canvasDrawing: null }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Drawing state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Final Profile 
  const [profileName, setProfileName] = useState("");
  const [zoom, setZoom] = useState(0.6);
  const [showCardGuide, setShowCardGuide] = useState(true);
  const [drawingDataUrl, setDrawingDataUrl] = useState<string | null>(null);
  const step4PreviewRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const isDraggingItem = useRef(false);
  const silhouettesScrollRef = useRef<HTMLDivElement>(null);
  const bodiesScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step === 2 && silhouettesScrollRef.current) {
      const container = silhouettesScrollRef.current;
      const activeChild = container.children[profileType] as HTMLElement;
      if (activeChild) {
        const containerCenter = container.scrollLeft + container.clientWidth / 2;
        const childCenter = activeChild.offsetLeft + activeChild.clientWidth / 2;
        if (Math.abs(containerCenter - childCenter) > 20) {
          activeChild.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center"
          });
        }
      }
    }
  }, [profileType, step]);

  useEffect(() => {
    if (step === 4 && bodiesScrollRef.current) {
      const container = bodiesScrollRef.current;
      const activeChild = container.children[bodyType] as HTMLElement;
      if (activeChild) {
        const containerCenter = container.scrollLeft + container.clientWidth / 2;
        const childCenter = activeChild.offsetLeft + activeChild.clientWidth / 2;
        if (Math.abs(containerCenter - childCenter) > 20) {
          activeChild.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center"
          });
        }
      }
    }
  }, [bodyType, step]);

  const handleScroll = () => {
    if (!silhouettesScrollRef.current) return;
    const container = silhouettesScrollRef.current;
    
    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let minDistance = Infinity;
    
    const children = Array.from(container.children) as HTMLElement[];
    children.forEach((child, index) => {
      const childCenter = child.offsetLeft + child.clientWidth / 2;
      const distance = Math.abs(containerCenter - childCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });
    
    if (targetProfileTypeRef.current !== null) {
      if (closestIndex === targetProfileTypeRef.current) {
        targetProfileTypeRef.current = null;
      }
      return;
    }
    
    if (closestIndex !== profileType) {
      setProfileType(closestIndex);
    }
  };

  const handleBodiesScroll = () => {
    if (!bodiesScrollRef.current) return;
    const container = bodiesScrollRef.current;
    
    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let minDistance = Infinity;
    
    const children = Array.from(container.children) as HTMLElement[];
    children.forEach((child, index) => {
      const childCenter = child.offsetLeft + child.clientWidth / 2;
      const distance = Math.abs(containerCenter - childCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });
    
    if (targetBodyTypeRef.current !== null) {
      if (closestIndex === targetBodyTypeRef.current) {
        targetBodyTypeRef.current = null;
      }
      return;
    }
    
    if (closestIndex !== bodyType) {
      setBodyType(closestIndex);
    }
  };

  // Custom pointer drag state
  interface DragState {
    itemId: string;
    startX: number;
    startY: number;
    itemStartX: number;
    itemStartY: number;
  }
  const [dragState, setDragState] = useState<DragState | null>(null);

  const restoreCanvas = (dataUrl: string | null) => {
    if (!canvasRef.current || !ctxRef.current) return;
    const ctx = ctxRef.current;
    const cw = 380 - DECO_INSET * 2;
    const ch = 540 - DECO_INSET * 2;
    ctx.clearRect(0, 0, cw, ch);
    if (dataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, cw, ch);
      };
      img.src = dataUrl;
    }
  };

  useEffect(() => {
    if (step === 3 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const cw = 380 - DECO_INSET * 2;
      const ch = 540 - DECO_INSET * 2;
      if (ctx) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctxRef.current = ctx;
        
        // Restore canvas from current history index if there's any drawing
        const entry = history[historyIndex];
        if (entry && entry.canvasDrawing) {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, cw, ch);
            ctx.drawImage(img, 0, 0, cw, ch);
          };
          img.src = entry.canvasDrawing;
        }
      }
    }
  }, [step, canvasRef.current]);

  // Drawing Handlers
  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool === 'move' || !ctxRef.current) return;
    isDrawing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    const cw = 380 - DECO_INSET * 2;
    const ch = 540 - DECO_INSET * 2;
    const x = (e.clientX - rect.left) * (cw / rect.width);
    const y = (e.clientY - rect.top) * (ch / rect.height);
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
    ctxRef.current.strokeStyle = tool === 'erase' ? "#FFFFFF" : color;
    if (tool === 'erase') {
        ctxRef.current.globalCompositeOperation = 'destination-out';
        ctxRef.current.lineWidth = 20;
    } else {
        ctxRef.current.globalCompositeOperation = 'source-over';
        ctxRef.current.lineWidth = 4;
    }
    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || tool === 'move' || !ctxRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cw = 380 - DECO_INSET * 2;
    const ch = 540 - DECO_INSET * 2;
    const x = (e.clientX - rect.left) * (cw / rect.width);
    const y = (e.clientY - rect.top) * (ch / rect.height);
    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
    // Start a new path from here so strokes are connected seamlessly but without accumulating
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
  };

  const endDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !ctxRef.current) return;
    isDrawing.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    ctxRef.current.closePath();
    ctxRef.current.globalCompositeOperation = 'source-over';
    
    // Save drawing stroke to unified history
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL();
      setHistory(prevHistory => {
        const nextHistory = prevHistory.slice(0, historyIndex + 1);
        const newEntry: HistoryEntry = {
          placedItems: [...placedItems],
          canvasDrawing: dataUrl
        };
        setHistoryIndex(nextHistory.length);
        return [...nextHistory, newEntry];
      });
    }
  };

  const clearCanvas = () => {
    if (canvasRef.current && ctxRef.current) {
      const cw = 380 - DECO_INSET * 2;
      const ch = 540 - DECO_INSET * 2;
      ctxRef.current.clearRect(0, 0, cw, ch);
      setDrawingDataUrl(null);
      
      // Save clear state to history
      setHistory(prevHistory => {
        const nextHistory = prevHistory.slice(0, historyIndex + 1);
        const newEntry: HistoryEntry = {
          placedItems: [...placedItems],
          canvasDrawing: null
        };
        setHistoryIndex(nextHistory.length);
        return [...nextHistory, newEntry];
      });
    }
  };

  // State modification wrappers that properly record history for undo/redo
  const addPlacedItem = (newItem: PlacedItem) => {
    setPlacedItems(prev => {
      const updated = [...prev, newItem];
      const nextHistory = history.slice(0, historyIndex + 1);
      const currentDrawing = nextHistory[nextHistory.length - 1]?.canvasDrawing || null;
      setHistory([...nextHistory, { placedItems: updated, canvasDrawing: currentDrawing }]);
      setHistoryIndex(nextHistory.length);
      return updated;
    });
  };

  const deletePlacedItem = (id: string) => {
    setPlacedItems(prev => {
      const updated = prev.filter(item => item.id !== id);
      const nextHistory = history.slice(0, historyIndex + 1);
      const currentDrawing = nextHistory[nextHistory.length - 1]?.canvasDrawing || null;
      setHistory([...nextHistory, { placedItems: updated, canvasDrawing: currentDrawing }]);
      setHistoryIndex(nextHistory.length);
      return updated;
    });
    if (selectedItemId === id) setSelectedItemId(null);
  };

  const updateItemScale = (id: string, delta: number) => {
    setPlacedItems(prev => {
      const updated = prev.map(item => {
        if (item.id === id) {
          const newScale = Math.max(0.2, Math.min(5, item.scale + delta));
          return { ...item, scale: newScale };
        }
        return item;
      });
      const nextHistory = history.slice(0, historyIndex + 1);
      const currentDrawing = nextHistory[nextHistory.length - 1]?.canvasDrawing || null;
      setHistory([...nextHistory, { placedItems: updated, canvasDrawing: currentDrawing }]);
      setHistoryIndex(nextHistory.length);
      return updated;
    });
  };

  const updateItemRotation = (id: string, degrees: number) => {
    setPlacedItems(prev => {
      const updated = prev.map(item => {
        if (item.id === id) {
          const newRotate = ((item.rotate || 0) + degrees) % 360;
          return { ...item, rotate: newRotate };
        }
        return item;
      });
      const nextHistory = history.slice(0, historyIndex + 1);
      const currentDrawing = nextHistory[nextHistory.length - 1]?.canvasDrawing || null;
      setHistory([...nextHistory, { placedItems: updated, canvasDrawing: currentDrawing }]);
      setHistoryIndex(nextHistory.length);
      return updated;
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setPlacedItems(history[prevIndex].placedItems);
      setSelectedItemId(null);
      restoreCanvas(history[prevIndex].canvasDrawing);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setPlacedItems(history[nextIndex].placedItems);
      setSelectedItemId(null);
      restoreCanvas(history[nextIndex].canvasDrawing);
    }
  };

  // Pixel-perfect precision custom drag handlers for items already on canvas
  const handlePointerDown = (e: React.PointerEvent, item: PlacedItem) => {
    if (tool !== 'move') return;
    e.stopPropagation();
    setSelectedItemId(item.id);
    
    setDragState({
      itemId: item.id,
      startX: e.clientX,
      startY: e.clientY,
      itemStartX: item.x,
      itemStartY: item.y
    });
    
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;
    e.stopPropagation();
    
    const dx = (e.clientX - dragState.startX) / zoom;
    const dy = (e.clientY - dragState.startY) / zoom;
    
    setPlacedItems(prev => prev.map(item => {
      if (item.id === dragState.itemId) {
        return {
          ...item,
          x: dragState.itemStartX + dx,
          y: dragState.itemStartY + dy
        };
      }
      return item;
    }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragState) return;
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {}
    setDragState(null);
    
    // Save state on pointer up
    setPlacedItems(prev => {
      const nextHistory = history.slice(0, historyIndex + 1);
      const currentDrawing = nextHistory[nextHistory.length - 1]?.canvasDrawing || null;
      setHistory([...nextHistory, { placedItems: prev, canvasDrawing: currentDrawing }]);
      setHistoryIndex(nextHistory.length);
      return prev;
    });
  };

  const handleCompleteGeneration = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const multiplier = 4; // Ultra-high resolution multiplier
      const headWidth = 380 * multiplier;
      const headHeight = 540 * multiplier;
      const scaleFactor = multiplier;
      const headTop = SILHOUETTES[profileType]?.headTop ?? -80;

      // 1. Create a temporary canvas for the customized Head (at high-res scale to eliminate artifacts and blur)
      const headCanvas = document.createElement("canvas");
      headCanvas.width = headWidth;
      headCanvas.height = headHeight;
      const headCtx = headCanvas.getContext("2d");
      if (!headCtx) throw new Error("Could not get head canvas context");

      // Instead of drawing a path, load the shape image
      const shapeImg = new Image();
      let shapeSrc = SILHOUETTES[profileType].url;
      if (shapeSrc.startsWith("/")) {
        shapeSrc = window.location.origin + shapeSrc;
      }
      if (!shapeSrc.startsWith("data:")) {
        shapeImg.crossOrigin = "anonymous";
      }
      await new Promise((resolve) => {
        shapeImg.onload = resolve;
        shapeImg.onerror = () => {
          shapeImg.src = "https://placehold.co/380x540/e5e7eb/a3a3a3?text=UPLOAD+SHAPE.PNG";
        };
        shapeImg.src = shapeSrc;
      });
      
      const drawShapeAtInset = (customInset: number, targetCtx: CanvasRenderingContext2D) => {
        const scaledInset = customInset * scaleFactor;
        const availW = headWidth - scaledInset * 2;
        const availH = headHeight - scaledInset * 2;
        const imgRatio = shapeImg.width / shapeImg.height;
        const boxRatio = availW / availH;
        let dw = availW, dh = availH;
        if (imgRatio > boxRatio) {
          dh = availW / imgRatio;
        } else {
          dw = availH * imgRatio;
        }
        const dx = scaledInset + (availW - dw) / 2;
        const dy = scaledInset + (availH - dh) / 2;
        targetCtx.drawImage(shapeImg, dx, dy, dw, dh);
      };

      // Clear headCtx first to prevent leftover artifacts
      headCtx.clearRect(0, 0, headWidth, headHeight);

      const silScale = SILHOUETTES[profileType]?.scale ?? 1;
      if (silScale !== 1) {
        headCtx.translate(headWidth / 2, headHeight / 2);
        headCtx.scale(silScale, silScale);
        headCtx.translate(-headWidth / 2, -headHeight / 2);
      }

      // Draw normal-sized gray silhouette using DECO_INSET
      drawShapeAtInset(DECO_INSET, headCtx);
      headCtx.globalCompositeOperation = "source-in";
      headCtx.fillStyle = "#D9D9D9";
      headCtx.fillRect(0, 0, headWidth, headHeight);
      headCtx.globalCompositeOperation = "source-over"; // Reset to normal

      // Create a temporary canvas to draw and mask all decorations (images, stickers, drawings)
      const decCanvas = document.createElement("canvas");
      decCanvas.width = headWidth;
      decCanvas.height = headHeight;
      const decCtx = decCanvas.getContext("2d");
      if (decCtx) {
        if (silScale !== 1) {
          decCtx.translate(headWidth / 2, headHeight / 2);
          decCtx.scale(silScale, silScale);
          decCtx.translate(-headWidth / 2, -headHeight / 2);
        }
        decCtx.save();
        decCtx.beginPath();
        const safeLeft = 17.2 * scaleFactor;
        const safeRight = (380 - 17.2) * scaleFactor;
        const safeTop = -headTop * scaleFactor;
        const safeBottom = (370 - headTop) * scaleFactor;
        decCtx.rect(safeLeft, safeTop, safeRight - safeLeft, safeBottom - safeTop);
        decCtx.clip();

        decCtx.globalCompositeOperation = "source-over";
        
        // A. Draw decoration images
        const images = placedItems.filter(p => p.type === 'image');
        for (const item of images) {
          if (!item.src) continue;
          const img = new Image();
          let imgSrc = item.src;
          if (imgSrc.startsWith("/")) {
            imgSrc = window.location.origin + imgSrc;
          }
          if (!imgSrc.startsWith("data:")) {
            img.crossOrigin = "anonymous";
          }
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
            img.src = imgSrc;
          });
          
          if (img.width > 0 && img.height > 0) {
            decCtx.save();
            decCtx.translate(headWidth / 2 + item.x * scaleFactor, headHeight / 2 + item.y * scaleFactor);
            decCtx.scale(item.scale * scaleFactor, item.scale * scaleFactor);
            decCtx.rotate((item.rotate || 0) * Math.PI / 180);
            const imgRatio = img.width / img.height;
            let dw = 96, dh = 96;
            if (imgRatio > 1) {
              dh = 96 / imgRatio;
            } else {
              dw = 96 * imgRatio;
            }
            decCtx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
            decCtx.restore();
          }
        }

        // Restore clipping state so destination-in is applied to the entire silhouette
        decCtx.restore();

        // Apply silhouette mask to images using destination-in
        decCtx.globalCompositeOperation = "destination-in";
        drawShapeAtInset(DECO_INSET, decCtx);

        // Reset to normal composition to draw stickers unclipped
        decCtx.globalCompositeOperation = "source-over";

        // B. Draw stickers
        const stickers = placedItems.filter(p => p.type === 'sticker');
        decCtx.textAlign = "center";
        decCtx.textBaseline = "middle";
        for (const item of stickers) {
          if (!item.content) continue;
          decCtx.save();
          decCtx.translate(headWidth / 2 + item.x * scaleFactor, headHeight / 2 + item.y * scaleFactor);
          decCtx.scale(item.scale * scaleFactor, item.scale * scaleFactor);
          decCtx.rotate((item.rotate || 0) * Math.PI / 180);
          decCtx.font = `${Math.round(60)}px sans-serif`;
          decCtx.fillText(item.content, 0, 0);
          decCtx.restore();
        }
      }

      // Draw the masked decorations canvas on top of the main headCanvas
      headCtx.save();
      headCtx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform temporarily so decCanvas isn't scaled twice
      headCtx.drawImage(decCanvas, 0, 0);
      headCtx.restore();
      headCtx.globalCompositeOperation = "source-over";

      // Draw the drawing canvas layer directly onto headCtx (clipped by the rectangular safe area only, NOT masked by silhouette)
      headCtx.save();
      headCtx.beginPath();
      const drawSafeLeft = 17.2 * scaleFactor;
      const drawSafeRight = (380 - 17.2) * scaleFactor;
      const drawSafeTop = -headTop * scaleFactor;
      const drawSafeBottom = (370 - headTop) * scaleFactor;
      headCtx.rect(drawSafeLeft, drawSafeTop, drawSafeRight - drawSafeLeft, drawSafeBottom - drawSafeTop);
      headCtx.clip();

      if (drawingDataUrl) {
         const drawImg = new Image();
         await new Promise<void>((resolve) => {
           drawImg.onload = () => resolve();
           drawImg.onerror = () => resolve();
           drawImg.src = drawingDataUrl;
         });
         const scaledInset = DECO_INSET * scaleFactor;
         const drawW = (380 - DECO_INSET * 2) * scaleFactor;
         const drawH = (540 - DECO_INSET * 2) * scaleFactor;
         headCtx.drawImage(drawImg, scaledInset, scaledInset, drawW, drawH);
      } else if (canvasRef.current) {
         const scaledInset = DECO_INSET * scaleFactor;
         const drawW = (380 - DECO_INSET * 2) * scaleFactor;
         const drawH = (540 - DECO_INSET * 2) * scaleFactor;
         headCtx.drawImage(canvasRef.current, scaledInset, scaledInset, drawW, drawH);
      }
      headCtx.restore();

      // 2. Create the final high-resolution composite canvas matching exactly the Step 5 card aspect ratio (320x500)
      const finalCanvas = document.createElement("canvas");
      const width = 320;
      const height = 500;
      finalCanvas.width = width * multiplier;
      finalCanvas.height = height * multiplier;
      const ctx = finalCanvas.getContext("2d");
      if (!ctx) throw new Error("Could not get 2d context");
      
      // Scale up for high res
      ctx.scale(multiplier, multiplier);

      // Load Body Shape first
      const bodyImg = new Image();
      let bodySrc = BODY_SHAPES[bodyType].imgUrl;
      if (bodySrc.startsWith("/")) {
        bodySrc = window.location.origin + bodySrc;
      }
      if (!bodySrc.startsWith("data:")) {
        bodyImg.crossOrigin = "anonymous";
      }
      await new Promise<void>((resolve) => {
        bodyImg.onload = () => resolve();
        bodyImg.onerror = () => resolve();
        bodyImg.src = bodySrc;
      });

      // Draw customized Head & Body onto finalCanvas with exact Step 5 scaling, horizontal offset, and top shift
      ctx.save();
      const cardScale = 500 / 540; // ~0.925925925
      const cardXOffset = (320 - 380 * cardScale) / 2; // ~-15.925925925
      ctx.translate(cardXOffset, 0);
      ctx.scale(cardScale, cardScale);
      
      // Draw headCanvas of logical size 380x540 at y = headTop
      ctx.drawImage(headCanvas, 0, headTop, 380, 540);

      // Draw Body Shape onto finalCanvas inside the same 380x540 coordinate space (matching step 5 layout perfectly)
      ctx.drawImage(bodyImg, 135, 320, 110, 110);
      ctx.restore();

      const dataUrl = finalCanvas.toDataURL("image/png");
      onComplete(dataUrl, profileName || "스탠딩 맨");
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Render
  const headTop = SILHOUETTES[profileType]?.headTop ?? -80;

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 text-black select-none overflow-hidden relative">
      <AnimatePresence mode="wait">
        
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center">
            
            <h2 className="relative z-50 text-center whitespace-nowrap text-3xl md:text-4xl font-normal font-dandan tracking-wide text-black drop-shadow-md">이제 나의 이미지를 생성해 볼 차례예요!</h2>
            
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
              {selectedImages.map((img, i) => {
                const angle = (i / selectedImages.length) * Math.PI * 2;
                const radius = window.innerWidth < 768 ? 180 : 360;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                return (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1, 
                      x,
                      y,
                    }}
                    transition={{ delay: i * 0.1, type: "spring" }}
                    className="absolute pointer-events-auto"
                    style={{ 
                      width: '7rem', 
                      height: '7rem',
                      marginLeft: '-3.5rem',
                      marginTop: '-3.5rem'
                    }}
                  >
                    <img 
                      src={img.url} 
                      loading="lazy" 
                      decoding="async" 
                      draggable={false} 
                      referrerPolicy="no-referrer" 
                      className="w-full h-full object-contain drop-shadow-xl select-none" 
                      alt="" 
                      onError={handleImageError}
                    />
                  </motion.div>
                );
              })}
            </div>

            <CustomButton
              onClick={() => setStep(2)}
              variant="secondary"
              className="absolute bottom-12 z-50 px-12 h-[54px] text-sm font-bold tracking-widest uppercase"
            >
              넘어가기
            </CustomButton>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-4xl flex flex-col items-center">
            <h2 className="text-4xl font-normal font-dandan mb-8 tracking-wide">나의 얼굴 모양을 골라보세요!</h2>
            
              <div className="relative w-full max-w-[100vw] sm:max-w-3xl mx-auto flex flex-col items-center">
              
              <div ref={silhouettesScrollRef} onScroll={handleScroll} className="flex w-full overflow-x-auto gap-6 sm:gap-10 py-10 px-[30%] items-center no-scrollbar snap-x snap-mandatory relative z-10" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {SILHOUETTES.map((s, i) => (
                  <motion.div 
                    key={s.id}
                    onClick={() => selectProfileType(i)}
                    className={cn(
                      "cursor-pointer transition-all shrink-0 relative snap-center",
                      profileType === i ? "scale-110 z-10" : "opacity-50 hover:opacity-80 scale-90"
                    )}
                  >
                    <img 
                      src={s.url} 
                      className="w-40 h-56 md:w-56 md:h-72 object-contain pointer-events-none" 
                      alt={`Profile Shape ${i + 1}`}
                      style={{
                        filter: profileType === i ? 'drop-shadow(0px 10px 20px rgba(255, 107, 0, 0.4))' : 'grayscale(100%) opacity(0.5)',
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3C/svg%3E";
                      }}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Pagination Dots */}
              <div className="flex items-center justify-center gap-3.5 mt-4 z-20 relative">
                {SILHOUETTES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => selectProfileType(i)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300 cursor-pointer",
                      profileType === i 
                        ? "bg-[#FF6B00] scale-125 shadow-[0_0_8px_rgba(255,107,0,0.6)]" 
                        : "bg-gray-300 hover:bg-gray-400 hover:scale-110"
                    )}
                    aria-label={`Profile type ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            <CustomButton
              onClick={() => setStep(3)}
              variant="secondary"
              className="mt-12 px-12 h-[54px] text-sm font-bold tracking-widest uppercase z-10"
            >
              넘어가기
            </CustomButton>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <h2 className="absolute top-[64px] md:top-[128px] left-1/2 -translate-x-1/2 text-center whitespace-nowrap font-dandan font-normal text-2xl md:text-3xl z-50 tracking-wide text-black drop-shadow-md shrink-0">나만의 프로필을 만들어보세요!</h2>
            
            <div className="w-full max-w-[1400px] gap-8 absolute inset-0 mx-auto flex items-center justify-center -translate-y-4 md:-translate-y-8">
              
              {/* Floating Tools Panel */}
              <div className="absolute left-2 md:left-6 xl:left-10 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-[100] w-[130px] pointer-events-auto items-center">
                
                {/* Top outside icons */}
                <div className="flex gap-3 items-center justify-center p-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm border border-gray-100 mb-1">
                  <button onClick={() => setTool('move')} className={cn("transition-transform hover:scale-110", tool === 'move' ? "text-black" : "text-gray-400")} title="이동 및 변형">
                    <Hand size={24} strokeWidth={2.5} />
                  </button>
                  <div className="w-[1.5px] h-4 bg-gray-300 rounded-full" />
                  <button onClick={() => setTool('draw')} className={cn("transition-transform hover:scale-110", tool === 'draw' ? "text-black" : "text-gray-400")} title="펜 그리기">
                     <Pencil size={24} strokeWidth={2.5} className="-rotate-90" />
                  </button>
                  <div className="w-[1.5px] h-4 bg-gray-300 rounded-full" />
                  <button onClick={() => setTool('erase')} className={cn("transition-transform hover:scale-110", tool === 'erase' ? "text-red-500" : "text-gray-400")} title="그림 일부 지우기">
                     <Eraser size={24} strokeWidth={2.5} />
                  </button>
                  <div className="w-[1.5px] h-4 bg-gray-300 rounded-full" />
                  <button onClick={clearCanvas} className="transition-transform hover:scale-110 text-gray-400 hover:text-red-500" title="그림 전체 지우기">
                     <Trash2 size={20} strokeWidth={2.5} />
                  </button>
                </div>

                {/* White Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-[2rem] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col items-center gap-5 w-full py-6 pb-6 border border-gray-50/50">
                  
                  {/* Big Color Indicator */}
                  <div className="flex flex-col items-center w-full gap-1">
                     <div 
                        className="w-[72px] h-[72px] rounded-full shadow-inner border border-black/5" 
                        style={{ backgroundColor: color, background: color === '#FF6B00' ? 'linear-gradient(135deg, #FF512F, #F09819)' : color }} 
                     />
                  </div>

                  {/* Colors - Hidden behind the scenes but functional by clicking mini dots */}
                  <div className="flex flex-wrap gap-x-2 gap-y-2 justify-center w-full px-1">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setColor(c)} className="w-[14px] h-[14px] rounded-full border shadow-sm hover:scale-125 transition-transform" style={{ backgroundColor: c, borderColor: color === c ? '#000' : 'transparent' }} />
                    ))}
                  </div>

                  {/* Sticker Category Mini Tabs */}
                  <div className="flex justify-between w-full border-b border-gray-100 pb-1.5 h-6">
                    {STICKER_CATEGORIES.map((cat, idx) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveStickerTab(idx)}
                        className={cn(
                          "text-sm transition-all pb-1 select-none cursor-pointer px-1 relative flex items-center justify-center",
                          activeStickerTab === idx ? "text-black scale-110 font-bold" : "text-gray-300 hover:text-gray-500"
                        )}
                        title={cat.label}
                      >
                        <span>{cat.icon}</span>
                        {activeStickerTab === idx && (
                          <motion.div 
                            layoutId="activeStickerTabUnderline" 
                            className="absolute bottom-0 left-0 right-0 h-[2px] bg-black" 
                          />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Dynamic Sticker Grid of Active Category */}
                  <div className="grid grid-cols-2 gap-3 w-full place-items-center mt-2 max-h-[160px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-2 px-1">
                    {STICKER_CATEGORIES[activeStickerTab].items.map((s, i) => (
                      <motion.div 
                        key={`${activeStickerTab}-${i}`} 
                        drag 
                        dragSnapToOrigin 
                        whileDrag={{ scale: 1.5, zIndex: 100 }}
                        onDragStart={() => {
                          isDraggingItem.current = true;
                        }}
                        onDragEnd={(e, info) => {
                          if (!containerRef.current) return;
                          const rect = containerRef.current.getBoundingClientRect();
                          if (info.point.x >= rect.left && info.point.x <= rect.right && info.point.y >= rect.top && info.point.y <= rect.bottom) {
                            const x = (info.point.x - (rect.left + rect.width / 2)) / zoom;
                            const y = (info.point.y - (rect.top + rect.height / 2)) / zoom;
                            addPlacedItem({ id: Math.random().toString(), type: 'sticker', content: s, x, y, scale: 1, rotate: 0 });
                          }
                          setTimeout(() => {
                            isDraggingItem.current = false;
                          }, 50);
                        }}
                        onClick={() => {
                          if (isDraggingItem.current) return;
                          // Easy click-to-center shortcut
                          addPlacedItem({ id: Math.random().toString(), type: 'sticker', content: s, x: 0, y: 0, scale: 1, rotate: 0 });
                        }}
                        className="text-3xl cursor-pointer active:cursor-grabbing hover:scale-110 transition-transform w-[40px] h-[40px] flex items-center justify-center bg-[#F2F2F2] rounded-full shadow-inner shrink-0"
                      >
                        {s}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Undo / Redo Controls */}
                <div className="flex items-center justify-between bg-white rounded-full p-2 shadow-sm border border-gray-100 w-full mt-1 px-3">
                  <button 
                    onClick={handleUndo} 
                    disabled={historyIndex === 0} 
                    className="text-gray-400 hover:text-black hover:bg-gray-50 disabled:opacity-30 rounded-full p-1 transition-colors"
                    title="되돌리기 (Undo)"
                  >
                    <Undo size={16} />
                  </button>
                  <span className="text-[10px] font-bold text-gray-500 uppercase select-none">작업</span>
                  <button 
                    onClick={handleRedo} 
                    disabled={historyIndex >= history.length - 1} 
                    className="text-gray-400 hover:text-black hover:bg-gray-50 disabled:opacity-30 rounded-full p-1 transition-colors"
                    title="다시실행 (Redo)"
                  >
                    <Redo size={16} />
                  </button>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center justify-between bg-white rounded-full p-2 shadow-sm border border-gray-100 w-full mt-1 px-3">
                  <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="text-gray-400 hover:text-black hover:bg-gray-50 rounded-full p-1"><Minus size={14} /></button>
                  <span className="text-[10px] font-bold text-gray-500">{Math.round(zoom * 100)}%</span>
                  <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="text-gray-400 hover:text-black hover:bg-gray-50 rounded-full p-1"><Plus size={14} /></button>
                </div>
              </div>

              {/* Center Canvas Area Container */}
              <div 
                className="relative w-[380px] h-[540px] flex items-center justify-center overflow-visible z-10"
                onPointerDown={() => setSelectedItemId(null)}
              >
                {/* Scalable Container */}
                <motion.div 
                  ref={containerRef}
                  className="relative w-[380px] h-[540px] flex items-center justify-center shrink-0 origin-center rounded-[2.5rem] bg-neutral-50/20 overflow-hidden"
                  animate={{ scale: zoom }}
                  style={{ top: `${-headTop}px` }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  {/* Head Container shifted by headTop, exactly like in Step 4 and 5 */}
                  <div 
                    className="absolute left-0 w-[380px] h-[540px] origin-top pointer-events-none"
                    style={{ top: `${headTop}px` }}
                  >
                    <div
                      className="absolute inset-0 origin-center pointer-events-none"
                      style={{ transform: `scale(${SILHOUETTES[profileType]?.scale ?? 1})` }}
                    >
                      {/* Background Silhouette */}
                      <img 
                        src={SILHOUETTES[profileType].url} 
                        className="absolute pointer-events-none select-none z-0" 
                        style={{
                          top: `${DECO_INSET}px`,
                          bottom: `${DECO_INSET}px`,
                          left: `${DECO_INSET}px`,
                          right: `${DECO_INSET}px`,
                          width: `calc(100% - ${DECO_INSET * 2}px)`,
                          height: `calc(100% - ${DECO_INSET * 2}px)`,
                          objectFit: 'contain',
                          filter: 'brightness(0) invert(0.85)',
                        }}
                        alt=""
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const svg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='380' height='540'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3C/svg%3E";
                          target.src = svg;
                        }}
                      />

                    {/* Masked Decorating Layer Container (For images and stickers) */}
                    <div 
                      className="absolute pointer-events-none z-10"
                      style={{
                        top: `${DECO_INSET}px`,
                        bottom: `${DECO_INSET}px`,
                        left: `${DECO_INSET}px`,
                        right: `${DECO_INSET}px`,
                        width: `calc(100% - ${DECO_INSET * 2}px)`,
                        height: `calc(100% - ${DECO_INSET * 2}px)`,
                        maskImage: `url(${SILHOUETTES[profileType].url})`,
                        WebkitMaskImage: `url(${SILHOUETTES[profileType].url})`,
                        maskSize: 'contain',
                        WebkitMaskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        WebkitMaskRepeat: 'no-repeat',
                        maskPosition: 'center',
                        WebkitMaskPosition: 'center',
                        clipPath: `polygon(
                          ${17.2 - DECO_INSET}px ${-headTop - DECO_INSET}px, 
                          ${380 - 17.2 - DECO_INSET}px ${-headTop - DECO_INSET}px, 
                          ${380 - 17.2 - DECO_INSET}px ${370 - headTop - DECO_INSET}px, 
                          ${17.2 - DECO_INSET}px ${370 - headTop - DECO_INSET}px
                        )`
                      }}
                    >
                      {/* Placed Images (Now inside the masked container!) */}
                      <div className="absolute inset-0 pointer-events-none">
                        {placedItems.filter(item => item.type === 'image').map(item => (
                          <div 
                            key={item.id} 
                            onPointerDown={(e) => handlePointerDown(e, item)}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onPointerCancel={handlePointerUp}
                            className={cn(
                              "absolute cursor-grab active:cursor-grabbing transition-shadow", 
                              tool === 'move' ? "pointer-events-auto" : "pointer-events-none",
                              selectedItemId === item.id ? "ring-2 ring-sky-400 rounded-lg shadow-xl" : ""
                            )}
                            style={{ 
                              marginLeft: '-3rem', 
                              marginTop: '-3rem', 
                              left: '50%', 
                              top: '50%', 
                              touchAction: 'none',
                              transform: `translate(${item.x}px, ${item.y}px) rotate(${item.rotate || 0}deg) scale(${item.scale})`
                            }}
                          >
                            <img src={item.src} draggable={false} className="w-24 h-24 object-contain drop-shadow-md select-none pointer-events-none" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Unmasked Drawing Layer Container (Only clipped by the rectangular box, not masked by silhouette!) */}
                    <div 
                      className="absolute pointer-events-none z-20"
                      style={{
                        top: `${DECO_INSET}px`,
                        bottom: `${DECO_INSET}px`,
                        left: `${DECO_INSET}px`,
                        right: `${DECO_INSET}px`,
                        width: `calc(100% - ${DECO_INSET * 2}px)`,
                        height: `calc(100% - ${DECO_INSET * 2}px)`,
                        clipPath: `polygon(
                          ${17.2 - DECO_INSET}px ${-headTop - DECO_INSET}px, 
                          ${380 - 17.2 - DECO_INSET}px ${-headTop - DECO_INSET}px, 
                          ${380 - 17.2 - DECO_INSET}px ${370 - headTop - DECO_INSET}px, 
                          ${17.2 - DECO_INSET}px ${370 - headTop - DECO_INSET}px
                        )`
                      }}
                    >
                      {/* Drawing Layer */}
                      <canvas
                         ref={canvasRef}
                         width={380 - DECO_INSET * 2}
                         height={540 - DECO_INSET * 2}
                         onPointerDown={startDrawing}
                         onPointerMove={draw}
                         onPointerUp={endDrawing}
                         onPointerLeave={endDrawing}
                         onPointerCancel={endDrawing}
                         style={{ touchAction: 'none' }}
                         className={cn(
                           "absolute inset-0 w-full h-full z-20",
                           tool === 'move' ? "pointer-events-none" : "pointer-events-auto cursor-crosshair"
                         )}
                      />
                    </div>

                    {/* Placed Stickers (Now outside the masked container!) */}
                    <div className="absolute inset-0 pointer-events-none z-30">
                      {placedItems.filter(item => item.type === 'sticker').map(item => (
                        <div 
                          key={item.id} 
                          onPointerDown={(e) => handlePointerDown(e, item)}
                          onPointerMove={handlePointerMove}
                          onPointerUp={handlePointerUp}
                          onPointerCancel={handlePointerUp}
                          className={cn(
                            "absolute cursor-grab active:cursor-grabbing transition-shadow z-30", 
                            tool === 'move' ? "pointer-events-auto" : "pointer-events-none",
                            selectedItemId === item.id ? "ring-2 ring-sky-400 rounded-lg shadow-xl" : ""
                          )}
                          style={{ 
                            marginLeft: '-1.875rem', 
                            marginTop: '-1.875rem', 
                            left: '50%', 
                            top: '50%', 
                            touchAction: 'none',
                            transform: `translate(${item.x}px, ${item.y}px) rotate(${item.rotate || 0}deg) scale(${item.scale})`
                          }}
                        >
                          <div className="text-6xl drop-shadow-lg pointer-events-none select-none">{item.content}</div>
                        </div>
                      ))}
                    </div>

                    {/* Selected Item Controls */}
                    {selectedItemId && placedItems.find(i => i.id === selectedItemId) && tool === 'move' && (
                      <div 
                        className="absolute z-[120] flex items-center gap-1 bg-white border border-gray-200 shadow-xl rounded-full p-1 pointer-events-auto"
                        style={{ 
                            left: `calc(50% + ${placedItems.find(i => i.id === selectedItemId)!.x}px)`, 
                            top: `calc(50% + ${placedItems.find(i => i.id === selectedItemId)!.y - 80}px)`,
                            transform: 'translate(-50%, -50%)',
                            touchAction: 'none'
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <button onClick={() => updateItemScale(selectedItemId, -0.1)} className="p-2 hover:bg-gray-100 rounded-full text-black" title="축소"><Minus size={16} /></button>
                        <button onClick={() => updateItemScale(selectedItemId, 0.1)} className="p-2 hover:bg-gray-100 rounded-full text-black" title="확대"><Plus size={16} /></button>
                        <div className="w-px h-4 bg-gray-200 mx-1" />
                        <button onClick={() => updateItemRotation(selectedItemId, -15)} className="p-2 hover:bg-gray-100 rounded-full text-black animate-none" title="왼쪽 회전"><RotateCcw size={16} /></button>
                        <button onClick={() => updateItemRotation(selectedItemId, 15)  } className="p-2 hover:bg-gray-100 rounded-full text-black animate-none" title="오른쪽 회전"><RotateCw size={16} /></button>
                        <div className="w-px h-4 bg-gray-200 mx-1" />
                        <button onClick={() => deletePlacedItem(selectedItemId)} className="p-2 hover:bg-red-50 rounded-full text-red-500" title="삭제"><Trash2 size={16} /></button>
                      </div>
                    )}

                    </div>

                    {/* Elegant boundary dashed box representing the actual card printable area on the face (unconditionally shown) */}
                    <div 
                      className="absolute border-2 border-dashed border-[#FF6B00]/70 rounded-2xl pointer-events-none z-30"
                      style={{
                        left: "17.2px",
                        top: `${-headTop}px`,
                        width: "345.6px",
                        height: "370px"
                      }}
                    />
                  </div>
                </motion.div>
              </div>

              {/* Outside Images Ring - perfectly circular without clipping boxes */}
              <div className="absolute inset-0 pointer-events-none overflow-visible z-20 w-full h-full">
                {selectedImages.map((img, i) => {
                  const total = selectedImages.length;
                  const angle = (i / total) * Math.PI * 2;
                  const radius = typeof window !== 'undefined' ? (window.innerWidth < 768 ? 200 : Math.max(280, Math.min(window.innerWidth / 2 - 120, window.innerHeight / 2 - 60, 420))) : 360;
                  const x = Math.cos(angle - Math.PI / 2) * radius;
                  const y = Math.sin(angle - Math.PI / 2) * radius;
                  // Rotate to follow tangency!
                  const rotation = ((angle - Math.PI / 2) * 180) / Math.PI + 90;
                  
                  return (
                    <div 
                      key={img.id} 
                      className="absolute inline-block pointer-events-none" 
                      style={{ 
                        left: `calc(50% + ${x}px)`, 
                        top: `calc(50% + ${y}px)`, 
                        marginLeft: '-2.5rem', 
                        marginTop: '-2.5rem', 
                        width: '5rem', 
                        height: '5rem'
                      }}
                    >
                      {/* Draggable Image directly, without border/background styling */}
                      <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
                        <motion.div 
                          drag
                          dragSnapToOrigin
                          onDragStart={() => {
                            isDraggingItem.current = true;
                          }}
                          onDragEnd={(e, info) => {
                            if (!containerRef.current) return;
                            const rect = containerRef.current.getBoundingClientRect();
                            if (info.point.x >= rect.left && info.point.x <= rect.right && info.point.y >= rect.top && info.point.y <= rect.bottom) {
                              const lx = (info.point.x - (rect.left + rect.width / 2)) / zoom;
                              const ly = (info.point.y - (rect.top + rect.height / 2)) / zoom;
                              addPlacedItem({ id: Math.random().toString(), type: 'image', src: img.url, x: lx, y: ly, scale: 1, rotate: 0 });
                            }
                            setTimeout(() => {
                              isDraggingItem.current = false;
                            }, 50);
                          }}
                          onClick={() => {
                            if (isDraggingItem.current) return;
                            if (tool !== 'move') return;
                            // Click to center shortcut
                            addPlacedItem({ id: Math.random().toString(), type: 'image', src: img.url, x: 0, y: 0, scale: 1, rotate: 0 });
                          }}
                          whileDrag={{ scale: 1.5, zIndex: 100, opacity: 1 }}
                          className={cn("w-full h-full transition-transform drop-shadow-xl", tool === 'move' ? "pointer-events-auto cursor-pointer" : "pointer-events-none")}
                          style={{ touchAction: 'none' }}
                        >
                          <motion.img 
                            src={img.url} 
                            draggable={false} 
                            referrerPolicy="no-referrer" 
                            initial={{ rotate: rotation }}
                            animate={{ rotate: rotation }}
                            whileDrag={{ rotate: 0 }}
                            className="w-full h-full object-contain drop-shadow-md pointer-events-none select-none" 
                          />
                        </motion.div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <CustomButton
              onClick={() => {
                if (canvasRef.current) {
                  setDrawingDataUrl(canvasRef.current.toDataURL());
                }
                setStep(4);
              }}
              variant="primary"
              className="absolute bottom-6 right-6 md:bottom-12 md:right-12 px-12 h-[54px] text-lg font-bold tracking-widest rounded-full z-50 bg-[#FF6B00] text-white hover:bg-[#e05e00] shadow-md transition-all duration-300"
            >
              몸통 고르러 가기
            </CustomButton>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-5xl mx-auto flex flex-col items-center px-4 py-6 overflow-visible">
            <h2 className="text-4xl font-normal font-dandan mb-2 tracking-wide text-center">나의 몸통 모양을 골라보세요!</h2>
            <p className="text-sm text-gray-400 mb-6 text-center font-sans">원형으로 배치된 몸통을 선택하여 나만의 캐릭터를 완성해 보세요.</p>
            
            {/* Center Area containing Card + Circular Selection */}
            <div className="relative w-full flex flex-col items-center justify-center overflow-visible py-20 min-h-[640px]">
              
              {/* Scalable Container for Mobile Responsiveness */}
              <div className="relative w-[320px] h-[500px] flex items-center justify-center scale-[0.65] xs:scale-75 sm:scale-85 md:scale-100 origin-center transition-transform duration-300">
                
                {/* Subtle orbital dashed ellipse background */}
                <div 
                  className="absolute border-2 border-dashed border-[#FF6B00]/20 rounded-full pointer-events-none z-0"
                  style={{
                    width: "560px",
                    height: "560px",
                    borderRadius: "50%",
                    left: "calc(50% - 280px)",
                    top: "calc(50% - 280px)",
                  }}
                />

                {/* 1. Centered Preview (without outer card decoration) */}
                <div className="relative w-[320px] h-[500px] flex items-center justify-center z-10 overflow-visible">


                  {/* Character Wrapper to mimic object-fit: cover of 380x540 canvas inside 320x500 box */}
                  <div 
                    className="absolute left-0 w-[380px] h-[540px] pointer-events-none origin-top-left z-10" 
                    style={{ 
                      transform: 'scale(0.925925)', 
                      left: '-15.925px',
                      top: '51px'
                    }}
                  >
                    {/* Top: Customized Head */}
                    <div 
                      className="absolute left-0 w-[380px] h-[540px] origin-top pointer-events-none"
                      style={{ top: `${SILHOUETTES[profileType]?.headTop ?? -80}px` }}
                    >
                      <div
                        className="absolute inset-0 origin-center pointer-events-none"
                        style={{ transform: `scale(${SILHOUETTES[profileType]?.scale ?? 1})` }}
                      >
                        {/* Background Silhouette */}
                        <img 
                          src={SILHOUETTES[profileType].url} 
                          className="absolute pointer-events-none select-none z-0" 
                          style={{
                            top: `${DECO_INSET}px`,
                            bottom: `${DECO_INSET}px`,
                            left: `${DECO_INSET}px`,
                            right: `${DECO_INSET}px`,
                            width: `calc(100% - ${DECO_INSET * 2}px)`,
                            height: `calc(100% - ${DECO_INSET * 2}px)`,
                            objectFit: 'contain',
                            filter: 'brightness(0) invert(0.85)',
                          }}
                          alt=""
                        />

                      {/* Masked Decorating Layer Container */}
                      <div 
                        className="absolute pointer-events-none z-10"
                        style={{
                          top: `${DECO_INSET}px`,
                          bottom: `${DECO_INSET}px`,
                          left: `${DECO_INSET}px`,
                          right: `${DECO_INSET}px`,
                          width: `calc(100% - ${DECO_INSET * 2}px)`,
                          height: `calc(100% - ${DECO_INSET * 2}px)`,
                          maskImage: `url(${SILHOUETTES[profileType].url})`,
                          WebkitMaskImage: `url(${SILHOUETTES[profileType].url})`,
                          maskSize: 'contain',
                          WebkitMaskSize: 'contain',
                          maskRepeat: 'no-repeat',
                          WebkitMaskRepeat: 'no-repeat',
                          maskPosition: 'center',
                          WebkitMaskPosition: 'center',
                        }}
                      >
                        {/* Placed Images */}
                        <div className="absolute inset-0 pointer-events-none">
                          {placedItems.filter(item => item.type === 'image').map(item => (
                            <div 
                              key={item.id} 
                              className="absolute pointer-events-none"
                              style={{ 
                                marginLeft: '-3rem', 
                                marginTop: '-3rem', 
                                left: '50%', 
                                top: '50%', 
                                transform: `translate(${item.x}px, ${item.y}px) rotate(${item.rotate || 0}deg) scale(${item.scale || 1})` 
                              }}
                            >
                              <img src={item.src} className="w-24 h-24 object-contain drop-shadow-md select-none pointer-events-none" />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Unmasked Drawing Layer Container (Only clipped by the rectangular box, not masked by silhouette!) */}
                      <div 
                        className="absolute pointer-events-none z-20"
                        style={{
                          top: `${DECO_INSET}px`,
                          bottom: `${DECO_INSET}px`,
                          left: `${DECO_INSET}px`,
                          right: `${DECO_INSET}px`,
                          width: `calc(100% - ${DECO_INSET * 2}px)`,
                          height: `calc(100% - ${DECO_INSET * 2}px)`,
                          clipPath: `polygon(
                            ${17.2 - DECO_INSET}px ${-headTop - DECO_INSET}px, 
                            ${380 - 17.2 - DECO_INSET}px ${-headTop - DECO_INSET}px, 
                            ${380 - 17.2 - DECO_INSET}px ${370 - headTop - DECO_INSET}px, 
                            ${17.2 - DECO_INSET}px ${370 - headTop - DECO_INSET}px
                          )`
                        }}
                      >
                        {/* Drawing Layer */}
                        {drawingDataUrl && (
                          <img 
                            src={drawingDataUrl} 
                            className="absolute inset-0 w-full h-full object-cover pointer-events-none z-20" 
                            alt=""
                          />
                        )}
                      </div>

                      {/* Placed Stickers (Now outside the masked container!) */}
                      <div className="absolute inset-0 pointer-events-none z-30">
                        {placedItems.filter(item => item.type === 'sticker').map(item => (
                          <div 
                            key={item.id} 
                            className="absolute pointer-events-none z-30"
                            style={{ 
                              marginLeft: '-1.875rem', 
                              marginTop: '-1.875rem', 
                              left: '50%', 
                              top: '50%', 
                              transform: `translate(${item.x}px, ${item.y}px) rotate(${item.rotate || 0}deg) scale(${item.scale || 1})` 
                            }}
                          >
                            <div className="text-6xl drop-shadow-lg pointer-events-none select-none">{item.content}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                    {/* Bottom: Selected Body Shape */}
                    <div className="absolute top-[320px] left-[135px] w-[110px] h-[110px] text-black">
                      {BODY_SHAPES[bodyType].renderSvg()}
                    </div>
                  </div>
                </div>

                {/* 2. Circular Layout for body shapes around the card */}
                {BODY_SHAPES.map((body, i) => {
                  const radius = 280; // Radius of circular arrangement (matches the 560px orbital circle)
                  const angleDegrees = -90 + (i * 72); // Starts from top (-90 deg) and increases by exactly 72 degrees
                  const angleRadians = (angleDegrees * Math.PI) / 180;
                  const x = radius * Math.cos(angleRadians);
                  const y = radius * Math.sin(angleRadians);

                  return (
                    <motion.button
                      key={body.id}
                      onClick={() => selectBodyType(i)}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "absolute flex items-center justify-center rounded-[2rem] border-2 transition-all duration-300",
                        "w-[94px] h-[114px] p-4 bg-white/95 backdrop-blur-md cursor-pointer",
                        bodyType === i
                          ? "border-[#FF6B00] shadow-[0_0_25px_rgba(255,107,0,0.35)] scale-110 z-30 ring-4 ring-orange-100"
                          : "border-gray-100 hover:border-gray-300 hover:shadow-lg opacity-85 hover:opacity-100 z-20"
                      )}
                      style={{
                        left: `calc(50% + ${x}px - 47px)`,
                        top: `calc(50% + ${y}px - 57px)`,
                      }}
                    >
                      <div className="w-full h-full flex items-center justify-center p-1">
                        {body.renderSvg()}
                      </div>
                    </motion.button>
                  );
                })}

              </div>
            </div>

            {/* Bottom Buttons */}
            <div className="flex justify-center mt-8 gap-4 z-20 relative w-full max-w-[400px]">
              <CustomButton
                onClick={() => setStep(3)}
                variant="outline"
                className="flex-1 h-[54px] text-sm font-bold tracking-widest uppercase border-gray-300 hover:bg-gray-50"
              >
                이전으로
              </CustomButton>
              <CustomButton
                onClick={() => setStep(5)}
                variant="secondary"
                className="flex-[1.5] h-[54px] text-sm font-bold tracking-widest uppercase bg-[#FF6B00] text-white hover:bg-[#e05e00] transition-colors duration-300"
              >
                이름 붙이러 가기
              </CustomButton>
            </div>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div key="s5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center text-center p-6 space-y-12">
            <h2 className="font-dandan font-normal text-4xl tracking-wide">이 프로필의 이름도 지어볼까요?</h2>
            
            {/* Show a static preview of the silhouette + placed items + selected body */}
            <div ref={step4PreviewRef} className="relative w-[320px] h-[500px] rounded-[32px] shadow-2xl overflow-hidden flex items-center justify-center bg-white">
              {/* Background Image of Card */}
              <img 
                src={window.location.origin + "/card-front.png"}
                className="absolute inset-0 w-full h-full object-cover z-0 select-none pointer-events-none"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "320px",
                  height: "500px",
                  objectFit: "cover",
                  zIndex: 0,
                  transform: "scale(1.03)"
                }}
              />

              {/* Character Wrapper to mimic object-fit: cover of 380x540 canvas inside 320x500 box */}
              <div 
                className="absolute top-0 left-0 w-[380px] h-[540px] pointer-events-none origin-top-left z-10" 
                style={{ 
                  transform: 'scale(0.925925)', 
                  left: '-15.925px' 
                }}
              >
                {/* 1. Draw Customized Head at the top (scaled & centered) */}
                <div 
                  className="absolute left-0 w-[380px] h-[540px] origin-top pointer-events-none"
                  style={{ top: `${SILHOUETTES[profileType]?.headTop ?? -80}px` }}
                >
                  <div
                    className="absolute inset-0 origin-center pointer-events-none"
                    style={{ transform: `scale(${SILHOUETTES[profileType]?.scale ?? 1})` }}
                  >
                    {/* Background Silhouette */}
                    <img 
                      src={SILHOUETTES[profileType].url} 
                      className="absolute pointer-events-none select-none z-0" 
                      style={{
                        top: `${DECO_INSET}px`,
                        bottom: `${DECO_INSET}px`,
                        left: `${DECO_INSET}px`,
                        right: `${DECO_INSET}px`,
                        width: `calc(100% - ${DECO_INSET * 2}px)`,
                        height: `calc(100% - ${DECO_INSET * 2}px)`,
                        objectFit: 'contain',
                        filter: 'brightness(0) invert(0.85)',
                      }}
                      alt=""
                    />

                  {/* Masked Decorating Layer Container */}
                  <div 
                    className="absolute pointer-events-none z-10"
                    style={{
                      top: `${DECO_INSET}px`,
                      bottom: `${DECO_INSET}px`,
                      left: `${DECO_INSET}px`,
                      right: `${DECO_INSET}px`,
                      width: `calc(100% - ${DECO_INSET * 2}px)`,
                      height: `calc(100% - ${DECO_INSET * 2}px)`,
                      maskImage: `url(${SILHOUETTES[profileType].url})`,
                      WebkitMaskImage: `url(${SILHOUETTES[profileType].url})`,
                      maskSize: 'contain',
                      WebkitMaskSize: 'contain',
                      maskRepeat: 'no-repeat',
                      WebkitMaskRepeat: 'no-repeat',
                      maskPosition: 'center',
                      WebkitMaskPosition: 'center',
                    }}
                  >
                    {/* Placed Images */}
                    <div className="absolute inset-0 pointer-events-none">
                      {placedItems.filter(item => item.type === 'image').map(item => (
                        <div 
                          key={item.id} 
                          className="absolute pointer-events-none"
                          style={{ 
                            marginLeft: '-3rem', 
                            marginTop: '-3rem', 
                            left: '50%', 
                            top: '50%', 
                            transform: `translate(${item.x}px, ${item.y}px) rotate(${item.rotate || 0}deg) scale(${item.scale || 1})` 
                          }}
                        >
                          <img src={item.src} className="w-24 h-24 object-contain drop-shadow-md select-none pointer-events-none" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Unmasked Drawing Layer Container (Only clipped by the rectangular box, not masked by silhouette!) */}
                  <div 
                    className="absolute pointer-events-none z-20"
                    style={{
                      top: `${DECO_INSET}px`,
                      bottom: `${DECO_INSET}px`,
                      left: `${DECO_INSET}px`,
                      right: `${DECO_INSET}px`,
                      width: `calc(100% - ${DECO_INSET * 2}px)`,
                      height: `calc(100% - ${DECO_INSET * 2}px)`,
                      clipPath: `polygon(
                        ${17.2 - DECO_INSET}px ${-headTop - DECO_INSET}px, 
                        ${380 - 17.2 - DECO_INSET}px ${-headTop - DECO_INSET}px, 
                        ${380 - 17.2 - DECO_INSET}px ${370 - headTop - DECO_INSET}px, 
                        ${17.2 - DECO_INSET}px ${370 - headTop - DECO_INSET}px
                      )`
                    }}
                  >
                    {/* Drawing Layer */}
                    {drawingDataUrl && (
                      <img 
                        src={drawingDataUrl} 
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-20" 
                        alt=""
                      />
                    )}
                  </div>

                  {/* Placed Stickers (Now outside the masked container!) */}
                  <div className="absolute inset-0 pointer-events-none z-30">
                    {placedItems.filter(item => item.type === 'sticker').map(item => (
                      <div 
                        key={item.id} 
                        className="absolute pointer-events-none z-30"
                        style={{ 
                          marginLeft: '-1.875rem', 
                          marginTop: '-1.875rem', 
                          left: '50%', 
                          top: '50%', 
                          transform: `translate(${item.x}px, ${item.y}px) rotate(${item.rotate || 0}deg) scale(${item.scale || 1})` 
                        }}
                      >
                        <div className="text-6xl drop-shadow-lg pointer-events-none select-none">{item.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

                {/* 2. Draw Body Shape at the bottom */}
                <div className="absolute top-[320px] left-[135px] w-[110px] h-[110px] text-black">
                  {BODY_SHAPES[bodyType].renderSvg()}
                </div>
              </div>

              {/* Card Front Info Overlay */}
              <div 
                className="absolute z-20 flex flex-col gap-1 items-start pointer-events-none"
                style={{
                  position: "absolute",
                  bottom: "24px",
                  left: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  alignItems: "flex-start",
                  zIndex: 20
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <div 
                    className="w-6 h-6 bg-black transform -rotate-12 flex items-center justify-center text-[#3ff1b2] font-extrabold text-xs rounded-sm"
                    style={{
                      width: "24px",
                      height: "24px",
                      backgroundColor: "black",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#3ff1b2",
                      fontWeight: "extrabold",
                      fontSize: "12px",
                      borderRadius: "2px",
                      transform: "rotate(-12deg)"
                    }}
                  >
                    1
                  </div>
                  <div 
                    className="text-black font-dandan font-black text-2xl tracking-tighter ml-1 drop-shadow-md bg-white/30 backdrop-blur-sm px-1 rounded-sm"
                    style={{
                      color: "black",
                      fontFamily: "'OkDanDan-Bold', sans-serif",
                      fontWeight: "900",
                      fontSize: "24px",
                      letterSpacing: "-0.05em",
                      marginLeft: "4px",
                      backgroundColor: "rgba(255, 255, 255, 0.3)",
                      backdropFilter: "blur(4px)",
                      paddingLeft: "4px",
                      paddingRight: "4px",
                      borderRadius: "2px"
                    }}
                  >
                    호모 이미지스
                  </div>
                </div>
                <div 
                  className="bg-black text-[#5CA5FF] font-dandan font-black text-2xl px-4 py-1 transform -skew-x-6 drop-shadow-md mt-1 border-b-[3px] border-black"
                  style={{
                    backgroundColor: "black",
                    color: "#5CA5FF",
                    fontFamily: "'OkDanDan-Bold', sans-serif",
                    fontWeight: "900",
                    fontSize: "24px",
                    paddingLeft: "16px",
                    paddingRight: "16px",
                    paddingTop: "4px",
                    paddingBottom: "4px",
                    transform: "skewX(-6deg)",
                    marginTop: "4px",
                    borderBottom: "3px solid black"
                  }}
                >
                    {`${getKoreanMiddleName(middleName)} ${profileName || userName || "스탠딩 맨"}`}
                </div>
              </div>
            </div>

            <div className="w-full max-w-md relative pb-2 border-b-2 border-gray-400 focus-within:border-black transition-colors flex items-end">
              <input 
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="스탠딩 맨"
                className="w-full bg-transparent text-center text-4xl font-hand outline-none placeholder:text-gray-300 px-12"
                maxLength={10}
              />
              <div className="absolute right-0 bottom-2 text-gray-400 gap-2 flex">
                 <Pencil size={20} />
              </div>
            </div>

            <div className="flex gap-4">
              <CustomButton
                onClick={() => setStep(4)}
                variant="outline"
                className="px-8 h-[54px] text-sm font-bold tracking-widest uppercase border-gray-300 hover:bg-gray-50"
                disabled={isGenerating}
              >
                뒤로가기
              </CustomButton>
              <CustomButton
                onClick={handleCompleteGeneration}
                variant="secondary"
                className="px-12 h-[54px] text-sm font-bold tracking-widest uppercase bg-[#FF6B00] text-white hover:bg-[#e05e00]"
                disabled={isGenerating}
              >
                {isGenerating ? "생성 중..." : "완성하기"}
              </CustomButton>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
