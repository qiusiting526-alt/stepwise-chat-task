"use client";

import {
  ArrowUp,
  Check,
  ChevronRight,
  Languages,
  MessageCircleMore,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type Locale = "zh" | "en";
type Phase = "chat" | "ready" | "running" | "completed";
type Author = "guide" | "user";

type Message = {
  id: number;
  author: Author;
  text: Record<Locale, string> | string;
};

const copy = {
  zh: {
    locale: "中文",
    switchLabel: "切换到英文",
    eyebrow: "30 秒微行动",
    title: "先动一点，\n再让动力跟上。",
    description: "告诉我你卡住的地方。我会把它缩成一个现在就能开始的小动作。",
    completedLabel: "今日完成",
    minutesLabel: "专注分钟",
    chatLabel: "你的微行动陪伴",
    prompt: "现在最想推进什么？不用想完整，说说你卡在哪里。",
    placeholder: "例如：我一直拖着没写周报…",
    send: "发送",
    reply: "收到。先不要解决全部问题——打开文档，只写下第一行标题。",
    actionLabel: "建议行动",
    action: "打开文档，写下第一行标题",
    actionHint: "只做这一小步，30 秒就够。",
    start: "开始行动",
    focus: "本次专注",
    keepOpen: "保持这个页面打开，只做眼前这一小步。",
    cancel: "取消行动",
    completeTitle: "很好，你已经开始了。",
    completeBody: "一次小小的启动，也是在把事情往前推。",
    completed: "已完成",
    again: "再来一轮",
    reset: "换个任务",
    waiting: "正在整理一个小行动",
    seconds: "秒",
    statusReady: "行动已准备好",
    statusRunning: "倒计时进行中",
    statusCompleted: "行动已完成",
    inputRequired: "先写下你卡住的事情。",
    tagline: "Make it tiny. Make it real.",
  },
  en: {
    locale: "EN",
    switchLabel: "Switch to Chinese",
    eyebrow: "30-second micro action",
    title: "Move a little.\nLet momentum follow.",
    description: "Tell me where you feel stuck. I will turn it into one tiny action you can start now.",
    completedLabel: "Done today",
    minutesLabel: "Focus minutes",
    chatLabel: "Your micro-action companion",
    prompt: "What would you like to move forward? Tell me where you feel stuck.",
    placeholder: "For example: I keep avoiding my weekly note…",
    send: "Send",
    reply: "Got it. Do not solve everything yet—open the document and write only the first heading.",
    actionLabel: "Suggested action",
    action: "Open the document and write the first heading",
    actionHint: "Only this one step. Thirty seconds is enough.",
    start: "Start action",
    focus: "Current focus",
    keepOpen: "Keep this page open and focus on the small step in front of you.",
    cancel: "Cancel action",
    completeTitle: "Nice. You have started.",
    completeBody: "A tiny start still moves the work forward.",
    completed: "Completed",
    again: "Go again",
    reset: "New task",
    waiting: "Shaping one small action",
    seconds: "sec",
    statusReady: "Action is ready",
    statusRunning: "Countdown in progress",
    statusCompleted: "Action completed",
    inputRequired: "Write down what feels stuck first.",
    tagline: "Make it tiny. Make it real.",
  },
} as const;

const initialMessage: Message = {
  id: 1,
  author: "guide",
  text: {
    zh: "嗨，今天想从哪里开始？我们只找一个小到不会拒绝的动作。",
    en: "Hi. Where would you like to begin? We only need one action small enough to say yes to.",
  },
};

function messageText(message: Message, locale: Locale) {
  return typeof message.text === "string" ? message.text : message.text[locale];
}

function CountdownRing({
  remaining,
  total,
  locale,
}: {
  remaining: number;
  total: number;
  locale: Locale;
}) {
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, remaining / total));
  const offset = circumference * (1 - progress);

  return (
    <div className="countdown-ring" aria-label={`${remaining} ${copy[locale].seconds}`}>
      <svg viewBox="0 0 180 180" role="img" aria-hidden="true">
        <circle className="ring-track" cx="90" cy="90" r={radius} />
        <circle
          className="ring-progress"
          cx="90"
          cy="90"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="ring-value" aria-live="polite">
        <strong>{remaining}</strong>
        <span>{copy[locale].seconds}</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [locale, setLocale] = useState<Locale>("zh");
  const [phase, setPhase] = useState<Phase>("chat");
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState("");
  const [remaining, setRemaining] = useState(30);
  const [cycles, setCycles] = useState(0);
  const [isReplying, setIsReplying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remainingRef = useRef(30);
  const replyRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageId = useRef(2);
  const t = copy[locale];

  const minutes = cycles === 0 ? "0" : cycles === 1 ? "<1" : String(Math.ceil(cycles / 2));
  const currentStatus = useMemo(() => {
    if (phase === "running") return t.statusRunning;
    if (phase === "completed") return t.statusCompleted;
    if (phase === "ready") return t.statusReady;
    return t.chatLabel;
  }, [phase, t]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
      if (replyRef.current) clearTimeout(replyRef.current);
    };
  }, [clearTimer]);

  const completeAction = useCallback(() => {
    clearTimer();
    remainingRef.current = 0;
    setRemaining(0);
    setCycles((value) => value + 1);
    setPhase("completed");
  }, [clearTimer]);

  const startAction = useCallback(() => {
    if (phase === "running" || intervalRef.current) return;
    remainingRef.current = 30;
    setRemaining(30);
    setPhase("running");

    intervalRef.current = setInterval(() => {
      const next = Math.max(0, remainingRef.current - 1);
      remainingRef.current = next;
      setRemaining(next);
      if (next === 0) completeAction();
    }, 1000);
  }, [completeAction, phase]);

  const cancelAction = () => {
    clearTimer();
    remainingRef.current = 30;
    setRemaining(30);
    setPhase("ready");
  };

  const runAgain = () => {
    clearTimer();
    remainingRef.current = 30;
    setRemaining(30);
    setPhase("ready");
  };

  const resetConversation = () => {
    clearTimer();
    if (replyRef.current) clearTimeout(replyRef.current);
    setMessages([initialMessage]);
    setInput("");
    remainingRef.current = 30;
    setRemaining(30);
    setPhase("chat");
    setIsReplying(false);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isReplying || phase === "running") return;

    setMessages((value) => [
      ...value,
      { id: messageId.current++, author: "user", text: trimmed },
    ]);
    setInput("");
    setIsReplying(true);

    replyRef.current = setTimeout(() => {
      setMessages((value) => [
        ...value,
        {
          id: messageId.current++,
          author: "guide",
          text: { zh: copy.zh.reply, en: copy.en.reply },
        },
      ]);
      setIsReplying(false);
      setPhase("ready");
    }, 650);
  };

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <a className="brand" href="#top" aria-label="Tiny Step home">
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
          <span>
            <strong>Tiny Step</strong>
            <small>STEPWISE COMPANION</small>
          </span>
        </a>
        <button
          className="language-button"
          type="button"
          onClick={() => setLocale((value) => (value === "zh" ? "en" : "zh"))}
          aria-label={t.switchLabel}
        >
          <Languages size={17} aria-hidden="true" />
          <span>{locale === "zh" ? "EN" : "中"}</span>
        </button>
      </header>

      <section className="workspace" id="top">
        <aside className="intro-panel">
          <div className="intro-copy">
            <div className="eyebrow">
              <Sparkles size={15} aria-hidden="true" />
              {t.eyebrow}
            </div>
            <h1>{t.title}</h1>
            <p>{t.description}</p>
          </div>

          <div className="rhythm-card" aria-label="Daily rhythm">
            <div className="rhythm-heading">
              <span>01</span>
              <div className="mini-bars" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className="metrics">
              <div>
                <strong data-testid="cycle-count">{cycles}</strong>
                <span>{t.completedLabel}</span>
              </div>
              <div>
                <strong>{minutes}</strong>
                <span>{t.minutesLabel}</span>
              </div>
            </div>
          </div>

          <div className="quote-card">
            <span>“</span>
            <p>{locale === "zh" ? "不用做完，先让事情动起来。" : "You do not need to finish. Just get it moving."}</p>
          </div>
          <p className="intro-tagline">{t.tagline}</p>
        </aside>

        <section className="companion-card" aria-labelledby="companion-title">
          <div className="card-heading">
            <div>
              <span className="section-kicker">{t.chatLabel}</span>
              <h2 id="companion-title">{currentStatus}</h2>
            </div>
            <span className={`phase-dot phase-${phase}`} aria-hidden="true" />
          </div>

          <div className="conversation" aria-live="polite">
            {messages.map((message) => (
              <div className={`message-row ${message.author}`} key={message.id}>
                {message.author === "guide" && (
                  <span className="avatar" aria-hidden="true">
                    <MessageCircleMore size={18} />
                  </span>
                )}
                <p>{messageText(message, locale)}</p>
              </div>
            ))}
            {isReplying && (
              <div className="message-row guide">
                <span className="avatar" aria-hidden="true">
                  <MessageCircleMore size={18} />
                </span>
                <p className="typing">
                  <span />
                  <span />
                  <span />
                  {t.waiting}
                </p>
              </div>
            )}
          </div>

          {phase === "chat" && messages.length === 1 && (
            <div className="prompt-card">
              <span>01</span>
              <p>{t.prompt}</p>
            </div>
          )}

          {phase === "ready" && (
            <section className="action-card" aria-label={t.actionLabel}>
              <div className="action-icon">
                <Play size={20} fill="currentColor" aria-hidden="true" />
              </div>
              <div className="action-copy">
                <span>{t.actionLabel}</span>
                <strong>{t.action}</strong>
                <small>{t.actionHint}</small>
              </div>
              <button type="button" className="primary-button" onClick={startAction}>
                {t.start}
                <ChevronRight size={17} aria-hidden="true" />
              </button>
            </section>
          )}

          {phase === "running" && (
            <section className="focus-card">
              <CountdownRing remaining={remaining} total={30} locale={locale} />
              <div className="focus-copy">
                <span>{t.focus}</span>
                <h3>{t.action}</h3>
                <p>{t.keepOpen}</p>
                <button type="button" className="quiet-button" onClick={cancelAction}>
                  <X size={16} aria-hidden="true" />
                  {t.cancel}
                </button>
              </div>
            </section>
          )}

          {phase === "completed" && (
            <section className="complete-card">
              <div className="complete-check" aria-hidden="true">
                <Check size={25} />
              </div>
              <div className="complete-copy">
                <span>{t.completed}</span>
                <h3>{t.completeTitle}</h3>
                <p>{t.completeBody}</p>
              </div>
              <div className="complete-actions">
                <button type="button" className="primary-button" onClick={runAgain}>
                  <RotateCcw size={17} aria-hidden="true" />
                  {t.again}
                </button>
                <button type="button" className="secondary-button" onClick={resetConversation}>
                  {t.reset}
                </button>
              </div>
            </section>
          )}

          <form className="composer" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="message-input">
              {t.placeholder}
            </label>
            <textarea
              id="message-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder={t.placeholder}
              rows={1}
              disabled={isReplying || phase === "running"}
            />
            <button
              type="submit"
              className="send-button"
              aria-label={t.send}
              disabled={!input.trim() || isReplying || phase === "running"}
            >
              <ArrowUp size={20} aria-hidden="true" />
            </button>
          </form>
        </section>
      </section>

      <footer>
        <span>{new Date().getFullYear()} · Tiny Step</span>
        <span className="footer-note">
          <Pause size={13} aria-hidden="true" />
          {locale === "zh" ? "无需登录，数据只留在当前页面" : "No sign-in. This session stays on this page."}
        </span>
      </footer>
    </main>
  );
}
