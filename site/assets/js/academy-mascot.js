/* Dr. Aus is decorative. The dossier owns the selected bank; video events own
   playback. No change to navigation, carousel cadence or mobile markup. */
(() => {
  'use strict';
  const root = document.querySelector('[data-dossier]');
  if (!root) return;
  const desktop = matchMedia('(min-width:1200px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const lifetime = new AbortController();
  let layer, still, session, observer, artboardObserver, videos, active, pending, frameTicket, switching = false;
  let visible = false, suspended = false, changes = 0, revision = 0;
  let metadata, loading = false, returnTime = null, preparedReturn = null, cancelPreparation;
  const urls = {
    idle: ['/assets/academy/dossier/mascot/idle.webm', '/assets/academy/dossier/mascot/idle-2x.webm', '/assets/academy/dossier/mascot/idle-3x.webm'],
    look: ['/assets/academy/dossier/mascot/look.webm', '/assets/academy/dossier/mascot/look-2x.webm', '/assets/academy/dossier/mascot/look-3x.webm'],
    surprise: ['/assets/academy/dossier/mascot/surprise.webm', '/assets/academy/dossier/mascot/surprise-2x.webm', '/assets/academy/dossier/mascot/surprise-3x.webm'],
  };
  const running = () => layer && visible && !document.hidden && !suspended && !reduced.matches;
  function cancelFrame() {
    if (!frameTicket) return;
    frameTicket.video.cancelVideoFrameCallback(frameTicket.id);
    frameTicket.resolve();
    frameTicket = null;
  }
  function pause() {
    revision++;
    cancelPreparation?.();
    preparedReturn = null;
    returnTime = null;
    cancelFrame();
    switching = false;
    pending = null;
    videos?.forEach(video => { video.pause(); video.hidden = true; });
    active = null;
    if (layer) { still.hidden = false; layer.dataset.state = 'still'; }
  }
  function prepareReturn(role) {
    cancelPreparation?.();
    const idle = videos.get('idle');
    returnTime = metadata.clips[role].transition.idleEntryTime;
    // Seek while the reaction is visible. Keep the idle paused at its baked
    // continuation point, rather than letting its clock drift behind the scene.
    preparedReturn = new Promise(resolve => {
      let timer, callback, paint, settled = false;
      const finish = (ready = false) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (paint !== undefined) cancelAnimationFrame(paint);
        if (callback !== undefined) idle.cancelVideoFrameCallback(callback);
        idle.removeEventListener('seeked', seeked);
        idle.removeEventListener('error', failed);
        cancelPreparation = null;
        resolve(ready === true);
      };
      const failed = () => finish(false);
      const target = returnTime;
      const seeked = () => {
        // Firefox may defer rVFC on a paused, transparent video. HAVE_CURRENT_DATA
        // after seeked also guarantees a decoded frame at the requested position.
        paint = requestAnimationFrame(() => finish(idle.readyState >= 2 &&
          !idle.seeking && Math.abs(idle.currentTime-target) <= 1/48));
      };
      cancelPreparation = failed;
      idle.addEventListener('seeked', seeked, {once: true});
      idle.addEventListener('error', failed, {once: true});
      timer = setTimeout(failed, 2500);
      if ('requestVideoFrameCallback' in idle) {
        const presented = (_, frame) => {
          // A frame already submitted before pause/seek can arrive first.
          // Keep waiting for the target instead of rejecting a healthy decoder.
          if (Math.abs(frame.mediaTime-target) <= 1/24) finish(true);
          else callback = idle.requestVideoFrameCallback(presented);
        };
        callback = idle.requestVideoFrameCallback(presented);
      }
      try { idle.currentTime = target; } catch { failed(); }
    });
  }
  async function show(role) {
    const next = videos?.get(role);
    if (!next || !running()) return;
    if (active === role && !switching) return;
    switching = true;
    const token = ++revision;
    try {
      // Leave the current frame visible until the incoming decoder presents one.
      if (role !== 'idle') next.currentTime = 0;
      const entry = role === 'idle' ? returnTime : null;
      if (entry !== null) {
        const ready = await preparedReturn;
        if (token !== revision || !running()) return;
        if (!ready) throw new Error('Prepared idle unavailable');
      }
      await next.play();
      if (token !== revision || !running()) return;
      if (entry === null && 'requestVideoFrameCallback' in next) {
        await new Promise((resolve, reject) => {
          let timer, id;
          const finish = () => {
            clearTimeout(timer);
            next.removeEventListener('error', failed);
            frameTicket = null;
            resolve();
          };
          const failed = () => {
            clearTimeout(timer);
            next.cancelVideoFrameCallback(id);
            next.removeEventListener('error', failed);
            frameTicket = null;
            reject(new Error('Incoming mascot frame unavailable'));
          };
          id = next.requestVideoFrameCallback(finish);
          frameTicket = {video: next, id, resolve: finish};
          next.addEventListener('error', failed, {once: true});
          timer = setTimeout(failed, 2500);
          if (next.error) failed();
        });
      }
      if (token !== revision || !running()) return;
      videos.forEach((video, name) => {
        video.hidden = name !== role;
        if (name !== role) video.pause();
      });
      still.hidden = true;
      active = role;
      layer.dataset.state = role;
      if (role !== 'idle') prepareReturn(role);
      else {
        layer.dataset.returnTime = entry === null ? '' : String(entry);
        returnTime = null;
        preparedReturn = null;
      }
    } catch {
      // Unsupported codec, network failure or denied autoplay keeps the still/
      // currently playing idle. Never replace a working frame with an empty one.
      if (token === revision) {
        next.pause();
        if (active && active !== 'idle') pause();
      }
    } finally {
      if (token === revision) {
        switching = false;
        if (active === 'idle' && pending) { const role = pending; pending = null; show(role); }
      }
    }
  }
  async function sync() {
    if (!running()) { pause(); return; }
    if (!metadata) {
      if (loading) return;
      loading = true;
      const signal = session.signal;
      try {
        const response = await fetch('/assets/academy/dossier/mascot/manifest.json', {signal});
        if (!response.ok) throw new Error('Mascot metadata unavailable');
        const data = await response.json();
        for (const role of ['look', 'surprise']) {
          const time = data.clips?.[role]?.transition?.idleEntryTime;
          if (!Number.isFinite(time) || time < 0 || time >= 4) throw new Error('Invalid mascot entry');
        }
        metadata = data;
      } catch {
        // A fast desktop -> mobile -> desktop remount can outlive the old fetch.
        if (signal.aborted) queueMicrotask(() => { if (running()) sync(); });
        return;
      }
      finally { loading = false; }
      if (signal.aborted || !running()) { if (running()) sync(); return; }
    }
    if (!videos) {
      videos = new Map();
      // Select at mount from actual painted size × real DPR. Download only one
      // tier; excessive video downsampling is visibly jagged in Chrome DPR 1.
      const pixels = layer.getBoundingClientRect().width * (window.devicePixelRatio || 1);
      const tier = pixels <= 180 ? 0 : pixels <= 360 ? 1 : 2;
      Object.entries(urls).forEach(([role, variants]) => {
        const video = document.createElement('video');
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.loop = role === 'idle';
        video.autoplay = role === 'idle';
        video.preload = 'auto';
        video.disablePictureInPicture = true;
        video.setAttribute('aria-hidden', 'true');
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.tabIndex = -1;
        video.hidden = true;
        video.dataset.role = role;
        video.addEventListener('ended', () => {
          if (active !== role || !running()) return;
          show('idle');
        }, {signal: session.signal});
        video.addEventListener('error', () => {
          if (active === role) { pause(); if (role !== 'idle') show('idle'); }
        }, {signal: session.signal});
        video.src = variants[tier];
        videos.set(role, video);
        layer.append(video);
      });
    }
    if (!switching && !active) show('idle');
  }
  function unmount() {
    if (!layer) return;
    pause();
    observer?.disconnect();
    artboardObserver?.disconnect();
    root.style.removeProperty('--dossier-art-scale');
    session.abort();
    videos?.forEach(video => { video.removeAttribute('src'); video.load(); });
    videos = null;
    layer.remove();
    layer = null;
  }
  function mount() {
    if (!desktop.matches) { unmount(); return; }
    if (layer) return;
    session = new AbortController();
    if (!CSS.supports('transform', 'scale(calc(100cqw / 1586px))')) {
      const scale = () => root.style.setProperty('--dossier-art-scale', String(root.clientWidth / 1586));
      scale();
      artboardObserver = new ResizeObserver(scale);
      artboardObserver.observe(root);
    }
    layer = document.createElement('div');
    layer.className = 'dossier-mascot';
    layer.setAttribute('data-dossier-mascot', '');
    layer.dataset.changes = String(changes);
    layer.dataset.state = 'still';
    layer.setAttribute('aria-hidden', 'true');
    layer.inert = true;
    still = document.createElement('img');
    still.src = '/assets/academy/dossier/mascot/still.png';
    still.alt = '';
    still.width = 540;
    still.height = 960;
    still.draggable = false;
    layer.append(still);
    root.append(layer);
    const rect = root.getBoundingClientRect();
    visible = rect.bottom > 0 && rect.top < innerHeight;
    observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      sync();
    });
    observer.observe(root);
    sync();
  }
  root.addEventListener('dossier:bankchange', () => {
    if (!desktop.matches || !layer) return;
    changes++;
    layer.dataset.changes = String(changes);
    if (!running()) return;
    const role = changes % 2 === 0 ? 'surprise' : 'look';
    // Rapid input never restarts a reaction or builds an unbounded stale queue.
    // A pending surprise has priority over a later, less expressive glance.
    if (!active && !switching) { sync(); return; }
    if (switching || active !== 'idle') {
      if (role === 'surprise' || !pending) pending = role;
    } else show(role);
  }, {signal: lifetime.signal});
  desktop.addEventListener('change', mount, {signal: lifetime.signal});
  reduced.addEventListener('change', sync, {signal: lifetime.signal});
  document.addEventListener('visibilitychange', sync, {signal: lifetime.signal});
  window.addEventListener('pagehide', event => {
    suspended = true;
    pause();
    if (!event.persisted) { unmount(); lifetime.abort(); }
  }, {signal: lifetime.signal});
  window.addEventListener('pageshow', () => { suspended = false; sync(); }, {signal: lifetime.signal});
  mount();
})();
