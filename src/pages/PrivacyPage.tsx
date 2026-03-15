import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SECTIONS = [
  {
    title: '1. What information we collect',
    content: `WorkOS by Ulrea stores all data locally in your browser (localStorage). We do not have a central server that stores your business data. The only exception is if you choose to connect Google Drive or Google Sheets — in that case, your data is stored in your own Google account, which you control entirely.

We may collect basic anonymous usage analytics (page views, feature usage) to improve the product. This data is never linked to personally identifiable information.`,
  },
  {
    title: '2. How we use your data',
    content: `Your business data (projects, clients, finances, tasks) is stored exclusively on your device and, optionally, in your connected Google account. We do not access, sell, or share this data.

Anonymous analytics data is used solely to understand how features are used and to prioritise improvements.`,
  },
  {
    title: '3. Data ownership',
    content: `You own all data you enter into WorkOS. You can export your data at any time using the Export Data function in any sidebar. You can delete your local data by clearing your browser storage at any time.`,
  },
  {
    title: '4. Google Drive & Google Sheets',
    content: `If you connect Google Drive or Google Sheets, WorkOS will read and write files in your Google Drive. These files are in your account — WorkOS does not store copies of them on our servers. You can revoke access at any time through your Google account settings.`,
  },
  {
    title: '5. Cookies',
    content: `WorkOS uses minimal browser storage (localStorage) to maintain your session and preferences. We do not use tracking cookies.`,
  },
  {
    title: '6. Security',
    content: `All data is stored in your browser or your connected Google account. We recommend keeping your device and Google account secure. WorkOS does not transmit your business data to any third-party servers.`,
  },
  {
    title: '7. Changes to this policy',
    content: `We may update this Privacy Policy from time to time. Changes will be reflected on this page with an updated revision date. Continued use of WorkOS after changes constitutes acceptance of the updated policy.`,
  },
  {
    title: '8. Contact',
    content: `For privacy-related questions or requests, contact us at: privacy@ulrea.com`,
  },
];

export const PrivacyPage: React.FC = () => {
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
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            WorkOS by Ulrea is designed with privacy at its core. Your data is yours. Here's exactly what that means.
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
          <Link to="/terms" className="hover:text-foreground">Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
};
