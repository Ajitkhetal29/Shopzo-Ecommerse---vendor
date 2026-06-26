/**
 * Must match `basePath` / `assetPrefix` in `next.config.ts`.
 */
export const APP_BASE_PATH = "/vendor" as const;

export function publicUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${APP_BASE_PATH}${normalized}`;
}
