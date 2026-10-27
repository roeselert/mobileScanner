export type DecoderKind = 'native' | 'wasm';

/** The native BarcodeDetector covers Chrome on Android and Safari 17+.
 * Browsers without it (notably iOS < 17) get the ZXing WASM fallback. */
export function pickDecoderKind(nativeAvailable: boolean): DecoderKind {
  return nativeAvailable ? 'native' : 'wasm';
}
