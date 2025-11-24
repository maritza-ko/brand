
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
  userInputs: string[]; // User's answers to the 3 guides (Array of 3 strings)
  history: string[]; // Previous drafts
  isFinalized: boolean;
  isLoading: boolean;
}

export type BuilderState = Record<PersonaFieldKey, FieldState>;

export const FIELD_METADATA: { key: PersonaFieldKey; label: string; category: string; description: string }[] = [
  {
    key: 'brandName',
    label: '브랜드명',
    category: 'Identity & Visual',
    description: '브랜드의 첫인상을 결정짓는 핵심 식별자입니다. 고객이 브랜드를 기억하고 부르는 이름으로, 브랜드의 정체성과 철학을 함축적으로 담고 있어야 합니다. 발음하기 쉽고 기억하기 좋으며, 경쟁 브랜드와 차별화되는 것이 중요합니다.'
  },
  {
    key: 'philosophy',
    label: '브랜드 철학',
    category: 'Identity & Visual',
    description: '브랜드가 존재하는 근본적인 이유이자 신념입니다. "우리는 왜 이 일을 하는가?"에 대한 답으로, 내부 구성원의 행동 기준이 되고 고객에게는 진정성을 전달합니다. 변하지 않는 가치와 세상에 미치고자 하는 긍정적 영향력을 명확히 하는 것이 중요합니다.'
  },
  {
    key: 'slogan',
    label: '슬로건',
    category: 'Identity & Visual',
    description: '브랜드 철학을 고객 언어로 쉽고 강렬하게 표현한 한 문장입니다. 브랜드의 약속을 고객의 뇌리에 각인시키는 역할을 합니다. 짧고 리듬감 있으며, 브랜드가 제공하는 핵심 가치를 직관적으로 전달해야 합니다.'
  },
  {
    key: 'brandMent',
    label: '브랜드 멘트 (Tone & Manner)',
    category: 'Identity & Visual',
    description: '브랜드가 고객과 소통할 때 사용하는 고유의 말투와 태도입니다. 브랜드 페르소나의 성격을 드러내며, 일관된 톤앤매너는 고객에게 친밀감과 신뢰를 형성합니다. 타겟 고객이 선호하는 화법을 구사하는 것이 중요합니다.'
  },

  {
    key: 'coreTechnology',
    label: '핵심 기술 / 역량',
    category: 'Strategy & Competitiveness',
    description: '브랜드가 가진 독보적인 기술이나 핵심 역량입니다. 경쟁사가 쉽게 모방할 수 없는 우리만의 무기로, 제품이나 서비스의 품질을 뒷받침하는 근거(RTB: Reason to Believe)가 됩니다. 구체적이고 실체적인 기술력을 제시하는 것이 중요합니다.'
  },
  {
    key: 'coreStrategy',
    label: '핵심 전략',
    category: 'Strategy & Competitiveness',
    description: '시장에서 경쟁 우위를 점하기 위한 구체적인 방법론입니다. "어떻게 이길 것인가?"에 대한 해답으로, 한정된 자원을 효율적으로 배분하여 목표를 달성하는 계획입니다. 시장 상황과 경쟁 구도를 고려한 차별화된 접근이 중요합니다.'
  },
  {
    key: 'comparativeAdvantage',
    label: '브랜드 비교 우위 속성',
    category: 'Strategy & Competitiveness',
    description: '경쟁 브랜드 대비 확실하게 우위에 있는 속성입니다. 고객이 다른 브랜드가 아닌 우리 브랜드를 선택해야만 하는 결정적인 이유가 됩니다. 고객이 중요하게 생각하는 구매 결정 요인(KBF)에서 우위를 점하는 것이 중요합니다.'
  },

  {
    key: 'targetAudience',
    label: '고객 정의 (Target)',
    category: 'Market & Customer',
    description: '우리 브랜드에 가장 열광할 핵심 고객층입니다. 모든 사람을 만족시키려 하기보다, 우리 브랜드의 가치를 진정으로 필요로 하는 좁고 명확한 타겟을 정의해야 합니다. 그들의 인구통계학적 특성뿐만 아니라 라이프스타일, 가치관, 고민 등을 깊이 있게 이해하는 것이 중요합니다.'
  },
  {
    key: 'genZValue',
    label: 'Gen-Z를 위한 고객 가치',
    category: 'Market & Customer',
    description: '미래 소비 주축인 Z세대가 중요하게 여기는 가치입니다. 공정성, 다양성, 친환경 등 사회적 가치와 개인의 취향을 존중하는 태도가 필요합니다. Z세대의 공감을 얻고 그들을 브랜드의 팬으로 만드는 것이 중요합니다.'
  },
  {
    key: 'customerCulture',
    label: '고객 문화 창조',
    category: 'Market & Customer',
    description: '브랜드가 고객과 함께 만들어가는 고유한 문화입니다. 단순한 소비를 넘어, 브랜드와 고객이 상호작용하며 형성하는 커뮤니티나 라이프스타일을 의미합니다. 고객이 소속감을 느끼고 자발적으로 참여할 수 있는 문화를 조성하는 것이 중요합니다.'
  },

  {
    key: 'qualityLevel',
    label: '품질 수준',
    category: 'Benefits & Value',
    description: '브랜드가 제공하는 제품이나 서비스의 수준입니다. 타겟 고객의 기대치를 충족시키거나 그 이상을 제공해야 합니다. 일관된 품질 유지는 브랜드 신뢰도의 핵심입니다.'
  },
  {
    key: 'priceLevel',
    label: '가격 수준',
    category: 'Benefits & Value',
    description: '브랜드 가치에 부합하는 가격 정책입니다. 단순히 싸거나 비싼 것이 아니라, 고객이 느끼는 가치 대비 합리적인 가격을 설정해야 합니다. 가격은 브랜드의 포지셔닝을 결정하는 중요한 요소입니다.'
  },
  {
    key: 'functionalBenefit',
    label: '기능적 혜택 (Pain-Point)',
    category: 'Benefits & Value',
    description: '제품이나 서비스가 제공하는 물리적, 기능적 혜택입니다. 고객의 불편함(Pain Point)을 해결해주는 1차적인 가치입니다. 성능, 효율, 편리함 등 구체적인 효용을 명확히 전달하는 것이 중요합니다.'
  },
  {
    key: 'experientialBenefit',
    label: '경험적 혜택',
    category: 'Benefits & Value',
    description: '고객이 브랜드를 경험하며 느끼는 감각적, 정서적 혜택입니다. 사용 과정에서의 즐거움, 만족감, 특별한 경험 등을 포함합니다. 기능적 혜택을 넘어 고객의 마음을 움직이는 것이 중요합니다.'
  },
  {
    key: 'symbolicBenefit',
    label: '상징적 혜택',
    category: 'Benefits & Value',
    description: '브랜드를 소유하거나 사용함으로써 얻는 사회적, 자아표현적 가치입니다. "이 브랜드를 쓰는 나는 어떤 사람인가?"에 대한 답을 줍니다. 고객의 자존감을 높여주고 소속감을 부여하는 것이 중요합니다.'
  },

  {
    key: 'keywords',
    label: '브랜드 키워드',
    category: 'Experience & Management',
    description: '브랜드를 연상시키는 핵심 단어들입니다. SEO(검색 엔진 최적화)와 마케팅 커뮤니케이션의 기준이 됩니다. 고객이 검색할 만한 단어와 브랜드가 선점하고 싶은 이미지를 연결하는 것이 중요합니다.'
  },
  {
    key: 'customerManagement',
    label: '고객 관리(멤버십) 철학',
    category: 'Experience & Management',
    description: '구매 이후에도 고객과의 관계를 지속하기 위한 철학입니다. 재구매를 유도하고 충성 고객(팬덤)을 만드는 전략입니다. 고객 생애 가치(LTV)를 높이고 브랜드의 옹호자로 만드는 것이 중요합니다.'
  },
];
