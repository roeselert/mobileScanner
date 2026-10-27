/** Minimal structural view of an NDEFReader NDEFMessage record, so the
 * formatting logic below stays testable without a real NFC stack. */
export interface NdefRecordLike {
  recordType: string;
  data?: ArrayBufferLike;
  /** Pre-extracted text/URL payload (real NDEF payloads carry a status byte
   * + charset prefix; the browser already gives us `record.text`/hash of
   * `data` — callers pass whichever is decoded). */
  payloadPreview?: string;
}

export function isNfcSupported(scope: { global: Record<string, unknown> }): boolean {
  return 'NDEFReader' in scope.global;
}

export function ndefToString(records: NdefRecordLike[]): string {
  if (records.length === 0) return '(empty NFC tag)';
  return records
    .map((record) => {
      if ((record.recordType === 'text' || record.recordType === 'url') && record.payloadPreview) {
        return record.payloadPreview;
      }
      return `[unsupported record: ${record.recordType}]`;
    })
    .join('\n');
}
