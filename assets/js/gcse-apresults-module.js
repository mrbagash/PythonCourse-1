/* ═══════════════════════════════════════════════════════════════
 *  "My AP results" – pupil button next to Join Quiz.
 *  For one released AP it lists every topic in three groups:
 *    ✅ Full marks   🟡 Some marks   ❌ No marks
 *  then a "Practice questions" button that opens exam practice on the
 *  topics that were not full marks.
 *  Reads: progress/{code}/assessments (rubric per question, with topics)
 *         classes/{class}/apFeedback    (only released APs are shown)
 * ═══════════════════════════════════════════════════════════════ */

function apr$(id) { return document.getElementById(id); }
function aprEsc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function aprTopicName(code) {
  try { if (typeof gTopicName === 'function') return gTopicName(code); } catch (e) {}
  return String(code);
}

async function aprEnsureClass() {
  if (!state.uid || state.className) return state.className;
  try { if (typeof findClassForCode === 'function') state.className = await findClassForCode(state.uid); } catch (e) {}
  if (!state.className) {
    try {
      var au = state.auth && state.auth.currentUser;
      if (au) { var s = await state.db.ref('studentSessions/' + au.uid + '/className').get(); if (s.exists()) state.className = s.val(); }
    } catch (e) {}
  }
  return state.className;
}

function aprModal() {
  var m = apr$('modal-ap-results');
  if (m) return m;
  m = document.createElement('div');
  m.id = 'modal-ap-results';
  m.className = 'hidden fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-3 sm:p-6 overflow-y-auto';
  m.innerHTML = '<div class="bg-white rounded-xl shadow-xl w-full max-w-3xl flex flex-col">' +
    '<div class="flex items-center justify-between px-5 py-3 border-b"><h2 class="text-lg font-bold">&#x1F3AF; My AP results</h2>' +
    '<button type="button" id="apr-close" class="text-gray-400 hover:text-gray-600 text-xl" aria-label="Close">&#x2715;</button></div>' +
    '<div id="apr-body" class="p-5 text-sm text-gray-700"></div></div>';
  document.body.appendChild(m);
  apr$('apr-close').onclick = function () { m.classList.add('hidden'); };
  m.addEventListener('click', function (e) { if (e.target === m) m.classList.add('hidden'); });
  return m;
}

// Per-topic marks from a rubric. Questions without topics are grouped by their own label.
function aprTopics(rubric) {
  var per = {};
  (rubric || []).forEach(function (c) {
    var max = Number(c.marks) || 0; if (!max) return;
    var got = c.attempted === false ? 0 : (Number(c.awarded) || 0);
    var codes = (c.topics && c.topics.length) ? c.topics : [null];
    codes.forEach(function (tc) {
      var key = tc || ('q:' + (c.text || c.id));
      var p = per[key] || (per[key] = { code: tc, name: tc ? aprTopicName(tc) : String(c.text || c.id), a: 0, p: 0 });
      p.a += got; p.p += max;
    });
  });
  var list = Object.keys(per).map(function (k) { return per[k]; });
  list.sort(function (x, y) { return (y.a / y.p) - (x.a / x.p) || x.name.localeCompare(y.name); });
  return {
    full: list.filter(function (t) { return t.a >= t.p; }),
    some: list.filter(function (t) { return t.a > 0 && t.a < t.p; }),
    none: list.filter(function (t) { return t.a <= 0; })
  };
}

function aprGroupHtml(icon, title, sub, cls, head, items, empty) {
  return '<div class="rounded-lg border ' + cls + ' p-3">' +
    '<div class="font-bold ' + head + '">' + icon + ' ' + title + ' <span class="font-normal text-xs">(' + items.length + ')</span></div>' +
    '<div class="text-xs text-gray-600 mb-2">' + sub + '</div>' +
    (items.length ? '<ul class="space-y-1">' + items.map(function (t) {
      return '<li class="flex justify-between gap-2"><span>' + aprEsc(t.name) + '</span><span class="text-xs text-gray-500 whitespace-nowrap">' + t.a + ' / ' + t.p + '</span></li>';
    }).join('') + '</ul>' : '<p class="text-xs text-gray-500">' + empty + '</p>') + '</div>';
}

var APR = { tab: 'topics', onlyLost: false };
var APR_PAPERS = { '1': 'Paper 1 – Computer systems', '2': 'Paper 2 – Algorithms & programming' };

function aprPaperOf(c) {
  try { return (typeof GcseCore !== 'undefined' && GcseCore.paperOf) ? GcseCore.paperOf((c.topics || [])[0]) : null; } catch (e) { return null; }
}
function aprGot(c) { return c.attempted === false ? null : (Number(c.awarded) || 0); }

