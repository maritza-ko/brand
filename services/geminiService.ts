
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { BrandPersona, AnalysisRequest, CustomInputs, PersonaFieldKey, FieldGuide, FIELD_METADATA, BuilderState } from "../types";

// API Key needs to be quoted as a string literal
// IMPORTANT: The user requested to hardcode the API key here.
const ai = new GoogleGenAI({ apiKey: "AIzaSyCMO5BlFviSyKVLDo0eZu0xdbdbutC_f9c" });

// --- Global Safety Settings (Relaxed to prevent false positives) ---
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH }
];

// --- Fallback Guides (Prevents app crash if AI fails) ---
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
    // 1. Remove Markdown code blocks strictly
    let cleanText = text.replace(/```json\s*([\s\S]*?)\s*```/gi, '$1');
    cleanText = cleanText.replace(/```\s*([\s\S]*?)\s*```/gi, '$1');

    // 2. Find the valid JSON object wrapper
    const firstOpen = cleanText.indexOf('{');
    const lastClose = cleanText.lastIndexOf('}');
    
    if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
      cleanText = cleanText.substring(firstOpen, lastClose + 1);
    }
    
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Extraction Failed. Raw text:", text);
    throw new Error("Failed to parse JSON response from AI.");
  }
};

// --- High Quality Reference Example (The Gold Standard) ---
const EXCELLENT_EXAMPLE = `
[Tone & Manner Reference: 더 벙커 (The Bunker)]
1. 브랜드철학: "게이머의 1초를 지배하다". 우리는 단순한 PC방이 아닌 'e스포츠 아레나'를 지향합니다. 승부를 결정짓는 하이엔드 스펙으로 프로게이머급 환경을 제공합니다.
2. 핵심기술: "G-Sync Ultimate Zone". 전 좌석 RTX 4080, 360Hz 모니터, 자체 개발 '아이스 쿨링 시트'. 그리고 매장 내 미세먼지와 담배 냄새를 0으로 만드는 '퓨어 에어 챔버(Pure Air Chamber)' 시스템.
3. 핵심전략: "Shop-in-Shop Gastronomy". PC 이용료 외에 자체 F&B 브랜드 '벙커 키친'을 통해 '맛집보다 맛있는 PC방'을 구축, 객단가를 극대화하는 전략.
4. 기능적 혜택(고통해결): '어둡고 칙칙하고 냄새나는 지하'라는 PC방의 고정관념 타파. 지상 채광 설계와 호텔급 공조 시스템으로 '여자친구와 함께 오고 싶은 쾌적한 데이트 코스'를 구현했습니다.
5. 고객문화창조: 1단계(환경 혁신: 냄새나지 않는 쾌적함) -> 2단계(장비 혁신: 집보다 좋은 최고급 사양) -> 3단계(커뮤니티: 동네 리그가 열리는 e스포츠 성지).
`;

const SYSTEM_INSTRUCTION = `
당신은 세계 최고의 브랜드 전략가(CBO)입니다. 
당신의 임무는 단순한 '설명'이 아니라, 시장을 관통하는 날카로운 '전략'과 '페르소나'를 창조하는 것입니다.

[작성 절대 원칙]
1. **독립성(Singular Focus):** 사용자가 PC방, 만화카페, 포차 중 하나의 아이디어를 입력하면, 오직 해당 업종의 특성에만 집중하세요. 절대 서로 다른 업종을 섞지 마세요.
2. **구체성(Specifics):** "좋은 시설", "맛있는 음식" 같은 추상적인 표현을 절대 금지합니다. 대신 "RTX 4080", "독립형 굴방", "레트로 네온 사인"과 같이 업종에 맞는 구체적인 스펙과 묘사를 사용하세요.
3. **문제 해결(Problem Solving):** 해당 업종의 고객이 겪는 구체적인 '고통(Pain Point)'을 정의하고, 기술적/시스템적 해결책을 제시하세요.
4. **독자적 명명(Naming):** 남들이 다 쓰는 용어 대신, 우리 브랜드만의 내부 용어(예: 퓨어 에어 챔버, 힐링 캡슐 등)를 정의하여 사용하세요.
5. **톤앤매너:** 부드러운 설명문이 아니라, 확신에 찬 '선언문'이나 전문적인 '기획서' 스타일로 작성하세요.
6. **형식(Format):** **반드시** 소제목(###), 불렛 포인트(-), 볼드체(**)를 사용하여 구조화하세요. 복잡한 표나 마크다운 블록은 사용하지 마세요.
`;

