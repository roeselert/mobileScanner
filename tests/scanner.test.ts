import { describe, expect, it } from 'vitest';
import { isSameScan } from '../src/scanner';

describe('isSameScan', () => {
  it('reports the same code in the same format as unchanged, regardless of timestamp', () => {
    const a = { value: '4006381333931', format: 'EAN-13', timestamp: 1000 };
    const b = { value: '4006381333931', format: 'EAN-13', timestamp: 1050 };
    expect(isSameScan(a, b)).toBe(true);
  });

  it('reports a different value as changed even in the same format', () => {
    const a = { value: '4006381333931', format: 'EAN-13', timestamp: 1000 };
    const b = { value: '4006381333932', format: 'EAN-13', timestamp: 1010 };
    expect(isSameScan(a, b)).toBe(false);
  });

  it('reports the same payload from a different symbology as changed', () => {
    const a = { value: 'HELLO', format: 'QR Code', timestamp: 1000 };
    const b = { value: 'HELLO', format: 'Code 128', timestamp: 1010 };
    expect(isSameScan(a, b)).toBe(false);
  });

  it('handles a first scan with no previous result', () => {
    const b = { value: 'X', format: 'QR Code', timestamp: 1 };
    expect(isSameScan(null, b)).toBe(false);
  });
});
