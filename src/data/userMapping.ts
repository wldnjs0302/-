import { ImageItem } from "../types";
import globalImageMap from "./globalImageMap.json";
import rawGwangeoSheet from "./rawGwangeo.json";

export { rawGwangeoSheet };

// 50장 이미지 각각의 성향 및 그래프 결과값을 편리하게 가져오는 헬퍼 함수
export function getGlobalImageConfig(num: number): { trait: string; weights?: Record<string, number> } {
  const key = String(num);
  const cfg = (globalImageMap as any)[key];
  if (cfg) {
    if (typeof cfg === "string") {
      return { trait: cfg };
    }
    return {
      trait: cfg.trait || "형태",
      weights: cfg.weights
    };
  }
  
  const traits = ["대상", "의미", "감각", "직관", "질감", "선명", "색감", "방법론", "취향", "형태"];
  return { trait: traits[(num - 1) % traits.length] };
}

// [여러 사용자의 50장 이미지를 쉽게 설정하는 방법]
// 1. 좌측 파일 탐색기에서 `/public` 폴더 안에 사용자 이름으로 된 폴더를 만듭니다. (예: `/public/홍길동`)
// 2. 그 폴더 안에 각 사진을 업로드합니다.
// 3. 아래 `createUserImages` 함수를 사용하면 50장의 사진을 편하게 등록할 수 있습니다.

// 사용자별 이미지 50장을 자동으로 생성해주는 편의 함수
export function createUserImages(
  folderName: string, 
  imagesInfo: { fileName: string; trait: string }[]
): ImageItem[] {
  return imagesInfo.map((info, index) => ({
    id: `${folderName}-img-${index + 1}`,
    url: `/${folderName}/${info.fileName}`, // 예: public/홍길동/1.png 폴더에 넣었을 경우
    properties: {
      color: "#000000",
      intuition: 50,
      aesthetics: 50,
      rationality: 50,
    },
    description: `${folderName}의 데이터 모음입니다.`,
    tags: [folderName, info.trait],
    trait: info.trait, // "대상", "의미", "감각", "직관", "질감", "선명", "색감", "방법론", "취향", "형태"
  }));
}

export function createUserImagesAuto(
  folderName: string, 
  count: number = 50,
  customProperties?: Record<number, Partial<ImageItem['properties']>>, // 이미지 번호(1~50)에 따른 개별 속성값 설정
  customCategoryWeights?: Record<number, Record<string, number>>, // 이미지 번호(1~50)별 그래프 결과값 설정 ("대상": 100 등)
  customTraits?: Record<number, string> // 이미지 번호(1~50)별 커스텀 주요 성향 설정 ("대상" 등)
): ImageItem[] {
  const traits = ["대상", "의미", "감각", "직관", "질감", "선명", "색감", "방법론", "취향", "형태"];
  return Array.from({ length: count }).map((_, i) => {
    const imageNumber = i + 1;
    // 기본 무작위 값 (customProperties에 정의된 값이 있다면 덮어씁니다)
    const baseProperties = {
      color: "#000000",
      intuition: Math.floor(Math.random() * 50 + 25),
      aesthetics: Math.floor(Math.random() * 50 + 25),
      rationality: Math.floor(Math.random() * 50 + 25),
    };
    
    // 만약 해당 이미지 번호에 설정된 커스텀 속성이 있다면 덮어씌움
    const finalProperties = customProperties && customProperties[imageNumber] 
      ? { ...baseProperties, ...customProperties[imageNumber] }
      : baseProperties;

    // globalImageMap.json에 정의된 기본 성향 및 가중치 가져오기
    const globalCfg = getGlobalImageConfig(imageNumber);
    let activeTrait = globalCfg.trait;
    if (customTraits && customTraits[imageNumber]) {
      activeTrait = customTraits[imageNumber];
    }

    // 기본 가중치 생성 (주요 성향은 85~99점, 부수 성향들은 10~30점 수준의 자연스러운 점수 분포)
    const baseCategoryWeights: Record<string, number> = {};
    traits.forEach(t => {
      baseCategoryWeights[t] = t === activeTrait 
        ? (85 + (imageNumber * 7) % 15) // 85~99점
        : (10 + (imageNumber * t.charCodeAt(0)) % 21); // 10~30점
    });

    // 만약 globalCfg.weights가 명시적으로 정해져 있다면 덮어씌웁니다.
    if (globalCfg.weights) {
      traits.forEach(t => {
        if (globalCfg.weights![t] !== undefined) {
          baseCategoryWeights[t] = globalCfg.weights![t];
        }
      });
    }

    // 최종적으로 customCategoryWeights로 명시적 덮어쓰기 허용
    const finalCategoryWeights = customCategoryWeights && customCategoryWeights[imageNumber]
      ? { ...baseCategoryWeights, ...customCategoryWeights[imageNumber] }
      : baseCategoryWeights;

    const folderNFC = folderName.normalize('NFC').trim();
    const folderNFD = folderName.normalize('NFD').trim();
    
    // Self-contained dictionary to prevent any TDZ (Temporal Dead Zone) ordering issues
    const folderMap: Record<string, string> = {
      "이윤섭": "leeyoonseop",
      "광어를 찾아서": "gwangeoreulchajaseo",
      "김도현": "kimdohyun",
      "최지원": "choijiwon",
      "하온": "haon",
      "지우": "jiwoo",
      "서연": "seoyeon",
      "도윤": "doyun",
      "수안": "suan",
      "하임": "haim",
      "정인": "jungin",
      "박가현": "parkgahun",
      "전진혁": "jeonjinhyeok",
      "전직혁": "jeonjinhyeok",
      "정평안": "jeongpyeongan"
    };

    let mappedFolder = encodeURIComponent(folderNFC);
    for (const [kor, eng] of Object.entries(folderMap)) {
      if (
        folderNFC === kor || 
        folderNFD === kor.normalize('NFD') || 
        folderNFC.toLowerCase() === eng ||
        folderNFC.toLowerCase() === kor.toLowerCase()
      ) {
        mappedFolder = eng;
        break;
      }
    }
    return {
      id: `${folderName}-img-${imageNumber}`,
      url: `/${mappedFolder}/${imageNumber}.png`,
      properties: finalProperties,
      categoryWeights: finalCategoryWeights,
      description: `${folderName}의 시각적 파편입니다.`,
      tags: [folderName, activeTrait],
      trait: activeTrait,
    };
  });
}

