export function createLayoutDropPreview(options: {
  items: readonly HTMLElement[];
  source: HTMLElement;
}): {
  move(before: HTMLElement | null, dx: number, dy: number): void;
  clear(): void;
};
