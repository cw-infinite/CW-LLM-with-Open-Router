import { PanelLeft } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { MessageList } from "./MessageList";
import { Composer } from "./Composer";
import { EmptyState } from "./EmptyState";
import type { ImageAttachment } from "../types";

interface ChatWindowProps {
  sidebarCollapsed: boolean;
  onShowSidebar: () => void;
}

export function ChatWindow({ sidebarCollapsed, onShowSidebar }: ChatWindowProps) {
  const chats = useChatStore((s) => s.chats);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const activeStreams = useChatStore((s) => s.activeStreams);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const stopGenerating = useChatStore((s) => s.stopGenerating);
  const retryLastMessage = useChatStore((s) => s.retryLastMessage);
  const model = useSettingsStore((s) => s.connection.model);

  const chat = chats.find((c) => c.id === activeChatId);
  const isStreaming = !!activeChatId && !!activeStreams[activeChatId];

  const handleSend = (text: string, images: ImageAttachment[]) => {
    sendMessage(text, images.length ? images : undefined);
  };

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col" style={{ background: "var(--bg)" }}>
      <div
        className="flex h-14 shrink-0 items-center gap-2 px-4 sm:px-6"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {sidebarCollapsed && (
          <button
            onClick={onShowSidebar}
            className="grid h-8 w-8 place-items-center rounded-lg transition-colors hover:bg-[var(--bg-inset)]"
          >
            <PanelLeft size={17} style={{ color: "var(--text-secondary)" }} />
          </button>
        )}
        <span className="truncate text-[14px] font-medium" style={{ color: "var(--text)" }}>
          {chat?.title ?? "새 대화"}
        </span>
        <div className="flex-1" />
        <span
          className="truncate rounded-full px-2.5 py-1 text-[11.5px]"
          style={{ background: "var(--bg-inset)", color: "var(--text-tertiary)" }}
        >
          {model || "모델 미설정"}
        </span>
      </div>

      {chat && chat.messages.length > 0 ? (
        <MessageList messages={chat.messages} onRetry={() => activeChatId && retryLastMessage(activeChatId)} />
      ) : (
        <EmptyState onPick={(text) => handleSend(text, [])} />
      )}

      <Composer
        isStreaming={isStreaming}
        onSend={handleSend}
        onStop={() => activeChatId && stopGenerating(activeChatId)}
      />
    </div>
  );
}
