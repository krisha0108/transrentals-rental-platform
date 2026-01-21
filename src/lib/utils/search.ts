export function getSearchTerms(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const normalized = trimmed.toLowerCase();
  const terms = new Set<string>();
  terms.add(normalized);
  normalized.split(/\s+/).forEach((segment) => {
    if (segment) {
      terms.add(segment);
    }
  });

  return Array.from(terms);
}
