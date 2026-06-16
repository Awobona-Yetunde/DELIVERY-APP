export function startPolling(
  fn: () => Promise<void>,
  intervalMs: number,
): () => void {
  let active = true;

  const run = async () => {
    if (!active) return;
    try {
      await fn();
    } catch {}
    if (active) setTimeout(run, intervalMs);
  };

  run();
  return () => {
    active = false;
  };
}
