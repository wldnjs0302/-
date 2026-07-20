import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserData, Gender, AgeGroup } from "../types";
import { cn } from "../lib/utils";
import HandwritingInput, { HandwritingInputRef } from "./HandwritingInput";
import { Loader2, RotateCcw } from "lucide-react";
import { CustomButton } from "./CustomButton";

interface P2IdentityProps {
  onComplete: (data: UserData) => void;
}

const AGE_OPTIONS = [
  { id: 'infant' as AgeGroup, label: 'INFANT', image: "/age-infant.png" },
  { id: 'child' as AgeGroup, label: 'CHILD', image: "/age-child.png" },
  { id: 'adult' as AgeGroup, label: 'ADULT', image: "/age-adult.png" },
  { id: 'middle' as AgeGroup, label: 'MIDDLE', image: "/age-middle.png" },
  { id: 'senior' as AgeGroup, label: 'SENIOR', image: "/age-senior.png" },
];

const FEMALE_IMAGE_URL = "/female.png";
const MALE_IMAGE_URL = "/male.png";

export default function P2Identity({ onComplete }: P2IdentityProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>(null);
  const [age, setAge] = useState<AgeGroup>(null);
  const [location, setLocation] = useState("");
  const [signature, setSignature] = useState("");
  const [locationSignature, setLocationSignature] = useState("");
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isManualInput, setIsManualInput] = useState(false);
  const [isLocationManualInput, setIsLocationManualInput] = useState(false);

  const genderOptions = [
    { id: 'female' as Gender, label: 'FEMALE(여성)', imageUrl: FEMALE_IMAGE_URL },
    { id: 'male' as Gender, label: 'MALE(남성)', imageUrl: MALE_IMAGE_URL },
  ];

  const nameInputRef = useRef<HandwritingInputRef>(null);
  const locationInputRef = useRef<HandwritingInputRef>(null);
  const recognitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetInput = (target: 'name' | 'location') => {
    if (recognitionTimeoutRef.current) clearTimeout(recognitionTimeoutRef.current);
    if (target === 'name') {
      setName("");
      setSignature("");
      nameInputRef.current?.clear();
    } else {
      setLocation("");
      setLocationSignature("");
      locationInputRef.current?.clear();
    }
  };

  const recognizeText = async (target: 'name' | 'location') => {
    const imageData = target === 'name' 
      ? nameInputRef.current?.getImageData() 
      : locationInputRef.current?.getImageData();
      
    if (!imageData) return;

    setIsRecognizing(true);
    setErrorStatus(null);
    try {
      const response = await fetch("/api/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData, target: target }),
      });
      
      let text = "";
      let data: any = null;
      try {
        text = await response.text();
        data = JSON.parse(text);
      } catch (e) {
        console.warn("Could not parse server response as JSON. Using fallback.", e);
        const fallbackNames = ["최지원", "하온", "지우", "서연", "도윤", "수안", "하임", "정인", "이선"];
        const fallbackLocations = ["서울", "부산", "제주", "경주", "인천", "양양", "속초", "수원"];
        data = {
          text: target === 'name' 
            ? "최지원"
            : fallbackLocations[Math.floor(Math.random() * fallbackLocations.length)],
          isFallback: true
        };
      }
      
      if (!response.ok || !data || data.error) {
        if (!data || !data.text) {
          throw new Error(data?.error || "Recognition failed");
        }
      }

      if (data.text) {
        // Filter for Korean characters only
        const koreanOnly = data.text.replace(/[^ㄱ-ㅎㅏ-ㅣ가-힣]/g, "");
        if (target === 'name') setName(koreanOnly || "하온");
        if (target === 'location') setLocation(koreanOnly || "서울");
      } else {
        setErrorStatus("글자를 인식하지 못했습니다. 자동 분석(더미 데이터)으로 진행합니다.");
        const fallbackNames = ["최지원", "하온", "지우", "서연", "도윤", "수안", "하임", "정인", "이선"];
        const fallbackLocations = ["서울", "부산", "제주", "경주", "인천", "양양", "속초", "수원"];
        if (target === 'name') setName("최지원");
        if (target === 'location') setLocation(fallbackLocations[Math.floor(Math.random() * fallbackLocations.length)]);
      }
    } catch (error: any) {
      console.error("Failed to recognize text", error);
      const errStr = error?.toString() || "";
      const isQuotaError = errStr.includes("limit") || errStr.includes("한도") || errStr.includes("429") || errStr.includes("Quota") || errStr.includes("quota") || errStr.includes("RESOURCE_EXHAUSTED");
      
      const friendlyMsg = isQuotaError 
        ? "AI 인식 한도를 초과하여 자동 분석(더미 데이터)으로 진행합니다."
        : "인식 도중 오류가 발생하여 자동 분석으로 진행합니다.";
        
      setErrorStatus(friendlyMsg);
      const fallbackNames = ["최지원", "하온", "지우", "서연", "도윤", "수안", "하임", "정인", "이선"];
      const fallbackLocations = ["서울", "부산", "제주", "경주", "인천", "양양", "속초", "수원"];
      if (target === 'name') setName("최지원");
      if (target === 'location') setLocation(fallbackLocations[Math.floor(Math.random() * fallbackLocations.length)]);
    } finally {
      setIsRecognizing(false);
    }
  };

  const handleNext = async () => {
    if (step === 1 && signature && !name && !isManualInput) {
      await recognizeText('name');
      return; 
    }
    if (step === 4 && locationSignature && !location && !isLocationManualInput) {
      await recognizeText('location');
      return; 
    }

    if (step < 4) setStep(step + 1);
    else {
      // Default signature SVG base64 if empty
      const finalSignature = signature || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='30'><text x='10' y='20' font-family='sans-serif' font-size='12' fill='black'>Keyboard</text></svg>";
      onComplete({ 
        name: name || "익명", 
        signature: finalSignature, 
        gender: gender || 'male', 
        age: age || 'adult'
      });
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center pt-20 pb-40 px-6">
      <div className="max-w-2xl w-full space-y-24">
        
        {/* Step 1: Name */}
        {step === 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="flex flex-col h-[600px] text-center mx-auto max-w-2xl w-full"
          >
            <div className="space-y-2 h-[120px] flex flex-col justify-end pb-6">
              <p className="text-xl md:text-2xl font-dandan font-normal tracking-wide text-gray-400">안녕하세요, 사용자님의 이름은 무엇인가요?</p>
              <div className="h-14 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {isRecognizing ? (
                    <motion.div 
                      key="recognizing"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center justify-center gap-2 text-black bg-black/5 px-6 py-2 rounded-full border border-black/10"
                    >
                      <Loader2 className="animate-spin" size={20} />
                      <span className="text-sm font-bold">이름을 인식하고 있어요...</span>
                    </motion.div>
                  ) : errorStatus ? (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <p className="text-red-500 text-xs font-bold bg-red-50 px-4 py-2 rounded-full border border-red-100 italic">
                        {errorStatus}
                      </p>
                      <button 
                        onClick={() => recognizeText('name')}
                        className="text-[10px] font-black text-black hover:underline uppercase tracking-widest"
                      >
                         재시도
                      </button>
                    </motion.div>
                  ) : (name || isManualInput) ? (
                    <motion.div 
                      key="name-ready"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center flex flex-col items-center gap-1"
                    >
                      <div className="relative">
                        <input 
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="text-4xl font-black text-black text-center bg-transparent border-b-2 border-black/20 focus:border-black outline-none w-full min-w-[150px] px-4 pb-1 transition-all"
                          placeholder="이름 입력"
                          autoFocus
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">이름을 직접 수정하거나 입력해주세요</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center relative">
              {!isManualInput ? (
                <div className="h-64 relative group w-full">
                  <HandwritingInput 
                    ref={nameInputRef}
                    placeholder="홍길동" 
                    onComplete={(s) => {
                      setSignature(s);
                    }}
                    className="h-full"
                  />
                  {signature && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        resetInput('name');
                      }}
                      className="absolute top-4 right-4 z-30 p-3 bg-white/95 backdrop-blur rounded-full shadow-2xl text-gray-400 hover:text-black transition-all hover:scale-110 active:scale-95 flex items-center gap-2 text-xs font-black border border-gray-100"
                    >
                      <RotateCcw size={14} strokeWidth={3} /> 다시쓰기
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsManualInput(true);
                      setName("");
                    }}
                    className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-400 hover:text-black transition-all underline decoration-dashed"
                  >
                    키보드로 직접 타이핑하여 입력하기
                  </button>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 p-6 space-y-4">
                  <p className="text-gray-400 text-sm font-medium">키보드를 사용하여 이름을 입력하고 계십니다.</p>
                  <button
                    onClick={() => {
                      setIsManualInput(false);
                      setName("");
                      setSignature("");
                    }}
                    className="text-xs font-bold text-black border border-black/10 px-4 py-2 rounded-full hover:bg-black hover:text-white transition-all shadow-sm"
                  >
                    손글씨 서명 캔버스로 돌아가기
                  </button>
                </div>
              )}
            </div>
            <div className="h-[120px] flex items-center justify-center">
              <CustomButton 
                onClick={handleNext}
                disabled={isManualInput ? (!name.trim()) : (!signature || isRecognizing)}
                variant="secondary"
                className="px-12 h-[54px] text-sm font-bold tracking-widest uppercase disabled:opacity-30"
              >
                {isRecognizing ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>인식 중...</span>
                  </>
                ) : (signature && !name && !isManualInput) ? (
                  <span>이름 인식하기</span>
                ) : (
                  <span>이름 확인</span>
                )}
              </CustomButton>
            </div>
          </motion.div>
        )}

        {/* Step 2: Gender */}
        {step === 2 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="flex flex-col h-[600px] text-center mx-auto max-w-2xl w-full"
          >
            <div className="space-y-2 h-[120px] flex flex-col justify-end pb-6">
              <p className="text-xl md:text-2xl font-dandan font-normal tracking-wide text-gray-400">
                <span className="text-black">{name}</span>님의 성별은 무엇인가요?
              </p>
            </div>
            <div className="flex-1 flex flex-col justify-center relative">
              <div className="grid grid-cols-2 gap-8 max-w-lg mx-auto w-full">
                {genderOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setGender(opt.id)}
                    className={cn(
                      "flex flex-col items-center group transition-all duration-300",
                      gender === opt.id ? "scale-125 -translate-y-4" : "opacity-40 hover:opacity-80 hover:scale-110"
                    )}
                  >
                    <img 
                      src={opt.imageUrl} 
                      className="h-32 md:h-48 object-contain select-none pointer-events-none drop-shadow-md" 
                      alt={opt.label} 
                    />
                    <span className={cn(
                      "mt-3 text-[11px] font-medium tracking-[0.15em] transition-colors duration-300",
                      gender === opt.id ? "text-gray-800" : "text-gray-300 group-hover:text-gray-400"
                    )}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[120px] flex items-center justify-center">
              <CustomButton 
                onClick={handleNext}
                disabled={!gender}
                variant="secondary"
                className="px-12 h-[54px] text-sm font-bold tracking-widest uppercase disabled:opacity-30"
              >
                성별 확인
              </CustomButton>
            </div>
          </motion.div>
        )}

        {/* Step 3: Age */}
        {step === 3 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="flex flex-col h-[600px] text-center mx-auto max-w-2xl w-full"
          >
            <div className="space-y-2 h-[120px] flex flex-col justify-end pb-6">
              <p className="text-xl md:text-2xl font-dandan font-normal tracking-wide text-gray-400">
                <span className="text-black">{name}</span>님의 연령대는 무엇인가요?
              </p>
            </div>
            <div className="flex-1 flex flex-col justify-center relative">
              <div className="flex justify-center items-end gap-2 md:gap-8 min-h-[200px]">
                {AGE_OPTIONS.map((opt, idx) => (
                  <button
                    key={opt.id}
                    onClick={() => setAge(opt.id)}
                    className={cn(
                      "flex flex-col items-center group transition-all duration-300",
                      age === opt.id ? "scale-125 -translate-y-4" : "opacity-40 hover:opacity-80 scale-110"
                    )}
                  >
                    <img 
                      src={opt.image} 
                      alt={opt.label} 
                      className="h-32 md:h-48 object-contain mb-4 select-none pointer-events-none drop-shadow-md" 
                    />
                    <span className={cn(
                      "text-[10px] font-bold tracking-widest transition-colors",
                      age === opt.id ? "text-black" : "text-gray-300"
                    )}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[120px] flex items-center justify-center">
              <CustomButton 
                onClick={handleNext}
                disabled={!age}
                variant="secondary"
                className="px-12 h-[54px] text-sm font-bold tracking-widest uppercase disabled:opacity-30"
              >
                연령 확인
              </CustomButton>
            </div>
          </motion.div>
        )}

        {/* Step 4: Location */}
        {step === 4 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="flex flex-col h-[600px] text-center mx-auto max-w-2xl w-full"
          >
            <div className="space-y-2 h-[120px] flex flex-col justify-end pb-6 text-center">
              <p className="text-xl md:text-2xl font-dandan font-normal tracking-wide text-gray-400">
                <span className="text-black">{name}</span>님의 거주 지역을 입력해주세요!
              </p>
              <div className="h-14 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {isRecognizing ? (
                    <motion.div 
                      key="loc-recognizing"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center justify-center gap-2 text-black bg-black/5 px-6 py-2 rounded-full border border-black/10"
                    >
                      <Loader2 className="animate-spin" size={20} />
                      <span className="text-sm font-bold">지역을 인식하고 있어요...</span>
                    </motion.div>
                  ) : errorStatus ? (
                    <motion.div
                      key="loc-error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <p className="text-red-500 text-xs font-bold bg-red-50 px-4 py-2 rounded-full border border-red-100 italic">
                        {errorStatus}
                      </p>
                      <button 
                        onClick={() => recognizeText('location')}
                        className="text-[10px] font-black text-black hover:underline uppercase tracking-widest"
                      >
                         재시도
                      </button>
                    </motion.div>
                  ) : (location || isLocationManualInput) ? (
                    <motion.div 
                      key="loc-ready"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center flex flex-col items-center gap-1"
                    >
                      <div className="relative">
                        <input 
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="text-4xl font-black text-black text-center bg-transparent border-b-2 border-black/20 focus:border-black outline-none w-full min-w-[150px] px-4 pb-1 transition-all"
                          placeholder="지역 입력"
                          autoFocus
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">지역을 직접 수정하거나 입력해주세요</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center relative">
              {!isLocationManualInput ? (
                <div className="h-64 relative group w-full">
                  <HandwritingInput 
                    ref={locationInputRef}
                    placeholder="서울" 
                    onComplete={(s) => {
                      setLocationSignature(s);
                    }}
                    className="h-full"
                  />
                  {locationSignature && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        resetInput('location');
                      }}
                      className="absolute top-4 right-4 z-30 p-3 bg-white/95 backdrop-blur rounded-full shadow-2xl text-gray-400 hover:text-black transition-all hover:scale-110 active:scale-95 flex items-center gap-2 text-xs font-black border border-gray-100"
                    >
                      <RotateCcw size={14} strokeWidth={3} /> 다시쓰기
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsLocationManualInput(true);
                      setLocation("");
                    }}
                    className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-400 hover:text-black transition-all underline decoration-dashed"
                  >
                    키보드로 직접 타이핑하여 입력하기
                  </button>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 p-6 space-y-4">
                  <p className="text-gray-400 text-sm font-medium">키보드를 사용하여 거주 지역을 입력하고 계십니다.</p>
                  <button
                    onClick={() => {
                      setIsLocationManualInput(false);
                      setLocation("");
                      setLocationSignature("");
                    }}
                    className="text-xs font-bold text-black border border-black/10 px-4 py-2 rounded-full hover:bg-black hover:text-white transition-all shadow-sm"
                  >
                    손글씨 서명 캔버스로 돌아가기
                  </button>
                </div>
              )}
            </div>
            <div className="h-[120px] flex items-center justify-center">
              <CustomButton 
                onClick={handleNext}
                disabled={isLocationManualInput ? (!location.trim()) : (!locationSignature || isRecognizing)}
                variant="secondary"
                className="px-12 h-[54px] text-sm font-bold tracking-widest uppercase disabled:opacity-30"
              >
                {isRecognizing ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>인식 중...</span>
                  </>
                ) : (locationSignature && !location && !isLocationManualInput) ? (
                  <span>지역 인식하기</span>
                ) : (
                  <span>시작하기</span>
                )}
              </CustomButton>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
