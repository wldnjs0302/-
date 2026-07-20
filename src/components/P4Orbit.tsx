import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "motion/react";
import { ImageItem } from "../types";
import { ArrowRight } from "lucide-react";
import { CustomButton } from "./CustomButton";
import { resolveAssetUrl } from "../utils/imageRetry";

interface P4OrbitProps {
  images: ImageItem[];
  userName: string;
  onNext: () => void;
}

export default function P4Orbit({ images, userName, onNext }: P4OrbitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const hasStartedRef = useRef(false);
  const [showButton, setShowButton] = useState(false);
  const [isExploring, setIsExploring] = useState(false);
  const isExploringRef = useRef(false);
  const requestRef = useRef<number>(0);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  
  const mouseRef = useRef({ x: 0, y: 0, isDown: false });
  const rotationRef = useRef({ x: 0, y: 0 });
  const spreadRef = useRef({ target: 0, current: 0 }); // 0 = gathered, 1 = spread out
  const [spreadValue, setSpreadValue] = useState(0);
  const dragRotationRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    if (!containerRef.current || images.length === 0) return;

    const container = containerRef.current;
    
    // Explicitly use window dimensions for absolute, exact full-screen coverage
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
    camera.position.z = 800; 
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); 
    
    // Rigorously lock canvas element size and alignment
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Float the group vertically higher to avoid overlap with bottom text cards/lyrics
    const groupBaseY = 120; 

    const group = new THREE.Group();
    group.position.y = groupBaseY; 
    scene.add(group);
    groupRef.current = group;

    const localLoader = new THREE.TextureLoader();
    const externalLoader = new THREE.TextureLoader();
    externalLoader.setCrossOrigin("anonymous");
    const geometry = new THREE.PlaneGeometry(180, 180); // size of images

    const meshData: { mesh: THREE.Group; gatheredPos: THREE.Vector3; spreadPos: THREE.Vector3; gatheredRotZ: number; gatheredScale: number; }[] = [];

    const fallbackLocalImages = [
      resolveAssetUrl("/age-adult.png"),
      resolveAssetUrl("/age-child.png"), 
      resolveAssetUrl("/age-infant.png"),
      resolveAssetUrl("/age-middle.png"),
      resolveAssetUrl("/age-senior.png"),
      resolveAssetUrl("/logo.png")
    ];

    images.forEach((img, i) => {
      const meshGroup = new THREE.Group();

      // Flat, clustered distribution for gathered state (collage look)
      const gatheredX = (Math.random() - 0.5) * 200;
      const gatheredY = (Math.random() - 0.5) * 200;
      const gatheredZ = (Math.random() - 0.5) * 100; // shallow depth for collage
      const gatheredPos = new THREE.Vector3(gatheredX, gatheredY, gatheredZ);
      
      const gatheredRotZ = (Math.random() - 0.5) * Math.PI * 0.4; // more rotation variation
      const gatheredScale = 0.4 + Math.random() * 0.2; // smaller scale for collage

      // Spread distribution: spread out scattered along X, Y, and Z (front-back)
      const depthFactor = Math.random(); // 0 to 1
      const spreadZ = -1200 + (depthFactor * 1600); // from -1200 (far back) to +400 (close)
      
      // Faraway items can be spread wider linearly
      const spreadScale = 1 + (1 - depthFactor) * 2;
      const spreadX = (Math.random() - 0.5) * 1600 * spreadScale; 
      // Condensed height and slightly offset upwards so images stay floating elegantly in the upper portion
      const spreadY = ((Math.random() - 0.45) * 850) * spreadScale; 
      
      const spreadPos = new THREE.Vector3(spreadX, spreadY, spreadZ);

      meshGroup.position.copy(gatheredPos);
      meshGroup.scale.setScalar(gatheredScale);
      meshGroup.lookAt(gatheredX, gatheredY, gatheredZ + 100); 
      meshGroup.rotateZ(gatheredRotZ);

      group.add(meshGroup);
      meshData.push({ mesh: meshGroup, gatheredPos, spreadPos, gatheredRotZ, gatheredScale });


      // Initialize with instant local fallback texture so the user NEVER sees a blank frame
      const initialFallbackUrl = fallbackLocalImages[i % fallbackLocalImages.length];
      const material = new THREE.MeshBasicMaterial({ 
        transparent: true,
        opacity: 0.95, // Fully visible shape initially
        side: THREE.DoubleSide,
        depthWrite: false, // Prevent transparent planes from occluding each other
        alphaTest: 0.05, // Reject mostly transparent pixels to avoid sorting issues completely
      });

      const mesh = new THREE.Mesh(geometry, material);
      meshGroup.add(mesh);

      // 1. Immediately trigger instant local load
      localLoader.load(initialFallbackUrl, (fallbackTx) => {
        fallbackTx.colorSpace = THREE.SRGBColorSpace;
        if (!material.map) {
          material.map = fallbackTx;
          material.needsUpdate = true;
        }
      });

      // 2. Load the actual target URL asynchronously (progressive enhancement with robust backoff retry)
      const isExternal = img.url.startsWith("http://") || img.url.startsWith("https://");
      const activeLoader = isExternal ? externalLoader : localLoader;

      const loadWithRetry = (urlToLoad: string, attemptsLeft: number) => {
        activeLoader.load(
          urlToLoad,
          (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            const aspect = texture.image.width / texture.image.height;
            mesh.scale.set(aspect, 1, 1);
            material.map = texture;
            material.opacity = 1;
            material.needsUpdate = true;
          },
          undefined,
          (err) => {
            if (attemptsLeft > 0) {
              const separator = urlToLoad.includes('?') ? '&' : '?';
              const cleanBaseUrl = urlToLoad.split('?')[0];
              const retryUrl = `${cleanBaseUrl}${separator}retry=${Date.now()}&attempt=${6 - attemptsLeft}`;
              const delay = Math.min(10000, 500 * Math.pow(2, 6 - attemptsLeft));
              setTimeout(() => {
                loadWithRetry(retryUrl, attemptsLeft - 1);
              }, delay);
            } else {
              console.warn("Progressive load failed for:", img.url, "- kept beautiful local fallback shape.", err);
            }
          }
        );
      };

      loadWithRetry(img.url, 5);
    });

    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);
      
      if (groupRef.current && cameraRef.current) {
        // Smoothly interpolate spread factor
        spreadRef.current.current += (spreadRef.current.target - spreadRef.current.current) * 0.05;
        const currentSpread = spreadRef.current.current;

        // Zoom the whole group
        const groupScale = 1 + currentSpread * 1.5;
        groupRef.current.scale.set(groupScale, groupScale, groupScale);

        // Smoothly interpolate drag rotations
        dragRotationRef.current.x += (dragRotationRef.current.targetX - dragRotationRef.current.x) * 0.1;
        dragRotationRef.current.y += (dragRotationRef.current.targetY - dragRotationRef.current.y) * 0.1;

        // Subtle horizontal auto-rotation drift when user is not actively dragging
        if (!mouseRef.current.isDown) {
          dragRotationRef.current.targetY += 0.0015;
        }

        // Apply drag rotation to group combined with responsive parallax offset
        groupRef.current.rotation.y = dragRotationRef.current.y + rotationRef.current.x * 0.35;
        groupRef.current.rotation.x = dragRotationRef.current.x - rotationRef.current.y * 0.25;

        // Spread out items
        meshData.forEach((data) => {
           data.mesh.position.lerpVectors(data.gatheredPos, data.spreadPos, currentSpread);
           const currentScale = THREE.MathUtils.lerp(data.gatheredScale, 1.0, currentSpread);
           data.mesh.scale.setScalar(currentScale);

           // Always look forward (facing camera) by applying inverted parent rotation
           data.mesh.quaternion.copy(groupRef.current!.quaternion).invert(); 
           data.mesh.rotateZ(THREE.MathUtils.lerp(data.gatheredRotZ, 0, currentSpread));
        });

        if (!hasStartedRef.current) {
          // Smooth center parallax movement
          const targetY = groupBaseY + rotationRef.current.y * 80;
          groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.05;
          groupRef.current.position.x += ((rotationRef.current.x * 80) - groupRef.current.position.x) * 0.05;
        } else {
          // Wrap up animation - gather everything in to center quickly
          meshData.forEach((data) => {
            data.mesh.position.multiplyScalar(0.9);
            data.mesh.scale.multiplyScalar(0.9);
          });
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    let previousPointerPosition = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      if (!isExploringRef.current) return;
      mouseRef.current.isDown = true;
      previousPointerPosition = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (hasStartedRef.current || !isExploringRef.current) return;
      
      // Normalized safe coordinates (-1 to 1)
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      
      rotationRef.current.x = nx;
      rotationRef.current.y = ny;

      if (mouseRef.current.isDown) {
        const deltaX = e.clientX - previousPointerPosition.x;
        const deltaY = e.clientY - previousPointerPosition.y;

        // Swipe / Drag to orbit group in 3D space
        dragRotationRef.current.targetY += deltaX * 0.005;
        dragRotationRef.current.targetX += deltaY * 0.005;

        // Prevent flipping upside down
        dragRotationRef.current.targetX = THREE.MathUtils.clamp(
          dragRotationRef.current.targetX,
          -Math.PI / 3,
          Math.PI / 3
        );

        previousPointerPosition = { x: e.clientX, y: e.clientY };
      }
    };

    const onPointerUp = () => {
      mouseRef.current.isDown = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (hasStartedRef.current) return;
      
      if (!isExploringRef.current) return; // Prevent scrolling before clicking the button
      
      const delta = e.deltaY;
      const step = Math.sign(delta) * 0.03 + delta * 0.001;

      // Scroll down/up changes spread
      const newTarget = Math.max(0, Math.min(1.2, spreadRef.current.target + step));
      spreadRef.current.target = newTarget;
      setSpreadValue(newTarget);

      if (newTarget > 0.6) {
        setShowButton(true);
      } else if (newTarget < 0.3) {
        setShowButton(false);
      }
    };

    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("resize", handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);

      // Cleanly dispose of all Three.js WebGL objects to prevent memory leaks and black screen/GPU context loss crashes
      try {
        if (sceneRef.current) {
          sceneRef.current.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              if (object.geometry) {
                object.geometry.dispose();
              }
              if (object.material) {
                if (Array.isArray(object.material)) {
                  object.material.forEach((mat) => {
                    if (mat.map) mat.map.dispose();
                    mat.dispose();
                  });
                } else {
                  if (object.material.map) {
                    object.material.map.dispose();
                  }
                  object.material.dispose();
                }
              }
            }
          });
        }
      } catch (e) {
        console.warn("Error during Three.js scene traversal disposal:", e);
      }

      try {
        if (geometry) {
          geometry.dispose();
        }
      } catch (e) {}

      try {
        if (rendererRef.current) {
          rendererRef.current.dispose();
        }
      } catch (e) {}

      if (rendererRef.current && containerRef.current && rendererRef.current.domElement.parentNode) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }

      // Clear references
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      groupRef.current = null;
    };
  }, [images]);

  const handleExploreClick = () => {
    setIsExploring(true);
    isExploringRef.current = true;
    
    // Smoothly animate the spread target to end up at a beautiful spread level of 0.8 automatically
    const t = setInterval(() => {
      const nextTarget = Math.min(0.8, spreadRef.current.target + 0.025);
      spreadRef.current.target = nextTarget;
      setSpreadValue(nextTarget);
      if (nextTarget >= 0.8) {
        clearInterval(t);
      }
    }, 16);

    // Cleanly auto-reveal the extraction button after the scatter animation completes (1.2s)
    setTimeout(() => {
      setShowButton(true);
    }, 1200);
  };

  return (
    <div 
      className="fixed inset-0 w-full h-[100vh] overflow-hidden bg-transparent select-none"
      style={{ height: "100vh", overflow: "hidden" }}
    >
      {/* Absolute Full Screen Three.js Canvas Container */}
      <div 
        ref={containerRef} 
        className="absolute top-0 left-0 w-full h-full z-0 touch-none" 
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', touchAction: 'none' }} 
      />
      
      {/* Initial Intro Text (Bottom Centered) */}
      <div className="absolute bottom-44 left-0 w-full z-20 pointer-events-none flex justify-center">
        <AnimatePresence>
          {!isExploring && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="flex flex-col items-center gap-6 text-center"
            >
              <h2 className="text-xl md:text-3xl font-normal text-black text-center leading-relaxed font-dandan tracking-wide">
                안녕하세요, {userName}님<br />
                {userName}님의 이미지 아카이브입니다.
              </h2>
              <CustomButton
                onClick={handleExploreClick}
                variant="secondary"
                className="pointer-events-auto px-12 h-[54px] mx-auto text-sm font-bold tracking-widest uppercase"
              >
                둘러보기
              </CustomButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Interactive Glass Slider to Adjust Spread - Shown when isExploring is true and hasStarted is false */}
      {isExploring && !hasStarted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 bg-white/20 backdrop-blur-xl px-6 py-3.5 rounded-full border border-white/40 shadow-[0_12px_40px_rgba(0,0,0,0.06)] pointer-events-auto"
        >
          <div className="flex items-center gap-4 text-xs font-bold text-black/70 font-sans tracking-tight">
            <span>모아보기 🎯</span>
            <input 
              type="range" 
              min="0" 
              max="1.2" 
              step="0.01"
              value={spreadValue}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setSpreadValue(val);
                spreadRef.current.target = val;
                if (!isExploring) {
                  setIsExploring(true);
                  isExploringRef.current = true;
                }
                if (val > 0.6) {
                  setShowButton(true);
                } else if (val < 0.3) {
                  setShowButton(false);
                }
              }}
              className="w-32 md:w-48 accent-black cursor-pointer h-1 bg-black/10 rounded-lg outline-none appearance-none"
            />
            <span>펼쳐보기 🌐</span>
          </div>
        </motion.div>
      )}

      {/* Action Button (Extract) in Bottom-Right Corner */}
      <div className="absolute bottom-8 right-8 z-20 pointer-events-none flex items-end justify-end">
        <AnimatePresence>
          {showButton && !hasStarted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-3.5 bg-white/45 backdrop-blur-xl p-6 rounded-[2rem] border border-white/40 shadow-[0_12px_40px_rgba(0,0,0,0.08)] max-w-xs text-center pointer-events-auto"
            >
              <div className="flex flex-col items-center">
                <p className="text-[9px] font-black text-black/60 tracking-[0.4em] uppercase">Extraction Ready</p>
                <h3 className="text-xs md:text-sm font-semibold text-black/80 leading-snug mt-1.5">
                  충분히 둘러보셨나요?<br />
                  이제 {userName}님의 시각 파편을 추출합니다.
                </h3>
              </div>

              <CustomButton
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  setHasStarted(true);
                  hasStartedRef.current = true;
                  setTimeout(onNext, 1500);
                }}
                variant="secondary"
                className="mt-1 pointer-events-auto px-12 h-[54px] mx-auto text-sm font-bold tracking-widest uppercase flex items-center gap-2 justify-center"
              >
                이미지 추출하기 <ArrowRight size={14} strokeWidth={2.5} />
              </CustomButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

