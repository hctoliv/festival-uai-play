(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = matchMedia('(max-width: 760px)').matches;

  // ---------- loader ----------
  const loader = $('#loader');
  const fill = $('#loaderFill');
  let pct = 0;
  const tick = setInterval(() => { pct = Math.min(90, pct + 9 + Math.random() * 12); fill.style.width = pct + '%'; }, 120);
  const finishLoader = () => {
    clearInterval(tick);
    fill.style.width = '100%';
    setTimeout(() => { loader.classList.add('done'); playLogo(); }, 260);
  };
  window.addEventListener('load', finishLoader, { once: true });
  setTimeout(finishLoader, 3500);

  // ---------- hero videos ----------
  const hero = $('#heroVideo');
  hero.poster = mobile ? 'img/hero-poster-m.jpg' : 'img/hero-poster.jpg';
  hero.src = mobile ? 'media/hero-mobile.mp4' : 'media/hero.mp4';
  hero.play().catch(() => {});

  // Safari can't render VP9 alpha, so it gets the HEVC-with-alpha version
  const logoV = $('#logoVideo');
  const logoImg = $('#logoStatic');
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
  logoV.src = isSafari ? 'media/logo-hevc.mov' : 'media/logo.webm';
  const showStatic = () => { logoV.classList.add('is-hidden'); logoImg.classList.remove('is-hidden'); };
  logoV.addEventListener('error', showStatic);
  let logoPlayed = false;
  function playLogo() {
    if (logoPlayed) return;
    logoPlayed = true;
    if (reduced) return showStatic();
    logoV.play().catch(showStatic);
  }

  // ---------- countdown ----------
  const target = new Date('2027-01-18T08:00:00-03:00').getTime();
  const cd = { d: $('[data-cd="d"]'), h: $('[data-cd="h"]'), m: $('[data-cd="m"]'), s: $('[data-cd="s"]') };
  const pad = (n, l = 2) => String(n).padStart(l, '0');
  const updateCd = () => {
    let t = Math.max(0, target - Date.now()) / 1000;
    cd.d.textContent = pad(Math.floor(t / 86400), 2); t %= 86400;
    cd.h.textContent = pad(Math.floor(t / 3600)); t %= 3600;
    cd.m.textContent = pad(Math.floor(t / 60));
    cd.s.textContent = pad(Math.floor(t % 60));
  };
  updateCd(); setInterval(updateCd, 1000);

  // ---------- HUD / XP bar / phase ----------
  const hud = $('#hud');
  const xp = $('#xpFill');
  const phaseEl = $('#xpPhase');
  const onScroll = () => {
    const y = scrollY;
    hud.classList.toggle('scrolled', y > 60);
    const max = document.documentElement.scrollHeight - innerHeight;
    xp.style.width = (y / max * 100).toFixed(1) + '%';
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const phaseObs = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) phaseEl.textContent = 'FASE ' + e.target.dataset.phase; });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('[data-phase]').forEach(s => phaseObs.observe(s));

  // mobile menu
  const menuBtn = $('#menuBtn'), nav = $('#nav');
  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('a', nav).forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); document.body.style.overflow = '';
  }));

  // ---------- word-by-word reveal ----------
  $$('.reveal-words').forEach(p => {
    p.innerHTML = p.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
  });
  const words = $$('.reveal-words .w');
  const revealWords = () => {
    words.forEach(w => {
      const r = w.getBoundingClientRect();
      w.classList.toggle('on', r.top < innerHeight * 0.72);
    });
  };
  addEventListener('scroll', revealWords, { passive: true }); revealWords();

  // ---------- generic reveal ----------
  const revealTargets = [
    '.title', '.copy', '.versus-list li', '.compare', '.moeda-box', '.card', '.level', '.stats-3>div',
    '.mercado-art', '.mapa-stage', '.parc-card', '.mosaic figure', '.proofs>div', '.char', '.stat',
    '.player', '.solidaria', '.perk', '.derik', '.marcas', '.ct', '.expect', '.note'
  ];
  const revObs = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revObs.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  revealTargets.forEach(sel => $$(sel).forEach((el, i) => {
    if (el.closest('.hero') || el.closest('.jornada')) return;
    el.setAttribute('data-reveal', '');
    el.style.transitionDelay = (i % 4) * 80 + 'ms';
    revObs.observe(el);
  }));

  // ---------- counters ----------
  const fmt = (v, dec, sep) => {
    const s = dec ? v.toFixed(dec) : Math.round(v).toString();
    return sep ? Number(s).toLocaleString('pt-BR') : s;
  };
  const countObs = new IntersectionObserver(es => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target; countObs.unobserve(el);
      const to = parseFloat(el.dataset.to), dec = +el.dataset.dec || 0, sep = el.dataset.sep;
      if (reduced) { el.textContent = fmt(to, dec, sep); return; }
      const t0 = performance.now(), dur = 1600;
      const step = now => {
        const p = Math.min(1, (now - t0) / dur), ease = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(to * ease, dec, sep);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: .6 });
  $$('.count').forEach(c => countObs.observe(c));

  // meta solidária: fills to show the goal, a playful XP bar
  const meta = $('#metaFill');
  new IntersectionObserver((es, o) => {
    if (es[0].isIntersecting) { meta.style.width = '100%'; o.disconnect(); }
  }, { threshold: .5 }).observe(meta);

  // ---------- compare slider ----------
  const cmp = $('#compare'), range = $('#cmpRange');
  range.addEventListener('input', () => cmp.style.setProperty('--pos', range.value + '%'));

  // ---------- tilt cards / map / coin ----------
  if (!reduced && matchMedia('(hover: hover)').matches) {
    $$('.tilt').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        card.style.transform = `perspective(900px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateY(-6px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
    const mapa = $('#mapa'), mapImg = $('img', mapa);
    mapa.addEventListener('pointermove', e => {
      const r = mapa.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      mapImg.style.transform = `rotateX(${18 - y * 18}deg) rotateZ(${x * 8}deg) scale(1.04)`;
    });
    mapa.addEventListener('pointerleave', () => { mapImg.style.transform = ''; });

    // mouse parallax on brushes and art
    const par = $$('[data-depth]');
    addEventListener('pointermove', e => {
      const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
      par.forEach(el => { const d = +el.dataset.depth * 80; el.style.translate = `${x * d}px ${y * d}px`; });
    }, { passive: true });
  }

  // ---------- GSAP: horizontal journey + hero parallax ----------
  if (window.gsap && window.ScrollTrigger && !reduced) {
    gsap.registerPlugin(ScrollTrigger);

    gsap.to('.hero-content', { yPercent: 18, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-bg', { scale: 1.12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    const mm = gsap.matchMedia();
    mm.add('(min-width: 861px)', () => {
      const track = $('#jTrack');
      const path = $('#jPath');
      const len = path.getTotalLength();
      path.style.strokeDasharray = `${len}`;
      path.style.strokeDashoffset = `${len}`;
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      const tl = gsap.timeline({
        scrollTrigger: { trigger: '.jornada', start: 'top top', end: () => '+=' + dist() * 1.1, pin: '.jornada-pin', scrub: 1, invalidateOnRefresh: true }
      });
      tl.to(track, { x: () => -dist(), ease: 'none' }, 0)
        .to(path, { strokeDashoffset: 0, ease: 'none' }, 0)
        .to('.jornada-sky', { xPercent: -8, ease: 'none' }, 0);
      $$('.step').forEach(s => gsap.from(s, { opacity: 0, y: 60, scrollTrigger: { trigger: s, containerAnimation: tl, start: 'left 85%', toggleActions: 'play none none reverse' } }));
      return () => { path.style.strokeDasharray = ''; path.style.strokeDashoffset = ''; };
    });

    gsap.utils.toArray('.brush').forEach(b => gsap.from(b, { opacity: 0, x: b.classList.contains('b-tr') ? 120 : -120, duration: 1.2, scrollTrigger: { trigger: b.parentElement, start: 'top 80%' } }));
    gsap.from('.foot-sky', { yPercent: 30, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    addEventListener('load', () => ScrollTrigger.refresh());
  }

  // ---------- closing video only when visible ----------
  const endV = $('#endVideo');
  new IntersectionObserver(es => {
    es.forEach(e => {
      if (e.isIntersecting) {
        if (!endV.src) endV.src = mobile ? 'media/hero-mobile.mp4' : 'media/hero.mp4';
        if (!reduced) endV.play().catch(() => {});
      } else endV.pause();
    });
  }).observe(endV);
})();
