import { NextRequest, NextResponse } from 'next/server';
import { GenerateResponse } from '../../../lib/types';
import { parsePdfText } from '../../../lib/pdf';

export const runtime = 'nodejs';

const BASE_PROFILE = {
  name: 'Rizwan Haider',
  title: 'Frontend / Fullstack Developer',
  email: 'rizwan02riz@gmail.com',
  phone: '+917275255918',
  linkedin: 'https://www.linkedin.com/in/rizwan-haider-b2446b82/'
};

const PROTECTED_AI_BULLET = 'Leveraged AI-assisted development tools including Cursor and OpenAI Codex to accelerate feature delivery, automate debugging workflows, and improve code quality through intelligent refactoring and productivity-focused engineering practices.';

const JD_SKILL_CATALOG: Record<string, Array<{ label: string; aliases: string[] }>> = {
  'Programming Languages': [
    { label: 'JavaScript', aliases: ['javascript', 'js'] },
    { label: 'TypeScript', aliases: ['typescript', 'ts'] },
    { label: 'Python', aliases: ['python'] },
    { label: 'Java', aliases: ['java'] }
  ],
  Frontend: [
    { label: 'React.js', aliases: ['react', 'react.js', 'reactjs'] },
    { label: 'Angular', aliases: ['angular'] },
    { label: 'Vue.js', aliases: ['vue', 'vue.js', 'vuejs'] },
    { label: 'Next.js', aliases: ['next.js', 'nextjs'] },
    { label: 'React Native', aliases: ['react native'] },
    { label: 'HTML5', aliases: ['html5', 'html'] },
    { label: 'CSS3', aliases: ['css3', 'css'] },
    { label: 'Tailwind CSS', aliases: ['tailwind', 'tailwind css'] },
    { label: 'Webpack', aliases: ['webpack'] },
    { label: 'Web Accessibility', aliases: ['accessibility', 'wcag', 'a11y'] },
    { label: 'Web Performance', aliases: ['web performance', 'performance optimization', 'frontend performance'] }
  ],
  'Backend/Tools': [
    { label: 'Node.js', aliases: ['node.js', 'nodejs', 'node'] },
    { label: 'Express.js', aliases: ['express', 'express.js'] },
    { label: 'REST APIs', aliases: ['rest api', 'rest apis', 'restful'] },
    { label: 'GraphQL', aliases: ['graphql'] },
    { label: 'MongoDB', aliases: ['mongodb', 'mongo'] },
    { label: 'MySQL', aliases: ['mysql'] },
    { label: 'AWS', aliases: ['aws', 'amazon web services'] },
    { label: 'Docker', aliases: ['docker'] },
    { label: 'Kubernetes', aliases: ['kubernetes', 'k8s'] }
  ],
  'Testing Tools': [
    { label: 'Jest', aliases: ['jest'] },
    { label: 'Jasmine', aliases: ['jasmine'] },
    { label: 'Playwright', aliases: ['playwright'] },
    { label: 'Cypress', aliases: ['cypress'] },
    { label: 'Puppeteer', aliases: ['puppeteer'] },
    { label: 'Protractor', aliases: ['protractor'] }
  ],
  'State Management': [
    { label: 'Redux', aliases: ['redux'] },
    { label: 'Redux Toolkit', aliases: ['redux toolkit', 'rtk'] },
    { label: 'React Redux', aliases: ['react redux', 'react-redux'] },
    { label: 'NGRX', aliases: ['ngrx'] },
    { label: 'Vuex', aliases: ['vuex'] }
  ],
  'DevOps/CI-CD Tools': [
    { label: 'GitLab', aliases: ['gitlab'] },
    { label: 'GitHub', aliases: ['github'] },
    { label: 'Jenkins', aliases: ['jenkins'] },
    { label: 'Bitbucket', aliases: ['bitbucket'] },
    { label: 'CI/CD Pipelines', aliases: ['ci/cd', 'ci-cd', 'continuous integration', 'continuous delivery'] }
  ],
  Architecture: [
    { label: 'Microfrontends', aliases: ['microfrontend', 'microfrontends', 'micro frontends'] },
    { label: 'Module Federation', aliases: ['module federation'] },
    { label: 'BFF', aliases: ['bff', 'backend for frontend'] },
    { label: 'Design Systems', aliases: ['design system', 'design systems'] },
    { label: 'Microservices', aliases: ['microservice', 'microservices'] }
  ],
  Others: [
    { label: 'Agile Development', aliases: ['agile', 'scrum'] },
    { label: 'Project Management', aliases: ['project management'] },
    { label: 'Cross-browser Compatibility', aliases: ['cross-browser', 'cross browser'] },
    { label: 'Internationalization', aliases: ['internationalization', 'i18n'] },
    { label: 'Localization', aliases: ['localization', 'l10n'] },
    { label: 'Troubleshooting', aliases: ['troubleshooting', 'debugging', 'root cause'] }
  ]
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const resumeFile = formData.get('resume') as File | null;
    const jobDescription = String(formData.get('jobDescription') || '').trim();
    const company = String(formData.get('company') || '').trim();
    const role = String(formData.get('role') || '').trim();
    const extraInstructions = String(formData.get('extraInstructions') || '').trim();

    if (!resumeFile) return NextResponse.json({ error: 'Resume PDF is required.' }, { status: 400 });
    if (!jobDescription) return NextResponse.json({ error: 'Job description is required.' }, { status: 400 });

    const buffer = Buffer.from(await resumeFile.arrayBuffer());
    const resumeText = (await parsePdfText(buffer)).slice(0, 15000);

    const openAiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!openAiKey && !geminiKey) {
      return NextResponse.json(mockResponse(resumeText, jobDescription, company, role));
    }

    const content = openAiKey
      ? await generateWithOpenAI({
          apiKey: openAiKey,
          model: process.env.OPENAI_MODEL || 'gpt-4.1',
          resumeText,
          jobDescription,
          company,
          role,
          extraInstructions
        })
      : await generateWithGemini({
          // Gemini is intentionally kept as a backup provider. To use it later,
          // remove OPENAI_API_KEY from the environment and keep GEMINI_API_KEY.
          apiKey: geminiKey as string,
          model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
          resumeText,
          jobDescription,
          company,
          role,
          extraInstructions
        });

    const json = JSON.parse(content) as GenerateResponse;
    return NextResponse.json(applyBaseProfile(json));
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error?.message || 'Failed to generate resume.' }, { status: 500 });
  }
}

