export type Experience = {
  company: string;
  role: string;
  location?: string;
  duration?: string;
  bullets: string[];
};

export type Project = {
  name: string;
  techStack?: string;
  bullets: string[];
};

export type Education = {
  degree: string;
  institute: string;
  year?: string;
};

export type ResumeData = {
  name: string;
  title: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  portfolio?: string;
  summary?: string;
  skills: string[];
  experience: Experience[];
  projects?: Project[];
  education?: Education[];
  certifications?: string[];
};

export type GenerateResponse = {
  resume: ResumeData;
  coverLetter: string;
  matchSummary: string[];
};