export const rawChoiJiwonSheet = [
  { num: 1, main: "대상", sub1: "의미", sub2: "방법론" },
  { num: 2, main: "취향", sub1: "의미", sub2: "방법론" },
  { num: 3, main: "대상", sub1: "질감", sub2: "선명" },
  { num: 4, main: "감각", sub1: "의미", sub2: "방법론" },
  { num: 5, main: "선명", sub1: "색감", sub2: "의미" },
  { num: 6, main: "형태", sub1: "선명", sub2: "대상" },
  { num: 7, main: "질감", sub1: "선명", sub2: "대상" },
  { num: 8, main: "방법론", sub1: "선명", sub2: "감각" },
  { num: 9, main: "질감", sub1: "색감", sub2: "형태" },
  { num: 10, main: "색감", sub1: "질감", sub2: "의미" },
  { num: 11, main: "대상", sub1: "의미", sub2: "색감" },
  { num: 12, main: "형태", sub1: "형태", sub2: "취향" },
  { num: 13, main: "취향", sub1: "형태", sub2: "감각" },
  { num: 14, main: "직관", sub1: "색감", sub2: "취향" },
  { num: 15, main: "질감", sub1: "색감", sub2: "직관" },
  { num: 16, main: "질감", sub1: "선명", sub2: "대상" },
  { num: 17, main: "방법론", sub1: "질감", sub2: "형태" },
  { num: 18, main: "감각", sub1: "형태", sub2: "의미" },
  { num: 19, main: "의미", sub1: "취향", sub2: "형태" },
  { num: 20, main: "의미", sub1: "대상", sub2: "취향" },
  { num: 21, main: "취향", sub1: "색감", sub2: "대상" },
  { num: 22, main: "직관", sub1: "색감", sub2: "대상" },
  { num: 23, main: "질감", sub1: "색감", sub2: "대상" },
  { num: 24, main: "질감", sub1: "대상", sub2: "형태" },
  { num: 25, main: "의미", sub1: "대상", sub2: "방법론" },
  { num: 26, main: "색감", sub1: "대상", sub2: "직관" },
  { num: 27, main: "감각", sub1: "질감", sub2: "의미" },
  { num: 28, main: "감각", sub1: "질감", sub2: "대상" },
  { num: 29, main: "대상", sub1: "의미", sub2: "취향" },
  { num: 30, main: "선명", sub1: "의미", sub2: "방법론" },
  { num: 31, main: "직관", sub1: "선명", sub2: "대상" },
  { num: 32, main: "형태", sub1: "선명", sub2: "감각" },
  { num: 33, main: "형태", sub1: "질감", sub2: "취향" },
  { num: 34, main: "의미", sub1: "직관", sub2: "색감" },
  { num: 35, main: "형태", sub1: "의미", sub2: "직관" },
  { num: 36, main: "의미", sub1: "대상", sub2: "방법론" },
  { num: 37, main: "취향", sub1: "의미", sub2: "감각" },
  { num: 38, main: "대상", sub1: "직관", sub2: "방법론" },
  { num: 39, main: "의미", sub1: "취향", sub2: "대상" },
  { num: 40, main: "직관", sub1: "선명", sub2: "대상" },
  { num: 41, main: "의미", sub1: "대상", sub2: "방법론" },
  { num: 42, main: "의미", sub1: "대상", sub2: "형태" },
  { num: 43, main: "형태", sub1: "취향", sub2: "감각" },
  { num: 44, main: "색감", sub1: "형태", sub2: "대상" },
  { num: 45, main: "의미", sub1: "방법론", sub2: "질감" },
  { num: 46, main: "형태", sub1: "대상", sub2: "의미" },
  { num: 47, main: "직관", sub1: "의미", sub2: "색감" },
  { num: 48, main: "선명", sub1: "대상", sub2: "형태" },
  { num: 49, main: "대상", sub1: "색감", sub2: "형태" },
  { num: 50, main: "색감", sub1: "취향", sub2: "직관" }
];

