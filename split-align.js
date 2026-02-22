(() => {
  const logoImg = document.getElementById('yiowiLogo');
  if (!logoImg) return;

  const setSplitFromCircle = async () => {
    try {
      const rect = logoImg.getBoundingClientRect();
      if (!rect.width) return;

      const res = await fetch(logoImg.getAttribute('src'), { cache: 'force-cache' });
      const svgText = await res.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, 'image/svg+xml');
      const svg = doc.documentElement;

      const vb = (svg.getAttribute('viewBox') || '').trim().split(/\s+/).map(Number);
      const vbW = vb.length === 4 ? vb[2] : null;

      const circles = Array.from(svg.querySelectorAll('circle'));
      if (!circles.length || !vbW) return;

      const isBlue = (el) => {
        const fill = (el.getAttribute('fill') || '').toLowerCase().replace(/\s/g,'');
        return fill === '#0000ff' || fill === 'blue' || fill === 'rgb(0,0,255)';
      };

      let circle = circles.find(isBlue);
      if (!circle) {
        circle = circles.slice().sort((a,b) => (Number(b.getAttribute('r'))||0) - (Number(a.getAttribute('r'))||0))[0];
      }

      const cx = Number(circle.getAttribute('cx'));
      if (!Number.isFinite(cx)) return;

      const circleCenterX = rect.left + rect.width * (cx / vbW);
      const splitPercent = (circleCenterX / window.innerWidth) * 100;

      document.documentElement.style.setProperty('--split-x', splitPercent.toFixed(4) + '%');
    } catch (e) {
      // fallback remains 50%
    }
  };

  let t;
  const run = () => {
    clearTimeout(t);
    t = setTimeout(setSplitFromCircle, 80);
  };

  if (logoImg.complete) run();
  else logoImg.addEventListener('load', run);

  window.addEventListener('resize', run, { passive: true });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(run).catch(() => {});
  }
})();