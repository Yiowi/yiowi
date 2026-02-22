(() => {
  const show = () => { document.documentElement.style.visibility = 'visible'; };
  const root = document.documentElement;

  const setSplit = (percent) => {
    if (!Number.isFinite(percent)) return;
    const p = Math.max(0, Math.min(100, percent));
    root.style.setProperty('--split-x', p.toFixed(4) + '%');
  };

  const rgbToHsv = (r,g,b) => {
    r/=255; g/=255; b/=255;
    const max=Math.max(r,g,b), min=Math.min(r,g,b);
    const d=max-min;
    let h=0;
    if (d !== 0){
      switch(max){
        case r: h=((g-b)/d + (g<b?6:0)); break;
        case g: h=((b-r)/d + 2); break;
        case b: h=((r-g)/d + 4); break;
      }
      h *= 60;
    }
    const s = max === 0 ? 0 : d/max;
    const v = max;
    return [h,s,v];
  };

  const computeBlueCenterPercent = async (logo) => {
    const src = logo.getAttribute('src');
    const res = await fetch(src, { cache: 'force-cache' });
    const blob = await res.blob();

    const img = new Image();
    img.decoding = 'async';
    img.src = URL.createObjectURL(blob);
    await img.decode().catch(() => new Promise((ok)=>{ img.onload=ok; img.onerror=ok; }));

    const w = Math.max(1, img.naturalWidth || img.width);
    const targetW = Math.min(900, w);
    const scale = targetW / w;
    const cw = Math.max(1, Math.round(w * scale));
    const ch = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));

    const canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, cw, ch);
    URL.revokeObjectURL(img.src);

    const data = ctx.getImageData(0,0,cw,ch).data;

    let sumX = 0, sumW = 0;
    const step = 2;
    for (let y=0; y<ch; y+=step){
      const row = y*cw*4;
      for (let x=0; x<cw; x+=step){
        const i = row + x*4;
        const r=data[i], g=data[i+1], b=data[i+2], a=data[i+3];
        if (a < 60) continue;
        const [h,s,v] = rgbToHsv(r,g,b);
        if (h >= 205 && h <= 255 && s >= 0.30 && v >= 0.22){
          const weight = (a/255) * s * v;
          sumX += x * weight;
          sumW += weight;
        }
      }
    }
    if (sumW < 5) return null;

    const avgX = sumX / sumW;

    const rect = logo.getBoundingClientRect();
    const centerXViewport = rect.left + rect.width * (avgX / cw);
    return (centerXViewport / window.innerWidth) * 100;
  };

  const init = async () => {
    try{
      await new Promise(requestAnimationFrame);
      const logo = document.getElementById('yiowiLogo');
      if (!logo) return;
      if (!logo.complete) {
        await new Promise((ok)=>{ logo.addEventListener('load', ok, {once:true}); logo.addEventListener('error', ok, {once:true}); });
      }
      const p = await computeBlueCenterPercent(logo);
      if (p != null) setSplit(p);
    } finally {
      show();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once:true });
  } else init();

  // keep aligned on resize
  let t;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(init, 180);
  }, { passive:true });
})();