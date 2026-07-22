import choiJiwonAnalyzed from "./choijiwon_analyzed.json";
import leeYoonSeopAnalyzed from "./leeyoonseop_analyzed.json";
import gwangeoAnalyzed from "./gwangeo_analyzed.json";
import parkgahunAnalyzed from "./parkgahun_analyzed.json";
import jeonjinhyeokAnalyzed from "./jeonjinhyeok_analyzed.json";
import jeongpyeonganAnalyzed from "./jeongpyeongan_analyzed.json";
import rawGwangeoSheet from "./rawGwangeo.json";
import {
  rawChoiJiwonSheet,
  rawLeeYoonSeopSheet,
  rawGahunSheet,
  rawJikhyeokSheet,
  rawPyeonganSheet,
  findPredefinedUser
} from "./userMapping";

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
  const folder = predefinedUser?.folderName;

  if (folder === "gwangeoreulchajaseo") {
    return (gwangeoAnalyzed as any)[String(imgNum)] || { subject: "미학적 피사체", feature: "조화로운 비주얼 요소", focus: "세밀한 형태적 조화" };
  } else if (folder === "leeyoonseop") {
    return (leeYoonSeopAnalyzed as any)[String(imgNum)] || { subject: "미학적 피사체", feature: "조화로운 비주얼 요소", focus: "세밀한 형태적 조화" };
  } else if (folder === "parkgahun") {
    return (parkgahunAnalyzed as any)[String(imgNum)] || { subject: "미학적 피사체", feature: "조화로운 비주얼 요소", focus: "세밀한 형태적 조화" };
  } else if (folder === "jeonjinhyeok") {
    return (jeonjinhyeokAnalyzed as any)[String(imgNum)] || { subject: "미학적 피사체", feature: "조화로운 비주얼 요소", focus: "세밀한 형태적 조화" };
  } else if (folder === "jeongpyeongan") {
    return (jeongpyeonganAnalyzed as any)[String(imgNum)] || { subject: "미학적 피사체", feature: "조화로운 비주얼 요소", focus: "세밀한 형태적 조화" };
  } else {
    return (choiJiwonAnalyzed as any)[String(imgNum)] || imgData[imgNum] || { subject: "미학적 피사체", feature: "조화로운 비주얼 요소", focus: "세밀한 형태적 조화" };
  }
}

export function getDiverseFocusText(imgNum: number, userName: string, main: string, sub1: string, sub2: string): string {
  const normMain = normalizeTrait(main);
  const normSub1 = normalizeTrait(sub1);
  const normSub2 = normalizeTrait(sub2 || "");
  const code = (imgNum + normMain.charCodeAt(0)) % 6;

  const patterns = [
    `메인 결과로 꼽힌 '${normMain}'의 본질적인 형태가 뚜렷이 도드라지는 동시에, 보완 성향인 '${normSub1}'와 '${normSub2}'의 기하학적 배치가 완벽한 레이아웃적 정합성을 수립하고 있습니다.`,
    `핵심 테마인 '${normMain}'의 구조적 선명성을 중심으로, 보조 지표인 '${normSub1}'적 디테일과 '${normSub2}'의 세밀한 결이 하나의 우아한 시각적 앙상블을 이룹니다.`,
    `가장 정점에 위치한 '${normMain}'적 시선 위로, '${normSub1}'의 세밀한 물성과 '${normSub2}'의 명료한 균형이 더해져 단조로운 일상 속 사물을 매혹적인 예술 오브제로 승화시킵니다.`,
    `직관적으로 포착된 '${normMain}'의 본질이 깊고 그윽하게 흐르고, 이를 정교하게 받쳐주는 '${normSub1}'적 정렬과 '${normSub2}'의 세련된 조형미가 탁월한 기품을 완성합니다.`,
    `공간을 지배하는 '${normMain}'적 에너지가 뚜렷한 존재감을 드러내고, '${normSub1}'과 '${normSub2}'의 유기적 상호작용이 화면 전반에 잔잔한 명상적 리듬과 구조의 쾌감을 불어넣습니다.`,
    `'${normMain}'적 요소의 엄격한 질서감이 시선을 붙잡는 가운데, 보완 축인 '${normSub1}'의 깊이감과 '${normSub2}'의 정돈된 비례가 정갈하고 세련된 미적 정체성을 공고히 구축합니다.`
  ];

  return patterns[code];
}

