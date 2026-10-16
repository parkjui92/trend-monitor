// js/classify.js — 담당: A
// 분류 사전(rules.js의 window.RULES)을 기록마다 적용한다.
//   field  : 사전에서 위에 있는 분야부터 보고, 처음 맞은 분야 하나 (없으면 '미분류')
//   issues : 맞은 쟁점 모두
// 낱말 맞추기 규칙
//   한글이 든 낱말 → 제목 안에 그 글자가 있으면 일치 (예: '규제' → '규제 완화')
//   영문 낱말     → 대소문자 무시, 낱말 단위로만 일치 (예: 'AI' → 'AI 모델'은 맞고 'Email'은 아님)
//                   끝에 붙은 s·es·숫자는 같은 낱말로 본다 (예: 'agent' → 'agents', 'Qwen' → 'Qwen3')
(function () {
  const UNCLASSIFIED = '미분류';

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // 낱말 하나를 검사 함수로 바꾼다 (한 번 만들어 두고 기록마다 재사용)
  function makeMatcher(word) {
    const w = String(word).trim().toLowerCase();
    if (!w) return () => false;
    if (/^[\x00-\x7f]+$/.test(w)) {
      const re = new RegExp('(^|[^a-z0-9])' + escapeRegExp(w) + '(s|es)?(?![a-z])');
      return (text) => re.test(text);
    }
    return (text) => text.includes(w);
  }

  function compile(group) {
    return Object.entries(group || {}).map(([name, words]) => ({
      name,
      tests: (words || []).map(makeMatcher),
    }));
  }

  // rows: [{date, title, url}] → records: [{date, title, url, field, issues}]
  function classifyRecords(rows, rules) {
    rules = rules || window.RULES || { fields: {}, issues: {} };
    const fields = compile(rules.fields);
    const issues = compile(rules.issues);
    return rows.map((row) => {
      const text = String(row.title || '').toLowerCase();
      const hit = (entry) => entry.tests.some((test) => test(text));
      const first = fields.find(hit);
      return {
        date: row.date,
        title: row.title,
        url: row.url,
        field: first ? first.name : UNCLASSIFIED,
        issues: issues.filter(hit).map((entry) => entry.name),
      };
    });
  }

  window.UNCLASSIFIED = UNCLASSIFIED;
  window.classifyRecords = classifyRecords;
})();
