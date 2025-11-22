
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { BrandPersona, AnalysisRequest, CustomInputs, PersonaFieldKey, FieldGuide, FIELD_METADATA, BuilderState } from "../types";

// [보안 및 안정성 최우선 설정]
const apiKey = process.env.REACT_APP_GEMINI_API_KEY || "AIzaSyAA1mo8-okhJFyAb7muzyeIZsel0x7vSs0";

const ai = new GoogleGenAI({ apiKey: apiKey });

// --- Global Safety Settings ---
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH }
];

// --- Fallback Guides ---
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
    let cleanText = text.replace(/```json\s*([\s\S]*?)\s*```/gi, '$1');
    cleanText = cleanText.replace(/```\s*([\s\S]*?)\s*```/gi, '$1');

    const firstOpen = cleanText.indexOf('{');
    const lastClose = cleanText.lastIndexOf('}');
    
    if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
      cleanText = cleanText.substring(firstOpen, lastClose + 1);
    }
    
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Extraction Failed. Raw text:", text);
    throw new Error("AI 응답 형식이 올바르지 않습니다. 다시 시도해주세요.");
  }
};

// --- High Quality Reference Example ---
const EXCELLENT_EXAMPLE = `
[Tone & Manner Reference: 더 벙커 (The Bunker)]
1. 브랜드철학: "게이머의 1초를 지배하다". 우리는 단순한 PC방이 아닌 'e스포츠 아레나'를 지향합니다. 승부를 결정짓는 하이엔드 스펙으로 프로게이머급 환경을 제공합니다.
2. 핵심기술: "G-Sync Ultimate Zone". 전 좌석 RTX 4080, 360Hz 모니터. 미세먼지와 담배 냄새를 0으로 만드는 '퓨어 에어 챔버'.
3. 핵심전략: "Shop-in-Shop Gastronomy". PC 이용료 외에 자체 F&B 브랜드 '벙커 키친'을 통해 객단가를 극대화하는 전략.
`;

const SYSTEM_INSTRUCTION = `
당신은 신병철 박사의 '논백경쟁전략(Non-Zero Sum Competition Strategy)'을 완벽하게 구사하는 브랜드 전략가이자, 매력적인 카피라이터입니다.

[작성 절대 원칙]
1. **영어 병기 절대 금지 (Zero Tolerance):** 
   - '핵심 전략 (Core Strategy)' 처럼 괄호 안에 영어를 쓰는 행위를 절대 금지합니다.
   - 오직 완벽하고 유려한 **한국어**만 사용하세요.

2. **신병철 박사의 논백경쟁전략 적용:**
   - 고객과 브랜드가 모두 이기는 'Non-Zero Sum' 구조를 설계하세요.
   - 고객의 **'결정적 갈등(Conflict)'**을 해소하는 **'압도적 솔루션'**을 제시하세요.

3. **카피라이팅 톤:**
   - 논문처럼 딱딱하게 쓰지 마세요.
   - 독자를 설득하는 세련된 제안서 톤으로 작성하세요.
   - 구체적인 숫자와 고유 명사를 사용하세요.
`;

// --- Standard Generation (Simple Mode) ---
export const generateBrandPersonaData = async (request: AnalysisRequest): Promise<BrandPersona> => {
  const { idea, url, brandName, customInputs } = request;

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
    2. **분량:** 각 항목은 **300자 이상, 500자 내외**로 작성하세요.
    3. **톤:** 매력적인 카피라이팅 톤 유지. 영어 병기 금지.

    [요청 사항]
    JSON 객체로 반환하세요. 필드는 총 17개 + Pomelli 입니다.
    
    반드시 JSON 포맷만 반환하세요.
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

    const text = response.text;
    if (!text) throw new Error("No data returned");
    return cleanAndParseJson(text) as BrandPersona;
  } catch (error: any) {
    console.error("Error generating brand persona:", error);
    throw new Error(`생성 중 오류가 발생했습니다: ${error.message}`);
  }
};

// --- Builder Mode Functions ---

