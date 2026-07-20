import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  Trash2, 
  Search, 
  Lock, 
  Eye, 
  X, 
  Calendar, 
  ArrowLeft, 
  Layers, 
  Rotate3d, 
  User, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  Download,
  FileSpreadsheet,
  Upload,
  Camera,
  Loader2,
  Palette,
  Film
} from "lucide-react";
import { handleImageError, resolveImageUrl } from "../utils/imageRetry";
import { CustomButton } from "./CustomButton";
import { AESTHETIC_DICTIONARY } from "../utils/aestheticDictionary";
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Tooltip as RechartsTooltip 
} from "recharts";
import { 
  CATEGORIES, 
  CATEGORY_COLORS, 
  CATEGORY_TAGLINES, 
  TRAIT_DETAILS, 
  TRAIT_DEEP_DETAILS,
  getImageResult, 
  getImageNumAndInfo,
  getImageNumber,
  getImageKeywords
} from "./P6Analysis";

interface AdminDashboardProps {
  onExit: () => void;
}

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
        className="inline-block cursor-help font-extrabold text-amber-400 hover:text-amber-300 border-b-2 border-dashed border-amber-500/40 hover:border-amber-500 bg-amber-500/[0.04] hover:bg-amber-500/[0.09] px-1 py-0.2 rounded-md transition-all select-none align-baseline"
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
      return `선택한 10개의 이미지 중 무려 ${count}개의 풍경에서 1픽셀의 오차조차 용납하지 않는 명료한 수평·수직축의 배치와 불필요한 노이즈가 차갑게 거세된 고요하고 정적인 여백을 과감하게 찾아내셨습니다. 귀하의 시선은 산만한 시각 정보들을 엄격하고 정밀하게 거부하며, 선 및 면이 연출하는 절대적인 대칭의 수학적 질서 속에서 내면의 안도감과 지각적 정화를 이끌어내는 극도의 미니멀리즘 성향을 보입니다. 흐릿하고 모호한 경계선의 번짐 속에 자신을 모호하게 방치하기보다는, 또렷하고 확고한 나만의 심리적 경계와 선명한 주관의 규칙을 세우려는 정돈된 내면의 축이 견고함을 의미합니다. 시각적 과잉 수식이 넘치는 세상에서 맑고 투명한 진실의 정수만을 추출하여 정결한 안식을 구축하려는 귀하의 강직한 설계력은 대단히 세련된 지각적 성취입니다.`;
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