const choiJiwonCategoryWeights: Record<number, Record<string, number>> = {};
const choiJiwonTraits: Record<number, string> = {};

rawChoiJiwonSheet.forEach(row => {
  choiJiwonTraits[row.num] = row.main;
  
  const weights: Record<string, number> = {};
  const categories = ["대상", "의미", "감각", "직관", "질감", "선명", "색감", "방법론", "취향", "형태"];
  categories.forEach((cat) => {
    // 자연스러운 저점 분포 생성 (10~25점 사이)
    weights[cat] = 10 + (row.num * cat.charCodeAt(0)) % 16;
  });
  
  // 메인 결과, 서브1, 서브2 가중치 덮어쓰기
  weights[row.main] = 95;
  weights[row.sub1] = 75;
  weights[row.sub2] = 55;
  
  choiJiwonCategoryWeights[row.num] = weights;
});

const choiJiwonImages = createUserImagesAuto(
  "최지원", 
  50, 
  undefined, 
  choiJiwonCategoryWeights, 
  choiJiwonTraits
);

export const rawLeeYoonSeopSheet = [
  { num: 1, main: "대상", sub1: "직관", sub2: "형태" },
  { num: 2, main: "의미", sub1: "감각", sub2: "직관" },
  { num: 3, main: "질감", sub1: "감각", sub2: "직관" },
  { num: 4, main: "방법론", sub1: "선명", sub2: "취향" },
  { num: 5, main: "감각", sub1: "질감", sub2: "직관" },
  { num: 6, main: "질감", sub1: "취향", sub2: "선명" },
  { num: 7, main: "질감", sub1: "취향", sub2: "형태" },
  { num: 8, main: "방법론", sub1: "질감", sub2: "선명" },
  { num: 9, main: "방법론", sub1: "선명", sub2: "취향" },
  { num: 10, main: "방법론", sub1: "선명", sub2: "취향" },
  { num: 11, main: "취향", sub1: "형태", sub2: "대상" },
  { num: 12, main: "색감", sub1: "감각", sub2: "대상" },
  { num: 13, main: "질감", sub1: "방법론", sub2: "선명" },
  { num: 14, main: "취향", sub1: "형태", sub2: "의미" },
  { num: 15, main: "대상", sub1: "선명", sub2: "직관" },
  { num: 16, main: "의미", sub1: "색감", sub2: "취향" },
  { num: 17, main: "대상", sub1: "취향", sub2: "의미" },
  { num: 18, main: "대상", sub1: "의미", sub2: "취향" },
  { num: 19, main: "대상", sub1: "취향", sub2: "선명" },
  { num: 20, main: "취향", sub1: "선명", sub2: "대상" },
  { num: 21, main: "의미", sub1: "취향", sub2: "직관" },
  { num: 22, main: "색감", sub1: "취향", sub2: "직관" },
  { num: 23, main: "취향", sub1: "직관", sub2: "의미" },
  { num: 24, main: "취향", sub1: "직관", sub2: "의미" },
  { num: 25, main: "취향", sub1: "대상", sub2: "형태" },
  { num: 26, main: "대상", sub1: "형태", sub2: "의미" },
  { num: 27, main: "대상", sub1: "형태", sub2: "직관" },
  { num: 28, main: "대상", sub1: "형태", sub2: "의미" },
  { num: 29, main: "대상", sub1: "감각", sub2: "선명" },
  { num: 30, main: "대상", sub1: "의미", sub2: "감각" },
  { num: 31, main: "대상", sub1: "형태", sub2: "취향" },
  { num: 32, main: "대상", sub1: "형태", sub2: "취향" },
  { num: 33, main: "대상", sub1: "형태", sub2: "취향" },
  { num: 34, main: "대상", sub1: "형태", sub2: "취향" },
  { num: 35, main: "대상", sub1: "형태", sub2: "취향" },
  { num: 36, main: "직관", sub1: "의미", sub2: "질감" },
  { num: 37, main: "직관", sub1: "선명", sub2: "색감" },
  { num: 38, main: "대상", sub1: "방법론", sub2: "취향" },
  { num: 39, main: "대상", sub1: "형태", sub2: "취향" },
  { num: 40, main: "대상", sub1: "형태", sub2: "취향" },
  { num: 41, main: "대상", sub1: "취향", sub2: "형태" },
  { num: 42, main: "의미", sub1: "대상", sub2: "취향" },
  { num: 43, main: "의미", sub1: "대상", sub2: "취향" },
  { num: 44, main: "의미", sub1: "대상", sub2: "색감" },
  { num: 45, main: "대상", sub1: "형태", sub2: "직관" },
  { num: 46, main: "의미", sub1: "질감", sub2: "방법론" },
  { num: 47, main: "질감", sub1: "감각", sub2: "방법론" },
  { num: 48, main: "직관", sub1: "방법론", sub2: "선명" },
  { num: 49, main: "직관", sub1: "방법론", sub2: "형태" },
  { num: 50, main: "감각", sub1: "취향", sub2: "의미" }
];

const leeYoonSeopCategoryWeights: Record<number, Record<string, number>> = {};
const leeYoonSeopTraits: Record<number, string> = {};