async function generateWithGemini({
  apiKey,
  model,
  resumeText,
  jobDescription,
  company,
  role,
  extraInstructions
}: {
  apiKey: string;
  model: string;
  resumeText: string;
  jobDescription: string;
  company: string;
  role: string;
  extraInstructions: string;
}) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const targetPosition = role || 'Frontend / Fullstack Developer';
  const jdSkillSignals = formatJdSkillSignals(jobDescription);
  const userInstructionBlock = formatExtraInstructions(extraInstructions);
  const firstDraft = await callGemini(endpoint, apiKey, {
    system_instruction: {
      parts: [
        {
          text: `You are an expert resume writer, ATS optimizer, and technical recruiter for Frontend and Fullstack Developer roles. Your job is aggressive but truthful tailoring: the final resume must look purpose-built for the exact job description, not lightly edited.

Internal workflow you must complete before writing the final JSON:
1. Extract the JD's top 12-18 signals: required technologies, frameworks, responsibilities, domain language, seniority expectations, collaboration style, architecture expectations, testing expectations, performance/accessibility expectations, and backend/fullstack requirements.
2. Identify the JD's primary stack and secondary stack. Examples: React/TypeScript/Next.js, Angular/RxJS, Node/Express, GraphQL, REST APIs, AWS, testing libraries, design systems, accessibility, performance, CI/CD.
3. Extract only supported evidence from the candidate resume.
4. Create an internal JD-to-resume evidence map. Every rewritten experience bullet must be based on this map.
5. Build categorized Technical Skills rows. Put the JD's primary stack first inside each relevant category, include JD-requested skills even when they are not in the resume, and flag unsupported added skills in matchSummary.
6. Rewrite bullets so they mirror the JD's stack, responsibilities, and language while staying factual.
7. Identify gaps between the JD and resume. Put missing or weak JD matches in matchSummary as gaps, never as claimed resume skills.

Rules:
- The candidate's target position is always Frontend / Fullstack Developer.
- Always use these fixed candidate details exactly: name Rizwan Haider, title Frontend / Fullstack Developer, email rizwan02riz@gmail.com, phone +917275255918, LinkedIn https://www.linkedin.com/in/rizwan-haider-b2446b82/, experience 10+ years.
- Do not invent fake employers, degrees, certifications, tools, metrics, or unsupported achievements.
- Strongly rephrase, reorder, and emphasize existing experience to match the JD.
- Mirror the JD's language more directly: reuse the JD's role wording, responsibility verbs, stack names, product/domain terms, and seniority language when the resume evidence supports it.
- Do not use Markdown formatting anywhere. Never add **bold**, __bold__, backticks, bullet symbols inside JSON strings, HTML tags, or decorative formatting characters.
- The cover letter must be tailored as deeply as the resume. It should read like it was written for this exact JD, not as a reusable generic letter.
- Preserve and slightly enhance this AI-assisted development achievement when it appears in the resume: "Leveraged AI-assisted development tools including Cursor and OpenAI Codex to accelerate feature delivery, automate debugging workflows, and improve code quality through intelligent refactoring." Keep Cursor and OpenAI Codex explicitly named.
- Prioritize Professional Experience first, then Technical Skills.
- Do not include a professional summary in the resume.
- Put positioning, motivation, and JD-specific narrative in the cover letter instead of the resume.
- Each experience bullet should target at least one JD signal when the resume supports it.
- Prefer JD-specific bullets over generic engineering bullets.
- Restructure bullets around the JD, not the old resume order: lead with JD-matched stack/responsibility, then candidate action, then outcome.
- Align the resume toward the employer's requested stack. If the JD wants React + TypeScript, foreground React and TypeScript across skills and bullets. If it wants Angular, foreground Angular. If it wants fullstack Node/API work, foreground Node.js, APIs, backend collaboration, and integration work. If it wants testing, accessibility, performance, or design systems, foreground those themes when supported.
- Do not over-emphasize unrelated technologies just because they appear in the original resume. Keep them only if they help the target JD or show breadth after the primary JD stack is covered.
- Technical Skills must be categorized like this exact pattern: "Programming Languages: ...", "Frontend: ...", "Backend/Tools: ...", "Testing Tools: ...", "State Management: ...", "DevOps/CI-CD Tools: ...", "Architecture: ...", "Others: ...". Include only useful non-empty categories.
- Add JD-requested skills/tools into the correct Technical Skills category even if they are not present in the resume, but do not write experience bullets claiming hands-on usage unless the resume supports it. Mark unsupported added skills as Gap items in matchSummary.
- Add a matchSummary item beginning with "Gap Skills:" listing important JD skills that were added for ATS but do not have direct resume evidence.
- Use exact JD keywords naturally when truthful. Example: if the JD says "React performance optimization", do not only say "frontend work"; say "optimized React UI performance" if supported.
- Keep bullets concrete: action + technology/context + impact/outcome. Avoid vague phrases like "worked on various tasks".
- Keep 4-6 bullets per role when possible, ordered by JD relevance.
- If the JD mentions skills, tools, domain experience, certifications, cloud platforms, testing frameworks, backend technologies, or responsibilities missing from the resume, include skill/tool keywords in the categorized Technical Skills section when useful for ATS, but mention missing direct evidence in matchSummary as gaps. Do not claim unsupported hands-on usage in experience bullets.
- Gap format must be useful and specific: "Gap: JD asks for X; resume does not show direct evidence. Add it only if true, or position adjacent experience Y." Do not hide gaps.
- Return JSON only matching this shape: {"resume": {"name":"","title":"Frontend / Fullstack Developer","email":"","phone":"","location":"","linkedin":"","portfolio":"","experience":[{"company":"","role":"","location":"","duration":"","bullets":[]}],"skills":[],"projects":[{"name":"","techStack":"","bullets":[]}],"education":[{"degree":"","institute":"","year":""}],"certifications":[]}, "coverLetter":"", "matchSummary":[] }`
        }
      ]
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Candidate fixed profile:\nName: Rizwan Haider\nExperience: 10+ years\nProfile: Frontend / Fullstack Developer\nEmail: rizwan02riz@gmail.com\nPhone: +917275255918\nLinkedIn: https://www.linkedin.com/in/rizwan-haider-b2446b82/\n\nCurrent resume text:\n${resumeText}\n\nTarget company: ${company || 'Not specified'}\nTarget position: ${targetPosition}\n\nDetected JD skill signals from the application scanner:\n${jdSkillSignals}${userInstructionBlock}\n\nJob posting:\n${jobDescription}\n\nTailoring instructions:\n- Treat the JD as the scoring rubric. Optimize the resume for this exact JD.
- Follow the optional user instructions when provided, as long as they do not conflict with truthfulness, fixed profile details, no Markdown formatting, no professional summary, or the required JSON shape.
- Use the JD's exact important keywords where the resume supports them.
- Do not use Markdown formatting. Return plain text strings only; no **, __, backticks, HTML, or decorative emphasis.
- Detect the employer's requested tech stack and reshape the resume around that stack.
- Mirror the JD wording more closely than the original resume wording. If the JD says "build reusable UI components", "integrate REST APIs", "optimize web performance", "collaborate with cross-functional teams", or similar phrases, reuse that language when truthful.
- Restructure each bullet to start with the JD-matched responsibility or stack wherever possible, then add the supported action and outcome.
- Use the detected JD skill signals above as a checklist. Supported skills should appear in bullets/projects/skills. Unsupported but important skills should appear in the right Technical Skills category and in matchSummary as "Gap Skills:" or "Gap:".
- Technical Skills must be categorized, not flat. Return resume.skills as category strings, for example: ["Programming Languages: JavaScript, TypeScript, Python", "Frontend: React, Angular, Next.js, Tailwind CSS", "Backend/Tools: Node.js, Express.js, GraphQL, MongoDB, AWS", "Testing Tools: Jest, Playwright", "State Management: Redux Toolkit, NGRX", "DevOps/CI-CD Tools: GitLab, Jenkins, Docker", "Architecture: Microfrontends, Module Federation, BFF", "Others: Web Performance, Web Accessibility, Cross-browser Compatibility"].
- Within each Technical Skills category, order skills by this JD's required stack first. Add JD skills that are missing from the resume into the correct category when ATS relevance is high, and call them out as gaps if direct experience is not supported.
- Experience bullets must mention the JD stack naturally wherever supported by the resume. For example, React JDs should see React/TypeScript/UI architecture/API integration early; Angular JDs should see Angular/TypeScript/RxJS-style frontend delivery early; fullstack JDs should see frontend + Node/API/fullstack collaboration early.
- If a current resume bullet is generic, rewrite it into a JD-specific bullet using supported facts.
- Do not copy the old resume wording when a stronger JD-aligned rewrite is possible.
- For resume title, use "Frontend / Fullstack Developer" unless the JD clearly prefers either "Frontend Developer" or "Fullstack Developer".
- Resume section order must be: Professional Experience, Technical Skills, Projects, Education, Certifications.
- Do not add a Professional Summary section or a resume.summary value.
- Keep impact bullets concise, technical, and outcome-oriented.
- The first skills inside each category must be the strongest matches for this JD's stack.
- Projects should be included only if they strengthen JD fit. For each project, include a "techStack" string using the strongest JD-aligned technologies for that project, for example "React, TypeScript, Node.js, GraphQL, AWS". Do not include unsupported project tech unless it appears in the resume or is clearly tied to the project text.
- Emphasize React, TypeScript, JavaScript, UI architecture, performance, accessibility, APIs, testing, and fullstack/backend work when the JD asks for them and the resume supports them.
- Do not remove the AI-assisted development bullet about Cursor and OpenAI Codex. Improve it slightly if possible, for example by making it outcome-focused and tying it to faster delivery, debugging automation, intelligent refactoring, code quality, or developer productivity.
- Cover letter should be efficient, direct, confident, JD-specific, and 180-260 words.
- Cover letter must mention the target company when provided, the target role/profile, the JD's primary tech stack, and 2-4 JD responsibilities or business themes.
- Cover letter must connect those JD themes to supported resume evidence. Do not just list technologies; explain how the candidate's experience maps to what the company is asking for.
- Cover letter should not mention gaps unless the gap is framed positively as adjacent experience. Do not apologize.
- matchSummary must include 4-7 bullets. Each bullet should either say "Aligned:" with a JD requirement and matching resume evidence, or "Gap:" for an important JD requirement not clearly supported.
- If any detected JD skill signal is not clearly supported by the resume, include one compact matchSummary item starting "Gap Skills:" followed by those skills and the closest adjacent experience if any.
- Always include at least one "Gap:" item when the JD contains a requirement that is not clearly supported by the resume. If there are no meaningful gaps, include "Gap: No major JD gap found from the provided resume evidence."`
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json'
    }
  });

  return callGemini(endpoint, apiKey, {
    system_instruction: {
      parts: [
        {
          text: `You are the final resume alignment reviewer. Improve the provided JSON so it matches the JD more strongly while staying truthful to the source resume. Return JSON only, with the same shape.

Hard review gates:
- The resume must be obviously tailored to the JD's primary stack, seniority, responsibilities, and domain language.
- Do not add Markdown formatting. Return plain text strings only; no **, __, backticks, HTML, or decorative emphasis.
- Resume bullets should mirror the JD's exact language where truthful, especially responsibility verbs, stack phrases, architecture terms, testing terms, and product/domain wording.
- The first 2 bullets in the most recent relevant role should contain the strongest supported JD match.
- Technical Skills must place JD-required stack first in each category and include high-value JD keywords for ATS.
- Important JD skills from the detected signal list must be included in Technical Skills. If unsupported by source resume evidence, they must also be listed in matchSummary as "Gap Skills:" or a specific "Gap:" item.
- Projects must have a boldable techStack value that mirrors the JD where supported.
- Cover letter must mention company/role when provided, the primary stack, and 2-4 JD responsibilities/business themes.
- Remove generic wording. Replace it with JD-specific language supported by the resume.
- Do not invent unsupported claims. If a JD requirement lacks resume evidence, keep it out of experience bullets and add a clear Gap item.
- Preserve Cursor and OpenAI Codex in the AI-assisted development bullet.
- No professional summary. Title remains Frontend / Fullstack Developer.
- Return only valid JSON: {"resume": {"name":"","title":"Frontend / Fullstack Developer","email":"","phone":"","location":"","linkedin":"","portfolio":"","experience":[{"company":"","role":"","location":"","duration":"","bullets":[]}],"skills":[],"projects":[{"name":"","techStack":"","bullets":[]}],"education":[{"degree":"","institute":"","year":""}],"certifications":[]}, "coverLetter":"", "matchSummary":[] }`
        }
      ]
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Original resume text:\n${resumeText}\n\nTarget company: ${company || 'Not specified'}\nTarget position: ${targetPosition}\n\nDetected JD skill signals from the application scanner:\n${jdSkillSignals}${userInstructionBlock}\n\nJob posting:\n${jobDescription}\n\nFirst draft JSON:\n${firstDraft}\n\nFinal review task:\n1. Score the first draft internally against the JD.
2. Rewrite weak bullets, skills ordering, project tech stacks, cover letter wording, and matchSummary.
3. Make the final output more aligned than the first draft, especially on JD stack, responsibilities, keywords, and exact JD phrasing.
4. Use the detected JD skill signals as a checklist. Add missing important JD skills to the correct Technical Skills category for ATS.
5. Apply optional user instructions when provided, as long as they do not conflict with the fixed candidate profile, source resume truthfulness, no Markdown formatting, or required JSON shape.
6. Any detected JD skill that lacks direct resume evidence must be included in matchSummary as "Gap Skills:" or "Gap:".
7. Keep all claims truthful to the provided resume evidence.
8. Return the final JSON only.`
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.15,
      responseMimeType: 'application/json'
    }
  });
}

