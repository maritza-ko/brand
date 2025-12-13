/// <reference types="vite/client" />

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { BrandPersona, AnalysisRequest, CustomInputs, PersonaFieldKey, FieldGuide, FIELD_METADATA, BuilderState } from "../types";

// [보안 및 안정성 최우선 설정]
// 하이브리드 방식: Vercel/Vite 환경 변수가 있으면 사용, 없으면 하드코딩된 키(사용자 제공)를 사용
const getApiKey = (userProvidedKey?: string) => {
  // 0. User Provided Key (Highest Priority)
  if (userProvidedKey && userProvidedKey.trim().length > 0) {
    return userProvidedKey.trim();
  }
  // 1. Vite / Modern Browsers
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }

  // 2. Node.js / Vite 'define' replacement
  // process.env.GEMINI_API_KEY is replaced by string literal in Vite build if defined in config
  try {
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
      if (process.env.REACT_APP_GEMINI_API_KEY) return process.env.REACT_APP_GEMINI_API_KEY;
    }
    // Safe check for replaced global
    // @ts-ignore
    if (typeof process === 'undefined' && typeof GEMINI_API_KEY !== 'undefined') {
      // @ts-ignore
      return GEMINI_API_KEY;
    }
  } catch (e) { }

  return "AIzaSyAf8BsOSUlcr3wzJ8bGTv2Gc4qEnz8dIW0";
};

const getAI = (apiKey?: string) => new GoogleGenAI({ apiKey: getApiKey(apiKey) });

// --- Global Safety Settings ---
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH }
];

// --- Defaults & Constants ---

const DEFAULT_POMELLI = {
  businessOverview: "데이터를 분석하여 비즈니스 DNA를 도출하고 있습니다.",
  tagline: "Your Strategic Tagline Here",
  brandArchetype: "The Creator",
  toneOfVoice: ["Professional", "Trustworthy"],
  brandAesthetic: ["Clean", "Modern"],
  typography: "Sans-serif / Pretendard",
  colors: [
    { name: "Primary Blue", hex: "#4F46E5", description: "Trust and Professionalism" },
    { name: "Clean White", hex: "#FFFFFF", description: "Clarity" },
    { name: "Slate Grey", hex: "#64748B", description: "Balance" },
    { name: "Soft Indigo", hex: "#E0E7FF", description: "Creativity" },
    { name: "Deep Navy", hex: "#1E293B", description: "Depth" }
  ],
  brandValues: [
    { title: "Innovation", description: "Driving change through new ideas." },
    { title: "Integrity", description: "Building trust with honesty." }
  ]
};

