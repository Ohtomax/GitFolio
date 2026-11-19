// Application-owned, local interactions; user content is never executed.
// Self-contained so exported portfolios can include the same behavior.
export function mountPortfolioInteractions(root: ParentNode): () => void {
  const cleanups: Array<() => void> = [];
  root.querySelectorAll<HTMLElement>('[data-kinetic-page]').forEach((page) => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reveals = Array.from(page.querySelectorAll<HTMLElement>('[data-kinetic-reveal]'));
    const animated = Array.from(page.querySelectorAll<HTMLElement>('[data-kinetic-animate]'));
    const words = Array.from(page.querySelectorAll<HTMLElement>('[data-kinetic-word]'));
    const button = page.querySelector<HTMLButtonElement>('[data-kinetic-motion]');
    const tilts = Array.from(page.querySelectorAll<HTMLElement>('[data-kinetic-tilt]'));
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
      page.toggleAttribute('data-kinetic-reduced', preference.matches);
      page.toggleAttribute('data-kinetic-paused', paused);
      page.toggleAttribute('data-kinetic-running', !stopped);
      if (stopped || !pointer.matches) resetTilt();
      if (stopped) resetScroll(); else scheduleScroll();
      if (preference.matches || paused) reveals.forEach((element) => element.setAttribute('data-kinetic-in-view', ''));
      if (button) {
        button.textContent = preference.matches ? 'Reduced motion' : paused ? 'Resume motion' : 'Pause motion';
        button.setAttribute('aria-pressed', String(preference.matches || paused));
        button.setAttribute('aria-disabled', String(preference.matches));
      }
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (target.hasAttribute('data-kinetic-reveal') && isIntersecting) target.setAttribute('data-kinetic-in-view', '');
        if (target.hasAttribute('data-kinetic-animate')) target.toggleAttribute('data-kinetic-active', isIntersecting);
      });
      scheduleScroll();
    }, { threshold: .08 });
    new Set([...reveals, ...animated]).forEach((element) => observer.observe(element));
    words.forEach((word, index) => word.style.setProperty('--pf-word-index', String(Math.min(index, 24))));
    tilts.forEach((element) => {
      const canMove = () => !preference.matches && !paused && !document.hidden && pointer.matches
        && !!element.closest('[data-kinetic-active]');
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
      const menu = (event.target as Element).closest<HTMLDetailsElement>('[data-kinetic-menu]');
      if (menu && (event.target as Element).closest('a')) menu.open = false;
    };
    button?.addEventListener('click', toggle); page.addEventListener('click', close);
    preference.addEventListener('change', refresh); pointer.addEventListener('change', refresh);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('scroll', scheduleScroll, { capture: true, passive: true });
    window.addEventListener('resize', scheduleScroll, { passive: true });
    const layout = new ResizeObserver(scheduleScroll); layout.observe(page);
    if (scrollPort) layout.observe(scrollPort);
    page.setAttribute('data-kinetic-enhanced', ''); refresh();
    cleanups.push(() => {
      observer.disconnect(); layout.disconnect(); resetTilt(); resetScroll(); button?.removeEventListener('click', toggle); page.removeEventListener('click', close);
      preference.removeEventListener('change', refresh); pointer.removeEventListener('change', refresh);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('scroll', scheduleScroll, true); window.removeEventListener('resize', scheduleScroll);
      ['data-kinetic-enhanced', 'data-kinetic-reduced', 'data-kinetic-paused', 'data-kinetic-running'].forEach((attribute) => page.removeAttribute(attribute));
      reveals.forEach((element) => element.removeAttribute('data-kinetic-in-view'));
      animated.forEach((element) => element.removeAttribute('data-kinetic-active'));
      words.forEach((word) => word.style.removeProperty('--pf-word-index'));
      page.querySelectorAll<HTMLDetailsElement>('[data-kinetic-menu]').forEach((menu) => { menu.open = false; });
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
  root.querySelectorAll<HTMLDetailsElement>('[data-monochrome-menu]').forEach((menu) => {
    const close = (event: Event) => { if ((event.target as Element).closest('a')) menu.open = false; };
    menu.addEventListener('click', close);
    cleanups.push(() => menu.removeEventListener('click', close));
  });
  root.querySelectorAll<HTMLCanvasElement>('canvas[data-monochrome-particles]').forEach((canvas) => {
    const context = canvas.getContext('2d');
    const parent = canvas.parentElement;
    if (!context || !parent) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const color = getComputedStyle(parent).getPropertyValue('--pf-text').trim() || '#ffffff';
    const points = Array.from({ length: 28 }, (_, index) => ({ x: ((index * 137 + 29) % 997) / 997,
      y: ((index * 239 + 71) % 991) / 991, dx: index % 2 ? .0002 : -.00015, dy: index % 3 ? .00012 : -.0002 }));
    let width = 1, height = 1, frame = 0, visible = false, previousTime = 0;
    let pointer: { x: number; y: number } | undefined;
    const draw = (move: boolean) => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = color; context.strokeStyle = color; context.lineWidth = .6;
      points.forEach((point, index) => {
        if (move) { point.x = (point.x + point.dx + 1) % 1; point.y = (point.y + point.dy + 1) % 1; }
        const x = point.x * width, y = point.y * height;
        context.globalAlpha = .3; context.beginPath(); context.arc(x, y, 1.5, 0, Math.PI * 2); context.fill();
        for (let next = index + 1; next < points.length; next++) {
          const other = points[next], distance = Math.hypot(x - other.x * width, y - other.y * height);
          if (distance < 130) { context.globalAlpha = (1 - distance / 130) * .12; context.beginPath();
            context.moveTo(x, y); context.lineTo(other.x * width, other.y * height); context.stroke(); }
        }
        if (pointer) {
          const distance = Math.hypot(x - pointer.x, y - pointer.y);
          if (distance < 160) { context.globalAlpha = (1 - distance / 160) * .25; context.beginPath();
            context.moveTo(x, y); context.lineTo(pointer.x, pointer.y); context.stroke(); }
        }
      });
      context.globalAlpha = 1;
    };
    const animate = (time: number) => {
      if (time - previousTime >= 32) { draw(true); previousTime = time; }
      frame = requestAnimationFrame(animate);
    };
    const refresh = () => {
      cancelAnimationFrame(frame); frame = 0; draw(false);
      if (visible && !document.hidden && !preference.matches) frame = requestAnimationFrame(animate);
    };
    const resize = () => {
      width = Math.max(1, Math.min(parent.clientWidth, 1600)); height = Math.max(1, Math.min(parent.clientHeight, 1200));
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0); refresh();
    };
    const move = (event: PointerEvent) => {
      if (preference.matches || event.pointerType !== 'mouse') return;
      const rect = canvas.getBoundingClientRect();
      pointer = { x: (event.clientX - rect.left) * width / Math.max(1, rect.width), y: (event.clientY - rect.top) * height / Math.max(1, rect.height) };
    };
    const leave = () => { pointer = undefined; };
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(parent);
    const visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; refresh(); }); visibilityObserver.observe(canvas);
    parent.addEventListener('pointermove', move); parent.addEventListener('pointerleave', leave);
    preference.addEventListener('change', refresh); document.addEventListener('visibilitychange', refresh); resize();
    cleanups.push(() => {
      cancelAnimationFrame(frame); resizeObserver.disconnect(); visibilityObserver.disconnect();
      parent.removeEventListener('pointermove', move); parent.removeEventListener('pointerleave', leave);
      preference.removeEventListener('change', refresh); document.removeEventListener('visibilitychange', refresh);
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
