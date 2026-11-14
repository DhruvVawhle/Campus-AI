# CampusAI — Design System Master (Source of Truth)

> **Generated with** UI/UX Pro Max (`--design-system`) on 2026-10-08 from the query
> `"physical AI reception kiosk, college, friendly, touch-first, voice"`,
> then extended with kiosk-specific rules and user-approved overrides.
> When building a page, follow this file exclusively unless a page override exists in `design-system/pages/`.

**Product:** CampusAI — physical AI college reception kiosk (1920×1080 touch display, 1366×768 fallback).
**Stack:** Next.js App Router · TypeScript strict · Tailwind CSS · shadcn/ui · Framer Motion · React Three Fiber · react-icons.

---

## 1. Global Rules

### 1.1 Style Direction (from skill)

- **Style:** Minimalism & Swiss Style — clean, spacious, functional, white space, high contrast, geometric sans-serif, grid-based, essential.
- **Pattern:** Product Demo + Features → kiosk mapping: the 3D robot is the product centerpiece (center), features/quick actions left, conversation detail right.
- **Key effects:** subtle 150–250 ms transitions, sharp/subtle shadows only, clear type hierarchy, fast loading.

### 1.2 Color Palette (FINAL — user-approved override)

The skill returned two saturated accents (recording red `#DC2626` + waveform blue `#2563EB`).
Per project rule **"single accent"**, all accent usage is unified to the **terracotta family**.

| Role | Hex | CSS Variable | Notes |
|------|-----|--------------|-------|
| Accent (terracotta) | `#B3401E` | `--accent` | 5.7:1 on white — passes AA text |
| Accent pressed/dark | `#8C3117` | `--accent-dark` | 8.2:1 on white — hover/active, large text |
| Accent soft (fills) | `#FBEEE9` | `--accent-soft` | tinted surfaces, never text |
| On accent | `#FFFFFF` | `--accent-on` | 5.7:1 on accent |
| Background | `#FCFCFB` | `--background` | light neutral ground |
| Surface | `#FFFFFF` | `--surface` | panels, cards |
| Foreground (ink) | `#0F172A` | `--foreground` | headings, body |
| Muted foreground | `#475569` | `--muted-foreground` | 7.5:1 on white |
| Border | `#E5E2DB` | `--border` | warm neutral, visible in both themes |
| Muted surface | `#F4F2EE` | `--muted` | quick-action tiles, input fills |
| Destructive (offline banner only) | `#B91C1C` | `--destructive` | never used decoratively |
| Focus ring | `#B3401E` | `--ring` | 3px, 2px offset |

Rules:
- **Colour is never the only signal.** Every state pairs colour with a text label and/or shape/motion change (status dot + label, `aria-pressed`, waveform).
- **State colours do not multiply accents.** Status dot uses accent + distinct motion (pulse/solid/hollow); the label carries the meaning.
- Dark-mode tokens are mandatory (§1.6).

### 1.3 Typography (from skill)

- **Headings:** Poppins (500/600/700) — includes Devanagari subset (हिंदी/मराठी headings).
- **Body:** Open Sans (400/500/600), with **Noto Sans Devanagari** fallback (Open Sans has no Devanagari).
- **Mood:** modern, professional, clean, friendly, approachable. **No serif display faces, no Inter/Playfair by habit.**

```css
--font-heading: var(--font-poppins), "Noto Sans Devanagari", sans-serif;
--font-body: var(--font-open-sans), "Noto Sans Devanagari", sans-serif;
```

Scale (kiosk is read at standing distance — large by default):

| Token | Size @1920 | Usage |
|-------|-----------|-------|
| `--text-hero` | `clamp(48px, 3.4vw, 68px)` | landing H1 |
| `--text-display` | `clamp(34px, 2.2vw, 44px)` | kiosk greeting |
| `--text-title` | `clamp(26px, 1.5vw, 30px)` | panel titles, quick-action titles |
| `--text-body` | **24px** (≥24px @1920, hard rule) | body, messages, replies |
| `--text-label` | **18px** (hard minimum) | labels, status pill, captions |
| `--text-meta` | 16px | timestamps only (non-essential) |

### 1.4 Spacing (from skill, density raised for touch)

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 4px | icon–text gaps |
| `--space-sm` | 8px | inline spacing |
| `--space-md` | 16px | standard padding |
| `--space-lg` | 24px | section padding |
| `--space-xl` | 32px | column gaps |
| `--space-2xl` | 48px | panel margins |
| `--space-3xl` | 64px | stage padding |

