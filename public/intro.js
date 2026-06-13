// Intro animation: a terminal-style typewriter that reveals the paragraphs one
// character at a time, plus a warm glow that follows the pointer. Exposed on
// `window` so the inline DC component in index.html can drive it from its
// lifecycle hooks.
(function () {
  // Reveal `contentEl`'s paragraphs and wire `glowEl` to the pointer. Returns a
  // teardown function that stops timers and listeners. Pass `{ animate: false }`
  // to reveal the text instantly (no typewriter) while keeping the glow.
  function mount(contentEl, glowEl, options) {
    if (!contentEl) return function () {};
    const animate = !options || options.animate !== false;

    // --- cursor-following warm glow (no re-render, direct DOM) ---
    let raf = null;
    let tx = innerWidth * 0.6;
    let ty = innerHeight * 0.26;
    const apply = () => {
      raf = null;
      if (glowEl) {
        glowEl.style.background =
          'radial-gradient(460px circle at ' + tx + 'px ' + ty + 'px, rgba(231,173,77,0.07), transparent 60%)';
      }
    };
    const move = (e) => {
      tx = e.clientX; ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener('pointermove', move, { passive: true });

    let typeTimer = null;
    let onVisible = null;
    const teardown = () => {
      window.removeEventListener('pointermove', move);
      if (onVisible) document.removeEventListener('visibilitychange', onVisible);
      if (typeTimer) clearTimeout(typeTimer);
      if (raf) cancelAnimationFrame(raf);
    };

    // Returning visitors (back/forward navigation) skip the typewriter: just
    // reveal the already-rendered text.
    if (!animate) {
      contentEl.style.opacity = '1';
      return teardown;
    }

    // --- terminal typewriter ---
    const paras = Array.from(contentEl.querySelectorAll('[data-para]'));

    // Parse each paragraph into ordered segments (plain text vs. link), then
    // empty them so we can retype the characters into the right targets.
    const model = paras.map((p) => {
      const segs = [];
      Array.from(p.childNodes).forEach((node) => {
        if (node.nodeType === 3) {
          if (node.textContent.length) segs.push({ text: node.textContent, el: null });
        } else if (node.tagName === 'A') {
          segs.push({ text: node.textContent, el: node });
        }
      });
      return { p, segs };
    });

    model.forEach(({ p, segs }, pi) => {
      p.textContent = '';
      p.style.display = pi === 0 ? 'block' : 'none';
      segs.forEach((seg) => {
        if (seg.el) { seg.el.textContent = ''; p.appendChild(seg.el); seg.target = seg.el; }
        else { const sp = document.createElement('span'); p.appendChild(sp); seg.target = sp; }
      });
    });

    contentEl.style.opacity = '1';

    // Blinking caret that rides the typing position.
    const cursor = document.createElement('span');
    cursor.textContent = '▋';
    cursor.style.cssText = 'display:inline-block; color:#e7ad4d; margin-left:1px; animation: blink 1.05s steps(1) infinite;';

    // Flatten into a per-character queue, with paragraph reveals between blocks.
    const queue = [];
    model.forEach(({ p, segs }) => {
      queue.push({ kind: 'para', p });
      segs.forEach((seg) => {
        for (const ch of seg.text) queue.push({ kind: 'char', target: seg.target, ch, p });
      });
    });

    // Precompute an absolute timeline (ms from start) for each step. Driving the
    // loop off wall-clock deadlines — instead of trusting each setTimeout's
    // delay — keeps the animation on schedule in a background tab, where timers
    // are throttled to ~1/sec. On the next tick (or when the tab is refocused)
    // every step whose deadline has passed is revealed at once, so the intro is
    // already where it should be rather than frozen at the start.
    const deadlines = new Array(queue.length);
    let t = 420; // initial pause before typing begins
    for (let i = 0; i < queue.length; i++) {
      deadlines[i] = t;
      const step = queue[i];
      if (step.kind === 'para') {
        t += i === 0 ? 0 : 360;
      } else {
        t += 17 + Math.random() * 20;
        if (step.ch === ' ') t += 8;
        else if (step.ch === ',') t += 110;
        else if ('.!?'.includes(step.ch)) t += 240;
      }
    }

    const reveal = (step) => {
      if (step.kind === 'para') {
        step.p.style.display = 'block';
      } else {
        step.target.appendChild(document.createTextNode(step.ch));
      }
      step.p.appendChild(cursor); // keep caret trailing the latest glyph
    };

    const start = performance.now();
    let idx = 0;
    const run = () => {
      if (typeTimer) { clearTimeout(typeTimer); typeTimer = null; }
      const now = performance.now() - start;
      while (idx < queue.length && deadlines[idx] <= now) reveal(queue[idx++]);
      if (idx < queue.length) {
        typeTimer = setTimeout(run, Math.max(0, deadlines[idx] - (performance.now() - start)));
      }
    };

    // Catch up immediately when the tab is refocused, rather than waiting out a
    // throttled timer.
    onVisible = () => { if (!document.hidden) run(); };
    document.addEventListener('visibilitychange', onVisible);

    typeTimer = setTimeout(run, deadlines[0]);

    return teardown;
  }

  window.IntroTerminal = { mount: mount };
})();
