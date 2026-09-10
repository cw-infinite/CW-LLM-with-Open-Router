import { Sparkles } from "lucide-react";

const SUGGESTIONS = [
  "이번 주에 처리할 업무 우선순위를 정리해줘",
  "면접에서 받을 만한 예상 질문 5개 만들어줘",
  "이 코드에서 버그를 찾아줘",
  "여행 일정 짜는 걸 도와줘",
];

export function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div
        className="mb-4 grid h-12 w-12 place-items-center rounded-[var(--radius-lg)]"
        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
      >
        <Sparkles size={22} />
      </div>
      <h1
        className="mb-1.5 text-[22px] font-semibold"
        style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}
      >
        무엇을 도와드릴까요?
      </h1>
      <p className="mb-8 text-[14px]" style={{ color: "var(--text-secondary)" }}>
        메시지를 입력해 대화를 시작하세요.
      </p>
      <div className="grid w-full max-w-[560px] grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="rounded-[var(--radius-md)] px-4 py-3 text-left text-[13.5px] transition-colors"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
