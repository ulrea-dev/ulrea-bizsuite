import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Briefcase, FolderKanban, ListChecks, Repeat, Calendar, CreditCard, TrendingUp, Receipt, Users, BarChart3, UserCheck, ArrowLeft, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SECTIONS = [
  {
    icon: FolderKanban,
    title: 'Projects',
    desc: 'Manage client projects from kickoff to delivery. Track budgets, team assignments, milestones, and payment stages all in one project card.',
  },
  {
    icon: ListChecks,
    title: 'Quick Tasks',
    desc: 'For ad-hoc work that doesn\'t need a full project. Log quick tasks with rates, assignees, and payment tracking — perfect for hourly or per-task billing.',
  },
  {
    icon: Repeat,
    title: 'Retainers',
    desc: 'Manage ongoing monthly retainers with clients. Track retainer value, billing cycles, and retainer history without losing sight of scope.',
  },
  {
    icon: Calendar,
    title: 'Renewals',
    desc: 'Stay on top of annual subscriptions, software licenses, and recurring contracts. Get alerts before things expire.',
  },
  {
    icon: UserCheck,
    title: 'Clients',
    desc: 'A clean client directory with contact info, linked projects, payment history, and quick-access client health overview.',
  },
  {
    icon: TrendingUp,
    title: 'Revenue',
    desc: 'All your income in one view. Filter by project type, client, or time period. See what\'s invoiced, what\'s paid, and what\'s pending.',
  },
  {
    icon: CreditCard,
    title: 'Payments',
    desc: 'Log and track all incoming payments with currency support. Link payments to projects, retainers, or tasks automatically.',
  },
  {
    icon: Receipt,
    title: 'Expenses',
    desc: 'Track business expenses by category, project, or period. Separate recurring from one-off costs for clean reporting.',
  },
  {
    icon: Users,
    title: 'Payroll',
    desc: 'Manage team member salaries, salary records, and payment history without a separate HR tool.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    desc: 'Dashboards that surface revenue trends, top clients, expense breakdowns, and business performance — all from your own data.',
  },
];

export const FeaturesOperationsPage: React.FC = () => (
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
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-12">
        <div className="inline-flex p-3 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
          <Briefcase className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Operations</h1>
        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
          The Operations area is where you run your day-to-day business — managing the work you deliver and the money it generates.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-14">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="rounded-xl border border-border p-5 hover:border-primary/40 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold">{s.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          );
        })}
      </div>
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-8 text-center">
        <h2 className="font-bold text-xl mb-3">See Operations in action</h2>
        <p className="text-muted-foreground mb-6 text-sm">Sign in to your workspace to explore the full Operations module.</p>
        <Button asChild><Link to="/login">Open WorkOS <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
      </div>
    </main>
  </div>
);
