import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Users, Target, Heart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
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
        <div className="mb-12">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
            <Heart className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">About WorkOS by Ulrea</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            We built WorkOS because we were tired of patching together spreadsheets, project tools, and invoice apps just to run a service business.
          </p>
        </div>

        <div className="space-y-10">
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Our Mission</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              WorkOS is built for service businesses, agencies, and consultancies who need professional-grade tools without enterprise complexity. Our mission is to give every business owner — whether they're managing a design studio, a consulting firm, or a growing agency — a single, calm Operating System that handles operations, back office, and day-to-day tasks in one place.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">What We Believe</h2>
            </div>
            <ul className="space-y-3 text-muted-foreground">
              {[
                'Your tools should reduce cognitive load, not add to it.',
                'Data belongs to you — not locked in some vendor\'s cloud.',
                'A business OS should grow with you, not slow you down.',
                'Good design is not a luxury — it helps you think more clearly.',
                'Speed matters. The fastest workflow is always the simplest.',
              ].map(b => (
                <li key={b} className="flex items-start gap-2.5">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Built by Ulrea</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Ulrea is a product studio focused on building focused, purposeful software. WorkOS is our flagship product — an operating system designed for people who run real businesses and want their tools to work as hard as they do. We're a small team with big opinions about how software should feel: fast, clear, and always in your control.
            </p>
          </section>

          <section className="rounded-xl border border-border bg-muted/30 p-6">
            <h2 className="font-semibold mb-2">Get in touch</h2>
            <p className="text-sm text-muted-foreground mb-4">Have questions, feedback, or just want to say hello? We'd love to hear from you.</p>
            <p className="text-sm font-medium">hello@ulrea.com</p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border py-8 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-foreground">Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
};