export function getDiverseRelationText(imgNum: number, trait: string, userName: string, roleType: 'main' | 'sub1' | 'sub2' | 'other'): string {
  const normTrait = normalizeTrait(trait);
  const code = (imgNum + normTrait.charCodeAt(0)) % 6;

  if (roleType === 'main') {
    const patterns = [
      `이 프레임은 ${userName}님이 가장 본능적으로 감지하고 지향하는 '${normTrait}'의 미학적 정수를 선명하게 비추어 줍니다.`,
      `가장 본질적인 관점으로서의 '${normTrait}'적 가치가 화면의 중심에서 입체감 있게 살아나며, ${userName}님만의 독보적인 안목을 대변하고 있습니다.`,
      `대상을 투영하는 과정에서 '${normTrait}' 성향이 주도적인 시각 언어로 작동하여, ${userName}님의 지각적 중심축을 견고하게 지탱합니다.`,
      `이는 일상의 시공간 속에서 '${normTrait}'적 가치를 예민하게 판독해내는 ${userName}님의 고유하고 주도적인 탐색 방식에 닿아 있습니다.`,
      `화면 전체를 관통하는 '${normTrait}'의 확고한 질서는 ${userName}님이 세상을 설계하고 구축하는 인지적 완결성을 증명해 줍니다.`,
      `풍부한 조형적 흐름 속에서 '${normTrait}'적 특징이 시각적 주인공으로 우뚝 서며, ${userName}님의 예술적 서사를 묵묵히 전개해나갑니다.`
    ];
    return patterns[code];
  } else if (roleType === 'sub1') {
    const patterns = [
      `부차적이면서도 조화로운 '${normTrait}'의 보조적 흐름이 전체적인 미학 구도를 한층 성숙하고 균형감 있게 보완해 줍니다.`,
      `메인 요소를 긴밀히 보좌하는 '${normTrait}'의 결합은, 사물에 내재된 숨은 맥락을 입체적으로 풀어내는 보완적 장치가 됩니다.`,
      `배경 속에 투영된 '${normTrait}'의 미세한 파편들이 은은한 잔상처럼 번지며 깊이 있는 시각적 여백을 선사합니다.`,
      `1차 보완 성향으로서의 '${normTrait}'적 디테일이 적재적소에 정렬되어, 프레임이 가질 수 있는 단조로움을 우아하게 극복해 줍니다.`,
      `'${normTrait}'적 감각이 은근한 존재감으로 개입함으로써, 관찰하는 이의 시선에 편안하고도 정밀한 사유의 틈을 열어줍니다.`,
      `주요 개념을 섬세하게 에워싸는 '${normTrait}'의 조율 방식은, 조형물의 구조적 견고함을 배후에서 완성하는 단초가 됩니다.`
    ];
    return patterns[code];
  } else if (roleType === 'sub2') {
    const patterns = [
      `'${normTrait}'의 정교한 결합을 통해 시선이 머무는 세부적인 지점마다 밀도 높은 완성도와 짜임새를 배가시킵니다.`,
      `마지막 퍼즐처럼 안착된 '${normTrait}'의 광학적 변주가 조용한 균형을 완성하며 한결 깊어진 감각적 울림을 자아냅니다.`,
      `'${normTrait}'적 디테일이 화면 구석구석 유기적으로 스며들어, 시각적 단단함과 미시적 조화로움을 고조해 줍니다.`,
      `이 섬세한 정렬 속에서 '${normTrait}'의 잔잔한 파동이 교차하며, 일상적 소재를 특별한 예술적 아카이브로 정화합니다.`,
      `'${normTrait}'의 정밀한 레이어가 레이아웃의 끝자락을 포근히 감싸 안으며 정갈하고 신뢰감 있는 구조를 보여줍니다.`,
      `'${normTrait}'적 요소의 밀도 있는 조율은, 사소한 픽셀과 여백 속에서도 완결성을 관철시키는 예리한 감각의 반증입니다.`
    ];
    return patterns[code];
  } else {
    const patterns = [
      `잠재된 '${normTrait}' 성향과의 시각적인 연결고리를 섬세하게 드러내며 조화로운 조형미를 이끌어냅니다.`,
      `비록 숨겨진 이면의 영역이지만, '${normTrait}'적 가치가 잔잔하게 스며들어 화면의 다채로움을 풍성하게 지탱해 줍니다.`,
      `'${normTrait}'의 기하학적 요소가 변두리에서 조용한 밸런서를 자처하며 전체 프레임에 입체적인 기품을 선물합니다.`,
      `내밀한 감각적 변조로서의 '${normTrait}' 성향이 은밀히 기능하여, 다각적인 사유의 재미를 부여하는 훌륭한 촉매가 됩니다.`,
      `직접적으로 드러나지 않는 '${normTrait}'적 호흡이 화면 배후의 잔잔한 긴장감을 유지하며 관찰을 흥미롭게 돕습니다.`,
      `'${normTrait}'적 결이 보이지 않는 축으로 작동하여, 이미지 전체가 자아내는 객관적 서사를 차분하게 지지해 줍니다.`
    ];
    return patterns[code];
  }
}

