import { describe, expect, it } from 'vitest';
import { pickDecoderKind } from '../src/decoder';

describe('pickDecoderKind', () => {
  it('uses the native Barcode Detector when the browser provides one', () => {
    expect(pickDecoderKind(true)).toBe('native');
  });

  it('falls back to the WASM decoder when it does not', () => {
    expect(pickDecoderKind(false)).toBe('wasm');
  });
});
