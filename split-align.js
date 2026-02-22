(() => {
  const logoImg = document.getElementById('yiowiLogo');
  if (!logoImg) return;

  const findBlueElement = (svg) => {
    const normalize = (s) => (s || '').toLowerCase().replace(/\s/g,'');
    const nodes = Array.from(svg.querySelectorAll('*'));

    const isBlue = (el) => {
      const fill = normalize(el.getAttribute('fill'));
      const style = normalize(el.getAttribute('style'));
      return fill === '#0000ff' || fill === 'blue' || fill === 'rgb(0,0,255)' ||
             style.includes('fill:#0000ff') || style.includes('fill:blue') || style.includes('fill:rgb(0,0,255)');
    };

    let blue = nodes.find(isBlue);
    if (blue) return blue;

    const circles = Array.from(svg.querySelectorAll('circle'));
    if (circles.length) {
      return circles.slice().sort((a,b) => (Number(b.getAttribute('r'))||0) - (Number(a.getAttribute('r'))||0))[0];
    }
    return null;
  };

  const setSplit = async () => {
    try {
      const rect = logoImg.getBoundingClientRect();
      if (!rect.width) return;

      const res = await fetch(logoImg.getAttribute('src'), { cache: 'force-cache' });
      const svgText = await res.text();
      if (!svgText.includes('<svg')) return;

      let holder = document.getElementById('splitSvgHolder');
      if (!holder) {
        holder = document.createElement('div');
        holder.id = 'splitSvgHolder';
        holder.style.position = 'absolute';
        holder.style.left = '-99999px';
        holder.style.top = '0';
        holder.style.width = '0';
        holder.style.height = '0';
        holder.style.overflow = 'hidden';
        holder.setAttribute('aria-hidden', 'true');
        document.body.appendChild(holder);
      }
      holder.innerHTML = svgText;

      const svg = holder.querySelector('svg');
      if (!svg) return;

      const vb = (svg.getAttribute('viewBox') || '').trim().split(/\s+/).map(Number);
      const vbW = vb.length === 4 ? vb[2] : null;
      if (!vbW) return;

      const blueEl = findBlueElement(svg);
      if (!blueEl || !blueEl.getBBox) return;

      const bb = blueEl.getBBox();
      const centerX = bb.x + bb.width / 2;

      const circleCenterX = rect.left + rect.width * (centerX / vbW);
      const splitPercent = (circleCenterX / window.innerWidth) * 100;

      document.documentElement.style.setProperty('--split-x', splitPercent.toFixed(4) + '%');
    } catch (e) {}
  };

  let t;
  const run = () => { clearTimeout(t); t = setTimeout(setSplit, 80); };

  if (logoImg.complete) run();
  else logoImg.addEventListener('load', run);

  window.addEventListener('resize', run, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(run).catch(() => {});
})();