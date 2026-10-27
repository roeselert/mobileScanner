// Web NFC lives in Chrome (Android) but TS 7's DOM lib does not ship types.
// Declarations cover only the read path this app uses.
interface NDEFReadingEventLike {
  message: {
    records: Array<{
      recordType: string;
      data?: DataView;
      text?: string;
    }>;
  };
}

declare class NDEFReader {
  scan(options?: { signal?: AbortSignal }): Promise<void>;
  onreading: ((event: NDEFReadingEventLike) => void) | null;
  onreadingerror: ((event: Event) => void) | null;
}