rawLeeYoonSeopSheet.forEach(row => {
  leeYoonSeopTraits[row.num] = row.main;
  
  const weights: Record<string, number> = {};
  const categories = ["대상", "의미", "감각", "직관", "질감", "선명", "색감", "방법론", "취향", "형태"];
  categories.forEach((cat) => {
    weights[cat] = 10 + (row.num * cat.charCodeAt(0)) % 16;
  });
  
  weights[row.main] = 95;
  weights[row.sub1] = 75;
  if (row.sub2) {
    weights[row.sub2] = 55;
  }
  
  leeYoonSeopCategoryWeights[row.num] = weights;
});

const leeYoonSeopImages = createUserImagesAuto(
  "이윤섭", 
  50, 
  undefined, 
  leeYoonSeopCategoryWeights, 
  leeYoonSeopTraits
);

const gwangeoCategoryWeights: Record<number, Record<string, number>> = {};
const gwangeoTraits: Record<number, string> = {};

rawGwangeoSheet.forEach(row => {
  gwangeoTraits[row.num] = row.main;
  
  const weights: Record<string, number> = {};
  const categories = ["대상", "의미", "감각", "직관", "질감", "선명", "색감", "방법론", "취향", "형태"];
  categories.forEach((cat) => {
    weights[cat] = 10 + (row.num * cat.charCodeAt(0)) % 16;
  });
  
  weights[row.main] = 95;
  weights[row.sub1] = 75;
  if (row.sub2) {
    weights[row.sub2] = 55;
  }
  
  gwangeoCategoryWeights[row.num] = weights;
});

const gwangeoImages = createUserImagesAuto(
  "광어를 찾아서", 
  50, 
  undefined, 
  gwangeoCategoryWeights, 
  gwangeoTraits
);

export const rawGahunSheet = [
  { num: 1, main: "감각", sub1: "질감", sub2: "방법론" },
  { num: 2, main: "취향", sub1: "감각", sub2: "의미" },
  { num: 3, main: "대상", sub1: "직관", sub2: "색감" },
  { num: 4, main: "취향", sub1: "대상", sub2: "감각" },
  { num: 5, main: "취향", sub1: "감각", sub2: "대상" },
  { num: 6, main: "취향", sub1: "감각", sub2: "의미" },
  { num: 7, main: "감각", sub1: "대상", sub2: "취향" },
  { num: 8, main: "대상", sub1: "취향", sub2: "의미" },
  { num: 9, main: "취향", sub1: "대상", sub2: "감각" },
  { num: 10, main: "대상", sub1: "취향", sub2: "형태" },
  { num: 11, main: "의미", sub1: "감각", sub2: "형태" },
  { num: 12, main: "의미", sub1: "감각", sub2: "색감" },
  { num: 13, main: "취향", sub1: "의미", sub2: "직관" },
  { num: 14, main: "의미", sub1: "취향", sub2: "직관" },
  { num: 15, main: "대상", sub1: "형태", sub2: "색감" },
  { num: 16, main: "취향", sub1: "감각", sub2: "의미" },
  { num: 17, main: "취향", sub1: "의미", sub2: "감각" },
  { num: 18, main: "취향", sub1: "감각", sub2: "직관" },
  { num: 19, main: "취향", sub1: "감각", sub2: "직관" },
  { num: 20, main: "감각", sub1: "대상", sub2: "직관" },
  { num: 21, main: "의미", sub1: "색감", sub2: "대상" },
  { num: 22, main: "의미", sub1: "색감", sub2: "취향" },
  { num: 23, main: "취향", sub1: "색감", sub2: "감각" },
  { num: 24, main: "취향", sub1: "감각", sub2: "질감" },
  { num: 25, main: "대상", sub1: "감각", sub2: "직관" },
  { num: 26, main: "대상", sub1: "취향", sub2: "색감" },
  { num: 27, main: "형태", sub1: "질감", sub2: "대상" },
  { num: 28, main: "형태", sub1: "대상", sub2: "색감" },
  { num: 29, main: "형태", sub1: "색감", sub2: "대상" },
  { num: 30, main: "대상", sub1: "형태", sub2: "취향" },
  { num: 31, main: "직관", sub1: "의미", sub2: "감각" },
  { num: 32, main: "감각", sub1: "직관", sub2: "의미" },
  { num: 33, main: "대상", sub1: "감각", sub2: "직관" },
  { num: 34, main: "대상", sub1: "직관", sub2: "의미" },
  { num: 35, main: "대상", sub1: "감각", sub2: "형태" },
  { num: 36, main: "대상", sub1: "의미", sub2: "직관" },
  { num: 37, main: "형태", sub1: "대상", sub2: "의미" },
  { num: 38, main: "대상", sub1: "직관", sub2: "취향" },
  { num: 39, main: "대상", sub1: "의미", sub2: "취향" },
  { num: 40, main: "대상", sub1: "감각", sub2: "의미" },
  { num: 41, main: "대상", sub1: "의미", sub2: "직관" },
  { num: 42, main: "대상", sub1: "의미", sub2: "직관" },
  { num: 43, main: "대상", sub1: "방법론", sub2: "선명" },
  { num: 44, main: "대상", sub1: "의미", sub2: "직관" },
  { num: 45, main: "취향", sub1: "대상", sub2: "직관" },
  { num: 46, main: "의미", sub1: "형태", sub2: "감각" },
  { num: 47, main: "취향", sub1: "의미", sub2: "색감" },
  { num: 48, main: "의미", sub1: "감각", sub2: "색감" },
  { num: 49, main: "대상", sub1: "직관", sub2: "취향" },
  { num: 50, main: "취향", sub1: "대상", sub2: "감각" },
];

