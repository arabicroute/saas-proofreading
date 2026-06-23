# Env Debug Guide — Multi API Key Dropdown Shows No Keys
**Repo:** `arabicroute/saas-proofreading`  
**Symptom:** AI Config and App Config both show "No client-side API keys configured"  
**Root cause category:** Vite env var build-time inlining mismatch

---

## Why this happens — the one thing to understand first

Vite does **not** read `.env` files at runtime. It reads them once, **at build time** (or dev-server start), and replaces every `import.meta.env.VITE_*` reference in your source code with the literal string value found in the file. After that, the file is irrelevant — the value is baked into the compiled JavaScript.

This means:

- Editing `.env` while the dev server is running → **no effect** until you restart `npm run dev`
- Editing `.env` while serving a built `dist/` → **no effect** until you run `npm run build` or `npm run build:laragon` again
- Editing `.env` when you built with `--mode laragon` → **no effect**, because Laragon builds read `.env.laragon`, not `.env`

---

## Your specific setup

From `package.json` and `vite.config.ts`:

```
npm run dev           → Vite dev server, mode = "development"
                        Reads: .env  +  .env.development  (in that order)

npm run build         → Vite production build, mode = "production"
                        Reads: .env  +  .env.production

npm run build:laragon → Vite build --mode laragon
                        Reads: .env  +  .env.laragon
```

**The Laragon build only reads `.env.laragon`.** Changes to `.env` alone have no effect on the Laragon dist.

---

## The three failure modes — pick which one fits

### Failure mode 1 — Wrong env file edited (most likely)

You added the keys to `.env` but you are running `npm run build:laragon` (or serving its output).

**Fix:** Add the keys to `.env.laragon` instead, then rebuild.

---

### Failure mode 2 — Wrong variable name

`KEY_OPTIONS` in `src/lib/apiKeys.ts` reads **only** the numbered vars:

```
VITE_COHERE_API_KEY_1   through   VITE_COHERE_API_KEY_10
VITE_COHERE_API_KEY_LABEL_1  through  VITE_COHERE_API_KEY_LABEL_10
```

The legacy single-key var `VITE_COHERE_API_KEY` (no number suffix) is **not** included in the dropdown — it is only used as a last-resort fallback in `resolveInitialApiKey()` when no numbered slots are found, and it feeds `state.apiKey` directly, bypassing the dropdown entirely.

If you set `VITE_COHERE_API_KEY` instead of `VITE_COHERE_API_KEY_1`, the dropdown stays empty even though the app may still work for requests.

**Fix:** Use the numbered variable names.

---

### Failure mode 3 — Label set to the key value, key var left empty

From the diagnostic notes, this was observed in the local env at the time of failure:

```
VITE_COHERE_API_KEY_LABEL_1 = <actual secret key value>   ← wrong
VITE_COHERE_API_KEY_1       = (missing or empty)          ← causes empty dropdown
```

`KEY_OPTIONS` skips any slot where the key value (`VITE_COHERE_API_KEY_N`) is empty or missing. A slot with only a label set will be silently skipped. The dropdown will be empty.

**Fix:** Set the variables correctly:
```
VITE_COHERE_API_KEY_1       = co-xxxxxxxxxxxxxxxxxxxxxxxx   ← actual key
VITE_COHERE_API_KEY_LABEL_1 = Key 1                         ← display label (safe to commit)
```

---

## Step-by-step fix procedure

Work through these in order. Stop at the step that resolves the issue.

### Step 1 — Confirm which command you are running

```bash
# Are you running the dev server?
npm run dev

# Or are you building for Laragon and serving dist/?
npm run build:laragon
```

If you are running `build:laragon` and serving the output via Laragon's web server, **all env changes must go into `.env.laragon`**.

---

### Step 2 — Edit the correct env file

**For `npm run dev`** — edit `.env` (or `.env.development`):

