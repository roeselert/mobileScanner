import { BrowserMultiFormatReader } from '@zxing/browser';
import {
  BarcodeFormat,
  DecodeHintType,
  type Result,
} from '@zxing/library';
import type { BarcodeDecoder } from './decoder-adapter';
import type { Scan } from './types';

const ZXING_FORMAT_NAMES: Partial<Record<BarcodeFormat, string>> = {
  [BarcodeFormat.EAN_13]: 'EAN-13',
  [BarcodeFormat.EAN_8]: 'EAN-8',
  [BarcodeFormat.UPC_A]: 'UPC-A',
  [BarcodeFormat.UPC_E]: 'UPC-E',
  [BarcodeFormat.CODE_128]: 'Code 128',
  [BarcodeFormat.CODE_39]: 'Code 39',
  [BarcodeFormat.QR_CODE]: 'QR Code',
  [BarcodeFormat.DATA_MATRIX]: 'Data Matrix',
  [BarcodeFormat.AZTEC]: 'Aztec',
  [BarcodeFormat.PDF_417]: 'PDF417',
  [BarcodeFormat.ITF]: 'ITF',
};

function zxingResultToScan(result: Result): Scan {
  return {
    value: result.getText(),
    format: ZXING_FORMAT_NAMES[result.getBarcodeFormat()] ?? `Format ${result.getBarcodeFormat()}`,
    timestamp: Date.now(),
  };
}

export function createZxingDecoder(): BarcodeDecoder {
  const formats: BarcodeFormat[] = Object.keys(ZXING_FORMAT_NAMES)
    .map(Number) as BarcodeFormat[];
  const hints = new Map<DecodeHintType, unknown>();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
  hints.set(DecodeHintType.TRY_HARDER, true);
  const reader = new BrowserMultiFormatReader(hints as never);

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true })!;

  return {
    async decode(source) {
      // @zxing/browser exposes element-level helpers, so route frames through
      // a canvas and use the one-shot decode that accepts one.
      if (source instanceof HTMLVideoElement) {
        const w = source.videoWidth;
        const h = source.videoHeight;
        if (w === 0 || h === 0) return null;
        canvas.width = w;
        canvas.height = h;
        context.drawImage(source, 0, 0);
        try {
          const result = await reader.decodeFromCanvas(canvas);
          return zxingResultToScan(result);
        } catch {
          return null; // NotFoundException: nothing decoded in this frame
        }
      }
      return null;
    },
  };
}
