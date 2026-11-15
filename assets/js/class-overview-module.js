/**
 * class-overview-module.js – Class page → Overview tab.
 *
 * Cards, charts and "needs attention" for one class, built from OFFICIAL
 * assessments only (practice and archived are left out) in one academic year.
 * GCSE classes also get grades vs targets, DP spread, Paper 1 vs Paper 2,
 * ability by unit (→ spec points), a students × units heatmap (untaught units
 * hidden) and top misconceptions. BTEC / KS3 classes get the simpler version.
 *
 * Names come from the browser's name map only – nothing new is stored.
 */
var classOverview = { year: null, showUntaught: false, open: {} };

function coRag(pct) {
  if (pct == null) return 'background:#f3f4f6;color:#9ca3af';
  if (pct >= 70) return 'background:#dcfce7;color:#166534';
  if (pct >= 40) return 'background:#fef3c7;color:#92400e';
  return 'background:#fee2e2;color:#991b1b';
}
function coPct(a, p) { return p ? Math.round(a / p * 100) : null; }
function coName(code) { return (typeof studentName === 'function' && studentName(code)) || code; }
function coMedian(arr) {
  if (!arr.length) return null;
  var s = arr.slice().sort(function (a, b) { return a - b; });
  return s[Math.floor((s.length - 1) / 2)];
}
function coGradeLabel(g) { return typeof GcseCore !== 'undefined' ? GcseCore.gradeLabel(g) : (g == null ? '–' : String(g)); }
function coList(v) { return Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.keys(v).map(function (k) { return v[k]; }) : (v ? [v] : [])); }

