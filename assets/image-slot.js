/* ============================================================
   image-slot.js — lightweight <image-slot> custom element
   ------------------------------------------------------------
   Renders the image referenced by `src` (or `placeholder`) into
   the slot. Relative paths are resolved against the assets/ root,
   so placeholder="app_screens/user/home.png" loads
   assets/app_screens/user/home.png.

   Attributes:
     src / placeholder : image path (or a non-path label like "foto")
     fit               : object-fit value (default "cover")
     shape             : "rect" (default) or "circle"
     object-position   : optional, defaults to "center top" for rect
     alt               : alt text
     data-initials     : letter shown in the circle fallback

   When the referenced file is missing or the placeholder is not an
   image path, a tasteful fallback is rendered instead of a broken
   image (a user glyph for circles, a soft tinted panel for rects).
   ============================================================ */
(function () {
  function resolve(p) {
    if (!p) return null;
    if (/^(https?:|data:|\/)/.test(p)) return p;          // absolute or data URI
    if (p.indexOf('assets/') === 0) return p;             // already rooted
    return 'assets/' + p;                                 // root relative paths at assets/
  }
  function isImagePath(p) {
    return !!p && /\.(png|jpe?g|webp|gif|svg|avif)(\?.*)?$/i.test(p);
  }

  class ImageSlot extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;

      var raw = this.getAttribute('src') || this.getAttribute('placeholder');
      var src = resolve(raw);
      var fit = this.getAttribute('fit') || 'cover';
      var shape = this.getAttribute('shape') || 'rect';
      var pos = this.getAttribute('object-position') || (fit === 'cover' ? 'center top' : 'center');
      var self = this;

      if (isImagePath(src)) {
        var img = document.createElement('img');
        img.src = src;
        img.alt = this.getAttribute('alt') || '';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.style.cssText =
          'width:100%;height:100%;display:block;object-fit:' + fit + ';object-position:' + pos + ';';
        img.addEventListener('error', function () {
          img.remove();
          renderFallback();
        });
        this.appendChild(img);
      } else {
        renderFallback();
      }

      function renderFallback() {
        self.classList.add('image-slot--empty');
        var fb = document.createElement('div');
        fb.style.cssText =
          'width:100%;height:100%;display:grid;place-items:center;' +
          'color:var(--placeholder-color,#93a8cc);' +
          'background:linear-gradient(160deg,rgba(120,165,255,.14),rgba(47,109,255,.05));';
        if (shape === 'circle') {
          var initials = (self.getAttribute('data-initials') || '').trim();
          if (initials) {
            fb.textContent = initials.charAt(0).toUpperCase();
            fb.style.font = "700 22px/1 'Space Grotesk',system-ui,sans-serif";
            fb.style.color = '#cdd9f0';
          } else {
            fb.innerHTML =
              '<svg viewBox="0 0 24 24" width="55%" height="55%" fill="none" ' +
              'stroke="#9fc4ff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
              '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';
          }
        }
        self.appendChild(fb);
      }
    }
  }

  if (!customElements.get('image-slot')) {
    customElements.define('image-slot', ImageSlot);
  }
})();
