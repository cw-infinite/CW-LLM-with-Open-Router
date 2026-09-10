/** Small, dependency-free localStorage read/write helpers with safe fallbacks. */

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable — fail silently, app still works in-memory
  }
}

export const STORAGE_KEYS = {
  chats: "cwai:chats",
  activeChatId: "cwai:active-chat-id",
  settings: "cwai:settings",
} as const;
