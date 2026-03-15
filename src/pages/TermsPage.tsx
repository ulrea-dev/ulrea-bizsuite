import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing or using WorkOS by Ulrea ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.`,
  },
  {
    title: '2. Description of Service',
    content: `WorkOS is a business operating system designed for service businesses, agencies, and consultancies. It provides tools for operations management, back office administration, and task management. The Service runs primarily in your browser using local storage.`,
  },
  {
    title: '3. Your Data & Local Storage',
    content: `All business data you enter into WorkOS is stored locally on your device in your browser's localStorage. Ulrea does not receive, store, or have access to your business data unless you explicitly connect Google Drive or Google Sheets.

You are solely responsible for maintaining backups of your data. We recommend regularly exporting your data using the built-in Export Data feature.`,
  },
  {
    title: '4. Acceptable Use',
    content: `You agree to use the Service only for lawful business purposes. You must not:
• Use the Service for any illegal or fraudulent activity
• Attempt to reverse-engineer or exploit the Service
• Use the Service in a way that disrupts its operation for other users
• Impersonate any person or entity`,
  },
  {
    title: '5. Google Services Integration',
    content: `WorkOS offers optional integration with Google Drive and Google Sheets. By connecting these services, you agree to Google's Terms of Service in addition to these terms. WorkOS acts only as a client of your Google account — your data remains in your control.`,
  },
  {
    title: '6. Intellectual Property',
    content: `The WorkOS application, its design, and its code are the intellectual property of Ulrea. Your business data is entirely yours. We claim no rights over the content you enter into the Service.`,
  },
  {
    title: '7. Disclaimers & Limitation of Liability',
    content: `WorkOS is provided "as is" without warranty of any kind. Ulrea shall not be liable for any loss of data, business interruption, or financial loss arising from use of the Service. Users are responsible for maintaining their own data backups.

The Service is designed as a productivity aid, not a replacement for professional accounting, legal, or financial advice.`,
  },
  {
    title: '8. Modifications to the Service',
    content: `Ulrea reserves the right to modify, suspend, or discontinue the Service at any time. We will endeavour to provide reasonable notice for significant changes.`,
  },
  {
    title: '9. Governing Law',
    content: `These Terms shall be governed by the laws of the applicable jurisdiction of Ulrea. Any disputes shall be resolved through good-faith negotiation before pursuing legal action.`,
  },
  {
    title: '10. Contact',
    content: `For terms-related questions, contact us at: legal@ulrea.com`,
  },
];

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm">WorkOS by Ulrea</span>
        </Link>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/" className="flex items-center gap-1.5"><ArrowLeft className="h-4 w-4" /> Back</Link>
        </Button>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="mb-10">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Please read these terms carefully before using WorkOS by Ulrea.
          </p>
        </div>

        <div className="space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.title} className="border-b border-border pb-8 last:border-0">
              <h2 className="font-semibold text-lg mb-3">{s.title}</h2>
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{s.content}</div>
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-border py-8 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <Link to="/about" className="hover:text-foreground">About</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
};
