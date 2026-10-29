# mobileScanner

PWA barcode / QR / Data Matrix scanner + Android NFC reader. Vite + TypeScript, no framework. Deployed to GitHub Pages from `main` (CI: `bunx vitest run` → `bunx --bun vite build`).

## Commands (Bun only — no npm)

- `bun install --frozen-lockfile`
- `bunx vitest run` — all tests (CI gate)
- `bunx vitest run tests/zxing-adapter.test.ts` or `-t "<name>"` — single file / test
- `bunx tsc` — typecheck (noEmit; `vite build` does not typecheck, `build` script does)
- `bunx vite build` — build only; `bun run build` = tsc + vite build
- No lint or formatter is configured.

## Scanner architecture (do not regress)

- `src/main.ts` is the entrypoint; every symbol is a pure module wired to DOM ids in `index.html`.
- Two decoders behind one `BarcodeDecoder` interface (`src/decoder-adapter.ts`): native `BarcodeDetector` (Chrome Android, Safari 17+) via `decoder.ts`/`decoder-adapter.ts`, and a `zxing-wasm` fallback via `src/zxing-adapter.ts`.
- The wasm path decodes **stills, not video**: each video frame is captured to canvas → `ImageData` → one-shot `readBarcodes`. The old `@zxing/library` path was removed because it broke Data Matrix on real frames — don't reintroduce it for decoding (`@zxing/library` is a devDependency used only by test fixtures). Camera/NFC behavior can only be verified manually on a real device.

## zxing-wasm gotchas

- `public/zxing_reader.wasm` (~950 KB) is the shipped binary; `prepareWasm()` in `main.ts` points at `BASE_URL + zxing_reader.wasm` so it lands in the workbox precache. Deleting the copy or the `prepareWasm` call breaks offline use.
- Do NOT import the wasm via Vite `?url` / deep package path — `zxing-wasm`'s exports map forbids it.
- `vitest.config.ts` must keep `server.deps.external: ['zxing-wasm']`: pre-bundling its Emscripten build silently corrupts decode results.

## Base path / PWA

- Vite `base` defaults to `/mobileScanner/` (GitHub Pages project path); `VITE_BASE` overrides it. The manifest `id`/`scope`/`start_url` in `vite.config.ts` hardcode `/mobileScanner/` — update them together if the base changes.
- Workbox `globPatterns` includes `*.wasm` — keep it if assets change.
- Service worker `registerType: 'autoUpdate'`; during dev a stale sw can mask changes (delete `dev-dist`/application cache).

## Deployment

- Push to `main` → `.github/workflows/deploy.yml` builds and deploys to Pages. There is no staging; `bun.lock` is committed and CI installs with `--frozen-lockfile`, so re-run `bun install` after any dependency change.
