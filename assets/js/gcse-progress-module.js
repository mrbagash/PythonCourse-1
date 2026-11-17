/**
 * gcse-progress-module.js
 *  - Teacher: student profile gets tabs – Overview | Feedback (corrections tasks,
 *    new-question and 2-week check results, misconceptions).
 *  - Pupil: "My progress" – RELEASED marks only, their target grade, trend,
 *    strongest / weakest topics and their feedback tasks. No DP, no teacher notes.
 */

// ── Teacher profile tabs ────────────────────────────────────────────────────
(function () {
  if (typeof gcseRenderProfile !== 'function') return;
  var orig = gcseRenderProfile;
  gcseRenderProfile = function () {
    var D = gcse.profileData, body = gEl('gcse-profile-body');
    if (!D || !body) return orig.apply(this, arguments);
    if (gcse.profileCode !== D.code) { gcse.profileCode = D.code; gcse.profileTab = 'overview'; }
    var tab = gcse.profileTab || 'overview';
    if (tab === 'feedback') body.innerHTML = gpFeedbackTabHtml(D);
    else if (tab === 'homework') body.innerHTML = '<div id="hw-prof"><p class="text-gray-400 text-sm">Loading homework…</p></div>';
    else if (tab === 'practice') body.innerHTML = typeof xpHistoryHtml === 'function' ? xpHistoryHtml(D.practice, 'teacher') : '';
    else orig.apply(this, arguments);
    var nDirt = gpDirtItems(D).length;
    var tabList = [['overview', 'Overview'], ['feedback', 'Feedback' + (nDirt ? ' (' + nDirt + ')' : '')]];
    if (typeof hwProfileRender === 'function' && D.isGcse) tabList.push(['homework', 'Homework']);
    if (typeof xpHistoryHtml === 'function' && D.isGcse) { var nXp = typeof xpSessions === 'function' ? xpSessions(D.practice).length : 0; tabList.push(['practice', 'Practice' + (nXp ? ' (' + nXp + ')' : '')]); }
    body.insertAdjacentHTML('afterbegin', '<div class="flex gap-1 border-b border-gray-200 mb-3">' + tabList.map(function (t) {
      var on = t[0] === tab;
      return '<button type="button" class="gp-tab px-3 py-1.5 text-sm font-semibold border-b-2 ' + (on ? 'border-[rgb(176,28,35)] text-[rgb(176,28,35)]' : 'border-transparent text-gray-500') + '" data-tab="' + t[0] + '">' + t[1] + '</button>';
    }).join('') + '</div>');
    body.querySelectorAll('.gp-tab').forEach(function (b) { b.onclick = function () { gcse.profileTab = b.dataset.tab; gcseRenderProfile(); }; });
    if (tab === 'homework') hwProfileRender(D);
  };
})();
function gpDirtItems(D) {
  var out = [], dirt = D.dirt || {};
  Object.keys(dirt).forEach(function (testId) {
    Object.keys(dirt[testId] || {}).forEach(function (fid) {
      var d = dirt[testId][fid]; if (!d || typeof d !== 'object') return;
      out.push({ testId: testId, fid: fid, d: d, title: ((gcse.tests || {})[testId] || {}).title || testId });
    });
  });
  return out.sort(function (a, b) { return (b.d.releasedAt || 0) - (a.d.releasedAt || 0); });
}
function gpFeedbackTabHtml(D) {
  var items = gpDirtItems(D);
  var done = items.filter(function (x) { return x.d.doneAt; }).length;
  var tr = items.filter(function (x) { return x.d.transfer; }), trOk = tr.filter(function (x) { return x.d.transfer.mark >= x.d.transfer.max; }).length;
  var ck = items.filter(function (x) { return x.d.check; }), ckOk = ck.filter(function (x) { return x.d.check.mark >= x.d.check.max; }).length;
  var card = function (v, l) { return '<div class="rounded-lg border border-gray-200 p-3 text-center"><div class="text-2xl font-bold">' + v + '</div><div class="text-xs text-gray-500">' + l + '</div></div>'; };
  var h = '<div class="grid grid-cols-3 gap-2 mb-4">' + card(done + ' / ' + items.length, 'Feedback tasks done') + card(tr.length ? trOk + ' / ' + tr.length : '–', 'New question right') + card(ck.length ? ckOk + ' / ' + ck.length : '–', 'Right after 2 weeks') + '</div>';
  if (!items.length) h += '<p class="text-sm text-gray-500 mb-4">No feedback tasks yet. They are created when you release a test with a feedback plan (Class feedback → 2 Plan).</p>';
  var byTest = {};
  items.forEach(function (x) { (byTest[x.testId] = byTest[x.testId] || []).push(x); });
  var tick = function (ok, done2) { return ok === true ? '<span class="text-green-700 font-bold">✓</span>' : ok === false ? '<span class="text-red-700 font-bold">✗</span>' : done2 ? '…' : '<span class="text-gray-400">–</span>'; };
  Object.keys(byTest).forEach(function (testId) {
    h += '<div class="border border-gray-200 rounded-lg p-3 mb-3"><h4 class="font-bold mb-2">' + gEsc(byTest[testId][0].title) + '</h4>' + byTest[testId].map(function (x) {
      var d = x.d, tier = WCF_TIERS[d.tier] || WCF_TIERS.misc, o = d.orig || {};
      var trOk2 = d.transfer ? d.transfer.mark >= d.transfer.max : null, ckOk2 = d.check ? d.check.mark >= d.check.max : null;
      return '<div class="gp-fb-item border-t border-gray-100 py-2 text-sm"><div class="flex flex-wrap items-center gap-2"><b>' + gEsc(d.title || x.fid) + '</b><span class="text-xs px-1.5 rounded ' + tier.cls + '">' + tier.short + '</span>' +
        '<span class="text-xs text-gray-500 ml-auto">' + (d.doneAt ? 'Done ' + new Date(d.doneAt).toLocaleDateString('en-GB') : 'Not done yet') + '</span></div>' +
        '<div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1 text-xs">' +
          '<div><div class="text-gray-500">Original answer' + (o.mark != null ? ' (' + o.mark + '/' + o.max + ')' : '') + '</div><div class="bg-gray-50 rounded p-1.5 whitespace-pre-wrap">' + (o.answer ? gEsc(o.answer) : '<i class="text-gray-400">none</i>') + '</div></div>' +
          '<div><div class="text-gray-500">Correction' + (d.correctionMark != null ? ' (' + d.correctionMark + '/' + d.correctionMax + ')' : '') + '</div><div class="bg-gray-50 rounded p-1.5 whitespace-pre-wrap">' + (d.correction ? gEsc(d.correction) : '<i class="text-gray-400">–</i>') + '</div></div>' +
          '<div class="md:col-span-2"><span class="text-gray-500">Why it was wrong:</span> ' + (d.why ? gEsc(d.why) : '<i class="text-gray-400">–</i>') + '</div></div>' +
        '<div class="text-xs mt-1">New question ' + tick(trOk2, !!d.transfer) + (d.transfer ? ' (' + d.transfer.mark + '/' + d.transfer.max + ')' : '') + ' · 2-week check ' + tick(ckOk2, !!d.check) + (d.check ? ' (' + d.check.mark + '/' + d.check.max + ')' : '') + '</div></div>';
    }).join('') + '</div>';
  });
  h += '<div class="border border-gray-200 rounded-lg p-3"><h4 class="font-bold mb-2">Misconceptions</h4>' + gcseProfileMisconceptionsHtml(D) + '</div>';
  return h;
}