export const rawJikhyeokSheet = [
  { num: 1, main: "의미", sub1: "대상", sub2: "취향" },
  { num: 2, main: "대상", sub1: "직관", sub2: "형태" },
  { num: 3, main: "의미", sub1: "감각", sub2: "취향" },
  { num: 4, main: "선명", sub1: "대상", sub2: "형태" },
  { num: 5, main: "감각", sub1: "의미", sub2: "취향" },
  { num: 6, main: "선명", sub1: "감각", sub2: "형태" },
  { num: 7, main: "방법론", sub1: "의미", sub2: "감각" },
  { num: 8, main: "직관", sub1: "형태", sub2: "방법론" },
  { num: 9, main: "의미", sub1: "취향", sub2: "직관" },
  { num: 10, main: "직관", sub1: "색감", sub2: "취향" },
  { num: 11, main: "의미", sub1: "취향", sub2: "방법론" },
  { num: 12, main: "형태", sub1: "방법론", sub2: "대상" },
  { num: 13, main: "의미", sub1: "방법론", sub2: "대상" },
  { num: 14, main: "선명", sub1: "형태", sub2: "대상" },
  { num: 15, main: "의미", sub1: "방법론", sub2: "형태" },
  { num: 16, main: "선명", sub1: "형태", sub2: "대상" },
  { num: 17, main: "방법론", sub1: "의미", sub2: "감각" },
  { num: 18, main: "방법론", sub1: "직관", sub2: "형태" },
  { num: 19, main: "의미", sub1: "방법론", sub2: "형태" },
  { num: 20, main: "색감", sub1: "직관", sub2: "질감" },
  { num: 21, main: "감각", sub1: "방법론", sub2: "형태" },
  { num: 22, main: "색감", sub1: "의미", sub2: "직관" },
  { num: 23, main: "감각", sub1: "방법론", sub2: "의미" },
  { num: 24, main: "대상", sub1: "형태", sub2: "질감" },
  { num: 25, main: "감각", sub1: "대상", sub2: "형태" },
  { num: 26, main: "대상", sub1: "형태", sub2: "색감" },
  { num: 27, main: "대상", sub1: "형태", sub2: "직관" },
  { num: 28, main: "형태", sub1: "선명", sub2: "대상" },
  { num: 29, main: "대상", sub1: "형태", sub2: "선명" },
  { num: 30, main: "대상", sub1: "형태", sub2: "선명" },
  { num: 31, main: "의미", sub1: "방법론", sub2: "형태" },
  { num: 32, main: "선명", sub1: "형태", sub2: "직관" },
  { num: 33, main: "의미", sub1: "형태", sub2: "취향" },
  { num: 34, main: "감각", sub1: "대상", sub2: "취향" },
  { num: 35, main: "의미", sub1: "방법론", sub2: "취향" },
  { num: 36, main: "직관", sub1: "대상", sub2: "질감" },
  { num: 37, main: "의미", sub1: "형태", sub2: "취향" },
  { num: 38, main: "대상", sub1: "방법론", sub2: "질감" },
  { num: 39, main: "대상", sub1: "감각", sub2: "질감" },
  { num: 40, main: "질감", sub1: "형태", sub2: "대상" },
  { num: 41, main: "의미", sub1: "방법론", sub2: "형태" },
  { num: 42, main: "대상", sub1: "형태", sub2: "선명" },
  { num: 43, main: "의미", sub1: "방법론", sub2: "취향" },
  { num: 44, main: "감각", sub1: "질감", sub2: "색감" },
  { num: 45, main: "대상", sub1: "형태", sub2: "직관" },
  { num: 46, main: "감각", sub1: "의미", sub2: "질감" },
  { num: 47, main: "방법론", sub1: "의미", sub2: "감각" },
  { num: 48, main: "대상", sub1: "선명", sub2: "직관" },
  { num: 49, main: "방법론", sub1: "의미", sub2: "직관" },
  { num: 50, main: "질감", sub1: "대상", sub2: "색감" },
];