**Touch sizing (hard):** every interactive target ≥ **64px**; primary mic button ≥ **88px**; quick actions ≥ **80px** tall.

### 1.5 Shadows & radius

| Token | Value |
|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(15, 23, 42, 0.06)` |
| `--shadow-md` | `0 4px 12px rgba(15, 23, 42, 0.08)` |
| `--shadow-lg` | `0 16px 40px rgba(15, 23, 42, 0.12)` |
| radius | buttons/inputs `12px`, cards `16px`, dialogs `20px`, pills `999px` |

Soft, short shadows only — no glows, no colored shadows.

### 1.6 Dark mode (tokens required)

| Token | Dark value |
|-------|-----------|
| `--background` | `#141416` |
| `--surface` | `#1D1D20` |
| `--foreground` | `#F2F1EE` |
| `--muted-foreground` | `#A9A7A0` (≥4.5:1 on surface) |
| `--border` | `#34343A` |
| `--muted` | `#26262A` |
| `--accent` | `#E0755A` (5.8:1 on `#141416`) |
| `--accent-dark` | `#F08A6F` |
| `--accent-on` | `#141416` |
| `--ring` | `#E0755A` |

### 1.7 Motion (skill UX search)

- Respect `prefers-reduced-motion: reduce` everywhere: no bob/wave/bounce/float, no parallax; final state renders immediately.
- Animate **1–2 key elements per view maximum** (kiosk: waveform + state pulse only).
- Shared motion tokens; `--motion-fast: 150ms`, `--motion-base: 250ms`, `--motion-slow: 400ms`, easing `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- Never animate layout bounds (no layout-shifting hovers/scales).

---

## 2. Kiosk Layout Rules

- Fixed-height grid on desktop: **top bar / main (3 columns) / bottom bar**, no page scroll ≥1000px. Only the conversation list scrolls (internally, `overflow-y: auto`).
- Below **1000px**: columns stack, page may scroll.
- Header: `CampusAI` wordmark ("AI" in accent) — **no logo icon**. Center: status pill (dot + text, `aria-live="polite"`). Right: live device clock, camera toggle (`aria-pressed`, OFF by default), settings button.
- Left: eyebrow + greeting (accent on "AI") + supporting lines + 2×2 quick actions (outline icon, title, one-line subtitle, neutral surface, ≥80px tall, accent only on hover/focus border).
- Center: circular campus photo with thin ring; transparent robot canvas overlaid; speech bubble top-right of stage; mood chip bottom ("Estimated mood: … (demo)") only when camera on.
- Right: conversation panel (header + Clear), empty state, right-aligned dark visitor bubbles, left-aligned replies with response-type label chip, ≥88px "Tap to Speak" with mic circle + state label + waveform, "Or type a question" input + send.
- Bottom: language segmented control `EN / हिंदी / मराठी / Hinglish` (`aria-pressed`) + "Private Visit" info button → privacy dialog.
- Voice-first: quick actions and typing are **secondary** (visually quieter than the mic button).

## 3. Anti-Patterns (Do NOT Use)

- ❌ Glassmorphism, glows, neon, decorative gradients, blobs/floating circles, orbit rings, sparkle lines
- ❌ Sparkle "AI" icons, chest "C" badge, circular logo mark, rainbow-tinted cards
- ❌ Card-heavy/dashboard layouts, sidebars, tiny 12–14px labels, oversized decorative serifs
- ❌ Emojis as icons (use react-icons / SVG, consistent stroke)
- ❌ Layout-shifting hover transforms; instant state changes without transition
- ❌ Low-contrast text (<4.5:1), invisible focus rings, colour-only signals
- ❌ Technical error messages shown to visitors; hard-coded clock/date
- ❌ Emotion wording like "you are sad" — only "Estimated emotional state"

## 4. Pre-Delivery Checklist

- [ ] Body ≥24px @1920, labels ≥18px, touch targets ≥64px, mic ≥88px
- [ ] Contrast ≥4.5:1 light **and** dark; focus rings visible on every control
- [ ] `aria-live` on status pill and message list; real `button`/`input` with labels; `aria-pressed` on toggles
- [ ] `prefers-reduced-motion` honored (CSS + robot)
- [ ] No page scroll on kiosk sizes; stacks and scrolls below 1000px
- [ ] Cursor pointer on all clickables; no emoji icons; one accent family only
- [ ] Camera OFF by default; visible on-indicator; no raw frames uploaded; "(demo)" labelled
- [ ] Live clock; friendly error copy only; dark-mode tokens complete
