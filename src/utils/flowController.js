// filepath: C:\persona\brand\src\utils\flowController.js
// ...existing code...
/**
 * ?④퀎蹂?釉뚮옖???뚮옖 ?앹꽦 ?먮쫫 而⑦듃濡ㅻ윭
 * - 珥덇린紐?name_initial) -> 泥좏븰 -> ?щ줈嫄?-> ... -> 17踰???ぉ ?앹꽦
 * - 遺꾩꽍 ??18踰? 釉뚮옖?쒕챸 ?ъ젣??name_revalidated) 諛?tone_mismatch_report ?앹꽦
 *
 * 二쇱쓽: ?ㅼ젣 ?앹꽦 ?⑥닔(generatePhilosophy ????蹂꾨룄 紐⑤뱢(?먮뒗 LLM ?몄텧)濡??곌껐?섏꽭??
 */

import { analyzeTone, findToneMismatch } from "./consistencyChecker.js";

// placeholder generator ?⑥닔?????ㅼ젣 LLM/?쒕퉬?ㅻ줈 援먯껜?섏꽭??
async function generatePhilosophy(name, seed) { return `泥좏븰: ${name} 湲곕컲 泥좏븰 臾몄옣`; }
async function generateSlogan(philosophy, name) { return `?щ줈嫄? ${name} ??${philosophy.slice(0,20)}`; }
async function generateField(fieldName, context) { return `${fieldName} ?댁슜(?먮룞?앹꽦)`; }
async function generateKeywords(plan) { return ["?곸떊","吏꾩젙??]; }
async function proposeNames(plan, toneAnalysis) {
  const base = (plan.name_initial || "釉뚮옖??).replace(/\s+/g," ");
  return [
    { name: `${base} Lab`, score: 0.82 },
    { name: `${base} Studio`, score: 0.76 },
    { name: `${base} Collective`, score: 0.69 }
  ];
}

export async function createBrandPlan(initialName, userInputs = {}) {
  const plan = {};
  plan.name_initial = initialName || userInputs.name_initial || "誘몄젙 釉뚮옖?쒕챸";
  // 2踰? 釉뚮옖??泥좏븰
  plan.philosophy = await generatePhilosophy(plan.name_initial, userInputs.philosophySeed);
  // 3踰? ?щ줈嫄?
  plan.slogan = await generateSlogan(plan.philosophy, plan.name_initial);
  // 4~17踰? 媛???ぉ? ?댁쟾 ??ぉ/?꾩껜 plan??李몄“???앹꽦
  plan.brand_memo = await generateField("brand_memo", { plan });
  plan.core_tech = await generateField("core_tech", { plan });
  plan.core_strategy = await generateField("core_strategy", { plan });
  plan.competitive_attributes = [await generateField("competitive_attr1", { plan })];
  plan.customer_definition = await generateField("customer_definition", { plan });
  plan.genz_value = await generateField("genz_value", { plan });
  plan.culture_creation = await generateField("culture_creation", { plan });
  plan.quality_level = await generateField("quality_level", { plan });
  plan.price_level = await generateField("price_level", { plan });
  plan.functional_benefits = await generateField("functional_benefits", { plan });
  plan.experiential_benefits = await generateField("experiential_benefits", { plan });
  plan.symbolic_benefits = await generateField("symbolic_benefits", { plan });
  plan.brand_keywords = await generateKeywords(plan);
  plan.membership_philosophy = await generateField("membership_philosophy", { plan });

  // ??遺꾩꽍(紐⑺몴 ?ㅼ? userInputs.targetToneKeywords濡??꾨떖)
  const toneAnalysis = analyzeTone(plan, userInputs.targetToneKeywords || []);
  // 18踰? 釉뚮옖?쒕챸 ?ш?利??ъ젣??
  plan.name_revalidated = await proposeNames(plan, toneAnalysis);
  plan.tone_mismatch_report = findToneMismatch(plan, toneAnalysis, userInputs.toneThreshold || 0.15);

  return plan;
}
// ...existing code...
