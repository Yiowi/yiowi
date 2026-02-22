(() => {
  const root = document.documentElement;
  const show = () => { root.style.visibility = 'visible'; };

  // Stop "Install app" behavior: unregister any existing service workers (if one was added before)
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

  const mountLogo = async () => {
    const mount = document.getElementById('logoMount');
    if (!mount) return null;

    const res = await fetch('/assets/logo.svg', { cache: 'force-cache' });
    const svgText = await res.text();

    mount.innerHTML = svgText;

    // Make sure we have an <svg>
    const svg = mount.querySelector('svg');
    if (!svg) return null;

    // Remove fixed width/height attributes so CSS controls sizing
    svg.removeAttribute('width');
    svg.removeAttribute('height');

    // Accessibility
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Yiowi — Hybrid Intelligence Studio');

    return svg;
  };

  const alignSplitToBlueDot = (svg) => {
    if (!svg) return;

    // Find the "blue dot" by fill. Pick the largest blue-filled element.
    const els = Array.from(svg.querySelectorAll('[fill]'));
    const blueCandidates = els.filter((el) => {
      const fill = (el.getAttribute('fill') || '').trim().toLowerCase();
      return fill === '#00f' || fill === '#0000ff' || fill === 'blue' || fill.includes('rgb(0') && fill.includes('255');
    });

    if (!blueCandidates.length) return;

    let best = blueCandidates[0];
    let bestArea = 0;

    for (const el of blueCandidates) {
      try {
        const r = el.getBoundingClientRect();
        const area = r.width * r.height;
        if (area > bestArea) {
          bestArea = area;
          best = el;
        }
      } catch (_) {}
    }

    const rect = best.getBoundingClientRect();
    if (!rect.width) return;

    const centerX = rect.left + rect.width / 2;
    const percent = (centerX / window.innerWidth) * 100;
    setSplit(percent);
  };

  const init = async () => {
    try{
      // 1) mount svg
      const svg = await mountLogo();

      // 2) wait a frame so layout is final
      await new Promise(requestAnimationFrame);

      // 3) align split
      alignSplitToBlueDot(svg);
    } catch (_) {
      // fallback to 50%
    } finally {
      show();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once:true });
  } else {
    init();
  }

  // Keep aligned on resize
  let t;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const mount = document.getElementById('logoMount');
      const svg = mount ? mount.querySelector('svg') : null;
      alignSplitToBlueDot(svg);
    }, 120);
  }, { passive:true });
})();