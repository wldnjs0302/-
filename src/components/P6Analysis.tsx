import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ImageItem } from "../types";
import { CustomButton } from "./CustomButton";
import { cn } from "../lib/utils";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from "recharts";
import { handleImageError } from "../utils/imageRetry";
import { findPredefinedUser, rawChoiJiwonSheet, rawLeeYoonSeopSheet } from "../data/userMapping";
import rawGwangeoSheet from "../data/rawGwangeo.json";
import { getImageSpecificExplanation, normalizeTrait, getPredefinedImageInfo } from "../data/fallbackAnalysis";
import { sanitizeText } from "../utils/textSanitizer";
import { AESTHETIC_DICTIONARY } from "../utils/aestheticDictionary";
import choiJiwonAnalyzed from "../data/choijiwon_analyzed.json";
import { Palette, Film, Sparkles } from "lucide-react";

export const CATEGORIES = ["대상", "의미", "감각", "직관", "질감", "선명", "색감", "방법론", "취향", "형태"];

export const CATEGORY_COLORS: Record<string, string> = {
  "대상": "#f97316", // orange
  "의미": "#3b82f6", // blue
  "감각": "#ec4899", // pink
  "직관": "#6366f1", // indigo
  "질감": "#10b981", // emerald
  "선명": "#06b6d4", // cyan
  "색감": "#f43f5e", // rose
  "방법론": "#a855f7", // purple
  "취향": "#eab308", // amber
  "형태": "#14b8a6" // teal
};

export const CATEGORY_TAGLINES: Record<string, string> = {
  "대상": "구체적인 형태와 사물의 본질 직시",
  "의미": "보여지는 것 너머의 상징과 서사 분석",
  "감각": "시각적 자극에 대한 원초적 감성 공명",
  "직관": "찰나에 스미는 예감과 무의식적 끌림",
  "질감": "표면의 깊이와 사물 고유의 물질성 탐구",
  "선명": "질서정연한 정대칭과 완벽한 여백 설계",
  "색감": "색채의 지성적 조화와 아우라의 수렴",
  "방법론": "치밀한 앵글 분할과 조형의 메커니즘 고찰",
  "취향": "대중적 룰을 거부하는 독창적 지각 수호",
  "형태": "구조적 안정과 비례, 선의 조화 감각"
};

