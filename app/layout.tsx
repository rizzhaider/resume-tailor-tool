import './globals.css';

export const metadata = {
  title: 'Resume Tailor Tool',
  description: 'Tailor resume and cover letter for job postings',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
