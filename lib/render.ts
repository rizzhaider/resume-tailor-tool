import { ResumeData } from './types';

export function renderResumeHtml(resume: ResumeData) {
  return `
  <div class="resume-page" id="resume-pdf">
    <div class="resume-header">
      <div class="resume-name">${escapeHtml(resume.name || 'Your Name')}</div>
      <div class="resume-title">${escapeHtml(resume.title || 'Frontend / Fullstack Developer')}</div>
      <div class="resume-contact">${renderContactHtml(resume)}</div>
    </div>
    <section class="resume-section">
      <div class="section-title">Professional Experience</div>
      ${(resume.experience || []).map(exp => `
        <div class="resume-entry">
          <div class="role-row">
            <div><span class="company">${escapeHtml(exp.company)}</span> — <span class="role">${escapeHtml(exp.role)}</span></div>
            <div>${escapeHtml([exp.location, exp.duration].filter(Boolean).join(' | '))}</div>
          </div>
          <ul>${(exp.bullets || []).map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
        </div>
      `).join('')}
    </section>
    <section class="resume-section">
      <div class="section-title">Technical Skills</div>
      ${renderSkillsHtml(resume.skills || [])}
    </section>
    ${resume.projects?.length ? `<section class="resume-section project-section"><div class="section-title">Projects</div>${resume.projects.map(p => `
      <div class="resume-entry project-entry">
        <div class="role-row"><div class="company">${escapeHtml(p.name)}</div></div>
        ${p.techStack ? `<p class="project-stack"><b>Tech Stack:</b> ${escapeHtml(p.techStack)}</p>` : ''}
        <ul>${p.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
      </div>
    `).join('')}</section>` : ''}
    ${resume.education?.length ? `<section class="resume-section"><div class="section-title">Education</div>${resume.education.map(e => `<p><b>${escapeHtml(e.degree)}</b>, ${escapeHtml(e.institute)} ${e.year ? `— ${escapeHtml(e.year)}` : ''}</p>`).join('')}</section>` : ''}
    ${resume.certifications?.length ? `<section class="resume-section"><div class="section-title">Certifications</div><p>${resume.certifications.map(escapeHtml).join(' • ')}</p></section>` : ''}
  </div>`;
}

export function renderCoverLetterHtml(
  coverLetter: string,
  meta: { company?: string; role?: string } = {}
) {
  const date = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric'
  }).format(new Date());
  const role = meta.role?.trim() || 'Frontend / Fullstack Developer';
  const company = meta.company?.trim() || 'Hiring Team';
  const paragraphs = normalizeCoverLetterParagraphs(coverLetter);

  return `<div class="cover-page" id="cover-pdf">
    <div class="cover-header">
      <div class="cover-name">Rizwan Haider</div>
      <div class="cover-contact">Gurugram, India | +91-7275255918 | rizwan02riz@gmail.com</div>
      <div class="cover-date">${escapeHtml(date)}</div>
      <div class="cover-role">${escapeHtml(role)}</div>
      <div class="cover-company">${escapeHtml(company)}</div>
    </div>
    <div class="cover-body">
      ${paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('')}
      <div class="cover-signoff">Regards,</div>
      <div class="cover-signature">Rizwan Haider</div>
    </div>
  </div>`;
}

export function renderManualResumeHtml(resumeText: string) {
  return `
  <div class="resume-page" id="resume-pdf">
    <div class="resume-header">
      <div class="resume-name">Rizwan Haider</div>
      <div class="resume-title">Frontend / Fullstack Developer</div>
      <div class="resume-contact">rizwan02riz@gmail.com | +917275255918 | <a href="https://www.linkedin.com/in/rizwan-haider-b2446b82/" target="_blank" rel="noreferrer">LinkedIn</a></div>
    </div>
    ${renderManualResumeBody(resumeText)}
  </div>`;
}

export function fullHtml(body: string) {
  return `<!doctype html><html><head><meta charset="utf-8"/><style>${cssForPdf()}</style></head><body>${body}</body></html>`;
}

function renderManualResumeBody(resumeText: string) {
  const lines = resumeText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !isFixedProfileLine(line));

  const chunks: string[] = [];
  let listItems: string[] = [];
  let sectionOpen = false;

  function flushList() {
    if (!listItems.length) return;
    chunks.push(`<ul>${listItems.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`);
    listItems = [];
  }

  function openSection() {
    if (sectionOpen) return;
    chunks.push('<section class="resume-section">');
    sectionOpen = true;
  }

  for (const line of lines) {
    if (isManualSectionHeading(line)) {
      flushList();
      if (sectionOpen) chunks.push('</section>');
      chunks.push(`<section class="resume-section"><div class="section-title">${escapeHtml(normalizeSectionHeading(line))}</div>`);
      sectionOpen = true;
      continue;
    }

    const bullet = line.match(/^[-•*]\s*(.+)$/);
    if (bullet) {
      openSection();
      listItems.push(bullet[1]);
      continue;
    }

    flushList();
    openSection();
    chunks.push(`<p>${escapeHtml(line)}</p>`);
  }

  flushList();
  if (sectionOpen) chunks.push('</section>');
  return chunks.join('');
}

function isFixedProfileLine(line: string) {
  const normalized = line.toLowerCase();
  return [
    'rizwan haider',
    'frontend / fullstack developer',
    'frontend/fullstack developer',
    'rizwan02riz@gmail.com',
    '+917275255918',
    'linkedin.com/in/rizwan-haider-b2446b82'
  ].some(value => normalized.includes(value));
}

