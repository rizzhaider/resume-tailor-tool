import { NextRequest, NextResponse } from 'next/server';
import { parsePdfText } from '../../../lib/pdf';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const resumeFile = formData.get('resume') as File | null;

    if (!resumeFile) {
      return NextResponse.json({ error: 'Resume PDF is required.' }, { status: 400 });
    }

    const buffer = Buffer.from(await resumeFile.arrayBuffer());
    const text = (await parsePdfText(buffer)).trim();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error?.message || 'Failed to read resume PDF.' }, { status: 500 });
  }
}
