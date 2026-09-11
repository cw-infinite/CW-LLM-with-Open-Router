import { create } from "zustand";
import { nanoid } from "nanoid";
import type { Chat, ChatMessage, ImageAttachment } from "../types";
import { loadJSON, saveJSON, STORAGE_KEYS } from "../lib/storage";
import { streamChatCompletion, OpenRouterRequestError } from "../lib/openrouter";
import { useSettingsStore } from "./useSettingsStore";

function makeChat(): Chat {
  const now = Date.now();
  return {
    id: nanoid(),
    title: "새 대화",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

function deriveTitle(text: string): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (!clean) return "새 대화";
  return clean.length > 40 ? clean.slice(0, 40) + "…" : clean;
}

interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
  /** chatId -> AbortController, only present while a response is streaming */
  activeStreams: Record<string, AbortController>;

  newChat: () => void;
  selectChat: (id: string) => void;
  deleteChat: (id: string) => void;
  renameChat: (id: string, title: string) => void;
  clearAllChats: () => void;

  sendMessage: (text: string, images?: ImageAttachment[]) => Promise<void>;
  stopGenerating: (chatId: string) => void;
  retryLastMessage: (chatId: string) => Promise<void>;
}

function persistChats(chats: Chat[]) {
  saveJSON(STORAGE_KEYS.chats, chats);
}

const initialChats = loadJSON<Chat[]>(STORAGE_KEYS.chats, []);
const initialActiveId = loadJSON<string | null>(STORAGE_KEYS.activeChatId, null);

export const useChatStore = create<ChatState>((set, get) => ({
  chats: initialChats,
  activeChatId:
    initialActiveId && initialChats.some((c) => c.id === initialActiveId)
      ? initialActiveId
      : (initialChats[0]?.id ?? null),
  activeStreams: {},

  newChat: () => {
    const chat = makeChat();
    const chats = [chat, ...get().chats];
    set({ chats, activeChatId: chat.id });
    persistChats(chats);
    saveJSON(STORAGE_KEYS.activeChatId, chat.id);
  },

  selectChat: (id) => {
    set({ activeChatId: id });
    saveJSON(STORAGE_KEYS.activeChatId, id);
  },

  deleteChat: (id) => {
    const stream = get().activeStreams[id];
    stream?.abort();
    const chats = get().chats.filter((c) => c.id !== id);
    let activeChatId = get().activeChatId;
    if (activeChatId === id) {
      activeChatId = chats[0]?.id ?? null;
    }
    set({ chats, activeChatId });
    persistChats(chats);
    saveJSON(STORAGE_KEYS.activeChatId, activeChatId);
  },

  renameChat: (id, title) => {
    const chats = get().chats.map((c) => (c.id === id ? { ...c, title } : c));
    set({ chats });
    persistChats(chats);
  },

  clearAllChats: () => {
    Object.values(get().activeStreams).forEach((c) => c.abort());
    set({ chats: [], activeChatId: null, activeStreams: {} });
    persistChats([]);
    saveJSON(STORAGE_KEYS.activeChatId, null);
  },

  sendMessage: async (text, images) => {
    let chatId = get().activeChatId;
    let chats = get().chats;

    if (!chatId || !chats.some((c) => c.id === chatId)) {
      const chat = makeChat();
      chats = [chat, ...chats];
      chatId = chat.id;
      set({ chats, activeChatId: chatId });
    }

    const userMsg: ChatMessage = {
      id: nanoid(),
      role: "user",
      content: text,
      images,
      createdAt: Date.now(),
    };
    const assistantMsg: ChatMessage = {
      id: nanoid(),
      role: "assistant",
      content: "",
      createdAt: Date.now(),
      streaming: true,
    };

    chats = get().chats.map((c) => {
      if (c.id !== chatId) return c;
      const isFirstMessage = c.messages.length === 0;
      return {
        ...c,
        title: isFirstMessage ? deriveTitle(text) : c.title,
        messages: [...c.messages, userMsg, assistantMsg],
        updatedAt: Date.now(),
      };
    });
    set({ chats });
    persistChats(chats);

    await runAssistantTurn(chatId, assistantMsg.id, set, get);
  },

  stopGenerating: (chatId) => {
    get().activeStreams[chatId]?.abort();
  },

  retryLastMessage: async (chatId) => {
    const chat = get().chats.find((c) => c.id === chatId);
    if (!chat) return;
    const lastAssistantIdx = [...chat.messages].reverse().findIndex((m) => m.role === "assistant");
    if (lastAssistantIdx === -1) return;
    const idx = chat.messages.length - 1 - lastAssistantIdx;
    const resetMsg: ChatMessage = {
      ...chat.messages[idx],
      content: "",
      error: undefined,
      streaming: true,
      createdAt: Date.now(),
    };
    const chats = get().chats.map((c) =>
      c.id === chatId ? { ...c, messages: c.messages.map((m, i) => (i === idx ? resetMsg : m)) } : c,
    );
    set({ chats });
    persistChats(chats);
    await runAssistantTurn(chatId, resetMsg.id, set, get);
  },
}));

async function runAssistantTurn(
  chatId: string,
  assistantMsgId: string,
  set: (partial: Partial<ChatState> | ((s: ChatState) => Partial<ChatState>)) => void,
  get: () => ChatState,
) {
  const controller = new AbortController();
  set((s) => ({ activeStreams: { ...s.activeStreams, [chatId]: controller } }));

  const applyToAssistant = (updater: (m: ChatMessage) => ChatMessage) => {
    const chats = get().chats.map((c) => {
      if (c.id !== chatId) return c;
      return {
        ...c,
        messages: c.messages.map((m) => (m.id === assistantMsgId ? updater(m) : m)),
        updatedAt: Date.now(),
      };
    });
    set({ chats });
    persistChats(chats);
  };

  const { connection } = useSettingsStore.getState();
  const chat = get().chats.find((c) => c.id === chatId);
  const historyForModel = (chat?.messages ?? []).filter((m) => m.id !== assistantMsgId);

  try {
    let buffer = "";
    await streamChatCompletion({
      apiKey: connection.apiKey,
      model: connection.model,
      messages: historyForModel,
      signal: controller.signal,
      onDelta: (delta) => {
        buffer += delta;
        applyToAssistant((m) => ({ ...m, content: buffer }));
      },
    });
    applyToAssistant((m) => ({ ...m, streaming: false }));
  } catch (err) {
    const message =
      err instanceof OpenRouterRequestError ? err.message : "응답을 가져오는 중 오류가 발생했습니다.";
    applyToAssistant((m) => ({ ...m, streaming: false, error: message }));
  } finally {
    set((s) => {
      const rest = { ...s.activeStreams };
      delete rest[chatId];
      return { activeStreams: rest };
    });
  }
}
