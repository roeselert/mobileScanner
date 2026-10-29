import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Load zxing-wasm with native node module semantics: pre-bundling its
    // Emscripten build broke wasm result marshalling (decode results lost
    // their payload). External = runs like plain node, which was verified
    // to decode Data Matrix correctly.
    server: { deps: { external: ['zxing-wasm'] } },
  },
});