// Everything the overview needs, in one object.
async function classOverviewData(className, settings, year) {
  var data = await classAssessmentData(className);
  var isGcse = settings.type === 'gcse';
  var codes = data.codes;
  var all = classAssessmentSummaries(data, year);
  var official = all.filter(function (S) { return !S.practice && !S.archived; }).sort(function (a, b) { return a.last - b.last; });
  var excluded = all.length - official.length;
  var extra = await Promise.all([
    Promise.all(codes.map(function (c) { return state.db.ref('accessLog/' + c + '/lastSeen').get().then(function (s) { return s.val() || 0; }).catch(function () { return 0; }); })),
    Promise.all(codes.map(function (c) { return state.db.ref('progress/' + c + '/gcseMisconceptions').get().then(function (s) { return s.val() || {}; }).catch(function () { return {}; }); })),
    isGcse ? state.db.ref('gcse/targets').get().then(function (s) { return s.val() || {}; }).catch(function () { return {}; }) : Promise.resolve({})
  ]);
  var lastSeen = {}, misc = {};
  codes.forEach(function (c, i) { lastSeen[c] = extra[0][i]; misc[c] = extra[1][i]; });
  var targetsAll = extra[2];
  var tests = (typeof gcse !== 'undefined' && gcse.tests) || {};
  // Raw GCSE results (for feedback codes) for this year's official paper tests.
  var paperIds = official.filter(function (S) { return tests[S.id]; }).map(function (S) { return S.id; });
  var raw = {};
  await Promise.all(paperIds.map(function (id) {
    return state.db.ref('gcse/results/' + id).get().then(function (s) { raw[id] = s.val() || {}; }).catch(function () { raw[id] = {}; });
  }));

  // DP for each official assessment: stored, else the class ranking (as in AP Results).
  official.forEach(function (S) {
    S.dpBy = {};
    var counted = Object.keys(S.recs).filter(function (c) { return S.notSubmitted.indexOf(c) === -1; });
    var stored = counted.filter(function (c) { return S.recs[c].dp != null; });
    if (stored.length) { stored.forEach(function (c) { S.dpBy[c] = Number(S.recs[c].dp); }); return; }
    if (typeof definitePurposeGrades !== 'function' || !counted.length) return;
    var scores = counted.map(function (c) { return Number(S.recs[c].score) || 0; }).sort(function (a, b) { return b - a; });
    var grades = definitePurposeGrades(scores);
    counted.forEach(function (c) { var i = scores.indexOf(Number(S.recs[c].score) || 0); if (i !== -1) S.dpBy[c] = Number(grades[i]); });
    S.pcts = counted.map(function (c) { var r = S.recs[c]; return r.maxScore ? r.score / r.maxScore * 100 : null; }).filter(function (v) { return v != null; });
  });
  official.forEach(function (S) {
    if (!S.pcts) S.pcts = Object.keys(S.recs).filter(function (c) { return S.notSubmitted.indexOf(c) === -1; })
      .map(function (c) { var r = S.recs[c]; return r.maxScore ? r.score / r.maxScore * 100 : null; }).filter(function (v) { return v != null; });
    S.min = S.pcts.length ? Math.round(Math.min.apply(null, S.pcts)) : null;
    S.max = S.pcts.length ? Math.round(Math.max.apply(null, S.pcts)) : null;
    S.test = tests[S.id] || null;
  });

  // Per student
  var covered = Object.keys(settings.covered || {}).map(function (k) { return k.replace(/_/g, '.'); });
  var students = codes.map(function (code) {
    var hist = [], missed = [], unit = {}, papers = {};
    var grade = null, gradeEst = false, dp = null, miscIds = {};
    official.forEach(function (S) {
      var r = S.recs[code];
      if (!r) { missed.push(S); return; }
      var ns = S.notSubmitted.indexOf(code) !== -1;
      var pct = r.maxScore ? Math.round(r.score / r.maxScore * 100) : null;
      hist.push({ id: S.id, at: r.completedAt, pct: pct, notSubmitted: ns });
      if (S.dpBy[code] != null && !ns) dp = S.dpBy[code];
      if (isGcse && !ns) {
        if (S.test) { grade = GcseCore.gradeFor(r.score, gcseBoundaries(S.test)); gradeEst = false; }
        else if (r.maxScore && (grade == null || gradeEst)) { grade = GcseCore.gradeFor(r.score, GcseCore.defaultBoundaries(r.maxScore)); gradeEst = true; }
      }
      if (S.test && !ns) {
        (r.rubric || []).forEach(function (q) {
          var topics = coList(q.topics);
          var a = Number(q.awarded) || 0, p = Number(q.marks) || 0;
          var pp = GcseCore.paperOf(topics[0]);
          if (pp) { var P = papers[pp] || (papers[pp] = { a: 0, p: 0 }); P.a += a; P.p += p; }
          topics.forEach(function (tc) {
            var n = J277.get(tc); if (!n) return;
            var area = J277.area(tc), point = J277.point(tc);
            [area && area.code, point && point.code !== (area && area.code) ? point.code : null].forEach(function (k) {
              if (!k) return; var U = unit[k] || (unit[k] = { a: 0, p: 0 }); U.a += a; U.p += p;
            });
          });
        });
        var rr = (raw[S.id] || {})[code];
        if (rr && rr.codes) Object.keys(rr.codes).forEach(function (q) { coList(rr.codes[q]).forEach(function (fc) { if (fc) miscIds[String(fc).toUpperCase()] = true; }); });
      }
    });
    Object.keys(misc[code] || {}).forEach(function (id) { miscIds[String(id).toUpperCase()] = true; });
    var pts = hist.filter(function (x) { return !x.notSubmitted && x.pct != null; });
    var avg = pts.length ? Math.round(pts.reduce(function (s, x) { return s + x.pct; }, 0) / pts.length) : null;
    var target = targetsAll[code] && targetsAll[code].grade != null ? Number(targetsAll[code].grade) : null;
    var trend = typeof gcseTrend === 'function' ? gcseTrend(hist) : { arrow: '–', label: '', cls: 'text-gray-400' };
    Object.keys(papers).forEach(function (k) { papers[k].pct = coPct(papers[k].a, papers[k].p); });
    return {
      code: code, name: coName(code), avg: avg, hist: hist, missed: missed, done: official.length - missed.length,
      grade: isGcse ? grade : null, gradeEst: gradeEst, target: isGcse ? target : null,
      gap: isGcse && grade != null && target != null ? grade - target : null,
      dp: dp, trend: trend, lastSeen: lastSeen[code] || 0, unit: unit, papers: papers, misc: Object.keys(miscIds)
    };
  }).sort(function (a, b) { return a.name.localeCompare(b.name); });

  // Needs attention
  var now = Date.now(), TWO_WEEKS = 14 * 864e5;
  students.forEach(function (s) {
    var why = [];
    if (s.gap != null && s.gap < 0) why.push({ k: 'below', t: 'Below target (' + coGradeLabel(s.grade) + (s.gradeEst ? ' est.' : '') + ' vs ' + coGradeLabel(s.target) + ')' });
    if (s.dp != null && s.dp >= 3) why.push({ k: 'dp', t: 'Low DP (' + s.dp + ')' });
    if (s.trend.arrow === '↓') why.push({ k: 'drop', t: '↓ ' + s.trend.label });
    if (s.missed.length) why.push({ k: 'missed', t: 'Missed ' + s.missed.length + ' assessment' + (s.missed.length === 1 ? '' : 's') });
    if (!s.lastSeen || now - s.lastSeen > TWO_WEEKS) why.push({ k: 'login', t: s.lastSeen ? 'Not logged in for ' + Math.floor((now - s.lastSeen) / 864e5) + ' days' : 'Never logged in' });
    s.why = why;
  });

  // Units: taught (or tested) areas only, unless "show untaught".
  var unitKeys = {};
  students.forEach(function (s) { Object.keys(s.unit).forEach(function (k) { unitKeys[k] = true; }); });
  var tested = Object.keys(unitKeys);
  var isTaught = function (code) {
    if (!covered.length) return true;
    var subs = J277.expand(code);
    return covered.some(function (c) { return subs.indexOf(c) !== -1 || J277.expand(c).some(function (x) { return subs.indexOf(x) !== -1; }); });
  };
  var areas = J277.list.filter(function (n) { return n.level === 1 && n.code.indexOf('.') !== -1; }).map(function (n) {
    var a = 0, p = 0;
    students.forEach(function (s) { var U = s.unit[n.code]; if (U) { a += U.a; p += U.p; } });
    var points = J277.list.filter(function (m) { return m.level === 2 && m.parent === n.code; }).map(function (m) {
      var a2 = 0, p2 = 0;
      students.forEach(function (s) { var U = s.unit[m.code]; if (U) { a2 += U.a; p2 += U.p; } });
      return { code: m.code, title: m.title, pct: coPct(a2, p2), taught: isTaught(m.code) };
    });
    return { code: n.code, title: n.title, pct: coPct(a, p), tested: tested.indexOf(n.code) !== -1, taught: isTaught(n.code), points: points };
  });

  // Misconceptions: students per code
  var miscCount = {};
  students.forEach(function (s) { s.misc.forEach(function (id) { (miscCount[id] = miscCount[id] || []).push(s); }); });
  var misconceptions = Object.keys(miscCount).map(function (id) { return { id: id, students: miscCount[id], info: J277.feedbackCode ? J277.feedbackCode(id) : null }; })
    .sort(function (a, b) { return b.students.length - a.students.length; });

  return { className: className, isGcse: isGcse, settings: settings, year: year, codes: codes, official: official, excluded: excluded,
    students: students, areas: areas, covered: covered, misconceptions: misconceptions, yearsData: data };
}

