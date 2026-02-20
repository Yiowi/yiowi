document.addEventListener("DOMContentLoaded", () => {
  const v = document.querySelector("video.bgvideo");
  if (!v) return;

  const tryPlay = async () => {
    try { await v.play(); } catch { /* ignore */ }
  };

  tryPlay();
  document.addEventListener("click", tryPlay, { once: true });
});
