import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BarcodeFormat, DataMatrixWriter } from '@zxing/library';
import { decodeImageData, prepareWasm, type RgbaImage } from '../src/zxing-adapter';

prepareWasm({ wasmBinary: readFileSync(resolve('node_modules/zxing-wasm/dist/reader/zxing_reader.wasm')) });

/** Generate a synthetic, pixel-perfect Data Matrix (the @zxing/library encoder is
 * only used here as a test generator — it is known-broken as a decoder). */
function encodeToImage(text: string): RgbaImage {
  const matrix = new DataMatrixWriter().encode(text, BarcodeFormat.DATA_MATRIX, 0, 0, new Map());
  // Draw at a realistic camera scale: modules render a dozen px across, not 1.
  const scale = 12;
  const quiet = 10 * scale;
  const size = matrix.getWidth() * scale + 2 * quiet;
  const image: RgbaImage = {
    data: new Uint8ClampedArray(size * size * 4).fill(255),
    width: size,
    height: size,
  };
  for (let y = 0; y < matrix.getHeight(); y++) {
    for (let x = 0; x < matrix.getWidth(); x++) {
      if (matrix.get(x, y)) {
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            const o = ((quiet + y * scale + dy) * size + (quiet + x * scale + dx)) * 4;
            image.data[o] = image.data[o + 1] = image.data[o + 2] = 0;
          }
        }
      }
    }
  }
  return image;
}

describe('wasm decodeImageData', () => {
  it('decodes a pristine synthetic Data Matrix (regression: @zxing/library could never do this)', async () => {
    expect(await decodeImageData(encodeToImage('010123456789012821000000'))).toEqual({
      value: '010123456789012821000000',
      format: 'Data Matrix',
      timestamp: expect.any(Number),
    });
  });

  it('decodes Data Matrix across symbol sizes and payloads', async () => {
    for (const text of ['A', 'Hello world', '1234567', 'ABCDEFGH', 'Test payload number 1']) {
      const scan = await decodeImageData(encodeToImage(text));
      console.log('[loop]', JSON.stringify(scan));
      expect(scan?.value).toBe(text);
    }
  });

  it('returns null for frames without a code', async () => {
    const size = 40;
    expect(await decodeImageData({
      data: new Uint8ClampedArray(size * size * 4).fill(255),
      width: size,
      height: size,
    })).toBeNull();
  });
});
