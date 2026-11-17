/**
 * gcse-plc-module.js – Personal learning checklist (PLC).
 *
 * Pupils rate their confidence on each taught topic: red (not sure),
 * amber (getting there), green (confident). It is shown next to their
 * released test score so mismatches stand out:
 *   over-confident  = green but scoring under 50%
 *   under-confident = red but scoring 70%+
 * Saved to progress/{code}/plc/{topicKey} = { r: 'red'|'amber'|'green', at }.
 */
var PLC = {
  red: { label: 'Not sure', bg: '#fee2e2', fg: '#991b1b', ring: '#dc2626' },
  amber: { label: 'Getting there', bg: '#fef3c7', fg: '#92400e', ring: '#d97706' },
  green: { label: 'Confident', bg: '#dcfce7', fg: '#166534', ring: '#16a34a' }
};
function plcKey(code) { return String(code).replace(/\./g, '_'); }
function plcCode(key) { return String(key).replace(/_/g, '.'); }
// Over / under confidence from a rating and a score (null if no score yet).
function plcMismatch(rating, pct) {
  if (!rating || pct == null) return null;
  if (rating === 'green' && pct < 50) return 'over';
  if (rating === 'red' && pct >= 70) return 'under';
  return null;
}
// Released paper-test scores per sub-topic from a pupil's own assessment copies.
function plcScoresFromAssessments(assessments) {
  var per = {};
  Object.keys(assessments || {}).forEach(function (id) {
    var a = assessments[id];
    if (!a || a.type !== 'paper' || !a.releasedAt) return;
    GcseCore.asList(a.rubric).forEach(function (c) {
      GcseCore.asList(c.topics).forEach(function (tc) {
        J277.expand(tc).forEach(function (s) {
          var P = per[s] || (per[s] = { a: 0, p: 0 });
          P.a += Number(c.awarded) || 0; P.p += Number(c.marks) || 0;
        });
      });
    });
  });
  Object.keys(per).forEach(function (k) { per[k].pct = per[k].p ? Math.round(per[k].a / per[k].p * 100) : null; });
  return per;
}

