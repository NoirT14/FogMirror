export class FullscreenController {
  private expanded = false;
  private fallback = false;
  private busy = false;
  private abort = new AbortController();
  private inertBefore = new Map<HTMLElement, boolean>();
  private shell: HTMLElement;
  private button: HTMLButtonElement;
  constructor(shell: HTMLElement, button: HTMLButtonElement) {
    this.shell = shell; this.button = button;
    const signal = this.abort.signal;
    button.addEventListener('click', () => void this.toggle(), {signal});
    document.addEventListener('fullscreenchange', () => {
      if (!this.fallback) this.update(document.fullscreenElement === shell);
    }, {signal});
    document.addEventListener('keydown', e => {
      if (!this.expanded) return;
      if (e.key === 'Escape') {
        if (this.fallback) { e.preventDefault(); this.fallback = false; this.update(false); }
        else if (document.fullscreenElement === shell) void document.exitFullscreen().catch(() => {});
      }
      if (e.key === 'Tab') {
        const focusable = [...shell.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]')].filter(el => el.getClientRects().length > 0);
        const first = focusable[0], last = focusable.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }, {signal});
  }
  private update(expanded: boolean) {
    const wasExpanded = this.expanded;
    this.expanded = expanded;
    this.shell.classList.toggle('is-expanded', expanded);
    document.documentElement.classList.toggle('mirror-expanded', expanded);
    this.button.setAttribute('aria-pressed', String(expanded));
    const label = expanded ? 'Thoát toàn màn hình' : 'Toàn màn hình';
    this.button.setAttribute('aria-label', label); this.button.title = label;
    this.button.querySelector('span')!.textContent = expanded ? 'Thu nhỏ' : 'Toàn màn hình';
    if (expanded && !wasExpanded) {
      for (const el of document.querySelectorAll<HTMLElement>('.site-header, .intro, .below-mirror, footer')) {
        this.inertBefore.set(el, el.inert); el.inert = true;
      }
    }
    if (!expanded) {
      for (const [el, inert] of this.inertBefore) el.inert = inert;
      this.inertBefore.clear();
      if (wasExpanded) this.button.focus({preventScroll: true});
    }
  }
  private async toggle() {
    if (this.busy) return;
    this.busy = true; this.button.disabled = true;
    try {
      if (this.expanded) {
        if (document.fullscreenElement === this.shell) await document.exitFullscreen();
        this.fallback = false; this.update(false);
      } else {
        if (document.fullscreenEnabled && this.shell.requestFullscreen) {
          try {
            await this.shell.requestFullscreen();
            this.fallback = false; this.update(document.fullscreenElement === this.shell);
            return;
          } catch { /* Embedded browsers may reject native fullscreen. Fill the tab instead. */ }
        }
        this.fallback = true; this.update(true);
      }
    } catch {
      // Preserve the visible state if the browser rejects an exit request.
      this.update(document.fullscreenElement === this.shell || this.fallback);
    } finally { this.busy = false; this.button.disabled = false; }
  }
  destroy() { this.abort.abort(); this.update(false); }
}
