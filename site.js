// Shared behavior for every page. Each part checks that its elements are on the page before doing anything.
(function () {
  // Light/dark toggle (Nov 20). Dark is the default; the choice is saved in localStorage ("theme").
  // A one-line script in each page's <head> applies a saved choice before the page draws, so there is no flash.
  var root = document.documentElement;
  var nav = document.querySelector('.topbar .nav');
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var tbtn = null;
  var paintTheme = function () {
    var light = root.getAttribute('data-theme') === 'light';
    if (themeMeta) themeMeta.setAttribute('content', light ? '#f6f4ef' : '#111216');
    if (tbtn) {
      tbtn.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
      tbtn.setAttribute('title', light ? 'Dark mode' : 'Light mode');
    }
  };
  if (nav) {
    tbtn = document.createElement('button');
    tbtn.type = 'button';
    tbtn.className = 'theme-toggle';
    tbtn.innerHTML =
      '<svg class="i-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>' +
      '<svg class="i-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
    tbtn.addEventListener('click', function () {
      var light = root.getAttribute('data-theme') !== 'light';
      if (light) root.setAttribute('data-theme', 'light'); else root.removeAttribute('data-theme');
      try { localStorage.setItem('theme', light ? 'light' : 'dark'); } catch (e) {}
      paintTheme();
      document.dispatchEvent(new Event('themechange'));
    });
    nav.appendChild(tbtn);
  }
  paintTheme();

  // Top bar border once scrolled
  var bar = document.querySelector('.topbar');
  if (bar) {
    var onScroll = function () { bar.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Open a dropdown when it is linked to directly (e.g. experience.html#x-poldrack, experience.html#p-rdoc)
  function openTarget() {
    if (!location.hash) return;
    var el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!el) return;
    if (el.tagName === 'DETAILS') el.open = true;
    var inner = el.classList.contains('project') && el.querySelector(':scope > details');
    if (inner) inner.open = true;
  }
  window.addEventListener('hashchange', openTarget);
  openTarget();

  // Projects: expand / collapse all
  var expP = document.getElementById('expand-projects');
  if (expP) {
    var projects = document.querySelectorAll('#project-list .project > details');
    var allOpen = function () { return Array.prototype.every.call(projects, function (d) { return d.open; }); };
    var syncP = function () { expP.textContent = allOpen() ? 'Collapse all' : 'Expand all'; };
    expP.addEventListener('click', function () {
      var open = !allOpen();
      projects.forEach(function (d) { d.open = open; });
      syncP();
    });
    projects.forEach(function (d) { d.addEventListener('toggle', syncP); });
    syncP();
  }

  // Lightbox: click a figure or slide ([data-zoom]) to see it larger
  var lb = document.getElementById('lightbox');
  if (lb) {
    var lbImg = lb.querySelector('img');
    var lbOpen = document.getElementById('lb-open');
    document.querySelectorAll('[data-zoom]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var src = btn.getAttribute('data-zoom');
        lbImg.src = src;
        lbImg.alt = btn.querySelector('img').alt;
        lbOpen.href = src;
        document.getElementById('lb-cap').textContent = btn.getAttribute('data-caption') || '';
        if (typeof lb.showModal === 'function') lb.showModal(); else window.open(src, '_blank');
      });
    });
    document.getElementById('lb-close').addEventListener('click', function () { lb.close(); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  }

  // Side panels (the poster photo on Papers): open from a [data-panel] button; close on Close, Esc, or a click outside
  document.querySelectorAll('[data-panel]').forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute('data-panel'));
    if (!panel) return;
    btn.addEventListener('click', function () {
      if (typeof panel.showModal === 'function') panel.showModal();
      else window.open(panel.querySelector('a').href, '_blank');
    });
  });
  document.querySelectorAll('dialog.side-panel').forEach(function (panel) {
    var close = panel.querySelector('[data-close]');
    if (close) close.addEventListener('click', function () { panel.close(); });
    panel.addEventListener('click', function (e) { if (e.target === panel) panel.close(); });
  });

  // Misc: the road map (#journey). Draws a winding road through each stop's [data-anchor],
  // reveals it when it scrolls into view, and moves a dot to whichever stop you point at.
  var journey = document.getElementById('journey');
  if (journey && journey.querySelector('.journey-road')) (function () {
    var NS = 'http://www.w3.org/2000/svg';
    var svg = journey.querySelector('.journey-road');
    var stops = Array.prototype.slice.call(journey.querySelectorAll('.stop'));
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var canAnimate = !reduce && 'IntersectionObserver' in window && 'requestAnimationFrame' in window;

    svg.innerHTML =
      '<defs>' +
        '<linearGradient id="jr-colors" gradientUnits="userSpaceOnUse"></linearGradient>' +
        '<linearGradient id="jr-fade" gradientUnits="userSpaceOnUse"></linearGradient>' +
        '<mask id="jr-mask" maskUnits="userSpaceOnUse" x="-200" y="-200" width="4000" height="4000">' +
          '<path class="jr-reveal" fill="none" stroke="url(#jr-fade)" stroke-width="44" stroke-linecap="round"></path>' +
        '</mask>' +
      '</defs>' +
      '<g mask="url(#jr-mask)"><path class="jr-base" fill="none"></path><path class="jr-line" fill="none" stroke="url(#jr-colors)"></path></g>' +
      '<circle class="jr-dot" r="7"></circle>';
    var base = svg.querySelector('.jr-base'), line = svg.querySelector('.jr-line');
    var reveal = svg.querySelector('.jr-reveal'), dot = svg.querySelector('.jr-dot');
    var colorsGrad = svg.querySelector('#jr-colors'), fadeGrad = svg.querySelector('#jr-fade');

    var total = 0, stopLen = [], drawnTo = canAnimate ? 0 : Infinity, dotLen = null, here = stops.length - 1, anim = null;
    var era = function (i) { return getComputedStyle(stops[i]).getPropertyValue('--era').trim() || '#8ea6ff'; };

    function gradStops(grad, list) {
      grad.innerHTML = list.map(function (s) {
        return '<stop offset="' + Math.min(Math.max(s[0], 0), 1) + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '></stop>';
      }).join('');
    }

    function layout() {
      var box = journey.getBoundingClientRect();
      var rows = stops.map(function (s) { var r = s.getBoundingClientRect(); return { top: r.top - box.top, bottom: r.bottom - box.top }; });
      var pts = stops.map(function (s) {
        var a = s.querySelector('[data-anchor]').getBoundingClientRect();
        return { x: a.left + a.width / 2 - box.left, y: a.top + a.height / 2 - box.top };
      });
      var first = pts[0], last = pts[pts.length - 1];
      var horiz = Math.abs(last.x - first.x) > Math.abs(last.y - first.y);
      // A short lead-in before the first stop and a tail after the last one that fades out
      var start = horiz ? { x: first.x - 80, y: first.y + 45 } : { x: first.x, y: Math.max(first.y - 50, 4) };
      var end = horiz ? { x: last.x + 120, y: last.y + 55 } : { x: last.x, y: last.y + 80 };
      // On phones the road runs straight down beside each photo, then switches sides in the gap between stops,
      // so it never crosses the text. anchorAt[i] is where stop i sits in the list of road points.
      var all = [start], anchorAt = [];
      pts.forEach(function (pt, i) {
        if (!horiz && i > 0) all.push({ x: pt.x, y: rows[i].top - 4 });
        anchorAt.push(all.length); all.push(pt);
        if (!horiz && i < pts.length - 1) all.push({ x: pt.x, y: rows[i].bottom + 4 });
      });
      all.push(end);
      var d = 'M' + all[0].x + ' ' + all[0].y, prefix = [];
      for (var i = 1; i < all.length; i++) {
        var p = all[i - 1], q = all[i];
        if (horiz) {
          var dx = (q.x - p.x) * 0.5;
          d += ' C' + (p.x + dx) + ' ' + p.y + ' ' + (q.x - dx) + ' ' + q.y + ' ' + q.x + ' ' + q.y;
        } else {
          var dy = (q.y - p.y) * 0.55;
          d += ' C' + p.x + ' ' + (p.y + dy) + ' ' + q.x + ' ' + (q.y - dy) + ' ' + q.x + ' ' + q.y;
        }
        prefix.push(d);
      }
      [base, line, reveal].forEach(function (el) { el.setAttribute('d', d); });
      total = base.getTotalLength();
      var tmp = document.createElementNS(NS, 'path');
      svg.appendChild(tmp);
      stopLen = pts.map(function (_, i) { tmp.setAttribute('d', prefix[anchorAt[i] - 1]); return tmp.getTotalLength(); });
      svg.removeChild(tmp);

      // Colors run along the road from stop to stop; the road fades in at the start and out at the end
      var ax = horiz ? 'x' : 'y', span = end[ax] - start[ax];
      var frac = function (pt) { return (pt[ax] - start[ax]) / span; };
      [colorsGrad, fadeGrad].forEach(function (g) {
        g.setAttribute('x1', start.x); g.setAttribute('y1', start.y);
        g.setAttribute('x2', horiz ? end.x : start.x); g.setAttribute('y2', horiz ? start.y : end.y);
      });
      gradStops(colorsGrad, pts.map(function (pt, i) { return [frac(pt), era(i)]; }));
      gradStops(fadeGrad, [[0, '#fff', 0], [frac(first), '#fff', 1], [frac(last), '#fff', 1], [1, '#fff', 0]]);

      reveal.style.strokeDasharray = total + ' ' + total;
      paint();
    }

    function paint() {
      var shown = Math.min(drawnTo, total);
      reveal.style.strokeDashoffset = total - shown;
      if (dotLen == null) return;
      var pt = base.getPointAtLength(Math.min(dotLen, total));
      dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
    }

    function setHere(i) {
      here = i;
      dot.setAttribute('fill', era(i));
      stops.forEach(function (s, k) { s.classList.toggle('is-here', k === i); });
    }

    function moveDot(i) {
      if (!stopLen.length || drawnTo < stopLen[stopLen.length - 1]) return;
      var from = dotLen, to = stopLen[i];
      setHere(i);
      if (!canAnimate || from == null) { dotLen = to; paint(); return; }
      if (anim) cancelAnimationFrame(anim);
      var dur = Math.min(Math.max(Math.abs(to - from) * 0.9, 300), 900), t0 = null;
      var step = function (ts) {
        if (t0 == null) t0 = ts;
        var t = Math.min((ts - t0) / dur, 1), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        dotLen = from + (to - from) * e; paint();
        if (t < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    }

    stops.forEach(function (s, i) {
      s.querySelectorAll('a, button').forEach(function (el) {
        el.addEventListener('mouseenter', function () { moveDot(i); });
        el.addEventListener('focus', function () { moveDot(i); });
      });
    });

    layout();
    if ('ResizeObserver' in window) new ResizeObserver(function () { layout(); if (dotLen != null) { dotLen = stopLen[here]; paint(); } }).observe(journey);
    window.addEventListener('load', layout);
    document.addEventListener('themechange', function () { layout(); setHere(here); });  // new road colors after a theme switch
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

    function finish() {
      drawnTo = Infinity; dotLen = stopLen[stops.length - 1];
      stops.forEach(function (s) { s.classList.add('is-in'); });
      setHere(stops.length - 1); dot.classList.add('on'); paint();
    }

    if (!canAnimate) { finish(); return; }
    // Draw the road from the start to the end, with the dot riding along and each stop appearing as it's reached
    journey.classList.add('js-anim');
    var io = new IntersectionObserver(function (entries) {
      if (!entries.some(function (e) { return e.isIntersecting; })) return;
      io.disconnect();
      var dur = 2600, t0 = null, safety = setTimeout(finish, dur + 1500);
      dot.classList.add('on'); setHere(0);
      var step = function (ts) {
        if (t0 == null) t0 = ts;
        var t = Math.min((ts - t0) / dur, 1), e = 1 - Math.pow(1 - t, 3);
        drawnTo = total * e;
        dotLen = Math.min(drawnTo, stopLen[stopLen.length - 1]);
        stops.forEach(function (s, i) {
          if (dotLen >= stopLen[i] - 2) { s.classList.add('is-in'); if (i > here || here === stops.length - 1 && i === 0) setHere(i); }
        });
        paint();
        if (t < 1) requestAnimationFrame(step); else { clearTimeout(safety); finish(); }
      };
      requestAnimationFrame(step);
    }, { threshold: 0.35 });
    io.observe(journey);
  })();
})();