// --- Standard Generation (Simple Mode) ---
export const generateBrandPersonaData = async (request: AnalysisRequest): Promise<BrandPersona> => {
  const { idea, url, brandName, customInputs } = request;

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

    사용자가 입력한 아이디어의 업종(PC방, 만화카페, 포차 등)을 정확히 파악하고,
    그 업종의 본질에 맞는 완벽한 브랜드 페르소나 JSON을 완성하세요.
    
    [Reference Example]
    ${EXCELLENT_EXAMPLE}

    [입력 정보]
    - 브랜드/사업 아이디어: ${idea}
    - 참고 URL: ${url || "없음"}
    - 확정된 브랜드명: ${brandName || "미정"}

    ${customInstructions ? `[사용자 추가 가이드]\n${customInstructions}` : ""}

    [요청 사항]
    JSON 객체로 반환하세요.
    
    [JSON 필드 구조 (총 17개 항목 + Pomelli)]
    1. brandName
    2. brandNameSuggestions
    3. philosophy
    4. slogan
    5. coreTechnology
    6. coreStrategy
    7. brandMent
    8. targetAudience
    9. genZValue
    10. customerCulture
    11. comparativeAdvantage
    12. qualityLevel
    13. priceLevel
    14. functionalBenefit
    15. experientialBenefit
    16. symbolicBenefit
    17. keywords (Array)
    18. customerManagement
    19. pomelli: {
         businessOverview, tagline, brandArchetype, toneOfVoice[], brandAesthetic[], typography,
         colors: [{ name, hex, description }] (최소 5가지 색상: Main, Secondary, Accent, Neutral 1, Neutral 2),
         brandValues: [{ title, description }]
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
    return cleanAndParseJson(text) as BrandPersona;
  } catch (error) {
    console.error("Error generating brand persona:", error);
    throw error;
  }
};

// --- Builder Mode Functions ---

// 1. Generate Planning Guides
export const generatePlanningGuides = async (idea: string, brandName?: string): Promise<Record<string, string[]>> => {
  const fieldsList = FIELD_METADATA.map(f => f.key).join(", ");
  
  const prompt = `
    당신은 까다롭고 날카로운 브랜드 컨설팅 퍼실리테이터입니다.
    사용자 아이디어: "${idea}"
    브랜드명: "${brandName || "미정"}"

    다음 17가지 항목에 대해 사용자에게 질문할 "기획 가이드(질문)" 3가지를 제안하세요.
    업종에 맞는 구체적이고 날카로운 질문이어야 합니다.

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
  } catch (error) {
    console.warn("AI Guide Generation Failed, falling back to defaults:", error);
    // Fallback to default guides to prevent app crash
    return DEFAULT_GUIDES;
  }
};

// 2. Generate Draft for a SINGLE field
export const generateFieldDraft = async (
  fieldKey: string, 
  idea: string, 
  userInput: string, 
  context: string,
  brandName?: string
): Promise<string> => {
  
  const finalBrandName = brandName || "미정";

  const prompt = `
    ${SYSTEM_INSTRUCTION}
    
    [확정된 브랜드명]: ${finalBrandName}
    현재 작성 중인 항목: "${fieldKey}"
    브랜드 아이디어: "${idea}"
    
    [사용자의 핵심 기획 의도]: "${userInput}"
    [참고 - 다른 항목들]: ${context}

    [요청]
    위 내용을 바탕으로 항목(${fieldKey})을 작성하세요.
    설명 없이 내용만 반환하세요.
    반드시 소제목(###), 불렛 포인트(-), 볼드체(**)를 사용하여 가독성을 높이세요.
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
  } catch (error) {
    console.error(`Error generating draft for ${fieldKey}:`, error);
    return "오류가 발생했습니다. 다시 시도해주세요.";
  }
};

// 3. Finalize and Assemble
export const finalizePersona = async (idea: string, builderState: BuilderState): Promise<BrandPersona> => {
  let summary = "";
  Object.entries(builderState).forEach(([key, state]) => {
    summary += `[${key}]: ${state.draft}\n`;
  });

  const prompt = `
    ${SYSTEM_INSTRUCTION}

    [브랜드 아이디어]: ${idea}
    [확정된 브랜드 기획 내용]:
    ${summary}

    위 내용을 종합하여 최종 "BrandPersona" JSON 객체를 완성하세요.
    
    Pomelli (Business DNA) 섹션 필수 포함:
    - colors: Main, Secondary, Accent, Neutral 1, Neutral 2 등 최소 5가지 이상의 색상 팔레트.
    
    반드시 JSON 포맷만 반환하세요. 마크다운 코드 블록을 포함하지 마세요.
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
  } catch (error) {
    console.error("Error finalizing persona:", error);
    throw error;
  }
};

// --- Image Gen ---
export const generateBrandImage = async (prompt: string): Promise<string | null> => {
  try {
    // Using gemini-2.5-flash-image (Nano Banana) for unlimited usage
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        safetySettings: SAFETY_SETTINGS
      }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Gen Error", error);
    return null;
  }
};

export const generateImageWithCustomStyle = async (request: AnalysisRequest, persona: BrandPersona): Promise<string | null> => {
    const aesthetic = persona.pomelli?.brandAesthetic?.slice(0, 3).join(", ") || "Modern design";
    const colors = persona.pomelli?.colors?.slice(0, 2).map(c => c.name).join(", ") || "Brand Colors";
    const brandName = persona.brandName || "Brand";
    
    // Simple, keyword-based prompt for Nano Banana model success
    const prompt = `Interior design or Product shot for ${brandName}, ${aesthetic}, ${colors}, bright lighting, photorealistic, high quality`;

    return generateBrandImage(prompt);
};