export const rawPyeonganSheet = [
  { num: 1, main: "색감", sub1: "질감", sub2: "의미" },
  { num: 2, main: "대상", sub1: "감각", sub2: "형태" },
  { num: 3, main: "대상", sub1: "감각", sub2: "색감" },
  { num: 4, main: "대상", sub1: "감각", sub2: "색감" },
  { num: 5, main: "감각", sub1: "색감", sub2: "형태" },
  { num: 6, main: "대상", sub1: "선명", sub2: "형태" },
  { num: 7, main: "색감", sub1: "감각", sub2: "의미" },
  { num: 8, main: "대상", sub1: "형태", sub2: "선명" },
  { num: 9, main: "대상", sub1: "형태", sub2: "선명" },
  { num: 10, main: "방법론", sub1: "형태", sub2: "질감" },
  { num: 11, main: "대상", sub1: "형태", sub2: "의미" },
  { num: 12, main: "대상", sub1: "선명", sub2: "형태" },
  { num: 13, main: "형태", sub1: "직관", sub2: "의미" },
  { num: 14, main: "대상", sub1: "형태", sub2: "의미" },
  { num: 15, main: "대상", sub1: "의미", sub2: "감각" },
  { num: 16, main: "질감", sub1: "감각", sub2: "선명" },
  { num: 17, main: "대상", sub1: "의미", sub2: "형태" },
  { num: 18, main: "질감", sub1: "감각", sub2: "선명" },
  { num: 19, main: "선명", sub1: "방법론", sub2: "감각" },
  { num: 20, main: "대상", sub1: "선명", sub2: "감각" },
  { num: 21, main: "대상", sub1: "방법론", sub2: "질감" },
  { num: 22, main: "선명", sub1: "방법론", sub2: "질감" },
  { num: 23, main: "선명", sub1: "감각", sub2: "대상" },
  { num: 24, main: "방법론", sub1: "색감", sub2: "취향" },
  { num: 25, main: "의미", sub1: "대상", sub2: "취향" },
  { num: 26, main: "형태", sub1: "방법론", sub2: "질감" },
  { num: 27, main: "방법론", sub1: "형태", sub2: "선명" },
  { num: 28, main: "방법론", sub1: "형태", sub2: "선명" },
  { num: 29, main: "형태", sub1: "대상", sub2: "방법론" },
  { num: 30, main: "형태", sub1: "방법론", sub2: "감각" },
  { num: 31, main: "의미", sub1: "방법론", sub2: "색감" },
  { num: 32, main: "의미", sub1: "방법론", sub2: "감각" },
  { num: 33, main: "의미", sub1: "방법론", sub2: "감각" },
  { num: 34, main: "색감", sub1: "의미", sub2: "감각" },
  { num: 35, main: "감각", sub1: "색감", sub2: "방법론" },
  { num: 36, main: "대상", sub1: "색감", sub2: "감각" },
  { num: 37, main: "직관", sub1: "형태", sub2: "감각" },
  { num: 38, main: "선명", sub1: "대상", sub2: "감각" },
  { num: 39, main: "취향", sub1: "감각", sub2: "질감" },
  { num: 40, main: "취향", sub1: "감각", sub2: "질감" },
  { num: 41, main: "의미", sub1: "취향", sub2: "감각" },
  { num: 42, main: "대상", sub1: "의미", sub2: "형태" },
  { num: 43, main: "질감", sub1: "의미", sub2: "감각" },
  { num: 44, main: "대상", sub1: "감각", sub2: "직관" },
  { num: 45, main: "형태", sub1: "취향", sub2: "의미" },
  { num: 46, main: "감각", sub1: "의미", sub2: "직관" },
  { num: 47, main: "대상", sub1: "감각", sub2: "선명" },
  { num: 48, main: "직관", sub1: "방법론", sub2: "의미" },
  { num: 49, main: "취향", sub1: "감각", sub2: "직관" },
  { num: 50, main: "질감", sub1: "감각", sub2: "형태" },
];

const gahunCategoryWeights: Record<number, Record<string, number>> = {};
const gahunTraits: Record<number, string> = {};
rawGahunSheet.forEach(row => {
  gahunTraits[row.num] = row.main;
  const weights: Record<string, number> = {};
  const categories = ["대상", "의미", "감각", "직관", "질감", "선명", "색감", "방법론", "취향", "형태"];
  categories.forEach((cat) => {
    weights[cat] = 10 + (row.num * cat.charCodeAt(0)) % 16;
  });
  weights[row.main] = 95;
  weights[row.sub1] = 75;
  if (row.sub2) {
    weights[row.sub2] = 55;
  }
  gahunCategoryWeights[row.num] = weights;
});
const gahunImages = createUserImagesAuto("박가현", 50, undefined, gahunCategoryWeights, gahunTraits);

const jikhyeokCategoryWeights: Record<number, Record<string, number>> = {};
const jikhyeokTraits: Record<number, string> = {};
rawJikhyeokSheet.forEach(row => {
  jikhyeokTraits[row.num] = row.main;
  const weights: Record<string, number> = {};
  const categories = ["대상", "의미", "감각", "직관", "질감", "선명", "색감", "방법론", "취향", "형태"];
  categories.forEach((cat) => {
    weights[cat] = 10 + (row.num * cat.charCodeAt(0)) % 16;
  });
  weights[row.main] = 95;
  weights[row.sub1] = 75;
  if (row.sub2) {
    weights[row.sub2] = 55;
  }
  jikhyeokCategoryWeights[row.num] = weights;
});
const jikhyeokImages = createUserImagesAuto("전진혁", 50, undefined, jikhyeokCategoryWeights, jikhyeokTraits);

