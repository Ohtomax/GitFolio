// A fixed local command allowlist. Nothing is executed or sent over a network.
// Self-contained so exported portfolios can include the same behavior.
export function mountPortfolioInteractions(root: ParentNode): () => void {
  const cleanups: Array<() => void> = [];
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