```bash
# .env  (or .env.development)

VITE_COHERE_API_KEY_1=co-xxxxxxxxxxxxxxxxxxxxxxxx
VITE_COHERE_API_KEY_LABEL_1=Key 1

VITE_COHERE_API_KEY_2=co-yyyyyyyyyyyyyyyyyyyyyyyy
VITE_COHERE_API_KEY_LABEL_2=Key 2

# Add up to 10 slots. Omit slots you do not have keys for.
# VITE_APP_DEFAULT_KEY_SLOT=1  ← optional, defaults to 1
```

**For `npm run build:laragon`** — edit `.env.laragon`:

```bash
# .env.laragon

VITE_COHERE_API_KEY_1=co-xxxxxxxxxxxxxxxxxxxxxxxx
VITE_COHERE_API_KEY_LABEL_1=Key 1

VITE_COHERE_API_KEY_2=co-yyyyyyyyyyyyyyyyyyyyyyyy
VITE_COHERE_API_KEY_LABEL_2=Key 2

VITE_APP_DEFAULT_KEY_SLOT=1
```

> **Security note:** Never commit actual key values. The label variables (`VITE_COHERE_API_KEY_LABEL_*`) are safe to commit. The key value variables (`VITE_COHERE_API_KEY_*`) must stay in `.gitignore`-d env files.

---

### Step 3 — Restart or rebuild (mandatory after any env change)

**Dev server:**
```bash
# Stop the running dev server (Ctrl+C), then:
npm run dev
```
The dev server must be fully restarted — hot reload does not pick up `.env` changes.

**Laragon build:**
```bash
npm run build:laragon
# Then re-serve the fresh dist/ via Laragon
```

---

### Step 4 — Verify the values were inlined correctly

Open the browser DevTools Console on the running app and paste:

```javascript
// Check which mode Vite compiled for
console.log("MODE:", import.meta.env.MODE);

// Check slot 1 (the key value itself — will show the actual key string)
console.log("KEY_1:", import.meta.env.VITE_COHERE_API_KEY_1);
console.log("LABEL_1:", import.meta.env.VITE_COHERE_API_KEY_LABEL_1);

// Check the default slot config
console.log("DEFAULT_SLOT:", import.meta.env.VITE_APP_DEFAULT_KEY_SLOT);
```

**Expected output after a correct setup:**
```
MODE: development          ← (or "laragon" for the Laragon build)
KEY_1: co-xxxx...          ← non-empty string (your actual key)
LABEL_1: Key 1             ← your label
DEFAULT_SLOT: 1            ← or undefined if not set (defaults to 1)
```

**If `KEY_1` shows `undefined`**, the variable is not in the env file for the active mode, or the server/build was not restarted after editing.

---

### Step 5 — Verify KEY_OPTIONS at runtime

Still in DevTools Console:

```javascript
// Import the module and inspect the built options list
// (This only works in dev mode where modules are accessible)
const { KEY_OPTIONS } = await import('/src/lib/apiKeys.ts');
console.log("KEY_OPTIONS:", KEY_OPTIONS);
```

**Expected output:**
```javascript
KEY_OPTIONS: [
  { slot: 1, label: "Key 1", value: "co-xxxx..." },
  { slot: 2, label: "Key 2", value: "co-yyyy..." },
  // ...
]
```

If `KEY_OPTIONS` is `[]` even after `import.meta.env.VITE_COHERE_API_KEY_1` shows a value, the dev server was not restarted after the env file was edited — the old compiled version of `apiKeys.ts` is still running.

---

## Env file loading rules — quick reference

This table covers every combination you might encounter:

| Command | Mode | Reads env files (in priority order) |
|---|---|---|
| `npm run dev` | `development` | `.env.development.local` → `.env.development` → `.env.local` → `.env` |
| `npm run build` | `production` | `.env.production.local` → `.env.production` → `.env.local` → `.env` |
| `npm run build:laragon` | `laragon` | `.env.laragon.local` → `.env.laragon` → `.env.local` → `.env` |