const AestheticWordTooltip = ({ word }: { word: string; key?: React.Key }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const info = AESTHETIC_DICTIONARY[word];
  if (!info) return <span>{word}</span>;

  return (
    <span 
      className="relative inline-block z-10 mx-0.5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span
        className="inline-block cursor-help font-extrabold text-amber-800 dark:text-amber-500 hover:text-amber-950 dark:hover:text-amber-300 border-b-2 border-dashed border-amber-500/40 hover:border-amber-600 bg-amber-500/[0.04] hover:bg-amber-500/[0.09] px-1 py-0.2 rounded-md transition-all select-none align-baseline"
      >
        {word}
      </span>
      <AnimatePresence>
        {isHovered && (
          <motion.span
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3.5 bg-neutral-950/95 border border-amber-500/30 rounded-2xl shadow-xl z-50 text-left block pointer-events-none select-none text-xs"
          >
            {/* Tooltip Content */}
            <span className="flex items-center gap-1.5 font-bold text-amber-400 mb-1 text-[12px] tracking-tight">
              <span>{info.emoji}</span>
              <span>{info.term}</span>
            </span>
            <span className="text-neutral-200 text-[11px] leading-relaxed font-semibold block">
              {info.simpleDefinition}
            </span>
            {/* Arrow */}
            <span className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-neutral-950/95 block" />
            {/* Double border shadow arrow */}
            <span className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-amber-500/30 -z-10 translate-y-[1px] block" />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
};

export const getImageNumber = (img: ImageItem, fallbackIdx: number): number => {
  if (img.url) {
    const urlMatch = img.url.match(/(?:^|\/)(\d+)\.(?:png|jpg|jpeg|gif|webp)/i);
    if (urlMatch) {
      const parsed = parseInt(urlMatch[1], 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 50) {
        return parsed;
      }
    }
  }
  let num = fallbackIdx + 1;
  if (img.id !== undefined && img.id !== null) {
    const idStr = String(img.id);
    const matches = idStr.match(/\d+/g);
    if (matches && matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      const parsed = parseInt(lastMatch, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 50) {
        num = parsed;
      }
    }
  }
  return num;
};

export const TRAIT_DETAILS: Record<string, { title: string; colorClass: string; textColor: string; desc: string }> = {
  "대상": { title: "대상", colorClass: "text-orange-500", textColor: "text-orange-600", desc: "시각적 요소에서 인물의 표정이나 사물의 본질 등 구체적인 형태를 주로 파악하는 성향" },
  "의미": { title: "의미", colorClass: "text-blue-500", textColor: "text-blue-600", desc: "보여지는 것 너머의 상징이나 인과관계, 숨겨진 서사를 탐구하고 부여하는 성향" },
  "감각": { title: "감각", colorClass: "text-pink-500", textColor: "text-pink-600", desc: "본능적인 이끌림이나 분위기 등 시각적 자극에 대한 감성적인 반응을 우선시하는 성향" },
  "직관": { title: "직관", colorClass: "text-indigo-500", textColor: "text-indigo-600", desc: "논리적 판단 이전에 찰나의 순간 느껴지는 예감이나 전체적인 느낌을 신뢰하는 성향" },
  "질감": { title: "질감", colorClass: "text-emerald-500", textColor: "text-emerald-600", desc: "표면의 촉각적 깊이나 마티에르, 세월의 흔적과 고유한 물질적 밀도를 탐구하는 성향" },
  "선명": { title: "선명", colorClass: "text-cyan-500", textColor: "text-cyan-600", desc: "산만한 노이즈를 걷어내고 명료한 윤곽과 질서정연한 정대칭, 여백을 추구하는 성향" },
  "색감": { title: "색감", colorClass: "text-rose-500", textColor: "text-rose-600", desc: "세련된 색채의 온도 조절과 극적인 채도 대비, 조명의 명암 밸런스로 분위기를 느끼는 성향" },
  "방법론": { title: "방법론", colorClass: "text-purple-500", textColor: "text-purple-600", desc: "빛의 굴절, 카메라의 심도와 구도의 메커니즘 등 조형의 역학을 이성적으로 분석하는 성향" },
  "취향": { title: "취향", colorClass: "text-amber-500", textColor: "text-amber-600", desc: "보편적인 미학 규칙을 위트 있게 배반하며 파격적이고 독창적인 배열을 선호하는 성향" },
  "형태": { title: "형태", colorClass: "text-teal-500", textColor: "text-teal-600", desc: "유기적인 곡선과 안정적인 기하학적 요소들이 이뤄내는 구조적 균형을 지향하는 성향" }
};

export interface DeepDetail {
  longDesc: string;
  keywords: string[];
  art: {
    title: string;
    desc: string;
    image: string;
    connection: string;
  };
  cinema: {
    title: string;
    desc: string;
    image: string;
    connection: string;
  };
}

export const TRAIT_DEEP_DETAILS: Record<string, DeepDetail> = {
  "대상": {
    longDesc: "귀하는 주변의 어지러운 시각적 노이즈나 부차적인 데코레이션을 과감하게 걷어내고, 오롯이 홀로 서 있는 단일 피사체의 본질적인 영혼을 묵시적으로 대면하는 '본질주의적 관조자'입니다. 붐비는 시각적 소음 속에서도 귀하의 시선은 언제나 프레임 한가운데 놓인 존재의 순수한 실존적 형태와 구조적 완전성을 향해 묵묵히 조준됩니다. 사물이나 대상을 그저 단순한 물리적 매개체로 보지 않고, 어떠한 과장이나 기교 없이도 그 자리를 묵직하게 지켜내는 개체 고유의 태생적인 내적 무게감에 감정적으로 공명합니다. 화려한 수식어보다는 날것 그대로의 형태를 묵묵히 응시할 때 가장 강력한 심미적 희열과 진정성을 체감하는 경향이 짙습니다. 고독마저 하나의 완벽한 자립적 구조로 전환해내는 귀하의 단단한 성찰과 고요한 통찰력은, 시각적 군더더기가 넘치는 세상에서 피사체의 가장 진실한 실존적 눈빛을 포착해내는 독보적인 시선이 됩니다.",
    keywords: ["#실존적_본질", "#단일_피사체", "#조형적_완전성", "#노이즈_제어", "#묵직한_존재감", "#내면의_진정성"],
    art: {
      title: "에드워드 호퍼의 《밤을 지새우는 사람들 (Nighthawks)》",
      desc: "화려한 장식 없이 도심의 밤 속에 홀로 빛나는 유리창과 인물들의 실존적 실루엣을 깊이 응시하는 이 작품은, 대상의 순수한 형상과 본질적 고독에 깊이 공명하는 당신의 본질주의적 안목에 묵직한 평온을 선물합니다.",
      image: "https://images.weserv.nl/?url=https://upload.wikimedia.org/wikipedia/commons/c/ca/Nighthawks_by_Edward_Hopper_1942.jpg",
      connection: "귀하가 복잡한 배경보다 하나의 본질적 피사체에 시선을 모았던 선택 행동은, 호퍼가 캔버스 한가운데에 고립된 인간의 실존을 묵묵히 세워둔 연출과 긴밀하게 연동됩니다. 화려한 외양에 가려진 '날것의 존재감'을 기민하게 포착하는 귀하의 안목이 이 작품을 가장 깊게 해독해 낼 것입니다."
    },
    cinema: {
      title: "구스 반 산트 감독의 《엘리펀트 (Elephant)》",
      desc: "장황한 해설이나 가공된 서사 대신, 인물들의 묵묵한 걸음걸이와 공기 같은 뒷모습을 아무런 노이즈 없이 롱테이크로 뒤따르는 영화의 고요한 관조적 카메라가, 불필요한 연출을 배제한 실재를 직시하는 당신의 영혼에 투명한 울림을 줍니다.",
      image: "https://images.weserv.nl/?url=https://upload.wikimedia.org/wikipedia/en/3/3c/Elephant_Gus_Van_Sant_poster.jpg",
      connection: "주변의 시각적 소음(Noise)을 제어하고 프레임 안의 실재를 투명하게 관조하려는 귀하의 지각 습관은, 구스 반 산트가 인위적인 음악이나 드라마틱한 편집을 걷어내고 피사체의 등 뒤를 묵묵히 응시하는 미니멀한 롱테이크 카메라와 미학적으로 호환됩니다."
    }
  },
  "의미": {
    longDesc: "귀하는 시각 정보가 주는 첫인상의 표상적 껍질을 부드럽게 벗겨내어, 그 너머에 숨겨진 서사적 맥락과 상징적인 은유의 지도를 조심스럽게 그려나가는 '보이지 않는 이야기의 기호학자'입니다. 하나의 이미지는 귀하에게 단순한 시각 풍경이 아니라, 누군가 치밀하게 매설해 둔 기억의 암호이자 삶의 깊은 지혜를 품고 있는 다층적인 메타포의 숲입니다. 일상의 평범한 풍경 속에서도 보이지 않는 연결고리를 파악하여 그것이 빚어내는 상징적 의미와 지적 정합성을 규명해 낼 때 가장 깊고 지성적인 전율을 체험합니다. 표면적인 화려함에 결코 매몰되지 않고 끊임없이 '왜 이러한 배치가 성립했는가'에 대한 사유를 멈추지 않는 탐구적 성향을 지니고 있습니다. 대상이 품고 있는 세월의 서사와 시적 은유를 주체적으로 발굴해내어, 평평한 이미지에 다차원적인 공감과 숨결을 불어넣는 따스하고 품격 있는 미학적 해석가입니다.",
    keywords: ["#상징적_은유", "#서사적_맥락", "#기호학적_해석", "#내러티브_추적", "#지적_정합성", "#다층적_메타포"],
    art: {
      title: "르네 마그리트의 《이미지의 배반 (The Treachery of Images)》",
      desc: "보이는 대상과 텍스트의 모순된 배치를 통해 세상의 관습적 고정관념을 전복시키는 마그리트의 유희는, 시각 정보 너머의 깊은 상징과 다층적 의미의 수수께끼를 해독하는 것에 큰 희열을 느끼는 당신의 지적 호기심과 영감의 지평을 완벽하게 충족시킵니다.",
      image: "https://images.weserv.nl/?url=https://upload.wikimedia.org/wikipedia/en/b/b9/The_Treachery_of_Images.jpg",
      connection: "시각 정보 너머에 정밀하게 배치된 상징적 지도를 사유하는 귀하의 기호학적 안목은, '이것은 파이프가 아니다'라는 텍스트와의 모순을 통해 이미지의 배반을 폭로한 마그리트의 위트 넘치는 캔버스와 강렬하게 공명할 것입니다."
    },
    cinema: {
      title: "봉준호 감독의 《기생충 (Parasite)》",
      desc: "상승과 하강의 정교한 계단 구도, 수석과 수성 등 영화 곳곳에 치밀하게 매설된 상징적 메타포를 통해 현대 사회의 계급적 구조를 날카롭게 해부합니다.",
      image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80",
      connection: "화면 속에 배치된 물리적인 물성과 구도 너머의 상징적 의미와 내러티브를 집요하게 사색하는 귀하의 기호학적 안목은, 상승과 하강의 수직적 대비와 미장센 하나하나에 치밀한 계급적 메타포를 조형적으로 박아둔 봉준호 감독의 천재적인 공간 설계와 깊숙이 호환됩니다."
    }
  },
  "감각": {
    longDesc: "귀하는 차갑고 인위적인 조형 규칙이나 날카로운 기하학적 대칭보다, 화면 전체를 부드럽게 감싸 안는 서정적인 무드와 공기 중에 미세하게 부유하는 아날로그적인 공기감에 온몸으로 공명하는 '감성적 탐미가'입니다. 찰나의 순간 스며드는 은은한 온기, 노을빛의 부드러운 스펙트럼, 아련한 노스탤지어를 부르는 빛망울의 흐름 속에서 세상의 가장 아름답고 깨지기 쉬운 감정들을 읽어냅니다. 일상의 숨 가쁜 계산을 멈추고 흘러가는 시간의 미세한 맥박 소리에 기꺼이 나를 맡길 때 진정한 시각적 정화와 깊은 평온을 누리십니다. 이성이나 언어로 결코 환원할 수 없는 찰나의 공기감과 정서적 정취를 섬세하게 어루만지는 귀하의 다정한 촉수는, 메마르고 가속화된 세상에서 낭만적인 삶의 온도를 복원하고 전파하는 소중한 미학적 수호자입니다.",
    keywords: ["#서정적_분위기", "#아날로그_정취", "#찰나의_공기감", "#빛망울의_온도", "#낭만적_감수성", "#감성적_주파수"],
    art: {
      title: "클로드 모네의 《일출 (Impression, Sunrise)》",
      desc: "물리적 사물의 고정된 형태를 무너뜨리고 찰나의 햇빛과 안개가 빚어내는 오묘한 색채의 진동과 서정적 분위기만을 캔버스 위에 고스란히 담아냈습니다.",
      image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&auto=format&fit=crop&q=80",
      connection: "명확한 형태적 경계선보다 빛과 공기의 미세한 일렁임이 자아내는 낭만적인 온도를 포착하려는 귀하의 촉각적 지각 성향은, 사물의 구체적 묘사를 과감히 지우고 안개 낀 항구 위에 스며든 서정적 기조를 온전히 구현해 낸 모네의 인상주의 세계 속에서 아련한 미학적 카타르시스를 마주할 것입니다."
    },
    cinema: {
      title: "왕가위 감독의 《화양연화 (In the Mood for Love)》",
      desc: "슬로 모션과 은은한 슬라이드 조명, 자욱한 연기와 슬픈 라틴 음악이 만드는 서정적 공기감과 찰나의 낭만적 분위기를 스크린 가득 조율해 냅니다.",
      image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80",
      connection: "날카로운 논리나 장황한 설명 대신 찰나에 흐르는 공기감과 빛의 온도로 마음을 채우는 귀하의 감성적 안목은, 슬로 모션과 멜랑콜리한 조명 변주를 통해 스크린 가득히 애틋하고 치명적인 공기를 자아내는 왕가위 미학의 낭만적 스펙트럼과 영혼의 맥박을 같이합니다."
    }
  },
  "직관": {
    longDesc: "귀하는 논리적인 비례 계산이나 이성적인 판단 과정을 가뿐하게 앞지르며, 찰나의 예감과 초현실적인 무의식의 이끌림에 자신을 온전히 던지는 '영적이고 신비로운 통찰가'입니다. 세상이 규정해 둔 기성 질서나 상식적 잣대를 지우고, 가슴 깊숙한 곳에서 즉각적으로 타오르는 충동과 원초적 영감의 주파수를 대담하게 수호하십니다. 어질러진 현실 너머 사물이 뿜어내는 본능적인 아우라를 보자마자 고속 판독해 내며, 그 속에서 말로 설명하기 힘든 경이로운 조화를 발견해 내십니다. 지각적 통념에 갇히지 않고 새로운 감각의 지평을 개척하는 대범한 지각을 지니고 계십니다.",
    keywords: ["#무의식적_이끌림", "#찰나의_영감", "#초현실적_예감", "#비선형적_통찰", "#아우라_감지", "#원초적_에너지"],
    art: {
      title: "잭슨 폴록의 《No. 5, 1948》",
      desc: "이성적인 계산이나 정교한 구도를 완전히 걷어내고, 캔버스 위를 자유롭게 누비며 물감을 떨어뜨려 무의식과 본능의 에너지 흐름을 완성했습니다.",
      image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&auto=format&fit=crop&q=80",
      connection: "조형적이고 기하학적인 비례 분석을 가뿐히 뛰어넘어 찰나의 순간 온몸을 휘감는 원초적 이끌림과 본능적 영감을 따르는 귀하의 무의식적 의사결정은, 이성이 개입하기 전 신체적 에너지를 캔버스에 대폭발시켜 무의식의 궤적을 완성한 폴록의 액션 페인팅 속 무한한 역동성과 강렬하게 연결됩니다."
    },
    cinema: {
      title: "아피찻퐁 위라세타쿤 감독의 《엉클 분미 (Uncle Boonmee)》",
      desc: "인과적인 서사를 유유히 초월해 태고의 자연과 영적인 환영을 안개처럼 시적인 리듬으로 녹여낸 이 영화는, 설명할 수 없는 삶의 신비와 무의식적 이끌림에 기민하게 반응하는 당신의 직관적 영혼에 아련하고도 신비로운 명상의 시간을 열어줍니다.",
      image: "https://images.weserv.nl/?url=https://upload.wikimedia.org/wikipedia/en/2/23/Uncle_Boonmee_Who_Can_Recall_His_Past_Lives_poster.png",
      connection: "말이나 상식으로 설명하기 힘든 초자연적이고 영적인 이끌림에 기민하게 반응하는 당신의 직관적 안목은, 기성 영화적 서사와 논리를 가뿐히 넘어 무의식적 환영의 세계를 시적인 리듬으로 스크린에 수놓은 아피찻퐁 감독의 신비롭고 아련한 영상 미학과 깊이 공명합니다."
    }
  },
  "질감": {
    longDesc: "귀하는 매끈하고 가공된 기성 물건보다 거칠고 깊이감 있는 입자감, 흘러간 시간의 흔적을 담은 표면 마티에르, 그리고 사물 고유의 유기적인 촉각성에 가슴 깊숙이 반응하는 '물질의 고고학자'이자 '촉각의 탐미가'입니다. 층층이 쌓인 더께와 빈티지한 결, 입자가 부유하는 아날로그적인 표면 텍스처에서 세상의 고유한 밀도와 삶의 짙은 숨결을 만져내십니다. 기하학적인 평평한 외양보다 사물이 지닌 태생적인 물성과 유기적 깊이를 가만히 응시할 때 가장 장엄한 예술적 안도감과 정서적 충만감을 수확하십니다.",
    keywords: ["#마티에르_감지", "#세월의_더께", "#촉각적_깊이", "#표면_텍스처", "#아날로그_밀도", "#사물의_숨결"],
    art: {
      title: "빈센트 반 고흐의 《구두 한 켤레 (A Pair of Shoes)》",
      desc: "반 고흐는 캔버스 위에 물감을 겹겹이 두껍게 얹어 올려, 오랜 지침과 세월의 주름이 패인 가죽 구두 표면의 거칠고 숭고한 마티에르를 촉각적으로 증명해 냈습니다.",
      image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80",
      connection: "사물의 매끈한 표상 너머 겹겹이 쌓인 물성과 흔적에 깊숙이 공명하는 귀하의 촉각적 안목은, 고된 삶의 궤적이 묻어나는 가죽 구두의 거친 마티에르를 날것의 힘찬 붓터치로 영원히 고정시킨 고흐의 화폭에서 가슴 뭉클한 미학적 구원을 만날 것입니다."
    },
    cinema: {
      title: "안드레이 타르코프스키 감독의 《거울 (The Mirror)》",
      desc: "흘러가는 시간과 바람에 흔들리는 풀숲, 축축하게 젖은 나무 벽의 결 등 태고의 물성과 아날로그 필름 고유의 자욱한 입자감을 스크린 가득 조율해 냅니다.",
      image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80",
      connection: "시각 정보 너머 손끝에 닿을 듯 생생한 표면의 깊이와 사물 고유의 유기적인 촉각성을 사색하는 귀하의 다정한 촉수는, 인위적인 인과론을 걷어내고 바람의 결, 나무의 질감, 축축한 물빛 등 자연의 원초적 물질성을 서정적으로 영원화한 타르코프스키의 카메라 아이와 깊숙이 호환됩니다."
    }
  },
  "선명": {
    longDesc: "귀하는 혼란스럽고 산만한 시각적 노이즈나 애매한 경계선 속에서 우러나오는 불안감을 단호히 거부하고, 수치적으로 완벽하게 조율된 정대칭 비례와 티 없이 깨끗한 여백 설계 속에서 온전한 시각적 평온과 지적 질서를 향유하는 '선명한 질서의 수호자'입니다. 어질러진 일상을 칼끝처럼 곧고 정밀하게 통제하며, 선과 면의 수학적 비례를 정량적으로 즐기는 완벽주의적 성향입니다. 1픽셀의 오차조차 용납하지 않는 완벽하게 정제되고 세련된 공간 구성 안에서 극상의 안식과 안도감을 찾는 당신은, 흐려진 모호함에 나를 방치하기보다 선명하고 또렷하며 투명한 주관의 중심을 언제나 견고하게 지켜냅니다.",
    keywords: ["#미니멀리즘_에스테틱", "#수평수직의_질서", "#여백의_극대화", "#정밀한_대칭", "#칼날_경계선", "#투명한_질서"],
    art: {
      title: "마크 로스코의 《네이비와 블랙 위의 레드 (Red on Navy and Black)》",
      desc: "어떤 잔기술과 형태적 서술도 모두 배제하고 거대한 단색 면과 선명한 경계의 진동만을 남겨 영혼의 장엄한 깊이를 직시하게 만듭니다.",
      image: "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?w=600&auto=format&fit=crop&q=80",
      connection: "산만한 시각적 노이즈를 거부하고 절대적인 여백과 선명한 단색 경계를 조준하는 귀하의 미니멀한 성향은, 복잡한 형태나 재현적 기법을 완전히 지우고 오직 또렷한 면 분할과 순수한 색면의 진동만을 남겨 영혼의 장엄한 울림을 창조해 낸 로스코의 세계 속에서 완벽한 기하학적 평온을 만끽할 것입니다."
    },
    cinema: {
      title: "웨스 앤더슨 감독의 《그랜드 부다페스트 호텔 (The Grand Budapest Hotel)》",
      desc: "1픽셀의 오차조차 용납하지 않는 연출적 강박과 완벽하게 기하학적 분할 구도가 선사하는 선명한 미장센의 모범을 선보입니다.",
      image: "https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?w=600&auto=format&fit=crop&q=80",
      connection: "1픽셀의 흐트러짐조차 배격하며 또렷한 수평수직의 정렬과 여백을 확보하려는 귀하의 선명 지향적 안목은, 프레임 내 모든 소품과 인물의 배치를 0.1mm 정밀도로 직조하고 완벽한 3분할 및 정대칭 구도로 칼날 같은 미장센의 수렴을 유도한 웨스 앤더슨 미학의 선명한 경계선과 경이롭게 정합됩니다."
    }
  },
  "색감": {
    longDesc: "세련된 색채의 온도 조절과 극적인 채도 대비, 오묘하게 일렁이는 조명의 명암 밸런스만으로도 이미지 전체의 정서적 기조를 자유자재로 지휘하는 '색채 연금술사'입니다. 아무리 완벽한 형태를 갖춘 구도일지라도 그 위에 어떤 빛의 파장과 어떤 파스텔 색상의 결이 수놓아졌는가에 따라 당신의 지각적 감동은 천차만별로 확장됩니다. 다채롭고 풍요롭게 겹쳐진 색채 스펙트럼 속에서 숨은 감정의 주파수를 짚어내는 감도가 압도적으로 발달해 있습니다. 단조로운 무채색의 풍경 속에 나만의 풍부한 크로마틱 온기를 불어넣을 줄 아며, 흘러가는 일상조차 다채로운 감정의 그라데이션으로 화려하고 매끄럽게 승화시키는 탁월한 감성적 예술가의 심장을 지니고 있습니다.",
    keywords: ["#색채의_연금술", "#채도와_온도의_조화", "#그라데이션_무드", "#감정의_크로마틱", "#풍요로운_빛망울", "#예술적_색상비"],
    art: {
      title: "앙리 마티스의 《붉은 방 (The Red Room)》",
      desc: "정적인 공간의 경계선을 왜곡하면서 오롯이 붉은색과 문양의 화려한 변주만으로 실내 가득히 생명과 서정의 불꽃을 창조합니다.",
      image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&auto=format&fit=crop&q=80",
      connection: "구조적 구도 이전에 색채의 대비 및 파스텔톤 온도의 미세한 변주만으로 이미지 전체의 영혼을 읽어내는 귀하의 색채 지향성은, 실내의 물리적 투시 경계를 완전히 무너뜨린 채 압도적인 붉은색과 생동감 넘치는 보색의 배치만으로 공간에 생명을 불어넣은 마티스의 색채 연금술에 격하게 반응합니다."
    },
    cinema: {
      title: "데미안 셔젤 감독의 《라라랜드 (La La Land)》",
      desc: "몽환적인 보랏빛 노을빛, 강렬한 코발트 블루와 비비드한 원색의 네온 빛깔을 대담하게 변주하며 인물들의 꿈과 애틋함을 조율합니다.",
      image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
      connection: "무채색의 메마른 세상을 풍부한 감정의 그라데이션으로 화려하게 물들일 수 있는 귀하의 감수성은, 코발트 블루와 비비드한 네온, 몽환적인 노을빛을 교차하며 인물의 꿈과 낭만적 애틋함을 오선지처럼 연주해 나가는 라라랜드의 화려한 색채 지휘와 영혼의 파장을 같이합니다."
    }
  },
  "방법론": {
    longDesc: "귀하는 단순하고 수동적인 이미지 감상을 가볍게 뛰어넘어, 이 시각 결과물이 화면에 구현되기까지 설계된 구도적 메커니즘, 조명의 입사 앵글, 그리고 카메라 렌즈의 프레이밍 법칙을 이성적으로 분석하는 '조형의 시각 엔지니어'입니다. 빛이 어떤 입사각으로 굴절되어 피사체의 윤곽을 해부하는지, 초점 심도가 인물들의 정서적 거리감을 어떻게 조율해 내는지를 볼 때 깊은 이성적 쾌감과 예술적 희열을 만끽합니다. 표면에 장식된 화려한 장식이나 예쁜 색채보다는 그 밑바탕을 지배하는 연출가의 치밀한 계산과 구조적 완성도에 지적으로 사로잡히는 테크니컬한 지각자입니다. 세상을 바라볼 때도 외양의 단순한 자극을 넘어 이면의 조형 공식과 물리적 구조를 직시하려는 탐구적인 안목을 지니고 있습니다.",
    keywords: ["#연출적_엔지니어링", "#구조적_프레이밍", "#카메라_아이", "#빛과_심도의_역학", "#기법의_사색", "#논리적_미장센"],
    art: {
      title: "에드가 드가의 《카페 콘서트 (Café-Concert)》",
      desc: "전통적 시각에서 벗어나 무대 아래의 독특한 오버헤드 앵글과 기둥 뒤의 가려진 프레임을 통해 현실의 순간을 고도로 기획된 앵글로 구성합니다.",
      image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80",
      connection: "사물의 겉모습 너머의 설계 역학, 프레임이 구성되기까지의 치밀한 카메라 앵글과 제작 메커니즘을 간파하는 귀하의 명석한 관조 습관은, 화실 안의 전형적인 시선에서 과감히 탈피하여 무대 밑의 극단적 앵글과 인위적 차단 프레임으로 찰나를 설계한 드가의 공학적 조형 방식에 지적 찬사를 보낼 것입니다."
    },
    cinema: {
      title: "오손 웰즈 감독의 《시민 케인 (Citizen Kane)》",
      desc: "화면의 전경과 후경을 칼같이 잡아내는 딥 포커스, 중력을 초월하듯 바닥을 파고든 로우 앵글 등으로 영상 기술학적 완성도의 역사를 바꾼 작품입니다.",
      image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&auto=format&fit=crop&q=80",
      connection: "화면 전경과 후경을 칼같이 조율하는 딥 포커스 기법이나 바닥을 뚫고 지나가는 듯한 로우 앵글의 역학적 구도를 해독하며 희열을 느끼는 귀하의 테크니컬한 감상 성향은, 영상 기하학의 완성도와 카메라 공학의 한계를 밀어붙인 오손 웰즈의 혁신적 미장센과 궁극의 지적 일치를 이룹니다."
    }
  },
  "취향": {
    longDesc: "귀하가 대중이 선호하는 안전하고 보편적인 구도나 관습적인 미학 규칙을 위트 있게 배반하며, 다소 파격적이거나 비정형적인 배열 속에서 자신만의 꼿꼿한 오리지널리티를 증명하는 '전위적인 시각 주관가'입니다. 타인의 평가나 공인된 미학적 유행을 답습하는 나른한 규칙을 지극히 경계하며, 시각적 일탈과 과감한 비대칭성 속에서 가슴 뛰는 미학적 해방감을 수확해 냅니다. 다소 이질적이거나 익숙지 않은 삐딱한 앵글의 조합조차 귀하만의 대범한 감각 필터를 통과하면 독보적으로 우아하고 강렬한 파격적 예술로 환골탈태합니다. 남들이 보지 못하고 쉽게 지나쳐버리는 감각의 전위적 영역을 나만의 특별한 전유물로 승화시키는 독자적인 감각 제국을 자유로이 다스리는 매혹적인 탐험가입니다.",
    keywords: ["#오리지널리티_수호", "#전위적_비정형", "#주체적_안목", "#파격적_컴포지션", "#안티_포멀리즘", "#감각의_독립성"],
    art: {
      title: "살바도르 달리의 《기억의 지속 (The Persistence of Memory)》",
      desc: "전형적인 형태를 흐늘흐늘한 시계 형상으로 붕괴시키며, 세상에 단 하나뿐인 자신만의 전위적 무의식을 단단하게 조형화합니다.",
      image: "https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?w=600&auto=format&fit=crop&q=80",
      connection: "타인의 정형화된 정답이나 안전한 구도에 안주하기를 거부하고, 개성적인 비정형의 배열에서 아방가르드한 카타르시스를 느끼는 귀하의 독창적 주관은, 흘러내리는 시계처럼 현실의 고정관념을 파괴하여 무의식적 형상을 창조한 달리의 전위적 캔버스에서 무한한 자유와 공명을 얻습니다."
    },
    cinema: {
      title: "데이빗 린치 감독의 《멀홀랜드 드라이브 (Mulholland Drive)》",
      desc: "전통적 스릴러 문법과 대중적 서사를 완전히 분쇄하고 극도로 매혹적이면서 기괴한 그만의 고유 지각 지평을 완벽하게 밀어 올립니다.",
      image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80",
      connection: "익숙한 내러티브나 무난한 클리셰가 선사하는 나른함을 거부하는 귀하의 대범한 감수성은, 전통적 미스터리 스릴러 문법을 완전히 파쇄하고 기괴하면서도 매혹적인 이미지들의 충돌로 독보적인 주각 제국을 밀어 올린 데이빗 린치 감독의 난해하고 치명적인 불협화음 속에서 진정한 미학적 해방감을 느낍니다."
    }
  },
  "형태": {
    longDesc: "귀하가 유기적인 부드러운 곡선과 안정감 있는 기하학적 요소들이 매끄럽고 완벽하게 기어처럼 맞물려 완벽한 '구조적 균형'을 달성할 때 영혼의 충만한 지지와 깊은 심미적 정화를 경험하는 '조화의 조각가'입니다. 각 요소가 빚어내는 황금 비율의 수학적 우아함과 구조적 완결성을 지극히 찬양하며, 어떤 부분도 소란스럽게 이탈하지 않고 정대칭 중심축을 향해 평화롭게 안착할 때 최고의 시각적 편안함을 만끽합니다.",
    keywords: ["#구조적_균형", "#기하학적_조화", "#황금비율", "#정대칭_정렬", "#선의_조화", "#평온한_안착"],
    art: {
      title: "바실리 칸딘스키의 《구성 VIII (Composition VIII)》",
      desc: "원, 선, 반원 등 추상적 기하학 형태들이 화면 내부에서 매끄럽고 완벽하게 비례를 그리며 극상의 미적 정밀성을 조각해 냅니다.",
      image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&auto=format&fit=crop&q=80",
      connection: "유기적인 부드러운 곡선과 완벽한 기하학적 비례가 맞물릴 때 최고의 심미적 희열을 만끽하는 귀하의 형태 지향적 안목은, 수학적인 비례 공식과 역학적인 기하 도형들의 군더더기 없는 균형 배치를 통해 고도의 음악적 화음을 성취해 낸 칸딘스키의 구성주의 화폭에서 평온한 안식을 만날 것입니다."
    },
    cinema: {
      title: "야스지로 오즈 감독의 《동경이야기 (Tokyo Story)》",
      desc: "언제나 다다미 높이의 고정된 카메라 앵글과 흠잡을 곳 없는 수평적 앙상블 구도로, 삶의 희비극을 극도로 평온하고 안정감 있게 조율해 냅니다.",
      image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&auto=format&fit=crop&q=80",
      connection: "사물의 유기적인 배열과 수학적 비례, 수평선 위의 안도감을 갈구하는 귀하의 온화한 안목은, 기하학적 완결성에 부합하는 다다미 로우 앵글과 엄격한 화면 3등분 법칙을 지켜내며 고요한 가족의 비극을 정갈하게 응시한 야스지로 오즈의 완벽주의적 비례 구도에 스며들 것입니다."
    }
  }
};

export const getImageResult = (img: ImageItem, idx: number) => {
  const num = getImageNumber(img, idx);
  
  const idStr = String(img.id || "");
  const isChoiJiwon = idStr.includes("최지원") || idStr.includes("choijiwon") || idStr.toLowerCase().includes("choi jiwon");
  const isLeeYoonSeop = idStr.includes("이윤섭") || idStr.includes("leeyoonseop") || idStr.toLowerCase().includes("lee yoonseop") || idStr.includes("이윤서") || idStr.includes("leeyoonseo") || idStr.toLowerCase().includes("lee yoonseo");
  const isGwangeo = idStr.includes("광어") || idStr.includes("gwangeo") || idStr.toLowerCase().includes("gwangeoreulchajaseo");

  // Use trait index
  const traitIdx = CATEGORIES.indexOf(normalizeTrait(img.trait || "형태"));
  const primaryIdx = traitIdx >= 0 ? traitIdx : 9; // 형태 is default
  const secondaryIdx = (primaryIdx + 3) % 10;
  const tertiaryIdx = (primaryIdx + 7) % 10;
  
  // Support image weights if they exist for this image, honor them precisely
  const rawWeights = CATEGORIES.map((cat, i) => {
    if (isChoiJiwon) {
      const sheetRow = rawChoiJiwonSheet.find((r: any) => r.num === num);
      if (sheetRow) {
        let w = 10 + (num * cat.charCodeAt(0)) % 16;
        if (cat === sheetRow.main) w = 95;
        else if (cat === sheetRow.sub1) w = 75;
        else if (cat === sheetRow.sub2) w = 55;
        return { category: cat, weight: w };
      }
    }
    if (isLeeYoonSeop) {
      const sheetRow = rawLeeYoonSeopSheet.find((r: any) => r.num === num);
      if (sheetRow) {
        let w = 10 + (num * cat.charCodeAt(0)) % 16;
        if (cat === sheetRow.main) w = 95;
        else if (cat === sheetRow.sub1) w = 75;
        else if (cat === sheetRow.sub2) w = 55;
        return { category: cat, weight: w };
      }
    }
    if (isGwangeo) {
      const sheetRow = rawGwangeoSheet.find((r: any) => r.num === num);
      if (sheetRow) {
        let w = 10 + (num * cat.charCodeAt(0)) % 16;
        if (cat === sheetRow.main) w = 95;
        else if (cat === sheetRow.sub1) w = 75;
        else if (cat === sheetRow.sub2) w = 55;
        return { category: cat, weight: w };
      }
    }

    if (img.categoryWeights !== undefined) {
      const w = img.categoryWeights[cat] !== undefined ? img.categoryWeights[cat] : 5;
      return { category: cat, weight: w };
    }
    
    let weight = 5 + (num * (i + 1)) % 10;
    if (i === primaryIdx) {
      weight = 80 + (num % 20);
    } else if (i === secondaryIdx) {
      weight = 50 + (num % 15);
    } else if (i === tertiaryIdx) {
      weight = 30 + (num % 10);
    }
    
    // Support image traits if set
    if (img.trait === cat) {
      weight += 100;
    }
    
    return { category: cat, weight };
  });

  // Identify actual top 3 categories by raw weight
  const sortedRaw = [...rawWeights].sort((a, b) => b.weight - a.weight);
  const primary = sortedRaw[0]?.category || CATEGORIES[primaryIdx];
  const secondary = sortedRaw[1]?.category || CATEGORIES[secondaryIdx];
  const tertiary = sortedRaw[2]?.category || CATEGORIES[tertiaryIdx];

  const w1 = sortedRaw[0]?.weight || 80;
  const w2 = sortedRaw[1]?.weight || 50;
  const w3 = sortedRaw[2]?.weight || 30;

  // Generate a stable pseudo-random seed using image properties and its index
  const seedStr = `${img.id || ''}-${idx}-
${img.trait || ''}-${img.url || ''}`;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const rand = (Math.abs(hash) % 1000) / 1000;       // 0.0 to 1.0
  const rand2 = (Math.abs(hash >> 3) % 1000) / 1000;  // 0.0 to 1.0

  // 1st rank (ip1) must be >= 50%. Let's let it vary between 50% and 68%.
  let ip1 = 50 + Math.floor(rand * 19); // 50 to 68 inclusive

  const rem = 100 - ip1;

  // 2nd rank (ip2) and 3rd rank (ip3) must sum to rem, with ip1 > ip2 > ip3.
  const minIp2 = Math.floor(rem / 2) + 1;
  const maxIp2 = Math.min(ip1 - 1, rem - 4);

  let ip2 = minIp2;
  if (maxIp2 >= minIp2) {
    ip2 = minIp2 + Math.floor(rand2 * (maxIp2 - minIp2 + 1));
  }
  let ip3 = rem - ip2;

  // Enforce all constraints strictly
  if (ip1 < 50) {
    ip1 = 50;
  }
  if (ip2 >= ip1) {
    ip2 = ip1 - 1;
  }
  if (ip3 >= ip2) {
    const shift = Math.floor((ip3 - ip2) / 2) + 1;
    ip2 += shift;
    ip3 -= shift;
  }
  if (ip3 < 2) {
    const adjust = 2 - ip3;
    ip3 = 2;
    ip2 -= adjust;
  }

  // Adjust to make sure the final sum is exactly 100%
  const currentSum = ip1 + ip2 + ip3;
  if (currentSum !== 100) {
    const diff = 100 - currentSum;
    ip1 += diff;
  }

  // Construct final 10 category weights where top 3 carry the normalized 100% and rest are 0
  const finalWeights = CATEGORIES.map(cat => {
    let finalW = 0;
    if (cat === primary) {
      finalW = ip1;
    } else if (cat === secondary) {
      finalW = ip2;
    } else if (cat === tertiary) {
      finalW = ip3;
    }
    return { category: cat, weight: finalW };
  });

  return {
    primary,
    secondary,
    tertiary,
    allWeights: finalWeights
  };
};

const IMAGE_SUBJECT_DESCRIPTIONS: Record<number, { title: string; desc: string; detail: string }> = {
  1: {
    title: "빛과 그림자의 춤",
    desc: "나른한 오후 햇볕이 문틈 사이로 들어와 드리워지는 빛의 명암을 보여주는 감성적인 풍경입니다.",
    detail: "빛과 어둠의 정교한 하모니, 고요하고 아늑한 분위기에 깊은 이끌림을 느낍니다."
  },
  2: {
    title: "새벽녘 가로등",
    desc: "짙푸른 새벽 골목길을 부드럽게 밝히는 은은하고 감스런 백열 가로등 빛입니다.",
    detail: "어두운 사면에 정온한 온기를 전하는 색상 구도와 따스한 서정미가 마음을 포근히 감쌉니다."
  },
  3: {
    title: "강철 기하학 구조",
    desc: "완벽한 구도적 대칭으로 치솟은 기하학적 철골 구조입니다.",
    detail: "흐트러짐 없이 딱 맞아떨어지는 사선과 안정적인 일치감에서 극치의 편안함을 만끽합니다."
  },
  4: {
    title: "고요한 눈빛",
    desc: "대상을 다정하고 깊숙하게 응시하는 깊고 아늑한 눈빛입니다.",
    detail: "인물 고유의 개성과 그 눈빛 속에 고인 따스한 배려심에 깊이 공명하고 이끌립니다."
  },
  5: {
    title: "바람과 커튼",
    desc: "부드러운 봄바람에 가볍게 흩날리는 반투명한 레이스 커튼입니다.",
    detail: "오래된 나무 창틀 사이를 아릿하게 가르는 서정적인 공기와 고즈넉한 여백의 정취를 즐기십니다."
  },
  6: {
    title: "해 질 무렵의 들녘",
    desc: "노을빛을 받아 주황색과 자줏빛으로 물들어가는 들판의 지평선입니다.",
    detail: "따스하게 내려앉는 대지 위의 서정적인 색조 그라데이션이 편안한 마음의 안식을 가져다줍니다."
  },
  7: {
    title: "거친 나무 기둥",
    desc: "수많은 기후와 긴 세월을 버텨낸 고목의 투박하고 갈라진 나뭇결 표면입니다.",
    detail: "세월의 깊이와 눈으로 전해지는 거칠고 묵직한 시각적 밀도에서 변치 않는 진정성 어린 온기를 찾으셨군요."
  },
  8: {
    title: "아날로그 타자기",
    desc: "골동품 나무 책상 위에 놓여 세월의 온기를 풍기는 기계식 타자기의 둥글고 정돈된 자판들의 모습입니다.",
    detail: "한 글자씩 정성스럽게 적어가며 마주하던 시각적 울림, 아련한 아날로그의 향수와 서사적인 분위기를 깊이 간직하십니다."
  },
  9: {
    title: "비 내리는 밤의 창문",
    desc: "유리창을 타고 흘러내리는 맑고 투명한 빗방울들과 그 너머로 어스름하게 번지는 가로등 불빛의 아련한 영상입니다.",
    detail: "세속의 번잡함을 씻어내는 차분한 분위기 속에 고요히 침잠하며 나의 내면을 되짚어보는 평온한 감수성의 순간입니다."
  },
  10: {
    title: "고서적과 빈티지 안경",
    desc: "누렇게 바랜 고서의 책장 위에 얹어둔 둥근 안경과 한 줄기 부드럽게 사선으로 깃드는 따스한 서재의 햇살입니다.",
    detail: "축적된 시간의 가치와 은은한 정서, 장식을 최소화한 구조적 본질에 사색적으로 교감하는 안목을 지니고 계십니다."
  },
  11: {
    title: "숲속의 오솔길",
    desc: "나뭇잎 사이로 부서져 내리는 눈부신 아침 햇살을 머금고 푸르게 뻗어나간 아늑하고 고요한 숲속 흙길 풍경입니다.",
    detail: "복잡한 기준과 생각을 내려놓고 대자연이 전하는 맑은 생명력에 편안하게 몸을 맡겨 안식을 찾고자 하십니다."
  },
  12: {
    title: "동그란 커피 잔의 무늬",
    desc: "짙은 브라운 색 에스프레소 위에 부드러운 우유 거품이 둥근 동심원을 그리며 완벽하게 어우러진 라떼 아트입니다.",
    detail: "좌우 대칭의 균형 잡힌 원형 구도와 부드러운 그러데이션에서 편안한 조형적 질서와 평온한 안정감을 만끽합니다."
  },
  13: {
    title: "해 질 무렵의 갈대밭",
    desc: "붉게 물든 노을빛에 반짝이며 바람을 따라 한 방향으로 부드럽게 눕는 가을날의 아스라한 갈대 무리입니다.",
    detail: "규정하기 힘든 오묘하고 몽환적인 자연의 분위기, 그 따스한 색조의 울림 속에서 평화로운 영감을 공유하십니다."
  },
  14: {
    title: "정갈한 파란색 문",
    desc: "하얗게 회칠한 담벼락 한가운데에 놓여 청량하고 선명한 직선 구도를 완성해내는 낡고 단정한 나무 문입니다.",
    detail: "시선을 어지럽히지 않는 완벽하고 깔끔한 형태감, 정돈된 구도 위에서 확실한 마음의 휴식을 얻는 성향입니다."
  },
  15: {
    title: "바닷가 조약돌",
    desc: "오래된 세월 파도에 씻겨 모난 모서리 하나 없이 완벽하게 둥글고 매끄럽게 다듬어진 파스텔 톤 조약돌 무리입니다.",
    detail: "인위적인 가공을 넘어선 자연 고유의 완벽한 밸런스와 비례, 동글동글하고 매끄러운 형태감에 무의식적인 흥미를 느끼셨습니다."
  },
  16: {
    title: "가을 길모퉁이",
    desc: "붉은 단풍잎 몇 장이 아스팔트 길 위에 떨어져 촉촉하게 젖어 있는 한적하고 아늑한 도심 속 가을의 단면입니다.",
    detail: "계절의 깊이를 담을 따스한 색채의 조화와 도심 속 여유, 사소한 찰나의 순간에도 따뜻한 사색을 빚어냅니다."
  },
  17: {
    title: "피어나는 흰 연꽃",
    desc: "맑고 깨끗한 진흙 연못 위로 우아하고 완벽하게 꽃잎을 펼쳐 정갈한 대칭 구도를 그리는 백련 한 송이입니다.",
    detail: "극도의 화려함보다 정적인 절제미, 선과 형태가 주는 동양적인 조화와 평화로움에 깊이 공명하셨습니다."
  },
  18: {
    title: "가문 가죽 소파",
    desc: "오랜 시간 동안 손때가 묻어 자연스러운 주름과 깊은 멋을 자랑하는 묵직한 가죽 소파의 팔걸이 가죽입니다.",
    detail: "클래식하고 신뢰성 있는 시각적 질감과 세월이 선사한 멋에 기대어 온전하고 든든한 정서적 안식을 향유하십니다."
  },
  19: {
    title: "모래 위의 물결 자국",
    desc: "바람과 파도가 지나가며 모래사장 위에 그려놓은 정교하게 평행을 이루는 물결무늬 패턴입니다.",
    detail: "등간격으로 일정하게 반복되는 기하학적 형태의 규칙성에서 한 치 어긋남 없는 편안함과 안정감을 향유하십니다."
  },
  20: {
    title: "새벽녘 산줄기의 음영",
    desc: "안개가 자욱한 새벽, 첩첩산중 겹쳐진 산등성이들의 푸르스름한 수묵화 같은 신비로운 겹침 구도입니다.",
    detail: "직선과 곡선의 우아한 조화 속에 숨은 장엄함, 자연이 전하는 깊은 고요에 매료되어 마음을 놓아 봅니다."
  },
  21: {
    title: "포근히 잠든 고양이",
    desc: "따스한 햇살이 드는 창가 언저리에서 몸을 동글게 웅크린 채 평온하게 낮잠을 자고 있는 고양이입니다.",
    detail: "조용하고 평온한 일상의 온기를 사랑하며, 나만의 편안한 공간에서 얻는 소중한 휴식을 간직하고자 하십니다."
  },
  22: {
    title: "포근한 모닥불의 온기",
    desc: "장작이 탁탁 타오르며 흩뿌려지는 붉은 불씨들과 온기가 주변을 감싸 안는 따뜻한 모닥불입니다.",
    detail: "시각적인 온화함과 포근한 분위기, 따뜻한 영감에서 은은한 휴식과 안정감을 선택하셨습니다."
  },
  23: {
    title: "노란 낙엽 더미",
    desc: "가을빛으로 물든 단풍과 노란 은행잎들이 정갈하게 길가에 쌓여 가을의 깊이를 알리는 정경입니다.",
    detail: "자연의 아늑한 색채 변화와 계절 고유의 따뜻한 감각에서 심리적 정화를 직관적으로 경험합니다."
  },
  24: {
    title: "찻잔에 떨어지는 레몬",
    desc: "맑은 홍차 속에 상큼한 레몬 한 조각이 떨어지며 물보라와 화사한 기운을 퍼뜨리는 순간입니다.",
    detail: "생동감 넘치는 시각적 디테일과 한순간의 화사함이 지닌 뚜렷한 취향의 감각을 알아채셨습니다."
  },
  25: {
    title: "바닷가의 조개껍데기",
    desc: "부드러운 모래사장 위에 파도에 씻겨 반짝이는 다채로운 색감의 조개껍데기들이 흩어져 있는 컷입니다.",
    detail: "작고 소박한 대상이 주는 유기적인 아름다움과 시선을 끄는 섬세한 형태감에 교감하셨군요."
  },
  26: {
    title: "새벽 안갯속 호수",
    desc: "잔잔한 수면 위로 옅은 안개가 내려앉아 하늘과 물의 경계가 하나로 흐려진 고요한 새벽 호수입니다.",
    detail: "숨 가쁜 일상을 벗어나 자아를 성찰하게 해주는 평온하고 아련한 서사적 분위기에 시선이 닿았습니다."
  },
  27: {
    title: "유리병의 초록 허브",
    desc: "빛을 받아 맑게 빛나는 유리병 속에 신선한 초록색 로즈마리 줄기가 담겨 있는 싱그러운 정물입니다.",
    detail: "군더더기 없는 미니멀하고 맑은 구도와 생명력이 전하는 시각적 청량감에서 깊은 평안을 얻으셨습니다."
  },
  28: {
    title: "어스름한 저녁 하늘",
    desc: "해가 저문 직후 붉은 오렌지빛과 짙은 청색이 부드럽게 섞여 나가는 마법 같은 개와 늑대의 시간입니다.",
    detail: "오묘한 색채의 그라데이션이 연출하는 감성 가득한 무드와 온화한 분위기에서 따스한 안식을 찾으셨네요."
  },
  29: {
    title: "책상 위 따뜻한 조명",
    desc: "은은한 주황빛 독서등이 펼쳐진 책장 위를 아늑하게 비추고 있는 정갈한 서재의 단면입니다.",
    detail: "정돈된 나만의 지적 공간과 차분하게 중심을 잡아주는 빛의 방향성에서 흔들리지 않는 질서를 만납니다."
  },
  30: {
    title: "빈티지 열쇠 뭉치",
    desc: "고풍스러운 청동 열쇠들이 오랜 세월의 흔적을 담은 채 녹슨 고리에 꿰여 있는 아날로그 정물입니다.",
    detail: "열쇠 고유의 섬세한 기하학적 형태와 세월이 빚어낸 거칠고 아늑한 질감에서 깊은 아날로그의 향수와 고즈넉한 사색에 잠겨봅니다."
  },
  31: {
    title: "구멍 뚫린 판화",
    desc: "화지 중앙에 기하학적으로 뚫린 동심원 구멍과 그 외곽으로 거친 묵빛의 붓 터치가 번진 실험적이고 아방가르드한 판화 디자인입니다.",
    detail: "자잘한 분석 이전에 찰나의 순간 이끌리는 과감한 직관적 아름다움과 대담한 흑백 조화가 주는 신선한 충격에 이끌리셨습니다."
  },
  32: {
    title: "플라스틱 체인",
    desc: "동글동글하고 매끄러운 고리들이 서로 대칭을 이루며 일치하고 등간격으로 차례로 맞물린 정갈한 플라스틱 사슬입니다.",
    detail: "등간격 사슬 구조가 자아내는 시각적 안정과 정돈된 형태미, 경계를 깔끔하게 조율하는 선명함이 기분 좋고 맑은 자극을 건넵니다."
  },
  33: {
    title: "테슬라 로고",
    desc: "검은색 또는 무광 회색 바탕 위에 날렵한 은빛 메탈릭 사선이 결합해 미래 테크 감성을 상징하는 멋스러운 T자 브랜드 엠블럼입니다.",
    detail: "대칭을 이루는 날렵하고 세련된 형태 비율과 크롬의 정교한 금속 표면 질감, 미래지향적 감성이 세련되게 다가옵니다."
  },
  34: {
    title: "색바랜 몬드리안 로고",
    desc: "빨강, 노랑, 파랑의 기하학적 삼원색 면과 검은 격자선이 세월을 담아 부드럽고 빈티지하게 색이 바랜 몬드리안 격자 예술 패턴입니다.",
    detail: "미술사의 상징이자 깊고 영감 어린 조형적 의미와 세월이 주어 온화해진 색채 조화에서 아련한 울림을 받으셨습니다."
  },
  35: {
    title: "산악 버클",
    desc: "튼튼하고 견고한 결합으로 가혹한 야외 환경에서도 소지품과 신체를 단단히 잡아주는 정교한 이음새의 검은 산악 버클입니다.",
    detail: "딱 맞아떨어지는 결합 형태의 기하학적 비례와 혹독함을 극복하려는 아웃도어의 목적성이 주는 든든함에 매력을 느낍니다."
  },
  36: {
    title: "초보용 스티커",
    desc: "귀여운 노란 사각형 안에 아기자기한 손글씨로 '초보운전'을 표시해 다른 운전자의 마음을 훈훈하게 하는 소박하고 예쁜 부착물입니다.",
    detail: "공동체 속에서 평화를 기원하는 배려와 약속의 의미, 명확하게 눈에 띄는 주황 노란색의 조화가 아름답습니다."
  },
  37: {
    title: "세잎 클로버",
    desc: "초록빛 풀밭 사이에서 조용히 고개를 내민 세 장의 둥근 하트 모양 잎새를 머금은 풋풋하고 내추럴한 한 포기의 클로버입니다.",
    detail: "평화와 일상의 사소한 행복을 지향하는 소박하고 고운 취향과 잎새 속에 담긴 따스함에서 마음에 기분 좋은 쉼표를 찍어봅니다."
  },
  38: {
    title: "lp플레이어",
    desc: "빙글빙글 도는 둥근 레코드판 위로 묵직한 바늘이 사뿐히 얹혀 낭만적인 음악 소리를 맑게 실어 나르는 우아한 빈티지 턴테이블 정물입니다.",
    detail: "음악을 마주하는 기분 좋은 직관과 아날로그 기기를 섬세히 연출한 방법론의 멋에 깊은 교감을 보냅니다."
  },
  39: {
    title: "종이배",
    desc: "하얀 도화지를 정성스레 접어 완벽한 직삼각형 돛을 세워둔 채 물 위에 띄우기를 기다리는 예쁜 손수 접은 미니 종이배입니다.",
    detail: "어린 시절의 아련한 동경과 순수한 낭만의 서사, 번잡한 기교를 벗어나 나만의 소박함을 예찬하는 미니멀한 안목의 취향입니다."
  },
  40: {
    title: "기아차 로고",
    desc: "곧고 평행하게 뻗은 날렵한 선들이 기하학적으로 연결되어 모던함과 속도감을 상징하는 세련된 자동차 메탈 엠블럼입니다.",
    detail: "보는 순간 한 방향으로 치닫는 진취적인 에너지의 직관적 전달과 윤곽선의 선명함에서 대칭적 조형미를 발견하셨군요."
  },
  41: {
    title: "소화기 표지판",
    desc: "붉은색 배경 위에 원통형 소화기와 굽어 있는 노란 호스를 명확한 픽토그램으로 실루엣 처리하여 눈에 띄게 한 소방 안전 표지안내입니다.",
    detail: "위기에서 평화를 안전하게 확보해 준다는 수호의 상징적인 의미와 기능적인 인쇄 방법론의 정갈함을 봅니다."
  },
  42: {
    title: "하얀 번개",
    desc: "새하얀 캔버스 정중앙에 강렬하고 날카로운 사선 궤적으로 번뜩이며 내려꽂히는 상아색의 미니멀 번개 데칼 심볼입니다.",
    detail: "빛나는 아이디어와 전인적인 통찰을 대변하는 상징성, 중심에 굳건하게 우뚝 선 번개 실루엣의 대범함이 돋보입니다."
  },
  43: {
    title: "점묘화 판화",
    desc: "미세한 부식 점들을 일정한 밀도로 쪼개어 수놓아 정교하고 몽환적인 명암과 부드러운 안개빛을 직조해 낸 고급 점묘 판화입니다.",
    detail: "점들이 유기적으로 결합하여 완성하는 둥글고 부드러운 형태미, 남들이 쉽게 다루지 않는 전위적인 미학에 깊이 고개를 끄덕입니다."
  },
  44: {
    title: "태양 기하학 그림",
    desc: "이글이글 타오르는 주황색 태양 원형을 중심으로 기하학적이고 대칭적인 붉은 날개 무늬들이 부채꼴로 뻗어 나가는 원형 기하 예술 패턴입니다.",
    detail: "열정과 생명력이 넘치는 다채로운 조화의 색감과 360도 한 치 오차도 없는 원형 비례 대칭 형태가 장엄함을 선사합니다."
  },
  45: {
    title: "녹슨 휴지통",
    desc: "야외 벌판에 조용히 놓여 오랜 비바람과 햇살에 세월을 고스란히 맞으며 붉은 녹이 은은하게 슬어버린 철제 빈티지 휴지통입니다.",
    detail: "지나간 시간의 깊이와 세월의 가치, 표면의 거칠고 입체적인 산화 질감 속에서 아날로그적 정취를 한껏 음미하십니다."
  },
  46: {
    title: "스피커 입구",
    desc: "진공 상태처럼 어둡고 깊은 원형 동심원이 테두리를 휘감아 소리가 맑게 뿜어져 나오는 세련된 음악용 스피커의 깊고 우아한 덕트 부분입니다.",
    detail: "좌우가 완벽하고 부드럽게 감도는 동심원의 우아한 대칭 형태와 소리를 가다듬는 매력적인 대상 구도에 깊은 사색을 느낍니다."
  },
  47: {
    title: "화살표",
    desc: "주황색 반사판 위로 과감하게 사선 날개짓을 조각해 두어 어둠 속에서도 신속하게 대피 방향을 유도하는 야외 도로용 안전 표지판입니다.",
    detail: "보자마자 주체할 수 없이 직진하고자 하는 확실한 방향 지시 직관성과 미래로 도약하는 긍정적인 메시지를 발견하셨군요."
  },
  48: {
    title: "소화전 전등",
    desc: "칠흑 같은 어둠이 깔려도 언제나 붉고 아름답게 불을 밝히며 둥근 돔을 그리며 주위를 든든하게 비춰주는 수호 램프 조명입니다.",
    detail: "기분 좋은 안심을 주는 붉은 광선의 선명함과 원형의 볼륨감 넘치는 형태미에서 든든함과 따뜻한 서정을 느낍니다."
  },
  49: {
    title: "나뭇잎",
    desc: "맑은 연두빛 잎맥들이 물결처럼 양쪽으로 정밀하게 뻗어나가 햇빛 아래 투명하게 생명력을 반짝이는 한 장의 고운 나뭇잎입니다.",
    detail: "가장 소박한 자연에서 발굴해낸 구체적인 아름다움과 가슴을 기분 좋게 물들이는 초록의 색채감 속에서 완벽함을 향유하십니다."
  },
  50: {
    title: "삼색 소화기",
    desc: "레드, 옐로우, 그린의 생동감 넘치는 원색들이 세 부분으로 고르게 면 분할되어 시각적 활력과 트렌디한 감각을 뿜어내는 모던한 인테리어 소화기입니다.",
    detail: "기존의 뻔함을 탈피한 고도의 화사한 색상 조율 미감과 소품처럼 연출해 보는 세련된 라이프 취향이 정렬되었습니다."
  }
};

// Use getPredefinedImageInfo dynamically instead of overwriting on module load.


export const getImageKeywords = (imgNum: number, userName: string = "사용자"): string[] => {
  const norm = (s: string) => s.normalize("NFC").trim().toLowerCase();
  const uNorm = norm(userName);
  const isLeeYoonSeop = uNorm === "이윤섭" || uNorm === "leeyoonseop" || userName.normalize("NFD").trim().toLowerCase() === "이윤섭".normalize("NFD").trim().toLowerCase() || uNorm === "이윤서" || uNorm === "leeyoonseo" || userName.normalize("NFD").trim().toLowerCase() === "이윤서".normalize("NFD").trim().toLowerCase();

  if (isLeeYoonSeop) {
    const leeYoonSeopKeywords: Record<number, string[]> = {
      1: ['#별무늬_장화', '#건조중', '#사연있어보임'],
      2: ['#얼굴같다', '#동그란입', '#빛나는_눈'],
      3: ['#자글자글', '#사다리타기', '#반복적인'],
      4: ['#도형패턴', '#반복적인', '#기하학'],
      5: ['#긴장', '#규율거부', '#물질성'],
      6: ['#꽃밭_속', '#하나하나', '#보는대로_담기'],
      7: ['#이미지_합쳐보기', '#새로운', '#비선형'],
      8: ['#물질성', '#원형_모양', '#규칙'],
      9: ['#반복적인', '#꽃잎', '#만다라'],
      10: ['#반복적인', '#끼리코끼리', '#만다라'],
      11: ['#환상의_나라', '#유니콘과_별무리', '#신비'],
      12: ['#우연과_발견', '#도심_속_피어난', '#선홍빛'],
      13: ['#반복적인', '#규칙_속_규칙', '#불교무늬'],
      14: ['#인자하신_부처님', '#오리엔탈', '#눈을_감자'],
      15: ['#디지털거울셀카', '#안녕하세요', '#강아지'],
      16: ['#수채화', '#옛날_극작', '#어두운분위기'],
      17: ['#남자의_초상', '#표정', '#라인드로잉'],
      18: ['#체게바라', '#표정', '#이데올로기'],
      19: ['#캐릭터', '#치킨과_맥주', '#알고보면_잔인함'],
      20: ['#레트로화보', '#아날로그와_디지털', '#타이포그래피'],
      21: ['#아날로그', '#귀여움', '#동네소모임'],
      22: ['#아날로그', '#교과서그림', '#이야기'],
      23: ['#캐릭터', '#표정', '#포스터'],
      24: ['#타이포', '#아날로그', '#포스터'],
      25: ['#인물', '#빨래광고', '#오래된_사진'],
      26: ['#세마을로고', '#레트로', '#구겨진_원'],
      27: ['#원형_원목_의자', '#지그재그', '#라인드로잉'],
      28: ['#원형맨홀', '#맨홀디자인과_색감', '#오수'],
      29: ['#푸릇푸릇', '#여름의_생명력', '#싱그러움'],
      30: ['#마리오버섯', '#수영하는_아이들', '#시원함'],
      31: ['#관찰자', '#버섯들', '#자연'],
      32: ['#코끼리_펜던트', '#장신구', '#빈티지'],
      33: ['#고전적인', '#아프리카조각상', '#빈티지'],
      34: ['#가위모양', '#입체적인', '#미용실_간판'],
      35: ['#비즈꽃', '#아르데코', '#아르누보'],
      36: ['#아키타', '#그리패티', '#콘크리트'],
      37: ['#안내표지판', '#픽토그램', '#단순함'],
      38: ['#자개무늬', '#공예품', '#한국적인'],
      39: ['#캐릭터', '#귀여운', '#빈티지'],
      40: ['#동물_조형', '#복돼지', '#인상'],
      41: ['#냥이화분', '#둥글둥글', '#동그란_잎'],
      42: ['#어쩌다..', '#사연만땅', '#안타까움'],
      43: ['#이야기', '#빨간자동차', '#사고현장'],
      44: ['#이야기', '#자연', '#패치워크'],
      45: ['#기둥', '#시멘트', '#강인함'],
      46: ['#이미지에_이미지', '#3인_부처', '#오리엔탈리즘'],
      47: ['#한자', '#물질성', '#활자'],
      48: ['#666', '#빈티지_안내판', '#수평정렬'],
      49: ['#프레임_배치', '#안정적', '#우뚝솟은'],
      50: ['#레트로', '#추억', '#이야기']
    };
    return leeYoonSeopKeywords[imgNum] || ["#시각적_영감", "#감성적_관조", "#조형적_안정"];
  }

  const keywordMap: Record<number, string[]> = {
    1: ["#초코퍼지케이크", "#디저트_그래픽포스터", "#케이크포스터레퍼런스"],
    2: ["#치즈케이크일러스트", "#영문타이포디자인", "#카페포스터디자인"],
    3: ["#파인애플소묘", "#연필정물드로잉", "#소묘명암레퍼런스"],
    4: ["#얼룩진판화", "#먹물번짐텍스처", "#빈티지추상예술"],
    5: ["#기하학인물화", "#미니멀색면분할", "#바우하우스포스터"],
    6: ["#3D원숭이모델링", "#폴리곤아트그래픽", "#로파이3D레퍼런스"],
    7: ["#자전거체인판화", "#금속질감스탬핑", "#인더스트리얼드로잉"],
    8: ["#기하학조형패턴", "#완벽한비례분할", "#모던그래픽디자인"],
    9: ["#소금빵베이커리", "#버터황금빛윤기", "#빵사진레퍼런스"],
    10: ["#안심돈까스단면", "#바삭한튀김텍스처", "#일식플레이팅사진"],
    11: ["#치즈태비고양이", "#웅크린길고양이", "#햇살가득반려동물"],
    12: ["#딸기아이스크림케이크", "#원형디저트비례", "#수제디저트디자인"],
    13: ["#콤비네이션피자", "#화덕피자토핑", "#푸드일러스트레퍼런스"],
    14: ["#시원한생맥주", "#조밀한거품질감", "#이자카야감성사진"],
    15: ["#매콤달콤양념치킨", "#아몬드치킨토핑", "#야식치킨레퍼런스"],
    16: ["#폴드포크햄버거", "#바삭한삼각나초", "#버거플레이팅레퍼런스"],
    17: ["#단풍잎실루엣", "#아날로그판화잎맥", "#가을감성일러스트"],
    18: ["#녹슨질감흔적", "#빈티지입자텍스처", "#추상벽지레퍼런스"],
    19: ["#모자쓴남자뒷모습", "#쓸쓸한서정적일러스트", "#고독한인물화참고"],
    20: ["#울창한나무일러스트", "#푸른나뭇잎사귀", "#자연쉼터배경화면"],
    21: ["#하얀조약돌정물", "#둥글둥글돌질감", "#인테리어소품사진"],
    22: ["#수제찐만두", "#맑고투명한만두피", "#따뜻한음식일러스트"],
    23: ["#유리잔아이스티", "#뜨개질찻잔코스터", "#홈카페감성레퍼런스"],
    24: ["#포메라니안독사진", "#솜사탕복실복실털", "#반려견사진참고"],
    25: ["#추상기하판화", "#먹물스탬핑작품", "#예술적레이어디자인"],
    26: ["#크림아메리카노", "#흑백음료경계대비", "#인스타감성커피"],
    27: ["#옐로우점자블럭", "#인도보도블록패턴", "#도시공공디자인참고"],
    28: ["#초콜릿조각케이크", "#꾸덕한브라우니시럽", "#디저트촬영레퍼런스"],
    29: ["#에메랄드하와이해변", "#야자수풍경드로잉", "#여름휴양지일러스트"],
    30: ["#비상구유도등", "#직관적안전픽토그램", "#그린네온그래픽"],
    31: ["#동심원구멍판화", "#아방가르드붓터치", "#현대추상미술소스"],
    32: ["#플라스틱사슬체인", "#등간격고리구조", "#정돈된라인레퍼런스"],
    33: ["#테슬라엠블럼", "#미래테크메탈로고", "#크롬금속질감"],
    34: ["#몬드리안기하학패턴", "#삼원색빈티지격자", "#미술사조디자인참고"],
    35: ["#산악가방버클", "#아웃도어견고한결합", "#버클기하비례"],
    36: ["#초보운전스티커", "#노란사각형안내판", "#귀여운부착물디자인"],
    37: ["#세잎클로버풀밭", "#다정한초록잎새", "#소박한자연배경"],
    38: ["#빈티지lp플레이어", "#바이닐턴테이블바늘", "#아날로그레코드인테리어"],
    39: ["#미니종이배접기", "#하얀도화지종이배", "#순수낭만일러스트"],
    40: ["#기아자동차엠블럼", "#날렵한메탈로고", "#브랜드아이덴티티디자인"],
    41: ["#소화기안내표지판", "#빨간색소방픽토그램", "#안전표지안내디자인"],
    42: ["#하얀번개데칼", "#미니멀번개심볼", "#아이디어아이콘디자인"],
    43: ["#미세점묘판화", "#안개빛부드러운그라데이션", "#고급부식에칭작품"],
    44: ["#태양기하학패턴", "#부채꼴날개대칭", "#주황레드예술포스터"],
    45: ["#빈티지녹슨휴지통", "#철제산화거친질감", "#세월의흔적정물사진"],
    46: ["#스피커음향덕트", "#둥근동심원대칭", "#오디오기기비주얼"],
    47: ["#도로안전화살표", "#사선방향유도판", "#주황색반사지디자인"],
    48: ["#소화전붉은전등", "#둥근돔형램프조명", "#도시안전디테일"],
    49: ["#나뭇잎물결잎맥", "#연두빛생명력사진", "#자연그린컬러소스"],
    50: ["#삼색디자인소화기", "#인테리어소화기배치", "#모던컬러면분할"]
  };

  const predefinedInfo = getPredefinedImageInfo(imgNum, userName);
  const localDesc = predefinedInfo ? { title: predefinedInfo.subject, desc: predefinedInfo.feature, detail: predefinedInfo.focus } : IMAGE_SUBJECT_DESCRIPTIONS[imgNum];
  if (keywordMap[imgNum]) {
    return keywordMap[imgNum];
  }
  
  if (localDesc) {
    const tTag = `#${localDesc.title.replace(/\s+/g, "_")}`;
    const cleanTitle = localDesc.title.replace(/\s+/g, "");
    return [tTag, `#${cleanTitle}_레퍼런스`, "#시각적_영감"];
  }
  
  return ["#시각적_영감", "#감성적_관조", "#조형적_안정"];
};

export const getImageNumAndInfo = (
  img: ImageItem,
  idx: number,
  dynamicAnalysis?: Record<string, { title: string; desc: string; detail: string }>,
  isLoading: boolean = false,
  timeLeft: number = 10,
  userName: string = "사용자"
) => {
  const getRawInfo = () => {
    if (dynamicAnalysis && dynamicAnalysis[img.id]) {
      const dVal = dynamicAnalysis[img.id];
      return {
        title: dVal.title || "시각적 영감 파편",
        desc: dVal.desc,
        detail: dVal.detail || ""
      };
    }

    if (isLoading && (!dynamicAnalysis || Object.keys(dynamicAnalysis).length === 0)) {
      return {
        title: "AI 이미지 성향 분석 중...",
        desc: "잠시만 기다려주세요. 제가 당신의 이미지를 심층 분석하는 중이에요...",
        detail: ` (예상 분석 시간: 약 ${timeLeft}초 남음)`
      };
    }

    const imgNum = getImageNumber(img, idx);

    try {
      const explanation = getImageSpecificExplanation(imgNum, img.trait || "형태", userName, img.id, img.url);
      if (explanation) {
        return {
          title: explanation.title,
          desc: explanation.desc,
          detail: explanation.detail
        };
      }
    } catch (err) {
      console.error("Failed to generate custom fallback description:", err);
    }

    const predefinedInfo = getPredefinedImageInfo(imgNum, userName);
    const localDesc = predefinedInfo ? { title: predefinedInfo.subject, desc: predefinedInfo.feature, detail: predefinedInfo.focus } : IMAGE_SUBJECT_DESCRIPTIONS[imgNum];
    if (localDesc) {
      return {
        title: localDesc.title,
        desc: localDesc.desc,
        detail: localDesc.detail || `이 이미지는 당신의 ${img.trait || "내면"}적 감각과 정합하는 소중한 조형적 지표입니다.`
      };
    }

    const getTraitFallbackText = (traitVal: string) => {
      const t = traitVal ? traitVal.trim() : "";
      if (t === "대상" || t === "VISIONARY") {
        return "피사체의 명확한 외곽선과 존재감이 시선을 사로잡는 시각 요소입니다. 관찰자의 선호도와 시선 집중도가 조화롭게 맞아떨어지는 대표적 지표입니다.";
      }
      if (t === "의미" || t === "AESTHETIC") {
        return "시각적 경계선 너머의 구성 요소가 자아내는 맥락과 서사에 주목합니다. 피상적인 표현을 넘어 대상 고유의 의미와 아날로그적 정취를 파악하려는 특성을 보여줍니다.";
      }
      if (t === "감각" || t === "EMOTIONAL") {
        return "부드러운 조명과 안정적인 색조의 배치가 편안함을 안겨주는 시각적 단면입니다. 주변 환경 자극에 민감하게 반응하여 시각적이고 감성적인 안정감을 형성하는 성향입니다.";
      }
      if (t === "직관" || t === "INTUITIVE") {
        return "형식적인 구도에 얽매이지 않고 즉각적인 영감과 강렬한 인상으로 판단된 직관적인 지표입니다. 보이지 않는 가치와 이면의 균형을 신속하고 섬세하게 감지해 내는 인지 능력과 관련됩니다.";
      }
      if (t === "질감" || t === "ANALYTICAL") {
        return "표면의 디테일과 세밀한 짜임새가 전달하는 실재감과 촉각적 심상에 주목합니다. 단순한 장식을 배제하고 본질적인 밀도와 견고한 내실을 추구하는 지표입니다.";
      }
      if (t === "선명" || t === "RATIONAL") {
        return "대칭적인 구도 배합과 정밀한 공간 분할이 선사하는 명확함을 반영합니다. 산만한 요소를 배제하고 명료한 수평·수직적 질서를 설계하려는 정돈된 주관을 대변합니다.";
      }
      if (t === "색감") {
        return "다채로우면서도 정교하게 어우러지는 색조가 시각적 위안과 조화를 전해 줍니다. 일상 속 빛과 톤의 변화를 세밀히 파악하고 주관적인 감정 온도를 조율하는 성향입니다.";
      }
      if (t === "방법론") {
        return "치밀하게 계획된 구도 설계와 안정감 있는 대비가 특징입니다. 창의적인 프레이밍과 완성도 있는 제작 연출법에 흥미를 느끼고 분석적으로 사색해 보려는 특성과 맞닿아 있습니다.";
      }
      if (t === "취향" || t === "CREATIVE") {
        return "유행이나 외부 기준을 탈피하여 본인 고유의 취향 가치를 주체적으로 표현하는 단면입니다. 흔들림 없는 독창적인 안목과 미학적 신념을 입증해 줍니다.";
      }
      if (t === "형태" || t === "HARMONIOUS") {
        return "기하학적인 균형과 곡선의 매끄러운 조화가 안정감을 주는 구성입니다. 시각 자극의 정형성을 중시하며 내면의 심미적인 평안และ 일관된 기준을 지탱하는 지표입니다.";
      }
      return "시각적 선호도와 감각이 가리키는 방향을 따라 정성스럽게 정렬된 심미적 파편입니다. 내면의 가치관과 취향 지표를 극대화하는 보완적 지표로 작용합니다.";
    };

    const descVal = getTraitFallbackText(img.trait || "");
    return {
      title: img.trait ? `${img.trait}적 감각 단면` : "시각적 영감 파편",
      desc: descVal,
      detail: "단순한 이미지 너머, 인지 구조적 깊은 곳에 위치한 고유한 성향과 정합하는 신호입니다."
    };
  };

  const raw = getRawInfo();
  return {
    title: sanitizeText(raw.title),
    desc: sanitizeText(raw.desc),
    detail: sanitizeText(raw.detail)
  };
};

const compressImageToDataUrl = (url: string, maxWidth: number = 150): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.5);
        resolve(dataUrl);
      } else {
        resolve("");
      }
    };
    img.onerror = () => {
      resolve("");
    };
    img.src = url;
  });
};