// ── Pupil ───────────────────────────────────────────────────────────────────
var PLC_UI = { filter: 'all', q: '', open: {} };
var PLC_FACES = { red: '😕', amber: '🙂', green: '😎' };
async function plcOpen(keepPlace) {
  if (keepPlace !== true) PLC_UI = { filter: 'all', q: '', open: {} };   // fresh each time it is opened from the menu
  var m = gEl('modal-plc');
  if (!m) {
    m = document.createElement('div');
    m.id = 'modal-plc';
    m.className = 'fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-3 sm:p-6 overflow-y-auto';
    m.innerHTML = '<div class="bg-white rounded-2xl shadow-xl w-full max-w-3xl mt-2 overflow-hidden"><div class="flex items-center gap-3 px-5 py-3 bg-[rgb(176,28,35)] text-white"><div><h2 class="font-extrabold text-lg leading-tight">My topic checklist</h2><p class="text-xs opacity-90">Bands come from your test marks. Tap a face to say how confident you feel.</p></div>' +
      '<button type="button" id="plc-close" class="ml-auto text-white/90 hover:text-white text-xl leading-none px-1" aria-label="Close">✕</button></div><div id="plc-body" class="p-4 sm:p-5"></div></div>';
    document.body.appendChild(m);
  }
  m.classList.remove('hidden');
  gEl('plc-close').onclick = function () { m.classList.add('hidden'); };
  var body = gEl('plc-body');
  body.innerHTML = '<p class="text-gray-400 text-sm">Loading…</p>';
  if (!state.className && state.uid && typeof findClassForCode === 'function') { try { state.className = await findClassForCode(state.uid); } catch (e) {} }
  var snaps = await Promise.all([
    state.db.ref('classes/' + state.className + '/settings/covered').get().then(function (s) { return s.val() || {}; }).catch(function () { return null; }),
    state.db.ref('progress/' + state.uid + '/plc').get().then(function (s) { return s.val() || {}; }).catch(function () { return {}; }),
    state.db.ref('progress/' + state.uid + '/assessments').get().then(function (s) { return s.val() || {}; }).catch(function () { return {}; }),
    state.db.ref('progress/' + state.uid + '/gcseQuiz').get().then(function (s) { return s.val() || {}; }).catch(function () { return {}; }),
    typeof gtLoadLinks === 'function' ? gtLoadLinks(state.className) : Promise.resolve(null)
  ]);
  var scores = plcScoresFromAssessments(snaps[2]);
  var practice = {};
  Object.keys(snaps[3] || {}).forEach(function (k) { var v = snaps[3][k] || {}; if (v.attempted) practice[plcCode(k)] = { a: v.correct || 0, n: v.attempted }; });
  var topics = {};
  Object.keys(snaps[0] || {}).forEach(function (k) { J277.expand(plcCode(k)).forEach(function (s) { topics[s] = true; }); });
  Object.keys(scores).forEach(function (s) { if ((J277.get(s) || {}).level === 3) topics[s] = true; });   // tested topics always show
  plcDraw(body, Object.keys(topics), snaps[1], scores, practice);
}
// Where the pupil's released test marks put a topic (null = not tested yet). Same bands as the test checklist.
var PLC_BANDS = { secure: { icon: '✅', label: 'Secure' }, nearly: { icon: '🟡', label: 'Nearly there' }, notyet: { icon: '❌', label: 'Not yet' } };
function plcBand(sc) { return !sc || sc.pct == null ? null : sc.pct >= 70 ? 'secure' : sc.pct >= 40 ? 'nearly' : 'notyet'; }
function plcTopicName(tc) { return typeof gTopicName === 'function' ? gTopicName(tc) : J277.label(tc); }
function plcDraw(body, topics, ratings, scores, practice) {
  practice = practice || {};
  if (typeof gtCss === 'function') gtCss();
  if (!topics.length) { body.innerHTML = '<p class="text-sm text-gray-500 py-4">Your teacher has not marked any topics as taught yet. Check back later.</p>'; return; }
  topics.sort(function (a, b) { return a.localeCompare(b, undefined, { numeric: true }); });
  var bandOf = function (tc) { return plcBand(scores[tc]) || 'none'; };
  var count = { secure: 0, nearly: 0, notyet: 0, none: 0 };
  topics.forEach(function (tc) { count[bandOf(tc)]++; });
  var next = topics.filter(function (tc) { var b = bandOf(tc); return b === 'nearly' || b === 'notyet'; }).sort(function (a, b) { return scores[a].pct - scores[b].pct; }).slice(0, 3);
  var over = topics.filter(function (tc) { var r = ratings[plcKey(tc)]; return plcMismatch(r && r.r, scores[tc] ? scores[tc].pct : null) === 'over'; });
  var link = function (tc) { return typeof gtRevisionLinkHtml === 'function' ? gtRevisionLinkHtml(tc) : ''; };
  var chips = [['all', 'All', topics.length, ''], ['notyet', '❌ Not yet', count.notyet, '#fee2e2'], ['nearly', '🟡 Nearly there', count.nearly, '#fef3c7'], ['secure', '✅ Secure', count.secure, '#dcfce7'], ['none', '⬜ Not tested', count.none, '#f3f4f6']];
  var h = '<div class="plc-summary"><div class="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter topics">' + chips.map(function (c) {
      var on = PLC_UI.filter === c[0];
      return '<button type="button" class="plc-filter px-3 py-1.5 rounded-full border text-sm font-semibold ' + (on ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-800') + '" style="' + (on || !c[3] ? '' : 'background:' + c[3]) + '" data-f="' + c[0] + '" aria-pressed="' + on + '">' + c[1] + ' <span class="opacity-70">' + c[2] + '</span></button>';
    }).join('') + '</div>' +
    '<div class="text-xs text-gray-500 mt-1.5">From your tests: ✅ ' + count.secure + ' secure · 🟡 ' + count.nearly + ' nearly there · ❌ ' + count.notyet + ' not yet' + (count.none ? ' · ' + count.none + ' not tested yet' : '') + '</div></div>';
  if (next.length && PLC_UI.filter === 'all' && !PLC_UI.q) {
    h += '<div class="rounded-xl border-2 border-[rgb(176,28,35)] p-3 mt-3"><div class="font-bold text-gray-900 text-sm">Work on these next</div><ol class="mt-1 space-y-1">' + next.map(function (tc, i) {
      return '<li class="plc-next flex flex-wrap items-center gap-2 text-sm"><span class="flex-1 min-w-[12rem]"><b>' + (i + 1) + '.</b> ' + gEsc(plcTopicName(tc)) + '</span>' + link(tc) +
        '<button type="button" class="plc-practise px-3 py-1 rounded-lg border border-gray-300 text-xs font-semibold hover:bg-gray-50" data-topic="' + gEsc(tc) + '">Practise</button></li>';
    }).join('') + '</ol></div>';
  }
  if (over.length && PLC_UI.filter === 'all' && !PLC_UI.q) h += '<div class="rounded-lg border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900 mt-3"><b>Double-check:</b> you feel confident about ' + over.map(function (tc) { return gEsc(plcTopicName(tc)); }).join(', ') + ', but your test marks were under 50%.</div>';
  h += '<input type="search" id="plc-search" class="gt-search mt-3" placeholder="Search your topics, e.g. cache, loops" value="' + gEsc(PLC_UI.q) + '" aria-label="Search topics">';
  // Paper → unit → topic rows. Units open by default when they have something not yet secure.
  var units = {};
  topics.forEach(function (tc) { var u = J277.area(tc); var k = u ? u.code : tc.slice(0, 3); (units[k] = units[k] || []).push(tc); });
  var q = PLC_UI.q.trim().toLowerCase(), lastPaper = '', shown = 0;
  Object.keys(units).sort(function (a, b) { return a.localeCompare(b, undefined, { numeric: true }); }).forEach(function (uk) {
    var all = units[uk], u = J277.get(uk);
    var rows = all.filter(function (tc) { return (PLC_UI.filter === 'all' || bandOf(tc) === PLC_UI.filter) && (!q || (plcTopicName(tc) + ' ' + (u ? u.title : '')).toLowerCase().indexOf(q) !== -1); });
    if (!rows.length) return;
    shown += rows.length;
    var paper = uk.charAt(0);
    if (paper !== lastPaper) { lastPaper = paper; h += '<div class="gt-paper">' + gEsc((typeof GT_PAPERS !== 'undefined' && GT_PAPERS[paper]) || 'Paper ' + paper) + '</div>'; }
    var c = { secure: 0, nearly: 0, notyet: 0, none: 0 }; all.forEach(function (tc) { c[bandOf(tc)]++; });
    var open = PLC_UI.open[uk] != null ? PLC_UI.open[uk] : (q || PLC_UI.filter !== 'all' || c.notyet > 0);
    var bar = ['secure', 'nearly', 'notyet', 'none'].map(function (b) { var col = { secure: '#16a34a', nearly: '#f59e0b', notyet: '#dc2626', none: '#e5e7eb' }[b]; return c[b] ? '<span style="flex:' + c[b] + ';background:' + col + '"></span>' : ''; }).join('');
    h += '<details class="gt-unit plc-unit" data-unit="' + gEsc(uk) + '"' + (open ? ' open' : '') + '><summary><span class="gt-unit-title">' + gEsc(u ? u.title : uk) + '</span>' +
      '<span class="hidden sm:flex h-2 w-24 rounded-full overflow-hidden gap-px ml-auto" title="✅ ' + c.secure + ' · 🟡 ' + c.nearly + ' · ❌ ' + c.notyet + ' · not tested ' + c.none + '">' + bar + '</span>' +
      '<span class="gt-n sm:ml-2">' + (c.notyet ? '❌ ' + c.notyet + ' ' : '') + (c.nearly ? '🟡 ' + c.nearly + ' ' : '') + (c.secure ? '✅ ' + c.secure : '') + (!c.notyet && !c.nearly && !c.secure ? all.length + ' not tested' : '') + '</span></summary><div class="px-2 pb-2">' +
      rows.map(function (tc) {
        var r = ratings[plcKey(tc)], cur = r && r.r, sc = scores[tc], b = bandOf(tc), pr = practice[tc];
        var mm = plcMismatch(cur, sc ? sc.pct : null);
        var chip = b === 'none' ? '<span class="plc-band text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">⬜ Not tested</span>'
          : '<span class="plc-band text-xs px-2 py-0.5 rounded-full font-semibold" style="' + gRag(sc.pct) + '" title="Your released test marks on this topic: ' + sc.pct + '%">' + PLC_BANDS[b].icon + ' ' + PLC_BANDS[b].label + '</span>';
        return '<div class="plc-row flex flex-wrap items-center gap-x-3 gap-y-1 px-2 py-2 rounded-lg hover:bg-gray-50 border-b border-gray-100 last:border-0" data-topic="' + gEsc(tc) + '">' +
          '<span class="flex-1 min-w-[11rem] text-sm text-gray-900">' + gEsc(plcTopicName(tc)) + (mm === 'over' ? ' <span class="text-[11px] text-amber-800 font-semibold">check this</span>' : '') +
            (pr ? '<span class="block text-[11px] text-gray-500">Practice: ' + pr.a + ' / ' + pr.n + ' right</span>' : '') + '</span>' + chip +
          '<span class="flex gap-0.5" role="group" aria-label="How confident are you?">' + Object.keys(PLC).map(function (k) {
            var on = cur === k;
            return '<button type="button" class="plc-rate w-8 h-8 rounded-full border text-base leading-none ' + (on ? '' : 'opacity-40 grayscale hover:opacity-80 hover:grayscale-0') + '" data-topic="' + gEsc(tc) + '" data-r="' + k + '" aria-pressed="' + on + '" title="' + PLC[k].label + '" style="' + (on ? 'background:' + PLC[k].bg + ';border-color:' + PLC[k].ring : 'border-color:transparent') + '">' + PLC_FACES[k] + '</button>';
          }).join('') + '</span>' +
          '<span class="flex items-center gap-2">' + (b === 'nearly' || b === 'notyet' ? link(tc) : '') +
          '<button type="button" class="plc-practise px-2.5 py-1 rounded-lg border border-gray-300 text-xs font-semibold hover:bg-white" data-topic="' + gEsc(tc) + '">Practise</button></span></div>';
      }).join('') + '</div></details>';
  });
  if (!shown) h += '<p class="text-sm text-gray-500 py-6 text-center">No topics match. <button type="button" id="plc-reset" class="underline text-blue-700">Show all topics</button></p>';
  h += '<p class="text-[11px] text-gray-400 mt-3">😕 not sure · 🙂 getting there · 😎 confident</p>';
  body.innerHTML = h;
  var redraw = function () { plcDraw(body, topics, ratings, scores, practice); };
  body.querySelectorAll('.plc-filter').forEach(function (b) { b.onclick = function () { PLC_UI.filter = b.dataset.f; PLC_UI.open = {}; redraw(); }; });
  if (gEl('plc-reset')) gEl('plc-reset').onclick = function () { PLC_UI.filter = 'all'; PLC_UI.q = ''; redraw(); };
  var search = gEl('plc-search'), t = null;
  search.oninput = function () { clearTimeout(t); t = setTimeout(function () { PLC_UI.q = search.value; PLC_UI.open = {}; redraw(); var s2 = gEl('plc-search'); s2.focus(); s2.setSelectionRange(s2.value.length, s2.value.length); }, 200); };
  body.querySelectorAll('.plc-unit').forEach(function (d) { d.ontoggle = function () { PLC_UI.open[d.dataset.unit] = d.open; }; });
  body.querySelectorAll('.plc-practise').forEach(function (b) {
    b.onclick = function () {
      var m = gEl('modal-plc'), back = function () { if (m) m.classList.remove('hidden'); plcOpen(true); };
      if (typeof xpOpen === 'function') { if (m) m.classList.add('hidden'); xpOpen({ topics: [b.dataset.topic], onClose: back }); return; }
      var qs = []; try { qs = gcseQuestionsForTopics([b.dataset.topic], ['mcq', 'short']).map(gcsePracticeItem); } catch (e) { qs = []; }
      if (!qs.length) { b.outerHTML = '<span class="text-xs text-gray-500">No questions yet</span>'; return; }
      if (m) m.classList.add('hidden'); gcse.practiceOnClose = back; gcseStartPractice(qs, plcTopicName(b.dataset.topic));
    };
  });
  body.querySelectorAll('.plc-rate').forEach(function (b) {
    b.onclick = async function () {
      var tc = b.dataset.topic, k = plcKey(tc);
      var val = ratings[k] && ratings[k].r === b.dataset.r ? null : { r: b.dataset.r, at: Date.now() };
      try { await state.db.ref('progress/' + state.uid + '/plc/' + k).set(val); } catch (e) { return; }
      if (val) ratings[k] = val; else delete ratings[k];
      redraw();
    };
  });
}
// ── Teacher: profile section ────────────────────────────────────────────────
function plcProfileHtml(D) {
  var ratings = D.plc || {};
  var keys = Object.keys(ratings).filter(function (k) { return ratings[k] && ratings[k].r; });
  var h = '<div class="border border-gray-200 rounded-lg p-3 mb-4"><h4 class="font-bold mb-2">Confidence (PLC) vs score</h4>';
  if (!keys.length) return h + '<p class="text-sm text-gray-500">No ratings yet – pupils rate topics from <b>My checklist</b>.</p></div>';
  var agg = typeof gcseProfileTopicAgg === 'function' ? gcseProfileTopicAgg(D, {}) : {};
  var subPct = {};
  Object.keys(agg).forEach(function (tc) { J277.expand(tc).forEach(function (s) { var P = subPct[s] || (subPct[s] = { a: 0, p: 0 }); P.a += agg[tc].a; P.p += agg[tc].p; }); });
  var rows = keys.map(function (k) {
    var tc = plcCode(k), P = subPct[tc], pct = P && P.p ? Math.round(P.a / P.p * 100) : null;
    return { tc: tc, r: ratings[k].r, pct: pct, mm: plcMismatch(ratings[k].r, pct) };
  }).sort(function (a, b) { return (b.mm === 'over') - (a.mm === 'over') || (b.mm === 'under') - (a.mm === 'under') || a.tc.localeCompare(b.tc, undefined, { numeric: true }); });
  var over = rows.filter(function (x) { return x.mm === 'over'; }).length, under = rows.filter(function (x) { return x.mm === 'under'; }).length;
  h += '<div class="text-xs text-gray-600 mb-2">' + rows.length + ' topics rated · <b class="text-amber-800">' + over + ' over-confident</b> (confident, under 50%) · <b class="text-blue-800">' + under + ' under-confident</b> (not sure, 70%+)</div>' +
    '<div class="max-h-60 overflow-y-auto"><table class="w-full text-xs"><tr class="bg-gray-50"><th class="p-1 text-left">Topic</th><th class="p-1">Confidence</th><th class="p-1">Score</th><th class="p-1"></th></tr>' + rows.map(function (x) {
      var P = PLC[x.r];
      return '<tr class="border-t plc-prof-row"><td class="p-1">' + gEsc(J277.label(x.tc)) + '</td><td class="p-1 text-center"><span class="px-1.5 rounded" style="background:' + P.bg + ';color:' + P.fg + '">' + P.label + '</span></td>' +
        '<td class="p-1 text-center">' + (x.pct == null ? '<span class="text-gray-400">–</span>' : '<span class="px-1.5 rounded" style="' + gRag(x.pct) + '">' + x.pct + '%</span>') + '</td>' +
        '<td class="p-1">' + (x.mm === 'over' ? '<span class="text-amber-800 font-semibold">Over-confident</span>' : x.mm === 'under' ? '<span class="text-blue-800 font-semibold">Under-confident</span>' : '') + '</td></tr>';
    }).join('') + '</table></div></div>';
  return h;
}

// ── Show "My checklist" for pupils ──────────────────────────────────────────
(function () {
  var wire = function () {
    var btn = gEl('btn-plc');
    if (btn) btn.onclick = function () { plcOpen(); };
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
  if (typeof updateAuthUI !== 'function') return;
  var orig = updateAuthUI;
  updateAuthUI = function (first, last, isAdmin, isTeacher) {
    var r = orig.apply(this, arguments);
    var btn = gEl('btn-plc');
    if (btn) btn.classList.toggle('hidden', !(state.uid && state.className && !isAdmin && !isTeacher && !state.isTeacher && !state.isAdmin));
    return r;
  };
})();
