/**
 * gcse-topictree.js – shared pieces for the GCSE topic screens.
 *
 *  gtPickerHtml(id, opts) / gtBindPicker(id, onChange) / gtPicked(id)
 *      A ticked Paper → unit → spec point → topic tree with a search box. Used by homework and practice.
 *      opts.allowed(code)  only these topics can be picked (e.g. ones that have questions)
 *      opts.selected       codes ticked to start with (any level)
 *      opts.badge(code)    small HTML after a topic name (e.g. "taught", a band)
 *      opts.quick          [{ label, codes }] buttons above the tree ("My weakest topics")
 *  gtRevisionLink(code)    where to revise a topic (Teach-ICT by default; the teacher can turn the links
 *                          off or point a topic at their own notes: classes/{class}/settings/links).
 */
var GT = { links: null, linksFor: null };
var GT_PAPERS = { '1': 'Paper 1 – Computer systems', '2': 'Paper 2 – Algorithms and programming' };
function gtName(code) { return typeof gTopicName === 'function' ? gTopicName(code) : J277.label(code); }
function gtUnits() { return J277.list.filter(function (n) { return n.level === 1; }); }
function gtChildren(code) { return J277.list.filter(function (n) { return n.parent === code; }); }
function gtSubs(code) { return (J277.expand(code) || []).slice(); }
// Codes at any level → the sub-topics they cover.
function gtExpand(codes) {
  var out = {};
  (codes || []).forEach(function (c) { (J277.expand(c) || []).forEach(function (s) { out[s] = true; }); });
  return Object.keys(out);
}
// Sub-topics → the shortest list of codes (a whole spec point or unit when every topic in it is picked).
function gtCompress(subs, allowed) {
  var set = {}; subs.forEach(function (s) { set[s] = true; });
  var out = [];
  gtUnits().forEach(function (u) {
    var us = gtSubs(u.code).filter(function (s) { return !allowed || allowed(s); });
    if (us.length && us.every(function (s) { return set[s]; })) { out.push(u.code); return; }
    gtChildren(u.code).forEach(function (pt) {
      var ps = gtSubs(pt.code).filter(function (s) { return !allowed || allowed(s); });
      if (ps.length && ps.every(function (s) { return set[s]; })) out.push(pt.code);
      else ps.forEach(function (s) { if (set[s]) out.push(s); });
    });
  });
  return out;
}
function gtSummary(codes, max) {
  max = max || 4;
  var names = (codes || []).map(gtName);
  return names.length <= max ? names.join(', ') : names.slice(0, max).join(', ') + ' and ' + (names.length - max) + ' more';
}
function gtCss() {
  if (gEl('gt-style')) return;
  var st = document.createElement('style'); st.id = 'gt-style';
  st.textContent = '.gt-search{width:100%;border:1px solid #d1d5db;border-radius:10px;padding:.45rem .75rem .45rem 2rem;font-size:.9rem;background:#fff url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 fill=%27none%27 stroke=%27%239ca3af%27 stroke-width=%272%27%3E%3Ccircle cx=%277%27 cy=%277%27 r=%275%27/%3E%3Cpath d=%27M11 11l4 4%27/%3E%3C/svg%3E") no-repeat .65rem center}' +
    '.gt-search:focus{outline:2px solid rgba(176,28,35,.3);border-color:rgb(176,28,35)}' +
    '.gt-paper{font-size:.7rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#6b7280;margin:.9rem 0 .35rem}' +
    '.gt-unit{border:1px solid #e5e7eb;border-radius:10px;margin-bottom:.4rem;background:#fff}.gt-unit>summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:.6rem;padding:.55rem .75rem}.gt-unit>summary::-webkit-details-marker{display:none}' +
    '.gt-unit>summary:before{content:"›";font-weight:700;color:#9ca3af;transition:transform .15s;display:inline-block;width:.6rem}.gt-unit[open]>summary:before{transform:rotate(90deg)}' +
    '.gt-unit-title{font-weight:700;color:#111827;font-size:.92rem}.gt-n{margin-left:auto;font-size:.72rem;color:#6b7280;white-space:nowrap}' +
    '.gt-inner{padding:0 .75rem .6rem 2.1rem}.gt-pt{margin-top:.4rem}.gt-pt-title{font-size:.72rem;font-weight:700;color:#6b7280;display:flex;align-items:center;gap:.4rem;margin-bottom:.15rem}' +
    '.gt-sub{display:flex;align-items:center;gap:.5rem;padding:.25rem .3rem;border-radius:6px;font-size:.88rem;cursor:pointer}.gt-sub:hover{background:#f9fafb}.gt-sub.gt-off{color:#9ca3af;cursor:default}' +
    '.gt input[type=checkbox]{width:1rem;height:1rem;accent-color:rgb(176,28,35);flex:none}' +
    '.gt-quick{display:flex;flex-wrap:wrap;gap:.35rem;margin:.5rem 0}.gt-qb{font-size:.78rem;font-weight:600;padding:.25rem .65rem;border-radius:999px;border:1px solid #d1d5db;background:#fff}.gt-qb:hover{border-color:rgb(176,28,35);color:rgb(176,28,35)}' +
    '.gt-count{font-size:.8rem;color:#374151}.gt-hide{display:none!important}';
  document.head.appendChild(st);
}
function gtPickerHtml(id, opts) {
  gtCss();
  opts = opts || {};
  var allowed = opts.allowed || function () { return true; };
  var sel = {}; gtExpand(opts.selected || []).forEach(function (s) { sel[s] = true; });
  var paperOf = function (u) { return u.code.charAt(0); };
  var h = '<div class="gt" id="' + id + '"><input type="search" class="gt-search" placeholder="Search topics, e.g. cache, loops, binary" aria-label="Search topics">' +
    (opts.quick && opts.quick.length ? '<div class="gt-quick">' + opts.quick.map(function (q, i) { return '<button type="button" class="gt-qb" data-q="' + i + '">' + gEsc(q.label) + '</button>'; }).join('') + '<button type="button" class="gt-qb" data-q="clear">Clear</button></div>' : '') +
    '<div class="gt-count mt-1"></div><div class="gt-body">';
  var lastPaper = '';
  gtUnits().forEach(function (u) {
    var subs = gtSubs(u.code).filter(allowed);
    if (!subs.length) return;
    if (paperOf(u) !== lastPaper) { lastPaper = paperOf(u); h += '<div class="gt-paper">' + gEsc(GT_PAPERS[lastPaper] || 'Paper ' + lastPaper) + '</div>'; }
    var open = subs.some(function (s) { return sel[s]; });
    h += '<details class="gt-unit" data-code="' + u.code + '"' + (open ? ' open' : '') + '><summary><input type="checkbox" class="gt-cb-unit" aria-label="All of ' + gEsc(u.title) + '"><span class="gt-unit-title">' + gEsc(u.code + ' ' + u.title) + '</span><span class="gt-n"></span></summary><div class="gt-inner">';
    gtChildren(u.code).forEach(function (pt) {
      var ps = gtSubs(pt.code).filter(allowed);
      if (!ps.length) return;
      h += '<div class="gt-pt" data-code="' + pt.code + '"><label class="gt-pt-title"><input type="checkbox" class="gt-cb-pt">' + gEsc(pt.title) + '</label>' +
        ps.map(function (s) {
          return '<label class="gt-sub" data-code="' + s + '" data-name="' + gEsc(gtName(s).toLowerCase() + ' ' + pt.title.toLowerCase() + ' ' + u.title.toLowerCase()) + '"><input type="checkbox" class="gt-cb" value="' + s + '"' + (sel[s] ? ' checked' : '') + '><span>' + gEsc(gtName(s)) + '</span>' + (opts.badge ? opts.badge(s) || '' : '') + '</label>';
        }).join('') + '</div>';
    });
    h += '</div></details>';
  });
  return h + '</div></div>';
}
function gtPicked(id) {
  var root = gEl(id); if (!root) return [];
  return Array.prototype.map.call(root.querySelectorAll('.gt-cb:checked'), function (c) { return c.value; });
}
function gtSync(root) {
  root.querySelectorAll('.gt-pt').forEach(function (pt) {
    var cbs = pt.querySelectorAll('.gt-cb'), n = Array.prototype.filter.call(cbs, function (c) { return c.checked; }).length;
    var head = pt.querySelector('.gt-cb-pt'); head.checked = n === cbs.length && n > 0; head.indeterminate = n > 0 && n < cbs.length;
  });
  root.querySelectorAll('.gt-unit').forEach(function (u) {
    var cbs = u.querySelectorAll('.gt-cb'), n = Array.prototype.filter.call(cbs, function (c) { return c.checked; }).length;
    var head = u.querySelector('.gt-cb-unit'); head.checked = n === cbs.length && n > 0; head.indeterminate = n > 0 && n < cbs.length;
    u.querySelector('.gt-n').textContent = n ? n + ' of ' + cbs.length + ' picked' : cbs.length + ' topics';
  });
  var total = root.querySelectorAll('.gt-cb:checked').length;
  root.querySelector('.gt-count').innerHTML = total ? '<b>' + total + '</b> topic' + (total === 1 ? '' : 's') + ' picked' : 'Tick the topics you want.';
}
function gtBindPicker(id, onChange, opts) {
  var root = gEl(id); if (!root) return;
  opts = opts || {};
  var changed = function () { gtSync(root); if (onChange) onChange(gtPicked(id)); };
  root.querySelectorAll('.gt-cb').forEach(function (c) { c.onchange = changed; });
  root.querySelectorAll('.gt-cb-pt').forEach(function (c) { c.onchange = function () { c.closest('.gt-pt').querySelectorAll('.gt-cb').forEach(function (x) { if (!x.closest('.gt-sub').classList.contains('gt-hide')) x.checked = c.checked; }); changed(); }; });
  root.querySelectorAll('.gt-cb-unit').forEach(function (c) {
    c.onclick = function (e) { e.stopPropagation(); };
    c.onchange = function () { var u = c.closest('.gt-unit'); u.querySelectorAll('.gt-cb').forEach(function (x) { if (!x.closest('.gt-sub').classList.contains('gt-hide')) x.checked = c.checked; }); if (c.checked) u.open = true; changed(); };
  });
  root.querySelectorAll('.gt-qb').forEach(function (b) {
    b.onclick = function () {
      var want = {};
      if (b.dataset.q !== 'clear') gtExpand(opts.quick[Number(b.dataset.q)].codes).forEach(function (s) { want[s] = true; });
      root.querySelectorAll('.gt-cb').forEach(function (x) { x.checked = !!want[x.value]; });
      root.querySelectorAll('.gt-unit').forEach(function (u) { if (u.querySelector('.gt-cb:checked')) u.open = true; });
      changed();
    };
  });
  var search = root.querySelector('.gt-search');
  search.oninput = function () {
    var q = search.value.trim().toLowerCase();
    root.querySelectorAll('.gt-unit').forEach(function (u) {
      var any = false;
      u.querySelectorAll('.gt-pt').forEach(function (pt) {
        var anyPt = false;
        pt.querySelectorAll('.gt-sub').forEach(function (s) { var hit = !q || s.dataset.name.indexOf(q) !== -1; s.classList.toggle('gt-hide', !hit); if (hit) anyPt = true; });
        pt.classList.toggle('gt-hide', !anyPt); if (anyPt) any = true;
      });
      u.classList.toggle('gt-hide', !any);
      if (q && any) u.open = true;
    });
    root.querySelectorAll('.gt-paper').forEach(function (p) {
      var n = p.nextElementSibling, any = false;
      while (n && !n.classList.contains('gt-paper')) { if (!n.classList.contains('gt-hide')) any = true; n = n.nextElementSibling; }
      p.classList.toggle('gt-hide', !any);
    });
  };
  gtSync(root);
}

