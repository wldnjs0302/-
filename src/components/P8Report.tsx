import { motion, useMotionValue, useAnimationFrame } from "motion/react";
import html2canvas from "html2canvas";
import { useRef, useState } from "react";
import { Download, Share2, Layers, Rotate3D } from "lucide-react";
import { UserData, ImageItem } from "../types";
import { CustomButton } from "./CustomButton";
import { handleImageError } from "../utils/imageRetry";

interface P8ReportProps {
  userData: UserData;
  middleName: string;
  creationUrl: string;
  lastNameSignature: string; // Not used in new design but kept for compatibility
  selectedImages: ImageItem[];
  allImages: ImageItem[];
  onReset: () => void;
}

export default function P8Report({ userData, middleName, creationUrl, lastNameSignature, selectedImages, allImages, onReset }: P8ReportProps) {
  const hiddenCardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [isFlatView, setIsFlatView] = useState(false);

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

  // Rotation states
  const yRotation = useMotionValue(0);
  const dragVelocity = useRef(0);
  const isDragging = useRef(false);

  useAnimationFrame((time, delta) => {
    if (isFlatView || isDragging.current) return;
    
    if (Math.abs(dragVelocity.current) > 1) {
      yRotation.set(yRotation.get() + dragVelocity.current * (delta / 16));
      dragVelocity.current *= 0.95; 
    } else {
      yRotation.set(yRotation.get() + 30 * (delta / 1000));
    }
  });

  const handlePanStart = () => {
    isDragging.current = true;
    dragVelocity.current = 0;
  };

  const handlePan = (event: any, info: any) => {
    yRotation.set(yRotation.get() + info.delta.x * 0.5);
  };

  const handlePanEnd = (event: any, info: any) => {
    isDragging.current = false;
    dragVelocity.current = info.velocity.x / 30; // Apply some momentum
  };

  const downloadReport = async () => {
    if (!hiddenCardRef.current) return;
    setDownloading(true);
    try {
      // Ensure all browser fonts are completely loaded before capture
      await document.fonts.ready;

      // Wait for all images inside hiddenCardRef to be fully loaded
      const imagesInHidden = Array.from(hiddenCardRef.current.querySelectorAll("img")) as HTMLImageElement[];
      await Promise.all(
        imagesInHidden.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve(); // continue anyway even if error
          });
        })
      );

      const canvas = await html2canvas(hiddenCardRef.current, {
        scale: 4, // Extremely high resolution for pristine, crisp texts & images (fixes quality loss)
        backgroundColor: "#F3F4F6", // Neutral background for the combined card sheet
        useCORS: true,
        allowTaint: false,
        logging: false,
        imageTimeout: 0, // Prevent image loading timeouts
        onclone: (clonedDoc) => {
          // 1. Remove all pre-existing link and style elements to prevent html2canvas's CSS parser 
          // from parsing and crashing on modern CSS functions (such as oklch, oklab, color-mix) in Tailwind CSS v4!
          const links = clonedDoc.querySelectorAll("link[rel='stylesheet']");
          links.forEach((link) => link.remove());

          const existingStyles = clonedDoc.querySelectorAll("style");
          existingStyles.forEach((style) => style.remove());

          // 2. Explicitly inject our own clean @font-face and helper classes so html2canvas renders perfectly without external styles
          const fontStyle = clonedDoc.createElement("style");
          fontStyle.textContent = `
            @font-face {
              font-family: 'OkDanDan-Bold';
              src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2508-2@1.0/OkDanDan-Bold.woff2') format('woff2');
              font-weight: normal;
              font-style: normal;
              font-display: swap;
            }
            .font-dandan {
              font-family: 'OkDanDan-Bold', sans-serif !important;
            }
            .flex { display: flex !important; }
            .flex-col { flex-direction: column !important; }
            .items-center { align-items: center !important; }
            .justify-center { justify-content: center !important; }
            .items-start { align-items: flex-start !important; }
            .absolute { position: absolute !important; }
            .relative { position: relative !important; }
            .inset-0 { top: 0 !important; right: 0 !important; bottom: 0 !important; left: 0 !important; }
            .w-full { width: 100% !important; }
            .h-full { height: 100% !important; }
            .z-0 { z-index: 0 !important; }
            .z-10 { z-index: 10 !important; }
            .z-20 { z-index: 20 !important; }
            .gap-1 { gap: 0.25rem !important; }
            .bg-black { background-color: #000000 !important; }
            .text-black { color: #000000 !important; }
            .text-white { color: #ffffff !important; }
            .text-xs { font-size: 0.75rem !important; }
            .text-2xl { font-size: 1.5rem !important; }
            .font-extrabold { font-weight: 800 !important; }
            .font-black { font-weight: 900 !important; }
            .rounded-sm { border-radius: 0.125rem !important; }
            .ml-1 { margin-left: 0.25rem !important; }
            .mt-1 { margin-top: 0.25rem !important; }
            .px-1 { padding-left: 0.25rem !important; padding-right: 0.25rem !important; }
            .px-4 { padding-left: 1rem !important; padding-right: 1rem !important; }
            .py-1 { padding-top: 0.25rem !important; padding-bottom: 0.25rem !important; }
            .border-b-\\[3px\\] { border-bottom-width: 3px !important; }
            .border-black { border-color: #000000 !important; }
            .bg-white { background-color: #ffffff !important; }
            .bg-white\\/30 { background-color: rgba(255, 255, 255, 0.3) !important; }
            .backdrop-blur-sm { backdrop-filter: blur(4px) !important; -webkit-backdrop-filter: blur(4px) !important; }
            .transform { }
            .-rotate-12 { transform: rotate(-12deg) !important; }
            .-skew-x-6 { transform: skewX(-6deg) !important; }
            .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25) !important; }
            .rounded-\\[32px\\] { border-radius: 32px !important; }
            .overflow-hidden { overflow: hidden !important; }
            .object-cover { object-fit: cover !important; }
            .object-contain { object-fit: contain !important; }
          `;
          clonedDoc.head.appendChild(fontStyle);

          // 3. Sanitise inline style attributes with corrected regex (no double backslashes for parentheses)
          const elementsWithStyle = clonedDoc.querySelectorAll("[style]");
          elementsWithStyle.forEach((el) => {
            const styleAttr = el.getAttribute("style");
            if (styleAttr) {
              el.setAttribute(
                "style",
                styleAttr.replace(
                  /(oklch|oklab|color-mix|light-dark|color-contrast)\([^)]*\)/gi,
                  "#000000"
                )
              );
            }
          });
        }
      });
      const link = document.createElement("a");
      link.download = `HomoImagisLab_ID_${lastNameSignature || lastNameSignature || userData.name || "스탠딩 맨"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const frontCard = (
    <div 
      className="license-card-container w-[320px] h-[500px] rounded-[32px] relative overflow-hidden flex flex-col items-center justify-center bg-white"
      style={{ 
        width: "320px",
        height: "500px",
        borderRadius: "32px",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#FFFFFF"
      }}
    >
      {/* Background Image as actual HTML img tag for robust html2canvas capture */}
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

       <img 
         src={creationUrl} 
         referrerPolicy="no-referrer"
         className="absolute z-10" 
         style={{ 
           width: "320px", 
           height: "500px", 
           left: "0px",
           top: "0px",
           position: "absolute",
           objectFit: "cover",
           zIndex: 10
         }}
         onError={handleImageError}
       />

       <div 
         className="absolute z-20 flex flex-col gap-1 items-start"
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
             {`${getKoreanMiddleName(middleName)} ${lastNameSignature || userData.name || "스탠딩 맨"}`}
         </div>
       </div>
    </div>
  );

  const backCard = (
    <div 
      className="w-[320px] h-[500px] rounded-[32px] shadow-2xl relative overflow-hidden flex items-center justify-center bg-[#FAF8F5]"
      style={{ 
        width: "320px",
        height: "500px",
        borderRadius: "32px",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#FAF8F5"
      }}
    >
      {/* Background Image as actual HTML img tag for robust html2canvas capture (guarantees the center logo on card-back.jpg is rendered) */}
      <img 
        src={window.location.origin + "/card-back.jpg"}
        className="absolute inset-0 w-full h-full object-cover z-0 select-none pointer-events-none"
        style={{
          position: "absolute",
          inset: 0,
          width: "320px",
          height: "500px",
          objectFit: "cover",
          zIndex: 0
        }}
      />

       <div 
         className="absolute inset-0 pointer-events-none z-10"
         style={{
           position: "absolute",
           inset: 0,
           pointerEvents: "none",
           zIndex: 10
         }}
       >
         {Array.from({ length: 50 }).map((_, i) => {
           const imgOptions = allImages && allImages.length > 0 ? allImages : selectedImages;
           if (!imgOptions || imgOptions.length === 0) return null;
           const img = imgOptions[i % imgOptions.length];
           if (!img || !img.url) return null;
           
           // Arrange in a single clean circular ring surrounding the center logo
           const angle = (i / 50) * Math.PI * 2;
           const radius = 105; // Perfect radius to sit neatly around the central "HOMO IMAGES" logo
           const x = Math.cos(angle) * radius;
           const y = Math.sin(angle) * radius;

           // Slightly smaller sizes so that each card-back image is clearly readable and fits beautifully without excessive blocking
           const imgSize = 34 + (i % 3) * 6; 
           
           // Organic-feeling deterministic rotation matching the original styling
           const rotateDeg = ((i * 29) % 60) - 30; // -30deg to +30deg
           
           // Precise absolute coordinate calculation to completely bypass html2canvas percentage alignment bugs
           const posX = 160 + x - (imgSize / 2);
           const posY = 250 + y - (imgSize / 2);

           return (
             <img 
               key={`${img.id}-${i}`} 
               src={img.url} 
               crossOrigin="anonymous"
               referrerPolicy="no-referrer"
               className="absolute object-contain z-10"
               onError={handleImageError}
               style={{ 
                 position: "absolute",
                 left: `${posX}px`,
                 top: `${posY}px`,
                 width: `${imgSize}px`,
                 height: `${imgSize}px`,
                 transform: `rotate(${rotateDeg}deg)`,
                 zIndex: 10
               }} 
             />
           );
         })}
       </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 py-12 relative w-full h-full">
      
      {/* Hidden container with actual width and height to prevent flex layout collapse in html2canvas */}
      <div style={{ position: "fixed", top: "-9999px", left: "-9999px", width: "768px", height: "596px", overflow: "hidden", pointerEvents: "none", zIndex: -1000 }}>
        <div 
          ref={hiddenCardRef} 
          style={{
            display: "flex",
            gap: "32px",
            padding: "48px",
            backgroundColor: "#F3F4F6", // Solid light neutral gray
            borderRadius: "48px",
            width: "768px",
            height: "596px",
            boxSizing: "border-box"
          }}
        >
          {frontCard}
          {backCard}
        </div>
      </div>

      <div className="text-center space-y-2 relative z-20 block mb-12 mt-8">
        <h2 className="font-dandan text-2xl tracking-wide">{lastNameSignature || userData.name || "스탠딩 맨"}님, 라이선스를 발급해드렸어요!</h2>
      </div>

      {isFlatView ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-center p-4 bg-transparent mb-12"
        >
          {frontCard}
          {backCard}
        </motion.div>
      ) : (
        <div style={{ perspective: "1500px" }} className="w-[320px] h-[500px] relative z-10 mb-12 group">
          <motion.div
            style={{ 
              width: "100%", 
              height: "100%", 
              transformStyle: "preserve-3d"
            }}
          >
            <motion.div
              style={{ 
                width: "100%", height: "100%", transformStyle: "preserve-3d", 
                rotateY: yRotation, 
                cursor: "grab", 
                touchAction: "none" 
              }}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              whileTap={{ cursor: "grabbing" }}
              onPanStart={handlePanStart}
              onPan={handlePan}
              onPanEnd={handlePanEnd}
            >
              <div style={{ position: "absolute", width: "100%", height: "100%", backfaceVisibility: "hidden" }} className="drop-shadow-2xl">
                {frontCard}
              </div>
              <div style={{ position: "absolute", width: "100%", height: "100%", backfaceVisibility: "hidden", transform: "rotateY(180deg)" }} className="drop-shadow-2xl">
                {backCard}
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}

      <div className="relative z-20 flex items-center justify-center gap-4 pb-12 mt-8">
        <button
          onClick={() => setIsFlatView(!isFlatView)}
          className="bg-white/50 backdrop-blur hover:bg-white/80 border-2 border-black/10 text-black p-3 rounded-lg shadow-sm transition-all active:scale-95 flex items-center justify-center h-[54px] w-[54px]"
          title="뷰 모드 전환"
        >
          {isFlatView ? <Rotate3D size={24} /> : <Layers size={24} />}
        </button>

        <CustomButton
           onClick={downloadReport}
           className="w-[200px] h-[60px]"
           disabled={downloading}
           variant="primary"
        >
          {downloading ? "저장 중..." : "이미지 저장하기"}
        </CustomButton>

        <button 
          onClick={async () => {
            if (navigator.share) {
              try {
                await navigator.share({
                  title: 'HOMO IMAGES LAB',
                  text: `${lastNameSignature || userData.name || "스탠딩 맨"}님의 아카이브 ID 카드입니다.`,
                  url: window.location.href,
                });
              } catch (err) {}
            }
          }}
          className="bg-[#FF8B3E] hover:bg-[#e67936] text-white p-3 rounded-lg shadow-md transition-transform active:scale-95 flex items-center justify-center h-[54px] w-[54px]"
        >
          <Share2 size={24} color="white" />
        </button>
      </div>
    </div>
  );
}
