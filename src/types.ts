export type Gender = 'male' | 'female' | 'other' | null;
export type AgeGroup = 'infant' | 'child' | 'adult' | 'middle' | 'senior' | null;

export interface UserData {
  name: string;
  signature: string; // Base64 image
  gender: Gender;
  age: AgeGroup;
}

export interface ImageItem {
  id: string;
  url: string;
  properties: {
    color: string;
    intuition: number;
    aesthetics: number;
    rationality: number;
  };
  categoryWeights?: Record<string, number>; // 추가: 이미지마다 10개 범주 값을 미리 할당할 수 있도록 지원
  description: string;
  tags: string[];
  trait: string;
}

export type PageId = 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6' | 'P7' | 'P8';
