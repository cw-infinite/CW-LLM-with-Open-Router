import { ArrowDown } from "lucide-react";
import type { ChatMessage } from "../types";
import { MessageBubble } from "./MessageBubble";
import { useStickToBottom } from "../hooks/useStickToBottom";

interface MessageListProps {
  messages: ChatMessage[];
  onRetry: () => void;
}

export function MessageList({ messages, onRetry }: MessageListProps) {
  const { ref, pinned, scrollToBottom } = useStickToBottom<HTMLDivElement>([
    messages.length,
    messages[messages.length - 1]?.content,
  ]);

  return (
    <div className="relative flex-1 overflow-hidden">
      <div ref={ref} className="h-full overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-1 py-6">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} onRetry={m.role === "assistant" ? onRetry : undefined} />
          ))}
        </div>
      </div>

      {!pinned && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] shadow-[var(--shadow-panel)] transition-transform hover:scale-105"
          style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
        >
          <ArrowDown size={13} />
          최신 메시지로
        </button>
      )}
    </div>
  );
}