export default function AdminDashboard({ onExit }: AdminDashboardProps) {
  const [passcode, setPasscode] = useState(() => localStorage.getItem("homo_images_admin_passcode") || "");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [records, setRecords] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [clickedCategory, setClickedCategory] = useState<string | null>(null);
  const [isFlatView, setIsFlatView] = useState(false);
  const [cardRotation, setCardRotation] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  
  const reportRef = React.useRef<HTMLDivElement>(null);

  const [selectedUserAllImages, setSelectedUserAllImages] = useState<any[]>([]);

  useEffect(() => {
    setHoveredNode(null);
    setClickedCategory(null);
  }, [selectedRecord]);

  useEffect(() => {
    if (selectedRecord && selectedRecord.userData?.name) {
      const userName = selectedRecord.userData.name;
      fetch(`/api/user-images?name=${encodeURIComponent(userName)}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.images && data.images.length > 0) {
            setSelectedUserAllImages(data.images);
          } else {
            setSelectedUserAllImages([]);
          }
        })
        .catch(err => {
          console.error("Failed to fetch user images for admin preview:", err);
          setSelectedUserAllImages([]);
        });
    } else {
      setSelectedUserAllImages([]);
    }
  }, [selectedRecord]);
  
  // Bulk CSV/Excel Import States
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");

  // Selected participant dynamic computations for detailed analytical dashboard
  const selectedImages = selectedRecord?.selectedImages || [];

  const categoryTotalWeights = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = 0;
    return acc;
  }, {} as Record<string, number>);

  const imageResults = selectedImages.map((img: any, idx: number) => {
    const result = getImageResult(img, idx);
    result.allWeights.forEach((w: any) => {
      categoryTotalWeights[w.category] += w.weight;
    });
    return { img, ...result };
  });

  const primaryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = 0;
    return acc;
  }, {} as Record<string, number>);

  imageResults.forEach((res: any) => {
    primaryCounts[res.primary] = (primaryCounts[res.primary] || 0) + 1;
  });

  const sortedOverallTraits = [...CATEGORIES]
    .map(cat => ({
      category: cat,
      count: primaryCounts[cat] || 0,
      totalWeight: categoryTotalWeights[cat] || 0,
      details: TRAIT_DETAILS[cat]
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.totalWeight - a.totalWeight;
    });

  const top3Traits = sortedOverallTraits.slice(0, 3);

  const maxAggregatedWeight = Math.max(...Object.values(categoryTotalWeights), 1);
  const graphData = CATEGORIES.map(cat => ({
    category: cat,
    weight: categoryTotalWeights[cat],
    percentage: Math.round((categoryTotalWeights[cat] / maxAggregatedWeight) * 100)
  }));

  const imageExplanations = selectedImages.map((img: any, idx: number) => {
    const result = getImageResult(img, idx);
    const info = getImageNumAndInfo(
      img,
      idx,
      selectedRecord?.dynamicAnalysis,
      false, // isLoading
      10, // timeLeft
      selectedRecord?.userData?.name || "실험자"
    );
    return {
      img,
      title: info.title,
      desc: info.desc,
      detail: info.detail,
      primary: result.primary,
      secondary: result.secondary,
      tertiary: result.tertiary
    };
  });

  // Custom constellation geometry calculations
  const dominantTrait = top3Traits[0]?.category || CATEGORIES[0];
  const svgCenter = 200;
  const svgMaxRadius = 150;

  const getCoordinates = (index: number, scorePercentage: number) => {
    const angleRad = (index * 36 - 90) * Math.PI / 180;
    const radius = 35 + (scorePercentage / 100) * (svgMaxRadius - 45);
    return {
      x: svgCenter + radius * Math.cos(angleRad),
      y: svgCenter + radius * Math.sin(angleRad),
      angleRad
    };
  };

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

  const constellationPath = traitPoints.map(p => `${p.x},${p.y}`).join(" ");

  const activeCategory = hoveredNode ? hoveredNode.category : (clickedCategory || dominantTrait);
  const activeColor = CATEGORY_COLORS[activeCategory] || "#14b8a6";
  const activeMatched = graphData.find(d => d.category === activeCategory);
  const activeScore = activeMatched ? Math.round(activeMatched.percentage) : 0;
  const activeTagline = CATEGORY_TAGLINES[activeCategory] || "";
  const activeDetail = TRAIT_DETAILS[activeCategory] || { desc: "" };

  const categoryImagesMap = CATEGORIES.reduce((acc, cat) => {
    const associated = imageResults.filter((res: any) => 
      res.primary === cat || res.secondary === cat || res.tertiary === cat
    );
    acc[cat] = associated.map((res: any) => {
      const info = getImageNumAndInfo(
        res.img,
        0,
        selectedRecord?.dynamicAnalysis,
        false,
        15,
        selectedRecord?.userData?.name || "실험자"
      );
      const weightObj = res.allWeights.find((w: any) => w.category === cat);
      const weight = weightObj ? weightObj.weight : 0;
      const indexInSelected = selectedImages.findIndex((s: any) => s.id === res.img.id);
      return {
        title: info.title,
        url: res.img.url,
        weight,
        id: res.img.id,
        indexInSelected
      };
    });
    return acc;
  }, {} as Record<string, Array<{ title: string; url: string; weight: number; id: string | number; indexInSelected: number }>>);

  const activeContributors = categoryImagesMap[activeCategory] || [];

  const handleCSVImport = async (text: string) => {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      alert("업로드할 유효 데이터 행이 없습니다. 가이드 형식을 확인해주세요.");
      return;
    }

    const newRecords = [];

    for (let i = 1; i < lines.length; i++) {
      // Split by comma or tab (so copy-paste from Excel works directly!)
      const row = lines[i].split(/[,\t]/).map(c => c.trim().replace(/^"|"$/g, ''));
      if (row.length === 0 || !row[0]) continue;

      const name = row[0];
      const rawGender = row[1] || "female";
      const gender = rawGender.toLowerCase().includes("남") || rawGender.toLowerCase() === "male" ? "male" : "female";
      
      const rawAge = row[2] || "adult";
      let age = "adult";
      if (rawAge.includes("유아") || rawAge.toLowerCase().includes("infant")) age = "infant";
      else if (rawAge.includes("아동") || rawAge.toLowerCase().includes("child")) age = "child";
      else if (rawAge.includes("중년") || rawAge.toLowerCase().includes("middle")) age = "middle";
      else if (rawAge.includes("노년") || rawAge.toLowerCase().includes("senior")) age = "senior";

      const middleName = row[3] || "Harmonious";
      const creationUrl = row[4] || "";
      const lastNameSignature = row[5] || "";
      
      // Selected images
      const rawImages = row[6] || "";
      const selectedImages = rawImages.split(/[;|\s,]+/).filter(Boolean).map(idStr => {
        const cleaned = idStr.replace(/[^0-9]/g, '');
        const id = parseInt(cleaned) || 1;
        return {
          id: id,
          url: `/images/${id}.jpg`,
          trait: "파편"
        };
      });

      newRecords.push({
        name,
        gender,
        age,
        middleName,
        creationUrl,
        lastNameSignature,
        selectedImages
      });
    }

    if (newRecords.length === 0) {
      alert("파싱된 데이터가 없습니다. 양식이 올바른지 확인해주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/import-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode, newRecords })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`${data.count}명의 데이터가 성공적으로 서버 데이터베이스에 등록되었습니다.`);
        setShowImportModal(false);
        setImportText("");
        handleVerify(passcode); // reload records
      } else {
        alert(data.error || "가져오기 중 오류가 발생했습니다.");
      }
    } catch (err) {
      alert("서버 연결에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setImportText(text);
      }
    };
    reader.readAsText(file, "utf-8");
  };

  // Dynamic Image Category/Trait Mapping Import States
  const [showImageMapModal, setShowImageMapModal] = useState(false);
  const [imageMapText, setImageMapText] = useState("");
  const [imageMapLoading, setImageMapLoading] = useState(false);

  const handleImageMapImport = async (text: string) => {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      alert("업로드할 유효 데이터 행이 없습니다. 가이드 형식을 확인해주세요.");
      return;
    }

    const newImageMap: Record<string, { trait: string; weights: Record<string, number> }> = {};
    const traits = ["대상", "의미", "감각", "직관", "질감", "선명", "색감", "방법론", "취향", "형태"];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(/[,\t]/).map(c => c.trim().replace(/^"|"$/g, ''));
      if (row.length === 0 || !row[0]) continue;

      const imgNumStr = row[0].replace(/[^0-9]/g, '');
      const imgNum = parseInt(imgNumStr);
      if (isNaN(imgNum) || imgNum < 1 || imgNum > 50) {
        continue;
      }

      // Read up to 3 dominant categories
      const cat1 = row[1] || "";
      const cat2 = row[2] || "";
      const cat3 = row[3] || "";

      const primaryTrait = traits.includes(cat1) ? cat1 : traits[(imgNum - 1) % traits.length];
      
      const weights: Record<string, number> = {};
      
      traits.forEach((t, tIdx) => {
        if (t === primaryTrait) {
          weights[t] = 95;
        } else if (t === cat2 && traits.includes(cat2)) {
          weights[t] = 85;
        } else if (t === cat3 && traits.includes(cat3)) {
          weights[t] = 75;
        } else {
          weights[t] = 15 + (imgNum * (tIdx + 1) * 7) % 15;
        }
      });

      newImageMap[String(imgNum)] = {
        trait: primaryTrait,
        weights: weights
      };
    }

    if (Object.keys(newImageMap).length === 0) {
      alert("파싱된 유효한 이미지 데이터가 없습니다. 이미지 번호(1~50)와 성향 목록이 올바른지 확인해주세요.");
      return;
    }

    setImageMapLoading(true);
    try {
      const res = await fetch("/api/admin/update-image-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode, imageMap: newImageMap })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("50장 사진의 분석 성향(3가지 주요 성향 가중치 포함)이 성공적으로 서버 데이터베이스에 저장 및 적용되었습니다!");
        setShowImageMapModal(false);
        setImageMapText("");
      } else {
        alert(data.error || "가져오기 중 오류가 발생했습니다.");
      }
    } catch (err) {
      alert("서버 연결에 실패했습니다.");
    } finally {
      setImageMapLoading(false);
    }
  };

  const handleImageMapFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setImageMapText(text);
      }
    };
    reader.readAsText(file, "utf-8");
  };

  // Auto-authenticate if password exists in storage
  useEffect(() => {
    if (passcode) {
      handleVerify(passcode);
    }
  }, []);

  const handleVerify = async (codeToVerify: string) => {
    setLoading(true);
    setAuthError("");
    try {
      const res = await fetch(`/api/admin/results?passcode=${encodeURIComponent(codeToVerify)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setRecords(data.results || []);
        localStorage.setItem("homo_images_admin_passcode", codeToVerify);
        setPasscode(codeToVerify);
      } else {
        setAuthError(data.error || "비밀번호가 올바르지 않습니다.");
        setIsAuthenticated(false);
        localStorage.removeItem("homo_images_admin_passcode");
      }
    } catch (err) {
      setAuthError("서버연결 실패. 나중에 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("이 사용자 결과를 정말로 삭제하시겠습니까?")) return;

    try {
      const res = await fetch("/api/admin/delete-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode, id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRecords(prev => prev.filter(r => r.id !== id));
        if (selectedRecord?.id === id) {
          setSelectedRecord(null);
        }
      } else {
        alert(data.error || "삭제에 실패했습니다.");
      }
    } catch (err) {
      alert("서버 연결에 실패했습니다.");
    }
  };

  const getKoreanMiddleName = (name: string): string => {
    if (!name) return "조화";
    const upper = name.toUpperCase();
    if (upper === "HARMONIOUS") return "조화";
    const map: Record<string, string> = {
      "OBJECT": "대상", "TARGET": "대상", "VISIONARY": "대상",
      "MEANING": "의미", "AESTHETIC": "의미",
      "SENSATION": "감각", "SENSORY": "감각", "EMOTIONAL": "감각",
      "INTUITION": "직관", "INTUITIVE": "직관",
      "TEXTURE": "질감", "ANALYTICAL": "질감",
      "CLARITY": "선명", "CLEAR": "선명", "RATIONAL": "선명",
      "COLOR": "색감",
      "METHOD": "방법론",
      "TASTE": "취향", "PREFERENCE": "취향", "CREATIVE": "취향",
      "SHAPE": "형태", "FORM": "형태",
    };
    for (const [key, value] of Object.entries(map)) {
      if (upper.includes(key)) return value;
    }
    return name;
  };

  const getKoreanGender = (gender: string) => {
    if (gender === "male") return "남성";
    if (gender === "female") return "여성";
    if (gender === "other") return "기타";
    return "미지정";
  };

  const getKoreanAge = (age: string) => {
    const map: Record<string, string> = {
      "infant": "영유아 (INFANT)",
      "child": "아동 (CHILD)",
      "adult": "성인 (ADULT)",
      "middle": "중년 (MIDDLE)",
      "senior": "노년 (SENIOR)"
    };
    return map[age] || age || "성인";
  };

  const downloadSingleCSV = (rec: any) => {
    try {
      const name = rec.userData?.name || "익명";
      const gender = getKoreanGender(rec.userData?.gender);
      const age = getKoreanAge(rec.userData?.age);
      const trait = getKoreanMiddleName(rec.middleName);
      const timestamp = rec.timestamp || "";
      const creationUrl = rec.creationUrl || "";
      
      let csvContent = "";
      csvContent += "=== 호모 이미지스 랩 개별 실험 결과 보고서 ===\n\n";
      csvContent += "[테스터 기본 정보]\n";
      csvContent += "항목,내용\n";
      csvContent += `실험 참여자명,${name}\n`;
      csvContent += `프로필 이름,${rec.lastNameSignature || "미지정"}\n`;
      csvContent += `성별,${gender}\n`;
      csvContent += `연령대,${age}\n`;
      csvContent += `최종 분석 발현 성향,${trait} 성향\n`;
      csvContent += `참여 일시,${timestamp}\n`;
      csvContent += `결과 라이선스 카드 이미지 URL,${creationUrl}\n\n`;

      csvContent += "[선택한 시각 파편 (10장) 상세 정보]\n";
      csvContent += "순번,이미지 번호,대표 성향,대표 가중치,이미지 파일 경로\n";
      
      const selected = rec.selectedImages || [];
      selected.forEach((img: any, idx: number) => {
        const num = img.id || (idx + 1);
        const imgTrait = img.trait || "미지정";
        const imgUrl = img.url ? `${window.location.origin}${img.url}` : "";
        csvContent += `${idx + 1},${num}번 이미지,${imgTrait},100,${imgUrl}\n`;
      });

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `실험결과_${name}_${timestamp.replace(/[: ]/g, "_")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error generating CSV:", err);
      alert("CSV 파일 생성 도중 오류가 발생했습니다.");
    }
  };

  const downloadReportImage = async () => {
    if (!reportRef.current || !selectedRecord) return;
    setIsCapturing(true);
    try {
      // Ensure all browser fonts are completely loaded before capture
      await document.fonts.ready;

      // Wait for all images inside reportRef to be fully loaded
      const imagesInReport = Array.from(reportRef.current.querySelectorAll("img")) as HTMLImageElement[];
      await Promise.all(
        imagesInReport.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve(); // continue anyway even if error
          });
        })
      );
      
      const { toPng } = await import("html-to-image");
      
      // Wait a tiny bit to make sure rendering is settled
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const dataUrl = await toPng(reportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#111114",
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
          width: reportRef.current.offsetWidth + "px",
          height: reportRef.current.offsetHeight + "px",
          overflow: "visible",
        }
      });

      const name = selectedRecord.userData?.name || "익명";
      const timestamp = (selectedRecord.timestamp || "").replace(/[: ]/g, "_");
      const link = document.createElement("a");
      link.download = `실험결과_${name}_${timestamp}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to generate report image:", err);
      alert("이미지 저장 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsCapturing(false);
    }
  };

  const downloadAllCSV = () => {
    try {
      if (records.length === 0) {
        alert("다운로드할 데이터가 없습니다.");
        return;
      }
      
      let csvContent = "";
      csvContent += "순번,실험자명,프로필 이름,성별,연령대,발현 성향,참여 일시,라이선스 이미지 URL,선택 이미지 번호 리스트\n";
      
      records.forEach((rec, idx) => {
        const name = rec.userData?.name || "익명";
        const profileName = rec.lastNameSignature || "미지정";
        const gender = getKoreanGender(rec.userData?.gender);
        const age = getKoreanAge(rec.userData?.age);
        const trait = getKoreanMiddleName(rec.middleName);
        const timestamp = rec.timestamp || "";
        const creationUrl = rec.creationUrl || "";
        
        const selectedIds = (rec.selectedImages || []).map((img: any) => img.id).join("; ");
        
        // Escape quotes and wrap in quotes for safety
        const safeName = `"${name.replace(/"/g, '""')}"`;
        const safeProfileName = `"${profileName.replace(/"/g, '""')}"`;
        const safeCreationUrl = `"${creationUrl.replace(/"/g, '""')}"`;
        const safeSelectedIds = `"${selectedIds}"`;

        csvContent += `${records.length - idx},${safeName},${safeProfileName},${gender},${age},${trait},${timestamp},${safeCreationUrl},${safeSelectedIds}\n`;
      });

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `호모이미지스_전체참가자_결과목록.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error generating all CSV:", err);
      alert("전체 결과 CSV 생성 도중 오류가 발생했습니다.");
    }
  };

  const filteredRecords = records.filter(r => 
    (r.userData?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.middleName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute stats
  const totalUsers = records.length;
  const genderStats = records.reduce((acc, r) => {
    const g = r.userData?.gender || "unknown";
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const traitStats = records.reduce((acc, r) => {
    const trait = getKoreanMiddleName(r.middleName);
    acc[trait] = (acc[trait] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostPopularTrait = (Object.entries(traitStats) as [string, number][]).reduce<[string, number]>((max, curr) => 
    curr[1] > max[1] ? curr : max, ["없음", 0]
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] flex flex-col items-center justify-center p-6 text-black select-none relative overflow-hidden">
        {/* Abstract background blobs for a warm, artistic look */}
        <div className="absolute w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[140px] top-[-10%] left-[-10%] pointer-events-none" />
        <div className="absolute w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[140px] bottom-[-10%] right-[-10%] pointer-events-none" />

        <button 
          onClick={onExit}
          className="absolute top-8 left-8 text-neutral-500 hover:text-black transition-colors flex items-center gap-2 font-dandan text-base tracking-wider cursor-pointer"
        >
          <ArrowLeft size={18} /> 실험실로 돌아가기
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[420px] p-12 relative z-10 text-center text-black min-h-[460px] flex flex-col justify-center"
        >
          {/* Beautiful real paper background matching the main app */}
          <img src="/paper1.png" alt="Paper border" className="absolute inset-0 w-full h-full object-fill drop-shadow-2xl pointer-events-none -z-10" />
          
          <div className="relative z-10 space-y-8 py-4 flex flex-col items-center">
            <div className="space-y-3">
              <h2 className="text-3xl font-dandan font-black tracking-wider text-neutral-900 leading-tight">
                호모 이미지스 랩<br/>
                <span className="text-lg text-neutral-500 tracking-[0.2em] font-normal block mt-2 uppercase">
                  Admin System
                </span>
              </h2>
              <div className="w-12 h-[2px] bg-black/10 mx-auto" />
              <p className="text-neutral-500 font-dandan text-xs leading-relaxed max-w-[280px] mx-auto">
                실험 완료자 데이터베이스에 접속하려면<br/>
                관리자 인증 암호를 입력해주세요.
              </p>
            </div>

            <form 
              onSubmit={(e) => { 
                e.preventDefault(); 
                handleVerify(passcode); 
              }} 
              className="w-full space-y-6 flex flex-col items-center"
            >
              <div className="w-full max-w-[280px]">
                <input
                  type="password"
                  placeholder="인증 패스코드 입력"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-black/20 focus:border-black/60 outline-none text-center py-2 font-mono tracking-widest text-lg transition-all text-neutral-900 placeholder:text-neutral-300"
                  autoFocus
                />
              </div>

              {authError && (
                <p className="text-red-500 text-xs font-dandan font-bold italic bg-red-50 border border-red-100 px-4 py-1.5 rounded-full">
                  {authError}
                </p>
              )}

              <div className="w-full flex justify-center pt-2">
                <CustomButton
                  type="submit"
                  disabled={loading}
                  className="px-10 h-[50px] text-sm font-bold tracking-widest uppercase hover:scale-110 transition-transform bg-white text-black"
                >
                  {loading ? "인증 중..." : "로그인"}
                </CustomButton>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F11] text-white p-6 md:p-10 select-none font-sans relative overflow-x-hidden">
      {/* Background decorations */}
      <div className="absolute w-[700px] h-[700px] bg-[#3ff1b2]/5 rounded-full blur-[150px] top-[-20%] right-[-10%] pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] bg-indigo-950/20 rounded-full blur-[130px] bottom-[-15%] left-[-10%] pointer-events-none" />

      {/* Main Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-8 mb-8 relative z-10">
        <div>
          <div className="flex items-center gap-2 text-[#3ff1b2] font-mono text-xs uppercase tracking-widest mb-2 font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#3ff1b2] animate-ping" />
            LIVE ADMIN DATABASE
          </div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            실험 완료자 통계 및 분석 결과
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowImageMapModal(true)}
            className="px-4 py-2.5 bg-neutral-900 border border-indigo-500/20 hover:bg-neutral-800 text-indigo-300 hover:text-white transition-colors rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet size={14} className="text-indigo-400" />
            사진별 성향 엑셀 업로드
          </button>
          <button 
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2.5 bg-neutral-900 border border-white/5 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
          >
            <Upload size={14} className="text-[#3ff1b2]" />
            엑셀 데이터 업로드
          </button>
          <button 
            onClick={downloadAllCSV}
            className="px-4 py-2.5 bg-neutral-900 border border-white/5 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet size={14} className="text-[#3ff1b2]" />
            전체 엑셀 다운로드
          </button>
          <button 
            onClick={() => {
              localStorage.removeItem("homo_images_admin_passcode");
              setIsAuthenticated(false);
              setPasscode("");
            }}
            className="px-4 py-2.5 bg-neutral-900 border border-white/5 hover:bg-neutral-800 transition-colors rounded-xl text-xs text-neutral-400 hover:text-white font-mono uppercase tracking-wider cursor-pointer"
          >
            Logout
          </button>
          <button 
            onClick={onExit}
            className="px-5 py-2.5 bg-[#3ff1b2] hover:bg-[#32c28f] text-black font-semibold transition-colors rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft size={14} /> Exit Lab
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Quick Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
            <h3 className="text-xs font-mono uppercase text-neutral-400 tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp size={14} className="text-[#3ff1b2]" />
              EXECUTIVE SUMMARY
            </h3>
            
            <div className="space-y-6">
              <div className="border-b border-white/5 pb-4">
                <span className="text-xs text-neutral-400 block mb-1">총 실험 참여자 수</span>
                <span className="text-4xl font-extrabold font-mono tracking-tight text-white">
                  {totalUsers} <span className="text-lg font-light text-neutral-400">명</span>
                </span>
              </div>

              <div className="border-b border-white/5 pb-4">
                <span className="text-xs text-neutral-400 block mb-1">가장 보편적인 성향</span>
                <span className="text-xl font-bold text-[#3ff1b2] block">
                  {mostPopularTrait[0]} 성향
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  총 {mostPopularTrait[1]}명 발현 ({totalUsers > 0 ? Math.round((mostPopularTrait[1] / totalUsers) * 100) : 0}%)
                </span>
              </div>

              <div>
                <span className="text-xs text-neutral-400 block mb-2">성별 참여 비중</span>
                <div className="space-y-2 text-sm font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">여성</span>
                    <span className="font-semibold text-white">{genderStats.female || 0}명</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">남성</span>
                    <span className="font-semibold text-white">{genderStats.male || 0}명</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">기타/미지정</span>
                    <span className="font-semibold text-white">{(genderStats.other || 0) + (genderStats.unknown || 0)}명</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
            <h3 className="text-xs font-mono uppercase text-neutral-400 tracking-wider mb-4">
              성향 분포 지표
            </h3>
            <div className="space-y-3">
              {Object.entries(traitStats).map(([trait, count]) => {
                const percentage = totalUsers > 0 ? Math.round(((count as number) / totalUsers) * 100) : 0;
                return (
                  <div key={trait}>
                    <div className="flex justify-between text-xs text-neutral-300 mb-1">
                      <span>{trait} 성향</span>
                      <span className="font-mono text-[#3ff1b2]">{count}명 ({percentage}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#3ff1b2] to-indigo-500 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {Object.keys(traitStats).length === 0 && (
                <div className="text-center py-6 text-xs text-neutral-500">
                  분포 데이터가 아직 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: User Records List */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-neutral-500" size={18} />
            <input
              type="text"
              placeholder="실험자 이름 또는 성향 이름 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900/40 hover:bg-neutral-900/60 border border-white/5 focus:border-[#3ff1b2]/30 outline-none rounded-xl py-3 pl-12 pr-4 text-sm transition-all text-white"
            />
          </div>

          {/* Records list */}
          <div className="bg-neutral-900/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
            <div className="p-4 bg-neutral-900/50 border-b border-white/5 text-xs font-mono uppercase tracking-wider text-neutral-400 grid grid-cols-12 gap-4">
              <div className="col-span-3">실험자명 / 참여시각</div>
              <div className="col-span-2">인종/성향</div>
              <div className="col-span-2">성별</div>
              <div className="col-span-2">나이그룹</div>
              <div className="col-span-3 text-right">상세조회 / 관리</div>
            </div>

            <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
              {filteredRecords.map((rec) => (
                <div 
                  key={rec.id} 
                  onClick={() => { setSelectedRecord(rec); setCardRotation(0); }}
                  className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-white/[0.02] active:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  <div className="col-span-3">
                    <div className="font-bold text-white tracking-tight flex items-center gap-1.5 h-6">
                      <User size={14} className="text-indigo-400 shrink-0" />
                      {rec.userData?.signature ? (
                        <img 
                          src={rec.userData.signature} 
                          alt={rec.userData?.name || "Handwritten Name"} 
                          className="h-5 max-w-[120px] object-contain invert brightness-[2.5]"
                          onError={handleImageError}
                        />
                      ) : (
                        <span className="truncate">{rec.userData?.name || "익명"}</span>
                      )}
                    </div>
                    <div className="text-[10px] text-neutral-400 font-mono mt-0.5 flex items-center gap-1">
                      <Calendar size={10} />
                      {rec.timestamp}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-md text-xs font-medium tracking-tight">
                      {getKoreanMiddleName(rec.middleName)}
                    </span>
                  </div>

                  <div className="col-span-2 text-sm text-neutral-300 font-medium">
                    {getKoreanGender(rec.userData?.gender)}
                  </div>

                  <div className="col-span-2 text-sm text-neutral-300 font-medium">
                    {getKoreanAge(rec.userData?.age)}
                  </div>

                  <div className="col-span-3 flex items-center justify-end gap-2.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadSingleCSV(rec);
                      }}
                      className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-white/5 text-xs font-semibold rounded-lg text-neutral-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                      title="개별 엑셀(CSV) 다운로드"
                    >
                      <Download size={12} className="text-[#3ff1b2]" />
                      엑셀
                    </button>
                    <button
                      onClick={() => { setSelectedRecord(rec); setCardRotation(0); }}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-semibold rounded-lg text-[#3ff1b2] hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Eye size={12} />
                      상세 보기
                    </button>
                    <button
                      onClick={(e) => handleDelete(rec.id, e)}
                      className="p-1.5 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 text-neutral-500 hover:text-rose-500 transition-colors rounded-lg cursor-pointer"
                      title="삭제"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}

              {filteredRecords.length === 0 && (
                <div className="text-center py-16 text-sm text-neutral-500">
                  {searchQuery ? "검색 조건에 맞는 참가자 기록이 없습니다." : "참여 완료된 실험자가 아직 존재하지 않습니다."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Record Details Modal / Drawer */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-end">
            
            {/* Overlay click to exit */}
            <div className="absolute inset-0" onClick={() => setSelectedRecord(null)} />

            {/* Modal Body: Slide in drawer from right */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-full max-w-5xl h-full bg-[#111114] border-l border-white/5 relative z-10 flex flex-col p-6 md:p-8 text-white shadow-2xl overflow-y-auto"
            >
               {/* Modal Header */}
              <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#3ff1b2] font-semibold flex items-center gap-1.5">
                    <Sparkles size={12} /> EXPERIMENT COMPLETE RECORD
                  </span>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {selectedRecord.userData?.signature ? (
                      <div className="flex items-center gap-1">
                        <img 
                          src={selectedRecord.userData.signature} 
                          alt="Handwritten Name" 
                          className="h-10 max-w-[150px] object-contain invert brightness-[2.5]" 
                          onError={handleImageError}
                        />
                        <span className="text-xl font-bold tracking-tight text-neutral-300">님의 아카이브 결과</span>
                      </div>
                    ) : (
                      <h2 className="text-2xl font-bold tracking-tight">
                        {selectedRecord.userData?.name || "익명"}님의 아카이브 결과
                      </h2>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={downloadReportImage}
                    disabled={isCapturing}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/20 text-xs font-semibold rounded-xl text-white transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isCapturing ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        이미지 생성 중...
                      </>
                    ) : (
                      <>
                        <Camera size={14} />
                        결과 이미지 다운로드
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => downloadSingleCSV(selectedRecord)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/20 text-xs font-semibold rounded-xl text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download size={14} />
                    결과 엑셀 다운로드
                  </button>
                  <button
                    onClick={() => setSelectedRecord(null)}
                    className="p-2 hover:bg-white/5 rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Printable/Capturable Report Area */}
              <div ref={reportRef} className="bg-[#111114] p-4 rounded-3xl flex flex-col gap-6 flex-1">
                {/* Branded Report Watermark Header (Export Only / Clean Layout) */}
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#3ff1b2] font-semibold flex items-center gap-1.5">
                      <Sparkles size={12} /> HOMO IMAGIS LAB EXPERIMENT REPORT
                    </span>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {selectedRecord.userData?.signature ? (
                        <div className="flex items-center gap-1">
                          <img 
                            src={selectedRecord.userData.signature} 
                            alt="Handwritten Name" 
                            className="h-8 max-w-[130px] object-contain invert brightness-[2.5]" 
                            onError={handleImageError}
                          />
                          <span className="text-lg font-bold tracking-tight text-neutral-300">님의 아카이브 결과</span>
                        </div>
                      ) : (
                        <h2 className="text-xl font-bold tracking-tight">
                          {selectedRecord.userData?.name || "익명"}님의 아카이브 결과
                        </h2>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-neutral-400 block">REPORT ID</span>
                    <span className="text-xs font-mono font-bold text-[#3ff1b2]">{selectedRecord.id || "N/A"}</span>
                  </div>
                </div>

                {/* Grid content inside modal */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left pane: Profile card, signature, selected images */}
                <div className="lg:col-span-6 space-y-5">
                  
                  {/* Human Identity Information */}
                  <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-4">
                      실험 참여자 고유 인적사항
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="bg-black/30 rounded-xl p-3 border border-white/5 flex flex-col justify-center items-center min-w-0 h-[64px]">
                        <span className="text-[10px] text-neutral-400 block mb-1">기본 성명</span>
                        {selectedRecord.userData?.signature ? (
                          <div className="h-6 flex items-center justify-center">
                            <img 
                              src={selectedRecord.userData.signature} 
                              alt="Handwritten Name" 
                              className="max-h-6 object-contain invert brightness-[2.5]" 
                              onError={handleImageError}
                            />
                          </div>
                        ) : (
                          <span className="font-bold text-white text-sm sm:text-base truncate block">
                            {selectedRecord.userData?.name || "익명"}
                          </span>
                        )}
                      </div>
                      <div className="bg-black/30 rounded-xl p-3 border border-[#3ff1b2]/10 flex flex-col justify-center min-w-0 h-[64px]">
                        <span className="text-[10px] text-neutral-400 block mb-1">프로필 이름</span>
                        <span className="font-bold text-[#3ff1b2] text-sm sm:text-base truncate block">
                          {selectedRecord.lastNameSignature || "미지정"}
                        </span>
                      </div>
                      <div className="bg-black/30 rounded-xl p-3 border border-white/5 flex flex-col justify-center">
                        <span className="text-[10px] text-neutral-400 block mb-1">성별</span>
                        <span className="font-bold text-white text-sm sm:text-base truncate block">
                          {getKoreanGender(selectedRecord.userData?.gender)}
                        </span>
                      </div>
                      <div className="bg-black/30 rounded-xl p-3 border border-white/5 flex flex-col justify-center">
                        <span className="text-[10px] text-neutral-400 block mb-1">연령대</span>
                        <span className="font-bold text-white text-xs sm:text-sm truncate block">
                          {getKoreanAge(selectedRecord.userData?.age)}
                        </span>
                      </div>
                    </div>

                    {/* Original Handwritten Signature */}
                    {selectedRecord.userData?.signature && (
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <span className="text-[10px] text-neutral-400 block mb-2">실험자가 서명한 인장 서명</span>
                        <div className="w-full bg-white/5 border border-white/5 rounded-xl p-3 flex justify-center items-center">
                          <img 
                            src={selectedRecord.userData.signature} 
                            alt="User Signature" 
                            className="max-h-[80px] object-contain invert brightness-200" 
                            onError={handleImageError}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selected Images List */}
                  <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-3 flex justify-between items-center">
                      <span>선택한 무의식 시각 파편 (10장)</span>
                      <span className="text-[#3ff1b2] font-mono text-xs font-semibold">
                        {selectedRecord.selectedImages?.length || 0} SELECTED
                      </span>
                    </h3>

                    <div className="grid grid-cols-5 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {selectedRecord.selectedImages?.map((img: any, idx: number) => (
                        <div key={img.id || idx} className="relative aspect-square bg-black/40 rounded-lg overflow-hidden group border border-white/5">
                          <img 
                            src={resolveImageUrl(img.url, img.id)} 
                            alt={img.trait} 
                            className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                            onError={handleImageError}
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-black/70 text-[9px] font-mono text-center text-indigo-300 py-0.5 border-t border-white/5 truncate px-1">
                            {img.trait || "파편"}
                          </div>
                        </div>
                      ))}
                      {(!selectedRecord.selectedImages || selectedRecord.selectedImages.length === 0) && (
                        <div className="col-span-5 text-center py-8 text-xs text-neutral-500">
                          선택된 이미지 정보가 존재하지 않습니다.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right pane: 3D rotatable License Card visualization */}
                <div className="lg:col-span-6 flex flex-col justify-start items-center w-full">
                  
                  {/* Controls header */}
                  <div className="w-full flex justify-between items-center mb-4 bg-neutral-950 p-2.5 rounded-xl border border-white/5">
                    <span className="text-xs font-mono font-medium text-neutral-400 pl-2">
                      {isFlatView ? "CARD SPREAD VIEW" : "3D ROTATING LICENSE"}
                    </span>
                    <button
                      onClick={() => setIsFlatView(!isFlatView)}
                      className="px-3 py-1 bg-[#3ff1b2]/10 hover:bg-[#3ff1b2]/20 border border-[#3ff1b2]/20 text-[#3ff1b2] font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {isFlatView ? (
                        <>
                          <Rotate3d size={12} />
                          3D 회전 뷰
                        </>
                      ) : (
                        <>
                          <Layers size={12} />
                          펼쳐 보기
                        </>
                      )}
                    </button>
                  </div>

                  {/* Front/Back Card Container */}
                  <div className="w-full flex flex-col items-center justify-start py-2">
                    {isFlatView ? (
                      <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-6 items-center justify-center w-full">
                        {/* Front Card */}
                        <div 
                          className="license-card-container w-[280px] h-[437px] rounded-[24px] relative overflow-hidden flex flex-col items-center justify-center bg-white shrink-0"
                          style={{ width: "280px", height: "437px", aspectRatio: "280/437" }}
                        >
                          <img 
                            src="/card-front.png"
                            className="absolute inset-0 w-full h-full object-cover z-0 select-none pointer-events-none"
                            style={{ transform: "scale(1.03)", width: "280px", height: "437px" }}
                          />
                          <img 
                            src={selectedRecord.creationUrl} 
                            className="absolute inset-0 z-10 object-cover" 
                            style={{ width: "280px", height: "437px" }}
                            onError={handleImageError}
                          />
                          <div className="absolute bottom-5 left-6 z-20 flex flex-col gap-1 items-start">
                            <div className="flex items-center gap-1">
                              <div className="w-5 h-5 bg-black transform -rotate-12 flex items-center justify-center text-[#3ff1b2] font-extrabold text-[10px] rounded-sm">
                                1
                              </div>
                              <div className="text-black font-dandan font-black text-lg tracking-tighter ml-1 drop-shadow-md bg-white/30 backdrop-blur-sm px-1 rounded-sm">
                                호모 이미지스
                              </div>
                            </div>
                            <div className="bg-black text-[#5CA5FF] font-dandan font-black text-lg px-3 py-1 transform -skew-x-6 drop-shadow-md mt-1 border-b-[2px] border-black flex items-center gap-1.5 h-[34px] shrink-0">
                              <span>{getKoreanMiddleName(selectedRecord.middleName)}</span>
                              <span>{selectedRecord.lastNameSignature || selectedRecord.userData?.name || "스탠딩 맨"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Back Card */}
                        <div 
                          className="w-[280px] h-[437px] rounded-[24px] shadow-2xl relative overflow-hidden flex items-center justify-center border border-white/10 bg-[#FAF8F5] shrink-0"
                          style={{ width: "280px", height: "437px", aspectRatio: "280/437" }}
                        >
                          <img 
                            src="/card-back.jpg"
                            className="absolute inset-0 w-full h-full object-cover z-0 select-none pointer-events-none"
                            style={{ width: "280px", height: "437px" }}
                          />
                          <div className="absolute inset-0 pointer-events-none z-10">
                            {Array.from({ length: 50 }).map((_, i) => {
                              const imgOptions = selectedUserAllImages && selectedUserAllImages.length > 0 
                                ? selectedUserAllImages 
                                : (selectedRecord.selectedImages || []);
                              if (!imgOptions || imgOptions.length === 0) return null;
                              const img = imgOptions[i % imgOptions.length];
                              if (!img || !img.url) return null;

                              const angle = (i / 50) * Math.PI * 2;
                              const radius = 90;
                              const x = Math.cos(angle) * radius;
                              const y = Math.sin(angle) * radius;

                              const imgSize = 28 + (i % 3) * 5;
                              const rotateDeg = ((i * 29) % 60) - 30;

                              return (
                                <img 
                                  key={i} 
                                  src={resolveImageUrl(img.url, img.id)} 
                                  className="absolute object-contain"
                                  onError={handleImageError}
                                  style={{ 
                                    left: "50%",
                                    top: "50%",
                                    width: `${imgSize}px`,
                                    height: `${imgSize}px`,
                                    marginLeft: `-${imgSize / 2}px`,
                                    marginTop: `-${imgSize / 2}px`,
                                    transform: `translate(${x}px, ${y}px) rotate(${rotateDeg}deg)`
                                  }} 
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div 
                        style={{ perspective: "1500px", width: "280px", height: "437px" }} 
                        className="w-[280px] h-[437px] relative group cursor-grab active:cursor-grabbing shrink-0"
                        onClick={() => setCardRotation(prev => prev + 180)}
                      >
                        <motion.div
                          animate={{ rotateY: cardRotation }}
                          transition={{ type: "spring", damping: 15, stiffness: 80 }}
                          style={{ width: "100%", height: "100%", transformStyle: "preserve-3d" }}
                          className="relative"
                        >
                          {/* Front side */}
                          <div 
                            style={{ position: "absolute", width: "280px", height: "437px", backfaceVisibility: "hidden" }} 
                            className="drop-shadow-2xl rounded-[24px] overflow-hidden"
                          >
                            <div 
                              className="license-card-container w-[280px] h-[437px] relative flex flex-col items-center justify-center bg-white shrink-0"
                              style={{ width: "280px", height: "437px", aspectRatio: "280/437" }}
                            >
                              <img 
                                src="/card-front.png"
                                className="absolute inset-0 w-full h-full object-cover z-0 select-none pointer-events-none"
                                style={{ transform: "scale(1.03)", width: "280px", height: "437px" }}
                              />
                              <img 
                                src={selectedRecord.creationUrl} 
                                className="absolute inset-0 z-10 object-cover" 
                                style={{ width: "280px", height: "437px" }}
                                onError={handleImageError}
                              />
                              <div className="absolute bottom-5 left-6 z-20 flex flex-col gap-1 items-start">
                                <div className="flex items-center gap-1">
                                  <div className="w-5 h-5 bg-black transform -rotate-12 flex items-center justify-center text-[#3ff1b2] font-extrabold text-[10px] rounded-sm">
                                    1
                                  </div>
                                  <div className="text-black font-dandan font-black text-lg tracking-tighter ml-1 drop-shadow-md bg-white/30 backdrop-blur-sm px-1 rounded-sm">
                                    호모 이미지스
                                  </div>
                                </div>
                                <div className="bg-black text-[#5CA5FF] font-dandan font-black text-lg px-3 py-1 transform -skew-x-6 drop-shadow-md mt-1 border-b-[2px] border-black flex items-center gap-1.5 h-[34px] shrink-0">
                                    <span>{getKoreanMiddleName(selectedRecord.middleName)}</span>
                                    <span>{selectedRecord.lastNameSignature || selectedRecord.userData?.name || "스탠딩 맨"}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Back side */}
                          <div 
                            style={{ position: "absolute", width: "280px", height: "437px", backfaceVisibility: "hidden", transform: "rotateY(180deg)" }} 
                            className="drop-shadow-2xl rounded-[24px] overflow-hidden border border-white/10"
                          >
                            <div 
                              className="w-[280px] h-[437px] relative flex items-center justify-center bg-[#FAF8F5] shrink-0"
                              style={{ width: "280px", height: "437px", aspectRatio: "280/437" }}
                            >
                              <img 
                                src="/card-back.jpg"
                                className="absolute inset-0 w-full h-full object-cover z-0 select-none pointer-events-none"
                                style={{ width: "280px", height: "437px" }}
                              />
                              <div className="absolute inset-0 pointer-events-none z-10">
                                {Array.from({ length: 50 }).map((_, i) => {
                                  const imgOptions = selectedUserAllImages && selectedUserAllImages.length > 0 
                                    ? selectedUserAllImages 
                                    : (selectedRecord.selectedImages || []);
                                  if (!imgOptions || imgOptions.length === 0) return null;
                                  const img = imgOptions[i % imgOptions.length];
                                  if (!img || !img.url) return null;

                                  const angle = (i / 50) * Math.PI * 2;
                                  const radius = 90;
                                  const x = Math.cos(angle) * radius;
                                  const y = Math.sin(angle) * radius;

                                  const imgSize = 28 + (i % 3) * 5;
                                  const rotateDeg = ((i * 29) % 60) - 30;

                                  return (
                                    <img 
                                      key={i} 
                                      src={resolveImageUrl(img.url, img.id)} 
                                      className="absolute object-contain"
                                      onError={handleImageError}
                                      style={{ 
                                        left: "50%",
                                        top: "50%",
                                        width: `${imgSize}px`,
                                        height: `${imgSize}px`,
                                        marginLeft: `-${imgSize / 2}px`,
                                        marginTop: `-${imgSize / 2}px`,
                                        transform: `translate(${x}px, ${y}px) rotate(${rotateDeg}deg)`
                                      }} 
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                        <p className="text-center text-[11px] text-neutral-400 mt-4 uppercase tracking-wider flex items-center justify-center gap-1.5 w-full">
                          <ChevronRight size={12} className="rotate-90 animate-bounce" />
                          카드를 클릭하면 뒷면을 볼 수 있습니다
                        </p>
                      </div>
                    )}
                  </div>
              </div>
              </div>

              {/* 심층 분석 결과 상세 대시보드 */}
              {selectedImages.length > 0 && (
                <div className="border-t border-white/5 pt-8 mt-8 space-y-8">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="text-indigo-400" size={16} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white tracking-tight">심층 무의식 지각 성향 분석</h3>
                      <p className="text-xs text-neutral-400">선택한 시각 파편들을 정량 분석하여 추출된 지각 특성과 성향 분석 결과입니다.</p>
                    </div>
                  </div>

                  {/* Top Stats & Graph section */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left: Custom SVG Constellation Graph (우주적 성향 별자리 그래프) */}
                    <div className="lg:col-span-6 bg-neutral-900/40 border border-white/5 rounded-2xl p-5 flex flex-col items-center relative overflow-visible">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-4 self-start">
                        10대 지각 성향 밸런스 분포 (Constellation Map)
                      </span>
                      <div className="w-full flex justify-center items-center relative overflow-visible">
                        <svg viewBox="0 0 400 400" className="w-full max-w-[280px] max-h-[280px] select-none overflow-visible">
                          {/* Concentric Gravity Rings */}
                          {[35, 70, 105, 140].map((ringR, ringIdx) => (
                            <g key={ringIdx}>
                              <circle 
                                cx={svgCenter} 
                                cy={svgCenter} 
                                r={ringR} 
                                fill="none" 
                                stroke="#ffffff" 
                                strokeOpacity="0.06" 
                                strokeWidth="1.5"
                                strokeDasharray={ringIdx === 3 ? "2 3" : undefined}
                              />
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
                              stroke="#ffffff"
                              strokeOpacity="0.04"
                              strokeWidth="1"
                            />
                          ))}

                          {/* Connected Constellation Boundary Map */}
                          <polygon
                            points={constellationPath}
                            fill="url(#adminConstellationGradient)"
                            fillOpacity="0.12"
                            stroke={CATEGORY_COLORS[dominantTrait] || "#3ff1b2"}
                            strokeWidth="2"
                            strokeOpacity="0.75"
                            strokeDasharray="4 2"
                          />

                          {/* Gravitational Nucleus center Core */}
                          <g className="animate-spin" style={{ transformOrigin: "200px 200px", animationDuration: "35s" }}>
                            <circle cx={svgCenter} cy={svgCenter} r="14" fill="#18181b" stroke="#333338" strokeWidth="1" />
                            <circle cx={svgCenter} cy={svgCenter} r="6" fill={CATEGORY_COLORS[dominantTrait] || "#14b8a6"} className="animate-pulse" />
                            <circle cx={svgCenter} cy={svgCenter} r="10" fill="none" stroke="#27272a" strokeWidth="1" strokeDasharray="3 3" />
                          </g>

                          {/* Definitions of SVG gradient properties */}
                          <defs>
                            <radialGradient id="adminConstellationGradient" cx="50%" cy="50%" r="50%">
                              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.05" />
                              <stop offset="100%" stopColor={CATEGORY_COLORS[dominantTrait]} stopOpacity="0.35" />
                            </radialGradient>
                          </defs>

                          {/* Interactive constellation dots */}
                          {traitPoints.map((p, i) => {
                            const isDominant = p.category === dominantTrait;
                            const planetRadius = isDominant ? 9 : 6.5; 
                            const isActive = activeCategory === p.category;
                            
                            return (
                              <g 
                                key={i} 
                                className="cursor-pointer group/node"
                                style={{
                                  transform: isActive ? "scale(1.12)" : "scale(1)",
                                  transformOrigin: `${p.x}px ${p.y}px`,
                                  transition: "transform 0.3s ease"
                                }}
                                onMouseEnter={() => setHoveredNode({
                                  category: p.category,
                                  score: p.score,
                                  tagline: p.tagline,
                                  color: p.color
                                })}
                                onMouseLeave={() => setHoveredNode(null)}
                                onClick={() => setClickedCategory(p.category)}
                              >
                                {/* Interactive invisible touch targets */}
                                <circle cx={p.x} cy={p.y} r="18" fill="transparent" />

                                {/* Active category highlight ring */}
                                {isActive && (
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
                                  fillOpacity="0.15"
                                  className="transition-all duration-350 group-hover/node:fill-opacity-40"
                                />
                                <circle 
                                  cx={p.x} 
                                  cy={p.y} 
                                  r={planetRadius} 
                                  fill={p.color} 
                                  style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}
                                />

                                {/* Center core white star */}
                                <circle cx={p.x} cy={p.y} r="2" fill="#ffffff" />

                                {/* Text label for Category on Orbit */}
                                <text
                                  x={p.x + (Math.cos(p.angleRad) * 16)}
                                  y={p.y + (Math.sin(p.angleRad) * 16) + 4}
                                  textAnchor={Math.cos(p.angleRad) > 0.1 ? "start" : Math.cos(p.angleRad) < -0.1 ? "end" : "middle"}
                                  className={`font-dandan text-[12px] font-semibold transition-colors group-hover/node:font-black ${isActive ? "fill-white font-extrabold text-[13px]" : "fill-neutral-400"}`}
                                >
                                  {p.category}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>

                      {/* Category selection row for easy clicking and visual parity */}
                      <div className="w-full flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-3 mt-1 px-2 relative z-10">
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
                                borderColor: isActive ? p.color : "rgba(255, 255, 255, 0.05)",
                                backgroundColor: isActive ? `${p.color}22` : "rgba(255, 255, 255, 0.02)",
                                color: isActive ? p.color : "#a3a3a3"
                              }}
                              className="px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                            >
                              <span 
                                className={`w-1.5 h-1.5 rounded-full ${isActive ? "scale-110" : "opacity-45"}`} 
                                style={{ backgroundColor: p.color }}
                              />
                              <span>{p.category}</span>
                              <span className="text-[8.5px] font-mono opacity-60">({Math.round(p.score)}%)</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: 3가지 주요 결과 (Top 3 Dominant Results) */}
                    <div className="lg:col-span-6 bg-neutral-900/40 border border-white/5 rounded-2xl p-5 space-y-4">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block">
                        가장 두드러진 3가지 지각 특성 (Top 3 Traits)
                      </span>
                      <div className="space-y-3.5">
                        {top3Traits.map((t, i) => {
                          const numLabels = ["PRIMARY", "SECONDARY", "TERTIARY"];
                          const badgeColors = [
                            "bg-rose-500/10 text-rose-400 border-rose-500/20",
                            "bg-amber-500/10 text-amber-400 border-amber-500/20",
                            "bg-teal-500/10 text-teal-400 border-teal-500/20"
                          ];
                          const color = CATEGORY_COLORS[t.category] || "#6366f1";
                          return (
                            <div key={t.category} className="bg-black/30 border border-white/5 rounded-xl p-4 flex gap-4 items-start">
                              <div className="flex flex-col items-center shrink-0">
                                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${badgeColors[i]}`}>
                                  {numLabels[i]}
                                </span>
                                <span className="text-lg font-bold mt-2" style={{ color }}>
                                  {t.category}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-xs font-semibold text-neutral-200">
                                  {CATEGORY_TAGLINES[t.category]}
                                </h4>
                                <p className="text-xs text-neutral-400 leading-relaxed">
                                  {t.details?.desc || "해당 영역에 높은 시각 집중도가 파악되었습니다."}
                                </p>
                                <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-white/5">
                                  <span className="text-[10px] text-neutral-500">지각 빈도수:</span>
                                  <span className="text-xs font-bold text-[#3ff1b2] font-mono">{t.count}회 감지</span>
                                  <span className="text-[10px] text-neutral-500 ml-2">가중치 점수:</span>
                                  <span className="text-xs font-bold text-indigo-400 font-mono">{t.totalWeight}점</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Detail overlay box for selected category (Full Width Layout) */}
                  <div className="w-full bg-neutral-900/40 border border-white/5 rounded-2xl p-5 md:p-6 space-y-4 text-left">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-white/5">
                      <span className="text-sm font-bold flex items-center gap-1.5" style={{ color: activeColor }}>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeColor }} />
                        {activeCategory} 성향 상세 도출 근거
                      </span>
                      <span className="text-xs font-mono text-[#3ff1b2] font-semibold bg-[#3ff1b2]/5 border border-[#3ff1b2]/10 px-2.5 py-1 rounded-md">
                        반응 강도 {activeScore}% ({activeContributors.length}개 반응)
                      </span>
                    </div>
                    <div className="space-y-1.5 bg-black/30 p-4 rounded-xl border border-white/5">
                      <p className="text-sm text-neutral-200 font-semibold">{activeTagline}</p>
                      <p className="text-xs text-neutral-400 leading-relaxed">{activeDetail.desc}</p>
                    </div>

                    {/* Associated contributing images inside category box */}
                    {activeContributors.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                          이 지표가 검출된 선택 이미지 분석 ({activeCategory} 기여 파편)
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                          {activeContributors.map((c) => {
                            const imgObj = selectedImages.find((simg: any) => simg.id === c.id);
                            const info = imgObj ? getImageNumAndInfo(
                              imgObj, 
                              c.indexInSelected, 
                              selectedRecord?.dynamicAnalysis, 
                              false, 
                              15, 
                              selectedRecord?.userData?.name || "실험자"
                            ) : null;
                            const descText = info ? info.desc : "선택하신 이미지의 분위기와 시각적 패턴이 분석 결과를 이끌어내는 근거가 되었습니다.";
                            const recordName = selectedRecord?.userData?.name || selectedRecord?.name || "실험자";
                            const kw = imgObj ? getImageKeywords(getImageNumber(imgObj, c.indexInSelected), recordName) : [];
                            
                            return (
                              <div key={c.id} className="flex gap-3 p-3 rounded-xl bg-white/[0.015] border border-white/5 items-start">
                                <div className="w-16 h-20 bg-black/40 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 flex items-center justify-center">
                                  <img src={c.url} className="max-w-full max-h-full object-contain" onError={handleImageError} />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-neutral-400">No. {c.indexInSelected + 1} 파편</span>
                                      <span className="text-[10px] font-bold font-mono text-[#3ff1b2]">연관도 {Math.round(c.weight)}%</span>
                                    </div>
                                    {imgObj && (() => {
                                      const resObj = getImageResult(imgObj, c.indexInSelected);
                                      return (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                            메인: {resObj.primary}
                                          </span>
                                          <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                            서브 1: {resObj.secondary}
                                          </span>
                                          {resObj.tertiary && (
                                            <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                              서브 2: {resObj.tertiary}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })()}
                                    <p className="text-[11px] text-neutral-300 font-medium leading-relaxed mt-1">{descText}</p>
                                  </div>
                                  {kw.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {kw.map((k, i) => (
                                        <span 
                                          key={i} 
                                          className="text-[8.5px] font-extrabold px-1.5 py-0.5 rounded-md"
                                          style={{
                                            backgroundColor: `${activeColor}15`,
                                            color: activeColor,
                                            border: `1px solid ${activeColor}20`
                                          }}
                                        >
                                          {k}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Aesthetic Persona Decoded Section */}
                  {(() => {
                    const userName = selectedRecord.userData?.name || "실험자";
                    const baseTraitInfo = TRAIT_DETAILS[dominantTrait] || TRAIT_DETAILS["형태"];
                    const dominantCount = top3Traits[0]?.count || 0;
                    const traitInfo = {
                      ...baseTraitInfo,
                      desc: getDynamicDescription(dominantTrait, dominantCount)
                    };
                    const dominantScore = Math.round(graphData.find(d => d.category === dominantTrait)?.percentage || 0);
                    const deepInfo = TRAIT_DEEP_DETAILS[dominantTrait] || TRAIT_DEEP_DETAILS["형태"];
                    const themeColor = CATEGORY_COLORS[dominantTrait] || "#14b8a6";
                    const sentences = deepInfo.longDesc.split('. ').map(s => s.trim()).filter(s => s.length > 0);

                    return (
                      <div className="bg-neutral-900/40 border border-white/5 rounded-3xl p-6 md:p-8 space-y-8 text-left">
                        {/* Title block */}
                        <div className="border-b border-white/5 pb-6 space-y-4">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: themeColor }} />
                            <span className="text-[10px] font-mono tracking-[0.4em] text-neutral-400 uppercase">Aesthetic Persona Decoded</span>
                          </div>
                          
                          <div className="space-y-3">
                            <h2 className="text-xl sm:text-2xl font-dandan font-normal leading-normal tracking-tight text-white">
                              {userName}님은 호모이미지스 <span style={{ color: themeColor }} className="font-bold">{traitInfo.title}</span>입니다
                            </h2>
                            
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 text-[11px] font-bold text-neutral-300 border border-white/5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                              <span>대표 감각지표: <span style={{ color: themeColor }}>{dominantTrait} ({dominantScore}%)</span></span>
                            </div>
                            
                            <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed font-semibold">
                              {renderInteractiveText(traitInfo.desc)}
                            </p>
                          </div>
                        </div>

                        {/* Structured Deep Profiling / 감상 방식 심층 분석 */}
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-3 rounded-full" style={{ backgroundColor: themeColor }} />
                              <h3 className="text-xs font-mono tracking-widest text-neutral-400 uppercase">감상 방식 심층 분석</h3>
                            </div>
                            <span className="text-[10px] text-amber-400 font-extrabold bg-amber-500/10 px-2.5 py-0.5 rounded-full flex items-center justify-center gap-1 select-none w-fit">
                              💡 강조된 단어에 마우스를 올리면 미학 해설이 나타납니다
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-3 bg-black/30 p-5 rounded-2xl border border-white/5">
                            {sentences.map((sentence, idx) => {
                              let cleanSentence = sentence;
                              if (!cleanSentence.endsWith('.')) {
                                cleanSentence += '.';
                              }
                              return (
                                <div key={idx} className="flex gap-3 items-start text-xs sm:text-sm text-neutral-300 leading-relaxed font-medium">
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

                        {/* Keywords / 감상 스타일 키워드 */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-3 rounded-full" style={{ backgroundColor: themeColor }} />
                            <h3 className="text-xs font-mono tracking-widest text-neutral-400 uppercase">감상 스타일 키워드</h3>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {deepInfo.keywords.map((kw, i) => (
                              <span 
                                key={i} 
                                className="text-xs px-3.5 py-1.5 rounded-full font-bold transition-all duration-300 hover:scale-105 border"
                                style={{
                                  backgroundColor: `${themeColor}10`,
                                  color: themeColor,
                                  borderColor: `${themeColor}20`
                                }}
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Recommended Art & Cinema / 예술적 감각 연계 큐레이션 */}
                        <div className="space-y-4 pt-2">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-3 rounded-full" style={{ backgroundColor: themeColor }} />
                            <h3 className="text-xs font-mono tracking-widest text-neutral-400 uppercase">예술적 감각 연계 큐레이션</h3>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                            {/* Recommended Art */}
                            <div className="flex flex-col p-5 rounded-2xl bg-black/30 border border-white/5 shadow-xs hover:bg-neutral-900/30 transition-all duration-300 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">RECOMMENDED ART</span>
                                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-amber-500/10 text-amber-400">
                                  <Palette className="w-4 h-4" />
                                </div>
                              </div>
                              <div>
                                <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">미술 작품 추천</h4>
                                <h5 className="text-sm sm:text-base font-bold text-neutral-200 leading-snug">
                                  {deepInfo.art.title}
                                </h5>
                              </div>
                              <div className="pt-3 border-t border-white/5">
                                <span 
                                  className="inline-block px-2 py-0.5 rounded text-[9.5px] font-bold mb-1.5"
                                  style={{
                                    backgroundColor: `${themeColor}15`,
                                    color: themeColor
                                  }}
                                >
                                  💡 감상 추천사
                                </span>
                                <p className="text-neutral-300 text-xs leading-relaxed font-semibold">
                                  {renderInteractiveText(deepInfo.art.desc.replace(/^추천\s*이유:\s*/, ""))}
                                </p>
                              </div>
                              {deepInfo.art.connection && (
                                <div className="pt-3 border-t border-dashed border-white/10 mt-2">
                                  <span 
                                    className="inline-block px-2 py-0.5 rounded text-[9.5px] font-bold mb-1.5"
                                    style={{
                                      backgroundColor: `${themeColor}10`,
                                      color: themeColor
                                    }}
                                  >
                                    🔗 감상 성향 연계 분석
                                  </span>
                                  <p className="text-neutral-400 text-xs leading-relaxed font-semibold italic">
                                    {renderInteractiveText(deepInfo.art.connection)}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Recommended Cinema */}
                            <div className="flex flex-col p-5 rounded-2xl bg-black/30 border border-white/5 shadow-xs hover:bg-neutral-900/30 transition-all duration-300 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">RECOMMENDED CINEMA</span>
                                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-400">
                                  <Film className="w-4 h-4" />
                                </div>
                              </div>
                              <div>
                                <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">영화 작품 추천</h4>
                                <h5 className="text-sm sm:text-base font-bold text-neutral-200 leading-snug">
                                  {deepInfo.cinema.title}
                                </h5>
                              </div>
                              <div className="pt-3 border-t border-white/5">
                                <span 
                                  className="inline-block px-2 py-0.5 rounded text-[9.5px] font-bold mb-1.5"
                                  style={{
                                    backgroundColor: `${themeColor}15`,
                                    color: themeColor
                                  }}
                                >
                                  💡 감상 추천사
                                </span>
                                <p className="text-neutral-300 text-xs leading-relaxed font-semibold">
                                  {renderInteractiveText(deepInfo.cinema.desc.replace(/^추천\s*이유:\s*/, ""))}
                                </p>
                              </div>
                              {deepInfo.cinema.connection && (
                                <div className="pt-3 border-t border-dashed border-white/10 mt-2">
                                  <span 
                                    className="inline-block px-2 py-0.5 rounded text-[9.5px] font-bold mb-1.5"
                                    style={{
                                      backgroundColor: `${themeColor}10`,
                                      color: themeColor
                                    }}
                                  >
                                    🔗 감상 성향 연계 분석
                                  </span>
                                  <p className="text-neutral-400 text-xs leading-relaxed font-semibold italic">
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

                  {/* Bottom: Image-by-Image detailed description cards */}
                  <div className="space-y-4">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block">
                      시각 파편별 심층 분석 및 설명문 (Image-by-Image Insight)
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {imageExplanations.map((item, idx) => {
                        const primColor = CATEGORY_COLORS[item.primary] || "#94a3b8";
                        const secColor = CATEGORY_COLORS[item.secondary] || "#94a3b8";
                        const terColor = CATEGORY_COLORS[item.tertiary] || "#94a3b8";

                        return (
                          <div 
                            key={item.img.id || idx} 
                            className="bg-neutral-900/20 hover:bg-neutral-900/40 border border-white/5 rounded-2xl p-4 flex gap-4 transition-colors duration-200"
                          >
                            {/* Image Thumbnail */}
                            <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-white/5 bg-black/40 relative">
                              <img 
                                src={item.img.url} 
                                alt={item.title} 
                                className="w-full h-full object-cover"
                                onError={handleImageError}
                              />
                              <div className="absolute top-1.5 left-1.5 bg-black/75 backdrop-blur-sm text-[9px] font-mono text-[#3ff1b2] font-bold w-5 h-5 flex items-center justify-center rounded-lg border border-white/10">
                                {idx + 1}
                              </div>
                            </div>

                            {/* Details & Explanation */}
                            <div className="flex-1 flex flex-col justify-between min-w-0">
                              <div>
                                <h4 className="text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                                  {item.title}
                                </h4>
                                <p className="text-[11px] text-neutral-300 mt-1 leading-relaxed">
                                  {item.desc}
                                </p>
                                <p className="text-[10px] text-neutral-400 mt-1 leading-relaxed border-t border-white/5 pt-1.5">
                                  {item.detail}
                                </p>
                              </div>

                              {/* Per-image 3 Category Results Badges */}
                              <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-white/5">
                                <span className="text-[9px] text-neutral-500 self-center mr-1">성향 분류:</span>
                                <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/5 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: primColor }} />
                                  <span className="text-neutral-300 font-semibold">{item.primary}</span>
                                </span>
                                <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/5 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: secColor }} />
                                  <span className="text-neutral-400">{item.secondary}</span>
                                </span>
                                <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/5 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: terColor }} />
                                  <span className="text-neutral-400">{item.tertiary}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CSV/Excel Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-2xl bg-[#111114] border border-white/10 rounded-2xl p-6 shadow-2xl relative text-white flex flex-col max-h-[90vh]"
            >
              {/* Close button */}
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportText("");
                }}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Upload className="text-[#3ff1b2]" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight">외부 엑셀/CSV 데이터 가져오기</h3>
                  <p className="text-xs text-neutral-400">외부에서 진행한 실험 참가자의 결과값을 대량 등록합니다.</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
                {/* Formatting Guide */}
                <div className="bg-neutral-900/60 border border-white/5 p-4 rounded-xl space-y-2">
                  <h4 className="font-bold text-neutral-200 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3ff1b2]" />
                    올바른 데이터 서식 가이드
                  </h4>
                  <p className="text-neutral-400 leading-relaxed text-[11px]">
                    엑셀 파일을 열고 아래 열 순서로 데이터를 작성한 뒤 <span className="text-white font-bold">CSV(쉼표로 구분)</span> 파일로 저장하거나, 전체 범위를 복사해서 아래 입력 칸에 그대로 붙여넣기 하십시오. 첫 번째 줄(헤더 행)은 설명 줄로 인식되어 자동으로 제외됩니다.
                  </p>
                  <div className="bg-black/50 p-2 rounded-lg font-mono text-[10px] text-neutral-300 overflow-x-auto whitespace-nowrap">
                    이름, 성별(male/female), 나이대(adult/infant/child/middle/senior), 대표성향, 결과이미지URL, 사인서명, 선택이미지번호리스트(공백 혹은 세미콜론 구분)
                  </div>
                  <div className="text-[11px] text-neutral-400 leading-normal list-disc pl-4 space-y-1 mt-1">
                    <li><strong className="text-neutral-300">나이대:</strong> infant (유아), child (아동), adult (청년/성인), middle (중년), senior (노년)</li>
                    <li><strong className="text-neutral-300">대표성향:</strong> 형태 / 직관 / 색감 / 선명 / 질감 / 방법론 / 취향 / 감각 / 대상 / 의미</li>
                    <li><strong className="text-neutral-300">선택이미지번호:</strong> 쉼표 혹은 공백, 세미콜론(;)으로 구분하여 1부터 50번 사이의 숫자들을 지정하십시오 (예: <code className="text-[#3ff1b2]">1 12 25 33 48</code>)</li>
                  </div>
                </div>

                {/* Upload Action controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-neutral-300 font-semibold mb-2">파일로 가져오기 (.csv)</label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVFileChange}
                      className="w-full text-xs text-neutral-400 bg-neutral-950/60 border border-white/5 rounded-xl p-3 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-neutral-800 file:text-white hover:file:bg-neutral-700 cursor-pointer"
                    />
                  </div>
                  <div>
                    <span className="block text-neutral-300 font-semibold mb-2">데이터 행 수 확인</span>
                    <div className="w-full bg-neutral-950/60 border border-white/5 rounded-xl p-3 text-neutral-400 font-mono flex items-center justify-between">
                      <span>인식된 라인 수:</span>
                      <strong className="text-white text-sm">
                        {importText.split("\n").filter(Boolean).length > 0
                          ? `${Math.max(0, importText.split("\n").filter(Boolean).length - 1)} 행`
                          : "0 행"
                        }
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Direct Text input */}
                <div>
                  <label className="block text-neutral-300 font-semibold mb-2">
                    직접 붙여넣기 (또는 파일 로드된 내용 편집)
                  </label>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="이름,성별,나이대,대표성향,결과이미지URL,사인서명,선택이미지번호리스트&#10;홍길동,male,adult,직관,https://drive.google.com/...,길동,1 3 15 28 42"
                    className="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-3 outline-none focus:border-indigo-500/50 transition-colors font-mono text-[11px] text-neutral-200"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-white/5 pt-4 mt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportText("");
                  }}
                  className="px-4 py-2 bg-neutral-900 border border-white/5 hover:bg-neutral-800 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => handleCSVImport(importText)}
                  disabled={loading || !importText.trim()}
                  className="px-6 py-2 bg-[#3ff1b2] hover:bg-[#32c28f] text-black font-semibold rounded-xl text-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload size={14} />
                  데이터 일괄 업로드하기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Map Excel/CSV Import Modal */}
      <AnimatePresence>
        {showImageMapModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-2xl bg-[#111114] border border-white/10 rounded-2xl p-6 shadow-2xl relative text-white flex flex-col max-h-[90vh]"
            >
              {/* Close button */}
              <button
                onClick={() => {
                  setShowImageMapModal(false);
                  setImageMapText("");
                }}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                  <FileSpreadsheet className="text-indigo-400" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight">사진별 성향 데이터 업로드 (1~50번)</h3>
                  <p className="text-xs text-neutral-400">50장 이미지 각각에 대해 10가지 성향 중 3가지 분석 결과를 일괄 매핑합니다.</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
                {/* Formatting Guide */}
                <div className="bg-neutral-900/60 border border-indigo-500/10 p-4 rounded-xl space-y-2">
                  <h4 className="font-bold text-indigo-300 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    올바른 사진별 성향 서식 가이드
                  </h4>
                  <p className="text-neutral-400 leading-relaxed text-[11px]">
                    엑셀을 열고 아래 열 구성으로 데이터를 작성하신 후 <span className="text-indigo-300 font-bold">CSV(쉼표로 구분)</span> 파일로 저장하거나 전체 복사하여 아래 입력창에 붙여넣어 주세요. 주성향과 부성향들은 가중치(각 95, 85, 75점)로 자동 치환되어 레이더 그래프 분석에 그대로 반영됩니다.
                  </p>
                  <div className="bg-black/50 p-2 rounded-lg font-mono text-[10px] text-neutral-300 overflow-x-auto whitespace-nowrap">
                    이미지번호, 주성향1, 주성향2, 주성향3
                  </div>
                  <div className="text-[11px] text-neutral-400 leading-normal pl-2 space-y-1 mt-1">
                    <div>• <strong className="text-neutral-200">성향 키워드:</strong> <code className="text-[#3ff1b2]">대상</code>, <code className="text-[#3ff1b2]">의미</code>, <code className="text-[#3ff1b2]">감각</code>, <code className="text-[#3ff1b2]">직관</code>, <code className="text-[#3ff1b2]">질감</code>, <code className="text-[#3ff1b2]">선명</code>, <code className="text-[#3ff1b2]">색감</code>, <code className="text-[#3ff1b2]">방법론</code>, <code className="text-[#3ff1b2]">취향</code>, <code className="text-[#3ff1b2]">형태</code></div>
                    <div>• <strong className="text-neutral-200">예시:</strong> <code className="text-neutral-300">1, 의미, 감각, 선명</code> (1번 이미지의 주성향1은 의미, 주성향2는 감각, 주성향3은 선명)</div>
                  </div>
                </div>

                {/* Upload Action controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-neutral-300 font-semibold mb-2">파일로 가져오기 (.csv)</label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleImageMapFileChange}
                      className="w-full text-xs text-neutral-400 bg-neutral-950/60 border border-white/5 rounded-xl p-3 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-neutral-800 file:text-white hover:file:bg-neutral-700 cursor-pointer"
                    />
                  </div>
                  <div>
                    <span className="block text-neutral-300 font-semibold mb-2">데이터 행 수 확인</span>
                    <div className="w-full bg-neutral-950/60 border border-white/5 rounded-xl p-3 text-neutral-400 font-mono flex items-center justify-between">
                      <span>인식된 라인 수:</span>
                      <strong className="text-white text-sm">
                        {imageMapText.split("\n").filter(Boolean).length > 0
                          ? `${Math.max(0, imageMapText.split("\n").filter(Boolean).length - 1)} 행`
                          : "0 행"
                        }
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Direct Text input */}
                <div>
                  <label className="block text-neutral-300 font-semibold mb-2">
                    직접 붙여넣기 (또는 파일 로드된 내용 편집)
                  </label>
                  <textarea
                    value={imageMapText}
                    onChange={(e) => setImageMapText(e.target.value)}
                    placeholder="이미지번호,주성향1,주성향2,주성향3&#10;1,의미,감각,선명&#10;2,감각,질감,형태&#10;3,선명,취향,방법론"
                    className="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-3 outline-none focus:border-indigo-500/50 transition-colors font-mono text-[11px] text-neutral-200"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-white/5 pt-4 mt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowImageMapModal(false);
                    setImageMapText("");
                  }}
                  className="px-4 py-2 bg-neutral-900 border border-white/5 hover:bg-neutral-800 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => handleImageMapImport(imageMapText)}
                  disabled={imageMapLoading || !imageMapText.trim()}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload size={14} />
                  성향 설정 적용하기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
