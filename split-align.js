(() => {
  const logo = document.getElementById('yiowiLogo');
  if (!logo) return;

  const setSplit = (percent) => {
    if (!Number.isFinite(percent)) return;
    const p = Math.max(0, Math.min(100, percent));
    document.documentElement.style.setProperty('--split-x', p.toFixed(4) + '%');
  };

  const findBlueCenterX = async () => {
    // Load image as blob to avoid tainting canvas (same-origin).
    const src = logo.getAttribute('src');
    const res = await fetch(src, { cache: 'force-cache' });
    const blob = await res.blob();

    const img = new Image();
    img.decoding = 'async';
    img.src = URL.createObjectURL(blob);
    await img.decode().catch(() => new Promise((ok) => { img.onload = ok; img.onerror = ok; }));

    const w = Math.max(1, img.naturalWidth || img.width);
    const h = Math.max(1, img.naturalHeight || img.height);

    // Downscale for speed
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

    // Scan pixels; sample every 2px for speed
    let sumX = 0;
    let count = 0;

    // Target: bright blue dot. Tolerances handle anti-aliasing.
    const step = 2;
    for (let y = 0; y < ch; y += step) {
      const row = y * cw * 4;
      for (let x = 0; x < cw; x += step) {
        const i = row + x * 4;
        const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
        if (a < 120) continue;

        // blue-ish pixel: b high, r/g low
        if (b >= 160 && r <= 90 && g <= 90) {
          sumX += x;
          count++;
        }
      }
    }

    if (count < 50) return null; // not found reliably
    const avgX = sumX / count;

    // Map avgX (in image pixels) to viewport x using rendered logo rect
    const rect = logo.getBoundingClientRect();
    const centerXViewport = rect.left + rect.width * (avgX / cw);
    return (centerXViewport / window.innerWidth) * 100;
  };

  const run = async () => {
    try {
      const rect = logo.getBoundingClientRect();
      if (!rect.width) return;

      const percent = await findBlueCenterX();
      if (percent == null) return; // keep fallback 50%
      setSplit(percent);
    } catch (_) {}
  };

  let t;
  const debounce = () => {
    clearTimeout(t);
    t = setTimeout(run, 120);
  };

  if (logo.complete) debounce();
  else logo.addEventListener('load', debounce);

  window.addEventListener('resize', debounce, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(debounce).catch(() => {});
})();