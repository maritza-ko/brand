// filepath: C:\persona\brand\src\utils\consistencyChecker.js
// ...existing code...
/**
 * ???쇨???寃???좏떥
 * - analyzeTone: 媛??꾨뱶蹂?紐⑺몴 ???ㅼ썙?쒖???留ㅼ묶 鍮꾩쑉 怨꾩궛
 * - findToneMismatch: ?꾧퀎移??댄븯???꾨뱶?ㅼ쓣 ?섏쭛??由ы룷???앹꽦
 */

const defaultTokenizer = (text = "") => (text || "").toLowerCase().match(/\b[媛-?즑-z]{2,}\b/g) || [];

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
    // 硫뷀? ?꾨뱶??鍮꾧????꾨뱶 ?쒖쇅
    if (["name_revalidated","tone_mismatch_report"].includes(field)) continue;
    if (info.total === 0) {
      issues.push({ field, issue: "?댁슜 遺議?遺꾩꽍???띿뒪???놁쓬)", severity: "medium" });
      continue;
    }
    if (info.ratio < threshold) {
      issues.push({
        field,
        issue: `???쇱튂????쓬 (留ㅼ묶鍮?${ (info.ratio*100).toFixed(1) }%)`,
        severity: info.ratio < (threshold/3) ? "high" : "medium"
      });
    }
  }
  return issues;
}
// ...existing code...
