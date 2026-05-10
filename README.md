# Resume Tailor Tool

MVP tool to upload a resume PDF, paste a job posting, generate a tailored resume and cover letter, preview them, and download both as PDFs.

## Features

- Upload current resume PDF
- Paste job description
- Optional company and target role fields
- AI-generated ATS-friendly resume JSON
- AI-generated cover letter
- Careerflow-like clean PDF template
- Resume and cover letter PDF export
- Manual JSON editor for final tweaks

## Setup

```bash
npm install
cp .env.example .env.local
```

Add your Gemini API key in `.env.local`:

```bash
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-pro
```

For a faster/cheaper fallback, switch the model to:

```bash
GEMINI_MODEL=gemini-2.5-flash
```

Run locally:

```bash
npm run dev
```

Open:

```bash
http://localhost:3000
```

## Notes

If `GEMINI_API_KEY` is missing, the app returns sample fallback content so the UI still works.

## Recommended next improvements

- Add multiple resume templates
- Add DOCX export
- Improve original PDF layout matching
- Add ATS score and missing keyword analysis
- Save versions in a database
- Add authentication