// ── Charts (plain SVG, tooltips via <title>) ───────────────────────────────
function coTrendChart(official) {
  var pts = official.filter(function (S) { return S.avg != null; });
  if (!pts.length) return '<p class="text-sm text-gray-500">No official results yet this year.</p>';
  var W = 640, H = 200, L = 34, R = 12, T = 18, B = 34;
  var x = function (i) { return L + (pts.length === 1 ? (W - L - R) / 2 : i * (W - L - R) / (pts.length - 1)); };
  var y = function (v) { return T + (100 - v) / 100 * (H - T - B); };
  var band = pts.map(function (S, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(S.max).toFixed(1); }).join(' ') + ' ' +
    pts.slice().reverse().map(function (S, j) { var i = pts.length - 1 - j; return 'L' + x(i).toFixed(1) + ' ' + y(S.min).toFixed(1); }).join(' ') + ' Z';
  var line = pts.map(function (S, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(S.avg).toFixed(1); }).join(' ');
  var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="w-full" style="max-height:240px" role="img" aria-label="Class average per assessment">' +
    [0, 40, 70, 100].map(function (v) { return '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="#e5e7eb" stroke-width="1"/><text x="' + (L - 4) + '" y="' + (y(v) + 3) + '" font-size="10" text-anchor="end" fill="#6b7280">' + v + '%</text>'; }).join('') +
    (pts.length > 1 ? '<path d="' + band + '" fill="rgba(176,28,35,0.10)" stroke="none"/>' : '<line x1="' + x(0) + '" x2="' + x(0) + '" y1="' + y(pts[0].max) + '" y2="' + y(pts[0].min) + '" stroke="rgba(176,28,35,0.3)" stroke-width="6" stroke-linecap="round"/>') +
    '<path d="' + line + '" fill="none" stroke="rgb(176,28,35)" stroke-width="2"/>' +
    pts.map(function (S, i) {
      var short = S.title.length > 16 ? S.title.slice(0, 15) + '…' : S.title;
      return '<g class="co-trend-pt"><circle cx="' + x(i) + '" cy="' + y(S.avg) + '" r="11" fill="transparent"/><circle cx="' + x(i) + '" cy="' + y(S.avg) + '" r="4" fill="rgb(176,28,35)" stroke="#fff" stroke-width="2"/>' +
        '<title>' + cpEsc(S.title) + ' – average ' + S.avg + '% (range ' + S.min + '–' + S.max + '%), ' + S.done + ' done</title></g>' +
        '<text x="' + x(i) + '" y="' + (y(S.avg) - 9) + '" font-size="10" text-anchor="middle" fill="#111827" font-weight="600">' + S.avg + '%</text>' +
        '<text x="' + x(i) + '" y="' + (H - B + 14) + '" font-size="9" text-anchor="middle" fill="#6b7280">' + cpEsc(short) + '</text>';
    }).join('') + '</svg>';
  return svg + '<div class="text-xs text-gray-500">Line = class average · shaded band = lowest to highest score. Hover a point for details.</div>';
}