const pyeonganCategoryWeights: Record<number, Record<string, number>> = {};
const pyeonganTraits: Record<number, string> = {};
rawPyeonganSheet.forEach(row => {
  pyeonganTraits[row.num] = row.main;
  const weights: Record<string, number> = {};
  const categories = ["대상", "의미", "감각", "직관", "질감", "선명", "색감", "방법론", "취향", "형태"];
  categories.forEach((cat) => {
    weights[cat] = 10 + (row.num * cat.charCodeAt(0)) % 16;
  });
  weights[row.main] = 95;
  weights[row.sub1] = 75;
  if (row.sub2) {
    weights[row.sub2] = 55;
  }
  pyeonganCategoryWeights[row.num] = weights;
});
const pyeonganImages = createUserImagesAuto("정평안", 50, undefined, pyeonganCategoryWeights, pyeonganTraits);

export const USER_CUSTOM_IMAGES: Record<string, ImageItem[]> = {
  "최지원": choiJiwonImages,
  ["최지원".normalize("NFD")]: choiJiwonImages,
  "choijiwon": choiJiwonImages,
  "choi jiwon": choiJiwonImages,
  "이윤섭": leeYoonSeopImages,
  ["이윤섭".normalize("NFD")]: leeYoonSeopImages,
  "leeyoonseop": leeYoonSeopImages,
  "lee yoonseop": leeYoonSeopImages,
  "이윤서": leeYoonSeopImages,
  ["이윤서".normalize("NFD")]: leeYoonSeopImages,
  "leeyoonseo": leeYoonSeopImages,
  "lee yoonseo": leeYoonSeopImages,
  "광어를 찾아서": gwangeoImages,
  ["광어를 찾아서".normalize("NFD")]: gwangeoImages,
  "광어를찾아서": gwangeoImages,
  ["광어를찾아서".normalize("NFD")]: gwangeoImages,
  "gwangeoreulchajaseo": gwangeoImages,
  "gwangeo": gwangeoImages,
  "박가현": gahunImages,
  ["박가현".normalize("NFD")]: gahunImages,
  "parkgahun": gahunImages,
  "bakgahun": gahunImages,
  "전진혁": jikhyeokImages,
  ["전진혁".normalize("NFD")]: jikhyeokImages,
  "전직혁": jikhyeokImages,
  ["전직혁".normalize("NFD")]: jikhyeokImages,
  "jeonjinhyeok": jikhyeokImages,
  "jeonjikhyeok": jikhyeokImages,
  "jikhyeok": jikhyeokImages,
  "정평안": pyeonganImages,
  ["정평안".normalize("NFD")]: pyeonganImages,
  "jeongpyeongan": pyeonganImages,
  "pyeongan": pyeonganImages
};

export function getUserCustomImages(name: string): ImageItem[] | undefined {
  if (!name) return undefined;
  const norm = (s: string) => s.normalize("NFC").replace(/\s+/g, "").trim().toLowerCase();
  const targetNorm = norm(name);
  
  if (USER_CUSTOM_IMAGES[name]) return USER_CUSTOM_IMAGES[name];
  
  for (const key of Object.keys(USER_CUSTOM_IMAGES)) {
    if (norm(key) === targetNorm) {
      return USER_CUSTOM_IMAGES[key];
    }
  }
  
  if (targetNorm === "이윤서" || targetNorm === "leeyoonseo") {
    return leeYoonSeopImages;
  }
  
  return undefined;
}

export const DEFAULT_CUSTOM_IMAGE: ImageItem = {
  id: "custom-default",
  url: "/logo.png",
  properties: {
    color: "#55FFCC",
    intuition: 50,
    aesthetics: 50,
    rationality: 50,
  },
  description: "HOMO IMAGES Lab의 기본 프로필 이미지입니다.",
  tags: ["기본", "균형"],
  trait: "형태",
};

// 10명의 고정 사용자 프로필 및 결과값(10가지 레이더 차트 가중치) 정의
export interface PredefinedUserProfile {
  name: string;          // 사용자가 입력할 실명
  folderName: string;    // public/ 폴더 밑에 생성될 영문 폴더명 (Mac NFC/NFD 오류 및 URL 100% 안정성 보장)
  dominantTrait: string; // 10가지 성향 중 오직 이 사용자만을 위해 지정할 궁극의 페르소나 결과값
  scores: Record<string, number>; // 레이더 차트에 나타날 10가지 성향별 100점 만점 수치
}

