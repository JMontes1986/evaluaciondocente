/**
 * Allow-list text before embedding it in PostgREST's `.or()` filter grammar.
 * Values passed through `.eq()`, `.in()` and similar methods are parameterized
 * by the client and do not need this transformation.
 */
export function sanitizePostgrestSearch(value: string, maxLength = 80) {
  return value
    .normalize("NFKC")
    .slice(0, maxLength)
    .replace(/[^\p{L}\p{N}\s@.\-']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