function coGradesVsTargets(students) {
  var withG = students.filter(function (s) { return s.grade != null; });
  if (!withG.length) return '<p class="text-sm text-gray-500">No grades yet this year.</p>';
  var g = {}, t = {}, max = 1;
  students.forEach(function (s) {
    if (s.grade != null) { g[s.grade] = (g[s.grade] || 0) + 1; max = Math.max(max, g[s.grade]); }
    if (s.target != null) { t[s.target] = (t[s.target] || 0) + 1; max = Math.max(max, t[s.target]); }
  });
  var h = '<div class="flex items-end gap-2 h-32">';
  for (var k = 0; k <= 9; k++) {
    var a = g[k] || 0, b = t[k] || 0;
    h += '<div class="flex-1 flex flex-col items-center justify-end h-full"><div class="flex items-end gap-0.5 w-full justify-center h-full">' +
      '<div title="Working grade ' + coGradeLabel(k) + ': ' + a + ' student' + (a === 1 ? '' : 's') + '" class="co-bar-g w-1/2 max-w-[14px] rounded-t" style="height:' + (a / max * 100) + '%;background:rgb(176,28,35)"></div>' +
      '<div title="Target ' + coGradeLabel(k) + ': ' + b + ' student' + (b === 1 ? '' : 's') + '" class="co-bar-t w-1/2 max-w-[14px] rounded-t" style="height:' + (b / max * 100) + '%;background:#9ca3af"></div></div>' +
      '<div class="text-[10px] font-bold mt-0.5">' + coGradeLabel(k) + '</div></div>';
  }
  h += '</div><div class="flex gap-3 text-xs text-gray-600 mt-1"><span><span class="inline-block w-2.5 h-2.5 rounded-sm align-middle" style="background:rgb(176,28,35)"></span> Working grade</span><span><span class="inline-block w-2.5 h-2.5 rounded-sm align-middle" style="background:#9ca3af"></span> Target</span></div>';
  // Gap summary
  var bands = [['3+ below', function (x) { return x <= -3; }, '#991b1b'], ['2 below', function (x) { return x === -2; }, '#dc2626'], ['1 below', function (x) { return x === -1; }, '#d97706'], ['On target', function (x) { return x === 0; }, '#16a34a'], ['Above', function (x) { return x > 0; }, '#166534']];
  var gaps = students.filter(function (s) { return s.gap != null; });
  if (gaps.length) {
    h += '<div class="mt-3 text-xs"><div class="font-semibold text-gray-700 mb-1">Gap to target (' + gaps.length + ' with both)</div><div class="flex h-4 rounded overflow-hidden gap-[2px]">' + bands.map(function (B) {
      var n = gaps.filter(function (s) { return B[1](s.gap); }).length;
      return n ? '<div title="' + B[0] + ': ' + n + '" style="flex:' + n + ';background:' + B[2] + '"></div>' : '';
    }).join('') + '</div><div class="flex flex-wrap gap-x-3 mt-1 text-gray-600">' + bands.map(function (B) {
      var n = gaps.filter(function (s) { return B[1](s.gap); }).length;
      return n ? '<span><span class="inline-block w-2 h-2 rounded-sm" style="background:' + B[2] + '"></span> ' + B[0] + ' (' + n + ')</span>' : '';
    }).join('') + '</div></div>';
  }
  return h;
}

function coPaperSplit(students) {
  var P = { '1': { a: 0, p: 0 }, '2': { a: 0, p: 0 } }, weaker = { '1': 0, '2': 0 };
  students.forEach(function (s) {
    ['1', '2'].forEach(function (k) { if (s.papers[k]) { P[k].a += s.papers[k].a; P[k].p += s.papers[k].p; } });
    if (s.papers['1'] && s.papers['2'] && s.papers['1'].pct !== s.papers['2'].pct) weaker[s.papers['1'].pct < s.papers['2'].pct ? '1' : '2']++;
  });
  if (!P['1'].p && !P['2'].p) return '<p class="text-sm text-gray-500">No Paper 1 / Paper 2 test marks yet.</p>';
  var row = function (k, label) {
    var pct = coPct(P[k].a, P[k].p);
    return '<div class="flex items-center gap-2 text-sm mb-2"><span class="w-40">' + label + '</span><div class="flex-1 h-3 bg-gray-100 rounded" title="' + label + ': ' + (pct == null ? 'no marks' : pct + '%') + '">' +
      (pct == null ? '' : '<div class="h-3 rounded" style="width:' + pct + '%;background:rgb(176,28,35)"></div>') + '</div><span class="w-12 text-right text-xs font-bold">' + (pct == null ? '–' : pct + '%') + '</span></div>';
  };
  return row('1', 'Paper 1 – Computer systems') + row('2', 'Paper 2 – Thinking, algorithms') +
    (weaker['1'] + weaker['2'] ? '<p class="text-xs text-gray-600">Weaker paper: <b>Paper 1</b> – ' + weaker['1'] + ' student' + (weaker['1'] === 1 ? '' : 's') + ', <b>Paper 2</b> – ' + weaker['2'] + ' student' + (weaker['2'] === 1 ? '' : 's') + '.</p>' : '<p class="text-xs text-gray-500">Students need marks on both papers to compare.</p>');
}

