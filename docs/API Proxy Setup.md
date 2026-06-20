# API Proxy Setup

## Vite Dev Mode

1. Copy `.env.example` to `.env`
2. Leave `VITE_API_BASE_URL=` empty
3. Set either:
   - `COHERE_API_KEY=...` for the preferred server-side path, or
   - `VITE_COHERE_API_KEY=...` as a temporary client fallback
4. Run `npm run dev`
5. Open `http://localhost:5173`

In this mode, the frontend calls relative `/api/*` routes and Vite proxies them to the Express server on `DEV_SERVER_PORT`.

## Laragon Mode

1. Copy `.env.example` to `.env`
2. Set `VITE_API_BASE_URL=http://localhost:3001`
3. Set `COHERE_API_KEY=...` if you want the proxy to hold the real key server-side
4. Build with `npm run build:laragon`
5. Start the Express server separately with `node server/index.cjs`
6. Open `http://cohere-proofreader.test`

In this mode, Apache serves the static app and the frontend talks directly to the Express proxy using `VITE_API_BASE_URL`.

## Notes

- `VITE_COHERE_API_KEY` is now a fallback, not the preferred path.
- `COHERE_API_KEY` is preferred because it is never exposed to the browser.
- The prompt write-back route remains at `/api/save-prompt`.
