export interface KeysetPaginationResult<T> {
  items: T[];
  pagination: {
    has_more: boolean;
    next_cursor: string | null;
  };
}

export function encodeCursor(payload: Record<string, unknown>): string {
  const jsonStr = JSON.stringify(payload);
  return Buffer.from(jsonStr).toString("base64url");
}

export function decodeCursor<T = Record<string, unknown>>(cursorStr: string): T | null {
  try {
    const jsonStr = Buffer.from(cursorStr, "base64url").toString("utf8");
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}

export function buildPaginationResult<T>(
  items: T[],
  limit: number,
  cursorFieldExtractor: (lastItem: T) => Record<string, unknown>
): KeysetPaginationResult<T> {
  const hasMore = items.length > limit;
  const resultItems = hasMore ? items.slice(0, limit) : items;
  
  let nextCursor: string | null = null;
  if (hasMore && resultItems.length > 0) {
    const lastItem = resultItems[resultItems.length - 1];
    nextCursor = encodeCursor(cursorFieldExtractor(lastItem));
  }

  return {
    items: resultItems,
    pagination: {
      has_more: hasMore,
      next_cursor: nextCursor,
    },
  };
}