const DEFAULT_GUIDES: Record<string, string[]> = {
  brandName: ["브랜드의 핵심 가치를 한 단어로 표현한다면?", "기억하기 쉬운 짧은 이름인가요, 의미가 담긴 이름인가요?", "어떤 언어(한글, 영어, 라틴어 등)를 선호하시나요?"],
  philosophy: ["이 브랜드를 시작하게 된 결정적 계기는 무엇인가요?", "고객에게 절대 타협하지 않을 한 가지 약속은 무엇인가요?", "세상을 어떻게 긍정적으로 바꾸고 싶나요?"],
  slogan: ["고객의 뇌리에 꽂힐 한 문장은 무엇인가요?", "브랜드의 성격을 가장 잘 나타내는 형용사는?", "경쟁사와 구분되는 우리만의 말투는?"],
  coreTechnology: ["우리만 가지고 있는 특별한 기술이나 노하우는 무엇인가요?", "경쟁사가 쉽게 따라할 수 없는 진입 장벽은?", "숫자로 증명할 수 있는 스펙이 있나요?"],
  coreStrategy: ["시장 진입을 위한 초기 필승 전략은 무엇인가요?", "어떤 채널을 통해 고객을 만날 계획인가요?", "수익을 극대화할 수 있는 비즈니스 모델은?"],
  brandMent: ["고객에게 말을 걸 때 어떤 톤(친근한, 전문적인, 위트있는)을 사용하나요?", "브랜드를 사람으로 비유한다면 누구인가요?", "고객이 우리 브랜드를 보고 첫마디로 뭐라고 하길 원하나요?"],
  targetAudience: ["이 제품/서비스가 없으면 안 되는 핵심 고객은 누구인가요?", "그들의 연령, 직업, 라이프스타일은?", "그들이 현재 겪고 있는 가장 큰 불만은 무엇인가요?"],
  genZValue: ["Gen-Z 세대가 이 브랜드에 열광할 '힙한' 포인트는?", "SNS에 공유하고 싶은 시각적/경험적 요소는?", "그들의 가치관(환경, 공정성 등)과 어떻게 연결되나요?"],
  customerCulture: ["고객들이 우리 브랜드를 통해 어떤 문화를 향유하길 원하나요?", "브랜드 팬덤이 모여서 어떤 활동을 하길 기대하나요?", "우리 브랜드가 주도할 새로운 트렌드는?"],
  comparativeAdvantage: ["경쟁사 대비 압도적으로 뛰어난 한 가지는 무엇인가요?", "고객이 경쟁사 대신 우리를 선택해야 할 결정적 이유는?", "우리가 해결한 경쟁사의 치명적 단점은?"],
  qualityLevel: ["품질 기준을 어디에 두고 있나요? (타협 없는 최고급 vs 가성비)", "품질 유지를 위한 구체적인 관리 시스템은?", "고객이 체감할 수 있는 품질 요소는?"],
  priceLevel: ["시장 가격 대비 어떤 포지션을 취할 것인가요?", "가격 이상의 가치를 어떻게 증명할 것인가요?", "초기 진입 가격 전략은?"],
  functionalBenefit: ["고객의 어떤 구체적인 고통(Pain Point)을 해결해주나요?", "사용 후 즉각적으로 느껴지는 편리함은?", "이 제품이 고객의 시간을 얼마나 아껴주나요?"],
  experientialBenefit: ["구매 과정에서 고객이 느낄 특별한 감정은?", "서비스 이용 중 경험할 수 있는 즐거움은?", "오감을 만족시키는 요소가 있나요?"],
  symbolicBenefit: ["이 브랜드를 사용하는 것이 고객의 이미지를 어떻게 높여주나요?", "고객의 자존감이나 소속감을 어떻게 충족시키나요?", "사회적으로 어떤 긍정적 메시지를 전달하나요?"],
  keywords: ["브랜드를 대표하는 핵심 키워드 5가지는?", "검색엔진에서 우리를 찾을 때 입력할 단어는?", "해시태그로 사용하고 싶은 단어들은?"],
  customerManagement: ["한 번 구매한 고객을 어떻게 단골로 만들 것인가요?", "충성 고객에게 제공할 특별한 혜택은?", "고객의 피드백을 어떻게 반영할 계획인가요?"]
};

// --- Helper for robust JSON extraction ---
const cleanAndParseJson = (text: string): any => {
  try {
    // 1. Remove Markdown Code Blocks
    let cleanText = text.replace(/```json\s*([\s\S]*?)\s*```/gi, '$1');
    cleanText = cleanText.replace(/```\s*([\s\S]*?)\s*```/gi, '$1');

    // 2. Find the absolute first '{' and last '}'
    const firstOpen = cleanText.indexOf('{');
    const lastClose = cleanText.lastIndexOf('}');

    if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
      cleanText = cleanText.substring(firstOpen, lastClose + 1);
    } else {
      throw new Error("No valid JSON object found in response");
    }

    // 3. Attempt parsing
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Extraction Failed. Raw text:", text);
    // Return null so the caller can handle default fallback
    return null;
  }
};