export const PREDEFINED_USERS: PredefinedUserProfile[] = [
  {
    name: "이윤섭",
    folderName: "leeyoonseop",
    dominantTrait: "대상",
    scores: {
      "대상": 96, "취향": 89, "의미": 82, "형태": 75, "직관": 68, "방법론": 58, "질감": 52, "선명": 45, "감각": 38, "색감": 30
    }
  },
  {
    name: "광어를 찾아서",
    folderName: "gwangeoreulchajaseo",
    dominantTrait: "색감",
    scores: {
      "색감": 96, "취향": 88, "대상": 81, "의미": 74, "직관": 65, "감각": 58, "방법론": 52, "형태": 45, "질감": 38, "선명": 30
    }
  },
  {
    name: "김도현",
    folderName: "kimdohyun",
    dominantTrait: "색감", // 테스트용 궁극의 페르소나 결과값 (원하는 결과로 수정 가능)
    scores: {
      "색감": 95, "감각": 88, "직관": 85, "의미": 70, "형태": 60, "질감": 55, "취향": 50, "대상": 45, "방법론": 40, "선명": 35
    } // 레이더 차트 가중치 (원하는 수치로 자유롭게 수정 가능)
  },
  {
    name: "최지원",
    folderName: "choijiwon",
    dominantTrait: "색감",
    scores: {
      "색감": 95, "감각": 88, "직관": 85, "의미": 70, "형태": 60, "질감": 55, "취향": 50, "대상": 45, "방법론": 40, "선명": 35
    }
  },
  {
    name: "하온",
    folderName: "haon",
    dominantTrait: "직관",
    scores: {
      "직관": 96, "감각": 90, "취향": 82, "색감": 75, "의미": 68, "형태": 55, "대상": 50, "질감": 45, "방법론": 38, "선명": 30
    }
  },
  {
    name: "지우",
    folderName: "jiwoo",
    dominantTrait: "선명",
    scores: {
      "선명": 94, "형태": 88, "방법론": 80, "대상": 75, "질감": 60, "의미": 55, "직관": 48, "색감": 40, "감각": 35, "취향": 30
    }
  },
  {
    name: "서연",
    folderName: "seoyeon",
    dominantTrait: "감각",
    scores: {
      "감각": 95, "색감": 90, "질감": 85, "의미": 72, "형태": 65, "직관": 60, "취향": 55, "대상": 40, "방법론": 35, "선명": 30
    }
  },
  {
    name: "도윤",
    folderName: "doyun",
    dominantTrait: "대상",
    scores: {
      "대상": 93, "선명": 85, "형태": 80, "질감": 72, "의미": 65, "방법론": 58, "직관": 50, "색감": 45, "감각": 40, "취향": 35
    }
  },
  {
    name: "수안",
    folderName: "suan",
    dominantTrait: "의미",
    scores: {
      "의미": 97, "직관": 88, "취향": 82, "감각": 75, "색감": 68, "형태": 60, "질감": 52, "대상": 45, "방법론": 38, "선명": 30
    }
  },
  {
    name: "하임",
    folderName: "haim",
    dominantTrait: "질감",
    scores: {
      "질감": 95, "형태": 88, "감각": 80, "색감": 72, "의미": 65, "대상": 58, "직관": 50, "취향": 45, "방법론": 40, "선명": 35
    }
  },
  {
    name: "정인",
    folderName: "jungin",
    dominantTrait: "방법론",
    scores: {
      "방법론": 94, "선명": 88, "형태": 85, "대상": 75, "의미": 68, "직관": 58, "질감": 50, "색감": 42, "취향": 35, "감각": 30
    }
  },
  {
    name: "이선",
    folderName: "iseon",
    dominantTrait: "취향",
    scores: {
      "취향": 96, "직관": 90, "감각": 82, "색감": 75, "의미": 68, "질감": 55, "형태": 48, "대상": 40, "방법론": 35, "선명": 30
    }
  },
  {
    name: "민재",
    folderName: "minjae",
    dominantTrait: "형태",
    scores: {
      "형태": 95, "선명": 88, "방법론": 82, "대상": 75, "질감": 68, "의미": 60, "직관": 52, "색감": 45, "감각": 38, "취향": 30
    }
  },
  {
    name: "박가현",
    folderName: "parkgahun",
    dominantTrait: "대상",
    scores: {
      "대상": 96, "의미": 69, "감각": 68, "직관": 50, "질감": 33, "선명": 30, "색감": 41, "방법론": 32, "취향": 81, "형태": 47
    }
  },
  {
    name: "전진혁",
    folderName: "jeonjinhyeok",
    dominantTrait: "의미",
    scores: {
      "대상": 91, "의미": 96, "감각": 59, "직관": 46, "질감": 34, "선명": 47, "색감": 30, "방법론": 71, "취향": 32, "형태": 77
    }
  },
  {
    name: "정평안",
    folderName: "jeongpyeongan",
    dominantTrait: "대상",
    scores: {
      "대상": 96, "의미": 60, "감각": 76, "직관": 30, "질감": 42, "선명": 49, "색감": 42, "방법론": 58, "취향": 36, "형태": 66
    }
  }
];

// 한글 자소분리(NFC/NFD), 띄어쓰기 및 대소문자 차이를 극복하는 완벽한 매칭 함수
export function findPredefinedUser(name: string): PredefinedUserProfile | undefined {
  if (!name) return undefined;
  const norm = (s: string) => s.normalize("NFC").replace(/\s+/g, "").trim().toLowerCase();
  const targetNorm = norm(name);
  
  if (targetNorm === "이윤서" || targetNorm === "leeyoonseo" || targetNorm === "이윤서".normalize("NFD")) {
    return PREDEFINED_USERS.find(user => user.folderName === "leeyoonseop");
  }
  
  return PREDEFINED_USERS.find(user => {
    return norm(user.name) === targetNorm || 
           norm(user.folderName) === targetNorm ||
           user.name.normalize("NFD").replace(/\s+/g, "").trim().toLowerCase() === targetNorm;
  });
}
