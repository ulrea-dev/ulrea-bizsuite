

## Mobile Submenu Navigation and Full Responsiveness

### Problem
On mobile, the bottom tab bar navigates to each area (Operations, Back Office, To-Do), but once inside, there is no way to access sub-pages. The desktop sidebar (with all the submenu links) is completely hidden on mobile. Users are stuck on whatever default page loads.

Additionally, many content pages (tables, stat cards, filter bars) are not optimized for mobile viewports.

### Solution

#### 1. Context-Aware Mobile Sub-Navigation Bar

Add a **horizontal scrollable pill/tab strip** below the mobile header on each section. This is a common native pattern (think iOS segmented controls or Android's scrollable tab bar at the top).

- **Operations pages**: Show a scrollable strip with "Projects | Quick Tasks | Retainers | Renewals | Revenue | Payments | Expenses | Payroll | Clients | Analytics"
- **Back Office pages**: Show "Overview | Businesses | Access | Team | Bank Accounts | Partners | Allocations | Payables | Receivables"
- **To-Do pages**: Show "Overview | Today | Week | Upcoming | Overdue | By Assignee | All"

The active sub-page is highlighted. The strip scrolls horizontally so it doesn't overflow. This is created as a reusable `MobileSubNav` component.

#### 2. Integrate Sub-Navigation into Each Layout

Each layout (`DashboardLayout`, `BusinessManagementLayout`, `TodoLayout`) will render the `MobileSubNav` component below the `MobileHeader`, passing in the appropriate sub-page items for that section. It only renders on mobile (hidden on `md+`).

#### 3. Global Mobile Responsiveness Pass

Audit and fix common responsive issues across content pages:

- **Stat card grids**: Change from fixed `grid-cols-4` to `grid-cols-2` on mobile, `grid-cols-4` on desktop
- **Tables**: Wrap in horizontal scroll containers, hide less-important columns on mobile using `hidden sm:table-cell`
- **Filter/action bars**: Stack vertically on mobile instead of horizontal row
- **Modals/dialogs**: Full-screen on mobile (`max-w-full h-full` on small screens)
- **Tab lists**: Make scrollable horizontally on mobile with `overflow-x-auto`
- **Button groups**: Stack or reduce to icon-only on mobile
- **Text truncation**: Apply `truncate` to long names/descriptions on mobile

### Technical Details

**New file: `src/components/MobileSubNav.tsx`**
A reusable horizontal scrollable navigation strip that:
- Accepts an array of `{ label, path, icon? }` items
- Uses `useLocation` to highlight the active item
- Renders as `Link` components in a horizontally scrollable container
- Only visible on mobile (`md:hidden`)
- Has a subtle bottom border and frosted glass background matching the header
- Auto-scrolls the active item into view on mount

**Modified layouts:**
- `src/layouts/DashboardLayout.tsx` -- Import and render `MobileSubNav` with Operations sub-items
- `src/layouts/BusinessManagementLayout.tsx` -- Render `MobileSubNav` with Back Office sub-items
- `src/layouts/TodoLayout.tsx` -- Render `MobileSubNav` with To-Do sub-items

**Responsive fixes across content pages (sampling the most impactful ones):**
- `src/components/ExpensesPage.tsx` -- Responsive stat cards, scrollable table
- `src/components/PaymentsPage.tsx` -- Same pattern
- `src/components/RevenuePage.tsx` -- Same pattern
- `src/components/SalariesPage.tsx` -- Responsive grid
- `src/components/ClientsPage.tsx` -- Card layout on mobile instead of table
- `src/components/ProjectCard.tsx` -- Already responsive (per memory)
- `src/components/AnalyticsPage.tsx` -- Stack charts vertically on mobile
- `src/components/WorkOSHub.tsx` -- Already responsive
- `src/components/admin/*.tsx` -- Responsive tables in Back Office pages
- `src/components/todos/*.tsx` -- Ensure todo lists are touch-friendly

**CSS additions to `src/index.css`:**
- Utility class for horizontal scroll navigation strip
- Hide scrollbar on the sub-nav strip (`scrollbar-width: none`, `-webkit-scrollbar: none`)

### Visual Design (Mobile)

```text
+----------------------------------------------+
|  < Back    Page Title          [⋮ More]       |  <- Mobile Header
+----------------------------------------------+
| [Projects] [Tasks] [Retainers] [Revenue] ... |  <- Scrollable Sub-Nav
+----------------------------------------------+
|                                               |
|              Page Content                     |
|         (responsive cards/tables)             |
|                                               |
+----------------------------------------------+
| [Home] [Operations] [Back Office] [To-Do]     |  <- Bottom Tab Bar
+----------------------------------------------+
```

### Files to Create
- `src/components/MobileSubNav.tsx`

### Files to Modify
- `src/layouts/DashboardLayout.tsx`
- `src/layouts/BusinessManagementLayout.tsx`
- `src/layouts/TodoLayout.tsx`
- `src/index.css`
- `src/components/ExpensesPage.tsx`
- `src/components/PaymentsPage.tsx`
- `src/components/RevenuePage.tsx`
- `src/components/SalariesPage.tsx`
- `src/components/ClientsPage.tsx`
- `src/components/AnalyticsPage.tsx`
- `src/components/admin/AdminOverview.tsx`
- `src/components/admin/TeamMembersPage.tsx`
- `src/components/admin/BankAccountsPage.tsx`
- `src/components/admin/PartnersPage.tsx`
- `src/components/admin/PayablesPage.tsx`
- `src/components/admin/ReceivablesPage.tsx`
- `src/components/todos/TodayPage.tsx`
- `src/components/todos/WeekPage.tsx`
- `src/components/todos/TodoOverview.tsx`