const SYSTEM_INSTRUCTION = `
당신은 고객 가치 창조를 최우선으로 하는 비즈니스 전략가입니다.
단, **결과물에는 절대로 특정 이론의 이름이나 저자의 이름을 언급하지 마세요.**

[당신의 내부 전략 철학 - 이 내용을 결과물에 노출하지 말 것]

**1. 경쟁 시장에서 새로운 대안 찾기 (레드오션 철학)**
- 경쟁이 치열한 시장이야말로 진정한 기회의 장입니다
- 경쟁이 없다는 것은 고객 수요가 작거나 돈이 모이지 않는다는 신호일 수 있습니다
- 기존 시장에서 고객의 욕망을 파악하고 남들과 다른 대안을 제시하는 데 집중하세요
- 질문할 때: "이 치열한 시장에서 아직 해결되지 않은 고객의 진짜 갈등은 무엇인가요?"

**2. 신뢰 구축의 핵심 (믿을 만한 근거 만들기)**
- 고객은 주장보다 증거를 믿습니다
- "왜 당신을 믿어야 하는가?"에 대한 명확한 답(RTB: Reason to Believe)이 있어야 합니다
- 측정 가능한 수치, 제3자 인증, 고객 후기 등 구체적 증거를 제시하세요
- 질문할 때: "고객이 '진짜 효과가 있구나'라고 확신할 수 있는 구체적 근거는 무엇인가요?"

**3. 고객 관여도에 따른 전략 차별화**
- 고관여 제품(자동차, 부동산): 핵심 정보와 스펙에 집중
- 저관여 제품(생수, 과자): 유명인 모델, 패키지 디자인 같은 주변 단서 활용
- 질문할 때: "고객이 이 제품을 구매할 때 얼마나 고민하고 비교할까요?"

**4. 시장 지배 전략 (최초, 차별화, 압도)**
- 최초: 카테고리를 새로 만들어 선점하기
- 차별화: 남들과 확실히 다른 한 가지 속성으로 승부
- 압도: 모든 면에서 압도적으로 뛰어나기
- 질문할 때: "우리가 선택할 수 있는 전략은 최초, 차별화, 압도 중 어느 것인가요?"

**5. 시장 세분화 전략 (서브타이핑)**
- 전체 시장을 나누어 특정 하위 시장에서 1등을 목표로 하세요
- 좁은 시장에서의 1등이 넓은 시장에서의 3등보다 강력합니다
- 질문할 때: "전체 고객이 아닌, 우리가 압도적 1위가 될 수 있는 좁은 타겟은 누구인가요?"

**6. 고객 이탈 방지 전략 (고객 록인 설계)**
- 고객이 경쟁사로 쉽게 떠나지 못하게 하는 심리적·실질적 장치를 설계하세요
- 높은 전환 비용, 매력적인 로열티 프로그램, 대체 불가능한 경험 제공
- 질문할 때: "고객이 우리를 떠나려 할 때 '아, 그래도 여기가 낫지'라고 생각하게 만드는 요소는 무엇인가요?"

**7. 가격 심리 전략**
- 고객은 절대적 가격보다 '가격 비교를 멈추게 하는 메시지'에 영향받습니다
- "최저가 보상제", "가격 대비 가치 입증" 등의 심리적 장치 활용
- 질문할 때: "고객이 가격 비교를 멈추고 '이 정도면 합리적이야'라고 생각하게 만드는 방법은?"

**8. 제품의 3단계 (핵심 - 실제 - 확장)**
- 핵심: 고객이 진짜 얻는 편익 (자동차 → 이동 수단)
- 실제: 제품의 물리적 속성 (디자인, 성능, 브랜드)
- 확장: 추가 서비스와 경험 (AS, 커뮤니티, 특별 이벤트)
- 경쟁 우위는 확장 제품의 디테일에서 나옵니다
- 질문할 때: "핵심 기능을 넘어, 고객에게 특별한 경험을 주는 우리만의 디테일은?"

[브랜드 페르소나 정의: "우리 브랜드가 사람이라면?"]
1. **정의:** 브랜드 페르소나는 브랜드의 '인격'입니다. "우리는 누구인가?"에 대한 답이며, 고객과 감정적 유대감을 형성하는 것이 목표입니다.
2. **차이점:** '고객 페르소나(타겟)'가 아니라 **'브랜드 페르소나(나 자신)'**를 정의하는 것입니다. 우리의 성격, 말투, 행동 방식을 구체화하세요.

[작성 절대 금지어 - 위반 시 시스템 오류로 간주함]
1. **'신병철', '신병철 박사', '논백', '논백경쟁', 'Non-Zero Sum'**
2. **'중간계', 'Middle Earth', '가두리론', '칩칩 사운드'**
3. **'레드오션', '블루오션', '서브타이핑' 같은 전문 이론 용어**
4. **'존재론적', '본질적 결핍', '패러다임' 등 현학적인 용어**

[핵심 원칙: '직장인 주니어'도 이해하는 쉬운 언어]
1. **쉽고 명확하게:** "고객이 무엇 때문에 힘들어하나요?", "우리는 그걸 어떻게 해결해주나요?" 처럼 직관적인 언어를 사용하세요.
2. **논리는 깊게, 표현은 쉽게:** 전략의 깊이는 유지하되, 표현은 누구나 이해할 수 있는 **평이한 한국어**를 사용하세요.
3. **영어 병기 금지:** 괄호 안에 영어를 쓰지 마세요.
4. **블로그/SNS 말투 금지:** "~해요" 대신 명확한 서술형 어미를 사용하되, 문장은 간결해야 합니다.
5. **이론 용어는 사고에만:** 위의 전략 철학을 사고 과정에는 적용하되, 결과물에는 이론 용어를 절대 쓰지 마세요.
`;

