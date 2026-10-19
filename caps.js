/* ============================================================
   CAPITAL LETTERS everywhere (Turning Point Trophy apps)
   - Everything you type is saved in CAPITAL letters.
   - Old data typed in small letters is SHOWN in capitals on the
     screen, in PDFs, pictures, videos and WhatsApp messages —
     the saved data itself is never deleted or rewritten.
   - Web links, e-mail addresses and photos are never changed.
   - Put data-nocaps on any box that must keep small letters.
   ============================================================ */
(function () {
  if (window.__capsOn) return; window.__capsOn = true;
  var KEEP = /(data:[^\s"']+|https?:\/\/[^\s"']+|www\.[^\s"']+|[\w.+-]+@[\w-]+\.[\w.-]+)/gi;
  function up(s) {
    if (typeof s !== 'string' || !s || s.length > 3000 || !/[a-z]/.test(s)) return s;
    return s.split(KEEP).map(function (p, i) { return i % 2 ? p : p.toUpperCase(); }).join('');
  }
  function upDeep(v) { return typeof v === 'string' ? up(v) : Array.isArray(v) ? v.map(upDeep) : v; }
  window.capsText = up;

  // ---- 1) look: show all text in capitals ----
  var css = 'body, input, textarea, select, button { text-transform: uppercase; }' +
    ' [data-nocaps], [data-nocaps] *, .note, .lead, .hint, input[type=password], input[type=email], input[type=url] { text-transform: none; }';
  var st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);

  // ---- 2) typing boxes: save the value in capitals ----
  function eligible(el) {
    if (!el || !el.tagName) return false;
    if (el.closest && el.closest('[data-nocaps]')) return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName !== 'INPUT') return false;
    var t = (el.getAttribute('type') || 'text').toLowerCase();
    return t === 'text' || t === 'search';
  }
  function hook(proto) {
    var d = Object.getOwnPropertyDescriptor(proto, 'value'); if (!d || !d.set) return;
    Object.defineProperty(proto, 'value', {
      configurable: true, enumerable: d.enumerable,
      get: function () { var v = d.get.call(this); return eligible(this) ? up(v) : v; },
      set: function (v) { d.set.call(this, eligible(this) && typeof v === 'string' ? up(v) : v); }
    });
    window.__capsRawValue = window.__capsRawValue || new Map(); window.__capsRawValue.set(proto, d);
  }
  hook(HTMLInputElement.prototype); hook(HTMLTextAreaElement.prototype);
  // write the capital letters into the box itself once typing is finished (never during typing — keeps the phone keyboard happy)
  function fix(e) {
    var el = e.target; if (!eligible(el)) return;
    var d = window.__capsRawValue.get(el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype);
    var raw = d.get.call(el), u = up(raw); if (raw === u) return;
    var a = el.selectionStart, b = el.selectionEnd; d.set.call(el, u);
    try { if (document.activeElement === el && a != null) el.setSelectionRange(a, b); } catch (x) {}
  }
  document.addEventListener('change', fix, true);
  document.addEventListener('focusout', fix, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter') fix(e); }, true);

  // ---- 3) pop-up questions (e.g. "Name for this catalogue") ----
  var _prompt = window.prompt;
  window.prompt = function () { var r = _prompt.apply(window, arguments); return typeof r === 'string' ? up(r) : r; };

  // ---- 4) pictures & videos drawn by the apps ----
  var C = CanvasRenderingContext2D.prototype;
  ['fillText', 'strokeText', 'measureText'].forEach(function (m) {
    var f = C[m]; C[m] = function (t) { var a = Array.prototype.slice.call(arguments); a[0] = up(String(t)); return f.apply(this, a); };
  });

  // ---- 5) WhatsApp / share text ----
  if (navigator.share) {
    var _share = navigator.share.bind(navigator);
    navigator.share = function (data) { if (data) { data = Object.assign({}, data); if (data.text) data.text = up(data.text); if (data.title) data.title = up(data.title); } return _share(data); };
  }

  // ---- 6) PDFs (jsPDF) and Excel exports ----
  function patchPdf() {
    var J = window.jspdf; if (!J || !J.jsPDF || J.jsPDF.__caps) return;
    var Orig = J.jsPDF;
    var Wrapped = function () {
      var doc = new (Function.prototype.bind.apply(Orig, [null].concat(Array.prototype.slice.call(arguments))))();
      ['text', 'splitTextToSize', 'getTextWidth', 'getStringUnitWidth', 'textWithLink'].forEach(function (m) {
        var f = doc[m]; if (typeof f === 'function') doc[m] = function (t) { var a = Array.prototype.slice.call(arguments); a[0] = upDeep(t); return f.apply(this, a); };
      });
      return doc;
    };
    Object.setPrototypeOf(Wrapped, Orig); Wrapped.prototype = Orig.prototype; Wrapped.API = Orig.API; Wrapped.__caps = true;
    try { J.jsPDF = Wrapped; } catch (e) {}
  }
  function patchXlsx() {
    var X = window.XLSX; if (!X || !X.utils || X.utils.__caps) return;
    var u = X.utils;
    ['json_to_sheet', 'aoa_to_sheet'].forEach(function (m) {
      var f = u[m]; if (typeof f !== 'function') return;
      u[m] = function (rows) {
        var a = Array.prototype.slice.call(arguments);
        a[0] = (rows || []).map(function (r) {
          if (Array.isArray(r)) return r.map(upDeep);
          if (r && typeof r === 'object') { var o = {}; Object.keys(r).forEach(function (k) { o[up(k)] = upDeep(r[k]); }); return o; }
          return r;
        });
        return f.apply(this, a);
      };
    });
    u.__caps = true;
  }
  patchPdf(); patchXlsx();
  document.addEventListener('DOMContentLoaded', function () { patchPdf(); patchXlsx(); });
})();