// Is the logged-in pupil in a GCSE class? (settings/type once the rules allow pupils to read it; until then:
// the class has taught topics marked, or the pupil has a GCSE paper test.)
function gtPupilIsGcse() {
  if (!state || !state.uid || !state.className) return Promise.resolve(false);
  if (GT.gcseFor === state.uid + '|' + state.className) return GT.gcse;
  GT.gcseFor = state.uid + '|' + state.className;
  GT.gcse = state.db.ref('classes/' + state.className + '/settings/type').get().then(function (s) { if (s.exists()) return s.val() === 'gcse'; throw new Error('no type'); })
    .catch(function () {
      return Promise.all([state.db.ref('classes/' + state.className + '/settings/covered').get().then(function (s) { return !!(s.val() && Object.keys(s.val()).length); }).catch(function () { return false; }),
        state.db.ref('progress/' + state.uid + '/assessments').get().then(function (s) { var v = s.val() || {}; return Object.keys(v).some(function (k) { return v[k] && v[k].type === 'paper'; }); }).catch(function () { return false; })])
        .then(function (r) { return r[0] || r[1]; });
    });
  return GT.gcse;
}

// ── Revision links (Teach-ICT by default) ───────────────────────────────────
// settings: { off: true } or { map: { '1_1_1e': 'https://…' } } at classes/{class}/settings/links.
function gtLoadLinks(className) {
  if (!className || !state || !state.db) return Promise.resolve(null);
  if (GT.linksFor === className && GT.links) return Promise.resolve(GT.links);
  return state.db.ref('classes/' + className + '/settings/links').get().then(function (s) { GT.links = s.val() || {}; GT.linksFor = className; return GT.links; }).catch(function () { GT.links = {}; GT.linksFor = className; return GT.links; });
}
function gtRevisionLink(code) {
  var L = GT.links || {};
  if (L.off) return null;
  var own = L.map || {}, tc = String(code || ''), pt = (tc.match(/^\d\.\d\.\d/) || [''])[0];
  var k = function (c) { return String(c).replace(/\./g, '_'); };
  if (own[k(tc)]) return own[k(tc)];
  if (pt && own[k(pt)]) return own[k(pt)];
  return typeof redoLink === 'function' ? redoLink(tc) : null;
}
function gtRevisionLinkHtml(code, label) {
  var u = gtRevisionLink(code); if (!u) return '';
  var own = !/teach-ict\.com/.test(u);
  return '<a class="gt-link inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline whitespace-nowrap" target="_blank" rel="noopener" href="' + gEsc(u) + '" title="Opens in a new tab">📘 ' + gEsc(label || (own ? 'Revise this' : 'Revise on Teach-ICT')) + '</a>';
}
(function () {
  if (typeof updateAuthUI !== 'function') return;
  var orig = updateAuthUI;
  updateAuthUI = function () { var r = orig.apply(this, arguments); GT.links = null; GT.linksFor = null; GT.gcse = null; GT.gcseFor = null; if (state && state.className) gtLoadLinks(state.className); return r; };
})();
