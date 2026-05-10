'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { GenerateResponse, ResumeData } from '../lib/types';
import { renderCoverLetterHtml, renderResumeHtml } from '../lib/render';

export default function Home() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [extraInstructions, setExtraInstructions] = useState('');
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function generate() {
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      if (resumeFile) fd.append('resume', resumeFile);
      fd.append('jobDescription', jobDescription);
      fd.append('company', company);
      fd.append('role', role);
      fd.append('extraInstructions', extraInstructions);
      const res = await fetch('/api/generate', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function downloadPdf(type: 'resume' | 'cover') {
    if (!result) return;
    const res = await fetch('/api/export-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(type === 'resume' ? { type, resume: result.resume } : { type, coverLetter: result.coverLetter, company, role })
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

  const resumeHtml = useMemo(() => result ? renderResumeHtml(result.resume) : '', [result]);
  const coverHtml = useMemo(() => result ? renderCoverLetterHtml(result.coverLetter, { company, role }) : '', [result, company, role]);

  return (
    <main className="container">
      <div className="topbar">
        <Link className="nav-link active" href="/">Gemini Tailor</Link>
        <Link className="nav-link" href="/manual">Manual Editor</Link>
      </div>
      <h1>Resume Tailor + Cover Letter Generator</h1>
      <p className="notice">Upload your current resume PDF, paste a job posting, and generate a tailored resume plus cover letter PDF.</p>

      <div className="grid">
        <section className="card">
          <div className="label">Resume PDF</div>
          <input className="input" type="file" accept="application/pdf" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />

          <div className="label">Company</div>
          <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Example: Ripple" />

          <div className="label">Target Role</div>
          <input className="input" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Example: Staff Engineer, Frontend" />

          <div className="label">Job Posting / JD</div>
          <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste full job description here..." />

          <div className="label">Optional Instructions</div>
          <textarea
            className="small-area"
            value={extraInstructions}
            onChange={(e) => setExtraInstructions(e.target.value)}
            placeholder="Example: Make it more React focused, remove AWS, strengthen project tech stack, make cover letter shorter..."
          />

          <div style={{ marginTop: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="btn" onClick={generate} disabled={loading || !resumeFile || !jobDescription.trim()}>
              {loading ? 'Generating...' : 'Generate Resume + Cover Letter'}
            </button>
          </div>
          {error && <p style={{ color: '#b91c1c', fontWeight: 700 }}>{error}</p>}
        </section>

        <section className="card">
          <h2>Match Summary</h2>
          {!result && <p className="notice">Generated summary will appear here.</p>}
          {result && (
            <>
              <ul>{result.matchSummary.map((m, i) => <li key={i}>{m}</li>)}</ul>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button className="btn" onClick={() => downloadPdf('resume')}>Download Resume PDF</button>
                <button className="btn secondary" onClick={() => downloadPdf('cover')}>Download Cover Letter PDF</button>
              </div>
              <EditableJson resume={result.resume} onChange={(resume) => setResult({ ...result, resume })} />
            </>
          )}
        </section>
      </div>

      {result && (
        <div className="grid" style={{ marginTop: 18 }}>
          <section className="card">
            <h2>Resume Preview</h2>
            <div className="preview" dangerouslySetInnerHTML={{ __html: resumeHtml }} />
          </section>
          <section className="card">
            <h2>Cover Letter Preview</h2>
            <div className="preview" dangerouslySetInnerHTML={{ __html: coverHtml }} />
          </section>
        </div>
      )}
    </main>
  );
}

function EditableJson({ resume, onChange }: { resume: ResumeData; onChange: (resume: ResumeData) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(JSON.stringify(resume, null, 2));

  function apply() {
    try {
      onChange(JSON.parse(value));
    } catch {
      alert('Invalid JSON');
    }
  }

  return (
    <div style={{ marginTop: 18 }}>
      <button className="btn secondary" onClick={() => setOpen(!open)}>{open ? 'Hide JSON Editor' : 'Edit Resume JSON'}</button>
      {open && (
        <div>
          <textarea style={{ minHeight: 320, marginTop: 12, fontFamily: 'monospace' }} value={value} onChange={(e) => setValue(e.target.value)} />
          <button className="btn" style={{ marginTop: 10 }} onClick={apply}>Apply Changes</button>
        </div>
      )}
    </div>
  );
}
