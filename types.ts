
export interface PomelliData {
  businessOverview: string; // A concise summary of what the business is
  tagline: string;
  brandArchetype: string; // e.g., "The Creator", "The Ruler"
  toneOfVoice: string[]; // Adjectives e.g., "Witty", "Professional"
  brandAesthetic: string[]; // Visual keywords e.g., "Minimalist", "Bold"
  typography: string; // Font recommendations
  colors: { name: string; hex: string; description: string }[];
  brandValues: { title: string; description: string }[];
}

export interface BrandPersona {
  brandName: string;
  brandNameSuggestions?: string[]; // If brand name wasn't provided
  philosophy: string;
  slogan: string;
  coreTechnology: string;
  coreStrategy: string;
  brandMent: string;
  targetAudience: string;
  genZValue: string;
  customerCulture: string;
  comparativeAdvantage: string;
  qualityLevel: string;
  priceLevel: string;
  functionalBenefit: string;
  experientialBenefit: string;
  symbolicBenefit: string;
  keywords: string[];
  customerManagement: string;
  pomelli: PomelliData;
}

export interface CustomInputs {
  [key: string]: string | undefined;
}

export interface AnalysisRequest {
  idea: string;
  url?: string;
  brandName?: string;
  customInputs?: CustomInputs;
}

// --- Builder Mode Types ---

export type PersonaFieldKey = keyof Omit<BrandPersona, 'brandNameSuggestions' | 'pomelli'>;

export interface FieldGuide {
  key: PersonaFieldKey;
  guides: string[]; // 3 specific guiding questions/points
}

export interface FieldState {
  draft: string; // Current AI generated content
  userInput: string; // User's answer to the guides
  history: string[]; // Previous drafts
  isFinalized: boolean;
  isLoading: boolean;
}

export type BuilderState = Record<PersonaFieldKey, FieldState>;

export const FIELD_METADATA: { key: PersonaFieldKey; label: string; category: string }[] = [
  { key: 'brandName', label: '브랜드명', category: 'Identity & Visual' },
  // Image generation is handled separately, but conceptually part of identity
  { key: 'philosophy', label: '브랜드 철학', category: 'Identity & Visual' },
  { key: 'slogan', label: '슬로건', category: 'Identity & Visual' },
  { key: 'brandMent', label: '브랜드 멘트 (Tone & Manner)', category: 'Identity & Visual' },
  
  { key: 'coreTechnology', label: '핵심 기술 / 역량', category: 'Strategy & Competitiveness' },
  { key: 'coreStrategy', label: '핵심 전략', category: 'Strategy & Competitiveness' },
  { key: 'comparativeAdvantage', label: '브랜드 비교 우위 속성', category: 'Strategy & Competitiveness' },
  
  { key: 'targetAudience', label: '고객 정의 (Target)', category: 'Market & Customer' },
  { key: 'genZValue', label: 'Gen-Z를 위한 고객 가치', category: 'Market & Customer' },
  { key: 'customerCulture', label: '고객 문화 창조', category: 'Market & Customer' },
  
  { key: 'qualityLevel', label: '품질 수준', category: 'Benefits & Value' },
  { key: 'priceLevel', label: '가격 수준', category: 'Benefits & Value' },
  { key: 'functionalBenefit', label: '기능적 혜택 (Pain-Point)', category: 'Benefits & Value' },
  { key: 'experientialBenefit', label: '경험적 혜택', category: 'Benefits & Value' },
  { key: 'symbolicBenefit', label: '상징적 혜택', category: 'Benefits & Value' },
  
  { key: 'keywords', label: '브랜드 키워드', category: 'Experience & Management' },
  { key: 'customerManagement', label: '고객 관리(멤버십) 철학', category: 'Experience & Management' },
];
