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
var classPage = { className: '', tab: 'settings', cache: {} };

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

// Classroom Management cards: show each class's type (click to set it).
async function classPageFillTypeBadges() {
  var badges = document.querySelectorAll('.class-type-badge');
  var names = Array.prototype.map.call(badges, function (b) { return b.dataset.class; });
  var settings = await classSettingsMany(names);
  badges.forEach(function (b) {
    var t = (settings[b.dataset.class] || {}).type;
    b.textContent = classTypeLabel(t);
    b.className = 'class-type-badge text-xs px-2 py-0.5 rounded-full cursor-pointer ' + classTypeStyle(t);
    b.title = t ? 'Open class page' : 'Choose GCSE, BTEC or KS3';
    b.onclick = function () { openClassPage(b.dataset.class); };
  });
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
  classPage.tab = tab || classPage.tab || 'settings';
  var modal = document.getElementById('modal-class-page');
  modal.classList.remove('hidden');
  document.getElementById('class-page-close').onclick = function () { modal.classList.add('hidden'); };
  document.getElementById('class-page-title').textContent = className;
  await classPageRender();
}
async function classPageRender() {
  var className = classPage.className;
  var settings = await classSettings(className, true);
  var tabs = [['settings', 'Settings']];
  if (settings.type === 'gcse' && typeof classProgressRender === 'function') tabs.unshift(['progress', 'Class progress']);
  if (!tabs.some(function (t) { return t[0] === classPage.tab; })) classPage.tab = tabs[0][0];
  var tabsEl = document.getElementById('class-page-tabs');
  tabsEl.innerHTML = tabs.map(function (t) {
    var on = t[0] === classPage.tab;
    return '<button type="button" class="cp-tab px-3 py-1.5 rounded border text-sm font-semibold ' + (on ? 'border-[rgb(176,28,35)] text-[rgb(176,28,35)] bg-red-50' : 'border-gray-300 text-gray-600 bg-white') + '" data-tab="' + t[0] + '">' + t[1] + '</button>';
  }).join('') + '<span class="text-xs px-2 py-0.5 rounded-full self-center ' + classTypeStyle(settings.type) + '">' + classTypeLabel(settings.type) + '</span>';
  tabsEl.querySelectorAll('.cp-tab').forEach(function (b) { b.onclick = function () { classPage.tab = b.dataset.tab; classPageRender(); }; });
  var body = document.getElementById('class-page-body');
  if (classPage.tab === 'progress') return classProgressRender(body, className, settings);
  return classPageRenderSettings(body, className, settings);
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
