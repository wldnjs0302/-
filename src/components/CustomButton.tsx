import React, { useState } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../lib/utils';

interface CustomButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
}

export const CustomButton: React.FC<CustomButtonProps> = ({ 
  children, 
  className = "", 
  variant = 'primary',
  ...props 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // 사용자가 직접 디자인한 버튼의 기본값 (기존보다 더 적정하게 축소된 기본값 설정, 테두리 제거 투명 세팅)
  const baseStyle = "relative overflow-visible px-6 py-3 text-lg font-dandan font-normal tracking-wider flex items-center justify-center transition-all duration-300 bg-transparent border-none select-none";
  
  return (
    <motion.button
      onHoverStart={() => !props.disabled && setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={props.disabled ? {} : { scale: 1.05 }}
      whileTap={props.disabled ? {} : { scale: 0.95 }}
      style={{ backgroundColor: 'transparent' }}
      className={cn(baseStyle, props.disabled && "opacity-50 cursor-not-allowed", className)}
      {...props}
    >
      {/* 
        직접 디자인한 이미지 경로를 넣어주세요.
      */}
      <img 
        src="/custom_butten.png" 
        alt="custom button background" 
        style={{
          filter: "drop-shadow(0 2px 0 black) drop-shadow(2px 0 0 black) drop-shadow(0 -2px 0 black) drop-shadow(-2px 0 0 black)"
        }}
        className="absolute inset-0 w-full h-full object-[100%_100%] -z-10 pointer-events-none transition-all duration-300"
        onError={(e) => {
          // 사진이 없을 경우 임시로 CSS 울퉁불퉁 버튼 모양을 띄웁니다.
          e.currentTarget.style.display = 'none';
          const parent = e.currentTarget.parentElement;
          if (parent) {
            parent.style.backgroundColor = 'transparent';
            parent.style.color = 'black';
            parent.style.border = '2px solid black';
            parent.style.borderRadius = "60% 40% 30% 70% / 60% 30% 70% 40%";
          }
        }}
      />
      
      {/* 마우스 호버 시 사진의 형태로 나타나는 민트색 컬러 오버레이 */}
      <div 
        className={`absolute inset-0 w-full h-full -z-10 pointer-events-none transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        style={{
          backgroundColor: "#5DF1C8", // 업로드하신 이미지의 민트색상 (#5DF1C8)
          WebkitMaskImage: `url('/custom_butten.png')`,
          WebkitMaskSize: "100% 100%",
          WebkitMaskPosition: "center",
          WebkitMaskRepeat: "no-repeat",
          maskImage: `url('/custom_butten.png')`,
          maskSize: "100% 100%",
          maskPosition: "center",
          maskRepeat: "no-repeat",
        }}
      />

      <span className="relative z-10 transition-colors duration-300 font-dandan font-normal whitespace-nowrap flex items-center justify-center gap-2 text-black">
        {children}
      </span>
    </motion.button>
  );
};