function coUnitAbility(O) {
  var shown = O.areas.filter(function (A) { return A.tested || (O.covered.length && (A.taught || classOverview.showUntaught)); })
    .filter(function (A) { return classOverview.showUntaught || A.taught; });
  var hidden = O.areas.filter(function (A) { return !A.taught; }).length;
  var h = shown.length ? shown.map(function (A) {
    var open = !!classOverview.open[A.code];
    var bar = function (pct, label, cls, code, title) {
      return '<div class="flex items-center gap-2 text-sm ' + cls + '"><span class="w-56 truncate" title="' + cpEsc(title) + '">' + label + '</span><div class="flex-1 h-3 bg-gray-100 rounded" title="' + cpEsc(title) + ': ' + (pct == null ? 'not tested yet' : pct + '%') + '">' +
        (pct == null ? '' : '<div class="h-3 rounded" style="width:' + pct + '%;background:' + (pct >= 70 ? '#16a34a' : pct >= 40 ? '#d97706' : '#dc2626') + '"></div>') +
        '</div><span class="w-16 text-right text-xs ' + (pct == null ? 'text-gray-400' : 'font-bold') + '">' + (pct == null ? 'not tested' : pct + '%') + '</span></div>';
    };
    var pts = A.points.filter(function (p) { return p.pct != null || classOverview.showUntaught || p.taught; });
    return '<div class="mb-1"><button type="button" class="co-unit w-full text-left" data-code="' + cpEsc(A.code) + '" aria-expanded="' + open + '">' +
      bar(A.pct, '<span class="text-gray-400 inline-block w-3">' + (pts.length ? (open ? '▾' : '▸') : '') + '</span>' + cpEsc(A.code + ' ' + A.title), 'py-0.5', A.code, A.code + ' ' + A.title) + '</button>' +
      (open ? '<div class="ml-5 mb-1">' + pts.map(function (p) { return bar(p.pct, cpEsc(p.code + ' ' + p.title), 'py-0.5 text-gray-700', p.code, p.code + ' ' + p.title); }).join('') + '</div>' : '') + '</div>';
  }).join('') : '<p class="text-sm text-gray-500">No units taught or tested yet. Tick topics as taught in Settings.</p>';
  if (hidden && O.covered.length) h += '<label class="text-xs text-gray-600 mt-2 inline-flex items-center gap-1"><input type="checkbox" class="co-untaught"' + (classOverview.showUntaught ? ' checked' : '') + '> Show units not taught yet (' + hidden + ')</label>';
  return h + '<p class="text-xs text-gray-500 mt-1">From official GCSE test marks. Click a unit to see its spec points.</p>';
}

function coHeatmap(O) {
  var areas = O.areas.filter(function (A) { return A.tested && (classOverview.showUntaught || A.taught); });
  if (!areas.length) return '<p class="text-sm text-gray-500">No unit data yet – it appears after an official GCSE test.</p>';
  var h = '<div class="overflow-x-auto"><table class="text-xs border-separate" style="border-spacing:2px"><tr><th class="p-1 text-left sticky left-0 bg-white">Student</th>' +
    areas.map(function (A) { return '<th class="p-1 font-mono" title="' + cpEsc(A.code + ' ' + A.title) + '">' + cpEsc(A.code) + '</th>'; }).join('') + '</tr>' +
    '<tr class="font-bold"><td class="p-1 sticky left-0 bg-white">Class</td>' + areas.map(function (A) { return '<td class="p-1 text-center rounded" style="' + coRag(A.pct) + '">' + (A.pct == null ? '' : A.pct + '%') + '</td>'; }).join('') + '</tr>';
  O.students.forEach(function (s) {
    h += '<tr><td class="p-1 whitespace-nowrap sticky left-0 bg-white"><button type="button" class="co-profile underline decoration-dotted" data-code="' + cpEsc(s.code) + '">' + cpEsc(s.name) + '</button></td>' + areas.map(function (A) {
      var U = s.unit[A.code]; var pct = U ? coPct(U.a, U.p) : null;
      return '<td class="p-1 text-center rounded min-w-[38px]" style="' + coRag(pct) + '" title="' + cpEsc(s.name + ' – ' + A.code + ' ' + A.title + ': ' + (pct == null ? 'no marks' : pct + '%')) + '">' + (pct == null ? '' : pct) + '</td>';
    }).join('') + '</tr>';
  });
  return h + '</table></div><p class="text-xs text-gray-500 mt-1">Green ≥ 70%, amber 40–69%, red &lt; 40%. Blank = not tested. Click a name to open the profile.</p>';
}

// ── Render ─────────────────────────────────────────────────────────────────
async function classOverviewRender(body, className, settings) {
  body.innerHTML = '<p class="text-gray-400 text-sm">Loading overview…</p>';
  if (classOverview.className !== className) { classOverview = { year: null, showUntaught: false, open: {}, className: className }; }
  if (classOverview.year == null) classOverview.year = currentAcademicYear();
  var O;
  try { O = await classOverviewData(className, settings || {}, classOverview.year); }
  catch (e) { body.innerHTML = '<p class="text-sm text-red-700">Could not load the overview: ' + cpEsc(e && e.message || e) + '</p>'; return; }
  if (classPage.className !== className || classPage.tab !== 'overview') return;
  classOverview.data = O;
  classOverviewDraw(body);
}

