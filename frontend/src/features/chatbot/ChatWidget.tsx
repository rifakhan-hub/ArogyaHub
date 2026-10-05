import { Bot, SendHorizonal, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { answer, SUGGESTIONS } from "./answers";

interface Message {
  from: "assistant" | "you";
  text: string;
}

const WELCOME: Message = {
  from: "assistant",
  text: "Hi, I'm the AarogyaHub assistant. Ask me about booking a doctor, fees, your reports or how video consultations work.",
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [messages, thinking]);

  function ask(question: string) {
    const text = question.trim();
    if (!text || thinking) return;
    setMessages((m) => [...m, { from: "you", text }]);
    setDraft("");
    setThinking(true);
    setTimeout(() => {
      setMessages((m) => [...m, { from: "assistant", text: answer(text) }]);
      setThinking(false);
    }, 700);
  }

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="AarogyaHub AI assistant"
          className="fixed bottom-24 right-6 z-50 flex h-[560px] max-h-[calc(100dvh-8rem)] w-[400px] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-3"
        >
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-on-primary">
              <Sparkles className="size-5" aria-hidden />
            </span>
            <div className="flex-1">
              <p className="text-body font-semibold text-text">AarogyaHub AI</p>
              <p className="flex items-center gap-1.5 text-caption text-muted">
                <span className="size-1.5 rounded-full bg-success" aria-hidden />
                Online
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="inline-flex size-9 items-center justify-center rounded-md text-subtle hover:bg-surface-muted hover:text-text"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <div ref={list} className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4" aria-live="polite">
            {messages.map((message, i) => (
              <div key={i} className={cn("flex gap-2", message.from === "you" && "justify-end")}>
                {message.from === "assistant" && (
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <Bot className="size-4" aria-hidden />
                  </span>
                )}
                <p
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-small",
                    message.from === "you" ? "rounded-br-sm bg-primary text-on-primary" : "rounded-bl-sm bg-surface-muted text-text",
                  )}
                >
                  <span className="sr-only">{message.from === "you" ? "You: " : "Assistant: "}</span>
                  {message.text}
                </p>
              </div>
            ))}
            {thinking && (
              <div className="flex gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Bot className="size-4" aria-hidden />
                </span>
                <p className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-surface-muted px-4 py-3" aria-label="Assistant is typing">
                  {[0, 150, 300].map((delay) => (
                    <span key={delay} className="size-1.5 animate-pulse rounded-full bg-subtle" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </p>
              </div>
            )}

            {messages.length === 1 && (
              <div className="mt-1 flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => ask(suggestion)}
                    className="rounded-full border border-border-strong px-3 py-1.5 text-caption font-medium text-text hover:bg-surface-muted"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(draft);
            }}
            className="border-t border-border p-3"
          >
            <div className="flex items-center gap-2 rounded-md border border-border-strong p-1.5 focus-within:border-focus">
              <label htmlFor="assistant-question" className="sr-only">
                Your question
              </label>
              <input
                ref={input}
                id="assistant-question"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask anything about AarogyaHub…"
                autoComplete="off"
                className="h-10 flex-1 bg-transparent px-2 text-small text-text placeholder:text-subtle focus-visible:outline-none"
              />
              <button
                type="submit"
                disabled={!draft.trim() || thinking}
                aria-label="Send"
                className="inline-flex size-10 items-center justify-center rounded-md bg-primary text-on-primary hover:bg-primary-hover disabled:opacity-40"
              >
                <SendHorizonal className="size-4" aria-hidden />
              </button>
            </div>
            <p className="mt-2 text-center text-caption text-subtle">General information only, not a diagnosis.</p>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        className="group fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-2 hover:bg-primary-hover"
      >
        {open ? <X className="size-6" aria-hidden /> : <Sparkles className="size-6" aria-hidden />}
        {!open && (
          <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-md border border-border bg-surface px-3 py-1.5 text-small font-medium text-text opacity-0 shadow-2 group-hover:opacity-100">
            Ask AarogyaHub AI
          </span>
        )}
      </button>
    </>
  );
}
