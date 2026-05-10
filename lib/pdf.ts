import path from 'node:path';
import { pathToFileURL } from 'node:url';

export async function parsePdfText(buffer: Buffer) {
  await ensurePdfParseGlobals();
  const { PDFParse } = await import('pdf-parse');
  const workerPath = path.join(process.cwd(), 'node_modules/pdf-parse/dist/pdf-parse/esm/pdf.worker.mjs');
  PDFParse.setWorker(pathToFileURL(workerPath).href);
  const parser = new PDFParse({ data: buffer });

  try {
    const parsed = await parser.getText();
    return parsed.text;
  } finally {
    await parser.destroy();
  }
}

async function ensurePdfParseGlobals() {
  const globalScope = globalThis as typeof globalThis & {
    DOMMatrix?: typeof DOMMatrix;
    ImageData?: typeof ImageData;
    Path2D?: typeof Path2D;
  };

  if (globalScope.DOMMatrix && globalScope.ImageData && globalScope.Path2D) return;

  const loadCanvas = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
  const { DOMMatrix, ImageData, Path2D } = await loadCanvas('@napi-rs/canvas');
  globalScope.DOMMatrix ||= DOMMatrix as typeof globalScope.DOMMatrix;
  globalScope.ImageData ||= ImageData as typeof globalScope.ImageData;
  globalScope.Path2D ||= Path2D as typeof globalScope.Path2D;
}
