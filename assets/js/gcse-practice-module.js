/**
 * gcse-practice-module.js – exam practice the pupil chooses.
 *
 *  Pupil   ✏️ Practise (top bar, GCSE classes) or "Practise" on a checklist topic:
 *          pick topics (or "My weakest topics") and a length → exam-style questions one at a time
 *          (exam-paper layout, mark-scheme feedback) → score, topics to work on, revision links.
 *  Tracked progress/{code}/practice/{id} = { at, doneAt, topics[], len, n, mk, mx, ms, per{topicKey:{a,n}}, qs[] }
 *          + the usual per-topic practice counts (gcseQuiz) that the checklist shows.
 *  Views   pupil: My progress → Practice · teacher: profile → Practice, Homework tab → Practice.
 *  Practice never changes grades, working grades or released results.
 */
var XP = { session: null, lengths: { quick: { n: 5, label: 'Quick', sub: '5 questions · about 10 min' }, standard: { n: 10, label: 'Standard', sub: '10 questions · about 20 min' }, paper: { marks: 20, label: 'Mini paper', sub: 'about 20 marks · 25 min' } } };

function xpPool(subs) {
  var want = {}; subs.forEach(function (s) { want[s] = true; });
  var rows = [];
  try { rows = gcseBankUsable().map(function (v) { return v.row; }); } catch (e) { rows = []; }
  return rows.filter(function (r) { return ['mcq', 'short', 'code', 'table'].indexOf(r.type) !== -1 && (r.topics || []).some(function (t) { return J277.expand(t).some(function (s) { return want[s]; }); }); });
}
function xpHasQuestions() {
  var has = {};
  try { gcseBankUsable().forEach(function (v) { if (['mcq', 'short', 'code', 'table'].indexOf(v.row.type) !== -1) (v.row.topics || []).forEach(function (t) { J277.expand(t).forEach(function (s) { has[s] = true; }); }); }); } catch (e) {}
  return has;
}
// Spread across the picked topics, avoid recently seen questions, easier first (like a paper).
function xpBuild(subs, len, seen, rand) {
  rand = rand || Math.random;
  var L = XP.lengths[len] || XP.lengths.quick;
  var byTopic = {};
  xpPool(subs).forEach(function (r) { var t = r.topics[0]; (byTopic[t] = byTopic[t] || []).push(r); });
  Object.keys(byTopic).forEach(function (t) { byTopic[t].sort(function (a, b) { return ((seen[a.id] || 0) - (seen[b.id] || 0)) || (rand() - 0.5); }); });
  var keys = Object.keys(byTopic).sort(function () { return rand() - 0.5; });
  var out = [], marks = 0, i = 0, used = {};
  var enough = function () { return L.marks ? marks >= L.marks : out.length >= L.n; };
  while (!enough() && keys.some(function (k) { return byTopic[k].length; }) && i < 400) {
    var k = keys[i % keys.length]; i++;
    var r = byTopic[k].shift(); if (!r || used[r.id]) continue;
    if (L.marks && marks + r.marks > L.marks + 2 && out.length) continue;
    used[r.id] = true; out.push(r); marks += Number(r.marks) || 1;
  }
  return out.sort(function (a, b) { return (a.level || 3) - (b.level || 3); });
}
function xpWeakest(scores, practice, covered) {
  var list = [];
  Object.keys(scores || {}).forEach(function (s) { if (scores[s].pct != null && scores[s].pct < 70 && (J277.get(s) || {}).level === 3) list.push({ s: s, v: scores[s].pct }); });
  Object.keys(practice || {}).forEach(function (s) { var p = practice[s]; if (p.n >= 3 && p.a / p.n < 0.6 && !list.some(function (x) { return x.s === s; })) list.push({ s: s, v: Math.round(p.a / p.n * 100) }); });
  return list.sort(function (a, b) { return a.v - b.v; }).slice(0, 5).map(function (x) { return x.s; });
}
function xpModal() {
  hwCss();
  var m = gEl('modal-xp');
  if (!m) {
    m = document.createElement('div');
    m.id = 'modal-xp';
    m.className = 'fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-3 sm:p-6 overflow-y-auto';
    m.innerHTML = '<div class="xp-shell mt-2"><div class="xp-top"><div><h2>Exam practice</h2><div id="xp-sub" class="xp-sub">Questions in the style of the real papers</div></div><span id="xp-count" class="xp-count hidden"></span><button type="button" id="xp-close" class="xp-x" aria-label="Close">✕</button></div>' +
      '<div class="xp-track"><div id="xp-bar" class="xp-bar" style="width:0%"></div></div><div id="xp-body" class="xp-body"></div></div>';
    document.body.appendChild(m);
  }
  m.classList.remove('hidden');
  return m;
}
async function xpOpen(opts) {
  opts = opts || {};
  var m = xpModal(), body = gEl('xp-body');
  var onClose = opts.onClose || null;
  gEl('xp-close').onclick = function () { xpSaveProgress(); m.classList.add('hidden'); XP.session = null; if (onClose) onClose(); };
  gEl('xp-count').classList.add('hidden'); gEl('xp-bar').style.width = '0%';
  body.innerHTML = '<p class="text-gray-400 text-sm">Loading…</p>';
  var data = await Promise.all([
    state.db.ref('classes/' + state.className + '/settings/covered').get().then(function (s) { return s.val() || {}; }).catch(function () { return {}; }),
    state.db.ref('progress/' + state.uid + '/assessments').get().then(function (s) { return s.val() || {}; }).catch(function () { return {}; }),
    state.db.ref('progress/' + state.uid + '/gcseQuiz').get().then(function (s) { return s.val() || {}; }).catch(function () { return {}; }),
    state.db.ref('progress/' + state.uid + '/practice').get().then(function (s) { return s.val() || {}; }).catch(function () { return {}; })
  ]);
  var covered = Object.keys(data[0]).map(function (k) { return String(k).replace(/_/g, '.'); });
  var scores = typeof plcScoresFromAssessments === 'function' ? plcScoresFromAssessments(data[1]) : {};
  var practice = {}; Object.keys(data[2]).forEach(function (k) { var v = data[2][k] || {}; if (v.attempted) practice[String(k).replace(/_/g, '.')] = { a: v.correct || 0, n: v.attempted }; });
  var seen = {}; Object.keys(data[3]).forEach(function (id) { GcseCore.asList((data[3][id] || {}).qs).forEach(function (q) { if (q && q.id) seen[q.id] = (seen[q.id] || 0) + 1; }); });
  var has = xpHasQuestions();
  var weakest = xpWeakest(scores, practice, covered);
  var quick = [];
  if (weakest.length) quick.push({ label: '🎯 My weakest topics', codes: weakest });
  if (covered.length) quick.push({ label: '📚 Everything taught so far', codes: covered });
  var picked = (opts.topics && opts.topics.length) ? opts.topics : [];
  var len = XP.lastLen || 'quick';
  body.innerHTML = '<h3 class="text-lg font-extrabold text-gray-900">What do you want to practise?</h3><p class="text-sm text-gray-600 mb-2">Pick topics, then a length. Your answers are marked straight away with the mark scheme.</p>' +
    gtPickerHtml('xp-tree', { allowed: function (s) { return !!has[s]; }, selected: picked, quick: quick, badge: function (s) { var sc = scores[s]; var b = sc && sc.pct != null ? (sc.pct >= 70 ? '✅' : sc.pct >= 40 ? '🟡' : '❌') : ''; return b ? '<span class="ml-auto text-xs">' + b + '</span>' : ''; } }) +
    '<div class="xp-label">How long?</div><div class="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup">' + Object.keys(XP.lengths).map(function (k) {
      var L = XP.lengths[k], on = k === len;
      return '<button type="button" class="xp-len text-left rounded-xl border-2 px-3 py-2 ' + (on ? 'border-[rgb(176,28,35)] bg-red-50' : 'border-gray-200') + '" data-len="' + k + '" role="radio" aria-checked="' + on + '"><div class="font-bold text-gray-900">' + L.label + '</div><div class="text-xs text-gray-500">' + L.sub + '</div></button>';
    }).join('') + '</div>' +
    '<div class="xp-actions"><button type="button" id="xp-start" class="xp-check">Start practice →</button><span id="xp-msg" class="text-sm text-gray-500"></span></div>';
  var update = function () { var n = gtPicked('xp-tree').length; gEl('xp-start').disabled = !n; gEl('xp-msg').textContent = n ? '' : 'Pick at least one topic.'; };
  gtBindPicker('xp-tree', update, { quick: quick });
  update();
  body.querySelectorAll('.xp-len').forEach(function (b) { b.onclick = function () { len = b.dataset.len; XP.lastLen = len; body.querySelectorAll('.xp-len').forEach(function (x) { var on = x === b; x.classList.toggle('border-[rgb(176,28,35)]', on); x.classList.toggle('bg-red-50', on); x.classList.toggle('border-gray-200', !on); x.setAttribute('aria-checked', on); }); }; });
  gEl('xp-start').onclick = function () {
    var subs = gtPicked('xp-tree');
    var qs = xpBuild(subs, len, seen);
    if (!qs.length) { gEl('xp-msg').textContent = 'There are no questions on those topics yet – pick another topic.'; return; }
    xpStart(subs, len, qs, onClose);
  };
}
function xpStart(subs, len, qs, onClose) {
  var topics = typeof gtCompress === 'function' ? gtCompress(subs) : subs;
  var ref = state.db.ref('progress/' + state.uid + '/practice').push();
  var rec = { at: Date.now(), topics: topics, len: len, n: qs.length, mk: 0, mx: 0, ms: 0, per: {}, qs: [] };
  XP.session = { ref: ref, rec: rec, qs: qs, i: 0, subs: subs, len: len, onClose: onClose, shownAt: 0, saved: false };
  gEl('xp-sub').textContent = gtSummary(topics.map(function (c) { return c; }), 3);
  ref.set(rec).catch(function () {});
  xpNext();
}
function xpSaveProgress() {
  var S = XP.session; if (!S || !S.rec.qs.length) return;
  S.ref.set(S.rec).catch(function () {});
}
function xpNext() {
  var S = XP.session, body = gEl('xp-body'); if (!S) return;
  var c = gEl('xp-count'); c.classList.remove('hidden'); c.textContent = S.i + ' of ' + S.qs.length + ' done';
  gEl('xp-bar').style.width = Math.round(S.i / S.qs.length * 100) + '%';
  if (S.i >= S.qs.length) { xpFinish(); return; }
  var q = S.qs[S.i];
  S.q = q; S.shownAt = Date.now();
  body.innerHTML = '<div class="xp-head"><span class="xp-num">Question ' + (S.i + 1) + '</span><span class="xp-topic">of ' + S.qs.length + ' · ' + gEsc((q.topics || []).map(gTopicName).slice(0, 2).join(' · ')) + '</span><span class="xp-marks">[' + q.marks + ' mark' + (q.marks === 1 ? '' : 's') + ']</span></div>' +
    '<div id="hw-q" class="xp-q">' + hwQuestionTextHtml(q.question) + '</div>' + hwAnswerHtml(q) + '<div id="hw-result" class="mt-3"></div>';
  hwBindAnswer(q, body, xpSubmit);
}
async function xpSubmit(answer) {
  var S = XP.session, q = S.q;
  var res = await hwMarkAny(q, answer);
  if (XP.session !== S) return;
  var ms = Date.now() - S.shownAt;
  S.rec.mk += res.mark; S.rec.mx += res.max; S.rec.ms += ms;
  S.rec.qs.push({ id: q.id, mk: res.mark, mx: res.max, t: (q.topics || [])[0] || '' });
  (q.topics || []).slice(0, 1).forEach(function (tc) { var k = gTopicKey(tc); var P = S.rec.per[k] || (S.rec.per[k] = { a: 0, m: 0, n: 0 }); P.n++; P.a += res.mark; P.m += res.max; });
  S.ref.set(S.rec).catch(function () {});
  try { gcseRecordQuizAttempt({ gcseQid: q.id, gcseTopics: q.topics, q: q.question, gcseCodes: res.codes }, q.type === 'mcq' ? q.options[Number(answer)] : answer, { marks: res.mark, max: res.max }, 'practice'); } catch (e) {}
  if (gEl('hw-submit')) gEl('hw-submit').textContent = 'Checked';
  if (gEl('hw-try')) gEl('hw-try').disabled = true;
  var fb = hwFeedbackHtml(q, q.type === 'mcq' ? '' : answer, res).replace(/<div class="text-xs text-amber-800">A similar question will come back later in this homework\.<\/div>/, '');
  var link = !res.ok && typeof gtRevisionLinkHtml === 'function' ? gtRevisionLinkHtml((q.topics || [])[0]) : '';
  gEl('hw-result').innerHTML = fb + (link ? '<div class="mt-2">' + link + '</div>' : '') +
    '<div class="xp-actions"><button type="button" id="xp-next" class="xp-check">' + (S.i + 1 < S.qs.length ? 'Next question →' : 'See my results') + '</button>' +
    (!res.ok && q.type === 'short' ? '<button type="button" id="xp-appeal" class="xp-tool" style="border-color:#93c5fd;color:#1e40af">I think I\'m right – ask my teacher</button>' : '') + '</div>';
  gEl('xp-next').onclick = function () { S.i++; xpNext(); };
  if (gEl('xp-appeal')) gEl('xp-appeal').onclick = function () { try { gcseAddReview({ gcseQid: q.id, gcseTopics: q.topics, q: q.question }, answer, { marks: res.mark, max: res.max }, 'appeal'); } catch (e) {} this.disabled = true; this.textContent = 'Sent to your teacher'; };
}
function xpFinish() {
  var S = XP.session, body = gEl('xp-body'), R = S.rec;
  R.doneAt = Date.now();
  S.ref.set(R).catch(function () {});
  var pct = R.mx ? Math.round(R.mk / R.mx * 100) : 0;
  var per = Object.keys(R.per).map(function (k) { var P = R.per[k]; return { tc: gFromTopicKey(k), a: P.a, m: P.m, n: P.n, pct: P.m ? Math.round(P.a / P.m * 100) : 0 }; }).sort(function (a, b) { return a.pct - b.pct; });
  var weak = per.filter(function (x) { return x.pct < 70; });
  body.innerHTML = '<div class="text-center py-3"><div class="text-5xl font-extrabold text-gray-900">' + R.mk + ' / ' + R.mx + '</div><div class="text-sm text-gray-600 mt-1">' + pct + '% · ' + R.n + ' question' + (R.n === 1 ? '' : 's') + ' · ' + Math.max(1, Math.round(R.ms / 60000)) + ' min</div>' +
    '<div class="text-sm font-semibold mt-2 ' + (pct >= 70 ? 'text-green-700' : pct >= 40 ? 'text-amber-700' : 'text-red-700') + '">' + (pct >= 70 ? 'Strong – try harder topics or a mini paper next.' : pct >= 40 ? 'Getting there – practise the topics below again.' : 'Revise the topics below, then try again.') + '</div></div>' +
    '<div class="xp-label">By topic</div><table class="w-full text-sm"><tbody>' + per.map(function (x) {
      return '<tr class="border-t"><td class="py-1.5 pr-2">' + gEsc(gTopicName(x.tc)) + '</td><td class="py-1.5 text-right whitespace-nowrap"><span class="px-2 py-0.5 rounded-full text-xs font-semibold" style="' + gRag(x.pct) + '">' + x.a + ' / ' + x.m + '</span></td><td class="py-1.5 pl-2 text-right">' + (x.pct < 70 && typeof gtRevisionLinkHtml === 'function' ? gtRevisionLinkHtml(x.tc, 'Revise') : '') + '</td></tr>';
    }).join('') + '</tbody></table>' +
    '<div class="xp-actions justify-center mt-4">' + (weak.length ? '<button type="button" id="xp-again-weak" class="xp-check">Practise the weak ones again</button>' : '') +
    '<button type="button" id="xp-again" class="xp-next">Practise something else</button><button type="button" id="xp-done" class="xp-tool">Close</button></div>';
  gEl('xp-count').textContent = R.n + ' of ' + R.n + ' done'; gEl('xp-bar').style.width = '100%';
  var onClose = S.onClose;
  if (gEl('xp-again-weak')) gEl('xp-again-weak').onclick = function () { xpOpen({ topics: weak.map(function (x) { return x.tc; }), onClose: onClose }); };
  gEl('xp-again').onclick = function () { xpOpen({ topics: [], onClose: onClose }); };
  gEl('xp-done').onclick = function () { gEl('xp-close').click(); };
  XP.session = null;
}