// Grades follow the teacher's release setting, and stay hidden until the redo is done when "grade after redo" is on.
async function aprGradesOn(rec, fb) {
  if (!fb || !fb.showGrades) return false;
  if (fb.gradeAfter !== true || typeof redoParts !== 'function' || typeof redoLoad !== 'function' || typeof redoLeft !== 'function') return true;
  try { var st = await redoLoad(fb.assessmentId || rec.assessmentId); return !redoLeft(redoParts(rec, fb), st || {}); } catch (e) { return true; }
}

function aprPapersHtml(rec, gradesOn) {
  if (typeof gcsePaperSplit !== 'function') return '';
  var qs = (rec.rubric || []).map(function (c) { return { id: c.id, marks: c.marks, topics: c.topics || [] }; });
  var marks = {}; (rec.rubric || []).forEach(function (c) { marks[c.id] = aprGot(c); });
  var sp = gcsePaperSplit(qs, marks), keys = Object.keys(sp.papers).sort();
  if (!keys.length) return '';
  return '<div class="grid grid-cols-1 md:grid-cols-' + (keys.length > 1 ? '2' : '1') + ' gap-3">' + keys.map(function (k) {
    var P = sp.papers[k], weak = sp.focus === k, col = P.pct >= 70 ? '#16a34a' : P.pct >= 40 ? '#d97706' : '#dc2626';
    return '<div class="rounded-lg border p-3 ' + (weak ? 'border-red-300 bg-red-50' : 'border-gray-200') + '">' +
      '<div class="font-semibold">' + (APR_PAPERS[k] || 'Paper ' + k) + (weak ? ' <span class="text-xs text-red-700">← focus here</span>' : '') + '</div>' +
      '<div class="flex items-baseline justify-between gap-2 mt-1"><span><b class="text-base">' + P.a + ' / ' + P.p + '</b> marks (' + P.pct + '%)</span>' +
      (gradesOn && P.grade != null ? '<span>Grade <b class="text-base">' + GcseCore.gradeLabel(P.grade) + '</b></span>' : '') + '</div>' +
      '<div class="h-2 bg-gray-200 rounded mt-2"><div class="h-2 rounded" style="width:' + P.pct + '%;background:' + col + '"></div></div></div>';
  }).join('') + '</div>';
}

function aprStatus(got, max) {
  if (got == null) return { t: 'Not answered', cls: 'bg-gray-100 text-gray-700', bd: 'border-gray-300' };
  if (got >= max) return { t: 'Full marks', cls: 'bg-green-100 text-green-800', bd: 'border-green-200' };
  if (got > 0) return { t: 'Lost ' + (max - got), cls: 'bg-amber-100 text-amber-800', bd: 'border-amber-200' };
  return { t: 'No marks', cls: 'bg-red-100 text-red-800', bd: 'border-red-200' };
}

