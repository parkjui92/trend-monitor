// js/charts.js — 담당: B
// 'records-ready' 이벤트만 듣고 그래프 두 개를 SVG로 직접 그린다(외부 라이브러리 없음).
//   #chartFields : 분야별 개수 가로 막대 (많은 순, '미분류'는 맨 아래 회색)
//   #chartWeeks  : 주별 추이 선 (월요일 시작 주, 전체 + 고른 분야)
// A가 아직 없으면 README의 예시 한 건으로 이벤트를 보내 시험한다.
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const UNCLASSIFIED = '미분류';
  const COLOR = {
    bar: '#1F6FE0',
    unclassified: '#B4BCCB',
    total: '#0e204a',
    focus: '#E8604C',
    grid: '#E6EAF1',
    axis: '#C9D1DE',
    text: '#1c2433',
    sub: '#5b6577',
    surface: '#ffffff',
  };
  const DAY = 86400000;

  let records = [];
  let focusField = ''; // 주별 추이에 함께 그릴 분야

  // ---------- 작은 도구 ----------
  function el(tag, attrs, text) {
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, v));
    if (text != null) node.textContent = text;
    return node;
  }
  const fmt = (n) => n.toLocaleString('ko-KR');

  function prepare(svg) {
    const width = Math.max(260, Math.round(svg.getBoundingClientRect().width));
    const height = Math.round(svg.getBoundingClientRect().height) || 222;
    svg.textContent = '';
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    return { width, height };
  }

  function emptyState(svg, width, height) {
    svg.appendChild(el('text', { x: width / 2, y: height / 2, 'text-anchor': 'middle', class: 'empty' },
      '「예시 불러오기」를 누르면 그래프가 그려집니다'));
  }

  // 마우스를 올리면 뜨는 설명 상자
  const tip = document.createElement('div');
  tip.className = 'tip';
  document.body.appendChild(tip);
  function bindTip(node, lines) {
    node.addEventListener('mousemove', (e) => {
      tip.textContent = '';
      lines.forEach((t, i) => {
        const row = document.createElement('div');
        row.textContent = t;
        if (i === 0) row.style.fontWeight = '700';
        tip.appendChild(row);
      });
      tip.style.display = 'block';
      tip.style.left = Math.min(e.clientX + 14, window.innerWidth - tip.offsetWidth - 8) + 'px';
      tip.style.top = e.clientY + 14 + 'px';
    });
    node.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
  }

  // 눈금: 0부터 깔끔한 간격(1·2·5 × 10ⁿ)으로 4칸 안팎
  function niceTicks(max) {
    if (max <= 0) return [0, 1];
    const rough = max / 4;
    const p = Math.pow(10, Math.floor(Math.log10(rough)));
    const n = rough / p;
    const step = Math.max(1, (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p); // 건수라 1보다 잘게 나누지 않음
    const top = Math.ceil(max / step) * step;
    const ticks = [];
    for (let v = 0; v <= top + 1e-9; v += step) ticks.push(v);
    return ticks;
  }

  // ---------- 분야별 개수 ----------
  function fieldCounts() {
    const counts = new Map();
    records.forEach((r) => counts.set(r.field, (counts.get(r.field) || 0) + 1));
    return [...counts.entries()].sort((a, b) => {
      if (a[0] === UNCLASSIFIED) return 1;
      if (b[0] === UNCLASSIFIED) return -1;
      return b[1] - a[1];
    });
  }

  // 막대: 바닥쪽은 각지고 끝만 4px 둥글게
  function barPath(x, y, w, h, r) {
    r = Math.min(r, w, h / 2);
    return `M${x},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} V${y + h - r} A${r},${r} 0 0 1 ${x + w - r},${y + h} H${x} Z`;
  }

  function drawFields() {
    const svg = document.getElementById('chartFields');
    const { width, height } = prepare(svg);
    if (!records.length) return emptyState(svg, width, height);

    const data = fieldCounts();
    const total = records.length;
    const labelW = 118;
    const valueW = 64;
    const rowH = Math.min(30, (height - 8) / data.length);
    const barH = Math.min(18, rowH - 8);
    const plotW = width - labelW - valueW;
    const max = Math.max(...data.map((d) => d[1]));

    data.forEach(([name, n], i) => {
      const y = 4 + i * rowH;
      const w = Math.max(2, (n / max) * plotW);
      const isUn = name === UNCLASSIFIED;
      const isFocus = name === focusField;
      const g = el('g', { class: 'bar', 'data-field': name, style: isUn ? '' : 'cursor:pointer' });
      g.appendChild(el('rect', { x: 0, y, width, height: rowH, fill: 'transparent' })); // 넉넉한 마우스 영역
      g.appendChild(el('text', { x: labelW - 10, y: y + rowH / 2, 'text-anchor': 'end', 'dominant-baseline': 'middle', 'font-size': 13, fill: COLOR.text, 'font-weight': isFocus ? 700 : 400 }, name));
      g.appendChild(el('path', { d: barPath(labelW, y + (rowH - barH) / 2, w, barH, 4), fill: isUn ? COLOR.unclassified : isFocus ? COLOR.focus : COLOR.bar }));
      g.appendChild(el('text', { x: labelW + w + 8, y: y + rowH / 2, 'dominant-baseline': 'middle', 'font-size': 13, fill: COLOR.sub, style: 'font-variant-numeric: tabular-nums' }, fmt(n)));
      bindTip(g, [name, `${fmt(n)}건 · 전체의 ${((n / total) * 100).toFixed(1)}%`, isUn ? 'rules.js의 어느 분야에도 안 걸림' : '누르면 주별 추이에 함께 표시']);
      if (!isUn) g.addEventListener('click', () => setFocus(focusField === name ? '' : name));
      svg.appendChild(g);
    });
    svg.appendChild(el('line', { x1: labelW, x2: labelW, y1: 2, y2: 4 + data.length * rowH, stroke: COLOR.axis, 'stroke-width': 1 }));
  }

  // ---------- 주별 추이 ----------
  const toTime = (d) => { const [y, m, dd] = d.split('-').map(Number); return Date.UTC(y, m - 1, dd); };
  const toDate = (t) => new Date(t).toISOString().slice(0, 10);
  // 그 날짜가 든 주의 월요일
  function weekStart(d) {
    const t = toTime(d);
    const dow = new Date(t).getUTCDay(); // 0=일요일
    return t - ((dow + 6) % 7) * DAY;
  }

  function weekSeries() {
    const times = records.map((r) => toTime(r.date));
    const minT = Math.min(...times);
    const maxT = Math.max(...times);
    const weeks = [];
    for (let w = weekStart(toDate(minT)); w <= maxT; w += 7 * DAY) {
      weeks.push({ start: w, total: 0, focus: 0, partial: w < minT || w + 6 * DAY > maxT });
    }
    records.forEach((r) => {
      const wk = weeks.find((w) => w.start === weekStart(r.date));
      wk.total++;
      if (focusField && r.field === focusField) wk.focus++;
    });
    return { weeks, minT, maxT };
  }

  function drawWeeks() {
    const svg = document.getElementById('chartWeeks');
    const { width, height } = prepare(svg);
    if (!records.length) return emptyState(svg, width, height);

    const { weeks, minT, maxT } = weekSeries();
    const pad = { left: 42, right: 18, top: focusField ? 30 : 16, bottom: 46 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;
    const ticks = niceTicks(Math.max(...weeks.map((w) => w.total)));
    const top = ticks[ticks.length - 1];
    const x = (i) => pad.left + (weeks.length === 1 ? plotW / 2 : (i / (weeks.length - 1)) * plotW);
    const y = (v) => pad.top + plotH - (v / top) * plotH;

    // 가로 눈금선과 값
    ticks.forEach((v) => {
      svg.appendChild(el('line', { x1: pad.left, x2: width - pad.right, y1: y(v), y2: y(v), stroke: v === 0 ? COLOR.axis : COLOR.grid, 'stroke-width': 1 }));
      svg.appendChild(el('text', { x: pad.left - 8, y: y(v), 'text-anchor': 'end', 'dominant-baseline': 'middle', 'font-size': 11, fill: COLOR.sub }, fmt(v)));
    });
    // 주 시작일 이름
    weeks.forEach((w, i) => {
      const d = new Date(w.start);
      svg.appendChild(el('text', { x: x(i), y: pad.top + plotH + 16, 'text-anchor': 'middle', 'font-size': 11, fill: COLOR.sub }, `${d.getUTCMonth() + 1}/${d.getUTCDate()}`));
    });
    svg.appendChild(el('text', { x: pad.left, y: height - 6, 'font-size': 11, fill: COLOR.sub },
      '주 시작일(월요일) · 속 빈 점은 7일이 다 차지 않은 주'));

    const series = [{ key: 'total', name: '전체', color: COLOR.total }];
    if (focusField) series.push({ key: 'focus', name: focusField, color: COLOR.focus });

    series.forEach((s) => {
      const d = weeks.map((w, i) => `${i ? 'L' : 'M'}${x(i)},${y(w[s.key])}`).join(' ');
      svg.appendChild(el('path', { d, fill: 'none', stroke: s.color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
      // 가장 큰 값 하나에만 숫자를 붙인다
      const peak = weeks.reduce((best, w, i) => (w[s.key] > weeks[best][s.key] ? i : best), 0);
      weeks.forEach((w, i) => {
        const g = el('g');
        g.appendChild(el('circle', { cx: x(i), cy: y(w[s.key]), r: 12, fill: 'transparent' })); // 마우스 영역
        g.appendChild(el('circle', { cx: x(i), cy: y(w[s.key]), r: 4.5, fill: w.partial ? COLOR.surface : s.color, stroke: w.partial ? s.color : COLOR.surface, 'stroke-width': 2 }));
        const end = toDate(Math.min(w.start + 6 * DAY, maxT));
        const begin = toDate(Math.max(w.start, minT));
        bindTip(g, [`${begin} ~ ${end}${w.partial ? ' (일부)' : ''}`, `${s.name} ${fmt(w[s.key])}건`]);
        svg.appendChild(g);
        if (i === peak) {
          svg.appendChild(el('text', { x: x(i), y: y(w[s.key]) - 10, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: COLOR.text }, fmt(w[s.key])));
        }
      });
    });

    // 두 선일 때만 범례
    if (series.length > 1) {
      let lx = pad.left;
      series.forEach((s) => {
        svg.appendChild(el('line', { x1: lx, x2: lx + 16, y1: 10, y2: 10, stroke: s.color, 'stroke-width': 2, 'stroke-linecap': 'round' }));
        const t = el('text', { x: lx + 22, y: 10, 'dominant-baseline': 'middle', 'font-size': 12, fill: COLOR.text }, s.name);
        svg.appendChild(t);
        lx += 22 + t.getComputedTextLength() + 18;
      });
    }
  }

  // ---------- 분야 고르기 ----------
  function fillSelect() {
    const sel = document.getElementById('weekField');
    const names = fieldCounts().map((d) => d[0]).filter((n) => n !== UNCLASSIFIED);
    if (!names.includes(focusField)) focusField = '';
    sel.textContent = '';
    sel.appendChild(new Option('전체만 보기', ''));
    names.forEach((n) => sel.appendChild(new Option(`전체 + ${n}`, n)));
    sel.value = focusField;
  }

  function setFocus(name) {
    focusField = name;
    document.getElementById('weekField').value = name;
    drawAll();
  }

  function drawAll() {
    drawFields();
    drawWeeks();
  }

  document.getElementById('weekField').addEventListener('change', (e) => setFocus(e.target.value));

  window.addEventListener('records-ready', (e) => {
    records = Array.isArray(e.detail) ? e.detail : [];
    fillSelect();
    drawAll();
  });

  let timer = 0;
  window.addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(drawAll, 150); });

  drawAll(); // 처음엔 빈 상태 안내
})();
