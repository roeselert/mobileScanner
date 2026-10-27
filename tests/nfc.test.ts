import { describe, expect, it } from 'vitest';
import { isNfcSupported, ndefToString, type NdefRecordLike } from '../src/nfc';

const bytes = (...vals: number[]) => new Uint8Array(vals).buffer;

const textRecord = (text: string): NdefRecordLike => ({
  recordType: 'text',
  data: bytes(0x02, 0x65, 0x6e), // status 2-byte lang code, then payload start
  payloadPreview: text,
});

const urlRecord = (url: string): NdefRecordLike => ({
  recordType: 'url',
  data: bytes(),
  payloadPreview: url,
});

describe('isNfcSupported', () => {
  it('reports Web NFC as available when NDEFReader exists', () => {
    expect(isNfcSupported({ global: { NDEFReader: function NDEFReader() {} } })).toBe(true);
  });

  it('reports it as unavailable when the browser has no NDEFReader', () => {
    expect(isNfcSupported({ global: {} })).toBe(false);
  });
});

describe('ndefToString', () => {
  it('renders a single text record as its text', () => {
    expect(ndefToString([textRecord('Kühlschrank A3')])).toBe('Kühlschrank A3');
  });

  it('joins multiple records with a newline', () => {
    expect(
      ndefToString([textRecord('one'), urlRecord('https://example.org')]),
    ).toBe('one\nhttps://example.org');
  });

  it('marks unknown record types instead of failing', () => {
    expect(
      ndefToString([{ recordType: 'smart-poster', data: bytes() }]),
    ).toBe('[unsupported record: smart-poster]');
  });

  it('returns an empty-state hint for an empty tag', () => {
    expect(ndefToString([])).toBe('(empty NFC tag)');
  });
});