async function generateWithOpenAI({
  apiKey,
  model,
  resumeText,
  jobDescription,
  company,
  role,
  extraInstructions
}: {
  apiKey: string;
  model: string;
  resumeText: string;
  jobDescription: string;
  company: string;
  role: string;
  extraInstructions: string;
}) {
  const targetPosition = role || 'Frontend / Fullstack Developer';
  const jdSkillSignals = formatJdSkillSignals(jobDescription);
  const userInstructionBlock = formatExtraInstructions(extraInstructions);
  const firstDraft = await callOpenAI(apiKey, model, {
    instructions: `You are an expert resume writer, ATS optimizer, and technical recruiter for Frontend and Fullstack Developer roles. Create a deeply JD-tailored resume and cover letter as strict JSON.

Rules:
- The candidate's target profile is always Frontend / Fullstack Developer with 10+ years of experience.
- Fixed candidate details: Rizwan Haider, Frontend / Fullstack Developer, rizwan02riz@gmail.com, +917275255918, LinkedIn https://www.linkedin.com/in/rizwan-haider-b2446b82/.
- Do not invent fake employers, degrees, certifications, tools, metrics, or unsupported achievements.
- Mirror the JD language directly when supported: stack names, responsibility verbs, product/domain wording, seniority terms, testing/performance/accessibility terms, architecture terms.
- Restructure bullets around the JD, not the old resume order: lead with JD-matched responsibility or stack, then supported action, then outcome.
- Do not use Markdown formatting anywhere. Return plain text strings only; no **, __, backticks, HTML, or decorative emphasis.
- Do not include a professional summary.
- Resume order must be Professional Experience, Technical Skills, Projects, Education, Certifications.
- Technical Skills must use category strings: "Programming Languages: ...", "Frontend: ...", "Backend/Tools: ...", "Testing Tools: ...", "State Management: ...", "DevOps/CI-CD Tools: ...", "Architecture: ...", "Others: ...".
- Add important JD-requested skills/tools to the correct Technical Skills category for ATS. If direct resume evidence is missing, add them as "Gap Skills:" or "Gap:" in matchSummary, not as experience claims.
- Preserve and slightly enhance the AI-assisted development achievement with Cursor and OpenAI Codex explicitly named.
- Cover letter must be efficient, confident, JD-specific, 180-260 words, and connect the candidate's evidence to the company, role, stack, and 2-4 JD responsibilities.
- Return JSON only matching this shape: {"resume":{"name":"","title":"Frontend / Fullstack Developer","email":"","phone":"","location":"","linkedin":"","portfolio":"","experience":[{"company":"","role":"","location":"","duration":"","bullets":[]}],"skills":[],"projects":[{"name":"","techStack":"","bullets":[]}],"education":[{"degree":"","institute":"","year":""}],"certifications":[]},"coverLetter":"","matchSummary":[]}`,
    input: `Candidate fixed profile:
Name: Rizwan Haider
Experience: 10+ years
Profile: Frontend / Fullstack Developer
Email: rizwan02riz@gmail.com
Phone: +917275255918
LinkedIn: https://www.linkedin.com/in/rizwan-haider-b2446b82/

Current resume text:
${resumeText}

Target company: ${company || 'Not specified'}
Target position: ${targetPosition}

Detected JD skill signals from the application scanner:
${jdSkillSignals}${userInstructionBlock}

Job posting:
${jobDescription}

Tailoring task:
1. Extract the JD's primary and secondary stack, responsibilities, seniority signals, domain language, architecture/testing/performance/accessibility expectations, and collaboration expectations.
2. Map those JD signals to supported evidence from the resume.
3. Rewrite experience bullets to mirror the JD wording and stack where truthful.
4. Put JD-relevant skills first in every skill category.
5. Add missing but important JD skills to Technical Skills for ATS and list unsupported ones in matchSummary as "Gap Skills:" or "Gap:".
6. Include projects only when they strengthen JD fit, with a JD-aligned techStack string.
7. Generate a JD-specific cover letter.`
  }, 0.2);

  return callOpenAI(apiKey, model, {
    instructions: `You are the final resume alignment reviewer. Improve the provided JSON so it matches the JD more strongly while staying truthful to the source resume. Return JSON only with the same shape.

Hard review gates:
- The resume must be obviously tailored to the JD's primary stack, seniority, responsibilities, and domain language.
- The first 2 bullets in the most recent relevant role must contain the strongest supported JD matches.
- Technical Skills must place JD-required stack first in each category.
- Important detected JD skills must appear in Technical Skills. Unsupported detected skills must appear in matchSummary as "Gap Skills:" or "Gap:".
- Projects must have techStack values that mirror the JD where supported.
- Cover letter must mention company/role when provided, primary stack, and 2-4 JD responsibilities/business themes.
- Remove generic wording and replace it with JD-specific language supported by resume evidence.
- Do not invent unsupported claims.
- Preserve Cursor and OpenAI Codex in the AI-assisted development bullet.
- No professional summary.
- No Markdown formatting.
- Return valid JSON only.`,
    input: `Original resume text:
${resumeText}

Target company: ${company || 'Not specified'}
Target position: ${targetPosition}

Detected JD skill signals from the application scanner:
${jdSkillSignals}${userInstructionBlock}

Job posting:
${jobDescription}

First draft JSON:
${firstDraft}

Final review task:
1. Score the draft internally against the JD.
2. Rewrite weak bullets, skills ordering, project tech stacks, cover letter wording, and matchSummary.
3. Make the final output more aligned than the draft, especially on JD stack, responsibilities, keywords, and exact JD phrasing.
4. Keep all claims truthful to the provided resume evidence.
5. Return the final JSON only.`
  }, 0.15);
}

