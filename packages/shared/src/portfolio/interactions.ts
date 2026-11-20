// Application-owned, local interactions; user content is never executed.
// Self-contained so exported portfolios can include the same behavior.
export function mountPortfolioInteractions(root: ParentNode): () => void {
  const cleanups: Array<() => void> = [];
  root.querySelectorAll<HTMLElement>('[data-kinetic-page], [data-obsidian-page]').forEach((page) => {
    const family = page.hasAttribute('data-obsidian-page') ? 'obsidian' : 'kinetic';
    const attribute = (name: string) => `data-${family}-${name}`;
    const indexProperty = family === 'obsidian' ? '--pf-intro-index' : '--pf-word-index';
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reveals = Array.from(page.querySelectorAll<HTMLElement>(`[${attribute('reveal')}]`));
    const animated = Array.from(page.querySelectorAll<HTMLElement>(`[${attribute('animate')}]`));
    const introductions = Array.from(page.querySelectorAll<HTMLElement>(`[${attribute(family === 'obsidian' ? 'intro' : 'word')}]`));
    const button = page.querySelector<HTMLButtonElement>(`[${attribute('motion')}]`);
    const tilts = Array.from(page.querySelectorAll<HTMLElement>(`[${attribute('tilt')}]`));
    const scenes = Array.from(page.querySelectorAll<HTMLElement>('[data-kinetic-scroll]'));
    const frames = new Map<HTMLElement, number>();
    let paused = false;
    let scrollFrame = 0;
    let scrollPort = page.parentElement;
    while (scrollPort && !['auto', 'scroll'].includes(getComputedStyle(scrollPort).overflowY)) scrollPort = scrollPort.parentElement;
    if (scrollPort === document.body || scrollPort === document.documentElement) scrollPort = null;
    const scrollProperties = ['--pf-scroll-depth', '--pf-scroll-counter', '--pf-scroll-offset', '--pf-scroll-turn', '--pf-scroll-scale'];
    const resetScroll = () => {
      cancelAnimationFrame(scrollFrame); scrollFrame = 0;
      scenes.forEach((scene) => scrollProperties.forEach((property) => scene.style.removeProperty(property)));
    };
    const drawScroll = () => {
      scrollFrame = 0;
      if (preference.matches || paused || document.hidden) return;
      const port = scrollPort?.getBoundingClientRect();
      const top = Math.max(0, port?.top ?? 0), bottom = Math.min(window.innerHeight, port?.bottom ?? window.innerHeight);
      const height = bottom - top;
      if (height <= 0) return;
      const compact = page.clientWidth < 650;
      scenes.forEach((scene) => {
        const rect = scene.getBoundingClientRect();
        if (rect.bottom < top || rect.top > bottom) return;
        const progress = Math.max(-1, Math.min(1, (top + height / 2 - rect.top - rect.height / 2) / ((height + rect.height) / 2)));
        scene.style.setProperty('--pf-scroll-depth', (progress * (compact ? 28 : 95)).toFixed(2) + 'px');
        scene.style.setProperty('--pf-scroll-counter', (-progress * (compact ? 18 : 72)).toFixed(2) + 'px');
        scene.style.setProperty('--pf-scroll-offset', (-progress * (compact ? 70 : 220)).toFixed(2) + 'px');
        scene.style.setProperty('--pf-scroll-turn', (progress * 8).toFixed(2) + 'deg');
        scene.style.setProperty('--pf-scroll-scale', (1 + (1 - Math.abs(progress)) * .08).toFixed(3));
      });
    };
    const scheduleScroll = () => {
      if (scenes.length && !scrollFrame && !preference.matches && !paused && !document.hidden) scrollFrame = requestAnimationFrame(drawScroll);
    };
    const resetTilt = () => {
      frames.forEach((frame) => cancelAnimationFrame(frame)); frames.clear();
      tilts.forEach((element) => { element.style.removeProperty('--pf-tilt-x'); element.style.removeProperty('--pf-tilt-y'); });
    };
    const refresh = () => {
      const stopped = preference.matches || paused || document.hidden;
      page.toggleAttribute(attribute('reduced'), preference.matches);
      page.toggleAttribute(attribute('paused'), paused);
      page.toggleAttribute(attribute('running'), !stopped);
      if (stopped || !pointer.matches) resetTilt();
      if (stopped) resetScroll(); else scheduleScroll();
      if (preference.matches || paused) reveals.forEach((element) => element.setAttribute(attribute('in-view'), ''));
      if (button) {
        button.textContent = preference.matches ? 'Reduced motion' : paused ? 'Resume motion' : 'Pause motion';
        button.setAttribute('aria-pressed', String(preference.matches || paused));
        button.setAttribute('aria-disabled', String(preference.matches));
      }
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (target.hasAttribute(attribute('reveal')) && isIntersecting) target.setAttribute(attribute('in-view'), '');
        if (target.hasAttribute(attribute('animate'))) target.toggleAttribute(attribute('active'), isIntersecting);
      });
      scheduleScroll();
    }, { threshold: .08 });
    new Set([...reveals, ...animated]).forEach((element) => observer.observe(element));
    introductions.forEach((element, index) => element.style.setProperty(indexProperty, String(Math.min(index, 24))));
    tilts.forEach((element) => {
      const canMove = () => !preference.matches && !paused && !document.hidden && pointer.matches
        && !!element.closest(`[${attribute('active')}]`);
      let x = 0, y = 0;
      const move = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse' || !canMove()) return;
        x = event.clientX; y = event.clientY;
        if (frames.has(element)) return;
        frames.set(element, requestAnimationFrame(() => {
          frames.delete(element); if (!canMove()) return;
          const rect = element.getBoundingClientRect();
          const horizontal = Math.max(-.5, Math.min(.5, (x - rect.left) / Math.max(rect.width, 1) - .5));
          const vertical = Math.max(-.5, Math.min(.5, (y - rect.top) / Math.max(rect.height, 1) - .5));
          element.style.setProperty('--pf-tilt-x', (-vertical * 10).toFixed(2) + 'deg');
          element.style.setProperty('--pf-tilt-y', (horizontal * 10).toFixed(2) + 'deg');
        }));
      };
      const leave = () => {
        const frame = frames.get(element); if (frame !== undefined) cancelAnimationFrame(frame);
        frames.delete(element); element.style.removeProperty('--pf-tilt-x'); element.style.removeProperty('--pf-tilt-y');
      };
      element.addEventListener('pointermove', move); element.addEventListener('pointerleave', leave);
      cleanups.push(() => { element.removeEventListener('pointermove', move); element.removeEventListener('pointerleave', leave); });
    });
    const toggle = () => { if (!preference.matches) { paused = !paused; refresh(); } };
    const close = (event: Event) => {
      const menu = (event.target as Element).closest<HTMLDetailsElement>(`[${attribute('menu')}]`);
      if (menu && (event.target as Element).closest('a')) menu.open = false;
    };
    button?.addEventListener('click', toggle); page.addEventListener('click', close);
    preference.addEventListener('change', refresh); pointer.addEventListener('change', refresh);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('scroll', scheduleScroll, { capture: true, passive: true });
    window.addEventListener('resize', scheduleScroll, { passive: true });
    const layout = new ResizeObserver(scheduleScroll); layout.observe(page);
    if (scrollPort) layout.observe(scrollPort);
    page.setAttribute(attribute('enhanced'), ''); refresh();
    cleanups.push(() => {
      observer.disconnect(); layout.disconnect(); resetTilt(); resetScroll(); button?.removeEventListener('click', toggle); page.removeEventListener('click', close);
      preference.removeEventListener('change', refresh); pointer.removeEventListener('change', refresh);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('scroll', scheduleScroll, true); window.removeEventListener('resize', scheduleScroll);
      ['enhanced', 'reduced', 'paused', 'running'].forEach((name) => page.removeAttribute(attribute(name)));
      reveals.forEach((element) => element.removeAttribute(attribute('in-view')));
      animated.forEach((element) => element.removeAttribute(attribute('active')));
      introductions.forEach((element) => element.style.removeProperty(indexProperty));
      page.querySelectorAll<HTMLDetailsElement>(`[${attribute('menu')}]`).forEach((menu) => { menu.open = false; });
      if (button) { button.textContent = 'Pause motion'; button.setAttribute('aria-pressed', 'false'); button.removeAttribute('aria-disabled'); }
    });
  });
  root.querySelectorAll<HTMLElement>('[data-dossier-shell]').forEach((shell) => {
    const panels = Array.from(shell.querySelectorAll<HTMLElement>('.pf-dossier-panel'));
    const links = Array.from(shell.querySelectorAll<HTMLAnchorElement>('[data-dossier-link]'));
    if (!panels.length) return;
    const select = (panel: HTMLElement, focus = false) => {
      panels.forEach((candidate) => { candidate.hidden = candidate !== panel; });
      links.forEach((link) => {
        if (link.getAttribute('href') === '#' + panel.id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      shell.querySelectorAll<HTMLDetailsElement>('[data-dossier-menu]').forEach((menu) => { menu.open = false; });
      if (focus) { panel.focus({ preventScroll: true }); panel.scrollIntoView({ block: 'start' }); }
    };
    const click = (event: Event) => {
      const mouse = event as MouseEvent;
      if (event.defaultPrevented || mouse.button > 0 || mouse.ctrlKey || mouse.metaKey || mouse.shiftKey || mouse.altKey) return;
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#portfolio-"]');
      if (!link || !shell.contains(link)) return;
      const panel = panels.find((candidate) => '#' + candidate.id === link.getAttribute('href'));
      if (!panel) return;
      event.preventDefault(); select(panel, true);
    };
    const hashChange = () => {
      const panel = panels.find((candidate) => '#' + candidate.id === window.location.hash);
      if (panel) select(panel);
    };
    select(panels.find((panel) => '#' + panel.id === window.location.hash) || panels[0]);
    shell.addEventListener('click', click);
    window.addEventListener('hashchange', hashChange);
    cleanups.push(() => {
      shell.removeEventListener('click', click); window.removeEventListener('hashchange', hashChange);
      panels.forEach((panel) => { panel.hidden = false; });
      links.forEach((link) => link.removeAttribute('aria-current'));
      shell.querySelectorAll<HTMLDetailsElement>('[data-dossier-menu]').forEach((menu) => { menu.open = false; });
    });
  });
  root.querySelectorAll<HTMLElement>('[data-monochrome-page]').forEach((page) => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const button = page.querySelector<HTMLButtonElement>('[data-monochrome-motion]');
    const reveals = Array.from(page.querySelectorAll<HTMLElement>('[data-monochrome-reveal]'));
    const intros = Array.from(page.querySelectorAll<HTMLElement>('[data-monochrome-intro]'));
    const chips = Array.from(page.querySelectorAll<HTMLElement>('.pf-skills>.pf-tags li'));
    const tilts = Array.from(page.querySelectorAll<HTMLElement>('[data-monochrome-tilt]'));
    const animated = Array.from(page.querySelectorAll<HTMLElement>('.pf-monochrome-title,.pf-monochrome-badge,.pf-monochrome-profile-float,.pf-monochrome-ticker,.pf-monochrome-typebar,.pf-monochrome-scroll-cue'));
    const background = page.querySelector<HTMLElement>('[data-monochrome-background]');
    const spotlight = page.querySelector<HTMLElement>('.pf-monochrome-spotlight');
    const canvas = page.querySelector<HTMLCanvasElement>('canvas[data-monochrome-particles]');
    const context = canvas?.getContext('2d');
    const color = getComputedStyle(page).getPropertyValue('--pf-text').trim() || '#ffffff';
    let scrollPort = page.parentElement;
    while (scrollPort && !['auto', 'scroll'].includes(getComputedStyle(scrollPort).overflowY)) scrollPort = scrollPort.parentElement;
    if (scrollPort === document.body || scrollPort === document.documentElement) scrollPort = null;
    let width = 1, height = 1, frame = 0, pointerFrame = 0, visible = false, paused = false, previousTime = 0;
    let pointer: { x: number; y: number } | undefined, activeTilt: HTMLElement | null = null;
    const canAnimate = () => visible && !document.hidden && !preference.matches && !paused;
    const tiltProperties = ['--pf-tilt-x', '--pf-tilt-y', '--pf-light-x', '--pf-light-y'];
    const resetPointer = () => {
      cancelAnimationFrame(pointerFrame); pointerFrame = 0; pointer = undefined; activeTilt = null;
      tilts.forEach((element) => tiltProperties.forEach((property) => element.style.removeProperty(property)));
      spotlight?.style.removeProperty('--pf-pointer-x'); spotlight?.style.removeProperty('--pf-pointer-y');
      page.removeAttribute('data-monochrome-pointer');
    };
    const points = Array.from({ length: 70 }, (_, index) => ({ x: ((index * 137 + 29) % 997) / 997,
      y: ((index * 239 + 71) % 991) / 991, dx: (index % 2 ? 1 : -1) * (.00008 + index % 5 * .00004),
      dy: (index % 3 ? 1 : -1) * (.00008 + index % 4 * .00004), size: .7 + index % 5 * .35 }));
    const draw = (step: number) => {
      if (!context) return;
      context.clearRect(0, 0, width, height);
      context.fillStyle = color; context.strokeStyle = color; context.lineWidth = .7;
      const count = Math.min(70, Math.max(12, Math.floor(width * height / 18000)));
      for (let index = 0; index < count; index++) {
        const point = points[index];
        point.x = (point.x + point.dx * step + 1) % 1; point.y = (point.y + point.dy * step + 1) % 1;
        const x = point.x * width, y = point.y * height;
        context.globalAlpha = .2 + index % 6 * .09; context.beginPath(); context.arc(x, y, point.size, 0, Math.PI * 2); context.fill();
        for (let next = index + 1; next < count; next++) {
          const other = points[next], distance = Math.hypot(x - other.x * width, y - other.y * height);
          if (distance < 130) { context.globalAlpha = (1 - distance / 130) * .14; context.beginPath();
            context.moveTo(x, y); context.lineTo(other.x * width, other.y * height); context.stroke(); }
        }
        if (pointer) {
          const distance = Math.hypot(x - pointer.x, y - pointer.y);
          if (distance < 180) { context.globalAlpha = (1 - distance / 180) * .35; context.beginPath();
            context.moveTo(x, y); context.lineTo(pointer.x, pointer.y); context.stroke(); }
        }
      }
      context.globalAlpha = 1;
    };
    const animate = (time: number) => {
      frame = 0;
      if (!canAnimate()) return;
      draw(previousTime ? Math.min(3, (time - previousTime) / (1000 / 60)) : 1); previousTime = time;
      frame = requestAnimationFrame(animate);
    };
    type Typewriter = { node: HTMLElement; bar: HTMLElement; original: string; phrases: string[][];
      index: number; length: number; deleting: boolean; started: boolean; timer: number };
    const typewriters: Typewriter[] = Array.from(page.querySelectorAll<HTMLElement>('[data-monochrome-type]')).map((node) => {
      const original = node.textContent || '';
      return { node, bar: node.closest<HTMLElement>('.pf-monochrome-typebar')!, original,
        phrases: original.split(/\n+|(?<=[.!?])\s+/u).map((phrase) => Array.from(phrase.trim())).filter((phrase) => phrase.length),
        index: 0, length: 0, deleting: false, started: false, timer: 0 };
    });
    const canType = (state: Typewriter) => canAnimate() && state.bar.hasAttribute('data-monochrome-active') && state.phrases.length > 0;
    const tickType = (state: Typewriter) => {
      state.timer = 0;
      if (!canType(state)) return;
      const phrase = state.phrases[state.index];
      state.length += state.deleting ? -1 : 1;
      state.node.textContent = phrase.slice(0, state.length).join('');
      let delay = state.deleting ? 35 : 70;
      if (!state.deleting && state.length === phrase.length) { state.deleting = true; delay = 1400; }
      else if (state.deleting && state.length === 0) {
        state.deleting = false; state.index = (state.index + 1) % state.phrases.length; delay = 350;
      }
      state.timer = window.setTimeout(() => tickType(state), delay);
    };
    const refresh = () => {
      page.toggleAttribute('data-monochrome-reduced', preference.matches);
      page.toggleAttribute('data-monochrome-paused', paused);
      page.toggleAttribute('data-monochrome-running', canAnimate());
      if (!canAnimate() || !finePointer.matches) resetPointer();
      if (canAnimate() && context) { if (!frame) frame = requestAnimationFrame(animate); }
      else { cancelAnimationFrame(frame); frame = 0; previousTime = 0; draw(0); }
      typewriters.forEach((state) => {
        if (!canType(state)) { clearTimeout(state.timer); state.timer = 0; }
        if (preference.matches || paused) {
          state.node.textContent = state.original; state.started = false; state.index = 0; state.length = 0; state.deleting = false;
        } else if (canType(state) && !state.timer) {
          if (!state.started) { state.node.textContent = ''; state.started = true; }
          state.timer = window.setTimeout(() => tickType(state), state.deleting ? 35 : 70);
        }
      });
      if (button) {
        button.textContent = preference.matches ? 'Reduced motion' : paused ? 'Resume motion' : 'Pause motion';
        button.setAttribute('aria-pressed', String(preference.matches || paused));
        button.setAttribute('aria-disabled', String(preference.matches));
      }
    };
    const resize = () => {
      width = Math.max(1, Math.min(page.clientWidth, 1600)); height = Math.max(1, Math.min(scrollPort?.clientHeight ?? window.innerHeight, 1200));
      page.style.setProperty('--pf-monochrome-viewport', height + 'px');
      if (canvas && context) {
        const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
      }
      refresh();
    };
    const move = (event: PointerEvent) => {
      if (!canAnimate() || !finePointer.matches || event.pointerType !== 'mouse') return;
      cancelAnimationFrame(pointerFrame);
      const x = event.clientX, y = event.clientY;
      const tilt = (event.target as Element).closest<HTMLElement>('[data-monochrome-tilt]');
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        if (!canAnimate() || !finePointer.matches) return;
        const rect = background?.getBoundingClientRect();
        if (rect) {
          pointer = { x: (x - rect.left) * width / Math.max(1, rect.width), y: (y - rect.top) * height / Math.max(1, rect.height) };
          spotlight?.style.setProperty('--pf-pointer-x', (x - rect.left).toFixed(1) + 'px');
          spotlight?.style.setProperty('--pf-pointer-y', (y - rect.top).toFixed(1) + 'px');
          page.setAttribute('data-monochrome-pointer', '');
        }
        if (activeTilt && activeTilt !== tilt) tiltProperties.forEach((property) => activeTilt?.style.removeProperty(property));
        activeTilt = tilt;
        if (tilt) {
          const box = tilt.getBoundingClientRect();
          const horizontal = Math.max(0, Math.min(1, (x - box.left) / Math.max(1, box.width)));
          const vertical = Math.max(0, Math.min(1, (y - box.top) / Math.max(1, box.height)));
          tilt.style.setProperty('--pf-tilt-x', ((vertical - .5) * -12).toFixed(2) + 'deg');
          tilt.style.setProperty('--pf-tilt-y', ((horizontal - .5) * 12).toFixed(2) + 'deg');
          tilt.style.setProperty('--pf-light-x', (horizontal * 100).toFixed(1) + '%');
          tilt.style.setProperty('--pf-light-y', (vertical * 100).toFixed(1) + '%');
        }
      });
    };
    const toggle = () => { if (!preference.matches) { paused = !paused; refresh(); } };
    const click = (event: MouseEvent) => {
      const link = (event.target as Element).closest<HTMLAnchorElement>('a');
      if (!link || event.defaultPrevented || event.button > 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const menu = link.closest<HTMLDetailsElement>('[data-monochrome-menu]');
      if (menu) menu.open = false;
      const href = link.getAttribute('href');
      if (!href?.startsWith('#')) return;
      const target = Array.from(page.querySelectorAll<HTMLElement>('[id]')).find((element) => '#' + element.id === href);
      if (!target) return;
      event.preventDefault();
      const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
      const top = target.getBoundingClientRect().top - (scrollPort?.getBoundingClientRect().top ?? 0) + (scrollPort?.scrollTop ?? window.scrollY) - margin;
      (scrollPort ?? window).scrollTo({ top, behavior: preference.matches || paused ? 'instant' : 'smooth' });
      if (link.classList.contains('pf-skip')) target.focus({ preventScroll: true });
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (target === page) visible = isIntersecting;
        else {
          if (target.hasAttribute('data-monochrome-reveal')) target.toggleAttribute('data-monochrome-in-view', isIntersecting);
          if (animated.includes(target as HTMLElement)) target.toggleAttribute('data-monochrome-active', isIntersecting);
        }
      });
      refresh();
    }, { threshold: .12 });
    new Set([page, ...reveals, ...animated]).forEach((element) => observer.observe(element));
    intros.forEach((element) => element.style.setProperty('--pf-intro-index', element.getAttribute('data-monochrome-intro') || '0'));
    reveals.forEach((element) => element.style.setProperty('--pf-reveal-delay', (element.getAttribute('data-monochrome-reveal') || '0') + 'ms'));
    chips.forEach((element, index) => element.style.setProperty('--pf-chip-delay', Math.min(index, 24) * 45 + 'ms'));
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(page);
    if (scrollPort) resizeObserver.observe(scrollPort);
    window.addEventListener('resize', resize, { passive: true });
    page.addEventListener('pointermove', move, { passive: true }); page.addEventListener('pointerleave', resetPointer);
    page.addEventListener('click', click); button?.addEventListener('click', toggle);
    preference.addEventListener('change', refresh); finePointer.addEventListener('change', refresh);
    document.addEventListener('visibilitychange', refresh);
    page.setAttribute('data-monochrome-enhanced', ''); resize();
    cleanups.push(() => {
      cancelAnimationFrame(frame); resetPointer(); resizeObserver.disconnect(); observer.disconnect();
      typewriters.forEach((state) => { clearTimeout(state.timer); state.node.textContent = state.original; });
      window.removeEventListener('resize', resize); page.removeEventListener('pointermove', move); page.removeEventListener('pointerleave', resetPointer);
      page.removeEventListener('click', click); button?.removeEventListener('click', toggle);
      preference.removeEventListener('change', refresh); finePointer.removeEventListener('change', refresh);
      document.removeEventListener('visibilitychange', refresh);
      ['enhanced', 'reduced', 'paused', 'running'].forEach((name) => page.removeAttribute('data-monochrome-' + name));
      page.style.removeProperty('--pf-monochrome-viewport');
      reveals.forEach((element) => { element.removeAttribute('data-monochrome-in-view'); element.style.removeProperty('--pf-reveal-delay'); });
      animated.forEach((element) => element.removeAttribute('data-monochrome-active'));
      intros.forEach((element) => element.style.removeProperty('--pf-intro-index'));
      chips.forEach((element) => element.style.removeProperty('--pf-chip-delay'));
      page.querySelectorAll<HTMLDetailsElement>('[data-monochrome-menu]').forEach((menu) => { menu.open = false; });
      if (button) { button.textContent = 'Pause motion'; button.setAttribute('aria-pressed', 'false'); button.removeAttribute('aria-disabled'); }
      draw(0);
    });
  });
  root.querySelectorAll<HTMLFormElement>('form[data-portfolio-shell]').forEach((form) => {
    const input = form.querySelector<HTMLInputElement>('input');
    const output = form.querySelector<HTMLElement>('[data-shell-output]');
    if (!input || !output) return;
    const submit = (event: Event) => {
      event.preventDefault();
      const command = input.value.trim().toLowerCase().slice(0, 80);
      if (!command) return;
      if (command === 'clear') { output.replaceChildren(); input.value = ''; return; }
      const email = form.dataset.email || 'No email configured. Use the contact link above.';
      const lines: Record<string, string> = {
        help: 'help · email · links · clear', email,
        links: Array.from(form.querySelectorAll<HTMLAnchorElement>('a')).map((a) => `${a.textContent}: ${a.href}`).join(' | ') || 'No links configured.',
      };
      const row = document.createElement('p');
      row.textContent = `$ ${command}\n${Object.hasOwn(lines, command) ? lines[command] : 'Unknown command. Type help for available commands.'}`;
      output.append(row);
      while (output.childElementCount > 6) output.firstElementChild?.remove();
      input.value = '';
    };
    form.addEventListener('submit', submit);
    cleanups.push(() => form.removeEventListener('submit', submit));
  });
  return () => cleanups.forEach((cleanup) => cleanup());
}