export const generatePlanningGuides = async (idea: string, brandName?: string): Promise<Record<string, string[]>> => {
  const fieldsList = FIELD_METADATA.map(f => f.key).join(", ");
  
  const prompt = `
    당신은 신병철 박사의 '논백경쟁전략' 전문가입니다.
    사용자 아이디어: "${idea}"
    브랜드명: "${brandName || "미정"}"

    다음 17가지 항목에 대해 사용자에게 질문할 "기획 가이드(질문)" 3가지를 제안하세요.
    고객의 갈등(Conflict)을 찾아내고, 경쟁 우위를 점할 수 있는 질문이어야 합니다.

    대상 항목: ${fieldsList}
    
    응답 포맷 (JSON):
    {
      "philosophy": ["질문1", "질문2", "질문3"],
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
    const text = response.text;
    if (!text) throw new Error("No guides returned");
    return cleanAndParseJson(text);
  } catch (error: any) {
    console.warn("AI Guide Generation Failed, falling back to defaults:", error);
    return DEFAULT_GUIDES;
  }
};

// 2. Generate Draft for a SINGLE field (Pro Mode)
// Updated to handle array of user inputs and stricter length limits
export const generateFieldDraft = async (
  fieldKey: string, 
  idea: string, 
  userInputs: string[], // Array input
  guides: string[],     
  context: string,
  brandName?: string
): Promise<string> => {

  const finalBrandName = brandName || "미정";

  // Construct Q&A format
  const qnaContext = guides.map((q, i) => `질문 ${i+1}: ${q}\n사용자 답변 ${i+1}: ${userInputs[i] || "답변 없음"}`).join("\n\n");

  const prompt = `
    ${SYSTEM_INSTRUCTION}
    
    [확정된 브랜드명]: ${finalBrandName}
    현재 작성 중인 항목: "${fieldKey}"
    브랜드 아이디어: "${idea}"
    
    [사용자와의 인터뷰 내용 (Q&A)]
    ${qnaContext}

    [문맥 - 이미 작성된 다른 항목들]: ${context}

    [요청]
    사용자의 3가지 답변을 종합하여 항목(${fieldKey})을 작성하세요.
    
    **심층 기획 작성 지침 (필수 준수):**
    1. **분량 제한:** 총 분량은 **500자~600자** 내외로 작성하세요. (1000자는 너무 깁니다. 핵심만 타격감 있게 전달하세요.)
    2. **영어 병기 절대 금지:** 괄호 안에 영어를 쓰지 마세요.
    3. **구조:**
       - **[헤드라인]**: 강렬한 한 줄 요약
       - **1. 갈등의 발견**: 고객의 숨겨진 고통 (짧게)
       - **2. 압도적 솔루션**: 논백경쟁 기반의 해결책 (짧게)
       - **3. 실행 포인트**: 구체적인 차별화 요소 3가지 (불렛 포인트)
       - **4. 기대 효과**: 시장에서의 위상 (짧게)
       
       위 구조를 유지하되, 문장은 간결하고 세련되게 다듬어주세요.
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
    return `오류 발생: ${error.message || "알 수 없는 오류"}.`;
  }
};

// 3. Finalize and Assemble
export const finalizePersona = async (idea: string, builderState: BuilderState): Promise<BrandPersona> => {
  
  const basePersona: any = {};
  FIELD_METADATA.forEach(field => {
      basePersona[field.key] = builderState[field.key]?.draft || "내용 없음";
  });
  
  basePersona.brandNameSuggestions = [];

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

    {
         "businessOverview": "한 줄 요약",
         "tagline": "짧은 영문 태그라인",
         "brandArchetype": "브랜드 원형",
         "toneOfVoice": ["형용사1", "형용사2", ...],
         "brandAesthetic": ["시각적 키워드1", "키워드2", ...],
         "typography": "폰트 추천",
         "colors": [{"name": "Main Color", "hex": "#...", "description": "..." }, ... (최소 5개)],
         "brandValues": [{"title": "가치1", "description": "..." }, ...]
    }
    
    반드시 JSON 포맷만 반환하세요.
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
    
    const text = response.text;
    if (!text) throw new Error("No data returned");

    const pomelliData = cleanAndParseJson(text);

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
