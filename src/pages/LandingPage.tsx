import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, ListTodo, Building2, BarChart3, FolderKanban, Users,
  CreditCard, Repeat, Shield, Zap, Globe, ChevronRight, Menu, X,
  ArrowRight, CheckCircle2, TrendingUp, Calendar, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About', href: '/about' },
];

const FEATURES = [
  {
    icon: FolderKanban,
    title: 'Operations Hub',
    desc: 'Manage projects, quick tasks, retainers, and renewals in one unified workspace. Track every deliverable from brief to invoice.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Building2,
    title: 'Back Office',
    desc: 'Oversee multiple businesses, partners, allocations, payables and receivables with admin-grade control and clarity.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: ListTodo,
    title: 'Smart To-Do',
    desc: "Prioritise your day with Today, Overdue, and Schedule views. Assign tasks to team members and never miss a deadline.",
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: CreditCard,
    title: 'Financial Clarity',
    desc: 'Revenue, payments, expenses, and payroll in one place. Multi-currency support with exchange rate management built in.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Users,
    title: 'Team & Partners',
    desc: 'Manage team members, partner allocations, salary records, and business access with granular permission controls.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: TrendingUp,
    title: 'Analytics',
    desc: "Visual dashboards for revenue trends, client performance, and business health. Make decisions backed by your own data.",
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Set up your workspace',
    desc: 'Create your business profile, add team members, and configure your currency and preferences in minutes.',
    icon: Building2,
  },
  {
    step: '02',
    title: 'Run your operations',
    desc: 'Add projects, clients, and retainers. Log expenses and payments as they happen. Everything syncs in real time.',
    icon: Briefcase,
  },
  {
    step: '03',
    title: 'Stay on top of tasks',
    desc: 'Use the To-Do system daily to prioritise, assign, and complete work. Bulk-add tasks in seconds.',
    icon: ListTodo,
  },
  {
    step: '04',
    title: 'Review and grow',
    desc: 'Use analytics and Back Office to track partner allocations, financial health, and business performance.',
    icon: BarChart3,
  },
];

const AREAS = [
  {
    title: 'Operations',
    path: '/features/operations',
    icon: Briefcase,
    color: 'from-primary/20 to-primary/5',
    items: ['Projects & Quick Tasks', 'Retainers & Renewals', 'Client Management', 'Financial Tracking', 'Analytics'],
  },
  {
    title: 'Back Office',
    path: '/features/back-office',
    icon: Building2,
    color: 'from-primary/20 to-primary/5',
    items: ['Multi-Business Management', 'Partner Allocations', 'Team & Access Control', 'Payables & Receivables', 'Bank Accounts'],
  },
  {
    title: 'To-Do',
    path: '/features/todo',
    icon: ListTodo,
    color: 'from-primary/20 to-primary/5',
    items: ['Today & Overdue Priority', 'Weekly Schedule', 'Assignee Views', 'Bulk Task Entry', 'Due Date Reminders'],
  },
];

export const LandingPage: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/95 backdrop-blur border-b border-border shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-base tracking-tight">WorkOS <span className="text-muted-foreground font-normal text-sm">by Ulrea</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l.label}</a>
            ))}
            <a href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild><Link to="/login">Sign In</Link></Button>
            <Button size="sm" asChild><Link to="/login">Get Started Free</Link></Button>
          </div>

          <button className="md:hidden p-2 rounded-md" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-background border-b border-border px-4 pb-4 pt-2 space-y-2">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} className="block py-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => setMenuOpen(false)}>{l.label}</a>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <Button variant="outline" size="sm" asChild><Link to="/login">Sign In</Link></Button>
              <Button size="sm" asChild><Link to="/login">Get Started Free</Link></Button>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="pt-32 pb-20 px-4 sm:px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium mb-6">
          <Globe className="h-3.5 w-3.5" />
          Built for service businesses, agencies & consultancies
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
          Your entire business<br />
          <span className="text-primary">in one OS.</span>
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          WorkOS by Ulrea connects your operations, back office, and daily tasks into a single, calm, professional workspace — no scattered tools, no context switching.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" className="text-base px-8" asChild>
            <Link to="/login">Start for free <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <Button size="lg" variant="outline" className="text-base px-8" asChild>
            <a href="#how-it-works">See how it works</a>
          </Button>
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          {['No credit card required', 'Your data stays yours', 'Works offline'].map(t => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary" />{t}
            </span>
          ))}
        </div>
      </section>

      {/* AREAS OVERVIEW */}
      <section className="py-16 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Three areas. One OS.</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">WorkOS is structured around the three pillars of a well-run business.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {AREAS.map((area) => {
              const Icon = area.icon;
              return (
                <div key={area.title} className={`rounded-2xl border border-border bg-gradient-to-b ${area.color} p-6 hover:border-primary/40 transition-colors`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg">{area.title}</h3>
                  </div>
                  <ul className="space-y-2 mb-5">
                    {area.items.map(i => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ChevronRight className="h-3.5 w-3.5 text-primary flex-shrink-0" />{i}
                      </li>
                    ))}
                  </ul>
                  <Link to={area.path} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                    Learn more <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Everything your business needs</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">No feature bloat. Only what growing service businesses actually use every day.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="group rounded-xl border border-border p-6 hover:border-primary/50 hover:bg-muted/30 transition-all">
                  <div className={`inline-flex p-2.5 rounded-lg ${f.bg} mb-4`}>
                    <Icon className={`h-5 w-5 ${f.color}`} />
                  </div>
                  <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">How WorkOS works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">From setup to daily operation in four simple steps.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {HOW_IT_WORKS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-mono text-primary mb-1">{step.step}</div>
                    <h3 className="font-semibold mb-1.5">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
            <Zap className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to run your business better?</h2>
          <p className="text-muted-foreground mb-8 text-lg">Start for free. No setup fees. No complicated onboarding. Just open it and go.</p>
          <Button size="lg" className="text-base px-10" asChild>
            <Link to="/login">Get started for free <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">WorkOS by Ulrea</span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link to="/login" className="hover:text-foreground transition-colors">Sign In</Link>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Ulrea. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