// --- Standard Generation (Simple Mode) ---
export const generateBrandPersonaData = async (request: AnalysisRequest, apiKey?: string): Promise<BrandPersona> => {
  const { idea, url, brandName, customInputs } = request;
  const ai = getAI(apiKey);

  const hasBrandName = brandName && brandName.trim().length > 0;
  const brandNameInstruction = hasBrandName
    ? `[확정된 브랜드명]: "${brandName}"`
    : `[확정된 브랜드명]: 없음 (공란). \n[중요]: 당신이 이 사업 아이디어에 가장 잘 어울리는 **브랜드 네이밍을 직접 창작**하여 'brandName' 필드에 입력하세요. 절대로 '미정'이라고 적지 마세요.`;

  let customInstructions = "";
  if (customInputs) {
    Object.entries(customInputs).forEach(([key, value]) => {
      if (value && value.trim().length > 0) {
        customInstructions += `- ${key}: ${value}\n`;
      }
    });
  }

  const prompt = `
    ${SYSTEM_INSTRUCTION}

    [입력 정보]
    - 브랜드/사업 아이디어: ${idea}
    - 참고 URL: ${url || "없음"}
    ${brandNameInstruction}
    ${customInstructions ? `[사용자 추가 가이드]\n${customInstructions}` : ""}

    [간편 생성 작성 지침]
    1. **브랜드명 창작:** 입력된 브랜드명이 없다면 반드시 창작하세요.
    2. **분량:** 각 항목은 **300자 내외**로 핵심만 쉽게 작성하세요.
    3. **톤:** 쉽고 명확한 전략 문서 톤.
    4. **출력 포맷:** 오직 순수한 JSON 문자열만 반환하세요.

    [요청 사항]
    JSON 객체로 반환하세요. 필드는 총 17개 + Pomelli 입니다.
    반드시 다음 필드 구조를 따르세요:
    {
      "brandName": "...",
      "brandNameSuggestions": ["...", ...],
      "philosophy": "...",
      "slogan": "...",
      "coreTechnology": "...",
      "coreStrategy": "...",
      "brandMent": "...",
      "targetAudience": "...",
      "genZValue": "...",
      "customerCulture": "...",
      "comparativeAdvantage": "...",
      "qualityLevel": "...",
      "priceLevel": "...",
      "functionalBenefit": "...",
      "experientialBenefit": "...",
      "symbolicBenefit": "...",
      "keywords": ["...", ...],
      "customerManagement": "...",
      "pomelli": {
        "businessOverview": "...",
        "tagline": "...",
        "brandArchetype": "...",
        "toneOfVoice": ["...", ...],
        "brandAesthetic": ["...", ...],
        "typography": "...",
        "colors": [{"name": "...", "hex": "...", "description": "..." }, ...],
        "brandValues": [{"title": "...", "description": "..." }, ...]
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        safetySettings: SAFETY_SETTINGS
      }
    });

    const text = response.text || "";
    let result = cleanAndParseJson(text);

    // Fallback for parsing failure or missing pomelli
    if (!result) {
      throw new Error("데이터 파싱에 실패했습니다.");
    }
    if (!result.pomelli) {
      result.pomelli = DEFAULT_POMELLI;
    }

    return result as BrandPersona;
  } catch (error: any) {
    console.error("Error generating brand persona:", error);
    throw error; // Re-throw to let UI handle it
  }
};

// --- Builder Mode Functions ---

export const generatePlanningGuides = async (idea: string, brandName?: string, apiKey?: string): Promise<Record<string, string[]>> => {
  const fieldsList = FIELD_METADATA.map(f => f.key).join(", ");
  const ai = getAI(apiKey);

  // 서버 측 입력 검증 (이중 안전장치)
  // 클라이언트 검증을 우회한 경우를 대비
  const validation = await import('../utils/validation').then(m => m.validateBrandIdea(idea));
  if (!validation.isValid) {
    console.warn('[Input Validation Failed]', validation.errorMessage);
    throw new Error(validation.errorMessage || "유효하지 않은 브랜드 아이디어입니다. 최소 10자 이상의 구체적인 내용을 작성해주세요.");
  }

  const prompt = `
    ${SYSTEM_INSTRUCTION}
    
    사용자 아이디어: "${idea}"
    브랜드명: "${brandName || "미정"}"

    [당신의 역할: 사려깊은 브랜드 전략 멘토]
    당신은 사용자의 생각을 자연스럽게 이끌어내는 선생님입니다.
    강요하거나 윽박지르지 말고, 부드럽게 질문하며 사고의 길을 열어주세요.
    사용자가 "아, 이렇게 생각하면 되는구나!"라고 깨달을 수 있도록 안내하세요.

    [질문 작성의 핵심 철학: 사이먼 시넥의 Golden Circle]
    
    **시작은 항상 WHY부터 (Start with Why)**
    - "무엇을 하는가"보다 "왜 하는가"가 먼저입니다
    - 고객도 "무엇"이 아니라 "왜"를 듣고 감동합니다
    - 질문도 항상 본질과 이유에서 시작해야 합니다
    
    **Golden Circle의 3단계 적용:**
    1. **WHY (왜)** - 믿음, 목적, 이유 (사용자가 가진 신념을 찾게 하기)
    2. **HOW (어떻게)** - 방법, 과정, 차별화 (그 신념을 어떻게 실현할지)
    3. **WHAT (무엇)** - 결과, 산출물, 구체적 형태 (눈에 보이는 결과물)

    [질문의 논리적 흐름 - 중요!]
    
    **사용자의 현재 상태를 고려하세요:**
    - 브랜드명이 없다면 → 먼저 "어떤 가치를 담고 싶은지" 묻고 → "어떤 스타일인지" 묻고 → "구체적 후보는?" 순서
    - 철학이 정해지지 않았다면 → "왜 이 일을 시작했는지" 묻고 → 점차 구체화
    - **절대 없는 것을 있다고 가정하지 마세요**
    
    **톤과 태도 (필수):**
    - ❌ "~해야만 합니다", "~하십시오" (강압적)
    - ✅ "~를 떠올려보세요", "~는 어떤가요?", "~를 생각해보면 어떨까요?" (부드러운 안내)
    - ❌ "왜 이것을 써야만 하냐" (심문조)
    - ✅ "어떤 마음으로 이것을 선택하시겠어요?" (대화조)

    [질문 생성 구체적 규칙]
    
    **길이:** 각 질문은 2-3문장
    - 첫 문장: 핵심 질문
    - 두 번째 문장: 구체적 예시나 생각의 방향
    - 세 번째 문장(선택): 심화 질문
    
    **3가지 질문의 흐름 (Why → How → What):**
    
    1. **질문 1 - WHY (본질과 신념)**
       - 이 항목에 담고 싶은 핵심 가치, 믿음, 이유를 찾게 하기
       - "왜 이 사업을 하시나요?", "고객에게 주고 싶은 근본적인 가치는 무엇인가요?"
       - 추상적이어도 괜찮습니다. 진심을 찾는 단계입니다.
    
    2. **질문 2 - HOW (방법과 스타일)**
       - 그 가치를 어떻게 표현하고 전달할 것인지
       - 스타일, 톤, 방식, 접근법의 차이
       - "친근하게? 전문적으로?", "한글? 영어?", "따뜻하게? 강렬하게?"
    
    3. **질문 3 - WHAT (구체적 결과물)**
       - 실제로 무엇을 만들지, 어떤 형태로 보여줄지
       - 측정 가능하고 관찰 가능한 것
       - "떠오르는 키워드는?", "구체적인 문구는?", "후보안 3가지는?"

    [각 항목별 구체적 질문 예시 - 반드시 참고하세요]
    
    **브랜드명 (brandName) - 아직 이름이 없는 상태에서 시작:**
    - WHY: "우리 브랜드를 통해 고객에게 전하고 싶은 핵심 감정이나 가치는 무엇인가요? 행복, 신뢰, 혁신, 편안함 중 어떤 것에 가까울까요?"
    - HOW: "그 가치를 이름으로 표현한다면, 어떤 스타일이 좋을까요? 세련된 영어, 친근한 한글, 독특한 조어 중 어떤 느낌을 선호하시나요?"
    - WHAT: "머릿속에 떠오르는 키워드나 후보 이름이 있다면 3가지 정도 나열해주세요. 없다면 연상되는 단어들을 적어주셔도 좋습니다."
    
    **브랜드 철학 (philosophy):**
    - WHY: "이 사업을 시작하게 된 가장 근본적인 이유는 무엇인가요? 창업자님의 개인적 경험이나 느낀 문제가 있다면 말씀해주세요."
    - HOW: "그 문제를 해결하기 위해 우리가 가져야 할 태도나 원칙은 무엇일까요? 절대 타협하지 않을 한 가지 가치가 있다면요?"
    - WHAT: "10년 후에도 변하지 않을, 우리 브랜드의 불변의 신념을 한 문장으로 표현한다면 무엇일까요?"
    
    **핵심 전략 (coreStrategy):**
    - WHY: "시장에서 우리가 해결하고자 하는 고객의 근본적인 갈등은 무엇인가요? 기존 시장은 왜 그 갈등을 해결하지 못하고 있을까요?"
    - HOW: "그 갈등을 해결하기 위한 우리만의 독특한 접근 방식은 무엇인가요? 경쟁사와 근본적으로 다른 점이 있다면요?"
    - WHAT: "구체적으로 어떤 채널, 방법, 순서로 고객을 만나고 가치를 전달할 건가요? 초기 6개월 계획을 간단히 요약해주세요."
    
    **타겟 고객 (targetAudience):**
    - WHY: "우리 브랜드가 없으면 가장 힘들어할 사람은 누구일까요? 그들이 현재 겪고 있는 진짜 고민은 무엇인가요?"
    - HOW: "그들은 어떤 라이프스타일을 살고, 어떤 가치를 중요하게 생각하나요? SNS는 어떤 걸 쓰고, 여가는 어떻게 보낼까요?"
    - WHAT: "구체적으로 나이, 성별, 직업, 소득 수준을 정의해주세요. 한 명의 대표 고객을 떠올려 이름과 하루 일과를 상상해보세요."

    **기능적 혜택 (functionalBenefit):**
    - WHY: "고객이 우리 제품/서비스를 쓰기 전에 겪는 가장 큰 불편함은 무엇인가요? 어떤 문제가 해결되지 않아 답답해하나요?"
    - HOW: "우리는 그 문제를 어떤 방식으로 해결해주나요? 기존 방식과 비교했을 때 어떤 점이 더 편리하거나 빠를까요?"
    - WHAT: "측정 가능한 효과가 있나요? '30% 더 빠르게', '50% 비용 절감', '3시간 절약' 같은 구체적 수치로 표현해주세요."

    [절대 금지 사항]
    1. **강압적 톤 금지**: "~해야만 합니다", "~하십시오"
    2. **논리적 비약 금지**: 없는 것을 있다고 가정하지 말 것
    3. **이론 용어 노출 금지**: "골든서클", "논백", "행동경제학" 같은 용어는 질문 텍스트에 절대 포함하지 말 것
    4. **천편일률 금지**: "무엇입니까?"를 3번 반복하지 말 것
    5. **심문조 금지**: "왜 이것을 선택했습니까?" 대신 "어떤 마음으로 선택하셨나요?"

    [좋은 질문의 예시]
    ✅ "고객이 우리 피시방을 찾는 가장 큰 이유는 무엇일까요? 단순히 게임만이 아니라, 어떤 경험이나 감정을 원할까요?"
    ✅ "그 경험을 브랜드 이름으로 표현한다면, 어떤 느낌이 좋을까요? 짜릿함, 편안함, 프리미엄, 친근함 중 어떤 방향을 생각하시나요?"
    ✅ "머릿속에 떠오르는 단어나 후보 이름이 있다면 자유롭게 나열해주세요. 완벽하지 않아도 괜찮습니다."

    [나쁜 질문의 예시]
    ❌ "왜 이 이름을 써야만 할까요? 단순히 예쁜 이름이 아니라, 우리 피시방이 고객에게 제공하는 근본적인 즐거움과 맞춤 경험의 핵심을 담아낼 수 있어야 합니다."
    → 문제: 1) 이름이 없는데 "왜 이 이름을"이라고 가정, 2) "~해야만 합니다" 강압적 톤, 3) 논리적 순서 무시

    대상 항목: ${fieldsList}
    
    [최종 출력]
    각 항목마다 3가지 질문(Why, How, What)을 생성하세요.
    - 부드럽고 안내하는 톤
    - 논리적이고 단계적인 흐름
    - 사용자의 현재 상태를 고려한 질문
    - 구체적 예시를 포함하여 이해를 돕기
    
    응답 포맷 (JSON):
    {
      "brandName": ["WHY 질문 (2-3문장)", "HOW 질문 (2-3문장)", "WHAT 질문 (2-3문장)"],
      "philosophy": ["WHY 질문", "HOW 질문", "WHAT 질문"],
      ...
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        safetySettings: SAFETY_SETTINGS
      }
    });
    const text = response.text || "";
    const parsed = cleanAndParseJson(text);
    return parsed || DEFAULT_GUIDES;
  } catch (error: any) {
    console.warn("AI Guide Generation Failed, falling back to defaults:", error);
    return DEFAULT_GUIDES;
  }
};

