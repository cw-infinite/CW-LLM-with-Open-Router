import type { Chat } from "../types";

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function groupChatsByRecency(chats: Chat[]): { label: string; chats: Chat[] }[] {
  const today = startOfDay(Date.now());
  const yesterday = today - 86_400_000;
  const weekAgo = today - 7 * 86_400_000;

  const buckets: Record<string, Chat[]> = {
    오늘: [],
    어제: [],
    "지난 7일": [],
    이전: [],
  };

  for (const chat of [...chats].sort((a, b) => b.updatedAt - a.updatedAt)) {
    const day = startOfDay(chat.updatedAt);
    if (day === today) buckets["오늘"].push(chat);
    else if (day === yesterday) buckets["어제"].push(chat);
    else if (day >= weekAgo) buckets["지난 7일"].push(chat);
    else buckets["이전"].push(chat);
  }

  return Object.entries(buckets)
    .filter(([, list]) => list.length > 0)
    .map(([label, list]) => ({ label, chats: list }));
}
