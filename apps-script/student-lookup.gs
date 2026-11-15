/**
 * PyLearn – private student code lookup (Google Apps Script web app)
 *
 * Lets students "Log In With Google" while the "Classroom Student Codes"
 * sheet stays PRIVATE. The script runs as the teacher who deploys it, checks
 * who is asking (from their Google sign-in token), and returns only:
 *   action "me"    → that student's own code, class and name
 *   action "names" → code → name for that student's own class (leaderboards)
 *
 * ── One-time setup ─────────────────────────────────────────────────────────
 *  1. Signed in with your SCHOOL account, go to https://script.google.com
 *     → New project. Name it "PyLearn Student Lookup".
 *  2. Delete the sample code, paste this whole file, click Save.
 *  3. Deploy → New deployment → gear icon → "Web app":
 *       Description:      Student lookup
 *       Execute as:       Me
 *       Who has access:   Anyone
 *     ("Anyone" is required so the website can reach it; the script itself
 *      refuses every request that isn't a signed-in @jhncc.org student of
 *      this website.)
 *  4. Click Deploy → Authorize access → choose your school account → Allow.
 *  5. Copy the "Web app URL" (ends in /exec) and put it in
 *     config/firebase.json as "studentLookupUrl" (and in config/firebase.js).
 *  6. Test it, then remove students' access to the sheet (Share settings).
 *
 *  If you edit this script later: Deploy → Manage deployments → pencil →
 *  Version: "New version" → Deploy. The URL stays the same.
 */

var SHEET_ID   = '1jajoMxMmZU-B9WICCSO85tJ7C0fsdw7BIA0_bRtK_pE'; // the "Classroom Student Codes" workbook
var FOLDER_ID  = '1R0Ejsu9WWcJ8C-ul0i4kiwUwShKl2bvo';   // fallback search if SHEET_ID is blank
var SHEET_NAME = 'Classroom Student Codes';
var CLIENT_ID  = '116392131413-3v6js8lrm2fj84tmnp1fog0ubefohf0o.apps.googleusercontent.com';
var DOMAIN     = 'jhncc.org';                           // only these accounts may use it
var ROWS_CACHE_SECONDS = 120;                           // sheet edits show up within 2 min

function doPost(e) {
  var out;
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var email = verifyToken_(req.token);
    var data = loadRows_();
    var me = data.byEmail[email];
    if (!me) {
      out = { ok: false, error: 'not_found', email: email };
    } else if (req.action === 'me') {
      out = { ok: true, email: email, code: me.code, className: me.className,
              firstName: me.firstName, lastName: me.lastName };
    } else if (req.action === 'names') {
      var names = {};
      (data.byClass[me.className] || []).forEach(function (r) {
        names[r.code] = (r.firstName + ' ' + r.lastName).trim() || r.code;
      });
      out = { ok: true, className: me.className, names: names };
    } else {
      out = { ok: false, error: 'unknown_action' };
    }
  } catch (err) {
    out = { ok: false, error: String((err && err.message) || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

// A plain visit to the URL just confirms the script is running.
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, service: 'pylearn-student-lookup' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Asks Google who owns the token, and checks it was issued to THIS website
// for a verified school account. Returns the lowercase email.
function verifyToken_(token) {
  if (!token || typeof token !== 'string') throw new Error('missing_token');
  var cache = CacheService.getScriptCache();
  var key = 'tok_' + Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token));
  var cached = cache.get(key);
  if (cached) return cached;

  var res = UrlFetchApp.fetch(
    'https://oauth2.googleapis.com/tokeninfo?access_token=' + encodeURIComponent(token),
    { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error('invalid_token');
  var info = JSON.parse(res.getContentText());
  if (info.aud !== CLIENT_ID && info.azp !== CLIENT_ID) throw new Error('wrong_app');
  if (String(info.email_verified) !== 'true') throw new Error('email_not_verified');
  var email = String(info.email || '').trim().toLowerCase();
  if (!email) throw new Error('no_email');
  if (DOMAIN && email.split('@')[1] !== DOMAIN) throw new Error('wrong_domain');

  cache.put(key, email, 300);
  return email;
}

// Reads every class tab (header: Email Address | First Name | Last Name | Code).
// Cached briefly so a whole class logging in at once only reads the sheet once.
function loadRows_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get('rows_v1');
  if (hit) return JSON.parse(hit);

  var ss;
  if (SHEET_ID) {
    try { ss = SpreadsheetApp.openById(SHEET_ID); } catch (e) { throw new Error('sheet_not_found'); }
  } else {
    var files = DriveApp.getFolderById(FOLDER_ID).getFilesByName(SHEET_NAME);
    if (!files.hasNext()) throw new Error('sheet_not_found');
    ss = SpreadsheetApp.openById(files.next().getId());
  }

  var data = { byEmail: {}, byClass: {} };
  ss.getSheets().forEach(function (sheet) {
    var className = sheet.getName();
    var values = sheet.getDataRange().getDisplayValues();
    if (!values.length) return;
    var col = headerIndexes_(values[0]);
    if (col.email == null || col.code == null) return; // not a class tab
    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      var email = String(row[col.email] || '').trim().toLowerCase();
      var code = String(row[col.code] || '').trim();
      if (!email || !code) continue;
      var rec = {
        code: code,
        className: className,
        firstName: col.first != null ? String(row[col.first] || '').trim() : '',
        lastName: col.last != null ? String(row[col.last] || '').trim() : ''
      };
      if (!data.byEmail[email]) data.byEmail[email] = rec; // first tab wins on duplicates
      (data.byClass[className] = data.byClass[className] || []).push(rec);
    }
  });

  var json = JSON.stringify(data);
  if (json.length < 95000) cache.put('rows_v1', json, ROWS_CACHE_SECONDS); // cache size limit
  return data;
}

function headerIndexes_(row) {
  var col = {};
  row.forEach(function (cell, i) {
    var h = String(cell || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (h === 'email address' || h === 'email') col.email = i;
    else if (h === 'first name' || h === 'firstname') col.first = i;
    else if (h === 'last name' || h === 'lastname' || h === 'surname') col.last = i;
    else if (h === 'code' || h === 'login code' || h === 'student code') col.code = i;
  });
  return col;
}
