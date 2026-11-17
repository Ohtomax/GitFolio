// A fixed local command allowlist. Nothing is executed or sent over a network.
// Self-contained so exported portfolios can include the same behavior.
export function mountPortfolioInteractions(root: ParentNode): () => void {
  const cleanups: Array<() => void> = [];
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
      row.textContent = `$ ${command}\n${lines[command] ?? 'Unknown command. Type help for available commands.'}`;
      output.append(row);
      while (output.childElementCount > 6) output.firstElementChild?.remove();
      input.value = '';
    };
    form.addEventListener('submit', submit);
    cleanups.push(() => form.removeEventListener('submit', submit));
  });
  return () => cleanups.forEach((cleanup) => cleanup());
}
