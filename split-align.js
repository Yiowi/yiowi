(() => {
  // Goal: set --split-x BEFORE showing the page (no visible jump)
  const show = () => { document.documentElement.style.visibility = 'visible'; };

  const logo = document.getElementById('yiowiLogo');

  const setSplit = (percent) => {
    if (!Number.isFinite(percent)) return;
    const p = Math.max(0, Math.min(100, percent));
    document.documentElement.style.setProperty('--split-x', p.toFixed(4) + '%');
  };

  const findBlueCenterX = async () => {
    const src = logo ? logo.getAttribute('src') : '/assets/logo.svg';
    const res = await fetch(src, { cache: 'force-cache' });
    const blob = await res.blob();

    const img = new Image();
    img.decoding = 'async';
    img.src = URL.createObjectURL(blob);
    await img.decode().catch(() => new Promise((ok) => { img.onload = ok; img.onerror = ok; }));

    const w = Math.max(1, img.naturalWidth || img.width);
    const h = Math.max(1, img.naturalHeight || img.height);

    const targetW = Math.min(800, w);
    const scale = targetW / w;
    const cw = Math.max(1, Math.round(w * scale));
    const ch = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, cw, ch);
    URL.revokeObjectURL(img.src);

    const data = ctx.getImageData(0, 0, cw, ch).data;

    let sumX = 0;
    let count = 0;

    // blue-ish pixel: b high, r/g low (tolerant to anti-aliasing)
    const step = 2;
    for (let y = 0; y < ch; y += step) {
      const row = y * cw * 4;
      for (let x = 0; x < cw; x += step) {
        const i = row + x * 4;
        const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
        if (a < 120) continue;
        if (b >= 160 && r <= 90 && g <= 90) {
          sumX += x;
          count++;
        }
      }
    }
    if (count < 40) return null;

    const avgX = sumX / count;

    // Need rendered logo rect to map to viewport.
    const rect = logo.getBoundingClientRect();
    const centerXViewport = rect.left + rect.width * (avgX / cw);
    return (centerXViewport / window.innerWidth) * 100;
  };

  const alignAndShow = async () => {
    try {
      // Wait 1 frame so layout is computed (still hidden)
      await new Promise(requestAnimationFrame);
      if (!logo || !logo.getBoundingClientRect().width) { show(); return; }

      // Ensure logo is loaded before measurement
      if (!logo.complete) {
        await new Promise((ok) => { logo.addEventListener('load', ok, { once:true }); logo.addEventListener('error', ok, { once:true }); });
      }

      const percent = await findBlueCenterX();
      if (percent != null) setSplit(percent);
    } catch (_) {
      // ignore
    } finally {
      show();
    }
  };

  // Run immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', alignAndShow, { once:true });
  } else {
    alignAndShow();
  }

  // Keep aligned on resize (no hide/show)
  let t;
  const onResize = () => {
    clearTimeout(t);
    t = setTimeout(async () => {
      try {
        if (!logo || !logo.getBoundingClientRect().width) return;
        const percent = await findBlueCenterX();
        if (percent != null) setSplit(percent);
      } catch(_) {}
    }, 150);
  };
  window.addEventListener('resize', onResize, { passive: true });
})();