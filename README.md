# Tiny Step / Stepwise Chat Task

A focused single-page micro-action companion built with **Next.js 15**, **React 19**, and **TypeScript**.

It turns a short user message into a fixed, local-only action suggestion, runs a protected 30-second countdown, and records completed cycles. No backend, database, external API, or real AI service is used.

## Live demo

[https://stepwise-chat-task.vercel.app](https://stepwise-chat-task.vercel.app)

## Features

- Chat bubble list with a message composer
- Deterministic role reply and suggested action
- “Start action” flow with an animated 30-second SVG countdown ring
- Guarded timer lifecycle: rapid/repeated clicks cannot create multiple intervals or speed up the timer
- Cancel, complete, “go again,” and new-task flows
- Chinese/English UI toggle
- Responsive layout verified at 390px width
- Keyboard submission with Ctrl/Cmd + Enter
- Reduced-motion support and accessible labels

## Tech stack

- Next.js 15.5.22 (App Router)
- React / React DOM 19.2.8
- TypeScript 5.9
- Lucide React icons
- Playwright end-to-end tests

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation

```bash
npm run typecheck
npm run test:e2e
npm run build
```

The end-to-end suite checks:

1. Chat submission produces the fixed reply and action.
2. Double-clicking the start control does not create accelerated/multiple countdowns.
3. Cancel and language-switch flows remain usable.
4. A 390px viewport has no horizontal overflow.

## Implementation notes

### Preventing duplicate timers

The timer is protected in two places:

- `phase === "running"` blocks a second start.
- `intervalRef.current` is checked before creating a new interval.

The interval is cleared on cancellation, completion, reset, and component unmount. The Playwright test deliberately double-clicks the start control and verifies that elapsed seconds stay within real time.

### State model

The UI uses four explicit phases: `chat`, `ready`, `running`, and `completed`. This keeps actions and disabled states predictable and prevents overlapping countdowns.

## AI and automation disclosure

Tools used:

- **OpenAI Codex** for project scaffolding, implementation suggestions, styling, and initial test generation.
- **Playwright** for automated browser verification.
- **npm / TypeScript / Next.js build** for deterministic dependency, type, and production-build validation.

### A concrete AI-generated bug that required correction

The initial AI-generated countdown called `completeAction()` from inside a `setRemaining(previous => ...)` updater. In React Strict Mode, updater functions can be invoked more than once to detect impure logic. The 30-second Playwright completion test exposed this: a single finished countdown incremented the completed-cycle counter from `0` to `2`.

I rejected the implementation because a state updater must remain pure. The final version advances an imperative `remainingRef`, mirrors that value into React state for rendering, and invokes the completion side effect outside the state updater. After the fix, I reran the real 30-second test in both desktop and 390px mobile projects and confirmed that the counter changes from `0` to `1` exactly once.

The start path also checks both `phase === "running"` and `intervalRef.current`, so two rapid clicks cannot create multiple intervals before React commits the next render.

### Manually verified behavior

- Submitted a message and confirmed the fixed role reply.
- Started, cancelled, restarted, and completed the action flow.
- Repeatedly clicked the start action control and confirmed only one timer exists.
- Switched languages before and during the action flow.
- Checked desktop and 390px mobile layouts for clipping and horizontal overflow.
- Ran a production build from the lockfile-based install.

## Time spent

Actual end-to-end working time, including implementation, validation, GitHub publishing, and Vercel deployment: **2026-07-29 21:39-23:22 (about 1 hour 43 minutes)**.

The task was completed within the requested four-hour maximum.