function isManualSectionHeading(line: string) {
  const normalized = line.toLowerCase().replace(/[:]+$/, '');
  const headings = [
    'professional experience',
    'experience',
    'work experience',
    'technical skills',
    'skills',
    'selected projects',
    'projects',
    'education',
    'certifications',
    'certification'
  ];
  return headings.includes(normalized) || (line.length <= 32 && line === line.toUpperCase());
}

function normalizeSectionHeading(line: string) {
  const normalized = line.toLowerCase().replace(/[:]+$/, '');
  if (['experience', 'work experience'].includes(normalized)) return 'Professional Experience';
  if (normalized === 'skills') return 'Technical Skills';
  if (normalized === 'projects' || normalized === 'selected projects') return 'Projects';
  if (normalized === 'certification') return 'Certifications';
  return line.replace(/[:]+$/, '');
}

function normalizeCoverLetterParagraphs(coverLetter: string) {
  const paragraphs = coverLetter
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  while (paragraphs.length) {
    const last = paragraphs[paragraphs.length - 1].toLowerCase().replace(/[,.]+$/, '');
    if (['rizwan haider', 'regards', 'sincerely', 'best regards', 'thank you'].includes(last)) {
      paragraphs.pop();
      continue;
    }
    break;
  }

  return paragraphs;
}

function escapeHtml(value: string) {
  return String(value || '').replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch] as string));
}

function renderContactHtml(resume: ResumeData) {
  const parts = [
    resume.email ? escapeHtml(resume.email) : '',
    resume.phone ? escapeHtml(resume.phone) : '',
    resume.location ? escapeHtml(resume.location) : '',
    resume.linkedin ? `<a href="${escapeAttribute(resume.linkedin)}" target="_blank" rel="noreferrer">LinkedIn</a>` : '',
    resume.portfolio ? `<a href="${escapeAttribute(resume.portfolio)}" target="_blank" rel="noreferrer">Portfolio</a>` : ''
  ];

  return parts.filter(Boolean).join(' | ');
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function renderSkillsHtml(skills: string[]) {
  if (!skills.length) return '';

  const hasCategories = skills.some(skill => skill.includes(':'));
  if (!hasCategories) {
    return `<p>${skills.map(escapeHtml).join(' • ')}</p>`;
  }

  return `<div class="skill-list">${skills.map(skill => {
    const [label, ...rest] = skill.split(':');
    const value = rest.join(':').trim();
    if (!value) return `<p>${escapeHtml(skill)}</p>`;
    return `<div class="skill-row"><span class="skill-label">${escapeHtml(label.trim())}:</span><span>${escapeHtml(value)}</span></div>`;
  }).join('')}</div>`;
}

function cssForPdf() {
  return `
    *{box-sizing:border-box} body{margin:0;background:#fff;color:#111827;font-family:Arial,Helvetica,sans-serif}
    .resume-page{width:794px;min-height:1123px;padding:42px 48px;margin:0 auto;background:#fff;color:#111827;font-family:Arial,Helvetica,sans-serif;-webkit-box-decoration-break:clone;box-decoration-break:clone}
    .resume-header{text-align:center;border-bottom:2px solid #111827;padding-bottom:12px}.resume-name{font-size:28px;font-weight:800;letter-spacing:.5px}.resume-title{font-size:14px;margin-top:5px}.resume-contact{font-size:11px;margin-top:7px;color:#374151}.resume-contact a{color:#374151;text-decoration:none}.resume-section{break-inside:auto;page-break-inside:auto}.section-title{font-size:13px;font-weight:800;letter-spacing:.8px;border-bottom:1px solid #9ca3af;margin-top:18px;padding-bottom:4px;text-transform:uppercase;break-after:avoid;page-break-after:avoid}.section-title::after{content:"";display:block;height:42px;margin-bottom:-42px;break-inside:avoid}.resume-entry,.project-entry{break-inside:avoid;page-break-inside:avoid}.resume-page p,.resume-page li{font-size:12px;line-height:1.45}.project-stack{margin:5px 0 0}.role-row{display:flex;justify-content:space-between;gap:10px;margin-top:10px;font-size:12px}.company{font-weight:800}.role{font-weight:700;color:#374151}.skill-list{margin-top:8px}.skill-row{display:grid;grid-template-columns:150px 1fr;gap:10px;font-size:12px;line-height:1.45;margin-top:3px}.skill-label{font-weight:800}ul{margin:6px 0 0 18px;padding:0}.cover-page{width:794px;min-height:1123px;margin:0 auto;background:white;font-family:Arial,Helvetica,sans-serif}.cover-header{background:#242424;color:#e8dfdb;padding:28px 58px 30px}.cover-name{font-size:28px;font-weight:800;letter-spacing:2px;text-transform:uppercase}.cover-contact{font-size:13px;margin-top:12px}.cover-date{font-size:14px;font-weight:800;letter-spacing:1px;margin-top:38px}.cover-role{font-size:13px;margin-top:18px}.cover-company{font-size:13px;margin-top:2px}.cover-body{padding:42px 58px 58px}.cover-page p{font-size:13px;line-height:1.65}.cover-signoff{font-size:13px;line-height:1.65;margin-top:28px}.cover-signature{font-size:13px;font-weight:800;margin-top:4px}
  `;
}
