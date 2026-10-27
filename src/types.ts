/** One decoded code, from any input path (camera or NFC). */
export interface Scan {
  value: string;
  /** Canonical symbology name: EAN-13, QR Code, Data Matrix, Code 128 ... */
  format: string;
  timestamp: number;
}
