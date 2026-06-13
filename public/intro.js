// Intro animation: a terminal-style typewriter that reveals the paragraphs one
// character at a time, plus a warm glow that follows the pointer. Exposed on
// `window` so the inline DC component in index.html can drive it from its
// lifecycle hooks.
(function () {
  // Reveal `contentEl`'s paragraphs with a typing effect and wire `glowEl` to
  // the pointer. Returns a teardown function that stops timers and listeners.
  function mount(contentEl, glowEl) {
    if (!contentEl) return function () {};

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

    let idx = 0;
    let typeTimer = null;
    const tick = () => {
      if (idx >= queue.length) return;
      const step = queue[idx++];
      if (step.kind === 'para') {
        step.p.style.display = 'block';
        step.p.appendChild(cursor);
        typeTimer = setTimeout(tick, idx === 1 ? 0 : 360);
        return;
      }
      step.target.appendChild(document.createTextNode(step.ch));
      step.p.appendChild(cursor); // keep caret trailing the freshly typed glyph
      let delay = 17 + Math.random() * 20;
      if (step.ch === ' ') delay += 8;
      else if (step.ch === ',') delay += 110;
      else if ('.!?'.includes(step.ch)) delay += 240;
      typeTimer = setTimeout(tick, delay);
    };
    typeTimer = setTimeout(tick, 420);

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

    return function teardown() {
      window.removeEventListener('pointermove', move);
      if (typeTimer) clearTimeout(typeTimer);
      if (raf) cancelAnimationFrame(raf);
    };
  }

  window.IntroTerminal = { mount: mount };
})();
