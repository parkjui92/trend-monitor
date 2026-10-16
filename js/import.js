// js/import.js — 담당: A
// 입력(붙여넣기·파일·예시)을 읽어 { date, title, url } 줄로 만들고,
// classify.js로 분야·쟁점을 붙인 뒤 'records-ready' 이벤트로 B에게 넘긴다.
//
// 읽는 규칙
//   - 첫 줄에 date/날짜, title/제목, url/링크 같은 이름이 있으면 그 칸을 찾아 읽는다(다른 칸은 무시).
//     이름이 없으면 첫째 칸=날짜, 둘째 칸=제목, 셋째 칸=링크로 읽는다.
//   - 따옴표로 감싼 칸 안의 쉼표·줄바꿈, 두 번 쓴 따옴표("")를 처리한다.
//   - 빈 줄은 무시한다(건너뛴 줄에 세지 않음).
//   - 날짜가 없거나 형식이 틀린 줄, 제목이 없는 줄은 건너뛰고 몇 번째 줄인지 알린다.
(function () {
  const $ = (id) => document.getElementById(id);

  const NAMES = {
    date: ['date', '날짜', '일자'],
    title: ['title', '제목'],
    url: ['url', 'link', '링크', '원문url', '주소'],
  };

  // 탭으로 나뉜 붙여넣기(스프레드시트 복사)도 받는다
  function detectDelimiter(text) {
    const first = text.split(/\r?\n/, 1)[0] || '';
    return first.split('\t').length > first.split(',').length ? '\t' : ',';
  }

  // CSV 글 → [{ cells: [...], line: 시작 줄 번호 }]
  function parseCSV(text) {
    const delim = detectDelimiter(text);
    const rows = [];
    let cells = [];
    let cell = '';
    let inQuotes = false;
    let line = 1;
    let startLine = 1;
    let quoteLine = 0;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { cell += '"'; i++; } // "" → "
          else inQuotes = false;
        } else {
          if (c === '\n') line++;
          cell += c;
        }
      } else if (c === '"' && cell === '') {
        inQuotes = true; // 칸 맨 앞의 따옴표만 감싸기로 본다
        quoteLine = line;
      } else if (c === delim) {
        cells.push(cell);
        cell = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        cells.push(cell);
        rows.push({ cells, line: startLine });
        cells = [];
        cell = '';
        line++;
        startLine = line;
      } else {
        cell += c;
      }
    }
    if (cell !== '' || cells.length) {
      cells.push(cell);
      rows.push({ cells, line: startLine });
    }
    return { rows, unclosedQuoteLine: inQuotes ? quoteLine : 0 };
  }

  // '2026-09-01', '2026.9.1', '2026/09/01 10:00' → '2026-09-01' (틀리면 null)
  function normalizeDate(value) {
    const m = String(value || '').trim().match(/^(\d{4})\s*[-./]\s*(\d{1,2})\s*[-./]\s*(\d{1,2})\.?(?:[ T].*)?$/);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const check = new Date(Date.UTC(y, mo - 1, d));
    if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null;
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  const isBlank = (cells) => cells.every((c) => c.trim() === '');
  const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();

  // 글 전체 → { rows: [{date,title,url}], report }
  function readRows(text) {
    text = String(text || '').replace(/^﻿/, ''); // 엑셀 CSV의 BOM 제거
    const parsed = parseCSV(text);
    const report = { rows: 0, blank: 0, skipped: [], header: false, error: '', unclosedQuoteLine: parsed.unclosedQuoteLine };
    const out = [];

    let col = { date: 0, title: 1, url: 2 };
    let start = 0;
    const firstIdx = parsed.rows.findIndex((r) => !isBlank(r.cells));
    if (firstIdx >= 0) {
      const head = parsed.rows[firstIdx].cells.map((c) => c.trim().toLowerCase());
      const find = (names) => head.findIndex((h) => names.includes(h));
      if (find(NAMES.date) >= 0 || find(NAMES.title) >= 0) {
        col = { date: find(NAMES.date), title: find(NAMES.title), url: find(NAMES.url) };
        report.header = true;
        start = firstIdx + 1;
        report.blank = firstIdx; // 머리줄 앞의 빈 줄
        if (col.date < 0) report.error = '첫 줄에서 날짜 칸(date)을 찾지 못했습니다.';
        else if (col.title < 0) report.error = '첫 줄에서 제목 칸(title)을 찾지 못했습니다.';
      }
    }
    if (report.error) return { rows: out, report };

    for (let i = start; i < parsed.rows.length; i++) {
      const { cells, line } = parsed.rows[i];
      if (isBlank(cells)) { report.blank++; continue; }
      report.rows++;
      const rawDate = (cells[col.date] || '').trim();
      const date = normalizeDate(rawDate);
      const title = clean(cells[col.title]);
      const url = col.url >= 0 ? (cells[col.url] || '').trim() : '';
      if (!date) report.skipped.push({ line, reason: rawDate ? `날짜 형식이 아님("${rawDate.slice(0, 20)}")` : '날짜 없음' });
      else if (!title) report.skipped.push({ line, reason: '제목 없음' });
      else out.push({ date, title, url });
    }
    return { rows: out, report };
  }

  const fmt = (n) => n.toLocaleString('ko-KR');

  function showSummary(records, report) {
    const unclassified = records.filter((r) => r.field === window.UNCLASSIFIED).length;
    $('sumTotal').textContent = fmt(records.length);
    $('sumClassified').textContent = fmt(records.length - unclassified);
    $('sumUnclassified').textContent = fmt(unclassified);
    $('sumSkipped').textContent = fmt(report.skipped.length);
  }

  function showMessage(records, report, source) {
    const box = $('inputMsg');
    box.className = 'msg';
    box.textContent = '';
    if (report.error) {
      box.classList.add('error');
      box.textContent = report.error + ' 첫 줄을 date,title,url 처럼 적어 주세요.';
      return;
    }
    if (!report.rows) {
      box.classList.add('error');
      box.textContent = '읽을 줄이 없습니다. 기사 목록을 붙여넣거나 「예시 불러오기」를 누르세요.';
      return;
    }
    const parts = [`${source ? source + ': ' : ''}${fmt(records.length)}건을 읽었습니다.`];
    if (!report.header) parts.push('첫 줄에 칸 이름이 없어 첫째 칸=날짜, 둘째 칸=제목으로 읽었습니다.');
    if (report.blank) parts.push(`빈 줄 ${fmt(report.blank)}개는 무시했습니다.`);
    if (report.unclosedQuoteLine) parts.push(`${report.unclosedQuoteLine}번째 줄의 따옴표가 닫히지 않았습니다.`);
    if (!report.skipped.length) {
      parts.push('건너뛴 줄 없음.');
      box.classList.add(report.unclosedQuoteLine ? 'warn' : 'ok');
      box.textContent = parts.join(' ');
      return;
    }
    parts.push(`${fmt(report.skipped.length)}줄을 건너뛰었습니다:`);
    box.classList.add('warn');
    box.textContent = parts.join(' ');
    const ul = document.createElement('ul');
    report.skipped.slice(0, 5).forEach((s) => {
      const li = document.createElement('li');
      li.textContent = `${s.line}번째 줄 — ${s.reason}`;
      ul.appendChild(li);
    });
    if (report.skipped.length > 5) {
      const li = document.createElement('li');
      li.textContent = `그 밖에 ${fmt(report.skipped.length - 5)}줄`;
      ul.appendChild(li);
    }
    box.appendChild(ul);
  }

  // 읽기 → 분류 → 요약·메시지 → B에게 넘기기
  function run(text, source) {
    $('inputText').scrollTop = 0; // 입력 칸은 맨 앞을 보여 준다
    $('inputText').scrollLeft = 0;
    const { rows, report } = readRows(text);
    const records = window.classifyRecords(rows, window.RULES);
    showSummary(records, report);
    showMessage(records, report, source);
    window.dispatchEvent(new CustomEvent('records-ready', { detail: records }));
    return { records, report };
  }

  $('loadSample').addEventListener('click', () => {
    $('inputText').value = window.SAMPLE_CSV || '';
    run($('inputText').value, '예시 입력');
  });

  $('runBtn').addEventListener('click', () => run($('inputText').value, ''));

  $('inputText').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) run($('inputText').value, '');
  });

  // 파일은 UTF-8로 읽고, 글자가 깨지면(엑셀의 EUC-KR 저장) 한 번 더 EUC-KR로 읽는다
  function readFile(file, encoding) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file, encoding);
    });
  }

  $('fileInput').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    let text = await readFile(file, 'utf-8');
    if (text.includes('�')) text = await readFile(file, 'euc-kr');
    $('inputText').value = text;
    run(text, file.name);
    e.target.value = ''; // 같은 파일을 다시 골라도 동작하게
  });

  // 콘솔에서 확인할 때 쓰도록 열어 둔다
  window.TrendImport = { parseCSV, readRows, run };
})();