// ── Pupil: My progress ──────────────────────────────────────────────────────
async function gpOpenMyProgress() {
  var m = gEl('modal-my-progress');
  if (!m) {
    m = document.createElement('div');
    m.id = 'modal-my-progress';
    m.className = 'fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto';
    m.innerHTML = '<div class="bg-white rounded-xl shadow-xl w-full max-w-3xl mt-6"><div class="flex justify-between items-center px-5 py-3 border-b"><h2 class="font-bold text-lg">My progress</h2><button type="button" id="my-progress-close" class="text-gray-400 text-xl">✕</button></div><div id="my-progress-body" class="p-5"></div></div>';
    document.body.appendChild(m);
  }
  m.classList.remove('hidden');
  gEl('my-progress-close').onclick = function () { m.classList.add('hidden'); };
  var body = gEl('my-progress-body');
  body.innerHTML = '<p class="text-gray-400 text-sm">Loading…</p>';
  var data = await Promise.all([
    state.db.ref('progress/' + state.uid + '/assessments').get().then(function (s) { return s.val() || {}; }).catch(function () { return {}; }),
    state.db.ref('classes/' + state.className + '/apFeedback').get().then(function (s) { return s.val() || {}; }).catch(function () { return {}; }),
    state.db.ref('gcse/targets/' + state.uid).get().then(function (s) { return s.val(); }).catch(function () { return null; }),
    state.db.ref('progress/' + state.uid + '/dirt').get().then(function (s) { return s.val() || {}; }).catch(function () { return {}; }),
    state.db.ref('progress/' + state.uid + '/hw').get().then(function (s) { return s.val() || {}; }).catch(function () { return {}; }),
    state.db.ref('progress/' + state.uid + '/mastery').get().then(function (s) { return s.val() || {}; }).catch(function () { return {}; }),
    state.db.ref('classes/' + state.className + '/homework').get().then(function (s) { return s.val() || {}; }).catch(function () { return {}; }),
    state.db.ref('progress/' + state.uid + '/practice').get().then(function (s) { return s.val() || {}; }).catch(function () { return {}; })
  ]);
  var tab = gpOpenMyProgress.tab || 'overview';
  var tabs = '<div class="flex gap-1 border-b border-gray-200 mb-3">' + [['overview', 'Overview'], ['practice', 'Practice']].map(function (t) { var on = t[0] === tab; return '<button type="button" class="gp-my-tab px-3 py-1.5 text-sm font-semibold border-b-2 ' + (on ? 'border-[rgb(176,28,35)] text-[rgb(176,28,35)]' : 'border-transparent text-gray-500') + '" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
  body.innerHTML = tabs + (tab === 'practice' ? (typeof xpHistoryHtml === 'function' ? xpHistoryHtml(data[7], 'pupil') : '') : (typeof hwMyProgressHtml === 'function' ? hwMyProgressHtml(data[4], data[5], data[6]) : '') + gpMyProgressHtml(data[0], data[1], data[2], {}));
  body.querySelectorAll('.gp-my-tab').forEach(function (b) { b.onclick = function () { gpOpenMyProgress.tab = b.dataset.tab; gpOpenMyProgress(); }; });
  var tb = gEl('my-progress-tasks'); if (tb) tb.onclick = function () { m.classList.add('hidden'); wcfOpenTasks(); };
  var pb = gEl('my-progress-plc'); if (pb) pb.onclick = function () { m.classList.add('hidden'); plcOpen(); var pm = gEl('modal-plc'); if (pm && gEl('plc-close')) { var c0 = gEl('plc-close').onclick; gEl('plc-close').onclick = function () { if (c0) c0(); m.classList.remove('hidden'); }; } };
}
// Released results only: paper tests after release; APs once their feedback is released.
function gpReleasedHistory(assessments, feedbacks) {
  var out = [];
  Object.keys(assessments || {}).forEach(function (id) {
    var a0 = assessments[id]; if (!a0) return;
    var a = a0;
    if (a0.attempts) Object.keys(a0.attempts).forEach(function (k) { var x = a0.attempts[k]; if (x && x.completedAt && (!a.completedAt || x.completedAt > a.completedAt)) a = Object.assign({ lobbyCode: k }, x); });
    if (!a.completedAt || a.pending || a.type === 'gcse-online') return;
    var released;
    if (a.type === 'paper') released = !!(a0.releasedAt || a.releasedAt);
    else released = typeof releasedFeedbackForAssessmentAttempt === 'function' ? !!releasedFeedbackForAssessmentAttempt(feedbacks, Object.assign({ assessmentId: id }, a)) : !!(feedbacks[id] && feedbacks[id].released);
    if (!released) return;
    var pct = a.maxScore ? Math.round(a.score / a.maxScore * 100) : null;
    out.push({ id: id, kind: a.type === 'paper' ? 'paper' : 'ap', title: (typeof ASSESSMENTS !== 'undefined' && ASSESSMENTS[id] && ASSESSMENTS[id].title) || a.title || id,
      at: a.completedAt, score: a.score, max: a.maxScore, pct: pct, grade: a.type === 'paper' && a.grade != null ? Number(a.grade) : null,
      practice: /practice/i.test(id + ' ' + (a.title || '')), notSubmitted: typeof resultNotSubmitted === 'function' ? resultNotSubmitted(a) : false });
  });
  return out.sort(function (x, y) { return x.at - y.at; });
}
function gpMyProgressHtml(assessments, feedbacks, targetRec, dirt) {
  var hist = gpReleasedHistory(assessments, feedbacks);
  var official = hist.filter(function (x) { return !x.practice && !x.notSubmitted && x.pct != null; });
  var avg = official.length ? Math.round(official.reduce(function (s, x) { return s + x.pct; }, 0) / official.length) : null;
  var latestGrade = hist.filter(function (x) { return x.grade != null; }).slice(-1)[0];
  var target = targetRec && targetRec.grade != null ? Number(targetRec.grade) : null;
  var trend = typeof gcseTrend === 'function' ? gcseTrend(hist) : { arrow: '–', label: '', cls: '' };
  var tasksLeft = 0;
  Object.keys(dirt || {}).forEach(function (t) { Object.keys(dirt[t] || {}).forEach(function (f) { if (dirt[t][f] && !dirt[t][f].doneAt) tasksLeft++; }); });
  var card = function (v, l, cls) { return '<div class="rounded-lg border border-gray-200 p-3 text-center"><div class="text-2xl font-bold ' + (cls || '') + '">' + v + '</div><div class="text-xs text-gray-500">' + l + '</div></div>'; };
  var h = '<div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">' +
    card(target != null ? GcseCore.gradeLabel(target) : '–', 'My target grade') +
    card(latestGrade ? GcseCore.gradeLabel(latestGrade.grade) : '–', 'Latest grade') +
    card(avg == null ? '–' : avg + '%', 'Average score') +
    card(trend.arrow, trend.label, trend.cls) + '</div>';
  if (tasksLeft) h += '<div class="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 mb-4 flex flex-wrap items-center gap-2">📝 You have <b>' + tasksLeft + '</b> feedback task' + (tasksLeft === 1 ? '' : 's') + ' to do. <button type="button" id="my-progress-tasks" class="jhncc-primary px-3 py-1 rounded text-xs font-semibold ml-auto">Start</button></div>';
  if (!hist.length) return h + '<p class="text-sm text-gray-500">No released results yet. Your results appear here after your teacher releases them.</p>';
  h += '<div class="border border-gray-200 rounded-lg p-3 mb-4"><h4 class="font-bold mb-2">Over time</h4>' + (typeof gcseProfileChart === 'function' ? gcseProfileChart(official).replace(/<div class="text-xs text-gray-500">Red = paper tests[^<]*<\/div>/, '<div class="text-xs text-gray-500">Red = tests (with your grade when released), blue = APs.</div>') : '') + '</div>';
  var scores = typeof plcScoresFromAssessments === 'function' ? plcScoresFromAssessments(assessments) : {};
  var tl = Object.keys(scores).filter(function (k) { return scores[k].pct != null; }).map(function (k) { return { code: k, pct: scores[k].pct }; });
  if (tl.length) {
    var best = tl.slice().sort(function (a, b) { return b.pct - a.pct; }).slice(0, 3), worst = tl.slice().sort(function (a, b) { return a.pct - b.pct; }).filter(function (x) { return x.pct < 70; }).slice(0, 3);
    h += '<div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4"><div class="rounded border border-green-200 bg-green-50 p-3"><div class="font-semibold text-green-800 mb-1">Strongest topics</div><ul class="text-sm list-disc ml-5">' + best.map(function (x) { return '<li>' + gEsc(gTopicName(x.code)) + ' (' + x.pct + '%)</li>'; }).join('') + '</ul></div>' +
      '<div class="rounded border border-amber-200 bg-amber-50 p-3"><div class="font-semibold text-amber-800 mb-1">Work on these</div><ul class="text-sm list-disc ml-5">' + (worst.length ? worst.map(function (x) { return '<li>' + gEsc(gTopicName(x.code)) + ' (' + x.pct + '%)</li>'; }).join('') : '<li>Nothing under 70% – great work!</li>') + '</ul></div></div>';
  }
  h += '<div class="border border-gray-200 rounded-lg p-3 mb-3"><h4 class="font-bold mb-2">My results</h4><table class="w-full text-sm"><tr class="text-xs text-gray-500 text-left"><th class="p-1">Date</th><th class="p-1">Assessment</th><th class="p-1 text-center">Score</th><th class="p-1 text-center">Grade</th></tr>' +
    hist.slice().reverse().map(function (x) {
      return '<tr class="gp-my-row border-t"><td class="p-1 text-xs">' + new Date(x.at).toLocaleDateString('en-GB') + '</td><td class="p-1">' + gEsc(x.title) + (x.practice ? ' <span class="text-xs text-gray-400">practice</span>' : '') + '</td>' +
        '<td class="p-1 text-center">' + (x.score != null ? x.score + ' / ' + x.max + (x.pct != null ? ' <span class="text-xs text-gray-500">(' + x.pct + '%)</span>' : '') : '') + '</td><td class="p-1 text-center">' + (x.grade != null ? GcseCore.gradeLabel(x.grade) : '–') + '</td></tr>';
    }).join('') + '</table></div>' +
    '<button type="button" id="my-progress-plc" class="text-sm px-3 py-1.5 rounded border border-gray-300">My topic checklist</button>';
  return h;
}
(function () {
  var wire = function () { var b = gEl('btn-my-progress'); if (b) b.onclick = gpOpenMyProgress; };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
  if (typeof updateAuthUI !== 'function') return;
  var orig = updateAuthUI;
  updateAuthUI = function (first, last, isAdmin, isTeacher) {
    var r = orig.apply(this, arguments);
    var b = gEl('btn-my-progress');
    if (b) b.classList.toggle('hidden', !(state.uid && state.className && !isAdmin && !isTeacher && !state.isTeacher && !state.isAdmin));
    return r;
  };
})();
