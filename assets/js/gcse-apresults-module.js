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
    var render = function () {
      var rec = attempts[Number(apr$('apr-select').value)] || attempts[0];
      var g = aprTopics(rec.rubric);
      var weak = g.none.concat(g.some).map(function (t) { return t.code; }).filter(Boolean);
      apr$('apr-result').innerHTML =
        '<p class="mb-3">Score: <b>' + (rec.score != null ? rec.score : '–') + ' / ' + (rec.maxScore != null ? rec.maxScore : '–') + '</b></p>' +
        '<div class="grid grid-cols-1 md:grid-cols-3 gap-3">' +
        aprGroupHtml('&#x2705;', 'Secure', 'Full marks', 'border-green-200 bg-green-50', 'text-green-800', g.full, 'No topics with full marks yet.') +
        aprGroupHtml('&#x1F7E1;', 'Not quite there', 'Some marks dropped', 'border-amber-200 bg-amber-50', 'text-amber-800', g.some, 'Nothing here.') +
        aprGroupHtml('&#x274C;', 'No marks', '0 marks – start here', 'border-red-200 bg-red-50', 'text-red-800', g.none, 'Nothing here – well done!') +
        '</div>' +
        '<div class="mt-5 flex flex-wrap items-center gap-3">' +
        '<button type="button" id="apr-practise" class="jhncc-primary text-sm font-semibold px-4 py-2 rounded">&#x270F;&#xFE0F; Practice questions</button>' +
        '<span class="text-xs text-gray-500">' + (weak.length ? 'Starts with your No marks and Not quite there topics.' : (g.some.length || g.none.length) ? 'Pick the topics you want to practise.' : 'You got full marks everywhere – pick any topic to stretch yourself.') + '</span></div>';
      apr$('apr-practise').onclick = function () {
        var back = function () { m.classList.remove('hidden'); };
        if (typeof xpOpen === 'function') { m.classList.add('hidden'); xpOpen({ topics: weak, onClose: back }); return; }
        var fb = feedbacks[rec.assessmentId] || {};
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
