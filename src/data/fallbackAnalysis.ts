import choiJiwonAnalyzed from "./choijiwon_analyzed.json";
import leeYoonSeopAnalyzed from "./leeyoonseop_analyzed.json";
import gwangeoAnalyzed from "./gwangeo_analyzed.json";
import rawGwangeoSheet from "./rawGwangeo.json";
import { rawChoiJiwonSheet, rawLeeYoonSeopSheet, findPredefinedUser } from "./userMapping";

function getPostposition(word: string, type: "이_가" | "은_는" | "을_를"): string {
  if (!word) return "";
  const cleanWord = word.replace(/['"“”]+/g, "").trim();
  if (cleanWord.length === 0) return "";
  const lastChar = cleanWord.charCodeAt(cleanWord.length - 1);
  if (lastChar >= 0xAC00 && lastChar <= 0xD7A3) {
    const hasBatchim = (lastChar - 0xAC00) % 28 !== 0;
    if (type === "이_가") {
      return hasBatchim ? "이" : "가";
    }
    if (type === "은_는") {
      return hasBatchim ? "은" : "는";
    }
    if (type === "을_를") {
      return hasBatchim ? "을" : "를";
    }
  }
  return type === "이_가" ? "가" : type === "은_는" ? "는" : "를";
}

// 1 to 50 Fallback Image metadata for visual profiles
export const imgData: Record<number, { subject: string; feature: string; focus: string }> = {};

// Initialize imgData using choiJiwonAnalyzed as the source of truth to guarantee absolute alignment!
Object.keys(choiJiwonAnalyzed).forEach((key) => {
  const num = parseInt(key, 10);
  if (!isNaN(num)) {
    const rawVal = (choiJiwonAnalyzed as any)[key];
    imgData[num] = {
      subject: rawVal.subject,
      feature: rawVal.feature,
      focus: rawVal.focus
    };
  }
});

export function normalizeTrait(trait: string): string {
  if (!trait) return "감각";
  const t = trait.trim();
  if (t.includes("대상")) return "대상";
  if (t.includes("의미")) return "의미";
  if (t.includes("감각")) return "감각";
  if (t.includes("직관")) return "직관";
  if (t.includes("질감")) return "질감";
  if (t.includes("선명")) return "선명";
  if (t.includes("색감")) return "색감";
  if (t.includes("방법론")) return "방법론";
  if (t.includes("취향")) return "취향";
  if (t.includes("형태")) return "형태";
  return t;
}

export function isCustomImage(id: string, url?: string): boolean {
  if (!id) return false;
  if (id.startsWith("custom_")) return true;
  if (url && (url.startsWith("data:") || url.startsWith("blob:") || url.includes("firebasestorage.googleapis.com"))) return true;
  return false;
}

export function getImgNumFromId(id: string, fallbackIdx?: number, url?: string): number {
  if (url) {
    const urlMatch = url.match(/(?:^|\/)(\d+)\.(?:png|jpg|jpeg|gif|webp)/i);
    if (urlMatch) {
      const parsed = parseInt(urlMatch[1], 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 50) {
        return parsed;
      }
    }
  }
  if (!id) return typeof fallbackIdx === "number" ? fallbackIdx : 1;
  const num = parseInt(id.replace(/[^0-9]/g, ""), 10);
  return isNaN(num) ? (typeof fallbackIdx === "number" ? fallbackIdx : 1) : num;
}

export function getPredefinedImageInfo(imgNum: number, userName: string): { subject: string; feature: string; focus: string } {
  const predefinedUser = findPredefinedUser(userName);
  const isLeeYoonSeop = predefinedUser && predefinedUser.folderName === "leeyoonseop";
  const isGwangeo = predefinedUser && predefinedUser.folderName === "gwangeoreulchajaseo";

  if (isGwangeo) {
    return (gwangeoAnalyzed as any)[String(imgNum)] || { subject: "미학적 피사체", feature: "조화로운 비주얼 요소", focus: "세밀한 형태적 조화" };
  } else {
    const analyzedData = isLeeYoonSeop ? leeYoonSeopAnalyzed : choiJiwonAnalyzed;
    return (analyzedData as any)[String(imgNum)] || imgData[imgNum] || { subject: "미학적 피사체", feature: "조화로운 비주얼 요소", focus: "세밀한 형태적 조화" };
  }
}

export function getImageSpecificExplanation(
  idOrNum: string | number,
  trait: string,
  userName: string,
  fullId?: string,
  url?: string
): { title: string; desc: string; detail: string } {
  const normTrait = normalizeTrait(trait);
  const imgNum = typeof idOrNum === "number" ? idOrNum : getImgNumFromId(idOrNum, undefined, url);

  if (isCustomImage(fullId || String(idOrNum), url)) {
    const customTraitsDescriptions: Record<string, { title: string; part1: string; part2: string; result: string }> = {
      "대상": {
        title: `물리적 피사체 정위와 '${normTrait}' 중심 구성 분석`,
        part1: `화면 중심부에 정밀 배치된 피사체의 기하학적 형태`,
        part2: `중심 시선을 유도하는 정형화된 구도 축`,
        result: `${userName}님이 시각적 노이즈를 배제하고 명확한 대상의 기하학적 위치를 포착하여 분석하려는 객관적 지각 방식을 뜻합니다.`
      },
      "의미": {
        title: `구조적 관계 정렬과 '${normTrait}' 구도 해석`,
        part1: `각 시각 요소들의 엄격한 기하학적 좌표 정렬`,
        part2: `객관적인 면 분할 및 구조적인 요소 배열`,
        result: `${userName}님이 이미지 내 요소들의 물리적 배치 특성과 구조적 인과 관계를 논리적으로 정량 분석하는 형태 수립 성향을 보여줍니다.`
      },
      "감각": {
        title: `안정적 광학 데이터와 '${normTrait}' 톤 정합`,
        part1: `균일하게 분배된 광원과 안정적인 명암비 데이터`,
        part2: `시각적 피로도를 최소화하는 균형적 레이아웃 배율`,
        result: `물리적 왜곡 없이 형태를 있는 그대로 편안하게 수용하며 광학 요소를 객관적으로 실측해내는 ${userName}님의 안정적인 분석 체계입니다.`
      },
      "직관": {
        title: `외곽 경계선 대비와 '${normTrait}' 윤곽 분석`,
        part1: `경계면의 명도가 뚜렷하여 구조적 실루엣이 부각된 화면`,
        part2: `복잡한 세부 묘사를 배제한 선 형태 중심의 도식적 표현`,
        result: `지엽적인 세부 디테일 이전에 화면 전체의 골격 구조와 윤곽 정보를 고속 판독하는 ${userName}님의 구조 중심 지각 방식입니다.`
      },
      "질감": {
        title: `표면 텍스처 패턴과 '${normTrait}' 밀도 분석`,
        part1: `가시적 입자의 표면 밀도와 정밀한 기하학적 반복성`,
        part2: `표면 물성 정보가 뚜렷하게 부각된 광학적 명암 대비`,
        result: `평면 묘사에 머무르지 않고 물체의 표면 입자 구조와 밀도 변화를 일관되게 분석해내는 ${userName}님의 정밀 분석 성향입니다.`
      },
      "선명": {
        title: `정위 규칙 정렬과 '${normTrait}' 기하학적 분석`,
        part1: `정밀하게 정합된 수직 및 수평의 공간 축`,
        part2: `시각적 복잡도를 완전히 배제한 고도의 미니멀리즘 프레임`,
        result: `불필요한 가시적 자극을 완전히 제거하고 수치적으로 정제된 기하학적 비례에 입각하여 대상을 실측하려는 ${userName}님의 설계적 관점입니다.`
      },
      "색감": {
        title: `색채 분포 데이터 및 파장별 '${normTrait}' 정렬`,
        part1: `기능적으로 조율된 채도 및 명도 데이터`,
        part2: `서로 다른 색역 간의 정량적 균형 분배`,
        result: `색조의 미세한 스펙트럼과 물리적 밝기 대비를 조화롭게 구성하여 공간의 색채 밸런스를 측정하는 ${userName}님의 광학적 분석 방식입니다.`
      },
      "방법론": {
        title: `구도 설계 기법과 '${normTrait}' 메커니즘 정합`,
        part1: `의도적으로 계산된 렌즈 초점 거리와 시선 이동 경로`,
        part2: `초점의 정밀 제어 및 대칭적 앵글 연출 기법`,
        result: `우연에 기인하지 않고 사전에 정밀하게 설계된 기하학적 비율과 비례 메커니즘을 통해 정합성을 관철시키는 ${userName}님의 정교한 안목입니다.`
      },
      "취향": {
        title: `독자적 설계 기준과 '${normTrait}' 특이성 분석`,
        part1: `전형적인 기성 구도 방식을 배제한 요소 배치`,
        part2: `스스로 수립한 조형 규칙에 입각한 차별화된 앵글 구성`,
        result: `대중적인 유형 공식에 얽매이지 않고 고유한 물성 정렬과 비정형 레이아웃을 논리적으로 관철시키는 ${userName}님의 독립적 분석 주관입니다.`
      },
      "형태": {
        title: `조형적 비율 분석과 '${normTrait}' 기하 구조 정합`,
        part1: `좌우 수평 및 대칭 구조에 기반한 안정적인 비례 배치`,
        part2: `화면의 기하학적 중심점을 견고하게 지지하는 프레임 구성`,
        result: `시각 대상의 역학적인 중심과 구조적 완전성에 최우선 순위를 부여하여 고도의 균형적이고 물리적인 안정 상태를 실현하는 ${userName}님의 공간 설계 능력입니다.`
      }
    };

    const tailored = customTraitsDescriptions[normTrait] || {
      title: `${normTrait} 분석적 지표`,
      part1: "정갈한 형태적 조형 비례",
      part2: "일관된 구도 설계",
      result: `스스로 수립한 기준에 입각해 데이터를 파악하려는 ${userName}님의 객관적인 안목 지표입니다.`
    };

    const customTitle = tailored.title;
    const customDesc = `업로드 이미지의 ${tailored.part1}가 긴밀히 유기 결합되어 있으며, 전체 프레임에서 ${tailored.part2}가 구현되어 있습니다. 이는 ${userName}님의 ${tailored.result}`;
    const customDetail = `이 이미지는 ${userName}님의 ${normTrait} 성향 분석 지표입니다.`;

    return {
      title: customTitle,
      desc: customDesc,
      detail: customDetail
    };
  }

  // Predefined image configuration handling using matching user's sheet mapping!
  const predefinedUser = findPredefinedUser(userName);
  const isLeeYoonSeop = predefinedUser && predefinedUser.folderName === "leeyoonseop";
  const isGwangeo = predefinedUser && predefinedUser.folderName === "gwangeoreulchajaseo";

  const rawSheet = isGwangeo 
    ? rawGwangeoSheet 
    : (isLeeYoonSeop ? rawLeeYoonSeopSheet : rawChoiJiwonSheet);

  let current: any;
  if (isGwangeo) {
    current = (gwangeoAnalyzed as any)[String(imgNum)] || { subject: "미학적 피사체", feature: "조화로운 비주얼 요소", focus: "세밀한 형태적 조화" };
  } else {
    const analyzedData = isLeeYoonSeop ? leeYoonSeopAnalyzed : choiJiwonAnalyzed;
    current = (analyzedData as any)[String(imgNum)] || imgData[imgNum] || { subject: "미학적 피사체", feature: "조화로운 비주얼 요소", focus: "세밀한 형태적 조화" };
  }

  const sheetRow = rawSheet.find((r: any) => r.num === imgNum);

  let relationText = "";
  let roleTitle = "";

  if (sheetRow) {
    const mainTrait = normalizeTrait(sheetRow.main);
    const sub1Trait = normalizeTrait(sheetRow.sub1);
    const sub2Trait = normalizeTrait(sheetRow.sub2);

    if (mainTrait === normTrait) {
      roleTitle = "주요 성향 지표";
      relationText = `이는 ${userName}님의 주요 성향인 '${normTrait}' 특징을 뚜렷하게 보여줍니다.`;
    } else if (sub1Trait === normTrait) {
      roleTitle = "보조 성향 지표 (1차)";
      relationText = `'${normTrait}' 요소를 통해 전반적인 조화로움을 보완합니다.`;
    } else if (sub2Trait === normTrait) {
      roleTitle = "보조 성향 지표 (2차)";
      relationText = `'${normTrait}' 요소를 세밀하게 결합하여 완성도를 더해줍니다.`;
    } else {
      roleTitle = "보완 지표";
      relationText = `잠재된 '${normTrait}' 성향과의 시각적인 연결고리를 보여줍니다.`;
    }
  } else {
    roleTitle = `${normTrait}적 지표`;
    relationText = `'${normTrait}'적 특징이 시각적으로 조화롭게 반영되어 있습니다.`;
  }

  const subjectText = current.subject;
  const featureText = current.feature.trim();
  const focusText = current.focus.trim();

  const cleanFeature = featureText.endsWith(".") ? featureText : featureText + ".";
  const cleanFocus = focusText.endsWith(".") ? focusText : focusText + ".";

  const customTitle = `${subjectText} [${roleTitle}]`;
  const customDesc = `'${subjectText}'을 묘사한 이미지입니다. ${cleanFeature} 특히 ${cleanFocus} ${relationText}`;
  const customDetail = `이 이미지는 ${userName}님의 ${normTrait} 성향을 분석하기 위한 지표입니다.`;

  return {
    title: customTitle,
    desc: customDesc,
    detail: customDetail
  };
}
