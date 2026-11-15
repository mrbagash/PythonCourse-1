/**
 * class-page-module.js – the Class page (Classroom Management → click a class).
 *
 * Settings live in classes/{class}/settings (staff-only, codes only – never names):
 *   type        'gcse' | 'btec' | 'ks3'   (unset = not chosen yet)
 *   yearGroup, examYear
 *   covered     { '1_1_1e': { s: 'taught'|'revisited', at } }   GCSE content covered so far
 *   access      { code: { extraTime: true, reader: true } }       access arrangements
 * GCSE features only list classes whose type is 'gcse'.
 */
var CLASS_TYPES = { gcse: 'GCSE', btec: 'BTEC', ks3: 'KS3' };

// ── Academic years + per-class assessment flags (shared by AP Results, Class page, profiles) ──
// Academic year starts 1 September: Sept 2026 – Aug 2027 = 2026 ("2026/27").
function academicYearStart(ts) { var d = new Date(ts || Date.now()); return d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1; }
function academicYearLabel(start) { return start + '/' + String((Number(start) + 1) % 100).padStart(2, '0'); }
function currentAcademicYear() { return academicYearStart(Date.now()); }
function assessmentFlagKey(id) { return String(id || '').replace(/[.#$/\[\]]/g, '-'); }
// classes/{class}/assessmentFlags/{id}: { archived, practice, official, at }
async function loadAssessmentFlags(className) {
  if (!className) return {};
  try { var snap = await state.db.ref('classes/' + className + '/assessmentFlags').get(); return snap.exists() ? (snap.val() || {}) : {}; }
  catch (e) { return {}; }
}
function assessmentIsArchived(id, flags) { var f = flags && flags[assessmentFlagKey(id)]; return !!(f && f.archived); }
// Practice unless marked official: flagged practice, or "practice" in the AP's id/title.
function assessmentIsPractice(id, flags) {
  var f = flags && flags[assessmentFlagKey(id)];
  if (f && f.official) return false;
  if (f && f.practice) return true;
  var a = typeof ASSESSMENTS !== 'undefined' ? ASSESSMENTS[id] : null;
  return /practice/i.test(String(id) + ' ' + ((a && a.title) || ''));
}
var classPage = { className: '', tab: null, cache: {} };

function cpEsc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
function cpKey(code) { return String(code).replace(/\./g, '_'); }

async function classSettings(className, fresh) {
  if (!className) return {};
  if (!fresh && classPage.cache[className]) return classPage.cache[className];
  var snap = await state.db.ref('classes/' + className + '/settings').get();
  var s = snap.exists() ? (snap.val() || {}) : {};
  classPage.cache[className] = s;
  return s;
}
async function classSettingsMany(names) {
  var out = {};
  await Promise.all((names || []).map(async function (n) {
    try { out[n] = await classSettings(n); } catch (e) { out[n] = {}; }
  }));
  return out;
}
// Class names whose type is GCSE (used by every GCSE dropdown).
async function gcseClassNamesOnly() {
  var names = typeof getClassNames === 'function' ? await getClassNames() : [];
  var settings = await classSettingsMany(names);
  return names.filter(function (n) { return settings[n] && settings[n].type === 'gcse'; });
}
function classTypeLabel(type) { return CLASS_TYPES[type] || 'Type not set'; }
function classTypeStyle(type) {
  return type === 'gcse' ? 'bg-red-50 text-[rgb(176,28,35)] border border-red-200'
    : type === 'btec' ? 'bg-blue-50 text-blue-700 border border-blue-200'
    : type === 'ks3' ? 'bg-green-50 text-green-700 border border-green-200'
    : 'bg-amber-50 text-amber-800 border border-amber-200';
}

// Suggested type from the year in the class name: 7–9 → KS3, 10–11 → GCSE (never saved until confirmed).
function suggestClassType(className) {
  var y = typeof classYearGroup === 'function' ? classYearGroup(className) : null;
  if (y >= 7 && y <= 9) return 'ks3';
  if (y === 10 || y === 11) return 'gcse';
  return null;
}

// Classroom Management cards: show each class's type (click to set it), with a suggestion when unset.
async function classPageFillTypeBadges() {
  var badges = document.querySelectorAll('.class-type-badge');
  var names = Array.prototype.map.call(badges, function (b) { return b.dataset.class; });
  var settings = await classSettingsMany(names);
  classBulk.settings = settings;
  badges.forEach(function (b) {
    var name = b.dataset.class;
    var t = (settings[name] || {}).type;
    b.textContent = classTypeLabel(t);
    b.className = 'class-type-badge text-xs px-2 py-0.5 rounded-full cursor-pointer ' + classTypeStyle(t);
    b.title = t ? 'Open class page' : 'Choose GCSE, BTEC or KS3';
    b.onclick = function () { openClassPage(name); };
    var old = b.parentNode.querySelector('.class-type-suggest');
    if (old) old.remove();
    var sug = !t && suggestClassType(name);
    if (sug) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'class-type-suggest text-xs px-2 py-0.5 rounded-full border border-dashed border-gray-400 text-gray-600 hover:bg-gray-50';
      btn.dataset.class = name; btn.dataset.type = sug;
      btn.textContent = 'Set ' + CLASS_TYPES[sug] + '?';
      btn.title = 'Suggested from the year in the class name – click to confirm';
      btn.onclick = function () { classBulkSetType([name], sug); };
      b.parentNode.insertBefore(btn, b);
    }
  });
  classBulkRender();
}

// ── Bulk setup: select many classes, set type / exam year / year group at once ──
var classBulk = { on: false, selected: {}, settings: {} };
function classBulkNames() {
  return Array.prototype.map.call(document.querySelectorAll('#classroom-existing-classes .class-page-link'), function (b) { return b.dataset.class; });
}
function classBulkRender() {
  var bar = document.getElementById('classroom-bulk-bar');
  if (!bar) return;
  var names = classBulkNames();
  if (!names.length) { bar.innerHTML = ''; return; }
  // Card tick boxes
  document.querySelectorAll('#classroom-existing-classes .class-page-link').forEach(function (link) {
    var card = link.parentNode;
    var cb = card.querySelector('.class-bulk-check');
    if (classBulk.on) {
      if (!cb) {
        cb = document.createElement('input');
        cb.type = 'checkbox'; cb.className = 'class-bulk-check absolute top-3 left-3 w-4 h-4'; cb.dataset.class = link.dataset.class;
        cb.onchange = function () { if (cb.checked) classBulk.selected[cb.dataset.class] = true; else delete classBulk.selected[cb.dataset.class]; classBulkRender(); };
        card.appendChild(cb);
        link.classList.add('pl-6');
      }
      cb.checked = !!classBulk.selected[link.dataset.class];
      card.classList.toggle('ring-2', cb.checked);
      card.classList.toggle('ring-[rgb(176,28,35)]', cb.checked);
    } else if (cb) { cb.remove(); link.classList.remove('pl-6'); card.classList.remove('ring-2', 'ring-[rgb(176,28,35)]'); }
  });
  if (!classBulk.on) {
    bar.innerHTML = '<button type="button" id="class-bulk-toggle" class="px-3 py-1.5 rounded border border-gray-300 text-sm bg-white hover:bg-gray-50">Select classes…</button>';
    document.getElementById('class-bulk-toggle').onclick = function () { classBulk.on = true; classBulk.selected = {}; classBulkRender(); };
    return;
  }
  var years = {};
  names.forEach(function (n) { var y = typeof classYearGroup === 'function' ? classYearGroup(n) : null; if (y) years[y] = true; });
  var count = Object.keys(classBulk.selected).length;
  bar.innerHTML = '<div class="rounded-lg border border-gray-300 bg-gray-50 p-3 text-sm space-y-2">' +
    '<div class="flex flex-wrap items-center gap-2"><b>' + count + ' selected</b>' +
      '<span class="text-xs text-gray-500 ml-2">Select:</span>' +
      '<button type="button" class="cb-q px-2 py-0.5 rounded border border-gray-300 bg-white text-xs" data-q="all">All</button>' +
      '<button type="button" class="cb-q px-2 py-0.5 rounded border border-gray-300 bg-white text-xs" data-q="none">None</button>' +
      '<button type="button" class="cb-q px-2 py-0.5 rounded border border-gray-300 bg-white text-xs" data-q="unset">Type not set</button>' +
      Object.keys(years).sort(function (a, b) { return a - b; }).map(function (y) { return '<button type="button" class="cb-q px-2 py-0.5 rounded border border-gray-300 bg-white text-xs" data-q="y' + y + '">Year ' + y + '</button>'; }).join('') +
      '<input id="class-bulk-search" class="border border-gray-300 rounded px-2 py-0.5 text-xs w-40" placeholder="Select by name…">' +
      '<button type="button" id="class-bulk-done" class="ml-auto px-2 py-0.5 rounded border border-gray-300 bg-white text-xs">Done</button></div>' +
    '<div class="flex flex-wrap items-center gap-2"><span class="text-xs text-gray-500">Set type:</span>' +
      ['gcse', 'btec', 'ks3'].map(function (t) { return '<button type="button" class="cb-type px-3 py-1 rounded text-xs font-semibold ' + classTypeStyle(t) + '" data-type="' + t + '"' + (count ? '' : ' disabled') + '>' + CLASS_TYPES[t] + '</button>'; }).join('') +
      '<span class="text-xs text-gray-500 ml-3">Exam year</span><input id="class-bulk-exam" type="number" min="2024" max="2040" class="border border-gray-300 rounded px-2 py-0.5 text-xs w-20" placeholder="2027">' +
      '<span class="text-xs text-gray-500">Year group</span><input id="class-bulk-year" type="number" min="7" max="13" class="border border-gray-300 rounded px-2 py-0.5 text-xs w-14">' +
      '<button type="button" id="class-bulk-apply" class="px-2 py-0.5 rounded border border-gray-300 bg-white text-xs"' + (count ? '' : ' disabled') + '>Apply</button>' +
      '<button type="button" id="class-bulk-archive" class="px-2 py-0.5 rounded border border-gray-300 bg-white text-xs ml-3"' + (count ? '' : ' disabled') + '>Archive selected</button>' +
      '<span id="class-bulk-status" class="text-xs text-gray-600"></span></div></div>';
  bar.querySelectorAll('.cb-q').forEach(function (b) {
    b.onclick = function () {
      var q = b.dataset.q;
      if (q === 'none') classBulk.selected = {};
      names.forEach(function (n) {
        var t = (classBulk.settings[n] || {}).type;
        var y = typeof classYearGroup === 'function' ? classYearGroup(n) : null;
        if (q === 'all' || (q === 'unset' && !t) || (q.charAt(0) === 'y' && String(y) === q.slice(1))) classBulk.selected[n] = true;
      });
      classBulkRender();
    };
  });
  var search = document.getElementById('class-bulk-search');
  search.onkeydown = function (e) {
    if (e.key !== 'Enter' || !search.value.trim()) return;
    var term = search.value.trim().toLowerCase();
    names.forEach(function (n) { if (n.toLowerCase().indexOf(term) !== -1) classBulk.selected[n] = true; });
    classBulkRender();
  };
  document.getElementById('class-bulk-done').onclick = function () { classBulk.on = false; classBulk.selected = {}; classBulkRender(); };
  bar.querySelectorAll('.cb-type').forEach(function (b) { b.onclick = function () { classBulkSetType(Object.keys(classBulk.selected), b.dataset.type); }; });
  document.getElementById('class-bulk-apply').onclick = async function () {
    var exam = Number(document.getElementById('class-bulk-exam').value) || null;
    var yg = Number(document.getElementById('class-bulk-year').value) || null;
    if (!exam && !yg) { document.getElementById('class-bulk-status').textContent = 'Enter an exam year or year group first.'; return; }
    var updates = {};
    Object.keys(classBulk.selected).forEach(function (n) {
      if (exam) updates['classes/' + n + '/settings/examYear'] = exam;
      if (yg) updates['classes/' + n + '/settings/yearGroup'] = yg;
      updates['classes/' + n + '/settings/updatedAt'] = Date.now();
    });
    await classBulkSave(updates, 'Updated ' + Object.keys(classBulk.selected).length + ' classes.');
  };
  document.getElementById('class-bulk-archive').onclick = function () {
    var list = Object.keys(classBulk.selected);
    if (!list.length || !confirm('Archive ' + list.length + ' class' + (list.length === 1 ? '' : 'es') + '? Nothing is deleted and you can unarchive them.')) return;
    classBulk.selected = {};
    setClassesArchived(list, true);
  };
}
async function classBulkSetType(names, type) {
  if (!names.length) return;
  var updates = {};
  names.forEach(function (n) {
    updates['classes/' + n + '/settings/type'] = type;
    updates['classes/' + n + '/settings/updatedAt'] = Date.now();
  });
  await classBulkSave(updates, 'Set ' + names.length + ' class' + (names.length === 1 ? '' : 'es') + ' to ' + CLASS_TYPES[type] + '.');
}
async function classBulkSave(updates, msg) {
  try {
    await state.db.ref().update(updates);
    Object.keys(updates).forEach(function (k) { var n = k.split('/')[1]; delete classPage.cache[n]; });
    await classPageFillTypeBadges();
    var st = document.getElementById('class-bulk-status');
    if (st) st.textContent = msg;
    if (typeof classroomSetStatus === 'function') classroomSetStatus(msg);
  } catch (e) {
    if (typeof classroomSetStatus === 'function') classroomSetStatus('Could not save: ' + e.message, true);
  }
}

document.addEventListener('click', function (e) {
  var el = e.target && e.target.closest && e.target.closest('.class-page-link');
  if (!el || !(state && (state.isAdmin || state.isTeacher))) return;
  e.preventDefault();
  openClassPage(el.dataset.class);
});

// ── Class page ──────────────────────────────────────────────────
async function openClassPage(className, tab) {
  if (!className) return;
  classPage.className = className;
  classPage.tab = tab || null;   // default: first tab (or Settings if the type isn't set yet)
  var modal = document.getElementById('modal-class-page');
  modal.classList.remove('hidden');
  document.getElementById('class-page-close').onclick = function () { modal.classList.add('hidden'); };
  document.getElementById('class-page-title').textContent = className;
  await classPageRender();
}
async function classPageRender() {
  var className = classPage.className;
  var settings = await classSettings(className, true);
  var tabs = [['assessments', 'Assessments'], ['settings', 'Settings']];
  if (typeof classOverviewRender === 'function') tabs.unshift(['overview', 'Overview']);
  if (!classPage.tab) classPage.tab = settings.type ? tabs[0][0] : 'settings';
  if (!tabs.some(function (t) { return t[0] === classPage.tab; })) classPage.tab = tabs[0][0];
  var tabsEl = document.getElementById('class-page-tabs');
  tabsEl.innerHTML = tabs.map(function (t) {
    var on = t[0] === classPage.tab;
    return '<button type="button" class="cp-tab px-3 py-1.5 rounded border text-sm font-semibold ' + (on ? 'border-[rgb(176,28,35)] text-[rgb(176,28,35)] bg-red-50' : 'border-gray-300 text-gray-600 bg-white') + '" data-tab="' + t[0] + '">' + t[1] + '</button>';
  }).join('') + '<span class="text-xs px-2 py-0.5 rounded-full self-center ' + classTypeStyle(settings.type) + '">' + classTypeLabel(settings.type) + '</span>';
  tabsEl.querySelectorAll('.cp-tab').forEach(function (b) { b.onclick = function () { classPage.tab = b.dataset.tab; classPageRender(); }; });
  var body = document.getElementById('class-page-body');
  if (classPage.tab === 'overview') return classOverviewRender(body, className, settings);
  if (classPage.tab === 'assessments') return classAssessmentsRender(body, className, settings);
  return classPageRenderSettings(body, className, settings);
}

// ── Shared: every assessment result for a class's current students ──────────
// { codes, recs: {code: {assessmentId: rec}}, flags }. GCSE tests use the canonical (teacher) results.
async function classAssessmentData(className) {
  var codesSnap = await state.db.ref('classes/' + className + '/codes').get();
  var codes = codesSnap.exists() ? Object.keys(codesSnap.val() || {}) : [];
  var paper = typeof gcseLoadPaperTestsForClass === 'function' ? await gcseLoadPaperTestsForClass(className) : { results: {} };
  var flags = await loadAssessmentFlags(className);
  var recs = {};
  await Promise.all(codes.map(async function (code) {
    var snap = await state.db.ref('progress/' + code + '/assessments').get();
    var all = snap.exists() ? (snap.val() || {}) : {};
    var mine = {};
    Object.keys(all).forEach(function (id) {
      var r = all[id];
      if (!r) return;
      var latest = r;
      if (r.attempts) {   // retakes: the latest attempt counts
        Object.keys(r.attempts).forEach(function (k) { var a = r.attempts[k]; if (a && a.completedAt && (!latest.completedAt || a.completedAt > latest.completedAt)) latest = Object.assign({}, a); });
      }
      if (!latest.completedAt || latest.pending) return;
      var target = (typeof ASSESSMENTS !== 'undefined' && ASSESSMENTS[id] && ASSESSMENTS[id].legacyOf) || id;
      mine[target] = latest;
    });
    Object.keys(paper.results || {}).forEach(function (id) { if (paper.results[id][code]) mine[id] = paper.results[id][code]; });
    recs[code] = mine;
  }));
  return { codes: codes, recs: recs, flags: flags };
}
// Joined but answered nothing (score 0, no marks anywhere) – kept out of averages.
function resultNotSubmitted(rec) {
  if (!rec || typeof rec.score !== 'number' || rec.score !== 0) return false;
  var rubric = rec.rubric || [];
  return !rubric.length || rubric.every(function (c) { return !c.awarded && c.attempted !== true; });
}
function assessmentTitle(id, rec) {
  return (typeof ASSESSMENTS !== 'undefined' && ASSESSMENTS[id] && ASSESSMENTS[id].title) || (rec && rec.title) || id;
}
function assessmentKind(id) {
  var t = typeof gcse !== 'undefined' && gcse.tests ? gcse.tests[id] : null;
  if (t) return t.kind === 'eou' ? 'End of unit' : t.kind === 'mock' ? 'Mock' : 'GCSE test';
  return 'AP';
}
// Per-assessment summary for one academic year (or 'all').
function classAssessmentSummaries(data, year) {
  var byId = {};
  data.codes.forEach(function (code) {
    var mine = data.recs[code] || {};
    Object.keys(mine).forEach(function (id) {
      var rec = mine[id];
      if (year !== 'all' && academicYearStart(rec.completedAt) !== Number(year)) return;
      var S = byId[id] || (byId[id] = { id: id, title: assessmentTitle(id, rec), recs: {}, notSubmitted: [], last: 0 });
      S.recs[code] = rec;
      S.last = Math.max(S.last, rec.completedAt || 0);
      if (resultNotSubmitted(rec)) S.notSubmitted.push(code);
    });
  });
  return Object.keys(byId).map(function (id) {
    var S = byId[id];
    var counted = Object.keys(S.recs).filter(function (c) { return S.notSubmitted.indexOf(c) === -1; });
    var pcts = counted.map(function (c) { var r = S.recs[c]; return r.maxScore ? r.score / r.maxScore * 100 : null; }).filter(function (v) { return v != null; });
    S.avg = pcts.length ? Math.round(pcts.reduce(function (a, b) { return a + b; }, 0) / pcts.length) : null;
    var dps = counted.map(function (c) { return S.recs[c].dp; }).filter(function (v) { return v != null; });
    if (!dps.length && typeof definitePurposeGrades === 'function' && counted.length) {
      var scores = counted.map(function (c) { return Number(S.recs[c].score) || 0; }).sort(function (a, b) { return b - a; });
      dps = definitePurposeGrades(scores);
    }
    S.dpAvg = dps.length ? (dps.reduce(function (a, b) { return a + Number(b); }, 0) / dps.length).toFixed(1) : null;
    S.missing = data.codes.filter(function (c) { return !S.recs[c]; });
    S.done = data.codes.length - S.missing.length;
    S.kind = assessmentKind(id);
    S.practice = assessmentIsPractice(id, data.flags);
    S.archived = assessmentIsArchived(id, data.flags);
    return S;
  }).sort(function (a, b) { return b.last - a.last; });
}

// ── Class page → Assessments tab ────────────────────────────────────────────
async function classAssessmentsRender(body, className) {
  body.innerHTML = '<p class="text-gray-400 text-sm">Loading assessments…</p>';
  var data = await classAssessmentData(className);
  classPage.assessData = data;
  if (classPage.assessYear == null) classPage.assessYear = currentAcademicYear();
  var years = {}; years[currentAcademicYear()] = true;
  data.codes.forEach(function (c) { Object.keys(data.recs[c] || {}).forEach(function (id) { years[academicYearStart(data.recs[c][id].completedAt)] = true; }); });
  var yearList = Object.keys(years).map(Number).sort(function (a, b) { return b - a; });
  var all = classAssessmentSummaries(data, classPage.assessYear);
  var shown = all.filter(function (S) { return classPage.assessShowArchived || !S.archived; });
  var hiddenArchived = all.length - shown.length;
  var olderYears = yearList.filter(function (y) { return y < currentAcademicYear(); });
  var h = '<div class="flex flex-wrap items-center gap-3 mb-3 text-sm"><label class="text-xs text-gray-500">Year <select id="cpa-year" class="border border-gray-300 rounded px-2 py-1 text-sm ml-1">' +
    yearList.map(function (y) { return '<option value="' + y + '"' + (String(classPage.assessYear) === String(y) ? ' selected' : '') + '>' + academicYearLabel(y) + (y === currentAcademicYear() ? ' (this year)' : '') + '</option>'; }).join('') +
    '<option value="all"' + (classPage.assessYear === 'all' ? ' selected' : '') + '>All years</option></select></label>' +
    '<label class="flex items-center gap-1.5 text-xs text-gray-600"><input type="checkbox" id="cpa-show-archived"' + (classPage.assessShowArchived ? ' checked' : '') + '> Show archived' + (hiddenArchived ? ' (' + hiddenArchived + ')' : '') + '</label>' +
    olderYears.map(function (y) { return '<button type="button" class="cpa-archive-year px-2 py-1 rounded border border-gray-300 text-xs" data-year="' + y + '">Archive all from ' + academicYearLabel(y) + '</button>'; }).join('') +
    '<span id="cpa-status" class="text-xs text-gray-500"></span></div>';
  if (!shown.length) {
    h += '<p class="text-sm text-gray-500 py-6 text-center">No assessments for this class in ' + (classPage.assessYear === 'all' ? 'any year' : academicYearLabel(classPage.assessYear)) + '.</p>';
    body.innerHTML = h; classAssessmentsBind(body, className, all, data); return;
  }
  h += '<div class="border border-gray-200 rounded-lg overflow-hidden"><table class="w-full text-sm"><tr class="bg-gray-50 text-left text-xs text-gray-500"><th class="p-2">Assessment</th><th class="p-2">Type</th><th class="p-2 text-center">Done</th><th class="p-2 text-center">Average</th><th class="p-2 text-center">DP avg</th><th class="p-2">Counts as</th><th class="p-2"></th></tr>';
  shown.forEach(function (S, i) {
    var ragStyle = S.avg == null ? '' : (S.avg >= 70 ? 'background:#dcfce7;color:#166534' : S.avg >= 40 ? 'background:#fef3c7;color:#92400e' : 'background:#fee2e2;color:#991b1b');
    h += '<tr class="border-t ' + (S.archived ? 'opacity-60' : '') + '"><td class="p-2"><div class="font-semibold">' + cpEsc(S.title) + '</div><div class="text-xs text-gray-500">' + (S.last ? new Date(S.last).toLocaleDateString('en-GB') : '') + (S.archived ? ' · archived' : '') + '</div></td>' +
      '<td class="p-2 text-xs">' + cpEsc(S.kind) + '</td>' +
      '<td class="p-2 text-center"><button type="button" class="cpa-done underline decoration-dotted ' + (S.missing.length ? 'text-amber-700' : 'text-green-700') + '" data-i="' + i + '">' + S.done + '/' + data.codes.length + '</button>' +
        (S.notSubmitted.length ? '<div class="text-[11px] text-gray-500">' + S.notSubmitted.length + ' not submitted</div>' : '') + '</td>' +
      '<td class="p-2 text-center">' + (S.avg == null ? '–' : '<span class="px-1.5 rounded text-xs font-bold" style="' + ragStyle + '">' + S.avg + '%</span>') + '</td>' +
      '<td class="p-2 text-center">' + (S.dpAvg || '–') + '</td>' +
      '<td class="p-2"><select class="cpa-practice border border-gray-300 rounded px-1 py-0.5 text-xs" data-id="' + cpEsc(S.id) + '"><option value="official"' + (S.practice ? '' : ' selected') + '>Official</option><option value="practice"' + (S.practice ? ' selected' : '') + '>Practice</option></select></td>' +
      '<td class="p-2 text-right whitespace-nowrap"><button type="button" class="cpa-open px-2 py-0.5 rounded border border-gray-300 text-xs" data-id="' + cpEsc(S.id) + '">Open</button> ' +
        '<button type="button" class="cpa-archive px-2 py-0.5 rounded border border-gray-300 text-xs" data-id="' + cpEsc(S.id) + '" data-on="' + (S.archived ? '0' : '1') + '">' + (S.archived ? 'Unarchive' : 'Archive') + '</button></td></tr>' +
      '<tr class="cpa-missing hidden" data-i="' + i + '"><td colspan="7" class="p-2 bg-amber-50 text-sm"></td></tr>';
  });
  h += '</table></div><p class="text-xs text-gray-500 mt-2">Practice assessments still show here but are left out of averages, trends, DP and "needs attention". "Not submitted" (joined but answered nothing) is left out of averages. Retakes: the latest attempt counts.</p>';
  body.innerHTML = h;
  classAssessmentsBind(body, className, shown, data);
}
function classAssessmentsBind(body, className, list, data) {
  var status = function (m) { var el = document.getElementById('cpa-status'); if (el) el.textContent = m; };
  var rerender = function () { classAssessmentsRender(body, className); };
  var setFlag = async function (ids, patch) {
    var updates = {};
    ids.forEach(function (id) {
      var k = 'classes/' + className + '/assessmentFlags/' + assessmentFlagKey(id);
      Object.keys(patch).forEach(function (f) { updates[k + '/' + f] = patch[f]; });
      updates[k + '/at'] = Date.now();
    });
    await state.db.ref().update(updates);
  };
  document.getElementById('cpa-year').onchange = function () { classPage.assessYear = this.value === 'all' ? 'all' : Number(this.value); rerender(); };
  document.getElementById('cpa-show-archived').onchange = function () { classPage.assessShowArchived = this.checked; rerender(); };
  body.querySelectorAll('.cpa-archive-year').forEach(function (b) {
    b.onclick = async function () {
      var y = Number(b.dataset.year);
      var ids = classAssessmentSummaries(data, y).filter(function (S) { return !S.archived; }).map(function (S) { return S.id; });
      if (!ids.length) { status('Nothing left to archive from ' + academicYearLabel(y) + '.'); return; }
      if (!confirm('Archive ' + ids.length + ' assessment' + (ids.length === 1 ? '' : 's') + ' from ' + academicYearLabel(y) + ' for this class? Nothing is deleted.')) return;
      await setFlag(ids, { archived: true }); rerender();
    };
  });
  body.querySelectorAll('.cpa-archive').forEach(function (b) {
    b.onclick = async function () { await setFlag([b.dataset.id], { archived: b.dataset.on === '1' ? true : null }); rerender(); };
  });
  body.querySelectorAll('.cpa-practice').forEach(function (sel) {
    sel.onchange = async function () {
      await setFlag([sel.dataset.id], sel.value === 'practice' ? { practice: true, official: null } : { practice: null, official: true });
      status('Saved – ' + (sel.value === 'practice' ? 'left out of averages, trends and DP.' : 'counts as official.'));
    };
  });
  body.querySelectorAll('.cpa-open').forEach(function (b) {
    b.onclick = async function () {
      document.getElementById('modal-class-page').classList.add('hidden');
      if (typeof setAdminTab !== 'function') return;
      setAdminTab('ap-results');
      apResultsState.year = 'all'; apResultsState.showArchived = true;
      var cls = document.getElementById('ap-results-class');
      if (!cls.querySelector('option[value="' + className + '"]')) await loadApResultsClassOptions();
      cls.value = className;
      await openAssessmentResults(className);
      var sel = document.getElementById('ap-results-assessment');
      if (sel.querySelector('option[value="' + b.dataset.id + '"]')) { sel.value = b.dataset.id; renderAssessmentResultsPanel(); }
    };
  });
  body.querySelectorAll('.cpa-done').forEach(function (b) {
    b.onclick = function () {
      var S = list[Number(b.dataset.i)];
      var row = body.querySelector('.cpa-missing[data-i="' + b.dataset.i + '"]');
      if (!row) return;
      if (!row.classList.contains('hidden')) { row.classList.add('hidden'); return; }
      var cell = row.querySelector('td');
      var runnable = typeof ASSESSMENTS !== 'undefined' && ASSESSMENTS[S.id] && ASSESSMENTS[S.id].type !== 'paper' && typeof assignForcedApToStudent === 'function';
      var name = function (c) { return (typeof studentName === 'function' && studentName(c)) || c; };
      cell.innerHTML = S.missing.length ? '<b>Not done yet (' + S.missing.length + '):</b> <div class="flex flex-wrap gap-2 my-1">' + S.missing.map(function (c) {
        return '<label class="flex items-center gap-1 bg-white border border-amber-200 rounded px-2 py-0.5"><input type="checkbox" class="cpa-miss-check" value="' + cpEsc(c) + '" checked> ' + cpEsc(name(c)) + '</label>';
      }).join('') + '</div>' + (runnable ? '<button type="button" class="cpa-force jhncc-primary px-3 py-1 rounded text-xs font-semibold">Force AP to these students</button>' : '<span class="text-xs text-gray-600">Paper test – add their marks in the GCSE tab when they have sat it.</span>') : 'Everyone has done this.';
      row.classList.remove('hidden');
      var fb = cell.querySelector('.cpa-force');
      if (fb) fb.onclick = async function () {
        var picked = Array.prototype.map.call(cell.querySelectorAll('.cpa-miss-check:checked'), function (x) { return x.value; });
        if (!picked.length) return;
        fb.disabled = true; fb.textContent = 'Assigning…';
        try {
          for (var i = 0; i < picked.length; i++) await assignForcedApToStudent(className, picked[i], S.id);
          fb.textContent = 'Assigned to ' + picked.length + ' ✓';
        } catch (e) { fb.disabled = false; fb.textContent = 'Force AP to these students'; status('Could not assign: ' + e.message); }
      };
    };
  });
}

async function classPageRenderSettings(body, className, settings) {
  body.innerHTML = '<p class="text-gray-400 text-sm">Loading…</p>';
  var codesSnap = await state.db.ref('classes/' + className + '/codes').get();
  var codes = codesSnap.exists() ? Object.keys(codesSnap.val() || {}) : [];
  codes.sort(function (a, b) { return ((typeof studentName === 'function' && studentName(a)) || a).localeCompare((typeof studentName === 'function' && studentName(b)) || b); });
  var linkSnap = await state.db.ref('classes/' + className + '/classroomCourseId').get();
  var allNames = typeof getClassNames === 'function' ? await getClassNames() : [];
  var type = settings.type || '';
  var yearGuess = typeof classYearGroup === 'function' ? classYearGroup(className) : null;
  var covered = settings.covered || {};
  var access = settings.access || {};
  var h = '';
  if (!type) h += '<div class="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 mb-4"><b>Choose this class\'s type.</b> GCSE features (tests, mocks, GCSE quizzes) only show GCSE classes.</div>';
  h += '<div class="border border-gray-200 rounded-lg p-4 mb-4"><h3 class="font-bold text-gray-800 mb-3">Class details</h3>' +
    '<div class="flex flex-wrap gap-4 items-end">' +
    '<div><div class="text-xs text-gray-600 mb-1">Type</div><div class="flex gap-2">' + ['gcse', 'btec', 'ks3'].map(function (t) {
      return '<label class="flex items-center gap-1.5 px-3 py-1.5 rounded border cursor-pointer text-sm ' + (type === t ? classTypeStyle(t) : 'border-gray-300') + '"><input type="radio" name="cp-type" value="' + t + '"' + (type === t ? ' checked' : '') + '> ' + CLASS_TYPES[t] + '</label>';
    }).join('') + '</div></div>' +
    '<label class="text-xs text-gray-600">Year group<input id="cp-year" type="number" min="7" max="13" class="block w-20 border border-gray-300 rounded px-2 py-1.5 text-sm" value="' + cpEsc(settings.yearGroup || yearGuess || '') + '"></label>' +
    '<label class="text-xs text-gray-600 cp-gcse-only">Exam year<input id="cp-exam-year" type="number" min="2024" max="2040" class="block w-24 border border-gray-300 rounded px-2 py-1.5 text-sm" value="' + cpEsc(settings.examYear || '') + '" placeholder="2027"></label>' +
    '<div class="text-xs text-gray-500">Linked Google Classroom course: ' + (linkSnap.exists() && linkSnap.val() ? '<b>linked</b>' : 'none') + '</div></div></div>';

  // Content covered (GCSE)
  h += '<div class="border border-gray-200 rounded-lg p-4 mb-4 cp-gcse-only"><div class="flex flex-wrap justify-between items-center gap-2 mb-2"><h3 class="font-bold text-gray-800">Content covered so far</h3>' +
    '<span id="cp-covered-count" class="text-xs text-gray-500"></span></div>' +
    '<p class="text-xs text-gray-500 mb-2">Used for "Everything covered so far" mocks, and so practice only uses topics they have been taught.</p>';
  J277.list.filter(function (n) { return n.level === 1; }).forEach(function (area) {
    var points = J277.list.filter(function (n) { return n.level === 2 && n.parent === area.code; });
    var subs = J277.subTopics().filter(function (s) { return s.code.indexOf(area.code + '.') === 0; });
    var done = subs.filter(function (s) { return covered[cpKey(s.code)]; }).length;
    h += '<details class="border border-gray-100 rounded mb-1"' + (done && done < subs.length ? ' open' : '') + '><summary class="cursor-pointer px-2 py-1.5 text-sm font-semibold flex justify-between"><span>' + cpEsc(area.code + ' ' + area.title) + '</span><span class="text-xs font-normal text-gray-500">' + done + ' / ' + subs.length + ' taught</span></summary><div class="px-2 pb-2">';
    points.forEach(function (p) {
      h += '<div class="mt-2"><div class="flex items-center justify-between gap-2"><span class="text-sm font-medium">' + cpEsc(p.code + ' ' + p.title) + '</span>' +
        '<button type="button" class="cp-all-taught text-xs px-2 py-0.5 rounded border border-gray-300" data-point="' + cpEsc(p.code) + '">Mark all taught</button></div><div class="grid grid-cols-1 md:grid-cols-2 gap-1 mt-1">';
      J277.list.filter(function (s) { return s.level === 3 && s.parent === p.code; }).forEach(function (s) {
        var c = covered[cpKey(s.code)];
        var st = c ? c.s : '';
        h += '<label class="flex items-center justify-between gap-2 text-xs border border-gray-100 rounded px-2 py-1"><span>' + cpEsc(s.code + ' ' + s.title) + '</span>' +
          '<select class="cp-covered border border-gray-300 rounded px-1 py-0.5 text-xs" data-code="' + cpEsc(s.code) + '" title="' + (c && c.at ? 'Since ' + new Date(c.at).toLocaleDateString('en-GB') : '') + '">' +
          '<option value=""' + (!st ? ' selected' : '') + '>Not yet</option><option value="taught"' + (st === 'taught' ? ' selected' : '') + '>Taught</option><option value="revisited"' + (st === 'revisited' ? ' selected' : '') + '>Revisited</option></select></label>';
      });
      h += '</div></div>';
    });
    h += '</div></details>';
  });
  h += '</div>';

  // Access arrangements
  h += '<div class="border border-gray-200 rounded-lg p-4 mb-4"><h3 class="font-bold text-gray-800 mb-1">Access arrangements</h3><p class="text-xs text-gray-500 mb-2">Extra time is applied automatically in online tests. Stored against the student code only.</p>' +
    (codes.length ? '<table class="w-full text-xs"><tr class="bg-gray-50"><th class="p-1 text-left">Student</th><th class="p-1">25% extra time</th><th class="p-1">Reader</th></tr>' + codes.map(function (c) {
      var a = access[c] || {};
      return '<tr class="border-t"><td class="p-1">' + cpEsc((typeof studentName === 'function' && studentName(c)) || c) + ' <span class="text-gray-400">' + cpEsc(c) + '</span></td>' +
        '<td class="p-1 text-center"><input type="checkbox" class="cp-access" data-code="' + cpEsc(c) + '" data-k="extraTime"' + (a.extraTime ? ' checked' : '') + '></td>' +
        '<td class="p-1 text-center"><input type="checkbox" class="cp-access" data-code="' + cpEsc(c) + '" data-k="reader"' + (a.reader ? ' checked' : '') + '></td></tr>';
    }).join('') + '</table>' : '<p class="text-sm text-gray-500">No students in this class.</p>') + '</div>';

  // Roll-over
  h += '<div class="border border-gray-200 rounded-lg p-4 mb-4 cp-gcse-only"><h3 class="font-bold text-gray-800 mb-1">Moving up a year (roll-over)</h3>' +
    '<p class="text-xs text-gray-500 mb-2">Copies the type, exam year, content covered and access arrangements from last year\'s class. Targets and test history already follow each student.</p>' +
    '<div class="flex flex-wrap gap-2 items-center"><select id="cp-roll-from" class="border border-gray-300 rounded px-2 py-1 text-sm"><option value="">— copy from class —</option>' +
    allNames.filter(function (n) { return n !== className; }).map(function (n) { return '<option value="' + cpEsc(n) + '">' + cpEsc(n) + '</option>'; }).join('') + '</select>' +
    '<label class="flex items-center gap-1 text-xs"><input type="checkbox" id="cp-roll-archive"> archive the old class afterwards</label>' +
    '<button type="button" id="cp-roll-go" class="px-3 py-1 rounded border border-gray-300 text-sm">Copy settings</button></div></div>';

  h += '<div class="sticky bottom-0 bg-white pt-2 flex gap-2 items-center"><button type="button" id="cp-save" class="jhncc-primary px-4 py-1.5 rounded text-sm font-semibold">Save settings</button><span id="cp-status" class="text-xs text-gray-500"></span></div>';
  body.innerHTML = h;

  var syncGcse = function () {
    var t = (body.querySelector('input[name="cp-type"]:checked') || {}).value;
    body.querySelectorAll('.cp-gcse-only').forEach(function (el) { el.classList.toggle('hidden', t !== 'gcse'); });
  };
  var countCovered = function () {
    var n = body.querySelectorAll('.cp-covered').length;
    var done = Array.prototype.filter.call(body.querySelectorAll('.cp-covered'), function (s) { return s.value; }).length;
    var el = document.getElementById('cp-covered-count'); if (el) el.textContent = done + ' of ' + n + ' sub-topics covered';
  };
  body.querySelectorAll('input[name="cp-type"]').forEach(function (r) { r.onchange = syncGcse; });
  body.querySelectorAll('.cp-covered').forEach(function (s) { s.onchange = countCovered; });
  body.querySelectorAll('.cp-all-taught').forEach(function (b) {
    b.onclick = function () {
      body.querySelectorAll('.cp-covered').forEach(function (s) {
        if (s.dataset.code.indexOf(b.dataset.point) === 0 && !s.value) s.value = 'taught';
      });
      countCovered();
    };
  });
  syncGcse(); countCovered();
  document.getElementById('cp-save').onclick = function () { classPageSave(className, settings); };
  document.getElementById('cp-roll-go').onclick = async function () {
    var from = document.getElementById('cp-roll-from').value;
    if (!from) return;
    var src = await classSettings(from, true);
    var merged = Object.assign({}, settings, {
      type: src.type || settings.type, examYear: src.examYear || settings.examYear,
      covered: Object.assign({}, src.covered || {}, settings.covered || {}),
      access: Object.assign({}, src.access || {}, settings.access || {}), rolledFrom: from, updatedAt: Date.now()
    });
    var updates = {};
    updates['classes/' + className + '/settings'] = merged;
    if (document.getElementById('cp-roll-archive').checked) {
      updates['classes/' + from + '/archived'] = true;
      updates['classes/' + from + '/archivedAt'] = Date.now();
      updates['classNames/' + from] = null;
    }
    try {
      await state.db.ref().update(updates);
      classPage.cache[className] = merged;
      await classPageRender();
      document.getElementById('cp-status').textContent = 'Copied settings from ' + from + '.';
    } catch (e) { document.getElementById('cp-status').textContent = 'Could not copy: ' + e.message; }
  };
}

async function classPageSave(className, old) {
  var body = document.getElementById('class-page-body');
  var type = (body.querySelector('input[name="cp-type"]:checked') || {}).value || null;
  var covered = {}, now = Date.now(), prev = old.covered || {};
  body.querySelectorAll('.cp-covered').forEach(function (s) {
    if (!s.value) return;
    var k = cpKey(s.dataset.code);
    covered[k] = { s: s.value, at: prev[k] && prev[k].s === s.value ? prev[k].at : now };
  });
  var access = {};
  body.querySelectorAll('.cp-access').forEach(function (cb) {
    if (!cb.checked) return;
    (access[cb.dataset.code] = access[cb.dataset.code] || {})[cb.dataset.k] = true;
  });
  var settings = Object.assign({}, old, {
    type: type, yearGroup: Number(document.getElementById('cp-year').value) || null,
    examYear: type === 'gcse' ? (Number(document.getElementById('cp-exam-year').value) || null) : null,
    covered: type === 'gcse' ? covered : (old.covered || null), access: access, updatedAt: now
  });
  var status = document.getElementById('cp-status');
  try {
    await state.db.ref('classes/' + className + '/settings').set(settings);
    classPage.cache[className] = settings;
    status.textContent = 'Saved.';
    classPageFillTypeBadges();
    classPageRender();
  } catch (e) { status.textContent = 'Could not save: ' + e.message; }
}

// Covered sub-topic codes for a class (used by the mock generator and practice).
async function classCoveredTopics(className) {
  var s = await classSettings(className);
  return Object.keys(s.covered || {}).map(function (k) { return k.replace(/_/g, '.'); });
}

// ── Test picker for Start AP / Force AP ─────────────────────────────────────
// Search, "For this class" / "All", Suggested (not done yet) first, grouped, with status.
var apPicker = {};
async function renderAssessmentPicker(boxId, selectId, className, mode, opts) {
  opts = opts || {};
  var box = document.getElementById(boxId), select = document.getElementById(selectId);
  if (!box || !select || typeof ASSESSMENTS === 'undefined') return;
  var st = apPicker[boxId] = apPicker[boxId] || { scope: 'class', search: '', archived: false };
  st.className = className; st.mode = mode;
  var token = st.token = (st.token || 0) + 1;
  box.innerHTML = '<div class="text-xs text-gray-400">Loading tests…</div>';
  var data = null;
  try { data = await classAssessmentData(className); } catch (e) {}
  if (token !== st.token) return;
  var flags = (data && data.flags) || {};
  var year = typeof classYearGroup === 'function' ? classYearGroup(className) : null;
  var done = {};
  if (data) data.codes.forEach(function (c) {
    Object.keys(data.recs[c] || {}).forEach(function (id) {
      var r = data.recs[c][id];
      if (academicYearStart(r.completedAt) === currentAcademicYear()) done[id] = (done[id] || 0) + 1;
    });
  });
  var total = data ? data.codes.length : 0;
  var items = Object.keys(ASSESSMENTS).filter(function (id) {
    var a = ASSESSMENTS[id];
    if (!a || a.legacyOf || a.hidden || a.type === 'paper') return false;
    if (a.type === 'gcse') return !a.className || a.className === className;
    return true;
  }).map(function (id) {
    var a = ASSESSMENTS[id];
    var m = (id + ' ' + (a.title || '')).match(/year\s*-?(\d{1,2})/i);
    return {
      id: id, title: a.title || id, gcse: a.type === 'gcse', apYear: m ? Number(m[1]) : null,
      practice: assessmentIsPractice(id, flags), archived: assessmentIsArchived(id, flags), done: done[id] || 0,
      kind: a.type === 'gcse' && typeof gcse !== 'undefined' && gcse.tests && gcse.tests[id] ? (gcse.tests[id].kind === 'mock' ? 'Mock' : gcse.tests[id].kind === 'eou' ? 'End of unit' : 'GCSE test') : null,
      created: a.type === 'gcse' && typeof gcse !== 'undefined' && gcse.tests && gcse.tests[id] ? (gcse.tests[id].createdAt || 0) : 0
    };
  });
  var draw = function () {
    var term = st.search.trim().toLowerCase();
    var list = items.filter(function (it) {
      if (!st.archived && it.archived) return false;
      if (term && it.title.toLowerCase().indexOf(term) === -1) return false;
      if (st.scope === 'class' && !opts.showAll && !it.gcse && it.apYear != null && year != null && it.apYear !== year) return false;
      return true;
    });
    var groups = [], used = {};
    var add = function (label, arr) { arr = arr.filter(function (it) { return !used[it.id]; }); if (!arr.length) return; arr.forEach(function (it) { used[it.id] = true; }); groups.push({ label: label, items: arr }); };
    add('★ Suggested – not started yet', list.filter(function (it) { return !it.practice && !it.done && (it.gcse || it.apYear == null || it.apYear === year); }).sort(function (a, b) { return b.created - a.created; }));
    add('GCSE tests for this class', list.filter(function (it) { return it.gcse && !it.practice; }));
    var years = {};
    list.forEach(function (it) { if (!it.gcse && !it.practice) years[it.apYear || 0] = true; });
    Object.keys(years).map(Number).sort(function (a, b) { return a - b; }).forEach(function (y) {
      add(y ? 'Year ' + y + ' APs' : 'Other APs', list.filter(function (it) { return !it.gcse && !it.practice && (it.apYear || 0) === y; }));
    });
    add('Practice', list.filter(function (it) { return it.practice; }));
    var h = '<div class="border border-gray-200 rounded-lg p-2 text-sm bg-white">' +
      '<div class="flex flex-wrap items-center gap-2 mb-2"><input class="ap-pick-search border border-gray-300 rounded px-2 py-1 text-sm flex-1 min-w-[140px]" placeholder="Search tests…" value="' + cpEsc(st.search) + '">' +
      '<label class="text-xs"><input type="radio" name="' + boxId + '-scope" value="class"' + (st.scope === 'class' ? ' checked' : '') + '> For this class</label>' +
      '<label class="text-xs"><input type="radio" name="' + boxId + '-scope" value="all"' + (st.scope === 'all' ? ' checked' : '') + '> All</label>' +
      '<label class="text-xs"><input type="checkbox" class="ap-pick-archived"' + (st.archived ? ' checked' : '') + '> Archived</label></div>' +
      '<div class="max-h-56 overflow-y-auto">' + (groups.length ? groups.map(function (g) {
        return '<div class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mt-2 mb-0.5">' + cpEsc(g.label) + '</div>' + g.items.map(function (it) {
          var on = select.value === it.id;
          var status = it.done ? (total && it.done >= total ? '<span class="text-green-700">done ' + it.done + '/' + total + ' ✓</span>' : 'done ' + it.done + '/' + total) : '<span class="text-amber-700">not started</span>';
          return '<button type="button" class="ap-pick-item w-full text-left flex items-center justify-between gap-2 px-2 py-1 rounded ' + (on ? 'bg-red-50 border border-[rgb(176,28,35)]' : 'hover:bg-gray-50 border border-transparent') + '" data-id="' + cpEsc(it.id) + '">' +
            '<span>' + cpEsc(it.title) + (it.kind ? ' <span class="text-xs text-gray-500">· ' + cpEsc(it.kind) + '</span>' : '') + (it.archived ? ' <span class="text-xs text-gray-500">· archived</span>' : '') + '</span><span class="text-xs whitespace-nowrap">' + status + '</span></button>';
        }).join('');
      }).join('') : '<div class="text-xs text-gray-500 py-2">No tests match.</div>') + '</div></div>';
    box.innerHTML = h;
    var search = box.querySelector('.ap-pick-search');
    search.oninput = function () { st.search = search.value; var pos = search.selectionStart; draw(); var s2 = box.querySelector('.ap-pick-search'); s2.focus(); s2.setSelectionRange(pos, pos); };
    box.querySelectorAll('input[name="' + boxId + '-scope"]').forEach(function (r) { r.onchange = function () { st.scope = r.value; draw(); }; });
    box.querySelector('.ap-pick-archived').onchange = function () { st.archived = this.checked; draw(); };
    box.querySelectorAll('.ap-pick-item').forEach(function (b) {
      b.onclick = function () {
        if (!select.querySelector('option[value="' + b.dataset.id + '"]')) {
          var o = document.createElement('option'); o.value = b.dataset.id; o.textContent = (ASSESSMENTS[b.dataset.id] || {}).title || b.dataset.id; select.appendChild(o);
        }
        select.value = b.dataset.id;
        select.dispatchEvent(new Event('change'));
        draw();
      };
    });
  };
  draw();
}
