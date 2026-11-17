// Dusk Station — site behaviour
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const handheld = matchMedia('(pointer: coarse)').matches && Math.min(innerWidth, innerHeight) < 600;

  /* ---------- nav ---------- */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-solid', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- the playable screen ---------- */
  const screen = $('#screen'), trailer = $('#trailer'), overlay = $('#playBtn'), tag = $('#screenTag'), help = $('#screenHelp');
  let frame = null;

  if (trailer) {
    if (reduceMotion) { trailer.removeAttribute('autoplay'); trailer.pause(); }
    else if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        if (!trailer.isConnected) return;
        if (e.isIntersecting) trailer.play().catch(() => {}); else trailer.pause();
      }, { threshold: 0.15 }).observe(trailer);
    }
  }

  function focusGame() {
    if (!frame) return;
    try {
      frame.focus();
      frame.contentWindow.focus();
      const canvas = frame.contentDocument && frame.contentDocument.getElementById('game');
      if (canvas) canvas.focus({ preventScroll: true });
    } catch (e) { /* cross-origin or not ready yet */ }
  }

  function startGame() {
    if (handheld) { location.href = 'play/'; return false; }
    if (frame) { focusGame(); return true; }
    frame = document.createElement('iframe');
    frame.src = 'play/';
    frame.title = 'Dusk Station, playable';
    frame.allow = 'fullscreen; autoplay';
    frame.setAttribute('allowfullscreen', '');
    frame.addEventListener('load', focusGame);
    screen.appendChild(frame);
    if (trailer) { trailer.pause(); trailer.remove(); }
    if (overlay) overlay.remove();
    tag.textContent = 'Live · click the game to focus';
    tag.classList.add('is-live');
    help.innerHTML = 'Press <kbd>Enter</kbd> to start. Click outside to pause, click the game to come back. <kbd>Esc</kbd> pause · <kbd>M</kbd> map';
    screen.addEventListener('pointerdown', () => setTimeout(focusGame, 0));
    return true;
  }

  overlay && overlay.addEventListener('click', startGame);

  $$('[data-play]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    $('#play').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    if (startGame()) setTimeout(focusGame, reduceMotion ? 0 : 600);
  }));

  $('#fsBtn').addEventListener('click', async () => {
    if (!startGame()) return;
    const req = screen.requestFullscreen || screen.webkitRequestFullscreen;
    if (!req) { open('play/', '_blank', 'noopener'); return; }
    try { await req.call(screen); } catch (e) { open('play/', '_blank', 'noopener'); }
    setTimeout(focusGame, 120);
  });
  document.addEventListener('fullscreenchange', () => setTimeout(focusGame, 120));

  /* ---------- gallery lightbox ---------- */
  const lb = $('#lightbox'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
  $$('.shot').forEach(b => b.addEventListener('click', () => {
    lbImg.src = b.dataset.full;
    lbImg.alt = b.querySelector('img').alt;
    lbCap.textContent = b.dataset.caption || '';
    if (lb.showModal) lb.showModal(); else open(b.dataset.full, '_blank');
  }));
  $('#lbClose').addEventListener('click', () => lb.close());
  lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });

  /* ---------- exploded render layers ---------- */
  const stack = $('#stack'), stackBtn = $('#stackBtn');
  stackBtn.addEventListener('click', () => {
    const on = stack.classList.toggle('is-assembled');
    stackBtn.textContent = on ? 'Pull the layers apart' : 'Assemble the frame';
  });
  const layers = $$('.layer', stack);
  $$('#layerList li').forEach(li => {
    const hot = on => { const l = layers.find(x => x.dataset.l === li.dataset.l); if (l) l.classList.toggle('is-hot', on); li.classList.toggle('is-hot', on); };
    li.tabIndex = 0;
    li.addEventListener('mouseenter', () => hot(true));
    li.addEventListener('mouseleave', () => hot(false));
    li.addEventListener('focus', () => hot(true));
    li.addEventListener('blur', () => hot(false));
  });

  /* ---------- reveal on scroll ---------- */
  const reveals = $$('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) reveals.forEach(el => el.classList.add('is-in'));
  else {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(el => io.observe(el));
  }
})();
