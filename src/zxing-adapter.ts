import {
  formatToLabel,
  prepareZXingModule,
  readBarcodes,
  type ZXingModuleOverrides,
} from 'zxing-wasm/reader';
import type { BarcodeDecoder } from './decoder-adapter';
import type { Scan } from './types';

/** Raw RGBA pixels of one captured frame: a still "photo" to decode. */
export interface RgbaImage {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/** How the zxing wasm binary is located. */
export interface PrepareWasmOptions {
  /** Raw `.wasm` bytes (tests load the file directly; Node cannot `?url`). */
  wasmBinary?: ArrayBuffer | Uint8Array;
  /** URL of the `.wasm` asset shipped from `public/` (base-relative). */
  wasmUrl?: string;
}

/** Type of the Emscripten module knobs we override. `wasmBinary` comes from
 * Emscripten's typing, which zxing-wasm does not re-export as a name. */
interface WasmModuleOverrides {
  wasmBinary?: ArrayBuffer | Uint8Array;
  locateFile?: () => string;
}

/** Wire the zxing-cpp wasm module up before the first decode. Without a call,
 * zxing-wasm resolves the binary from its own default location, which would
 * miss the offline precache; passing the bundled asset keeps it offline. */
export function prepareWasm(options: PrepareWasmOptions = {}): void {
  const overrides: WasmModuleOverrides = {};
  const { wasmBinary, wasmUrl } = options;
  if (wasmBinary) overrides.wasmBinary = wasmBinary;
  if (wasmUrl) overrides.locateFile = () => wasmUrl;
  prepareZXingModule({ overrides: overrides as ZXingModuleOverrides });
}

/** Decode one still-photo frame with the zxing-cpp wasm reader. The reader
 * defaults already enable tryHarder, tryRotate, tryInvert and tryDownscale,
 * so the same tolerant settings are used as when run as a plain CLI scan.
 * Returns the first code found, or null when the frame holds none. */
export async function decodeImageData(image: RgbaImage): Promise<Scan | null> {
  // zxing-wasm fingerprints the pixmap by its `width`, `height` and `data`
  // fields, so a plain RgbaImage is accepted without an ImageData wrapper —
  // which also keeps this function unit-testable right out of the browser.
  const results = await readBarcodes(image as ImageData);
  const first = results[0];
  if (!first) return null;
  return {
    value: first.text,
    // Unknown symbologies keep their raw name, like nativeFormatName does.
    format: formatToLabel(first.format) ?? first.format,
    timestamp: Date.now(),
  };
}

/** Camera decoding as a photo pipeline: the preview keeps streaming, but each
 * frame is captured to a canvas still and handed to the one-shot reader —
 * no video-stream decoding wrapper in between. */
export function createZxingDecoder(): BarcodeDecoder {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true })!;

  return {
    async decode(source) {
      if (!(source instanceof HTMLVideoElement)) return null;
      const w = source.videoWidth;
      const h = source.videoHeight;
      if (w === 0 || h === 0) return null;
      canvas.width = w;
      canvas.height = h;
      context.drawImage(source, 0, 0);
      // An ImageData is itself an RgbaImage.
      return decodeImageData(context.getImageData(0, 0, w, h));
    },
  };
}
