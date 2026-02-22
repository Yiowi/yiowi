(() => {
  const root = document.documentElement;
  const show = () => { root.style.visibility = 'visible'; };

  // Ensure no leftover PWA behavior
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
    }
  } catch (_) {}

  const setSplit = (percent) => {
    if (!Number.isFinite(percent)) return;
    const p = Math.max(0, Math.min(100, percent));
    root.style.setProperty('--split-x', p.toFixed(4) + '%');
  };

  const waitFonts = async () => {
    // Wait for font layout so logo/story spacing doesn't change after we align the split
    try {
      if (document.fonts && document.fonts.ready) {
        // race with 700ms timeout so we never hang
        await Promise.race([
          document.fonts.ready,
          new Promise((ok) => setTimeout(ok, 700))
        ]);
      } else {
        await new Promise((ok) => setTimeout(ok, 120));
      }
    } catch (_) {}
  };

  const mountLogo = async () => {
    const mount = document.getElementById('logoMount');
    if (!mount) return null;

    const res = await fetch('/assets/logo.svg', { cache: 'force-cache' });
    const svgText = await res.text();
    mount.innerHTML = svgText;

    const svg = mount.querySelector('svg');
    if (!svg) return null;

    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Yiowi — Hybrid Intelligence Studio');
    return svg;
  };

  const pickBlueDot = (svg) => {
    if (!svg) return null;

    // Prefer circles first (most likely the dot)
    const circles = Array.from(svg.querySelectorAll('circle[fill]'));
    const isBlue = (fill) => {
      const f = (fill || '').trim().toLowerCase();
      return f === '#00f' || f === '#0000ff' || f === 'blue' || f === 'rgb(0,0,255)';
    };
    const blueCircles = circles.filter((c) => isBlue(c.getAttribute('fill')));
    if (blueCircles.length) return blueCircles.sort((a,b) => (b.r?.baseVal?.value||0) - (a.r?.baseVal?.value||0))[0];

    // Fallback: any element with blue fill, choose largest area
    const els = Array.from(svg.querySelectorAll('[fill]'));
    const blue = els.filter((el) => isBlue(el.getAttribute('fill')));
    if (!blue.length) return null;

    let best = blue[0], bestArea = 0;
    for (const el of blue) {
      try {
        const r = el.getBoundingClientRect();
        const area = r.width * r.height;
        if (area > bestArea) { bestArea = area; best = el; }
      } catch (_) {}
    }
    return best;
  };

  const alignSplitToDot = (svg) => {
    const dot = pickBlueDot(svg);
    if (!dot) return;

    const r = dot.getBoundingClientRect();
    if (!r.width) return;

    const centerX = r.left + r.width / 2;
    setSplit((centerX / window.innerWidth) * 100);
  };

  const init = async () => {
    try {
      await waitFonts();
      const svg = await mountLogo();

      // Wait two frames so flex layout is stable
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);

      alignSplitToDot(svg);
    } catch (_) {
      // keep default
    } finally {
      show();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once:true });
  } else {
    init();
  }

  let t;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const mount = document.getElementById('logoMount');
      const svg = mount ? mount.querySelector('svg') : null;
      alignSplitToDot(svg);
    }, 120);
  }, { passive:true });
})();