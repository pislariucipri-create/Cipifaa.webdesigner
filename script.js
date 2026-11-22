(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  root.classList.add('js');

  /* intro gate: nothing moves until fonts are ready (max 800 ms) */
  function g() {
    if (root.classList.contains('rdy')) return;
    root.classList.add('rdy');
    document.dispatchEvent(new Event('cipgo'));
  }
  var f = document.fonts;
  try {
    if (f && f.load) Promise.all([f.load('400 16px Inter'), f.load('600 16px Inter'), f.load('700 16px Inter')]).then(g, g);
    else g();
  } catch (e) { g(); }
  setTimeout(g, 800);

  /* reveal on scroll */
  var rv = $$('.rv,.stg');
  $$('.stg').forEach(function (c) {
    Array.prototype.forEach.call(c.children, function (k, i) { k.style.setProperty('--i', i) });
  });
  function startReveal() {
    if (!hasIO) {
      rv.forEach(function (el) { el.classList.add('in') });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: .18, rootMargin: '0px 0px -12% 0px' });
    rv.forEach(function (el) { io.observe(el) });
  }
  if (root.classList.contains('rdy')) startReveal(); else document.addEventListener('cipgo', startReveal, { once: true });

  /* nav state: blur bar and small title */
  var nav = $('#nav');
  if (hasIO) {
    new IntersectionObserver(function (es) {
      nav.classList.toggle('scrolled', !es[0].isIntersecting);
    }).observe($('#sentinel'));
    new IntersectionObserver(function (es) {
      var e = es[0];
      nav.classList.toggle('titled', !e.isIntersecting && e.boundingClientRect.top < 0);
    }, { rootMargin: '-60px 0px 0px 0px' }).observe($('#ht'));

    /* tab bar follows the section in view */
    var links = {};
    $$('#dock a').forEach(function (a) { links[a.getAttribute('data-s')] = a });
    var cur = 'top';
    var mv, lock = false, lockT, goo = $("#gooLayer"), bl = $$('i', goo), dockEl = $('#dock');
    function place(anim) {
      var l = links[cur];
      if (!l) return;
      var x = l.offsetLeft - dockEl.clientLeft - 6, w = l.offsetWidth;
      bl.forEach(function (b) { b.style.width = w + 'px'; });
      if (!anim) goo.classList.add('no-anim');
      bl.forEach(function (b) { b.style.transform = 'translate3d(' + x + 'px,0,0)'; });
      if (!anim) { void goo.offsetWidth; goo.classList.remove('no-anim'); }
    }
    function setActive(id) {
      if (!links[id] || id === cur && links[id].classList.contains('active')) return;
      if (links[cur]) links[cur].classList.remove('active');
      cur = id;
      links[cur].classList.add('active');
      place(true);
      goo.classList.add('move');
      clearTimeout(mv);
      mv = setTimeout(function () { goo.classList.remove('move'); }, 180);
    }
    links.top.classList.add('active');
    place(false);
    addEventListener('resize', function () { place(false); });
    addEventListener('scroll', function () {
      if (lock) { clearTimeout(lockT); lockT = setTimeout(function () { lock = false; }, 160); }
    }, { passive: true });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { place(false); });
    }
    $$('#dock a').forEach(function (a) {
      a.addEventListener('click', function () {
        lock = true;
        setActive(a.getAttribute('data-s'));
        clearTimeout(lockT);
        lockT = setTimeout(function () { lock = false; }, 1100);
      });
    });
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && e.target.id !== cur && !lock) {
          setActive(e.target.id);
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    ['top', 'work', 'process', 'about', 'contact'].forEach(function (id) {
      var s = document.getElementById(id);
      if (s) so.observe(s);
    });
  }

  /* clock */
  var tF, dF;
  try {
    tF = new Intl.DateTimeFormat('ro-RO', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Bucharest' });
    dF = new Intl.DateTimeFormat('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Bucharest' });
  } catch (e) { }
  var navClock = $('#navClock'), wTime = $('#wTime'), wDate = $('#wDate'), phTime = $('#phTime'), lkTime = $('#lkTime'), lkDate = $('#lkDate'), lastT = '';
  function clock() {
    if (!tF) return;
    var d = new Date(), t = tF.format(d);
    if (t === lastT) return;
    lastT = t;
    navClock.textContent = t;
    wTime.textContent = t;
    wDate.textContent = dF.format(d);
    if (phTime) phTime.textContent = t;
    if (lkTime) { lkTime.textContent = t; lkDate.textContent = dF.format(d); }
  }
  clock();
  setInterval(clock, 5000);

  var calW = $('#calW'), calD = $('#calD'), hH = $('#hH'), hM = $('#hM'), hS = $('#hS'), pF, wF, dnF;
  try {
    pF = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23', timeZone: 'Europe/Bucharest' });
    wF = new Intl.DateTimeFormat('ro-RO', { weekday: 'short', timeZone: 'Europe/Bucharest' });
    dnF = new Intl.DateTimeFormat('en-GB', { day: 'numeric', timeZone: 'Europe/Bucharest' });
  } catch (e) { }
  function tick() {
    if (!pF) return;
    var d = new Date(), h = 0, m = 0, sc = 0;
    pF.formatToParts(d).forEach(function (x) {
      if (x.type === 'hour') h = +x.value;
      if (x.type === 'minute') m = +x.value;
      if (x.type === 'second') sc = +x.value;
    });
    if (hS) hS.setAttribute('transform', 'rotate(' + sc * 6 + ' 50 50)');
    if (hM) hM.setAttribute('transform', 'rotate(' + (m * 6 + sc * .1) + ' 50 50)');
    if (hH) hH.setAttribute('transform', 'rotate(' + ((h % 12) * 30 + m * .5) + ' 50 50)');
    if (calW) calW.textContent = wF.format(d).replace('.', '').toUpperCase();
    if (calD) calD.textContent = dnF.format(d);
  }
  tick();
  setInterval(function () { if (!document.hidden) tick(); }, 1000);

  /* rotating role line */
  var roles = ['se simt vii', 'se văd bine lucrate', 'rămân în minte', 'merită o atingere', 'se mișcă fin'], ri = 0, sw = $('#sw');
  if (!reduce) setInterval(function () {
    if (document.hidden) return;
    sw.classList.add('out');
    setTimeout(function () {
      ri = (ri + 1) % roles.length;
      sw.textContent = roles[ri];
      sw.classList.remove('out');
    }, 360);
  }, 3200);

  /* count-up */
  function runCount(el) {
    var target = +el.getAttribute('data-count'), t0 = performance.now(), D = 1600;
    if (reduce || target === 0) { el.textContent = target; return; }
    el.textContent = '0';
    (function s(now) {
      var p = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(e * target);
      if (p < 1) requestAnimationFrame(s);
    })(t0);
  }
  var counters = $$('[data-count]');
  if (hasIO) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          runCount(e.target);
          co.unobserve(e.target);
        }
      });
    }, { threshold: .7 });
    counters.forEach(function (c) { co.observe(c); });
  }

  /* toast */
  var toast = $('#toast'), toastTxt = $('#toastTxt'), tt;
  function say(msg) {
    toastTxt.textContent = msg;
    toast.classList.add('show');
    clearTimeout(tt);
    tt = setTimeout(function () { toast.classList.remove('show'); }, 2400);
  }
  $('#copyBtn').addEventListener('click', function () {
    var txt = $('#mail').textContent;
    var ok = function () { say('Email copiat'); };
    var fail = function () {
      var r = document.createRange();
      r.selectNodeContents($('#mail'));
      var s = getSelection();
      s.removeAllRanges();
      s.addRange(r);
      say('Selectat, apasă Ctrl+C');
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, fail);
      else fail();
    } catch (e) { fail(); }
  });

  /* project sheets */
  var mocks = {
    m1: '<div class="mk mk1"><i class="b b1"></i><i class="b b2"></i><i class="b b3"></i><span>Nordlicht</span></div>',
    m2: '<div class="mk mk2"><b></b><b></b><b></b><b></b><b></b><b></b></div>',
    m3: '<div class="mk mk3"><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b></div>',
    m4: '<div class="mk mk4"><svg viewBox="0 0 200 200" aria-hidden="true"><g class="g1"><circle cx="100" cy="100" r="88"/><circle cx="100" cy="100" r="70"/><circle cx="100" cy="100" r="52"/></g><g class="g2"><rect x="46" y="46" width="108" height="108"/><rect x="46" y="46" width="108" height="108" transform="rotate(45 100 100)"/></g><circle cx="100" cy="100" r="6" fill="#0B1030" stroke="none"/></svg></div>'
  };
  var projects = {
    nordlicht: { name: 'Nordlicht Café', year: '2026', tags: ['Web design', 'Motion'], mock: 'm1', desc: 'Site pentru o cafenea de cartier, cu meniu animat și rezervări. Accentul cade pe lumină, culoare și o mișcare lentă, care se simte ca aburul de deasupra ceștii.' },
    atlas: { name: 'Atlas Fitness', year: '2025', tags: ['UI / UX', 'Prototip'], mock: 'm2', desc: 'Prototip de aplicație pentru antrenamente, cu grafice de progres și tranziții între ecrane. Fiecare gest are un răspuns vizibil, fără întârzieri.' },
    fiera: { name: 'Fieră Market', year: '2025', tags: ['E-commerce', 'Design system'], mock: 'm3', desc: 'Magazin online construit pe un design system complet: componente, stări și reguli de folosire, ca echipa să poată adăuga pagini noi fără să strice nimic.' },
    lumen: { name: 'Lumen Studio', year: '2024', tags: ['Identitate', 'Site'], mock: 'm4', desc: 'Identitate vizuală și site pentru un studio de lumină și fotografie. Forme geometrice simple, care se rotesc și se suprapun ca niște lentile.' }
  };

  $$('.pv[data-mock]').forEach(function (el) { el.innerHTML = mocks[el.getAttribute('data-mock')] });

  var wrap = $('#sheetWrap'), sheet = $('#sheet'), scrim = $('.scrim', wrap), grab = $('#grab'), opener = null;
  var bgEls = [$('main'), $('#nav'), $('#dock')];
  function setBg(off) {
    bgEls.forEach(function (el) {
      if (!el) return;
      if (off) el.setAttribute('inert', '');
      else el.removeAttribute('inert');
    });
  }

  var SPR = {
    open: { z: 1, r: .44 },
    flick: { z: .8, r: .34 },
    close: { z: 1, r: .38 }
  };
  if (reduce) root.classList.add('rm');

  var H = 600, Y = H, V = 0, raf = 0, last = 0, target = H, cfg = SPR.open, isOpen = false, settleT;
  var RATE = .998;
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function rubber(d) {
    var D = Math.min(320, H);
    return (1 - 1 / (d * .55 / D + 1)) * D;
  }

  function paint() {
    var p = clamp(1 - Y / H, 0, 1);
    scrim.style.opacity = p;
    if (reduce) {
      sheet.style.transform = 'none';
      sheet.style.opacity = p > .5 ? 1 : 0;
      return;
    }
    var sc = .94 + .06 * p;
    sheet.style.transform = 'translate3d(0,' + Y.toFixed(2) + 'px,0) scale(' + sc.toFixed(4) + ')';
    sheet.style.opacity = clamp(p * 3, 0, 1);
  }
  function step(t) {
    var dt = clamp((t - last) / 1000, 0, .032);
    last = t;
    var w = 2 * Math.PI / cfg.r, k = w * w, c = 2 * cfg.z * w;
    var n = Math.max(1, Math.ceil(dt / .004)), h = dt / n;
    for (var i = 0; i < n; i++) {
      V += (-k * (Y - target) - c * V) * h;
      Y += V * h;
    }
    if (Math.abs(Y - target) < .35 && Math.abs(V) < 10) {
      Y = target;
      V = 0;
      raf = 0;
      paint();
      settle();
      return;
    }
    paint();
    raf = requestAnimationFrame(step);
  }
  function go(to, conf, vel) {
    target = to;
    cfg = conf;
    if (vel != null) V = vel;
    if (reduce) {
      Y = to;
      V = 0;
      paint();
      clearTimeout(settleT);
      settleT = setTimeout(settle, 220);
      return;
    }
    last = performance.now();
    if (!raf) raf = requestAnimationFrame(step);
  }
  function stop() {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    clearTimeout(settleT);
  }
  function settle() {
    if (!isOpen && target === H) {
      wrap.classList.remove('open');
      wrap.setAttribute('inert', '');
      $('#shPrev').innerHTML = '';
    }
  }

  function openSheet(id, btn) {
    var p = projects[id];
    if (!p) return;
    opener = btn;
    $('#shTitle').textContent = p.name;
    $('#shPrev').innerHTML = mocks[p.mock];
    $('#shTags').innerHTML = p.tags.map(function (t) { return '<span>' + t + '</span>'; }).join('') + '<span class="yr">' + p.year + '</span>';
    $('#shDesc').textContent = p.desc;
    sheet.scrollTop = 0;
    var wasHidden = !wrap.classList.contains('open');
    wrap.removeAttribute('inert');
    setBg(true);
    root.classList.add('lock');
    H = sheet.offsetHeight + 90;
    var r = btn.getBoundingClientRect(), w = sheet.offsetWidth, hh = sheet.offsetHeight;
    var left = (innerWidth - w) / 2, top = innerHeight - hh - 10;
    sheet.style.transformOrigin = clamp(r.left + r.width / 2 - left, 0, w) + 'px ' + clamp(r.top + r.height / 2 - top, -200, hh) + 'px';
    if (wasHidden) {
      stop();
      Y = H;
      V = 0;
      paint();
      void wrap.offsetWidth;
    }
    wrap.classList.add('open');
    isOpen = true;
    go(0, SPR.open);
    setTimeout(function () { var d = $('.done', wrap); if (d && isOpen) d.focus({ preventScroll: true }); }, 120);
  }
  function closeSheet(vel) {
    if (!isOpen) return;
    isOpen = false;
    root.classList.remove('lock');
    setBg(false);
    go(H, SPR.close, typeof vel === 'number' ? vel : null);
    if (opener) opener.focus({ preventScroll: true });
  }
  $$('[data-p]').forEach(function (b) {
    b.addEventListener('click', function () { openSheet(b.getAttribute('data-p'), b); });
  });
  $$('[data-close]', wrap).forEach(function (b) {
    b.addEventListener('click', function () { closeSheet(); });
  });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });

  /* ---------- drag ---------- */
  var ds = null;
  function begin(e) {
    stop();
    V = 0;
    ds.active = true;
    ds.off = Y - e.clientY;
    ds.s = [{ t: e.timeStamp, y: Y }];
    sheet.classList.add('dragging');
    try { sheet.setPointerCapture(ds.id); } catch (x) { }
  }
  sheet.addEventListener('pointerdown', function (e) {
    if (!isOpen || e.button > 0 || e.target.closest('button')) return;
    var onGrab = !!e.target.closest('#grab'), onPrev = !!e.target.closest('.preview');
    if (!onGrab && !onPrev) return;
    ds = { id: e.pointerId, x0: e.clientX, y0: e.clientY, active: false, off: 0, s: [] };
    if (onGrab) begin(e);
  });
  sheet.addEventListener('pointermove', function (e) {
    if (!ds || e.pointerId !== ds.id) return;
    if (!ds.active) {
      var dx = e.clientX - ds.x0, dy = e.clientY - ds.y0;
      if (Math.hypot(dx, dy) < 10) return;
      if (Math.abs(dy) > Math.abs(dx)) begin(e); else ds = null;
      return;
    }
    var raw = e.clientY + ds.off;
    Y = raw < 0 ? -rubber(-raw) : raw;
    ds.s.push({ t: e.timeStamp, y: Y });
    while (ds.s.length > 2 && e.timeStamp - ds.s[0].t > 100) ds.s.shift();
    paint();
    if (e.cancelable) e.preventDefault();
  });
  function endDrag(e) {
    if (!ds || e.pointerId !== ds.id) return;
    var d = ds;
    ds = null;
    if (!d.active) return;
    sheet.classList.remove('dragging');
    var a = d.s[0], b = d.s[d.s.length - 1], dt = Math.max(1, b.t - a.t);
    var v = e.type === 'pointercancel' ? 0 : (b.y - a.y) / dt * 1000;
    var proj = Y + v / 1000 * (RATE / (1 - RATE));
    if (proj > H * .38) {
      V = v;
      closeSheet(v);
    } else {
      V = v;
      go(0, Math.abs(v) > 350 ? SPR.flick : SPR.open, v);
    }
  }
  sheet.addEventListener('pointerup', endDrag);
  sheet.addEventListener('pointercancel', endDrag);

  /* ---------- phone: lock screen, swipe up to unlock ---------- */
  (function () {
    var scr = $('.screen'), lk = $('#lk'), dev = $('.device'), hw = $('.hw');
    if (!scr || !lk || !hw || !dev) return;
    $$('.ph-widget,.home .app,.ph-dock .icon', scr).forEach(function (el, i) { el.style.setProperty('--i', i); });
    hw.setAttribute('inert', '');
    var y = 0, v = 0, raf = 0, open = false, ls = null, jd = false, fT;
    function H() { return scr.clientHeight || 600; }
    function rub(d) { return (1 - 1 / (d * .5 / 60 + 1)) * 60; }
    function paint() {
      var p = clamp(-y / H(), 0, 1);
      lk.style.transform = 'translate3d(0,' + y.toFixed(2) + 'px,0)';
      lk.style.opacity = clamp(1 - p * 1.3, 0, 1).toFixed(3);
    }
    function go(to, z, r, vel, done) {
      cancelAnimationFrame(raf);
      v = vel || 0;
      var last = performance.now();
      (function s(t) {
        var dt = clamp((t - last) / 1000, 0, .032);
        last = t;
        var w = 2 * Math.PI / r, k = w * w, c = 2 * z * w;
        var n = Math.max(1, Math.ceil(dt / .004)), h = dt / n;
        for (var i = 0; i < n; i++) {
          v += (-k * (y - to) - c * v) * h;
          y += v * h;
        }
        if (Math.abs(y - to) < .4 && Math.abs(v) < 8) {
          y = to;
          v = 0;
          paint();
          raf = 0;
          if (done) done();
          return;
        }
        paint();
        raf = requestAnimationFrame(s);
      })(last);
    }
    function gone() {
      lk.classList.add('gone');
      lk.style.transform = '';
      lk.style.opacity = '';
    }
    function unlock(vel) {
      if (open) return;
      open = true;
      clearTimeout(fT);
      scr.classList.add('unlocked');
      hw.removeAttribute('inert');
      lk.setAttribute('aria-hidden', 'true');
      lk.tabIndex = -1;
      if (reduce) {
        lk.style.transition = 'opacity .25s linear';
        lk.style.opacity = '0';
        setTimeout(gone, 280);
        return;
      }
      go(-H() * 1.02, 1, .46, Math.min(vel || 0, -300), gone);
    }
    lk.addEventListener('pointerdown', function (e) {
      if (open || e.button > 0) return;
      if (e.pointerType === 'touch' && !e.target.closest('.lk-zone')) return;
      ls = { id: e.pointerId, x0: e.clientX, y0: e.clientY, active: false, off: 0, s: [] };
    });
    lk.addEventListener('pointermove', function (e) {
      if (!ls || e.pointerId !== ls.id) return;
      if (!ls.active) {
        var dx = e.clientX - ls.x0, dy = e.clientY - ls.y0;
        if (Math.hypot(dx, dy) < 8) return;
        if (Math.abs(dy) < Math.abs(dx)) { ls = null; return; }
        cancelAnimationFrame(raf);
        v = 0;
        ls.active = true;
        ls.off = y - e.clientY;
        ls.s = [{ t: e.timeStamp, y: y }];
        lk.classList.add('drag');
        try { lk.setPointerCapture(ls.id); } catch (x) { }
      }
      var raw = e.clientY + ls.off;
      y = raw > 0 ? rub(raw) : raw;
      ls.s.push({ t: e.timeStamp, y: y });
      while (ls.s.length > 2 && e.timeStamp - ls.s[0].t > 100) ls.s.shift();
      paint();
      if (e.cancelable) e.preventDefault();
    });
    function end(e) {
      if (!ls || e.pointerId !== ls.id) return;
      var d = ls;
      ls = null;
      if (!d.active) return;
      lk.classList.remove('drag');
      jd = true;
      setTimeout(function () { jd = false; }, 60);
      var a = d.s[0], b = d.s[d.s.length - 1], dt = Math.max(1, b.t - a.t);
      var vel = e.type === 'pointercancel' ? 0 : (b.y - a.y) / dt * 1000;
      if (y + vel * .18 < -H() * .3) unlock(vel); else go(0, .78, .38, vel);
    }
    lk.addEventListener('pointerup', end);
    lk.addEventListener('pointercancel', end);
    lk.addEventListener('click', function () { if (jd || open) return; unlock(-1500); });
    lk.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        unlock(-1500);
      }
    });
    function seen() {
      lk.classList.add('seen');
      fT = setTimeout(function () { lk.classList.add('faceid'); }, 1500);
    }
    if (hasIO) {
      var o = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) {
          o.disconnect();
          seen();
        }
      }, { threshold: .35 });
      o.observe(dev);
    } else seen();
  })();

  /* ---------- scroll-linked: progress bar, parallax, word-by-word reveal ---------- */
  (function () {
    if (reduce) return;
    var bar = document.createElement('div');
    bar.className = 'prog';
    document.body.appendChild(bar);
    var dev = $('.device'), feat = $('.feat'), ap = $('.about-card p'), ws = [], tk = false;
    if (ap) {
      (function walk(n) {
        Array.prototype.slice.call(n.childNodes).forEach(function (c) {
          if (c.nodeType === 3) {
            var f = document.createDocumentFragment();
            c.textContent.split(/(\s+)/).forEach(function (w) {
              if (!w) return;
              if (/^\s+$/.test(w)) { f.appendChild(document.createTextNode(w)); return; }
              var s = document.createElement('span');
              s.className = 'wd';
              s.textContent = w;
              f.appendChild(s);
              ws.push(s);
            });
            c.parentNode.replaceChild(f, c);
          } else if (c.nodeType === 1) walk(c);
        });
      })(ap);
    }
    function upd() {
      tk = false;
      var vh = innerHeight, max = document.documentElement.scrollHeight - vh;
      bar.style.transform = 'scaleX(' + (max > 0 ? clamp(scrollY / max, 0, 1) : 0).toFixed(4) + ')';
      if (dev && dev.parentNode) {
        var r = dev.parentNode.getBoundingClientRect();
        dev.style.transform = 'translate3d(0,' + ((r.top + r.height / 2 - vh / 2) * -.07).toFixed(1) + 'px,0)';
      }
      if (feat) {
        var q = feat.parentNode.getBoundingClientRect();
        feat.style.transform = 'translate3d(0,' + (clamp(-q.top, 0, 600) * .12).toFixed(1) + 'px,0)';
      }
      if (ws.length) {
        var a = ap.getBoundingClientRect(), n = Math.round(clamp((vh * .9 - a.top) / (vh * .5), 0, 1) * ws.length);
        ws.forEach(function (w, i) {
          var on = i < n;
          if (w._on !== on) {
            w._on = on;
            w.classList.toggle('on', on);
          }
        });
      }
    }
    function req() { if (!tk) { tk = true; requestAnimationFrame(upd); } }
    addEventListener('scroll', req, { passive: true });
    addEventListener('resize', req);
    upd();
  })();
})();