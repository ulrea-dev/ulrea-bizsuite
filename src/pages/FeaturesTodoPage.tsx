import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, ListTodo, CalendarCheck, AlertCircle, Calendar, CalendarDays, Users, Layers, Plus, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SECTIONS = [
  {
    icon: CalendarCheck,
    title: 'Today View',
    desc: 'See everything due today plus overdue items in one focused list. Start every day knowing exactly what needs to be done.',
  },
  {
    icon: AlertCircle,
    title: 'Overdue',
    desc: 'A dedicated view for tasks that have slipped past their due date. Clear the backlog with a single focused session.',
  },
  {
    icon: Calendar,
    title: 'This Week',
    desc: 'See all tasks due in the next 7 days, grouped by day. Plan your week at a glance without scrolling through noise.',
  },
  {
    icon: CalendarDays,
    title: 'Upcoming',
    desc: 'Look further ahead for tasks due beyond this week. Great for planning capacity and avoiding last-minute surprises.',
  },
  {
    icon: Users,
    title: 'By Assignee',
    desc: 'See all tasks grouped by team member. Perfect for managers checking team workload or reassigning blocked tasks.',
  },
  {
    icon: Layers,
    title: 'All Tasks',
    desc: 'A comprehensive, filterable list of every task across all views. Sort, filter, and bulk-manage your full task backlog.',
  },
  {
    icon: Plus,
    title: 'Bulk Add',
    desc: 'Set a shared business, due date, and assignees once — then type tasks line by line. Add 20 tasks in 60 seconds.',
  },
  {
    icon: ListTodo,
    title: 'Task Overview',
    desc: 'A summary dashboard showing task counts by status and assignee. See the health of your team\'s workload at a glance.',
  },
];

export const FeaturesTodoPage: React.FC = () => (
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
          <ListTodo className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">To-Do</h1>
        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
          The To-Do system in WorkOS is built for speed and clarity. Assign tasks to people, set due dates, and never lose track of what matters.
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
        <h2 className="font-bold text-xl mb-3">Try the To-Do system</h2>
        <p className="text-muted-foreground mb-6 text-sm">Open your workspace and start adding tasks right away.</p>
        <Button asChild><Link to="/login">Open WorkOS <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
      </div>
    </main>
  </div>
);
