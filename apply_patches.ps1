# ...existing code...
$root = "C:\persona\brand"

$files = @{}

$files["src\utils\consistencyChecker.js"] = @'
// filepath: C:\persona\brand\src\utils\consistencyChecker.js
// ...existing code...
/**
 * 톤/일관성 검사 유틸
 * - analyzeTone: 각 필드별 목표 톤 키워드와의 매칭 비율 계산
 * - findToneMismatch: 임계치 이하인 필드들을 수집해 리포트 생성
 */

const defaultTokenizer = (text = "") => (text || "").toLowerCase().match(/\b[가-힣a-z]{2,}\b/g) || [];

export function analyzeTone(plan, targetToneKeywords = []) {
  const keywords = (targetToneKeywords || []).map(k => k.toLowerCase());
  const scores = {};
  Object.keys(plan).forEach(k => {
    const v = plan[k];
    if (typeof v === "string") {
      const words = defaultTokenizer(v);
      const matches = words.filter(w => keywords.includes(w)).length;
      scores[k] = { matches, total: words.length, ratio: words.length ? matches / words.length : 0 };
    } else if (Array.isArray(v)) {
      const joined = v.join(" ");
      const words = defaultTokenizer(joined);
      const matches = words.filter(w => keywords.includes(w)).length;
      scores[k] = { matches, total: words.length, ratio: words.length ? matches / words.length : 0 };
    } else {
      scores[k] = { matches: 0, total: 0, ratio: 0 };
    }
  });
  return scores;
}

export function findToneMismatch(plan, toneAnalysis, threshold = 0.15) {
  const issues = [];
  for (const field in toneAnalysis) {
    const info = toneAnalysis[field];
    // 메타 필드나 비관련 필드 제외
    if (["name_revalidated","tone_mismatch_report"].includes(field)) continue;
    if (info.total === 0) {
      issues.push({ field, issue: "내용 부족(분석용 텍스트 없음)", severity: "medium" });
      continue;
    }
    if (info.ratio < threshold) {
      issues.push({
        field,
        issue: `톤 일치도 낮음 (매칭비 ${ (info.ratio*100).toFixed(1) }%)`,
        severity: info.ratio < (threshold/3) ? "high" : "medium"
      });
    }
  }
  return issues;
}
// ...existing code...
'@

$files["src\utils\flowController.js"] = @'
// filepath: C:\persona\brand\src\utils\flowController.js
// ...existing code...
/**
 * 단계별 브랜드 플랜 생성 흐름 컨트롤러
 * - 초기명(name_initial) -> 철학 -> 슬로건 -> ... -> 17번 항목 생성
 * - 분석 후 18번: 브랜드명 재제안(name_revalidated) 및 tone_mismatch_report 생성
 *
 * 주의: 실제 생성 함수(generatePhilosophy 등)는 별도 모듈(또는 LLM 호출)로 연결하세요.
 */

import { analyzeTone, findToneMismatch } from "./consistencyChecker.js";

// placeholder generator 함수들 — 실제 LLM/서비스로 교체하세요.
async function generatePhilosophy(name, seed) { return `철학: ${name} 기반 철학 문장`; }
async function generateSlogan(philosophy, name) { return `슬로건: ${name} — ${philosophy.slice(0,20)}`; }
async function generateField(fieldName, context) { return `${fieldName} 내용(자동생성)`; }
async function generateKeywords(plan) { return ["혁신","진정성"]; }
async function proposeNames(plan, toneAnalysis) {
  const base = (plan.name_initial || "브랜드").replace(/\s+/g," ");
  return [
    { name: `${base} Lab`, score: 0.82 },
    { name: `${base} Studio`, score: 0.76 },
    { name: `${base} Collective`, score: 0.69 }
  ];
}

