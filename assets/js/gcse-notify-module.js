/**
 * gcse-notify-module.js – the 🔔 notification bell in the top bar (staff only).
 *
 * Lists, for every GCSE class:
 *   🚩 pupils stuck on a redo question (two failed tries)
 *   ✋ "I think I'm right" appeals and answers the marker was unsure about
 * Each item has its buttons in the list. Checks every minute while the page is open.
 * The bell sits above open panels, so it is visible from anywhere.
 */
var NOTIFY = { timer: null, open: false };

function notifyBadge(n) {
  var c = gEl('notify-count'); if (!c) return;
  c.textContent = n > 99 ? '99+' : String(n || '');
  c.classList.toggle('hidden', !n);
  var b = gEl('btn-notify'); if (b) b.title = n ? n + ' notification' + (n === 1 ? '' : 's') : 'No notifications';
}
async function notifyRefresh(force) {
  if (!gIsStaff() || typeof redoLoadNotifications !== 'function') return null;
  var N;
  try { N = await redoLoadNotifications(force); } catch (e) { return null; }
  notifyBadge(N.items.length);
  if (NOTIFY.open) notifyDraw(N.items);
  return N;
}
function notifyPanel() {
  var p = gEl('notify-panel');
  if (!p) {
    p = document.createElement('div');
    p.id = 'notify-panel';
    p.className = 'hidden fixed z-[80] bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden';
    p.style.cssText = 'top:3.25rem;right:1rem;width:28rem;max-width:calc(100vw - 2rem)';
    p.innerHTML = '<div class="flex items-center gap-2 px-4 py-2.5 border-b bg-gray-50"><b class="text-gray-900">Notifications</b><span id="notify-sub" class="text-xs text-gray-500"></span>' +
      '<button type="button" id="notify-refresh" class="ml-auto text-xs px-2 py-1 rounded border border-gray-300 bg-white">Refresh</button><button type="button" id="notify-close" class="text-gray-400 text-lg leading-none px-1" aria-label="Close">✕</button></div>' +
      '<div id="notify-list" class="overflow-y-auto" style="max-height:70vh"></div>';
    document.body.appendChild(p);
    gEl('notify-close').onclick = notifyClose;
    gEl('notify-refresh').onclick = function () { gEl('notify-list').innerHTML = '<p class="p-4 text-sm text-gray-400">Checking…</p>'; notifyRefresh(true); };
    document.addEventListener('mousedown', function (e) {
      if (!NOTIFY.open) return;
      var b = gEl('btn-notify');
      if (p.contains(e.target) || (b && b.contains(e.target))) return;
      notifyClose();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && NOTIFY.open) notifyClose(); });
  }
  return p;
}
function notifyClose() { NOTIFY.open = false; var p = gEl('notify-panel'); if (p) p.classList.add('hidden'); var b = gEl('btn-notify'); if (b) b.setAttribute('aria-expanded', 'false'); }
async function notifyToggle() {
  if (NOTIFY.open) { notifyClose(); return; }
  var p = notifyPanel();
  NOTIFY.open = true; p.classList.remove('hidden');
  gEl('btn-notify').setAttribute('aria-expanded', 'true');
  var cached = REDO.notify;
  if (cached) notifyDraw(cached.items); else gEl('notify-list').innerHTML = '<p class="p-4 text-sm text-gray-400">Checking…</p>';
  notifyRefresh(!cached || Date.now() - cached.at > 15000);
}
function notifyAgo(at) {
  if (!at) return '';
  var m = Math.round((Date.now() - at) / 60000);
  return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago';
}
function notifyDraw(items) {
  var list = gEl('notify-list'); if (!list) return;
  gEl('notify-sub').textContent = items.length ? items.length + ' need' + (items.length === 1 ? 's' : '') + ' you' : '';
  if (!items.length) { list.innerHTML = '<div class="p-6 text-center text-sm text-gray-500"><div class="text-3xl mb-1">✅</div>Nothing needs you.<div class="text-xs mt-1">Pupils stuck on redo questions and answers to check appear here.</div></div>'; return; }
  var who = function (it) { return '<button type="button" class="notify-profile font-semibold text-gray-900 hover:underline" data-code="' + gEsc(it.code) + '">' + gEsc(gName(it.code) || it.code) + '</button> <span class="text-xs text-gray-500">' + gEsc(it.cls) + ' · ' + notifyAgo(it.at) + '</span>'; };
  list.innerHTML = items.slice(0, 50).map(function (it, i) {
    if (it.kind === 'needs') {
      return '<div class="notify-item flex gap-3 px-4 py-3 border-b border-gray-100" data-kind="needs"><span class="text-xl">🚩</span><div class="flex-1 text-sm">' + who(it) +
        '<div class="text-gray-700">Stuck on <b>' + gEsc(redoLabel(it.part)) + '</b> of ' + gEsc(it.title) + ' – ' + it.tries + ' tries</div>' +
        '<button type="button" class="notify-seen mt-1.5 text-xs px-2 py-1 rounded border border-gray-300" data-i="' + i + '">Seen – I\'ve helped</button></div></div>';
    }
    return '<div class="notify-item flex gap-3 px-4 py-3 border-b border-gray-100" data-kind="review"><span class="text-xl">✋</span><div class="flex-1 min-w-0 text-sm">' + who(it) +
      '<div class="text-gray-700">' + (it.source === 'appeal' ? 'Thinks this answer is right' : 'The marker is unsure') + (it.redo ? ' <span class="text-xs text-gray-500">(redo of ' + gEsc(redoLabel(it.redo.id || '')) + ')</span>' : '') + '</div>' +
      '<details class="mt-1"><summary class="cursor-pointer text-xs text-blue-700">Question and answer</summary><div class="text-xs text-gray-600 mt-1 whitespace-pre-wrap">' + gEsc(String(it.question || '').slice(0, 400)) + '</div></details>' +
      '<div class="mt-1 bg-gray-50 rounded p-2 text-sm whitespace-pre-wrap break-words">' + gEsc(it.answer) + '</div>' +
      '<div class="mt-1.5 flex flex-wrap items-center gap-2"><span class="text-xs text-gray-500">Auto mark ' + it.auto + ' / ' + it.max + '</span>' +
      '<button type="button" class="notify-decide text-xs px-2 py-1 rounded border border-green-500 text-green-700 font-semibold" data-i="' + i + '" data-ok="1">Award full marks</button>' +
      '<button type="button" class="notify-decide text-xs px-2 py-1 rounded border border-gray-300" data-i="' + i + '" data-ok="0">' + (it.redo ? 'Not right – redo it' : 'Keep the auto mark') + '</button></div></div></div>';
  }).join('') + (items.length > 50 ? '<p class="p-3 text-xs text-gray-500">' + (items.length - 50) + ' more – clear some to see them.</p>' : '');
  list.querySelectorAll('.notify-profile').forEach(function (b) { b.onclick = function () { notifyClose(); openGcseProfile(b.dataset.code); }; });
  list.querySelectorAll('.notify-seen').forEach(function (b) {
    b.onclick = async function () { var it = items[Number(b.dataset.i)]; b.disabled = true; try { await state.db.ref('progress/' + it.code + '/redo/' + it.testId + '/parts/' + it.part + '/seen').set(Date.now()); } catch (e) {} notifyRefresh(true); };
  });
  list.querySelectorAll('.notify-decide').forEach(function (b) {
    b.onclick = async function () { var it = items[Number(b.dataset.i)]; b.disabled = true; try { await gcseDecideReview(it, b.dataset.ok === '1'); } catch (e) { b.disabled = false; return; } notifyRefresh(true); };
  });
}
function notifyStart() {
  clearInterval(NOTIFY.timer);
  notifyRefresh(true);
  NOTIFY.timer = setInterval(function () { if (!document.hidden && gIsStaff()) notifyRefresh(true); }, 60000);
}
function notifyStop() { clearInterval(NOTIFY.timer); NOTIFY.timer = null; notifyClose(); notifyBadge(0); }

(function () {
  var wire = function () { var b = gEl('btn-notify'); if (b) b.onclick = notifyToggle; };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
  if (typeof updateAuthUI !== 'function') return;
  var orig = updateAuthUI;
  updateAuthUI = function (first, last, isAdmin, isTeacher) {
    var r = orig.apply(this, arguments);
    var staff = !!(state.uid && (isAdmin || isTeacher));
    var b = gEl('btn-notify'); if (b) b.classList.toggle('hidden', !staff);
    if (staff) setTimeout(function () { if (gIsStaff()) notifyStart(); }, 1500); else notifyStop();
    return r;
  };
})();
