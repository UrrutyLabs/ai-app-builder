export interface Edit {
  search: string;
  replace: string;
}

export interface ApplyEditsResult {
  content: string;
  failures: Array<{ search: string; reason: string }>;
}

/**
 * Apply SEARCH/REPLACE edits to a string sequentially. Each edit operates on
 * the current state of the content, so later edits see earlier replacements.
 * An edit fails if its search string is missing or matches more than once.
 *
 * Pure function. No external imports — safe to use in tests without mocking.
 */
export function applyEdits(original: string, edits: Edit[]): ApplyEditsResult {
  let content = original;
  const failures: ApplyEditsResult["failures"] = [];
  for (const edit of edits) {
    const firstIdx = content.indexOf(edit.search);
    if (firstIdx < 0) {
      failures.push({
        search: edit.search,
        reason: "search string not found in current file",
      });
      continue;
    }
    const lastIdx = content.lastIndexOf(edit.search);
    if (firstIdx !== lastIdx) {
      failures.push({
        search: edit.search,
        reason:
          "search string is ambiguous (matches more than once); add surrounding context to make it unique",
      });
      continue;
    }
    content =
      content.slice(0, firstIdx) +
      edit.replace +
      content.slice(firstIdx + edit.search.length);
  }
  return { content, failures };
}
