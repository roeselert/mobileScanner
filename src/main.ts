import './style.css';
import { pickDecoderKind } from './decoder';
import { createNativeDecoder, type BarcodeDecoder, type BarcodeDetectorCtor } from './decoder-adapter';
import { createZxingDecoder, prepareWasm } from './zxing-adapter';
import { isSameScan } from './scanner';
import { isNfcSupported, ndefToString } from './nfc';
import type { Scan } from './types';

const video = document.querySelector<HTMLVideoElement>('#camera')!;
const hint = document.querySelector<HTMLParagraphElement>('#hint')!;
const resultPanel = document.querySelector<HTMLElement>('#resultPanel')!;
const valueEl = document.querySelector<HTMLElement>('#value')!;
const formatEl = document.querySelector<HTMLElement>('#format')!;
const timeEl = document.querySelector<HTMLElement>('#time')!;
const copyBtn = document.querySelector<HTMLButtonElement>('#copy')!;
const closeBtn = document.querySelector<HTMLButtonElement>('#close')!;
const nfcBtn = document.querySelector<HTMLButtonElement>('#nfc')!;
const torchBtn = document.querySelector<HTMLButtonElement>('#torch')!;

const nativeCtor = (globalThis as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
const decoder: BarcodeDecoder =
  nativeCtor !== undefined && pickDecoderKind(true) === 'native'
    ? createNativeDecoder(nativeCtor)
    : createZxingDecoder();

// The camera keeps the live preview, but frames are decoded as stills: hand
// the photo pipeline the wasm binary shipped from public/ so it never has to
// hit the network and stays inside the PWA precache (globPatterns: *.wasm).
prepareWasm({ wasmUrl: `${import.meta.env.BASE_URL}zxing_reader.wasm` });

let lastScan: Scan | null = null;

function showResult(scan: Scan): void {
  valueEl.textContent = scan.value;
  formatEl.textContent = scan.format;
  timeEl.textContent = new Date(scan.timestamp).toLocaleString();
  resultPanel.hidden = false;
  hint.textContent = 'Code detected — tap “Back to camera” to scan the next one.';
}

function setHint(text: string): void {
  hint.textContent = text;
}

async function startCamera(): Promise<void> {
  if (!navigator.mediaDevices?.getUserMedia) {
    setHint('This browser has no camera access. Try Chrome (Android) or Safari (iOS 17+).');
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
    });
    video.srcObject = stream;
    setupTorch(stream);
    void scanLoop(stream);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'NotAllowedError') {
      setHint('Camera access was denied. Allow it in the browser settings and reload.');
    } else {
      setHint('Could not start the camera. Reload to try again.');
    }
  }
}

async function scanLoop(stream: MediaStream): Promise<void> {
  while (stream.active) {
    if (video.readyState >= 2 && resultPanel.hidden) {
      try {
        const scan = await decoder.decode(video);
        if (scan && !isSameScan(lastScan, scan)) {
          lastScan = scan;
          showResult(scan);
        }
      } catch {
        // frames the detector cannot handle are expected; try again next tick
      }
    }
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
}

function setupTorch(stream: MediaStream): void {
  const track = stream.getVideoTracks()[0];
  const caps = track.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
  if (!caps?.torch) return;
  torchBtn.hidden = false;
  let on = false;
  torchBtn.addEventListener('click', async () => {
    on = !on;
    await track.applyConstraints({
      advanced: [{ torch: on } as unknown as MediaTrackConstraintSet],
    });
    torchBtn.setAttribute('aria-pressed', String(on));
  });
}

copyBtn.addEventListener('click', async () => {
  const text = valueEl.textContent ?? '';
  if (text) await navigator.clipboard.writeText(text);
  copyBtn.textContent = 'Copied!';
  window.setTimeout(() => (copyBtn.textContent = 'Copy value'), 1200);
});

closeBtn.addEventListener('click', () => {
  resultPanel.hidden = true;
});

function setupNfc(): void {
  if (!isNfcSupported({ global: globalThis as unknown as Record<string, unknown> })) {
    nfcBtn.textContent = 'NFC not supported on this device';
    nfcBtn.disabled = true;
    return;
  }
  nfcBtn.addEventListener('click', () => void readNfc());
}

async function readNfc(): Promise<void> {
  nfcBtn.textContent = 'Hold a tag against the phone…';
  nfcBtn.disabled = true;
  try {
    const reader = new NDEFReader();
    reader.onreading = (event) => {
      const decoder2 = new TextDecoder();
      const payload = ndefToString(
        event.message.records.map((record) => {
          const bytes_ = record.data;
          return {
            recordType: record.recordType,
            data: bytes_?.buffer,
            payloadPreview:
              record.recordType === 'text' ? record.text :
              record.recordType === 'url' ? decoder2.decode(bytes_!) :
              undefined,
          };
        }),
      );
      showResult({ value: payload, format: 'NFC (NDEF)', timestamp: Date.now() });
      nfcBtn.textContent = 'Read NFC tag';
      nfcBtn.disabled = false;
    };
    await reader.scan();
  } catch {
    nfcBtn.textContent = 'Could not read the tag. Tap to retry.';
    nfcBtn.disabled = false;
  }
}

setupNfc();
void startCamera();
