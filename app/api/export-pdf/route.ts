import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { fullHtml, renderCoverLetterHtml, renderManualResumeHtml, renderResumeHtml } from '../../../lib/render';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = body.type as 'resume' | 'manual-resume' | 'cover';
    const html = type === 'cover'
      ? renderCoverLetterHtml(body.coverLetter || '', { company: body.company, role: body.role })
      : type === 'manual-resume'
        ? renderManualResumeHtml(body.resumeText || '')
        : renderResumeHtml(body.resume);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(fullHtml(html), { waitUntil: 'networkidle0' });
    const margin = type === 'cover'
      ? { top: '0', right: '0', bottom: '0', left: '0' }
      : { top: '24px', right: '0', bottom: '24px', left: '0' };
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin });
    await browser.close();
    const pdfBody = new ArrayBuffer(pdf.byteLength);
    new Uint8Array(pdfBody).set(pdf);

    return new NextResponse(pdfBody, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${type === 'cover' ? 'cover_letter_rizwan_haider' : 'resume_rizwan_haider'}.pdf"`
      }
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error?.message || 'Failed to export PDF.' }, { status: 500 });
  }
}
