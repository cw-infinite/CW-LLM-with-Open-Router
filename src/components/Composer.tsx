import { useRef, useState, type KeyboardEvent } from "react";
import { nanoid } from "nanoid";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, ImagePlus, Square, X } from "lucide-react";
import type { ImageAttachment } from "../types";

interface ComposerProps {
  disabled?: boolean;
  isStreaming: boolean;
  onSend: (text: string, images: ImageAttachment[]) => void;
  onStop: () => void;
}

const MAX_IMAGES = 4;

export function Composer({ disabled, isStreaming, onSend, onStop }: ComposerProps) {
  const [text, setText] = useState("");
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  };

  const canSend = (text.trim().length > 0 || images.length > 0) && !disabled && !isStreaming;

  const handleSend = () => {
    if (!canSend) return;
    onSend(text.trim(), images);
    setText("");
    setImages([]);
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter (or IME composition) inserts a newline
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_IMAGES - images.length;
    const picked = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, remaining);
    picked.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => [
          ...prev,
          { id: nanoid(), dataUrl: reader.result as string, name: file.name },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="px-4 pb-4 pt-2 sm:px-6">
      <div
        className="mx-auto flex w-full max-w-[720px] flex-col gap-2 rounded-[var(--radius-lg)] px-3 py-2.5 shadow-[var(--shadow-panel)]"
        style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        <AnimatePresence>
          {images.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex flex-wrap gap-2 overflow-hidden px-1 pt-1"
            >
              {images.map((img) => (
                <div key={img.id} className="relative">
                  <img
                    src={img.dataUrl}
                    alt={img.name}
                    className="h-16 w-16 rounded-[var(--radius-sm)] object-cover"
                    style={{ border: "1px solid var(--border)" }}
                  />
                  <button
                    onClick={() => setImages((prev) => prev.filter((i) => i.id !== img.id))}
                    className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full"
                    style={{ background: "var(--text)", color: "var(--surface)" }}
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= MAX_IMAGES}
            title="이미지 첨부"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-md)] transition-colors hover:bg-[var(--bg-inset)] disabled:opacity-40"
          >
            <ImagePlus size={19} style={{ color: "var(--text-secondary)" }} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              resize();
            }}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="메시지를 입력하세요… (Enter로 전송, Shift+Enter로 줄바꿈)"
            className="max-h-[220px] flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-relaxed outline-none placeholder:text-[var(--text-tertiary)]"
            style={{ color: "var(--text)" }}
          />

          {isStreaming ? (
            <button
              onClick={onStop}
              title="생성 중지"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition-transform active:scale-95"
              style={{ background: "var(--text)", color: "var(--surface)" }}
            >
              <Square size={13} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!canSend}
              title="전송"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition-transform active:scale-95 disabled:opacity-30"
              style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
            >
              <ArrowUp size={17} />
            </button>
          )}
        </div>
      </div>
      <p className="mx-auto mt-2 max-w-[720px] text-center text-[11.5px]" style={{ color: "var(--text-tertiary)" }}>
        AI가 생성한 응답에는 오류가 있을 수 있습니다.
      </p>
    </div>
  );
}
