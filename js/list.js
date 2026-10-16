// js/list.js — 담당: B
// 'records-ready' 이벤트만 듣고 목록 두 개와 CSV 내보내기를 맡는다.
//   #issueTabs·#issueList : 쟁점별 목록 (전체 · 쟁점마다 · 쟁점 없음), 최신 날짜부터
//   #unclassList          : 미분류 목록
//   #search               : 제목에 검색어가 든 기록만 남긴다(두 목록 모두, 대소문자 무시)
//   #exportCsv            : 분류 결과 전체를 CSV로 저장 → 이 파일을 다시 넣어도 같은 결과
(function () {
  const ALL = '전체';
  const NO_ISSUE = '쟁점 없음';
  const UNCLASSIFIED = '미분류';
  const $ = (id) => document.getElementById(id);
  const fmt = (n) => n.toLocaleString('ko-KR');

  let records = [];
  let activeIssue = ALL;
  let query = '';

  // 쟁점 이름 순서: rules.js 순서를 따르고, 거기 없는 이름은 뒤에 붙인다
  function issueNames() {
    const names = Object.keys((window.RULES && window.RULES.issues) || {});
    records.forEach((r) => r.issues.forEach((i) => { if (!names.includes(i)) names.push(i); }));
    return names;
  }

  function matches(r) {
    if (!query) return true;
    return r.title.toLowerCase().includes(query);
  }

  function inIssue(r, issue) {
    if (issue === ALL) return true;
    if (issue === NO_ISSUE) return r.issues.length === 0;
    return r.issues.includes(issue);
  }

  const byDateDesc = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);

  // 검색어 부분을 <mark>로 감싼 제목 (innerHTML을 쓰지 않아 입력 글이 코드로 실행되지 않음)
  function titleNode(r) {
    const safe = /^https?:\/\//i.test(r.url);
    const node = document.createElement(safe ? 'a' : 'span');
    if (safe) { node.href = r.url; node.target = '_blank'; node.rel = 'noopener noreferrer'; }
    const text = r.title;
    if (!query) { node.textContent = text; return node; }
    const lower = text.toLowerCase();
    let from = 0;
    let at = lower.indexOf(query);
    while (at >= 0) {
      node.appendChild(document.createTextNode(text.slice(from, at)));
      const m = document.createElement('mark');
      m.textContent = text.slice(at, at + query.length);
      node.appendChild(m);
      from = at + query.length;
      at = lower.indexOf(query, from);
    }
    node.appendChild(document.createTextNode(text.slice(from)));
    return node;
  }

  function badge(text, kind) {
    const b = document.createElement('span');
    b.className = 'badge' + (kind ? ' ' + kind : '');
    b.textContent = text;
    return b;
  }

  function renderTabs(visible) {
    const box = $('issueTabs');
    box.textContent = '';
    if (!records.length) return;
    [ALL, ...issueNames(), NO_ISSUE].forEach((name) => {
      const n = visible.filter((r) => inIssue(r, name)).length;
      const t = document.createElement('button');
      t.type = 'button';
      t.className = 'tab' + (name === activeIssue ? ' active' : '');
      t.dataset.issue = name;
      t.setAttribute('role', 'tab');
      t.setAttribute('aria-selected', name === activeIssue);
      t.append(name + ' ');
      const b = document.createElement('b');
      b.textContent = fmt(n);
      t.appendChild(b);
      t.addEventListener('click', () => { activeIssue = name; render(); });
      box.appendChild(t);
    });
  }

  function renderIssueList(visible) {
    const box = $('issueList');
    box.textContent = '';
    const rows = visible.filter((r) => inIssue(r, activeIssue)).sort(byDateDesc);
    $('issueCount').textContent = records.length ? `${fmt(rows.length)}건` : '';
    if (!rows.length) {
      const p = document.createElement('div');
      p.className = 'empty-row';
      p.textContent = records.length ? '맞는 기사가 없습니다.' : '「예시 불러오기」를 누르면 목록이 나옵니다.';
      box.appendChild(p);
      return;
    }
    const table = document.createElement('table');
    table.innerHTML = '<thead><tr><th>날짜</th><th>분야</th><th>제목</th><th>쟁점</th></tr></thead>';
    const tbody = document.createElement('tbody');
    rows.forEach((r) => {
      const tr = document.createElement('tr');
      const tdDate = document.createElement('td'); tdDate.className = 'date'; tdDate.textContent = r.date;
      const tdField = document.createElement('td'); tdField.className = 'field';
      tdField.appendChild(badge(r.field, r.field === UNCLASSIFIED ? 'none' : ''));
      const tdTitle = document.createElement('td'); tdTitle.appendChild(titleNode(r));
      const tdIssues = document.createElement('td'); tdIssues.className = 'issues';
      if (r.issues.length) r.issues.forEach((i) => tdIssues.appendChild(badge(i, 'issue')));
      else tdIssues.appendChild(badge('없음', 'none'));
      tr.append(tdDate, tdField, tdTitle, tdIssues);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    box.appendChild(table);
  }

  function renderUnclassified(visible) {
    const box = $('unclassList');
    box.textContent = '';
    const rows = visible.filter((r) => r.field === UNCLASSIFIED).sort(byDateDesc);
    $('unclassCount').textContent = records.length ? `${fmt(rows.length)}건` : '';
    if (!rows.length) {
      const p = document.createElement('div');
      p.className = 'empty-row';
      p.textContent = records.length ? '미분류 기사가 없습니다.' : '아직 기록이 없습니다.';
      box.appendChild(p);
      return;
    }
    const ul = document.createElement('ul');
    ul.className = 'plain';
    rows.forEach((r) => {
      const li = document.createElement('li');
      const d = document.createElement('span'); d.className = 'date'; d.textContent = r.date.slice(5);
      li.append(d, titleNode(r));
      ul.appendChild(li);
    });
    box.appendChild(ul);
  }

  function render() {
    const visible = records.filter(matches);
    renderTabs(visible);
    renderIssueList(visible);
    renderUnclassified(visible);
    $('exportCsv').disabled = !records.length;
  }

  // ---------- CSV 내보내기 ----------
  function csvCell(v) {
    const s = String(v == null ? '' : v);
    return /[",\r\n]/.test(s) || s !== s.trim() ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function toCSV(list) {
    const lines = ['date,title,url,field,issues'];
    list.forEach((r) => lines.push([r.date, r.title, r.url, r.field, r.issues.join('; ')].map(csvCell).join(',')));
    return lines.join('\n') + '\n';
  }

  $('exportCsv').addEventListener('click', () => {
    if (!records.length) return;
    // 맨 앞 BOM(﻿): 엑셀에서 한글이 깨지지 않게
    const blob = new Blob(['﻿' + toCSV(records)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'trend-monitor_분류결과.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  $('search').addEventListener('input', (e) => {
    query = e.target.value.trim().toLowerCase();
    render();
  });

  window.addEventListener('records-ready', (e) => {
    records = Array.isArray(e.detail) ? e.detail : [];
    if (activeIssue !== ALL && ![...issueNames(), NO_ISSUE].includes(activeIssue)) activeIssue = ALL;
    render();
  });

  render(); // 처음엔 빈 상태 안내
})();