**Key rule:** Mode-specific files (`.env.laragon`) take priority over `.env`, but `.env` is still read as a base. If you define `VITE_COHERE_API_KEY_1` in both files, the mode-specific file wins.

**Practical recommendation:** Keep all secret key values in `.env.laragon` only (for Laragon builds) and `.env` only (for dev). Do not define them in `.env` if you are only running Laragon builds — it adds confusion without benefit.

---

## The correct `.env.laragon` file structure

```bash
# ─────────────────────────────────────────────────────────────
# .env.laragon — Laragon build configuration
# DO NOT COMMIT THIS FILE (add to .gitignore)
# ─────────────────────────────────────────────────────────────

# Express proxy port (used by vite.config.ts dev proxy — irrelevant for Laragon builds)
DEV_SERVER_PORT=3001

# API Key slots (add only slots you have keys for, 1 through 10)
VITE_COHERE_API_KEY_1=co-xxxxxxxxxxxxxxxxxxxxxxxx
VITE_COHERE_API_KEY_LABEL_1=Key 1

VITE_COHERE_API_KEY_2=co-yyyyyyyyyyyyyyyyyyyyyyyy
VITE_COHERE_API_KEY_LABEL_2=Key 2

# VITE_COHERE_API_KEY_3=...
# VITE_COHERE_API_KEY_LABEL_3=Key 3

# Default key slot auto-selected on cold load (optional, defaults to 1)
VITE_APP_DEFAULT_KEY_SLOT=1
```

And the companion **safe-to-commit** labels file (optional but useful):

```bash
# .env.laragon.labels — safe to commit, no secrets
# Merge into .env.laragon locally, or keep separate for reference

VITE_COHERE_API_KEY_LABEL_1=Key 1
VITE_COHERE_API_KEY_LABEL_2=Key 2
VITE_COHERE_API_KEY_LABEL_3=Key 3
VITE_COHERE_API_KEY_LABEL_4=Key 4
VITE_COHERE_API_KEY_LABEL_5=Key 5
VITE_COHERE_API_KEY_LABEL_6=Key 6
VITE_COHERE_API_KEY_LABEL_7=Key 7
VITE_COHERE_API_KEY_LABEL_8=Key 8
VITE_COHERE_API_KEY_LABEL_9=Key 9
VITE_COHERE_API_KEY_LABEL_10=Key 10
VITE_APP_DEFAULT_KEY_SLOT=1
```

---

## .gitignore — confirm these are excluded

```gitignore
# .gitignore — confirm these lines exist
.env
.env.local
.env.*.local
.env.laragon
.env.development
.env.production
```

`.env.laragon` must be in `.gitignore`. The label-only companion file (if kept separate) can be committed safely.

---

## After fixing — expected UI state

**AI Config tab — API Key card:**
```
┌─────────────────────────────────────────────┐
│ 🔑 API Key                                  │
│                                             │
│ [Key 1 ▾]                                  │  ← dropdown with your labels
│                                             │
│ ✓ Active: Key 1 (slot 1)                   │
└─────────────────────────────────────────────┘
```

**App Config tab — Default API Key card:**
```
┌─────────────────────────────────────────────┐
│ 🔑 Default API Key                          │
│                                             │
│ [Key 1 (slot 1) ▾]                         │  ← same options list
│                                             │
│ ✓ Currently active: Key 1                  │
└─────────────────────────────────────────────┘
```

If you see these states, the env vars are correctly inlined and the dropdown is working.

---

## Summary — the three things to check

1. **Right env file for the right mode** — Laragon build uses `.env.laragon`, dev server uses `.env`
2. **Correct variable names** — `VITE_COHERE_API_KEY_1` (not `VITE_COHERE_API_KEY`); label in `VITE_COHERE_API_KEY_LABEL_1` (not the key value)
3. **Restart or rebuild after every env change** — Vite inlines at build time; hot reload does not apply to env files
