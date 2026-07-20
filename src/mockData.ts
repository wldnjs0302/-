import { ImageItem } from "./types";
import { USER_CUSTOM_IMAGES } from "./data/userMapping";

const UNSPLASH_IMAGES = [
  "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=500&q=80",
  "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=500&q=80",
  "https://images.unsplash.com/photo-1494253109108-2e30c049369b?w=500&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&q=80",
  "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=500&q=80",
  "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&q=80",
  "https://images.unsplash.com/photo-1533158326339-7f3cf2404354?w=500&q=80",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&q=80",
  "https://images.unsplash.com/photo-1557683316-973673baf926?w=500&q=80",
  "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=500&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&q=80",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&q=80",
  "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=500&q=80",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&q=80",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&q=80",
  "https://images.unsplash.com/photo-1501472312651-726afd116ff1?w=500&q=80",
  "https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?w=500&q=80",
  "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=500&q=80",
  "https://images.unsplash.com/photo-1502691876148-a84176780057?w=500&q=80",
  "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=500&q=80",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=500&q=80",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=500&q=80",
  "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=500&q=80",
  "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=500&q=80",
  "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?w=500&q=80",
  "https://images.unsplash.com/photo-1504198453319-5ce911bafcde?w=500&q=80",
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&q=80",
  "https://images.unsplash.com/photo-1515238152791-8216bfdf89a7?w=500&q=80",
  "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&q=80",
  "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=500&q=80",
  "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=500&q=80",
  "https://images.unsplash.com/photo-1549490349-8643362247b5?w=500&q=80",
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=500&q=80",
  "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?w=500&q=80",
  "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=500&q=80",
  "https://images.unsplash.com/photo-1531315630201-bb15abeb1653?w=500&q=80",
  "https://images.unsplash.com/photo-1510519138101-570d1dca3d66?w=500&q=80",
  "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=500&q=80",
  "https://images.unsplash.com/photo-1525498122383-3af7b1f77e76?w=500&q=80",
  "https://images.unsplash.com/photo-1563089145-599997674d42?w=500&q=80",
  "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=500&q=80",
  "https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?w=500&q=80",
  "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=500&q=80",
  "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=500&q=80",
  "https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=500&q=80",
  "https://images.unsplash.com/photo-1547891654-e66ed7edd96c?w=500&q=80",
  "https://images.unsplash.com/photo-1481349518771-20055b2a7b24?w=500&q=80",
  "https://images.unsplash.com/photo-1472457897821-70d3819a0e24?w=500&q=80",
  "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=500&q=80",
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&q=80"
];

export const generateDummyImages = (name: string): ImageItem[] => {
  const images: ImageItem[] = [];
  
  const cleanName = name.trim().replace(/\s+/g, '').normalize('NFC');
  const cleanNameNFD = name.trim().replace(/\s+/g, '').normalize('NFD');
  
  // Robust NFC/NFD matching for custom user images lookup
  const matchedKey = Object.keys(USER_CUSTOM_IMAGES).find(key => {
    const kNormalized = key.normalize('NFC').replace(/\s+/g, '');
    const kNFD = key.normalize('NFD').replace(/\s+/g, '');
    return kNormalized === cleanName || kNFD === cleanNameNFD || kNormalized.toLowerCase() === cleanName.toLowerCase();
  });

  if (matchedKey && USER_CUSTOM_IMAGES[matchedKey] && USER_CUSTOM_IMAGES[matchedKey].length > 0) {
    images.push(...USER_CUSTOM_IMAGES[matchedKey]);
  }
  
  const fallbackImages = [
    "/age-adult.png",
    "/age-child.png", 
    "/age-infant.png",
    "/age-middle.png",
    "/age-senior.png",
    "/logo.png"
  ];
  
  const TRAITS = ["CREATIVE", "RATIONAL", "EMOTIONAL", "INTUITIVE", "ANALYTICAL", "AESTHETIC", "HARMONIOUS", "VISIONARY"];
  const TRAIT_TAGS: Record<string, string[]> = {
    "CREATIVE": ["창의", "영감"],
    "RATIONAL": ["이성", "논리"],
    "EMOTIONAL": ["감성", "몰입"],
    "INTUITIVE": ["직관", "통찰"],
    "ANALYTICAL": ["분석", "탐구"],
    "AESTHETIC": ["미학", "독창"],
    "HARMONIOUS": ["조화", "비례"],
    "VISIONARY": ["이상", "미래"]
  };
  
  let folderPath = "choijiwon";
  if (cleanName === "광어를찾아서" || cleanName === "gwangeoreulchajaseo" || cleanName === "gwangeo" || name.normalize("NFD").replace(/\s+/g, "").toLowerCase().includes("광어를찾아서")) {
    folderPath = "gwangeoreulchajaseo";
  } else if (cleanName === "이윤섭" || cleanName === "leeyoonseop" || cleanName === "이윤서" || cleanName === "leeyoonseo" || name.normalize("NFD").replace(/\s+/g, "").toLowerCase().includes("이윤섭") || name.normalize("NFD").replace(/\s+/g, "").toLowerCase().includes("이윤서")) {
    folderPath = "leeyoonseop";
  }

  // Create an exact count of 50 images for selection process
  const startCount = images.length;
  for (let i = startCount; i < 50; i++) {
    const trait = TRAITS[i % TRAITS.length];
    const tags = TRAIT_TAGS[trait] || ["파편", "기억"];
    
    // Serve beautiful local high-resolution assets to guarantee instant loading without CORS blocks
    const imageNumber = (i % 50) + 1;
    const url = `/${folderPath}/${imageNumber}.png`;

      images.push({
        id: `img-placeholder-${imageNumber}`,
        url: url,
        properties: { color: "Neutral", intuition: 55, aesthetics: 60, rationality: 40 },
        description: `이 데이터는 ${name}님의 무의식 속에 잠재된 ${trait} 성향을 시각화한 임시 지표입니다. 수치화된 가치관을 구조적으로 반영합니다.`,
        tags: tags,
        trait: trait
      });
    }

  return images;
};
