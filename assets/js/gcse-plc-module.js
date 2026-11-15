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
async function plcOpen() {
  var m = gEl('modal-plc');
  if (!m) {
    m = document.createElement('div');
    m.id = 'modal-plc';
    m.className = 'fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto';
    m.innerHTML = '<div class="bg-white rounded-xl shadow-xl w-full max-w-3xl mt-8"><div class="flex justify-between items-center px-5 py-3 border-b"><div><h2 class="font-bold text-lg">My topic checklist</h2><p class="text-xs text-gray-500">How confident do you feel on each topic you have been taught?</p></div><button type="button" id="plc-close" class="text-gray-400 text-xl">✕</button></div><div id="plc-body" class="p-5"></div></div>';
    document.body.appendChild(m);
  }
  m.classList.remove('hidden');
  gEl('plc-close').onclick = function () { m.classList.add('hidden'); };
  var body = gEl('plc-body');
  body.innerHTML = '<p class="text-gray-400 text-sm">Loading…</p>';
  var snaps = await Promise.all([
    state.db.ref('classes/' + state.className + '/settings/covered').get().then(function (s) { return s.val() || {}; }).catch(function () { return null; }),
    state.db.ref('progress/' + state.uid + '/plc').get().then(function (s) { return s.val() || {}; }).catch(function () { return {}; }),
    state.db.ref('progress/' + state.uid + '/assessments').get().then(function (s) { return s.val() || {}; }).catch(function () { return {}; })
  ]);
  var scores = plcScoresFromAssessments(snaps[2]);
  var topics = {};
  Object.keys(snaps[0] || {}).forEach(function (k) { J277.expand(plcCode(k)).forEach(function (s) { topics[s] = true; }); });
  if (!Object.keys(topics).length) Object.keys(scores).forEach(function (s) { topics[s] = true; });   // fallback: topics from released tests
  plcDraw(body, Object.keys(topics), snaps[1], scores);
}
function plcDraw(body, topics, ratings, scores) {
  if (!topics.length) { body.innerHTML = '<p class="text-sm text-gray-500 py-4">Your teacher has not marked any topics as taught yet. Check back later.</p>'; return; }
  topics.sort(function (a, b) { return a.localeCompare(b, undefined, { numeric: true }); });
  var groups = {};
  topics.forEach(function (tc) { var pt = J277.point(tc); var k = pt ? pt.code : tc; (groups[k] = groups[k] || []).push(tc); });
  var rated = topics.filter(function (tc) { return ratings[plcKey(tc)]; }).length;
  var over = topics.filter(function (tc) { var r = ratings[plcKey(tc)]; return plcMismatch(r && r.r, scores[tc] ? scores[tc].pct : null) === 'over'; });
  var h = '<div class="flex flex-wrap items-center gap-3 mb-3 text-sm"><span><b>' + rated + ' / ' + topics.length + '</b> rated</span>' +
    Object.keys(PLC).map(function (k) { return '<span class="text-xs px-2 py-0.5 rounded" style="background:' + PLC[k].bg + ';color:' + PLC[k].fg + '">' + PLC[k].label + ' ' + topics.filter(function (tc) { var r = ratings[plcKey(tc)]; return r && r.r === k; }).length + '</span>'; }).join('') + '</div>';
  if (over.length) h += '<div class="rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900 mb-3"><b>Double-check these:</b> you feel confident but scored under 50% in tests – ' + over.map(function (tc) { return gEsc(J277.label(tc)); }).join(', ') + '.</div>';
  h += Object.keys(groups).sort(function (a, b) { return a.localeCompare(b, undefined, { numeric: true }); }).map(function (g) {
    var n = J277.get(g);
    return '<div class="mb-3"><div class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">' + gEsc(n ? n.code + ' ' + n.title : g) + '</div>' + groups[g].map(function (tc) {
      var r = ratings[plcKey(tc)], cur = r && r.r, sc = scores[tc];
      var mm = plcMismatch(cur, sc ? sc.pct : null);
      return '<div class="plc-row flex flex-wrap items-center gap-2 py-1 border-b border-gray-100" data-topic="' + gEsc(tc) + '"><span class="flex-1 min-w-[200px] text-sm">' + gEsc(J277.label(tc)) + '</span>' +
        (sc && sc.pct != null ? '<span class="text-xs px-1.5 rounded" style="' + gRag(sc.pct) + '" title="Your released test marks on this topic">Tests ' + sc.pct + '%</span>' : '<span class="text-xs text-gray-400">no test yet</span>') +
        (mm === 'over' ? '<span class="text-[11px] text-amber-800">check this one</span>' : '') +
        '<div class="flex gap-1">' + Object.keys(PLC).map(function (k) {
          var on = cur === k;
          return '<button type="button" class="plc-rate text-xs px-2 py-1 rounded border" data-topic="' + gEsc(tc) + '" data-r="' + k + '" aria-pressed="' + on + '" style="' + (on ? 'background:' + PLC[k].bg + ';color:' + PLC[k].fg + ';border-color:' + PLC[k].ring + ';font-weight:600' : 'background:#fff;border-color:#d1d5db;color:#4b5563') + '">' + PLC[k].label + '</button>';
        }).join('') + '</div></div>';
    }).join('') + '</div>';
  }).join('');
  body.innerHTML = h;
  body.querySelectorAll('.plc-rate').forEach(function (b) {
    b.onclick = async function () {
      var tc = b.dataset.topic, k = plcKey(tc);
      var val = ratings[k] && ratings[k].r === b.dataset.r ? null : { r: b.dataset.r, at: Date.now() };
      try { await state.db.ref('progress/' + state.uid + '/plc/' + k).set(val); } catch (e) { return; }
      if (val) ratings[k] = val; else delete ratings[k];
      plcDraw(body, topics, ratings, scores);
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
    if (btn) btn.onclick = plcOpen;
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
