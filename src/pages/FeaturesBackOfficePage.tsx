import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Building2, Users, Wallet, ArrowUpRight, ArrowDownLeft, Layers, UserCog, ShieldCheck, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SECTIONS = [
  {
    icon: Building2,
    title: 'Multi-Business Management',
    desc: 'Run multiple businesses from one account. Each business has its own data, settings, and team — you switch between them instantly.',
  },
  {
    icon: Users,
    title: 'Business Access Control',
    desc: 'Grant team members access to specific businesses. Control what each person can see and do with granular permission settings.',
  },
  {
    icon: UserCog,
    title: 'Team Members',
    desc: 'A comprehensive directory of all your team. Manage salary records, payment history, and business assignments.',
  },
  {
    icon: Wallet,
    title: 'Bank Accounts',
    desc: 'Log and track multiple bank accounts across your businesses. See balances and link transactions for financial clarity.',
  },
  {
    icon: Users,
    title: 'Partners',
    desc: 'Manage sales partners and managing partners. Set allocation percentages and track partner earnings across all your businesses.',
  },
  {
    icon: Layers,
    title: 'Partner Allocations',
    desc: 'Sophisticated allocation management for partner distributions. Phase-based allocations, batch edits, and full audit trails.',
  },
  {
    icon: ArrowUpRight,
    title: 'Payables',
    desc: 'Track all money you owe — to suppliers, partners, or contractors. Never miss a payment obligation.',
  },
  {
    icon: ArrowDownLeft,
    title: 'Receivables',
    desc: 'Manage money owed to you. Stay on top of outstanding invoices and follow up on overdue amounts.',
  },
  {
    icon: ShieldCheck,
    title: 'Admin Overview',
    desc: 'A high-level dashboard showing cross-business metrics, total payables and receivables, and key financial health indicators.',
  },
];

export const FeaturesBackOfficePage: React.FC = () => (
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
          <Building2 className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Back Office</h1>
        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Back Office is your administrative command centre — where you manage the structure, people, and finances that power your operations.
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
        <h2 className="font-bold text-xl mb-3">Explore Back Office</h2>
        <p className="text-muted-foreground mb-6 text-sm">Open your workspace to see the full Back Office module.</p>
        <Button asChild><Link to="/login">Open WorkOS <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
      </div>
    </main>
  </div>
);