async function callOpenAI(
  apiKey: string,
  model: string,
  body: { instructions: string; input: string },
  temperature: number
) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      instructions: body.instructions,
      input: body.input,
      temperature,
      store: false,
      text: {
        format: {
          type: 'json_object'
        }
      }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message || `OpenAI request failed with status ${response.status}`;
    throw new Error(message);
  }

  const text = data.output_text || data.output
    ?.flatMap((item: any) => item.content || [])
    ?.map((content: any) => content.text || '')
    ?.join('')
    ?.trim();

  if (!text) throw new Error('OpenAI returned an empty response.');
  return text;
}

async function callGemini(endpoint: string, apiKey: string, body: unknown) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message || `Gemini request failed with status ${response.status}`;
    throw new Error(message);
  }

  const text = data?.candidates?.[0]?.content?.parts?.map((part: any) => part.text || '').join('').trim();
  if (!text) throw new Error('Gemini returned an empty response.');

  return text;
}

function formatJdSkillSignals(jobDescription: string) {
  const normalizedJd = jobDescription.toLowerCase();
  const rows = Object.entries(JD_SKILL_CATALOG)
    .map(([category, skills]) => {
      const matches = skills
        .filter(({ aliases }) => aliases.some(alias => hasSkillAlias(normalizedJd, alias)))
        .map(({ label }) => label);

      return matches.length ? `${category}: ${matches.join(', ')}` : '';
    })
    .filter(Boolean);

  return rows.length ? rows.join('\n') : 'No common frontend/fullstack skill signals detected automatically; rely on the JD text.';
}

