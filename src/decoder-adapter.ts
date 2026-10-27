import type { Scan } from './types';

/** Shape of the native `BarcodeDetector` constructor we rely on. */
export interface BarcodeDetectorCtor {
  new (options?: { formats?: string[] }): {
    detect(source: CanvasImageSource): Promise<NativeResult[]>;
  };
}

interface NativeResult {
  rawValue: string;
  format: string;
}

export interface BarcodeDecoder {
  decode(source: CanvasImageSource): Promise<Scan | null>;
}

const NATIVE_FORMAT_NAMES: Record<string, string> = {
  ean_13: 'EAN-13',
  ean_8: 'EAN-8',
  upc_a: 'UPC-A',
  upc_e: 'UPC-E',
  code_128: 'Code 128',
  code_39: 'Code 39',
  qr_code: 'QR Code',
  data_matrix: 'Data Matrix',
  aztec: 'Aztec',
  pdf417: 'PDF417',
  itf: 'ITF',
};

export function nativeFormatName(raw: string): string {
  return NATIVE_FORMAT_NAMES[raw] ?? raw;
}

export function createNativeDecoder(ctor: BarcodeDetectorCtor): BarcodeDecoder {
  const detector = new ctor({
    formats: Object.keys(NATIVE_FORMAT_NAMES),
  });
  return {
    async decode(source) {
      const hits = await detector.detect(source);
      const first = hits[0];
      if (!first) return null;
      return {
        value: first.rawValue,
        format: nativeFormatName(first.format),
        timestamp: Date.now(),
      };
    },
  };
}
