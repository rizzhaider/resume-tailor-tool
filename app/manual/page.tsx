'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { renderCoverLetterHtml, renderManualResumeHtml } from '../../lib/render';

const starterResumeText = `Professional Experience
Company Name | Frontend / Fullstack Developer | India | Jan 2022 - Present
- Built responsive web applications using React, TypeScript, reusable components, and API integrations.
- Collaborated with product, design, and backend teams to deliver reliable user-facing features.
- Improved application performance, accessibility, and maintainability across core workflows.

Technical Skills
React, TypeScript, JavaScript, Node.js, REST APIs, GraphQL, HTML, CSS, Jest, Accessibility`;

const starterCoverLetter = `Dear Hiring Team,

I am excited to apply for the Frontend / Fullstack Developer role. I bring 10+ years of hands-on experience building responsive, maintainable applications with React, TypeScript, JavaScript, API integrations, and user-focused UI architecture.

My background includes translating product requirements into reliable features, collaborating closely with design and backend teams, and improving performance, accessibility, and usability across important workflows. I enjoy working across the frontend while staying comfortable with fullstack collaboration, debugging, and delivery ownership.

I would welcome the opportunity to discuss how my experience can contribute to your team.

Regards,
Rizwan Haider`;

export default function ManualEditor() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState(starterResumeText);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('Frontend / Fullstack Developer');
  const [coverLetter, setCoverLetter] = useState(starterCoverLetter);
  const [extractedText, setExtractedText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const resumeHtml = useMemo(() => renderManualResumeHtml(resumeText), [resumeText]);
  const coverHtml = useMemo(() => renderCoverLetterHtml(coverLetter, { company, role }), [coverLetter, company, role]);

  async function importResumePdf() {
    if (!resumeFile) return;
    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      const res = await fetch('/api/manual-resume', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to import resume PDF');

      setResumeText(data.text || '');
      setExtractedText(data.text || '');
    } catch (e: any) {
      setError(e.message || 'Failed to import resume PDF');
    } finally {
      setUploading(false);
    }
  }

  async function downloadPdf(type: 'resume' | 'cover') {
    setError('');
    const res = await fetch('/api/export-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(type === 'resume' ? { type: 'manual-resume', resumeText } : { type, coverLetter, company, role })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'PDF export failed');
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = type === 'resume' ? 'resume_rizwan_haider.pdf' : 'cover_letter_rizwan_haider.pdf';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="container">
      <div className="topbar">
        <Link className="nav-link" href="/">Gemini Tailor</Link>
        <Link className="nav-link active" href="/manual">Manual Editor</Link>
      </div>
      <h1>Manual Resume + Cover Letter Editor</h1>
      <p className="notice">No Gemini request is made on this page. Paste normal resume text, not JSON.</p>

      <div className="grid">
        <section className="card">
          <div className="label">Attach Resume PDF</div>
          <input className="input" type="file" accept="application/pdf" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />
          <div className="actions">
            <button className="btn" onClick={importResumePdf} disabled={!resumeFile || uploading}>
              {uploading ? 'Reading PDF...' : 'Import Resume PDF'}
            </button>
          </div>
          {extractedText && (
            <>
              <div className="label">Extracted Resume Text</div>
              <textarea
                className="small-area"
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
              />
            </>
          )}

          <div className="label">Resume Text</div>
          <textarea
            className="code-area"
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume content as plain text. No JSON needed."
          />

          <div className="label">Company</div>
          <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Example: McKinsey & Company" />

          <div className="label">Position</div>
          <input className="input" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Example: Senior Software Engineer I" />

          <div className="label">Cover Letter Content</div>
          <textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
          />

          <div className="actions">
            <button className="btn" onClick={() => setError('')}>Update Resume Preview</button>
            <button className="btn secondary" onClick={() => downloadPdf('resume')}>Download Resume PDF</button>
            <button className="btn secondary" onClick={() => downloadPdf('cover')}>Download Cover Letter PDF</button>
          </div>
          {error && <p style={{ color: '#b91c1c', fontWeight: 700 }}>{error}</p>}
        </section>

        <section className="card">
          <h2>Resume Preview</h2>
          <div className="preview" dangerouslySetInnerHTML={{ __html: resumeHtml }} />
        </section>
      </div>

      <div className="grid" style={{ marginTop: 18 }}>
        <section className="card">
          <h2>Cover Letter Preview</h2>
          <div className="preview" dangerouslySetInnerHTML={{ __html: coverHtml }} />
        </section>
      </div>
    </main>
  );
}