const renderUniqueDescription = (userName: string, img: ImageItem, idx: number, primary: string, dynamicAnalysis?: Record<string, { title: string; desc: string; detail: string }>, isLoading: boolean = false, timeLeft: number = 10) => {
  const result = getImageNumAndInfo(img, idx, dynamicAnalysis, isLoading, timeLeft, userName);
  const combinedText = `${result.desc} ${result.detail || ""}`.trim();
  return (
    <div className="select-none pt-1 flex flex-col justify-between h-full">
      <div>
        <div className="font-bold text-[9px] text-[#8e8e93] border-b border-black/5 pb-1 mb-1.5 tracking-wider uppercase flex justify-between items-center">
          <span>COGNITIVE IMAGE ANALYSIS</span>
          <span>No. {String(idx + 1).padStart(2, '0')}</span>
        </div>
        <p className="text-zinc-700 text-[10.5px] leading-relaxed font-semibold">
          {combinedText}
        </p>
      </div>
    </div>
  );
};

interface P6AnalysisProps {
  selectedImages: ImageItem[];
  userName: string;
  onNext: (traitTitle: string) => void;
}

export default function P6Analysis({ selectedImages, userName, onNext }: P6AnalysisProps) {
  const CACHE_VERSION = "v16"; // Force invalidation of existing cached results to load the newly modified text definitions

  // Real-time AI descriptions cached in localStorage to prevent loss or slow fetches on page refreshes / development edits
  const [dynamicAnalysis, setDynamicAnalysis] = useState<Record<string, { title: string; desc: string; detail: string }>>(() => {
    try {
      const savedVersion = localStorage.getItem('homo_images_cache_version');
      if (savedVersion !== CACHE_VERSION) {
        localStorage.removeItem('homo_images_dynamicAnalysis');
        localStorage.setItem('homo_images_cache_version', CACHE_VERSION);
        return {};
      }
      const saved = localStorage.getItem('homo_images_dynamicAnalysis');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [isLoading, setIsLoading] = useState(() => {
    try {
      const savedVersion = localStorage.getItem('homo_images_cache_version');
      if (savedVersion !== CACHE_VERSION) {
        return true;
      }
      const saved = localStorage.getItem('homo_images_dynamicAnalysis');
      if (saved) {
        const parsed = JSON.parse(saved);
        const hasAll = selectedImages.every(img => parsed[img.id] && parsed[img.id].desc);
        if (hasAll) {
          return false;
        }
      }
    } catch {}
    return true;
  });

  const [timeLeft, setTimeLeft] = useState(15);
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  const renderInteractiveText = (text: string) => {
    if (!text) return null;
    const terms = Object.keys(AESTHETIC_DICTIONARY).sort((a, b) => b.length - a.length);
    const pattern = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
    const parts = text.split(pattern);

    return parts.map((part, index) => {
      if (AESTHETIC_DICTIONARY[part]) {
        return <AestheticWordTooltip word={part} key={index} />;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const handleP6NextClick = (title: string) => {
    onNext(title);
  };

  // Clear cache if user name changes to guarantee correct personalization
  useEffect(() => {
    const savedName = localStorage.getItem('homo_images_cachedName');
    if (savedName && savedName !== userName) {
      localStorage.removeItem('homo_images_dynamicAnalysis');
    }
    localStorage.setItem('homo_images_cachedName', userName);
  }, [userName]);

  // Synchronize to localStorage
  useEffect(() => {
    try {
      if (Object.keys(dynamicAnalysis).length > 0) {
        localStorage.setItem('homo_images_dynamicAnalysis', JSON.stringify(dynamicAnalysis));
      }
    } catch (e) {}
  }, [dynamicAnalysis]);

  useEffect(() => {
    if (!isLoading) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 1 ? prev - 1 : 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isLoading]);

  useEffect(() => {
    // If we already loaded from cache, do not trigger a fresh fetch
    if (!isLoading) return;

    let active = true;
    const fetchAnalysis = async () => {
      try {
        console.log("Starting safe on-the-fly client image compression...");
        const compressedList = await Promise.all(
          selectedImages.map(async (img, idx) => {
            const num = getImageNumber(img, idx);
            const origInfo = IMAGE_SUBJECT_DESCRIPTIONS[num] || { title: "시각적 영감 파편", desc: "당신의 무의식이 이끄는 대로 선별된 감각의 단면입니다.", detail: "" };
            try {
              const b64 = await compressImageToDataUrl(img.url, 150);
              return {
                id: img.id,
                url: img.url,
                trait: img.trait || "",
                origTitle: origInfo.title,
                origDesc: origInfo.desc,
                origDetail: origInfo.detail,
                compressedBase64: b64 || null
              };
            } catch (err) {
              console.error("Single compression failed:", err);
              return { 
                id: img.id, 
                url: img.url, 
                trait: img.trait || "", 
                origTitle: origInfo.title,
                origDesc: origInfo.desc,
                origDetail: origInfo.detail,
                compressedBase64: null 
              };
            }
          })
        );

        if (!active) return;

        // Introduce a guaranteed minimum duration of 2 seconds to prevent flashing
        // and let the user clearly view the beautiful orbit flow.
        const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

        const responsePromise = fetch("/api/analyze-selected", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: compressedList, userName })
        });

        // Enforce a strict 18 second timeout on client-side to fall back gracefully if server or proxy times out
        const clientTimeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Client-side fetch timed out after 18 seconds")), 18000)
        );

        const [response] = await Promise.all([
          Promise.race([responsePromise, clientTimeoutPromise]) as Promise<Response>,
          sleep(2000)
        ]);

        if (!response.ok) {
          throw new Error(`Server responded with HTTP status ${response.status}`);
        }

        const data = await response.json();
        if (active && data && data.success && data.analysis) {
          setDynamicAnalysis(data.analysis);
          if (data.isFallback) {
            setIsFallbackMode(true);
          }
        } else {
          throw new Error("Invalid or unsuccessful server analysis response");
        }
      } catch (err: any) {
        console.warn("Handled dynamic image analysis exception gracefully:", err.message || err);
        if (active) {
          console.log("Client-side fallback: Generating high-fidelity poetic therapeutic descriptions.");
          const localFallbackMap: Record<string, { title: string; desc: string; detail: string }> = {};
          selectedImages.forEach((img, idx) => {
            const num = getImageNumber(img, idx);
            try {
              const explanation = getImageSpecificExplanation(num, img.trait || "형태", userName, img.id, img.url);
              localFallbackMap[img.id] = {
                title: explanation.title,
                desc: explanation.desc,
                detail: explanation.detail
              };
            } catch (fallbackErr) {
              const localDesc = IMAGE_SUBJECT_DESCRIPTIONS[num] || {
                title: "시각적 영감 파편",
                desc: "당신의 무의식이 이끄는 곳을 따라 선연하게 선택된 소중한 영감 조각입니다.",
                detail: `이 이미지는 당신의 ${img.trait || "내면"}적 감각과 긴밀히 교감합니다.`
              };
              localFallbackMap[img.id] = {
                title: localDesc.title,
                desc: localDesc.desc,
                detail: localDesc.detail || `이 이미지는 당신의 ${img.trait || "내면"}적 감각과 교감하는 소중한 마음의 이정표입니다.`
              };
            }
          });
          setDynamicAnalysis(localFallbackMap);
          setIsFallbackMode(true);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };
    fetchAnalysis();
    return () => {
      active = false;
    };
  }, [selectedImages, isLoading]);

  // 1. Hovered state for custom SVG planetary node
  const [hoveredNode, setHoveredNode] = useState<{
    category: string;
    score: number;
    angle: number;
    tagline: string;
    color: string;
  } | null>(null);

  // Clicked state for custom SVG planetary node or category pills
  const [clickedCategory, setClickedCategory] = useState<string | null>(null);

  // Active index for centered explanation detailing the current image slice focus
  const [activeCenterIndex, setActiveCenterIndex] = useState<number | null>(null);

  // Hover state for overall comprehensive persona result card
  const [isPersonaRevealed, setIsPersonaRevealed] = useState<boolean>(false);

  // Aggregate total weights across all 10 selected images
  const categoryTotalWeights = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = 0;
    return acc;
  }, {} as Record<string, number>);

  const imageResults = selectedImages.map((img, idx) => {
    const result = getImageResult(img, idx);
    result.allWeights.forEach(w => {
      categoryTotalWeights[w.category] += w.weight;
    });
    return { img, ...result };
  });

  // 1. Calculate the list of associated images for each category
  const categoryImagesMap = CATEGORIES.reduce((acc, cat) => {
    const associated = imageResults.filter(res => 
      res.primary === cat || res.secondary === cat || res.tertiary === cat
    );
    acc[cat] = associated.map(res => {
      const info = getImageNumAndInfo(res.img, 0, dynamicAnalysis, isLoading, timeLeft);
      const weightObj = res.allWeights.find(w => w.category === cat);
      const weight = weightObj ? weightObj.weight : 0;
      const indexInSelected = selectedImages.findIndex(s => s.id === res.img.id);
      return {
        title: info.title,
        url: res.img.url,
        weight,
        id: res.img.id,
        indexInSelected: indexInSelected >= 0 ? indexInSelected : 0
      };
    }).sort((a, b) => b.weight - a.weight);
    return acc;
  }, {} as Record<string, Array<{ title: string; url: string; weight: number; id: string | number; indexInSelected: number }>>);

  // 2. Identify and rank categories based on counts and total weights of associated images
  const scoreData = CATEGORIES.map(cat => {
    const count = categoryImagesMap[cat]?.length || 0;
    const totalWeight = categoryImagesMap[cat]?.reduce((sum, img) => sum + img.weight, 0) || 0;
    // Composite score that guarantees count takes precedence:
    // count * 1000 + totalWeight ensures a higher count always has a higher score.
    const score = count * 1000 + totalWeight;
    return {
      category: cat,
      count,
      totalWeight,
      score
    };
  });

  const maxScore = Math.max(...scoreData.map(d => d.score), 1);

  const graphData = scoreData.map(d => {
    // Calculate percentage based on the composite score relative to the maximum score,
    // which ensures that higher rank (by count and totalWeight) strictly gets a higher percentage.
    const percentage = d.count > 0 ? Math.round((d.score / maxScore) * 100) : 0;
    return {
      category: d.category,
      count: d.count,
      totalWeight: d.totalWeight,
      percentage
    };
  }).sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count; // Sort primarily by image count descending
    }
    return b.totalWeight - a.totalWeight; // Break ties by total weight descending
  });

  const dominantTrait = graphData[0]?.category || CATEGORIES[0];
  const dominantCount = graphData[0]?.count || 0;

  const baseTraitInfo = TRAIT_DETAILS[dominantTrait] || TRAIT_DETAILS["형태"];

  const getDynamicDescription = (trait: string, count: number) => {
    switch (trait) {
      case "대상":
        return `선택한 10개의 이미지 중 무려 ${count}개의 이미지에서 뚜렷하고 밀도 높은 피사체와 단일 대상이 정밀하게 화면 중심에 부각된 구성을 선택하셨습니다. 이러한 선택 행동은 화려하고 산만한 주변 환경이나 부차적인 데코레이션에 시선을 분산시키는 대신, 프레임 한가운데에 놓여 있는 존재의 가장 원초적이고 실존적인 뼈대를 응시하려는 귀하의 강직한 인지 성향을 정밀하게 대변합니다. 특히 번잡하고 노이즈가 강한 풍경보다는 여백 속에서도 묵묵히 제자리를 지켜내며 뿜어내는 '존재 고유의 실존적 영혼'에 정서적으로 크게 흔들리고 반응하며 깊이 교감했음을 나타냅니다. 겉치장이나 인위적인 연출의 포장을 걷어내고 피사체의 날것 그대로의 본질을 일대일로 응시하려는 귀하의 깊고 사려 깊은 마음의 시선은, 군더더기가 가득한 세상에서 본질적인 진실을 선연하게 길러내는 독보적인 심미적 역량이 됩니다.`;
      case "의미":
        return `선택한 10개의 이미지 중 ${count}개의 선택지에서 이미지 내부 사물들의 상징적 배열이나 구도가 자아내는 다층적 은유와 서사적 맥락을 정확하게 짚어내셨습니다. 귀하의 시선은 단순한 물리적 배치를 스쳐 지나가지 않고, 그 이면에 정교하게 설계되었거나 우연히 형성된 숨겨진 연출적 인과관계를 입체적으로 추적하는 성향을 지닙니다. 시각 정보의 표상적 껍질 너머의 상징이나 기호, 아련한 세월의 스토리텔링을 주체적으로 탐구하고 구조화할 때 영혼의 깊은 만족을 누리십니다. 이처럼 보여지는 구상적 평면의 한계를 가볍게 뛰어넘어 그 너머에 직조된 서사적 깊이와 문학적인 서정성을 섬세하게 발굴하는 귀하의 지적 안목은, 평평하고 메마른 풍경에도 생명감 넘치는 시적 공감과 무한한 성찰적 울림을 불어넣어 줍니다.`;
      case "감각":
        return `선택한 10개의 이미지 중 ${count}개의 이미지에서 따뜻하고 서정적인 아날로그의 빛망울, 공기 중에 미세하게 부유하는 입자감, 그리고 편안하게 퍼지는 그라데이션의 정취를 직관적으로 조준하셨습니다. 이러한 지각적 선택은 날카롭고 계산적인 기하학적 대칭이나 인위적인 연출적 자극에 시선을 지치게 두기보다, 공간 전체를 은은하게 지배하는 서정적인 분위기와 감성적인 에너지의 떨림에 온전히 몰입하는 귀하의 초감각적 주파수를 명백히 드러냅니다. 흘러가는 찰나의 공기감, 은은한 서스펜스가 머무는 실루엣, 세상을 부드럽게 어루만지는 빛의 온도에 섬세하게 반응하며 평온을 가꾸시길 좋아하십니다. 날선 계산과 규격화된 경계선을 부드럽고 아늑하게 정화해내는 귀하의 다정한 촉수는, 지친 영혼을 따뜻하게 안아주는 낭만적 감수성의 정수를 보입니다.`;
      case "직관":
        return `선택한 10개의 이미지 중 무려 ${count}개의 선택지에서 이성적 비례 계산이나 언어적 규정을 가뿐히 앞지르는 찰나의 영감과 초현실적인 구도적 변주를 정밀하게 포착하셨습니다. 귀하가 선택하신 대상들은 정형화된 정답이나 보편적인 룰로 쪼갤 수 없는, 찰나의 순간에 전인적으로 들이치는 감정적 충격과 기묘한 정서적 끌림을 지니고 있습니다. 이는 귀하가 인위적으로 작동하는 이성적 비평 필터를 거부하고, 내면 가장 깊은 곳에서 울리는 무의식의 정합성과 우주적 영감의 주파수를 대담하게 신뢰함을 보여줍니다. 이유를 명료히 설명하기 이전 이미 영혼이 먼저 사물의 정수와 긴밀하게 반응하는 귀하의 비선형적 지각 역량은, 지각적 통념에 갇히지 않고 새로운 미학적 우주를 본능적으로 창조해 나갈 수 있는 신비롭고 영적인 통찰력이 됩니다.`;
      case "질감":
        return `선택한 10개의 이미지 중 무려 ${count}개의 결과물에서 세월의 더께가 고스란히 내려앉은 거친 나무 벽의 입자감, 단단하고 서늘한 물질의 피부, 그리고 디지털로는 흉내 낼 수 없는 아날로그 촉각성의 깊은 마티에르를 선택하셨습니다. 이러한 선택은 가상 공간의 매끄럽고 반짝이는 무중력적 편안함보다는, 오랜 자연의 마찰과 견고한 밀도를 품어낸 실존적 사물 고유의 날것 그대로의 가치를 신뢰하는 물성 지향적 성향을 입증합니다. 거칠지만 밀도 높은 표면을 마음의 손끝으로 정성스럽게 어루만지며 사물의 진정성을 직시하는 과정에서 평온과 깊은 지각적 카타르시스를 수확하십니다. 표상적인 껍데기를 넘어 세월이 퇴적시킨 사물의 깊은 상처와 묵직한 물성을 사랑하는 귀하의 안목은, 아날로그의 가치를 가장 깊게 대면하는 독보적인 감각적 토대가 됩니다.`;
      case "선명":
        return `선택한 10개의 이미지 중 무려 ${count}개의 풍경에서 1픽셀의 오차조차 용납하지 않는 명료한 수평·수직축의 배치와 불필요한 노이즈가 차갑게 거세된 고요하고 정적인 여백을 과감하게 찾아내셨습니다. 귀하의 시선은 산만한 시각 정보들을 엄격하고 정밀하게 거부하며, 선과 면이 연출하는 절대적인 대칭의 수학적 질서 속에서 내면의 안도감과 지각적 정화를 이끌어내는 극도의 미니멀리즘 성향을 보입니다. 흐릿하고 모호한 경계선의 번짐 속에 자신을 모호하게 방치하기보다는, 또렷하고 확고한 나만의 심리적 경계와 선명한 주관의 규칙을 세우려는 정돈된 내면의 축이 견고함을 의미합니다. 시각적 과잉 수식이 넘치는 세상에서 맑고 투명한 진실의 정수만을 추출하여 정결한 안식을 구축하려는 귀하의 강직한 설계력은 대단히 세련된 지각적 성취입니다.`;
      case "색감":
        return `선택한 10개의 이미지 중 ${count}개의 작품에서 가슴속 깊은 울림을 자아내는 다채롭고 정교한 보색 대비, 몽환적으로 은은하게 교차하는 색조의 온도 조절, 그리고 극적인 비비드 색채를 감각적으로 조율해 내셨습니다. 귀하는 단조롭고 회색빛 가득한 세상의 구도 위에 어떤 파장의 색의 온기가 불어넣어지는가에 따라 화면의 내적 서사가 얼마나 화려하고 생생하게 도약할 수 있는지 감각적으로 이해하고 계시는 색채 연금술사입니다. 무채색으로 말라버린 쓸쓸한 일상의 틈새마다 낭만적인 노을빛이나 원색적인 생명력을 유려하게 주입하며, 찰나의 빛과 조명의 흐름 속에 마음을 담아 노래하고 멜랑콜리적 아우라를 즐기는 정서적 감수성이 단연 돋보입니다.`;
      case "방법론":
        return `선택한 10개의 이미지 중 ${count}개의 풍경에서 극단적인 로우 앵글, 독특한 렌즈 투영, 그리고 빛과 어둠의 강렬한 명암비가 자아내는 정교하고 테크니컬한 연출적 연출 공식을 선택하셨습니다. 귀하는 직관적인 감상에 머무는 수준을 넘어, 이 단 한 장의 아름다운 시각 결과물이 조율되고 빌딩되기 위해 숨 가쁘게 움직였던 카메라 프레이밍의 공식과 입사광 법칙을 이성적이고 세심하게 파헤치는 분석적인 안목을 가집니다. 예술가의 번뇌가 남긴 정교한 배치 메커니즘과 연출적 수고로움에 지적인 공감을 보내고, 물리적 시선의 구조에 숨겨진 수수께끼를 논리적으로 해독하며 최고의 카타르시스를 맛보시는 사려 깊은 조형 엔지니어이자 감상주의자이십니다.`;
      case "취향":
        return `선택한 10개의 이미지 중 ${count}개의 프레임에서 다중 대칭이나 전형적 배치의 안전하고 진부한 정답을 완벽히 배반하는 아방가르드하고 과감한 비정형의 배치를 통찰력 있게 골라내셨습니다. 타인의 평범한 선호도나 공인된 미학적 유행이 제시하는 나른한 규칙에 의구심을 표하며, 오직 내면의 본능적 울림이 지목하는 '불완전함 속 독창적 미학'에 가슴 뜨겁게 지지를 보내셨습니다. 다소 삐딱하고 과감한 시각적 변조조차 당신 고유의 세련된 해석 필터를 통과하여 독자적인 고풍스러움과 전위적인 카리스마로 정화되는 쾌감을 즐기십니다. 세상이 규정하는 미학적 프레임의 속박을 가볍게 탈피하여, 독창적이고 주체적인 나만의 예술적 영토를 단단히 지켜내는 용기 있는 시각 주관가이십니다.`;
      case "형태":
      default:
        return `선택한 10개의 프레임에서 유기적이고 원만한 곡선의 실루엣, 서로 유기적으로 부드럽게 맞물리는 선의 율동, 그리고 정갈한 중심축을 완벽하게 수렴해 나가는 황금비율의 입체 균형을 지목하셨습니다. 당신의 눈빛은 규칙성이 결여된 시각 무질서나 뾰족하게 각이 진 무뚝뚝한 구도 배치에서 심리적인 피로감을 민감하게 잡아냅니다. 대신 모든 구성 요소가 충돌 없이 하나의 아름다운 구형이나 매끄러운 곡률을 그리며 조화롭게 순환하는 완전무결한 입체 비례 안에서 진정한 지각적 휴식과 깊은 안식을 가꾸십니다. 모나고 쓸쓸한 세상의 무수한 균열들을 둥글고 부드럽게 쓰다듬으며 조화로운 중심을 수립하려는 귀하의 따뜻하고 균형감 넘치는 영혼은 대단히 평화롭고 숭고한 심미안을 자랑합니다.`;
    }
  };

  const traitInfo = {
    ...baseTraitInfo,
    desc: getDynamicDescription(dominantTrait, dominantCount)
  };

  // Find all images that contribute to each category
  const getTopImagesForCategory = (cat: string) => {
    return categoryImagesMap[cat] || [];
  };

  // Setup calculation constants for Custom SVG Astro Cosmic System
  const svgCenter = 200;
  const svgMaxRadius = 150;
  const radarRadius = 130;

  // Function to compute planetary positions in local polar coordinates
  const getCoordinates = (index: number, scorePercentage: number) => {
    const angleRad = (index * 36 - 90) * Math.PI / 180; // evenly distribute 10 traits at 36 degree intervals
    const radius = 35 + (scorePercentage / 100) * (svgMaxRadius - 45); // offset spacing so nodes don't stack in dead center
    return {
      x: svgCenter + radius * Math.cos(angleRad),
      y: svgCenter + radius * Math.sin(angleRad),
      angleRad
    };
  };

  // Compute all astronomical coordinate points to pass to the closed constellation path
  const traitPoints = CATEGORIES.map((cat, i) => {
    const matchedData = graphData.find(d => d.category === cat);
    const score = matchedData ? matchedData.percentage : 50;
    return {
      category: cat,
      score,
      color: CATEGORY_COLORS[cat] || "#888888",
      tagline: CATEGORY_TAGLINES[cat] || "",
      ...getCoordinates(i, score)
    };
  });

  // Construct SVG polygon points path for the constellation lines
  const constellationPath = traitPoints.map(p => `${p.x},${p.y}`).join(" ");

  // Get active category for the interactive details/explanations panel underneath
  const activeCategory = hoveredNode ? hoveredNode.category : (clickedCategory || dominantTrait);
  const activeColor = CATEGORY_COLORS[activeCategory] || "#14b8a6";
  const activeMatched = graphData.find(d => d.category === activeCategory);
  const activeScore = activeMatched ? Math.round(activeMatched.percentage) : 0;
  const activeTagline = CATEGORY_TAGLINES[activeCategory] || "";
  const activeDetail = TRAIT_DETAILS[activeCategory] || { desc: "" };
  const activeContributors = getTopImagesForCategory(activeCategory);

  return (
    <div className="min-h-screen bg-transparent py-20 px-4 md:px-8 overflow-hidden">
      <div className="w-full max-w-6xl mx-auto space-y-32">
        
        {/* Section 1: Redesigned 5x2 Carousel / Card Flip Grid */}
        <section className="space-y-12 relative z-20">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-black tracking-[0.45em] text-neutral-400 uppercase">Archive Investigation</span>
            <h2 className="font-dandan text-4xl mt-2 tracking-wide font-normal text-neutral-900">당신의 퍼스널 이미지를 분석해드릴게요!</h2>
            
            {/* Inline dynamic loading status bar - sleek, elegant, micro animation */}
            {isLoading ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="inline-flex items-center gap-2 bg-neutral-150/55 border border-black/10 px-4 py-2 mt-3 rounded-2xl shadow-xs animate-pulse mx-auto"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-ping" />
                <span className="text-[11px] font-bold text-neutral-600 font-mono tracking-wide">
                  🔬 실시간 AI 심층 심리 분석 진행 중 (예상 완료: 약 {timeLeft}초 전후)
                </span>
              </motion.div>
            ) : (
              <p className="text-neutral-400 text-xs max-w-sm mx-auto leading-relaxed">
                선택하신 10개의 이미지입니다. 각 이미지에 마우스를 올리면 뒷면에 핵심 결과가 나타납니다. 카드를 클릭하면 원 중앙에서 더 구체적인 설명을 읽으실 수 있습니다.
              </p>
            )}
          </div>

          {/* Interactive Card Board (Circular Orbit Layout) */}
          <div className="relative w-full aspect-square max-w-[340px] sm:max-w-[500px] md:max-w-[620px] lg:max-w-[700px] mx-auto flex items-center justify-center my-16 bg-transparent">

            {/* Center Information Card Display (Completely transparent background, borderless text style) */}
            <div className="absolute w-[180px] h-[180px] sm:w-[260px] sm:h-[260px] md:w-[325px] md:h-[305px] lg:w-[360px] lg:h-[340px] flex flex-col justify-center items-center p-2 sm:p-4 text-center z-10 select-none overflow-hidden transition-all duration-300 bg-transparent">
              {(() => {
                if (activeCenterIndex === null) {
                  if (isLoading) {
                    return (
                      <div className="flex flex-col items-center justify-center h-full w-full space-y-3 px-1 select-none text-center animate-pulse">
                        <span className="w-5 h-5 rounded-full border-2 border-[#14b8a6]/25 border-t-[#14b8a6] animate-spin mb-1" />
                        <p className="text-neutral-500 font-extrabold text-[12px] sm:text-[13px] tracking-wide">
                          심층 분석 진행 중...
                        </p>
                      </div>
                    );
                  }
                  return (
                    <div className="flex flex-col items-center justify-center h-full w-full space-y-3 px-1.5 sm:px-4 select-none text-center">
                      <div className="bg-[#14b8a6]/5 border border-[#14b8a6]/10 rounded-2xl p-2.5 sm:p-4 max-w-[170px] sm:max-w-[280px] mx-auto shadow-2xs">
                        <p className="text-[8px] sm:text-[10px] font-black text-[#14b8a6] mb-1 sm:mb-1.5 uppercase tracking-widest">
                          10가지 우주적 감각 지표
                        </p>
                        <p className="text-neutral-500 font-medium text-[8px] sm:text-[11px] leading-relaxed">
                          대상, 의미, 감각, 직관, 질감, 선명, 색감, 방법론, 취향, 형태 등 <span className="font-extrabold text-neutral-700">10가지 분류</span>로 당신의 사진들을 정밀하게 분석해 내었습니다.
                        </p>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-sm rotate-45 bg-[#14b8a6] opacity-65 animate-pulse" />
                        <p className="text-[#14b8a6] font-black text-[10px] sm:text-[13.5px] leading-relaxed">
                          사진을 눌러 결과를 확인하세요
                        </p>
                      </div>
                    </div>
                  );
                }
                const activeItem = imageResults[activeCenterIndex];
                if (!activeItem) return null;
                const itemColor = CATEGORY_COLORS[activeItem.primary] || "#14b8a6";
                const info = getImageNumAndInfo(activeItem.img, activeCenterIndex, dynamicAnalysis, isLoading, timeLeft, userName);
                return (
                  <div className="flex flex-col items-center justify-center h-full w-full space-y-1 sm:space-y-3 px-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-sm rotate-45" style={{ backgroundColor: itemColor }} />
                      <span 
                        style={{ color: itemColor }}
                        className="text-[9px] sm:text-[11px] font-black tracking-widest uppercase font-mono"
                      >
                        {activeItem.primary} 성향 (No. 0{activeCenterIndex + 1})
                      </span>
                    </div>

                    <div className="max-w-[285px] sm:max-w-[340px] px-2 sm:px-4 py-1 sm:py-2 select-text select-none overflow-y-auto max-h-[80px] sm:max-h-[110px] md:max-h-[130px] lg:max-h-[150px] scrollbar-thin">
                      <p className="text-neutral-600 font-medium text-[10px] sm:text-[12px] md:text-[13px] leading-relaxed">
                        {info.desc}
                      </p>
                    </div>

                    {/* 3 Image Keywords */}
                    {(() => {
                      const imgNum = getImageNumber(activeItem.img, activeCenterIndex);
                      const kw = getImageKeywords(imgNum, userName);
                      return (
                        <div className="flex gap-1 justify-center flex-wrap max-w-full px-2 py-1">
                          {kw.map((k, i) => (
                            <span 
                              key={i} 
                              className="text-[8.5px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded-full transition-all duration-300"
                              style={{
                                backgroundColor: `${itemColor}15`,
                                color: itemColor,
                                border: `1px solid ${itemColor}25`
                              }}
                            >
                              {k}
                            </span>
                          ))}
                        </div>
                      );
                    })()}

                    <div className="pt-1 w-full flex justify-center items-center gap-1.5">
                      <span className="text-[7.5px] sm:text-[9.5px] text-neutral-400 font-semibold uppercase tracking-wider">
                        선택된 영감 해석
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {imageResults.map(({ img, primary, secondary, tertiary, allWeights }, idx) => {
              const angleDegrees = idx * 36 - 90; // Top is 12 o'clock
              const radiusPerc = 38; // Radius of 38% from center
              const x = 50 + radiusPerc * Math.cos(angleDegrees * Math.PI / 180);
              const y = 50 + radiusPerc * Math.sin(angleDegrees * Math.PI / 180);

              const isCenterActive = activeCenterIndex === idx;

              // Calculate precise relative percentages for the top three categories
              const sortedWeights = [...allWeights].sort((a, b) => b.weight - a.weight);
              const totalWeightsSum = allWeights.reduce((acc, current) => acc + current.weight, 0);

              const cat1 = sortedWeights[0]?.category || primary;
              const cat2 = sortedWeights[1]?.category || secondary;
              const cat3 = sortedWeights[2]?.category || tertiary;

              const pct1 = totalWeightsSum > 0 ? Math.round((sortedWeights[0]?.weight / totalWeightsSum) * 100) : 0;
              const pct2 = totalWeightsSum > 0 ? Math.round((sortedWeights[1]?.weight / totalWeightsSum) * 100) : 0;
              const pct3 = totalWeightsSum > 0 ? Math.round((sortedWeights[2]?.weight / totalWeightsSum) * 100) : 0;

              return (
                <div 
                  key={img.id}
                  id={`card-${img.id}`}
                  onClick={() => setActiveCenterIndex(idx)}
                  className="absolute cursor-pointer select-none group/flip z-20"
                  style={{ 
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: "translate(-50%, -50%)"
                  }}
                >
                  {/* Outer circle layout with 3D perspective */}
                  <div className="w-[66px] h-[66px] sm:w-[94px] sm:h-[94px] md:w-[114px] md:h-[114px] lg:w-[124px] lg:h-[124px] [perspective:800px]">
                    <div 
                      className={cn(
                        "relative w-full h-full duration-700 [transform-style:preserve-3d] transition-transform",
                        "group-hover/flip:[transform:rotateY(180deg)]",
                        isCenterActive ? "scale-105" : ""
                      )}
                    >
                      {/* Front Side: RAW Transparent Cropped Image (누끼) - beautifully rendered without bounding backdrops */}
                      <div className="absolute inset-0 [backface-visibility:hidden] flex items-center justify-center">
                        <img 
                          src={img.url} 
                          referrerPolicy="no-referrer"
                          className={cn(
                            "max-h-full max-w-full object-contain pointer-events-none filter select-none transition-all duration-300",
                            isCenterActive 
                              ? "drop-shadow-[0_12px_20px_rgba(0,0,0,0.18)] scale-115" 
                              : "drop-shadow-[0_5px_10px_rgba(0,0,0,0.08)] group-hover/flip:scale-110"
                          )}
                          alt="Selected slice"
                          onError={handleImageError}
                        />
                      </div>

                      {/* Back Side: Result details (flipped result) - transparent floating text with absolutely no circle borders */}
                      <div 
                        className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col items-center justify-center text-center select-none px-1"
                      >
                        <span className="text-[7.5px] sm:text-[9px] font-black tracking-widest text-neutral-400 uppercase">#0{idx + 1}</span>
                        {/* 1st (Highest) - Large */}
                        <span 
                          className="text-[10px] sm:text-[13px] md:text-[14px] font-black tracking-tighter mt-0.5 sm:mt-1 leading-none"
                          style={{ color: CATEGORY_COLORS[cat1] }}
                        >
                          {cat1} <span className="text-[8.5px] sm:text-[11px] font-black opacity-80">{pct1}%</span>
                        </span>
                        
                        {/* Semi-transparent elegant thin divider */}
                        <div className="w-4 sm:w-6 h-[1px] bg-neutral-200/60 my-0.5 sm:my-1" />

                        {/* 2nd & 3rd - Smaller 아래에 목록 형식으로 배치 */}
                        <div className="flex flex-col gap-0.5 sm:gap-1 text-neutral-500 font-extrabold text-[8px] sm:text-[10px] md:text-[10.5px] leading-tight opacity-90">
                          <span className="truncate">{cat2} {pct2}%</span>
                          <span className="truncate">{cat3} {pct3}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: Overall Analytics - Refined single cosmic constellation graph with no surrounding boxes or titles */}
        <section className="space-y-4 pt-12 border-t border-black/5 relative z-20">
          <div className="w-full max-w-[680px] mx-auto flex flex-col items-center relative overflow-visible group">
            {/* The Astronomical Canvas SVG Area - Floating, transparent background, no borders/cards */}
            <div className="w-full h-[520px] sm:h-[600px] flex items-center justify-center relative">
              <svg viewBox="0 0 400 400" className="w-full max-w-[460px] max-h-[460px] sm:max-w-[560px] sm:max-h-[560px] select-none overflow-visible">
                {/* Concentric Gravity Rings */}
                {[35, 70, 105, 140].map((ringR, ringIdx) => (
                  <g key={ringIdx}>
                    <circle 
                      cx={svgCenter} 
                      cy={svgCenter} 
                      r={ringR} 
                      fill="none" 
                      stroke="#000000" 
                      strokeOpacity="0.04" 
                      strokeWidth="1.5"
                      strokeDasharray={ringIdx === 3 ? "2 3" : undefined}
                    />
                    {ringR === 140 && (
                      <text 
                        x={svgCenter + 5} 
                        y={svgCenter - 145} 
                        className="fill-neutral-400 text-[8px] font-bold"
                      >
                        100% Orbit
                      </text>
                    )}
                  </g>
                ))}

                {/* Radiating Cardinal Spoke Lines */}
                {traitPoints.map((p, i) => (
                  <line
                    key={i}
                    x1={svgCenter}
                    y1={svgCenter}
                    x2={svgCenter + svgMaxRadius * Math.cos(p.angleRad)}
                    y2={svgCenter + svgMaxRadius * Math.sin(p.angleRad)}
                    stroke="#000000"
                    strokeOpacity="0.02"
                    strokeWidth="1"
                  />
                ))}

                {/* Connected Constellation Boundary Map */}
                <polygon
                  points={constellationPath}
                  fill="url(#constellationGradient)"
                  fillOpacity="0.06"
                  stroke="#14b8a6"
                  strokeWidth="1.5"
                  strokeOpacity="0.25"
                  strokeDasharray="4 2"
                />

                {/* Gravitational Nucleus center Core */}
                <g className="animate-spin" style={{ transformOrigin: "200px 200px", animationDuration: "35s" }}>
                  <circle cx={svgCenter} cy={svgCenter} r="14" fill="#ffffff" stroke="#e5e5e5" strokeWidth="1" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.05))" }} />
                  <circle cx={svgCenter} cy={svgCenter} r="6" fill={CATEGORY_COLORS[dominantTrait] || "#14b8a6"} className="animate-pulse" />
                  {/* Ring orbit elements inside core */}
                  <circle cx={svgCenter} cy={svgCenter} r="10" fill="none" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3 3" />
                </g>

                {/* Definitions of SVG gradient properties */}
                <defs>
                  <radialGradient id="constellationGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#e5e7eb" stopOpacity="0.1" />
                    <stop offset="100%" stopColor={CATEGORY_COLORS[dominantTrait]} stopOpacity="0.4" />
                  </radialGradient>
                </defs>

                {/* Overlay constellation dots - Interactive celestial bodies */}
                {traitPoints.map((p, i) => {
                  const isDominant = p.category === dominantTrait;
                  const planetRadius = isDominant ? 9 : 6.5; 
                  
                  return (
                    <g 
                      key={i} 
                      className="cursor-pointer group/node"
                      style={{
                        transform: activeCategory === p.category ? "scale(1.12)" : "scale(1)",
                        transformOrigin: `${p.x}px ${p.y}px`,
                        transition: "transform 0.3s ease"
                      }}
                      onMouseEnter={() => setHoveredNode({
                        category: p.category,
                        score: p.score,
                        angle: i * 36,
                        tagline: p.tagline,
                        color: p.color
                      })}
                      onMouseLeave={() => setHoveredNode(null)}
                      onClick={() => setClickedCategory(p.category)}
                    >
                      {/* Interactive invisible touch targets */}
                      <circle cx={p.x} cy={p.y} r="18" fill="transparent" />

                      {/* Active category highlight ring */}
                      {activeCategory === p.category && (
                        <circle 
                          cx={p.x} 
                          cy={p.y} 
                          r={planetRadius + 7} 
                          fill="none"
                          stroke={p.color}
                          strokeWidth="2"
                          className="animate-pulse"
                          strokeOpacity="0.85"
                        />
                      )}

                      {/* Inner glowing effect for node */}
                      <circle 
                        cx={p.x} 
                        cy={p.y} 
                        r={planetRadius + 6} 
                        fill={p.color} 
                        fillOpacity="0.1"
                        className="transition-all duration-350 group-hover/node:fill-opacity-30"
                      />
                      <circle 
                        cx={p.x} 
                        cy={p.y} 
                        r={planetRadius} 
                        fill={p.color} 
                        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}
                      />

                      {/* Center core white star */}
                      <circle cx={p.x} cy={p.y} r="2" fill="#ffffff" />

                      {/* Text label for Category on Orbit */}
                      <text
                        x={p.x + (Math.cos(p.angleRad) * 16)}
                        y={p.y + (Math.sin(p.angleRad) * 16) + 4}
                        textAnchor={Math.cos(p.angleRad) > 0.1 ? "start" : Math.cos(p.angleRad) < -0.1 ? "end" : "middle"}
                        className={`font-dandan text-[12px] font-semibold transition-colors group-hover/node:font-black ${activeCategory === p.category ? "fill-neutral-900 font-extrabold text-[13px]" : "fill-neutral-700"}`}
                      >
                        {p.category}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Category selection row for easy mobile tapping and visual guide / navigation */}
            <div className="w-full max-w-[620px] flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-4 relative z-10 px-4">
              {traitPoints.map((p, idx) => {
                const isActive = activeCategory === p.category;
                return (
                  <button
                    key={p.category}
                    onClick={() => setClickedCategory(p.category)}
                    onMouseEnter={() => setHoveredNode({
                      category: p.category,
                      score: p.score,
                      angle: idx * 36,
                      tagline: p.tagline,
                      color: p.color
                    })}
                    onMouseLeave={() => setHoveredNode(null)}
                    style={{
                      borderColor: isActive ? p.color : "rgba(0, 0, 0, 0.05)",
                      backgroundColor: isActive ? `${p.color}0d` : "rgba(255, 255, 255, 0.45)",
                      color: isActive ? p.color : "#4b5563"
                    }}
                    className={`px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full text-[10.5px] sm:text-xs font-semibold border transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xs flex items-center gap-1.5 cursor-pointer`}
                  >
                    <span 
                      className={`w-1.5 h-1.5 rounded-full ${isActive ? "scale-110" : "opacity-45"}`} 
                      style={{ backgroundColor: p.color }}
                    />
                    <span>{p.category}</span>
                    <span className="text-[9px] sm:text-[10px] font-mono opacity-60">({Math.round(p.score)}%)</span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Hover-Driven Analysis Panel Underneath the Graph */}
            <div className="w-full max-w-[620px] mt-2 bg-white/40 backdrop-blur-md rounded-3xl p-6 border border-black/5 space-y-5 text-left select-none relative z-10 shadow-xs">
              <div className="border-b border-black/5 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: activeColor }} />
                    <span className="text-[9px] font-black tracking-widest text-neutral-400 uppercase">DETAILED ANALYSIS</span>
                  </div>
                  <h3 className="font-dandan text-xl font-normal text-neutral-850 mt-1">
                    <span style={{ color: activeColor }} className="font-bold">{activeCategory}</span> 지표 도출근거 분석
                  </h3>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  <div className="bg-white/80 border border-black/5 px-3 py-1.5 rounded-full flex items-center gap-2 self-start sm:self-center shadow-xs">
                    <span className="text-[10px] font-bold text-neutral-500" title="선택한 10개의 이미지 중 이 감각지표가 반영된 이미지 개수와 비율을 의미합니다.">
                      감각 반응 강도 (취향 부합도):
                    </span>
                    <span style={{ color: activeColor }} className="font-mono text-xs sm:text-sm font-black">
                      {activeMatched?.count || 0}개 / 10개 ({activeScore}%)
                    </span>
                  </div>
                  <span className="text-[9px] text-neutral-400 font-medium select-none pr-1">
                    *선택한 10개의 이미지 중 이 지표가 결과(1~3순위)에 포함된 이미지 개수입니다.
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {/* 1. Psychological Trait Description */}
                <div className="p-3.5 rounded-2xl bg-[#faf9f6]/90 border border-black/5 shadow-xs">
                  <div className="text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">성향 정의</div>
                  <p className="text-neutral-700 text-xs font-semibold leading-relaxed">
                    {activeDetail.desc}
                  </p>
                  <p className="text-[10.5px] text-neutral-400 mt-1.5 italic font-medium">
                    “{activeTagline}”
                  </p>
                </div>

                {/* 2. Top Stimulus/Image Matches */}
                <div className="space-y-3 pt-1">
                  <div className="text-[10px] font-black text-neutral-400 uppercase tracking-wider px-1">
                    선택한 이미지 분석 (이 해당 이미지에서 위와 같은 결과가 많이 나타났어요)
                  </div>
                  
                  {activeContributors.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {activeContributors.map((c) => {
                        const imgObj = selectedImages.find(simg => simg.id === c.id);
                        const info = imgObj ? getImageNumAndInfo(imgObj, c.indexInSelected, dynamicAnalysis, isLoading, timeLeft) : null;
                        const descText = info ? info.desc : "선택하신 이미지의 분위기와 시각적 패턴이 당신의 미적 주관에 스며들어 분석 결과를 이끌어내는 근거가 되었습니다.";
                        
                        return (
                          <div 
                            key={c.id} 
                            className="flex gap-4 p-3.5 rounded-2xl bg-[#faf9f6]/80 border border-black/5 shadow-xs hover:bg-white hover:scale-[1.01] transition-all duration-300"
                          >
                            {/* Selected image thumbnail */}
                            <div className="w-[60px] h-[75px] sm:w-[68px] sm:h-[85px] flex-shrink-0 bg-neutral-100 rounded-xl overflow-hidden border border-black/10 shadow-xs flex items-center justify-center">
                              <img 
                                src={c.url} 
                                referrerPolicy="no-referrer"
                                className="max-w-full max-h-full object-contain"
                                alt="Contributing slice"
                                onError={handleImageError}
                                id={`contrib_img_${c.id}`}
                              />
                            </div>

                            {/* Contribution detail */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[9.5px] font-bold text-neutral-500 bg-neutral-200/50 px-2 py-0.5 rounded">
                                    선택한 No. {c.indexInSelected + 1} 이미지
                                  </span>
                                  <span className="text-[9px] font-bold text-neutral-400">
                                    연관도: {Math.round(c.weight)}%
                                  </span>
                                </div>
                                <p className="text-neutral-600 text-[11px] leading-relaxed font-semibold mb-2">
                                  {descText}
                                </p>

                                {/* Main and Sub results from mapping */}
                                {imgObj && (() => {
                                  const resObj = getImageResult(imgObj, c.indexInSelected);
                                  return (
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                      <span className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 border border-amber-500/20">
                                        메인결과: {resObj.primary}
                                      </span>
                                      <span className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 border border-blue-500/20">
                                        서브결과 1: {resObj.secondary}
                                      </span>
                                      {resObj.tertiary && (
                                        <span className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                                          서브결과 2: {resObj.tertiary}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}

                                {/* Contributor Image Keywords */}
                                {imgObj && (() => {
                                  const imgNum = getImageNumber(imgObj, c.indexInSelected);
                                  const kw = getImageKeywords(imgNum, userName);
                                  return (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {kw.map((k, i) => (
                                        <span 
                                          key={i} 
                                          className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md"
                                          style={{
                                            backgroundColor: `${activeColor}10`,
                                            color: activeColor,
                                            border: `1px solid ${activeColor}20`
                                          }}
                                        >
                                          {k}
                                        </span>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-400 italic px-1">기여 자료를 도출할 수 없습니다.</p>
                  )}
                </div>

                {/* Micro instructions / hints */}
                <div className="text-[9.5px] text-neutral-400 border-t border-black/5 pt-3.5 flex items-center gap-1.5 px-1 font-semibold">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-neutral-400 animate-pulse" />
                  <span>위의 성향 그래프에서 동그라미 모양의 다른 노드에 마우스를 올리면 각 지표의 상세 분석 결과가 바로 표시됩니다.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Diagnostic Overall Persona Result */}
        <section className="text-center space-y-12 py-20 border-t border-black/5 relative z-20">
          <div 
            onClick={() => setIsPersonaRevealed(prev => !prev)}
            className={`w-full mx-auto p-10 rounded-[36px] bg-white/40 hover:bg-white/95 border border-black/5 backdrop-blur-md transition-all duration-500 shadow-md hover:shadow-xl cursor-pointer select-none ${isPersonaRevealed ? 'max-w-3xl' : 'max-w-2xl hover:scale-[1.01] active:scale-[0.99]'}`}
          >
            {isPersonaRevealed ? (
              <motion.div
                key="revealed"
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.98, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="flex justify-center items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: CATEGORY_COLORS[dominantTrait] || "#14b8a6" }} />
                  <span className="text-[11px] font-black tracking-[0.4em] text-neutral-400 uppercase">Aesthetic Persona Decoded</span>
                </div>
                <div className="space-y-3">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-dandan font-normal leading-normal tracking-tight text-neutral-900 w-full text-center">
                    {userName}님은 호모이미지스 <span style={{ color: CATEGORY_COLORS[dominantTrait] }} className="font-bold">{traitInfo.title}</span>입니다
                  </h2>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-100 text-[11px] font-bold text-neutral-600 border border-black/[0.03]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    <span>대표 감각지표: <span style={{ color: CATEGORY_COLORS[dominantTrait] }}>{dominantTrait} ({Math.round(traitPoints.find(p => p.category === dominantTrait)?.score || 0)}%)</span></span>
                  </div>
                  <p className="text-neutral-500 text-sm max-w-2xl mx-auto mt-2 leading-relaxed font-semibold">
                    {renderInteractiveText(traitInfo.desc)}
                  </p>
                </div>

                {/* Deep Detail Section */}
                {(() => {
                  const deepInfo = TRAIT_DEEP_DETAILS[dominantTrait] || TRAIT_DEEP_DETAILS["형태"];
                  const themeColor = CATEGORY_COLORS[dominantTrait] || "#14b8a6";
                  const sentences = deepInfo.longDesc.split('. ').map(s => s.trim()).filter(s => s.length > 0);

                  return (
                    <div className="space-y-8 pt-6 border-t border-black/5">
                      {/* Structured Deep Profiling */}
                      <div className="text-left space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.03] pb-2">
                          <div className="flex items-center gap-2 justify-center sm:justify-start">
                            <span className="w-1.5 h-3 rounded-full" style={{ backgroundColor: themeColor }} />
                            <h3 className="text-xs font-black tracking-widest text-neutral-400 uppercase">감상 방식 심층 분석</h3>
                          </div>
                          <span className="text-[10px] text-amber-700 dark:text-amber-500 font-extrabold bg-amber-500/10 px-2.5 py-0.5 rounded-full flex items-center justify-center gap-1 animate-pulse select-none w-fit mx-auto sm:mx-0">
                            💡 강조된 단어에 마우스를 올리면 미학 해설이 나타납니다
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3.5 bg-[#faf9f6]/95 p-6 rounded-3xl border border-black/5 shadow-xs">
                          {sentences.map((sentence, idx) => {
                            let cleanSentence = sentence;
                            if (!cleanSentence.endsWith('.')) {
                              cleanSentence += '.';
                            }
                            return (
                              <div key={idx} className="flex gap-3 items-start text-xs sm:text-sm text-neutral-700 leading-relaxed font-medium">
                                <span 
                                  style={{ color: themeColor, backgroundColor: `${themeColor}15` }} 
                                  className="w-5 h-5 rounded-md flex items-center justify-center font-mono font-bold text-[10px] select-none flex-shrink-0 mt-0.5"
                                >
                                  0{idx + 1}
                                </span>
                                <span className="pt-0.5">{renderInteractiveText(cleanSentence)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Keywords */}
                      <div className="text-left space-y-3">
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <span className="w-1.5 h-3 rounded-full" style={{ backgroundColor: themeColor }} />
                          <h3 className="text-xs font-black tracking-widest text-neutral-400 uppercase">감상 스타일 키워드</h3>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                          {deepInfo.keywords.map((kw, i) => (
                            <span 
                              key={i} 
                              className="text-xs px-3.5 py-1.5 rounded-full font-bold transition-all duration-300 hover:scale-105"
                              style={{
                                backgroundColor: `${themeColor}10`,
                                color: themeColor,
                                border: `1px solid ${themeColor}20`
                              }}
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Matching Art & Cinema (Without Images) */}
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <span className="w-1.5 h-3 rounded-full" style={{ backgroundColor: themeColor }} />
                          <h3 className="text-xs font-black tracking-widest text-neutral-400 uppercase">예술적 감각 연계 큐레이션</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                          {/* Recommended Art */}
                          <div className="flex flex-col p-5 rounded-3xl bg-[#faf9f6]/90 border border-black/[0.03] shadow-xs hover:bg-white hover:shadow-md transition-all duration-300 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black tracking-widest text-neutral-400 uppercase">RECOMMENDED ART</span>
                              <div className="w-7 h-7 rounded-full flex items-center justify-center bg-amber-500/10 text-amber-600">
                                <Palette className="w-4 h-4" />
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-neutral-400 uppercase tracking-wider mb-1">미술 작품 추천</h4>
                              <h5 className="text-sm sm:text-base font-bold text-neutral-800 leading-snug">
                                {deepInfo.art.title}
                              </h5>
                            </div>
                            <div className="pt-3 border-t border-neutral-100/70">
                              <span 
                                className="inline-block px-2 py-0.5 rounded text-[9.5px] font-bold mb-1.5"
                                style={{
                                  backgroundColor: `${themeColor}15`,
                                  color: themeColor
                                }}
                              >
                                💡 감상 추천사
                              </span>
                              <p className="text-neutral-600 text-xs leading-relaxed font-semibold">
                                {renderInteractiveText(deepInfo.art.desc.replace(/^추천\s*이유:\s*/, ""))}
                              </p>
                            </div>
                            {deepInfo.art.connection && (
                              <div className="pt-3 border-t border-dashed border-neutral-200 mt-2">
                                <span 
                                  className="inline-block px-2 py-0.5 rounded text-[9.5px] font-bold mb-1.5"
                                  style={{
                                    backgroundColor: `${themeColor}10`,
                                    color: themeColor
                                  }}
                                >
                                  🔗 감상 성향 연계 분석
                                </span>
                                <p className="text-neutral-600 text-xs leading-relaxed font-semibold italic">
                                  {renderInteractiveText(deepInfo.art.connection)}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Recommended Cinema */}
                          <div className="flex flex-col p-5 rounded-3xl bg-[#faf9f6]/90 border border-black/[0.03] shadow-xs hover:bg-white hover:shadow-md transition-all duration-300 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black tracking-widest text-neutral-400 uppercase">RECOMMENDED CINEMA</span>
                              <div className="w-7 h-7 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-600">
                                <Film className="w-4 h-4" />
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-neutral-400 uppercase tracking-wider mb-1">영화 작품 추천</h4>
                              <h5 className="text-sm sm:text-base font-bold text-neutral-800 leading-snug">
                                {deepInfo.cinema.title}
                              </h5>
                            </div>
                            <div className="pt-3 border-t border-neutral-100/70">
                              <span 
                                className="inline-block px-2 py-0.5 rounded text-[9.5px] font-bold mb-1.5"
                                style={{
                                  backgroundColor: `${themeColor}15`,
                                  color: themeColor
                                }}
                              >
                                💡 감상 추천사
                              </span>
                              <p className="text-neutral-600 text-xs leading-relaxed font-semibold">
                                {renderInteractiveText(deepInfo.cinema.desc.replace(/^추천\s*이유:\s*/, ""))}
                              </p>
                            </div>
                            {deepInfo.cinema.connection && (
                              <div className="pt-3 border-t border-dashed border-neutral-200 mt-2">
                                <span 
                                  className="inline-block px-2 py-0.5 rounded text-[9.5px] font-bold mb-1.5"
                                  style={{
                                    backgroundColor: `${themeColor}10`,
                                    color: themeColor
                                  }}
                                >
                                  🔗 감상 성향 연계 분석
                                </span>
                                <p className="text-neutral-600 text-xs leading-relaxed font-semibold italic">
                                  {renderInteractiveText(deepInfo.cinema.connection)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            ) : (
              <motion.div
                key="teaser"
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.98, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-5 py-6"
              >
                <span className="text-[11px] font-black tracking-[0.4em] text-[#3b82f6] uppercase animate-pulse">SECRET ARCHIVE</span>
                <h2 className="text-3xl md:text-4xl font-dandan font-normal leading-tight tracking-wide text-neutral-700">
                  이 카드를 클릭해 보세요 🔍
                </h2>
                <p className="text-neutral-400 text-xs sm:text-sm max-w-lg mx-auto mt-4 leading-relaxed font-semibold">
                  선택하신 10가지 이미지로부터 도출된 <span className="text-[#3b82f6] font-extrabold">{userName}</span>님의 궁극적인 우주적 감각 페르소나가 베일에 감춰져 있습니다. 카드를 클릭하여 결과를 확인해 보세요.
                </p>
              </motion.div>
            )}
          </div>

          {/* Action Trigger */}
          <div className="pt-4">
            <CustomButton
              onClick={() => handleP6NextClick(traitInfo.title)}
              className="px-12 h-[54px] mx-auto text-sm font-bold tracking-widest uppercase transition-transform duration-300 hover:scale-[1.03]"
            >
              페르소나 생성하기
            </CustomButton>
          </div>
        </section>

      </div>
    </div>
  );
}