// ── Views of practice ───────────────────────────────────────────────────────
function xpSessions(practice) {
  return Object.keys(practice || {}).map(function (id) { return Object.assign({ id: id }, practice[id]); }).filter(function (s) { return s && GcseCore.asList(s.qs).length; }).sort(function (a, b) { return b.at - a.at; });
}
function xpTopicTotals(sessions) {
  var t = {};
  sessions.forEach(function (s) { Object.keys(s.per || {}).forEach(function (k) { var P = s.per[k], T = t[k] || (t[k] = { a: 0, m: 0, n: 0 }); T.a += P.a; T.m += P.m; T.n += P.n; }); });
  return Object.keys(t).map(function (k) { var T = t[k]; return { tc: gFromTopicKey(k), a: T.a, m: T.m, n: T.n, pct: T.m ? Math.round(T.a / T.m * 100) : 0 }; });
}
// Used for the pupil (My progress) and the teacher (profile).
function xpHistoryHtml(practice, who) {
  var S = xpSessions(practice);
  if (!S.length) return '<p class="text-sm text-gray-500">' + (who === 'pupil' ? 'No practice yet. Press <b>✏️ Practise</b> at the top to start.' : 'No practice yet.') + '</p>';
  var weekAgo = Date.now() - 7 * 864e5;
  var week = S.filter(function (s) { return s.at >= weekAgo; });
  var tot = S.reduce(function (x, s) { x.mk += s.mk || 0; x.mx += s.mx || 0; x.ms += s.ms || 0; x.n += GcseCore.asList(s.qs).length; return x; }, { mk: 0, mx: 0, ms: 0, n: 0 });
  var topics = xpTopicTotals(S).sort(function (a, b) { return a.pct - b.pct; });
  var card = function (v, l) { return '<div class="rounded-lg border border-gray-200 p-3 text-center"><div class="text-2xl font-bold">' + v + '</div><div class="text-xs text-gray-500">' + l + '</div></div>'; };
  var trend = S.slice(0, 10).reverse().map(function (s) { var p = s.mx ? Math.round(s.mk / s.mx * 100) : 0; return '<span title="' + new Date(s.at).toLocaleDateString('en-GB') + ': ' + p + '%" style="height:' + Math.max(6, p * 0.4) + 'px;background:' + (p >= 70 ? '#16a34a' : p >= 40 ? '#f59e0b' : '#dc2626') + '" class="w-3 rounded-sm"></span>'; }).join('');
  return '<div class="xp-history"><div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">' + card(S.length, 'practice sessions') + card(week.length, 'this week') + card(tot.mx ? Math.round(tot.mk / tot.mx * 100) + '%' : '–', 'marks right') + card(Math.round(tot.ms / 60000), 'minutes') + '</div>' +
    '<div class="flex items-end gap-1 h-12 mb-3" aria-label="Last 10 sessions">' + trend + '<span class="text-xs text-gray-500 ml-2">last ' + Math.min(10, S.length) + ' sessions</span></div>' +
    '<div class="grid grid-cols-1 md:grid-cols-2 gap-3"><div><div class="font-semibold text-sm mb-1">By topic</div><table class="w-full text-sm">' + topics.map(function (x) {
      return '<tr class="border-t xp-topic-row"><td class="py-1 pr-2">' + gEsc(gTopicName(x.tc)) + '</td><td class="py-1 text-xs text-gray-500 text-right">' + x.n + ' q</td><td class="py-1 text-right"><span class="px-1.5 rounded text-xs font-semibold" style="' + gRag(x.pct) + '">' + x.pct + '%</span></td></tr>';
    }).join('') + '</table></div>' +
    '<div><div class="font-semibold text-sm mb-1">Sessions</div><table class="w-full text-sm">' + S.slice(0, 12).map(function (s) {
      var p = s.mx ? Math.round(s.mk / s.mx * 100) : 0;
      return '<tr class="border-t xp-session-row"><td class="py-1 pr-2 text-xs text-gray-500 whitespace-nowrap">' + new Date(s.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + '</td><td class="py-1 pr-2">' + gEsc(gtSummary(GcseCore.asList(s.topics), 2)) + (s.doneAt ? '' : ' <span class="text-xs text-gray-400">(stopped early)</span>') + '</td><td class="py-1 text-right whitespace-nowrap">' + (s.mk || 0) + '/' + (s.mx || 0) + ' <span class="text-xs" style="color:' + (p >= 70 ? '#15803d' : p >= 40 ? '#b45309' : '#b91c1c') + '">' + p + '%</span></td></tr>';
    }).join('') + '</table></div></div></div>';
}
// Teacher: the whole class at a glance.
async function xpClassHtml(className, codes) {
  var data = await Promise.all(codes.map(function (c) { return state.db.ref('progress/' + c + '/practice').get().then(function (s) { return { code: c, p: s.val() || {} }; }).catch(function () { return { code: c, p: {} }; }); }));
  var weekAgo = Date.now() - 7 * 864e5, picked = {}, rows = [];
  data.forEach(function (d) {
    var S = xpSessions(d.p), wk = S.filter(function (s) { return s.at >= weekAgo; });
    S.forEach(function (s) { gtExpand(GcseCore.asList(s.topics)).forEach(function (t) { picked[t] = (picked[t] || 0) + 1; }); });
    var mk = S.reduce(function (x, s) { return x + (s.mk || 0); }, 0), mx = S.reduce(function (x, s) { return x + (s.mx || 0); }, 0);
    rows.push({ code: d.code, n: S.length, wk: wk.length, pct: mx ? Math.round(mk / mx * 100) : null, last: S[0] ? S[0].at : 0, mins: Math.round(S.reduce(function (x, s) { return x + (s.ms || 0); }, 0) / 60000), topics: xpTopicTotals(S).sort(function (a, b) { return a.pct - b.pct; }).slice(0, 2) });
  });
  rows.sort(function (a, b) { return b.wk - a.wk || b.n - a.n; });
  var covered = {}; try { var s = await state.db.ref('classes/' + className + '/settings/covered').get(); covered = s.val() || {}; } catch (e) {}
  var ignored = gtExpand(Object.keys(covered).map(function (k) { return k.replace(/_/g, '.'); })).filter(function (t) { return !picked[t]; });
  var active = rows.filter(function (r) { return r.wk; }).length;
  return '<div class="xp-class"><div class="text-sm mb-2"><b>' + active + ' of ' + rows.length + '</b> pupils practised this week.</div>' +
    '<div class="overflow-x-auto"><table class="w-full text-sm border border-gray-200"><tr class="bg-gray-50 text-xs"><th class="p-1.5 text-left">Pupil</th><th class="p-1.5">This week</th><th class="p-1.5">All sessions</th><th class="p-1.5">Marks right</th><th class="p-1.5">Minutes</th><th class="p-1.5 text-left">Weakest in practice</th><th class="p-1.5">Last</th></tr>' +
    rows.map(function (r) {
      return '<tr class="border-t xp-class-row"><td class="p-1.5"><button type="button" class="gcse-profile-link hover:underline" data-code="' + gEsc(r.code) + '">' + gEsc(gName(r.code) || r.code) + '</button></td><td class="p-1.5 text-center font-semibold">' + (r.wk || '<span class="text-gray-300">0</span>') + '</td><td class="p-1.5 text-center">' + r.n + '</td>' +
        '<td class="p-1.5 text-center">' + (r.pct == null ? '' : '<span class="px-1.5 rounded text-xs font-semibold" style="' + gRag(r.pct) + '">' + r.pct + '%</span>') + '</td><td class="p-1.5 text-center">' + (r.mins || '') + '</td>' +
        '<td class="p-1.5 text-xs">' + r.topics.map(function (x) { return gEsc(gTopicName(x.tc)) + ' (' + x.pct + '%)'; }).join(', ') + '</td><td class="p-1.5 text-xs text-gray-500 text-center">' + (r.last ? new Date(r.last).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '–') + '</td></tr>';
    }).join('') + '</table></div>' +
    (ignored.length ? '<div class="mt-3 text-sm"><b>Taught but nobody has practised:</b> <span class="text-gray-700">' + gEsc(gtSummary(gtCompress(ignored), 8)) + '</span> – worth setting as homework.</div>' : '') + '</div>';
}

// Top-bar button for pupils in a GCSE class.
(function () {
  var wire = function () { var b = gEl('btn-practise'); if (b) b.onclick = function () { xpOpen({}); }; };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
  if (typeof updateAuthUI !== 'function') return;
  var orig = updateAuthUI;
  updateAuthUI = function (first, last, isAdmin, isTeacher) {
    var r = orig.apply(this, arguments);
    var b = gEl('btn-practise');
    var pupil = !!(state.uid && state.className && !isAdmin && !isTeacher && !state.isTeacher && !state.isAdmin);
    if (b) b.classList.add('hidden');
    if (pupil && b) gtPupilIsGcse().then(function (yes) { if (yes && state.uid) b.classList.remove('hidden'); });
    return r;
  };
})();