function classOverviewDraw(body) {
  var O = classOverview.data;
  var S = O.students, n = S.length;
  var years = {}; years[currentAcademicYear()] = true;
  O.yearsData.codes.forEach(function (c) { Object.keys(O.yearsData.recs[c] || {}).forEach(function (id) { years[academicYearStart(O.yearsData.recs[c][id].completedAt)] = true; }); });
  var yearList = Object.keys(years).map(Number).sort(function (a, b) { return b - a; });
  var avgs = S.filter(function (s) { return s.avg != null; }).map(function (s) { return s.avg; });
  var classAvg = avgs.length ? Math.round(avgs.reduce(function (a, b) { return a + b; }, 0) / avgs.length) : null;
  var slots = O.official.length * n, doneSlots = O.official.reduce(function (s, A) { return s + A.done; }, 0);
  var completion = slots ? Math.round(doneSlots / slots * 100) : null;
  var card = function (v, l, sub, cls) { return '<div class="rounded-lg border border-gray-200 p-3"><div class="text-xs text-gray-500">' + l + '</div><div class="text-2xl font-bold ' + (cls || '') + '">' + v + '</div>' + (sub ? '<div class="text-[11px] text-gray-500">' + sub + '</div>' : '') + '</div>'; };
  var h = '<div class="flex flex-wrap items-center gap-3 mb-3 text-sm"><label class="text-xs text-gray-500">Year <select id="co-year" class="border border-gray-300 rounded px-2 py-1 text-sm ml-1">' +
    yearList.map(function (y) { return '<option value="' + y + '"' + (Number(O.year) === y ? ' selected' : '') + '>' + academicYearLabel(y) + (y === currentAcademicYear() ? ' (this year)' : '') + '</option>'; }).join('') + '</select></label>' +
    '<span class="text-xs text-gray-500">Official assessments only' + (O.excluded ? ' · ' + O.excluded + ' practice/archived left out' : '') + '.</span>' +
    '<button type="button" id="co-export" class="ml-auto px-3 py-1 rounded border border-gray-300 text-xs font-semibold" title="Download a spreadsheet of this class (names come from your browser, not Firebase)">Export CSV</button></div>';
  // Cards
  h += '<div class="grid grid-cols-2 md:grid-cols-' + (O.isGcse ? '6' : '4') + ' gap-2 mb-4">' +
    card(n, 'Students') +
    card(classAvg == null ? '–' : classAvg + '%', 'Average this year', O.official.length + ' official assessment' + (O.official.length === 1 ? '' : 's')) +
    card(completion == null ? '–' : completion + '%', 'Completion', doneSlots + ' of ' + slots + ' done', completion != null && completion < 80 ? 'text-amber-700' : '');
  if (O.isGcse) {
    var grades = S.filter(function (s) { return s.grade != null; }).map(function (s) { return s.grade; });
    var targets = S.filter(function (s) { return s.target != null; }).map(function (s) { return s.target; });
    var both = S.filter(function (s) { return s.gap != null; });
    var onT = both.filter(function (s) { return s.gap >= 0; }).length;
    var dps = { 1: 0, 2: 0, 3: 0, 4: 0 }; S.forEach(function (s) { if (s.dp != null && dps[s.dp] != null) dps[s.dp]++; });
    var dpN = dps[1] + dps[2] + dps[3] + dps[4];
    var dpCols = { 1: '#166534', 2: '#16a34a', 3: '#d97706', 4: '#dc2626' };
    h += card(coGradeLabel(coMedian(grades)) + ' <span class="text-base text-gray-400 font-normal">vs</span> ' + coGradeLabel(coMedian(targets)), 'Working grade vs target', 'median of the class') +
      card(both.length ? Math.round(onT / both.length * 100) + '%' : '–', 'On or above target', both.length ? onT + ' of ' + both.length + ' with a target' : 'set targets in the GCSE tab', both.length && onT / both.length < 0.5 ? 'text-red-700' : '') +
      '<div class="rounded-lg border border-gray-200 p-3"><div class="text-xs text-gray-500">DP spread (latest)</div>' +
        (dpN ? '<div class="flex h-4 rounded overflow-hidden gap-[2px] mt-2">' + [1, 2, 3, 4].map(function (d) { return dps[d] ? '<div title="DP ' + d + ': ' + dps[d] + '" style="flex:' + dps[d] + ';background:' + dpCols[d] + '"></div>' : ''; }).join('') + '</div>' +
          '<div class="flex gap-2 text-[11px] text-gray-600 mt-1">' + [1, 2, 3, 4].map(function (d) { return '<span>DP' + d + ' <b>' + dps[d] + '</b></span>'; }).join('') + '</div>' : '<div class="text-2xl font-bold">–</div>') + '</div>';
  } else {
    var up = S.filter(function (s) { return s.trend.arrow === '↑'; }).length, down = S.filter(function (s) { return s.trend.arrow === '↓'; }).length;
    h += card('<span class="text-green-700">↑' + up + '</span> <span class="text-red-700">↓' + down + '</span>', 'Trend', 'improving / dropping (last 3)');
  }
  h += '</div>';
  // Row: trend chart + needs attention
  var attention = S.filter(function (s) { return s.why.length; }).sort(function (a, b) { return b.why.length - a.why.length || a.name.localeCompare(b.name); });
  var filt = classOverview.attnFilter || 'all';
  var kinds = [['all', 'All'], ['below', 'Below target'], ['dp', 'Low DP'], ['drop', '↓ Dropping'], ['missed', 'Missed'], ['login', 'Not logged in']].filter(function (k) { return O.isGcse || k[0] !== 'below'; });
  var attnShown = attention.filter(function (s) { return filt === 'all' || s.why.some(function (w) { return w.k === filt; }); });
  h += '<div class="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4"><div class="lg:col-span-3 border border-gray-200 rounded-lg p-3"><h4 class="font-bold text-gray-800 mb-2">Class average per assessment</h4>' + coTrendChart(O.official) + '</div>' +
    '<div class="lg:col-span-2 border border-gray-200 rounded-lg p-3"><h4 class="font-bold text-gray-800 mb-1">Needs attention <span class="text-xs font-normal text-gray-500">(' + attention.length + ')</span></h4>' +
    '<div class="flex flex-wrap gap-1 mb-2">' + kinds.map(function (k) {
      var c = k[0] === 'all' ? attention.length : attention.filter(function (s) { return s.why.some(function (w) { return w.k === k[0]; }); }).length;
      return '<button type="button" class="co-attn-f text-[11px] px-2 py-0.5 rounded-full border ' + (filt === k[0] ? 'border-[rgb(176,28,35)] text-[rgb(176,28,35)] bg-red-50 font-semibold' : 'border-gray-300 text-gray-600') + '" data-k="' + k[0] + '">' + k[1] + ' ' + c + '</button>';
    }).join('') + '</div><div class="max-h-72 overflow-y-auto">' +
    (attnShown.length ? attnShown.map(function (s) {
      return '<div class="co-attn-row border-t border-gray-100 py-1.5 text-sm"><div class="flex justify-between gap-2"><button type="button" class="co-profile font-semibold underline decoration-dotted text-left" data-code="' + cpEsc(s.code) + '">' + cpEsc(s.name) + '</button>' +
        '<span class="text-xs whitespace-nowrap ' + s.trend.cls + '" title="' + cpEsc(s.trend.label) + '">' + s.trend.arrow + (s.avg != null ? ' ' + s.avg + '%' : '') + '</span></div>' +
        '<div class="text-xs text-gray-600">' + s.why.map(function (w) { return cpEsc(w.t); }).join(' · ') + '</div>' +
        (s.missed.length ? '<button type="button" class="co-catchup text-[11px] text-blue-700 underline" data-code="' + cpEsc(s.code) + '" data-id="' + cpEsc(s.missed[s.missed.length - 1].id) + '">Catch up: Force AP "' + cpEsc(s.missed[s.missed.length - 1].title) + '"</button>' : '') + '</div>';
    }).join('') : '<p class="text-sm text-gray-500">Nobody – good news.</p>') + '</div></div></div>';
  if (O.isGcse) {
    h += '<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4"><div class="border border-gray-200 rounded-lg p-3"><h4 class="font-bold text-gray-800 mb-2">Grades vs targets</h4>' + coGradesVsTargets(S) + '</div>' +
      '<div class="border border-gray-200 rounded-lg p-3"><h4 class="font-bold text-gray-800 mb-2">Paper 1 vs Paper 2</h4>' + coPaperSplit(S) + '</div></div>' +
      '<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4"><div class="border border-gray-200 rounded-lg p-3"><h4 class="font-bold text-gray-800 mb-2">Ability by unit</h4>' + coUnitAbility(O) + '</div>' +
      '<div class="border border-gray-200 rounded-lg p-3"><h4 class="font-bold text-gray-800 mb-2">Top misconceptions</h4>' +
      (O.misconceptions.length ? O.misconceptions.slice(0, 8).map(function (m) {
        return '<div class="text-sm mb-1.5"><div><span class="px-1.5 rounded bg-amber-100 text-amber-900 font-bold text-xs">' + cpEsc(m.id) + '</span> ' + cpEsc(m.info ? m.info.text : '') +
          ' <span class="text-xs text-gray-500">– ' + m.students.length + ' student' + (m.students.length === 1 ? '' : 's') + '</span></div><div class="text-[11px] text-gray-500">' + m.students.map(function (s) { return cpEsc(s.name); }).join(', ') + '</div></div>';
      }).join('') : '<p class="text-sm text-gray-500">None recorded yet. They come from feedback codes on marked answers and from quizzes.</p>') + '</div></div>' +
      '<div class="border border-gray-200 rounded-lg p-3 mb-4"><h4 class="font-bold text-gray-800 mb-2">Students × units</h4>' + coHeatmap(O) + '</div>';
  }
  // Completion
  h += '<div class="border border-gray-200 rounded-lg p-3"><h4 class="font-bold text-gray-800 mb-2">Completion</h4>' +
    (O.official.length ? O.official.slice().reverse().map(function (A) {
      var pct = n ? Math.round(A.done / n * 100) : 0;
      return '<div class="flex items-center gap-2 text-sm mb-1"><span class="w-56 truncate" title="' + cpEsc(A.title) + '">' + cpEsc(A.title) + '</span><div class="flex-1 h-2.5 bg-gray-100 rounded"><div class="h-2.5 rounded" style="width:' + pct + '%;background:' + (pct >= 100 ? '#16a34a' : '#d97706') + '"></div></div>' +
        '<span class="w-24 text-right text-xs ' + (A.missing.length ? 'text-amber-700' : 'text-green-700') + '" title="' + cpEsc(A.missing.map(coName).join(', ')) + '">' + A.done + '/' + n + (A.missing.length ? '' : ' ✓') + '</span></div>';
    }).join('') : '<p class="text-sm text-gray-500">No official assessments this year yet.</p>') + '</div>';
  body.innerHTML = h;
  // Bind
  var yearSel = body.querySelector('#co-year');
  if (yearSel) yearSel.onchange = function () { classOverview.year = Number(yearSel.value); classOverviewRender(body, O.className, O.settings); };
  var ex = body.querySelector('#co-export');
  if (ex) ex.onclick = function () { classOverviewExport(O); };
  body.querySelectorAll('.co-attn-f').forEach(function (b) { b.onclick = function () { classOverview.attnFilter = b.dataset.k; classOverviewDraw(body); }; });
  body.querySelectorAll('.co-unit').forEach(function (b) { b.onclick = function () { classOverview.open[b.dataset.code] = !classOverview.open[b.dataset.code]; classOverviewDraw(body); }; });
  var ut = body.querySelector('.co-untaught');
  if (ut) ut.onchange = function () { classOverview.showUntaught = ut.checked; classOverviewDraw(body); };
  body.querySelectorAll('.co-profile').forEach(function (b) { b.onclick = function () { if (typeof openGcseProfile === 'function') openGcseProfile(b.dataset.code); }; });
  body.querySelectorAll('.co-catchup').forEach(function (b) {
    b.onclick = async function () {
      var id = b.dataset.id, code = b.dataset.code;
      var runnable = typeof ASSESSMENTS !== 'undefined' && ASSESSMENTS[id] && ASSESSMENTS[id].type !== 'paper' && typeof assignForcedApToStudent === 'function';
      if (!runnable) { b.outerHTML = '<span class="text-[11px] text-gray-600">Paper test – add their marks in the GCSE tab when they have sat it.</span>'; return; }
      b.disabled = true; b.textContent = 'Assigning…';
      try { await assignForcedApToStudent(O.className, code, id); b.textContent = 'Assigned ✓'; }
      catch (e) { b.disabled = false; b.textContent = 'Could not assign: ' + (e && e.message || e); }
    };
  });
}