function aprQuestionsHtml(rec, fb) {
  var info = (fb && fb.redo && fb.redo.qs) || {};
  var key = function (id) { return typeof redoKey === 'function' ? redoKey(id) : String(id).replace(/[.#$\[\]\/]/g, '_'); };
  var lost = function (c) { return (aprGot(c) || 0) < Number(c.marks); };
  var rows = (rec.rubric || []).filter(function (c) { return Number(c.marks) > 0; });
  var lostMarks = 0; rows.forEach(function (c) { lostMarks += (Number(c.marks) || 0) - (aprGot(c) || 0); });
  var lostQs = rows.filter(lost).length;
  var groups = {}, order = [];
  rows.forEach(function (c) { var p = aprPaperOf(c) || ''; if (!groups[p]) { groups[p] = []; order.push(p); } groups[p].push(c); });
  order.sort();
  var h = '<div class="flex flex-wrap items-center justify-between gap-2 mb-3"><span class="text-sm">You lost <b>' + lostMarks + '</b> mark' + (lostMarks === 1 ? '' : 's') + ' on ' + lostQs + ' question' + (lostQs === 1 ? '' : 's') + '. Tap a question to see it' + (Object.keys(info).length ? ' and the mark scheme' : '') + '.</span>' +
    '<label class="text-sm flex items-center gap-2"><input type="checkbox" id="apr-only-lost"' + (APR.onlyLost ? ' checked' : '') + '> Only show where I lost marks</label></div>';
  order.forEach(function (p) {
    var list = groups[p], a = 0, mx = 0;
    list.forEach(function (c) { a += aprGot(c) || 0; mx += Number(c.marks) || 0; });
    if (APR.onlyLost) list = list.filter(lost);
    if (p || order.length > 1) h += '<div class="flex items-baseline justify-between mt-4 mb-2"><h4 class="font-bold text-gray-900">' + aprEsc(APR_PAPERS[p] || (p ? 'Paper ' + p : 'Other questions')) + '</h4><span class="text-sm font-semibold">' + a + ' / ' + mx + ' marks</span></div>';
    if (!list.length) { h += '<p class="text-xs text-gray-500">No marks lost here – well done!</p>'; return; }
    h += '<div class="space-y-2">' + list.map(function (c) {
      var got = aprGot(c), max = Number(c.marks) || 0, I = info[key(c.id)] || {}, st = aprStatus(got, max);
      var topics = (c.topics || []).map(aprTopicName).join(', ');
      var more = (I.text ? '<div class="mt-2"><div class="text-xs font-semibold text-gray-500">Question</div><div class="whitespace-pre-wrap">' + aprEsc(I.text) + '</div></div>' : '') +
        (I.ms && lost(c) ? '<div class="mt-2"><div class="text-xs font-semibold text-gray-500">Mark scheme</div><div class="whitespace-pre-wrap">' + aprEsc(I.ms) + '</div></div>' : '');
      var head = '<div class="flex items-center gap-3"><span class="font-bold text-gray-900 w-14 shrink-0">Q' + aprEsc(String(c.text || c.id).replace(/^q/i, '')) + '</span>' +
        '<span class="flex-1 min-w-0 text-xs text-gray-600 truncate">' + aprEsc(topics || c.command || '') + '</span>' +
        '<span class="text-sm font-semibold whitespace-nowrap">' + (got == null ? 0 : got) + ' / ' + max + '</span>' +
        '<span class="text-xs px-2 py-0.5 rounded-full whitespace-nowrap ' + st.cls + '">' + st.t + '</span></div>';
      return more ? '<details class="rounded-lg border ' + st.bd + ' px-3 py-2"><summary class="cursor-pointer">' + head + '</summary>' + more + '</details>'
        : '<div class="rounded-lg border ' + st.bd + ' px-3 py-2">' + head + '</div>';
    }).join('') + '</div>';
  });
  return h;
}

async function aprOpen() {
  var m = aprModal(), body = apr$('apr-body');
  m.classList.remove('hidden');
  body.innerHTML = '<p class="text-gray-400 text-center py-8">Loading your results…</p>';
  try {
    if (!state.uid) throw new Error('Please log in to see your results.');
    if (!(await aprEnsureClass())) throw new Error('We could not find your class. Log out and log back in with your code, or ask your teacher.');
    var snaps = await Promise.all([
      state.db.ref('progress/' + state.uid + '/assessments').get(),
      state.db.ref('classes/' + state.className + '/apFeedback').get()
    ]);
    var assessments = snaps[0].val() || {}, feedbacks = snaps[1].val() || {};
    var attempts = (typeof completedAssessmentAttempts === 'function' ? completedAssessmentAttempts(assessments) : Object.keys(assessments).map(function (k) { return Object.assign({ assessmentId: k }, assessments[k]); }))
      .filter(function (rec) {
        var fb = typeof releasedFeedbackForAssessmentAttempt === 'function' ? releasedFeedbackForAssessmentAttempt(feedbacks, rec) : feedbacks[rec.assessmentId];
        return fb && rec.rubric && rec.rubric.length;
      })
      .sort(function (a, b) { return (b.completedAt || 0) - (a.completedAt || 0); });
    if (!attempts.length) { body.innerHTML = '<p class="text-gray-500 text-center py-8">No AP results yet. They appear here once your teacher releases them.</p>'; return; }
    body.innerHTML = '<div class="mb-4"><label class="block text-xs text-gray-500 mb-1">AP</label><select id="apr-select" class="jhncc-focus border border-gray-300 rounded px-3 py-1.5 text-sm w-full sm:w-auto sm:min-w-[320px]">' +
      attempts.map(function (rec, i) {
        var title = (typeof ASSESSMENTS !== 'undefined' && ASSESSMENTS[rec.assessmentId] && ASSESSMENTS[rec.assessmentId].title) || rec.title || rec.assessmentId;
        return '<option value="' + i + '">' + aprEsc(title + (rec.completedAt ? ' – ' + new Date(rec.completedAt).toLocaleDateString('en-GB') : '')) + '</option>';
      }).join('') + '</select></div><div id="apr-result"></div>';
    var render = async function () {
      var rec = attempts[Number(apr$('apr-select').value)] || attempts[0];
      var fb = (typeof releasedFeedbackForAssessmentAttempt === 'function' ? releasedFeedbackForAssessmentAttempt(feedbacks, rec) : feedbacks[rec.assessmentId]) || {};
      var out = apr$('apr-result');
      out.innerHTML = '<p class="text-gray-400 text-sm">Loading…</p>';
      var gradesOn = await aprGradesOn(rec, fb);
      var g = aprTopics(rec.rubric);
      var weak = g.none.concat(g.some).map(function (t) { return t.code; }).filter(Boolean);
      var tabBtn = function (k, label) { return '<button type="button" class="apr-tab px-3 py-2 text-sm font-semibold border-b-2" data-tab="' + k + '">' + label + '</button>'; };
      var hint = weak.length ? 'Starts with your No marks and Not quite there topics.' : (g.some.length || g.none.length) ? 'Pick the topics you want to practise.' : 'You got full marks everywhere – pick any topic to stretch yourself.';
      out.innerHTML =
        '<p class="mb-3">Score: <b>' + (rec.score != null ? rec.score : '–') + ' / ' + (rec.maxScore != null ? rec.maxScore : '–') + '</b>' +
        (gradesOn && rec.grade != null && typeof GcseCore !== 'undefined' ? ' · Overall grade: <b>' + GcseCore.gradeLabel(rec.grade) + '</b>' : '') +
        (fb.showGrades && !gradesOn ? ' · <span class="text-amber-800">finish your redo (in AP Feedback) to see your grades</span>' : '') + '</p>' +
        aprPapersHtml(rec, gradesOn) +
        '<div class="flex gap-1 border-b border-gray-200 mb-4 mt-4">' + tabBtn('topics', '&#x1F4CA; Topics') + tabBtn('questions', '&#x1F4DD; Question by question') + '</div>' +
        '<div id="apr-tab-body"></div>' +
        '<div class="mt-5 flex flex-wrap items-center gap-3">' +
        '<button type="button" id="apr-practise" class="jhncc-primary text-sm font-semibold px-4 py-2 rounded">&#x270F;&#xFE0F; Practice questions</button>' +
        '<span class="text-xs text-gray-500">' + hint + '</span></div>';
      var showTab = function () {
        var tb = apr$('apr-tab-body');
        if (APR.tab === 'questions') {
          tb.innerHTML = aprQuestionsHtml(rec, fb);
          var only = apr$('apr-only-lost');
          if (only) only.onchange = function () { APR.onlyLost = only.checked; showTab(); };
        } else {
          tb.innerHTML = '<div class="grid grid-cols-1 md:grid-cols-3 gap-3">' +
            aprGroupHtml('&#x2705;', 'Secure', 'Full marks', 'border-green-200 bg-green-50', 'text-green-800', g.full, 'No topics with full marks yet.') +
            aprGroupHtml('&#x1F7E1;', 'Not quite there', 'Some marks dropped', 'border-amber-200 bg-amber-50', 'text-amber-800', g.some, 'Nothing here.') +
            aprGroupHtml('&#x274C;', 'No marks', '0 marks – start here', 'border-red-200 bg-red-50', 'text-red-800', g.none, 'Nothing here – well done!') + '</div>';
        }
        out.querySelectorAll('.apr-tab').forEach(function (b) {
          var on = b.dataset.tab === APR.tab;
          b.classList.toggle('border-[rgb(176,28,35)]', on); b.classList.toggle('text-gray-900', on);
          b.classList.toggle('border-transparent', !on); b.classList.toggle('text-gray-500', !on);
        });
      };
      out.querySelectorAll('.apr-tab').forEach(function (b) { b.onclick = function () { APR.tab = b.dataset.tab; showTab(); }; });
      showTab();
      apr$('apr-practise').onclick = function () {
        var back = function () { m.classList.remove('hidden'); };
        if (typeof xpOpen === 'function') { m.classList.add('hidden'); xpOpen({ topics: weak, onClose: back }); return; }
        var pool = (fb.practice ? Object.keys(fb.practice).map(function (k) { return fb.practice[k]; }) : []).filter(function (q) { return q && (!weak.length || (q.topics || []).some(function (tc) { return weak.indexOf(tc) !== -1; })); });
        if (pool.length && typeof gcseStartPractice === 'function') { m.classList.add('hidden'); gcse.practiceOnClose = back; gcseStartPractice(pool, rec.title || 'AP'); }
        else alert('No practice questions are ready for these topics yet.');
      };
    };
    apr$('apr-select').onchange = render;
    render();
  } catch (e) {
    body.innerHTML = '<p class="text-red-600 text-center py-8">' + aprEsc(e.message || e) + '</p>';
  }
}

(function () {
  var wire = function () { var b = apr$('btn-ap-results'); if (b) b.onclick = aprOpen; };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
  if (typeof updateAuthUI !== 'function') return;
  var orig = updateAuthUI;
  updateAuthUI = function (first, last, isAdmin, isTeacher) {
    var r = orig.apply(this, arguments);
    var b = apr$('btn-ap-results');
    if (b) b.classList.toggle('hidden', !(state.uid && !isAdmin && !isTeacher && !state.isTeacher && !state.isAdmin));
    return r;
  };
})();