export async function createBrandPlan(initialName, userInputs = {}) {
  const plan = {};
  plan.name_initial = initialName || userInputs.name_initial || "미정 브랜드명";
  // 2번: 브랜드 철학
  plan.philosophy = await generatePhilosophy(plan.name_initial, userInputs.philosophySeed);
  // 3번: 슬로건
  plan.slogan = await generateSlogan(plan.philosophy, plan.name_initial);
  // 4~17번: 각 항목은 이전 항목/전체 plan을 참조해 생성
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

  // 톤 분석(목표 톤은 userInputs.targetToneKeywords로 전달)
  const toneAnalysis = analyzeTone(plan, userInputs.targetToneKeywords || []);
  // 18번: 브랜드명 재검증/재제안
  plan.name_revalidated = await proposeNames(plan, toneAnalysis);
  plan.tone_mismatch_report = findToneMismatch(plan, toneAnalysis, userInputs.toneThreshold || 0.15);

  return plan;
}
// ...existing code...
'@

$files["src\styles\report.css"] = @'
/* filepath: C:\persona\brand\src\styles\report.css */
/* ...existing code... */
/* 리포트 요약(처음 제출되는 요약) 폰트/스타일 정제 */
.report-summary {
  font-family: Inter, "Segoe UI", Roboto, system-ui, -apple-system, "Helvetica Neue", Arial;
  font-size: 14px; /* 기존 대비 작게 조정 */
  line-height: 1.45;
  font-weight: 500;
  color: #222;
  margin: 0 0 12px 0;
  letter-spacing: -0.01em;
  max-width: 900px;
}
.report-summary .title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #111;
}
.report-summary p {
  margin: 4px 0;
  color: #333;
}

/* 톤 불일치 배너 */
.tone-mismatch-banner {
  border-left: 4px solid #ef4444;
  background: #fff5f5;
  padding: 8px 12px;
  margin: 12px 0;
  border-radius: 6px;
  color: #7f1d1d;
  font-size: 13px;
}

/* 반응형 조정 */
@media (max-width:720px) {
  .report-summary { font-size: 13px; }
  .report-summary .title { font-size: 15px; }
}
/* ...existing code... */
'@

$files["src\data\brandPlan.schema.json"] = @'
/* filepath: C:\persona\brand\src\data\brandPlan.schema.json */
/* ...existing code... */
{
  "BrandPlan": {
    "type": "object",
    "properties": {
      "name_initial": { "type": "string" },
      "philosophy": { "type": "string" },
      "slogan": { "type": "string" },
      "brand_memo": { "type": "string" },
      "core_tech": { "type": "string" },
      "core_strategy": { "type": "string" },
      "competitive_attributes": { "type": "array", "items": { "type": "string" } },
      "customer_definition": { "type": "string" },
      "genz_value": { "type": "string" },
      "culture_creation": { "type": "string" },
      "quality_level": { "type": "string" },
      "price_level": { "type": "string" },
      "functional_benefits": { "type": "string" },
      "experiential_benefits": { "type": "string" },
      "symbolic_benefits": { "type": "string" },
      "brand_keywords": { "type": "array", "items": { "type": "string" } },
      "membership_philosophy": { "type": "string" },
      "name_revalidated": {
        "type": "array",
        "items": { "type": "object", "properties": { "name": { "type": "string" }, "score": { "type": "number" } } }
      },
      "tone_mismatch_report": {
        "type": "array",
        "items": { "type": "object", "properties": { "field": { "type": "string" }, "issue": { "type": "string" }, "severity": { "type": "string" } } }
      }
    },
    "required": ["name_initial","philosophy","slogan"]
  }
}
/* ...existing code... */
'@

# 파일 생성/덮어쓰기
foreach ($relative in $files.Keys) {
    $full = Join-Path $root $relative
    $dir = Split-Path $full -Parent
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    $content = $files[$relative]
    $content | Set-Content -Path $full -Encoding UTF8
    Write-Host "WROTE: $full"
}

Write-Host "모든 파일 작성/덮어쓰기 완료."
# ...existing code...