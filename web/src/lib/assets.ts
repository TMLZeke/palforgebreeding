// Public files must be resolved against Vite's base so the app also works
// when hosted under a sub-path (e.g. GitHub Pages: /palforgebreeding/).
export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}