// 2. Generate Draft for a SINGLE field (Pro Mode)
export const generateFieldDraft = async (
  fieldKey: string,
  idea: string,
  userInputs: string[], // Array input
  guides: string[],
  context: string,
  brandName?: string,
  apiKey?: string
): Promise<string> => {

  const finalBrandName = brandName || "미정";
  const ai = getAI(apiKey);
  const isBrandNameField = fieldKey === 'brandName';

  // Construct Q&A format
  const qnaContext = guides.map((q, i) => `[질문 ${i + 1}]: ${q}\n[답변 ${i + 1}]: ${userInputs[i] || "답변 없음"}`).join("\n\n");

  // Special instruction for Brand Name field
  const brandNameInstruction = isBrandNameField
    ? `
      **[중요: 브랜드 네이밍 미션]**
      현재는 '브랜드명'을 정하는 단계입니다.
      사용자의 답변(가치, 스타일, 후보안)을 종합하여 **가장 완벽한 브랜드명을 창작해서 제안하세요.**
      (사용자가 구체적인 후보를 줬다면 그것을 다듬어서 확정하고, 없다면 새로 만드세요.)

      작성 시, **그 브랜드명을 문장의 주어로 사용하여** 이야기를 풀어가세요.
      "우리의 브랜드명은..." 같은 설명조 대신, 바로 "${finalBrandName}은..." 처럼 시작하세요.
      `
    : `
      [확정된 브랜드명]: ${finalBrandName}
      **[작성 원칙]**: 반드시 위 브랜드명("${finalBrandName}")을 주어로 사용하여 구체적으로 서술하세요.
      `;

  const prompt = `
    ${SYSTEM_INSTRUCTION}

    현재 작성 중인 항목: "${fieldKey}"
    브랜드 아이디어: "${idea}"

    ${brandNameInstruction}

    [사용자와의 심층 인터뷰 (Q&A - Why/How/What)]
    ${qnaContext}

    [문맥 - 이미 작성된 다른 항목들]: ${context}

    [요청]
    1. **이전 항목 반영**: 이미 작성된 다른 항목 내용을 고려하여 다음 항목을 생성하세요.
    2. **논리적 흐름**: 이전에 작성된 내용과 현재 사용자 입력을 통합하여 하나의 일관된 스토리로 연결하세요.
    3. **사용자 입력 중시**: 사용자의 답변을 핵심으로 하되, 기존 내용과 조화를 이루도록 하세요.
    4. **상호작용적 생성**: 이 항목이 완성되면, 향후 다른 항목에 어떤 영향을 미칠지 고려하여 작성하세요.

    사용자의 답변은 **[Why(신념) -> How(방식) -> What(결과)]**의 논리로 구성되어 있습니다.
    이 흐름을 완벽하게 연결하여, **진정성 있고 깊이 있는 전략 정의(Definition)**를 작성하세요.

    **작성 지침 (필수 준수):**
    1. **논리적 통합:** 3가지 답변을 따로국밥으로 나열하지 말고, "우리는 [Why]하기 때문에, [How]하게 행동하며, 결국 [What]을 만듭니다."라는 식의 하나의 이야기로 엮으세요.
    2. **형식의 자유:** 천편일률적인 소제목을 강제하지 않습니다. 내용의 흐름에 가장 자연스러운 구조를 선택하세요.
    3. **브랜드 페르소나 몰입:** 브랜드가 살아있는 인격체로서 자신의 신념을 고백하듯 작성하세요.
    4. **쉬운 언어:** 현학적인 용어는 피하고, 진심이 느켜지는 명확한 언어를 사용하세요.
    5. **밀도 있는 분량:** 350자 내외.

    **[목표]**
    단순한 정보 나열이 아니라, 읽는 사람(내부 직원, 고객)의 마음을 움직이는 **'브랜드 매니페스토'** 수준의 글을 완성하세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        safetySettings: SAFETY_SETTINGS
      }
    });
    return response.text || "내용을 생성할 수 없습니다.";
  } catch (error: any) {
    console.error(`Error generating draft for ${fieldKey}:`, error);
    throw error;
  }
};

// 3. Finalize and Assemble
export const finalizePersona = async (idea: string, builderState: BuilderState, apiKey?: string): Promise<BrandPersona> => {

  const ai = getAI(apiKey);
  // Assemble drafts directly (No re-generation to avoid errors)
  const basePersona: any = {};
  FIELD_METADATA.forEach(field => {
    basePersona[field.key] = builderState[field.key]?.draft || "내용 없음";
  });
  basePersona.brandNameSuggestions = [];

  // Generate only Pomelli DNA
  const summary = Object.entries(basePersona)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  const prompt = `
    ${SYSTEM_INSTRUCTION}

    [완성된 브랜드 전략]:
    ${summary}

    위 브랜드 전략을 바탕으로 "Pomelli (Business DNA)" 섹션만 생성하세요.

    [요청 사항]
    JSON 포맷으로 Pomelli 데이터만 반환하세요.
    색상(Colors)은 최소 5가지(Main, Secondary, Accent, Neutral 1, Neutral 2)를 포함해야 합니다.
    
    반드시 다음 JSON 구조를 따르세요:
    {
         "businessOverview": "...",
         "tagline": "...",
         "brandArchetype": "...",
         "toneOfVoice": ["...", ...],
         "brandAesthetic": ["...", ...],
         "typography": "...",
         "colors": [{"name": "...", "hex": "...", "description": "..." }, ...],
         "brandValues": [{"title": "...", "description": "..." }, ...]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        safetySettings: SAFETY_SETTINGS
      }
    });

    const text = response.text || "";
    const pomelliData = cleanAndParseJson(text) || DEFAULT_POMELLI;

    const finalPersona: BrandPersona = {
      ...basePersona,
      pomelli: pomelliData
    };

    return finalPersona;
  } catch (error: any) {
    console.error("Error finalizing persona:", error);
    throw error;
  }
};