export function getImageSpecificExplanation(
  idOrNum: string | number,
  trait: string,
  userName: string,
  fullId?: string,
  url?: string
): { title: string; desc: string; detail: string; hashtags?: string[] } {
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
  const folder = predefinedUser?.folderName;

  let rawSheet = rawChoiJiwonSheet;
  let analyzedData: Record<string, any> = choiJiwonAnalyzed;

  if (folder === "gwangeoreulchajaseo") {
    rawSheet = rawGwangeoSheet;
    analyzedData = gwangeoAnalyzed;
  } else if (folder === "leeyoonseop") {
    rawSheet = rawLeeYoonSeopSheet;
    analyzedData = leeYoonSeopAnalyzed;
  } else if (folder === "parkgahun") {
    rawSheet = rawGahunSheet;
    analyzedData = parkgahunAnalyzed;
  } else if (folder === "jeonjinhyeok") {
    rawSheet = rawJikhyeokSheet;
    analyzedData = jeonjinhyeokAnalyzed;
  } else if (folder === "jeongpyeongan") {
    rawSheet = rawPyeonganSheet;
    analyzedData = jeongpyeonganAnalyzed;
  }

  let current = (analyzedData as any)[String(imgNum)] || imgData[imgNum] || { subject: "미학적 피사체", feature: "조화로운 비주얼 요소", focus: "세밀한 형태적 조화" };

  const sheetRow = rawSheet.find((r: any) => r.num === imgNum);

  let relationText = "";
  let roleTitle = "";
  let roleType: 'main' | 'sub1' | 'sub2' | 'other' = 'other';

  if (sheetRow) {
    const mainTrait = normalizeTrait(sheetRow.main);
    const sub1Trait = normalizeTrait(sheetRow.sub1);
    const sub2Trait = normalizeTrait(sheetRow.sub2);

    if (mainTrait === normTrait) {
      roleTitle = "주요 성향 지표";
      roleType = 'main';
    } else if (sub1Trait === normTrait) {
      roleTitle = "보조 성향 지표 (1차)";
      roleType = 'sub1';
    } else if (sub2Trait === normTrait) {
      roleTitle = "보조 성향 지표 (2차)";
      roleType = 'sub2';
    } else {
      roleTitle = "보완 지표";
      roleType = 'other';
    }
  } else {
    roleTitle = `${normTrait}적 지표`;
    roleType = 'other';
  }

  relationText = getDiverseRelationText(imgNum, trait, userName, roleType);

  const subjectText = current.subject;
  const featureText = current.feature.trim();
  
  let cleanFocus = current.focus.trim();
  const hasCustomFocus = ["gwangeoreulchajaseo", "leeyoonseop", "parkgahun", "jeonjinhyeok", "jeongpyeongan"].includes(folder || "");
  if (!hasCustomFocus && sheetRow) {
    cleanFocus = getDiverseFocusText(imgNum, userName, sheetRow.main, sheetRow.sub1, sheetRow.sub2);
  }

  const cleanFeature = featureText.endsWith(".") ? featureText : featureText + ".";
  if (!cleanFocus.endsWith(".")) {
    cleanFocus += ".";
  }

  const starterPatterns = [
    `'${subjectText}'을 정밀하게 포착해낸 시각적 구성입니다.`,
    `'${subjectText}'의 미학적 앵글을 차분히 담아낸 프레임입니다.`,
    `일상의 단상 속에서 발견한 '${subjectText}'의 독창적인 시선입니다.`,
    `'${subjectText}'을 묘사한 세련되고 깊이 있는 이미지입니다.`,
    `'${subjectText}'의 조형적 가치와 디테일이 돋보이는 비주얼입니다.`
  ];
  const starter = starterPatterns[imgNum % 5];

  const customTitle = `${subjectText} [${roleTitle}]`;
  const customDesc = `${starter} ${cleanFeature} 특히 ${cleanFocus} ${relationText}`;
  const customDetail = `이 이미지는 ${userName}님의 ${normTrait} 성향을 분석하기 위한 지표입니다.`;

  return {
    title: customTitle,
    desc: customDesc,
    detail: customDetail,
    hashtags: getImageHashtags(imgNum, folder)
  };
}

export function getImageHashtags(imgNum: number, folder?: string): string[] {
  if (folder === "gwangeoreulchajaseo") {
    const row = rawGwangeoSheet.find((r: any) => r.num === imgNum);
    if (row && row.tags) {
      return row.tags.map((t: string) => t.startsWith("#") ? t : `#${t}`);
    }
  }

  let analyzedData = null;
  if (folder === "leeyoonseop") analyzedData = leeYoonSeopAnalyzed;
  else if (folder === "parkgahun") analyzedData = parkgahunAnalyzed;
  else if (folder === "jeonjinhyeok") analyzedData = jeonjinhyeokAnalyzed;
  else if (folder === "jeongpyeongan") analyzedData = jeongpyeonganAnalyzed;
  else analyzedData = choiJiwonAnalyzed;

  if (analyzedData) {
    const current = (analyzedData as any)[String(imgNum)];
    if (current && current.hashtags) {
      return current.hashtags.map((t: string) => t.startsWith("#") ? t : `#${t}`);
    }
  }

  return [];
}

