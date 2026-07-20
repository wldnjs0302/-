import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { UserData, PageId, ImageItem } from './types';
import P1Intro from './components/P1Intro';
import GlobalBackground from './components/GlobalBackground';
import P2Identity from './components/P2Identity';
import { generateDummyImages } from './mockData';
import P4Orbit from './components/P4Orbit';
import P5Selection from './components/P5Selection';
import P6Analysis from './components/P6Analysis';
import P7Creation from './components/P7Creation';
import P8Report from './components/P8Report';
import AdminDashboard from './components/AdminDashboard';
import { resolveAssetUrl } from './utils/imageRetry';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('P1');

  const [isAdminMode, setIsAdminMode] = useState(() => {
    return window.location.pathname === "/admin";
  });

  useEffect(() => {
    const handlePopState = () => {
      setIsAdminMode(window.location.pathname === "/admin");
    };
    window.addEventListener("popstate", handlePopState);
    
    (window as any).__onAdminEnter = () => {
      setIsAdminMode(true);
    };
    
    return () => {
      window.removeEventListener("popstate", handlePopState);
      delete (window as any).__onAdminEnter;
    };
  }, []);

  const [userData, setUserData] = useState<UserData | null>(() => {
    try {
      const saved = localStorage.getItem('homo_images_userData');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [images, setImages] = useState<ImageItem[]>(() => {
    try {
      const saved = localStorage.getItem('homo_images_images');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedImages, setSelectedImages] = useState<ImageItem[]>(() => {
    try {
      const saved = localStorage.getItem('homo_images_selectedImages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [middleName, setMiddleName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('homo_images_middleName');
      return saved || "";
    } catch {
      return "";
    }
  });

  const [creationResult, setCreationResult] = useState<{ url: string; signature: string } | null>(() => {
    try {
      const saved = localStorage.getItem('homo_images_creationResult');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isDevOpen, setIsDevOpen] = useState(false);
  const [isDevVerified, setIsDevVerified] = useState(false);
  const [devPasscode, setDevPasscode] = useState("");
  const [devVerifying, setDevVerifying] = useState(false);
  const [devError, setDevError] = useState("");

  const handleDevVerify = useCallback(async (codeToVerify: string) => {
    if (!codeToVerify) return;
    setDevVerifying(true);
    setDevError("");
    try {
      const res = await fetch("/api/admin/verify-passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: codeToVerify })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsDevVerified(true);
        localStorage.setItem("homo_images_admin_passcode", codeToVerify);
      } else {
        setDevError("비밀번호가 올바르지 않습니다.");
      }
    } catch (err) {
      setDevError("연결 오류가 발생했습니다.");
    } finally {
      setDevVerifying(false);
    }
  }, []);

  const handleOpenDev = useCallback(() => {
    setIsDevOpen(true);
    const saved = localStorage.getItem("homo_images_admin_passcode") || "";
    if (saved && !isDevVerified) {
      handleDevVerify(saved);
    }
  }, [isDevVerified, handleDevVerify]);

  // Synchronizers to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('homo_images_currentPage', currentPage);
    } catch (e) {
      console.warn("Storage write error:", e);
    }
  }, [currentPage]);

  useEffect(() => {
    try {
      if (userData) {
        localStorage.setItem('homo_images_userData', JSON.stringify(userData));
      } else {
        localStorage.removeItem('homo_images_userData');
      }
    } catch (e) {}
  }, [userData]);

  useEffect(() => {
    try {
      if (images && images.length > 0) {
        localStorage.setItem('homo_images_images', JSON.stringify(images));
      } else {
        localStorage.removeItem('homo_images_images');
      }
    } catch (e) {}
  }, [images]);

  useEffect(() => {
    try {
      if (selectedImages && selectedImages.length > 0) {
        localStorage.setItem('homo_images_selectedImages', JSON.stringify(selectedImages));
      } else {
        localStorage.removeItem('homo_images_selectedImages');
      }
    } catch (e) {}
  }, [selectedImages]);

  useEffect(() => {
    try {
      localStorage.setItem('homo_images_middleName', middleName);
    } catch (e) {}
  }, [middleName]);

  useEffect(() => {
    try {
      if (creationResult) {
        localStorage.setItem('homo_images_creationResult', JSON.stringify(creationResult));
      } else {
        localStorage.removeItem('homo_images_creationResult');
      }
    } catch (e) {}
  }, [creationResult]);

  // Real-time synchronization: Use mapping instead of backend API
  useEffect(() => {
    if (userData && userData.name) {
      console.log("Mount/Sync effect: Loading images for user:", userData.name);
      import('./data/userMapping').then(({ getUserCustomImages, DEFAULT_CUSTOM_IMAGE }) => {
        const customImages = getUserCustomImages(userData.name);
        if (customImages) {
          console.log("Successfully loaded images from mapping:", customImages.length);
          setImages(customImages);
        } else {
          console.warn("No images found for user in mapping, using default.");
          setImages([DEFAULT_CUSTOM_IMAGE]);
        }
      });
    }
  }, [userData?.name]);

  const handleReset = useCallback(() => {
    try {
      localStorage.removeItem('homo_images_currentPage');
      localStorage.removeItem('homo_images_userData');
      localStorage.removeItem('homo_images_images');
      localStorage.removeItem('homo_images_selectedImages');
      localStorage.removeItem('homo_images_middleName');
      localStorage.removeItem('homo_images_creationResult');
      localStorage.removeItem('homo_images_dynamicAnalysis');
      localStorage.removeItem('homo_images_cachedName');
      localStorage.removeItem('homo_images_cache_version');
    } catch (e) {}
    setUserData(null);
    setImages([]);
    setSelectedImages([]);
    setMiddleName("");
    setCreationResult(null);
    setCurrentPage('P1');
  }, []);

  // Debug fast-forward
  const jumpToPage = (pageId: PageId) => {
    setCurrentPage(pageId);
    
    const targetName = "최지원";
    setUserData({ name: targetName, birthDate: "951010", gender: "female" });
    const dummyImages = generateDummyImages(targetName);
    setImages(dummyImages);
    setSelectedImages(dummyImages.slice(0, 10));
    if (!middleName) setMiddleName("HARMONIOUS");
    setCreationResult({ url: "https://placehold.co/400x400/eeeeee/888888?text=CREATION", signature: targetName });

    // Preload dummy images instantly
    dummyImages.forEach(img => {
      const preloadImg = new Image();
      preloadImg.src = img.url;
    });

    // Background fetch to keep dynamic images updated in Dev Jump state
    import('./data/userMapping').then(({ getUserCustomImages }) => {
      const customImages = getUserCustomImages(targetName);
      if (customImages) {
        setImages(customImages);
        setSelectedImages(customImages.slice(0, 10));
        customImages.slice(0, 10).forEach((img: any) => {
          const preloadImg = new Image();
          preloadImg.src = img.url;
        });
      }
    });
  };

  const handleStartLab = useCallback(() => {
    setCurrentPage('P2');
    window.scrollTo(0, 0);
  }, []);

  const handleIdentityComplete = useCallback((data: UserData) => {
    setUserData(data);
    setCurrentPage('P3');
    window.scrollTo(0, 0);
    
    // Generate initial dummy images as an instant fallback
    const dummyImages = generateDummyImages(data.name);
    setImages(dummyImages);

    const startTime = Date.now();
    const minLoadingTime = 7000; // Keep loading for at least 7.0s as explicitly requested!
    const maxLoadingTime = 300000; // Keep loading up to 5 minutes to ensure all images are fully preloaded, as requested!
    let transitionTriggered = false;

    const proceedToOrbit = () => {
      if (transitionTriggered) return;
      transitionTriggered = true;
      setCurrentPage('P4');
    };

    const triggerTransition = (pendingPromises: Promise<any>[]) => {
      Promise.all(pendingPromises).then(() => {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        setTimeout(proceedToOrbit, remainingTime);
      }).catch((err) => {
        console.warn("Preloading encountered some image errors, proceeding to P4 anyway:", err);
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        setTimeout(proceedToOrbit, remainingTime);
      });
    };

    // Preload falling/orbit images during P3 (Syncing Screen) so they exist in browser cache!
    const dummyPromises = dummyImages.map(img => {
      return new Promise<void>((resolve) => {
        const preloadImg = new Image();
        preloadImg.src = resolveAssetUrl(img.url);
        preloadImg.onload = () => resolve();
        preloadImg.onerror = () => resolve();
      });
    });

    // Asynchronously fetch dynamic custom folder images (or custom fallback) from mapping
    import('./data/userMapping').then(({ getUserCustomImages }) => {
      console.log(`Debug: Looking for images for user: "${data.name}"`);
      const customImages = getUserCustomImages(data.name);
      if (customImages && customImages.length > 0) {
        console.log(`Successfully synced backend images for "${data.name}":`, customImages.length);
        setImages(customImages);
        const customPromises = customImages.map((img: ImageItem) => {
          return new Promise<void>((resolve) => {
            const preloadImg = new Image();
            preloadImg.src = resolveAssetUrl(img.url);
            preloadImg.onload = () => resolve();
            preloadImg.onerror = () => resolve();
          });
        });
        triggerTransition(customPromises);
      } else {
        console.log(`Debug: No images found for user "${data.name}" in USER_CUSTOM_IMAGES mapping.`);
        triggerTransition(dummyPromises);
      }
    }).catch(err => {
      console.error("Error dynamically preloading user custom images:", err);
      triggerTransition(dummyPromises);
    });
    
    // Absolute safety fallback
    setTimeout(proceedToOrbit, maxLoadingTime);
  }, []);


  const handleP4Next = useCallback(() => {
    setCurrentPage('P5');
  }, []);

  const handleP5Complete = useCallback((selected: ImageItem[]) => {
    setSelectedImages(selected);
    setCurrentPage('P6');
    window.scrollTo(0, 0);
  }, []);

  const handleP6Next = useCallback((name: string) => {
    setMiddleName(name);
    setCurrentPage('P7');
    window.scrollTo(0, 0);
  }, []);

  const handleP7Complete = useCallback((url: string, signature: string) => {
    setCreationResult({ url, signature });
    setCurrentPage('P8');
    window.scrollTo(0, 0);

    if (userData) {
      let dynamicAnalysisObj = {};
      try {
        const saved = localStorage.getItem('homo_images_dynamicAnalysis');
        if (saved) {
          dynamicAnalysisObj = JSON.parse(saved);
        }
      } catch (err) {
        console.warn("Error parsing dynamicAnalysis from localStorage:", err);
      }

      fetch("/api/save-result", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userData,
          middleName,
          creationUrl: url,
          lastNameSignature: signature,
          selectedImages: selectedImages.map(img => ({
            id: img.id,
            url: img.url,
            trait: img.trait
          })),
          dynamicAnalysis: dynamicAnalysisObj
        })
      })
      .then(res => res.json())
      .then(data => {
        console.log("Result saved successfully:", data);
      })
      .catch(err => {
        console.warn("Error auto-saving result:", err);
      });
    }
  }, [userData, middleName, selectedImages]);

  if (isAdminMode) {
    return (
      <AdminDashboard 
        onExit={() => {
          window.history.pushState({}, "", "/");
          setIsAdminMode(false);
        }} 
      />
    );
  }

  return (
    <div className="bg-white min-h-screen relative overflow-x-hidden">
      <GlobalBackground currentPage={currentPage} />
      <AnimatePresence mode="wait">
        {currentPage === 'P1' && (
          <motion.div key="p1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <P1Intro onNext={handleStartLab} />
          </motion.div>
        )}

        {currentPage === 'P2' && (
          <motion.div key="p2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <P2Identity onComplete={handleIdentityComplete} />
          </motion.div>
        )}

        {currentPage === 'P3' && (
          <motion.div
            key="p3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen flex flex-col items-center justify-center text-center p-6 bg-transparent"
          >
            <div className="space-y-8 max-w-md w-full">
              <h2 className="text-2xl font-bold tracking-tight">
                실험자 <span className="text-black">{userData?.name}</span>님의 데이터를 동기화 중...
              </h2>
              
              <div className="flex justify-center items-center h-24 space-x-4">
                {["/age-infant.png", "/age-child.png", "/age-adult.png", "/age-middle.png", "/age-senior.png"].map((src, i) => (
                  <motion.img 
                    key={i}
                    src={resolveAssetUrl(src)}
                    className="h-16 w-16 md:h-20 md:w-20 object-contain drop-shadow-sm"
                    animate={{ 
                      opacity: [0, 1, 1, 0],
                      scale: [0.8, 1.05, 1, 1, 0.8],
                      y: [15, -2, 0, 0, 15]
                    }}
                    transition={{
                      duration: 3.5,
                      repeat: Infinity,
                      repeatDelay: 1,
                      delay: i * 0.4,
                      times: [0, 0.15, 0.25, 0.85, 1],
                      ease: ["easeOut", "easeInOut", "easeInOut", "easeIn"]
                    }}
                    alt={`loading-${i}`}
                  />
                ))}
              </div>


              <p className="text-gray-400 text-xs animate-pulse">무의식 궤도 아카이브를 불러오는 중입니다.</p>
            </div>
          </motion.div>
        )}

        {currentPage === 'P4' && (
          <motion.div key="p4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50">
            <P4Orbit images={images} userName={userData?.name || ""} onNext={handleP4Next} />
          </motion.div>
        )}

        {currentPage === 'P5' && (
          <motion.div key="p5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <P5Selection images={images} onComplete={handleP5Complete} />
          </motion.div>
        )}

        {currentPage === 'P6' && (
          <motion.div key="p6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <P6Analysis selectedImages={selectedImages} userName={userData?.name || "실험자"} onNext={handleP6Next} />
          </motion.div>
        )}

        {currentPage === 'P7' && (
          <motion.div key="p7" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <P7Creation 
              selectedImages={selectedImages} 
              middleName={middleName} 
              userName={userData?.name || ""}
              onComplete={handleP7Complete}
            />
          </motion.div>
        )}

        {currentPage === 'P8' && userData && creationResult && (
          <motion.div key="p8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <P8Report 
              userData={userData} 
              middleName={middleName} 
              creationUrl={creationResult.url} 
              lastNameSignature={creationResult.signature}
              selectedImages={selectedImages}
              allImages={images}
              onReset={handleReset}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Development Setup / Debug Menu */}
      <div className={`fixed bottom-4 left-4 z-[9999] transition-all duration-300 ${
        isDevOpen 
          ? (isDevVerified ? 'w-32 bg-white/95 border border-black/15 shadow-xl p-2 rounded-xl max-h-[50vh] overflow-y-auto' : 'w-48 bg-white/95 border border-black/15 shadow-xl p-3 rounded-xl')
          : 'w-10 h-10 bg-black/80 hover:bg-black text-white hover:scale-105 rounded-full flex items-center justify-center shadow-lg'
      }`}>
        {!isDevOpen ? (
          <button 
            onClick={handleOpenDev}
            className="w-full h-full flex items-center justify-center font-bold text-xs cursor-pointer"
            title="Dev Jump 펼치기"
          >
            🛠️
          </button>
        ) : (
          <div className="flex flex-col gap-1">
            <div 
              onClick={() => {
                setIsDevOpen(false);
                setDevError("");
              }}
              className="text-[9px] font-black tracking-widest px-2 py-1 text-black/50 hover:text-black hover:bg-black/5 rounded cursor-pointer text-center uppercase border-b border-black/5 mb-1 flex items-center justify-between"
              title="Dev Jump 접기"
            >
              <span>Dev Jump</span>
              <span className="text-[8px] font-bold">▼</span>
            </div>

            {!isDevVerified ? (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleDevVerify(devPasscode);
                }}
                className="flex flex-col gap-2 mt-1"
              >
                <div className="text-[10px] text-black/60 font-medium text-center">관리자 전용 비공개 기능</div>
                <input
                  type="password"
                  value={devPasscode}
                  onChange={(e) => setDevPasscode(e.target.value)}
                  placeholder="Password"
                  className="w-full text-xs bg-black/5 border border-black/10 rounded-lg px-2 py-1.5 outline-none text-black focus:border-black/30 text-center"
                  disabled={devVerifying}
                  autoFocus
                />
                {devError && (
                  <div className="text-[9px] text-red-500 font-bold text-center leading-tight">
                    {devError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={devVerifying || !devPasscode}
                  className="w-full bg-black text-white text-[10px] font-bold py-1.5 rounded-lg hover:bg-black/80 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {devVerifying ? "확인 중..." : "인증하기"}
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-1">
                {["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"].map((p) => (
                  <button 
                    key={p} 
                    onClick={() => jumpToPage(p as PageId)}
                    className={`text-[10px] font-bold px-2 py-1.5 rounded-md transition-colors ${currentPage === p ? 'bg-black text-white' : 'hover:bg-black/5 text-black/60'}`}
                  >
                    {p} {p === "P6" && "(분석)"}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}




