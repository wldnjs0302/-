import { motion } from "motion/react";
import { useState } from "react";
import { CustomButton } from "./CustomButton";
import { handleImageError } from "../utils/imageRetry";

interface P1IntroProps {
  onNext: () => void;
}

const COLLAGE_ITEMS = [
  // Top Left bounds 
  { id: 1, img: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&q=80", x: "2%", y: "-5%", rotate: -15, scale: 0.6, delay: 0 },
  { id: 4, img: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&q=80", x: "15%", y: "5%", rotate: -20, scale: 0.4, delay: 0.7 },
  { id: 31, text: "📷", x: "10%", y: "15%", rotate: 12, scale: 1.0, isEmoji: true, delay: 2.2 },
  { id: 58, img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80", x: "-2%", y: "8%", rotate: 5, scale: 0.5, delay: 1.4 },
  
  // Top Center bounds 
  { id: 20, img: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&q=80", x: "40%", y: "-10%", rotate: 5, scale: 0.6, delay: 7.1 },
  { id: 7, text: "👁️", x: "30%", y: "2%", rotate: 0, scale: 1.3, isEmoji: true, delay: 0.1 },
  { id: 51, img: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80", x: "60%", y: "-5%", rotate: -5, scale: 0.5, delay: 0.1 },
  
  // Top Right bounds 
  { id: 2, img: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80", x: "75%", y: "-2%", rotate: 20, scale: 0.6, delay: 0.4 },
  { id: 54, img: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600&q=80", x: "85%", y: "5%", rotate: 10, scale: 0.4, delay: 0.6 },
  { id: 14, img: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&q=80", x: "80%", y: "18%", rotate: -5, scale: 0.4, delay: 4.2 },
 
  // Middle Left bounds 
  { id: 3, img: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80", x: "-2%", y: "35%", rotate: 8, scale: 0.6, delay: 1.1 },
  { id: 11, img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&q=80", x: "-5%", y: "22%", rotate: -10, scale: 0.5, delay: 2.8 },
  { id: 15, img: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80", x: "8%", y: "25%", rotate: 10, scale: 0.5, delay: 4.8 },
  { id: 21, img: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&q=80", x: "-4%", y: "55%", rotate: -10, scale: 0.5, delay: 0.1 },
  { id: 8, img: "https://images.unsplash.com/photo-1472214222541-d510753a8707?w=600&q=80", x: "12%", y: "45%", rotate: 5, scale: 0.4, delay: 1.5 },
 
  // Middle Right bounds 
  { id: 6, img: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&q=80", x: "85%", y: "35%", rotate: -8, scale: 0.6, delay: 0.2 },
  { id: 12, img: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&q=80", x: "76%", y: "30%", rotate: 15, scale: 0.5, delay: 3.2 },
  { id: 16, img: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&q=80", x: "86%", y: "50%", rotate: -18, scale: 0.5, delay: 5.2 },
  { id: 34, text: "⚡", x: "85%", y: "45%", rotate: 0, scale: 1.4, isEmoji: true, delay: 5.1 },
  { id: 40, text: "🎨", x: "78%", y: "60%", rotate: 0, scale: 1.2, isEmoji: true, delay: 5.5 },
  
  // Middle Center bounds
  { id: 70, img: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&q=80", x: "40%", y: "45%", rotate: -10, scale: 0.5, delay: 1.2 },
  { id: 71, text: "💫", x: "60%", y: "35%", rotate: 15, scale: 1.2, isEmoji: true, delay: 0.8 },
  { id: 72, img: "https://images.unsplash.com/photo-1505761671935-60b3a7424954?w=600&q=80", x: "45%", y: "55%", rotate: 5, scale: 0.4, delay: 3.5 },
  { id: 73, img: "https://images.unsplash.com/photo-1510519138101-570d1dca3d66?w=600&q=80", x: "32%", y: "40%", rotate: 18, scale: 0.3, delay: 2.1 },
  { id: 74, img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80", x: "55%", y: "60%", rotate: -22, scale: 0.6, delay: 0.5 },
  
  // Bottom Left bounds 
  { id: 5, img: "https://images.unsplash.com/photo-1511497584788-876760111969?w=600&q=80", x: "5%", y: "85%", rotate: 15, scale: 0.7, delay: 1.3 },
  { id: 13, text: "✨", x: "2%", y: "95%", rotate: 0, scale: 1.1, isEmoji: true, delay: 3.8 },
  { id: 17, text: "📽️", x: "15%", y: "98%", rotate: 0, scale: 1.2, isEmoji: true, delay: 5.7 },
  { id: 53, img: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&q=80", x: "-6%", y: "90%", rotate: -18, scale: 0.5, delay: 0.5 },
 
  // Bottom Center bounds 
  { id: 9, img: "https://images.unsplash.com/photo-1508921912186-1d1a45ebb3c1?w=600&q=80", x: "50%", y: "95%", rotate: -15, scale: 0.6, delay: 1.9 },
  { id: 37, text: "🎭", x: "32%", y: "92%", rotate: -5, scale: 1.3, isEmoji: true, delay: 2.6 },
  { id: 56, img: "https://images.unsplash.com/photo-1549880181-56a44cf8a4a5?w=600&q=80", x: "65%", y: "90%", rotate: 12, scale: 0.5, delay: 1.0 },
  
  // Bottom Right bounds 
  { id: 52, img: "https://images.unsplash.com/photo-1520052205864-92d242b3a76b?w=600&q=80", x: "78%", y: "90%", rotate: 12, scale: 0.6, delay: 0.3 },
  { id: 18, img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&q=80", x: "85%", y: "85%", rotate: 22, scale: 0.4, delay: 6.2 },
];

export default function P1Intro({ onNext }: P1IntroProps) {
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [hoverLeftRow, setHoverLeftRow] = useState(false);
  const [hoverRightRow, setHoverRightRow] = useState(false);

  return (
    <div className="relative bg-transparent select-none overflow-x-hidden w-full">
      {/* Background Collage - Change fixed to absolute to scroll with content */}
      <div 
        className={`absolute inset-0 pointer-events-none z-0 transition-all ease-in-out duration-700 h-full w-full`}
        style={{ 
          filter: isLogoHovered ? "sepia(1) hue-rotate(115deg) saturate(5) brightness(1.2) contrast(1.1)" : "sepia(0) hue-rotate(0deg) saturate(1) brightness(1)" 
        }}
      >
        {COLLAGE_ITEMS.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0, rotate: item.rotate }}
            animate={{ 
              opacity: 0.9, 
              scale: item.scale,
              y: [0, -25, 12, -18, 0],
              x: [0, 15, -10, 20, 0],
              rotate: [item.rotate, item.rotate + 4, item.rotate - 4, item.rotate]
            }}
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.05}
            whileHover={{ 
              scale: item.scale * 1.08, 
              zIndex: 50, 
              opacity: 1,
              filter: "contrast(1.1) saturate(1.1)" 
            }}
            transition={{ 
              opacity: { duration: 3, delay: item.delay },
              scale: { duration: 3, delay: item.delay },
              y: { duration: 35 + Math.random() * 30, repeat: Infinity, ease: "easeInOut" },
              x: { duration: 40 + Math.random() * 30, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 45 + Math.random() * 30, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute pointer-events-auto cursor-grab active:cursor-grabbing"
            style={{ left: item.x, top: item.y }}
          >
            {item.isEmoji ? (
              <span className="text-8xl opacity-25">{item.text}</span>
            ) : (
              <div className="w-36 md:w-60 aspect-[4/5] rounded-[2rem_5rem_3rem_6rem/5rem_3rem_6rem_2rem] overflow-hidden shadow-[0_15px_45px_-10px_rgba(0,0,0,0.3)] border-2 border-white/90 backdrop-blur-sm transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] active:scale-110">
                <img 
                  src={item.img} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover pointer-events-none contrast-[1.1]" 
                  alt="item"
                  onError={handleImageError}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 w-full flex flex-col justify-between pb-32">
        {/* Section 1: Logo */}
        <section className="h-[100vh] shrink-0 flex flex-col items-center justify-center text-center px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center pt-24"
          >
            <div className="relative">
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute -top-16 md:-top-24 left-1/2 -translate-x-1/2 font-dandan text-xl md:text-2xl font-normal tracking-[0.5em] text-black bg-white/40 px-6 py-2 rounded-full backdrop-blur-xl border border-white/50 z-20 whitespace-nowrap"
              >
                FUTURE ARCHIVE
              </motion.p>
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-[85vw] md:max-w-3xl mx-auto flex flex-col justify-center items-center font-permanent text-[22vw] md:text-[16vw] leading-[0.75] tracking-tighter select-none pointer-events-auto"
                onMouseEnter={() => setIsLogoHovered(true)}
                onMouseLeave={() => setIsLogoHovered(false)}
              >
                <div className={`flex flex-col items-center select-none transition-all duration-700 ${isLogoHovered ? "scale-[1.02]" : "scale-100"}`}>
                  <img 
                    src="/logo.png" 
                    alt="HOMO IMAGES Lab"
                    className="w-[60vw] md:w-[30vw] max-w-sm transition-all duration-700"
                    style={{
                      filter: isLogoHovered 
                        ? 'invert(79%) sepia(45%) saturate(4521%) hue-rotate(114deg) brightness(102%) contrast(106%) drop-shadow(0 0 20px rgba(0, 255, 170, 0.4))' 
                        : 'invert(0%) sepia(0%) saturate(100%) hue-rotate(0deg) brightness(100%) drop-shadow(0 0 0px rgba(0,0,0,0))'
                    }}
                  />
                </div>
              </motion.div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ delay: 2, duration: 2, repeat: Infinity }}
              className="mt-24 md:mt-32 flex flex-col items-center gap-2"
            >
              <p className="text-[10px] font-bold tracking-[0.5em] text-gray-800">SCROLL DOWN</p>
              <div className="w-[1px] h-16 bg-gradient-to-b from-gray-500 to-transparent" />
            </motion.div>
          </motion.div>
        </section>

        {/* Section 2: Intro & "Touch me" paper animations with Login */}
        <section className="min-h-[180vh] flex flex-col items-center justify-end pb-32 text-center px-4 relative overflow-hidden">
          
          {/* Left Paper (hello) */}
          <div className="absolute left-8 md:left-24 top-[30vh] pointer-events-auto group z-20" 
               onMouseEnter={() => setHoverLeftRow(true)}
               onMouseLeave={() => setHoverLeftRow(false)}
          >
            <div className="relative text-black font-dandan font-black text-2xl px-12 py-8 w-fit origin-center -rotate-[20deg] cursor-pointer transform transition-transform hover:scale-105 flex items-center justify-center"
            >
              <img src="/small_paper.png" alt="Touch me bg" className="absolute inset-0 w-full h-full object-fill drop-shadow-lg pointer-events-none" />
              <span className="relative z-10 tracking-widest">hello</span>
            </div>
            <motion.div
              initial={{ rotateX: -90, opacity: 0, y: -20 }}
              animate={{ 
                rotateX: hoverLeftRow ? 0 : -90, 
                opacity: hoverLeftRow ? 1 : 0,
                y: hoverLeftRow ? 0 : -20 
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ transformOrigin: "top" }}
              className="absolute top-[80%] left-0 mt-4 p-10 md:p-12 text-black w-[320px] md:w-[380px] -rotate-6 z-30"
            >
              <img src="/paper2.png" alt="Paper 2" className="absolute inset-0 w-full h-full object-fill drop-shadow-2xl pointer-events-none" />
              <div className="relative z-10 px-2 py-2">
                <h3 className="font-dandan font-black text-2xl mb-4 text-left tracking-wider drop-shadow-sm text-neutral-900 border-b-2 border-black/10 pb-2">WELCOME! HOMO!!</h3>
                <p className="font-dandan font-medium leading-relaxed text-sm md:text-base text-left tracking-wider text-neutral-800">
                  호모이미지스 랩은 현대사회에 살아가는 수 많은 현인류들을 새로운 종인 호모 이미지스로 만들기 위해 탄생한 실험이다. 우리는 잠재적으로 호모이미지스적 성향을 가지고 있다 하지만 자연스레 개화한 인간은 드물다. 우리가 그러한 부분을 도와주려고 한다.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right Paper (Touch me) */}
          <div className="absolute right-8 md:right-24 top-[90vh] pointer-events-auto group z-20"
               onMouseEnter={() => setHoverRightRow(true)}
               onMouseLeave={() => setHoverRightRow(false)}
          >
            <div className="relative text-black font-dandan font-black text-2xl px-12 py-8 w-fit origin-center rotate-[15deg] cursor-pointer transform transition-transform hover:scale-105 flex items-center justify-center"
            >
              <img src="/small_paper.png" alt="Touch me bg" className="absolute inset-0 w-full h-full object-fill drop-shadow-lg pointer-events-none" />
              <span className="relative z-10 tracking-widest">Touch me</span>
            </div>
            <motion.div
              initial={{ rotateX: -90, opacity: 0, y: -20 }}
              animate={{ 
                rotateX: hoverRightRow ? 0 : -90, 
                opacity: hoverRightRow ? 1 : 0,
                y: hoverRightRow ? 0 : -20 
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ transformOrigin: "top" }}
              className="absolute top-[80%] right-0 md:right-auto md:left-[-100%] mt-4 p-10 md:p-12 text-black w-[320px] md:w-[380px] rotate-3 z-30"
            >
              <img src="/paper1.png" alt="Paper 1" className="absolute inset-0 w-full h-full object-fill drop-shadow-2xl pointer-events-none" />
              <div className="relative z-10 px-2 py-2">
                <h3 className="font-dandan font-black text-2xl mb-4 text-left tracking-wider drop-shadow-sm text-neutral-900 border-b-2 border-black/10 pb-2">HOMO IMAGES</h3>
                <p className="font-dandan font-medium leading-relaxed text-sm md:text-base text-left tracking-wider text-neutral-800">
                  호모이미지스는 자신의 정체성을 이미지로 잘 드러내는 인류이다. 연예인, 인플루언서, 블로거 다양한 부류에서 호모이미지스적 성향은 발현되고 있다. 아직 발현되지 않은 인간은 이미지를 도구로 사용하는 호모 사피엔스일 뿐이다.
                </p>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.5 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="space-y-16 mt-48 z-20 pointer-events-auto"
          >
            <div className="space-y-6">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                transition={{ delay: 0.2, duration: 1 }}
                className="w-16 h-1 bg-black mx-auto rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]"
              />
              <div className="relative">
                <p className="font-dandan font-black text-3xl md:text-4xl tracking-widest pb-2 text-black leading-snug drop-shadow-sm">
                  호모 이미지스 랩을<br/>소개합니다
                </p>
              </div>
            </div>
            
            <CustomButton
              onClick={onNext}
              variant="secondary"
              className="px-12 h-[54px] mx-auto text-sm font-bold tracking-widest uppercase hover:scale-110 transition-transform bg-white text-black border-2 border-black"
            >
              로그인
            </CustomButton>

            <div className="pt-6">
              <button
                onClick={() => {
                  window.history.pushState({}, "", "/admin");
                  if ((window as any).__onAdminEnter) {
                    (window as any).__onAdminEnter();
                  } else {
                    window.location.href = "/admin";
                  }
                }}
                className="text-xs text-neutral-400 hover:text-neutral-800 transition-colors font-mono tracking-widest uppercase cursor-pointer"
              >
                🔒 Admin Panel
              </button>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
