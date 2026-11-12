/** Keep adjacent chapters overlapping so a paused handoff never hides all content. */
export function getPublicChapterOpacity(
  progress: number,
  index: number,
  count: number
) {
  const start = index / count;
  const end = (index + 1) / count;
  const fade = 0.08;
  const incoming =
    index === 0
      ? 1
      : Math.max(0, Math.min(1, (progress - start + fade) / fade));
  const outgoing =
    index === count - 1 ? 1 : Math.max(0, Math.min(1, (end - progress) / fade));
  return Math.min(incoming, outgoing);
}
