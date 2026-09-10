import { useState } from "react";
import { motion } from "framer-motion";
import { PenSquare, Trash2, Pencil, Check, X, Settings, PanelLeftClose, PanelLeft } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { groupChatsByRecency } from "../lib/dateGroups";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onOpenSettings: () => void;
}

export function Sidebar({ collapsed, onToggleCollapsed, onOpenSettings }: SidebarProps) {
  const chats = useChatStore((s) => s.chats);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const newChat = useChatStore((s) => s.newChat);
  const selectChat = useChatStore((s) => s.selectChat);
  const deleteChat = useChatStore((s) => s.deleteChat);
  const renameChat = useChatStore((s) => s.renameChat);

  const groups = groupChatsByRecency(chats);

  if (collapsed) {
    return (
      <div className="flex h-full w-[64px] flex-col items-center gap-2 border-r py-3" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={onToggleCollapsed}
          className="grid h-9 w-9 place-items-center rounded-lg transition-colors hover:bg-[var(--bg-inset)]"
          title="사이드바 펼치기"
        >
          <PanelLeft size={18} style={{ color: "var(--text-secondary)" }} />
        </button>
        <button
          onClick={newChat}
          className="grid h-9 w-9 place-items-center rounded-lg transition-colors hover:bg-[var(--bg-inset)]"
          title="새 대화"
        >
          <PenSquare size={18} style={{ color: "var(--text-secondary)" }} />
        </button>
        <div className="flex-1" />
        <button
          onClick={onOpenSettings}
          className="grid h-9 w-9 place-items-center rounded-lg transition-colors hover:bg-[var(--bg-inset)]"
          title="설정"
        >
          <Settings size={18} style={{ color: "var(--text-secondary)" }} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-[272px] flex-col border-r" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center gap-2 px-3 pb-2 pt-4">
        <span
          className="text-[15px] font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}
        >
          CW.AI
        </span>
        <div className="flex-1" />
        <button
          onClick={onToggleCollapsed}
          className="grid h-8 w-8 place-items-center rounded-lg transition-colors hover:bg-[var(--bg-inset)]"
          title="사이드바 접기"
        >
          <PanelLeftClose size={17} style={{ color: "var(--text-secondary)" }} />
        </button>
      </div>

      <div className="px-3 pb-3">
        <button
          onClick={newChat}
          className="flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2.5 text-[13.5px] font-medium transition-colors"
          style={{
            background: "var(--accent-soft)",
            color: "var(--accent)",
          }}
        >
          <PenSquare size={16} />
          새 대화
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {groups.length === 0 && (
          <p className="px-3 py-6 text-center text-[13px]" style={{ color: "var(--text-tertiary)" }}>
            아직 대화가 없습니다.
          </p>
        )}
        {groups.map((group) => (
          <div key={group.label} className="mb-3">
            <p
              className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide"
              style={{ color: "var(--text-tertiary)" }}
            >
              {group.label}
            </p>
            {group.chats.map((chat) => (
              <ChatListItem
                key={chat.id}
                title={chat.title}
                active={chat.id === activeChatId}
                onSelect={() => selectChat(chat.id)}
                onDelete={() => deleteChat(chat.id)}
                onRename={(title) => renameChat(chat.id, title)}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="border-t px-2 py-2" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={onOpenSettings}
          className="flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2.5 text-[13.5px] transition-colors hover:bg-[var(--bg-inset)]"
          style={{ color: "var(--text-secondary)" }}
        >
          <Settings size={16} />
          설정
        </button>
      </div>
    </div>
  );
}

function ChatListItem({
  title,
  active,
  onSelect,
  onDelete,
  onRename,
}: {
  title: string;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  const commit = () => {
    const clean = draft.trim();
    if (clean) onRename(clean);
    setEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      onClick={!editing ? onSelect : undefined}
      className="group relative mb-0.5 flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-[13.5px] transition-colors"
      style={{
        background: active ? "var(--bg-inset)" : "transparent",
        color: active ? "var(--text)" : "var(--text-secondary)",
        cursor: editing ? "default" : "pointer",
      }}
    >
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
          className="w-full bg-transparent text-[13.5px] outline-none"
          style={{ color: "var(--text)" }}
        />
      ) : (
        <span className="flex-1 truncate">{title}</span>
      )}

      {editing ? (
        <div className="flex shrink-0 gap-0.5">
          <IconBtn onClick={commit} title="저장">
            <Check size={13} />
          </IconBtn>
          <IconBtn onClick={() => setEditing(false)} title="취소">
            <X size={13} />
          </IconBtn>
        </div>
      ) : (
        <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <IconBtn
            onClick={(e) => {
              e.stopPropagation();
              setDraft(title);
              setEditing(true);
            }}
            title="이름 바꾸기"
          >
            <Pencil size={13} />
          </IconBtn>
          <IconBtn
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="삭제"
            danger
          >
            <Trash2 size={13} />
          </IconBtn>
        </div>
      )}
    </motion.div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="grid h-6 w-6 place-items-center rounded-md transition-colors hover:bg-[var(--border)]"
      style={{ color: danger ? "var(--danger)" : "var(--text-tertiary)" }}
    >
      {children}
    </button>
  );
}