// ── Class export (CSV) ─────────────────────────────────────────────────────
function classOverviewCsvRows(O) {
  var areas = O.isGcse ? O.areas.filter(function (A) { return A.tested; }) : [];
  var head = ['Name', 'Code', 'Average %', 'Trend', 'Done', 'Missed'];
  if (O.isGcse) head = head.concat(['Working grade', 'Target', 'Gap', 'Paper 1 %', 'Paper 2 %']);
  head = head.concat(['Latest DP', 'Last login', 'Needs attention']);
  O.official.forEach(function (A) { head.push(A.title + ' %'); });
  areas.forEach(function (A) { head.push(A.code + ' ' + A.title + ' %'); });
  if (O.isGcse) head.push('Misconceptions');
  var rows = [head];
  O.students.forEach(function (s) {
    var r = [s.name === s.code ? '' : s.name, s.code, s.avg == null ? '' : s.avg, s.trend.arrow === '–' ? '' : s.trend.label, s.done, s.missed.map(function (A) { return A.title; }).join('; ')];
    if (O.isGcse) r = r.concat([s.grade == null ? '' : coGradeLabel(s.grade) + (s.gradeEst ? ' est.' : ''), s.target == null ? '' : coGradeLabel(s.target), s.gap == null ? '' : s.gap,
      s.papers['1'] ? s.papers['1'].pct : '', s.papers['2'] ? s.papers['2'].pct : '']);
    r = r.concat([s.dp == null ? '' : s.dp, s.lastSeen ? new Date(s.lastSeen).toLocaleDateString('en-GB') : 'never', s.why.map(function (w) { return w.t; }).join('; ')]);
    O.official.forEach(function (A) {
      var rec = A.recs[s.code];
      r.push(!rec ? 'missing' : A.notSubmitted.indexOf(s.code) !== -1 ? 'not submitted' : (rec.maxScore ? Math.round(rec.score / rec.maxScore * 100) : ''));
    });
    areas.forEach(function (A) { var U = s.unit[A.code]; r.push(U ? coPct(U.a, U.p) : ''); });
    if (O.isGcse) r.push(s.misc.join(' '));
    rows.push(r);
  });
  return rows;
}
function classOverviewExport(O) {
  var rows = classOverviewCsvRows(O);
  var csv = rows.map(function (r) {
    return r.map(function (v) { v = String(v == null ? '' : v); return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(',');
  }).join('\r\n');
  var name = (O.className + ' ' + academicYearLabel(O.year) + ' overview.csv').replace(/[\/:*?"<>|]/g, '-');
  var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  classOverview.lastExport = { name: name, rows: rows };
}