function formatExtraInstructions(extraInstructions: string) {
  return extraInstructions
    ? `\n\nOptional user instructions to apply:\n${extraInstructions}`
    : '';
}

function hasSkillAlias(normalizedText: string, alias: string) {
  const escaped = escapeRegExp(alias.toLowerCase());
  const startsWithWord = /^[a-z0-9]/i.test(alias);
  const endsWithWord = /[a-z0-9]$/i.test(alias);
  const prefix = startsWithWord ? '(?<![a-z0-9])' : '';
  const suffix = endsWithWord ? '(?![a-z0-9])' : '';
  return new RegExp(`${prefix}${escaped}${suffix}`, 'i').test(normalizedText);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyBaseProfile(response: GenerateResponse): GenerateResponse {
  const sanitized = sanitizeGeneratedResponse(response);
  const experience = sanitized.resume?.experience || [];
  const hasProtectedAiBullet = experience.some((exp) =>
    exp.bullets?.some((bullet) => /cursor/i.test(bullet) && /openai codex/i.test(bullet))
  );

  const protectedExperience = hasProtectedAiBullet
    ? experience
    : experience.length
      ? [
          {
            ...experience[0],
            bullets: [...(experience[0].bullets || []), PROTECTED_AI_BULLET]
          },
          ...experience.slice(1)
        ]
      : [
          {
            company: 'Professional Experience',
            role: BASE_PROFILE.title,
            location: '',
            duration: '10+ years',
            bullets: [PROTECTED_AI_BULLET]
          }
        ];

  return {
    ...sanitized,
    resume: {
      ...sanitized.resume,
      ...BASE_PROFILE,
      title: BASE_PROFILE.title,
      skills: sanitized.resume?.skills || [],
      experience: protectedExperience
    },
    matchSummary: sanitized.matchSummary?.length ? sanitized.matchSummary : ['Aligned: Resume was tailored against the provided job description.']
  };
}

function sanitizeGeneratedResponse(response: GenerateResponse): GenerateResponse {
  const cleanArray = (values?: string[]) => (values || []).map(cleanGeneratedText).filter(Boolean);

  return {
    ...response,
    coverLetter: cleanGeneratedText(response.coverLetter || ''),
    matchSummary: cleanArray(response.matchSummary),
    resume: {
      ...response.resume,
      name: cleanGeneratedText(response.resume?.name || ''),
      title: cleanGeneratedText(response.resume?.title || ''),
      email: cleanGeneratedText(response.resume?.email || ''),
      phone: cleanGeneratedText(response.resume?.phone || ''),
      location: cleanGeneratedText(response.resume?.location || ''),
      linkedin: cleanGeneratedText(response.resume?.linkedin || ''),
      portfolio: cleanGeneratedText(response.resume?.portfolio || ''),
      skills: cleanArray(response.resume?.skills),
      experience: (response.resume?.experience || []).map(exp => ({
        ...exp,
        company: cleanGeneratedText(exp.company),
        role: cleanGeneratedText(exp.role),
        location: cleanGeneratedText(exp.location || ''),
        duration: cleanGeneratedText(exp.duration || ''),
        bullets: cleanArray(exp.bullets)
      })),
      projects: (response.resume?.projects || []).map(project => ({
        ...project,
        name: cleanGeneratedText(project.name),
        techStack: cleanGeneratedText(project.techStack || ''),
        bullets: cleanArray(project.bullets)
      })),
      education: (response.resume?.education || []).map(education => ({
        ...education,
        degree: cleanGeneratedText(education.degree),
        institute: cleanGeneratedText(education.institute),
        year: cleanGeneratedText(education.year || '')
      })),
      certifications: cleanArray(response.resume?.certifications)
    }
  };
}

function cleanGeneratedText(value: string) {
  return String(value || '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\s+\n/g, '\n')
    .trim();
}

function mockResponse(resumeText: string, jd: string, company: string, role: string): GenerateResponse {
  return {
    resume: {
      name: BASE_PROFILE.name,
      title: BASE_PROFILE.title,
      email: BASE_PROFILE.email,
      phone: BASE_PROFILE.phone,
      location: 'India',
      linkedin: BASE_PROFILE.linkedin,
      skills: [
        'Programming Languages: JavaScript, TypeScript',
        'Frontend: React, Angular, Next.js, Webpack, Web Design, Web Accessibility',
        'Backend/Tools: Node.js, REST APIs, GraphQL',
        'Testing Tools: Jest',
        'State Management: Redux, Redux Toolkit',
        'DevOps/CI-CD Tools: GitLab, CI/CD pipelines',
        'Architecture: Microfrontends, Module Federation, BFF',
        'Others: Web Performance, Performance Optimization, Analytical Skills, Cross-browser Compatibility'
      ],
      experience: [
        {
          company: 'Current Company',
          role: 'Senior Software Engineer',
          location: 'India',
          duration: 'Present',
          bullets: [
            'Built scalable frontend and fullstack-ready modules using React/Angular, TypeScript, reusable components, and clean architecture principles.',
            'Improved user experience by implementing complex forms, validation flows, responsive layouts, API integrations, and performance-focused UI updates.',
            'Collaborated with product, UX, and backend teams to translate business requirements into reliable Frontend / Fullstack Developer solutions.',
            'Troubleshot production issues, performed root-cause analysis, and delivered sustainable fixes across critical user journeys.'
          ]
        }
      ],
      projects: [
        { name: 'Resume Tailoring Tool', techStack: 'React, TypeScript, Next.js, PDF Export', bullets: ['Generated as a fallback sample because GEMINI_API_KEY is not configured. Add your API key to enable real tailoring.'] }
      ],
      education: [],
      certifications: []
    },
    coverLetter: `Dear Hiring Team,\n\nI am excited to apply for the ${role || 'Frontend / Fullstack Developer'} role${company ? ` at ${company}` : ''}. I bring 10+ years of hands-on experience building scalable, responsive applications with React, TypeScript, JavaScript, API integrations, complex forms, and performance-focused UI architecture.\n\nWhat stands out to me about this opportunity is the chance to contribute as an engineer who can work across frontend delivery and fullstack collaboration. I have translated product requirements into reliable user experiences, partnered closely with UX and backend teams, and handled production issues with ownership and clarity. My focus is clean implementation, maintainable components, accessible interfaces, and practical solutions that support both users and business goals.\n\nI would welcome the opportunity to discuss how my Frontend / Fullstack Developer experience can contribute to your team.\n\nRegards,\nRizwan Haider`,
    matchSummary: ['GEMINI_API_KEY is not configured, so this is sample output.', 'Add .env.local with your Gemini API key to enable actual JD-based tailoring.']
  };
}
