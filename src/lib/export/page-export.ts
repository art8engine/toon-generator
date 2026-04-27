'use client';

import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

/**
 * Export the current A4 page to PNG or PDF.
 *
 * The MangaGrid component marks its A4 div with
 * `data-export-target="a4-page"`; we look it up in the DOM at export time
 * rather than passing a ref through the component tree.
 *
 * Caveat: cross-origin images (Replicate, etc.) without CORS headers will
 * either render blank or fail. The current FakeProvider returns inline
 * data: URLs, which work fine. Real-provider integration will need the
 * provider to set Access-Control-Allow-Origin or be proxied through our
 * own API.
 */

const A4_TARGET = '[data-export-target="a4-page"]';

async function snapshotA4(): Promise<string> {
  const node = document.querySelector<HTMLElement>(A4_TARGET);
  if (!node) {
    throw new Error('A4 페이지 영역을 찾을 수 없습니다 (에디터 페이지에서만 동작합니다).');
  }
  return toPng(node, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: '#ffffff',
  });
}

export async function exportPagePng(filename: string): Promise<void> {
  const dataUrl = await snapshotA4();
  triggerDownload(dataUrl, filename);
}

export async function exportPagePdf(filename: string): Promise<void> {
  const dataUrl = await snapshotA4();
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  pdf.addImage(dataUrl, 'PNG', 0, 0, 210, 297);
  pdf.save(filename);
}

function triggerDownload(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function timestampedFilename(ext: 'png' | 'pdf'): string {
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  return `toon-${ts}.${ext}`;
}
