

## Turn BizSuite into a Work OS with Simplified Navigation

### Overview
Restructure the app so that when users log in, they land on a clean hub that gives instant access to three distinct areas: **Operations** (the main business app), **Back Office** (admin/management), and **To-Do** (productivity). Each area lets you quickly switch to the others.

### Naming Changes

| Current Name | New Name |
|---|---|
| BizSuite | **Operations** |
| Business Management / Admin Console | **Back Office** |
| To-Do | To-Do (unchanged) |

### What Changes

#### 1. New Hub Landing Page (replaces current Dashboard)
When you log in, instead of going straight into a business dashboard, you see a clean **Work OS Hub** with three cards/sections:

- **Operations** -- "Manage your projects, clients, finances" with a summary (active projects count, pending payments, etc.)
- **Back Office** -- "Team members, partners, bank accounts, business settings" with a quick summary
- **To-Do** -- "Your tasks and reminders" with overdue/today counts

Each card is clickable and takes you into that area. This is the `/dashboard` route.

#### 2. Cross-Navigation Between Areas
In every area, the sidebar footer provides quick links to the other two areas:

- **Operations sidebar** (already has To-Do and Business Management links) -- rename labels to "Back Office" and keep "To-Do"
- **Back Office sidebar** -- add a "To-Do" link alongside the existing "Back to Operations" link (renamed from "Back to BizSuite")
- **To-Do sidebar** -- add a "Back Office" link alongside the existing "Back to Operations" link

Additionally, each sidebar's "back" button goes to the hub (`/dashboard`), and there are direct links to the other two areas.

#### 3. Rename References Throughout

### Technical Details

**Files to modify:**

1. **`src/components/DashboardHome.tsx`** -- Replace current dashboard with a Work OS hub showing three area cards. When a business is selected, show the current dashboard content below the hub navigation cards (or redirect into Operations).

2. **`src/components/AppSidebar.tsx`** -- 
   - Rename "BizSuite" to "Operations" in the header (line 202-203)
   - Rename "Business Management" to "Back Office" in the footer link (line 351)
   - Keep the hub accessible via logo/home click

3. **`src/components/AdminSidebar.tsx`** -- 
   - Rename "Admin Console / Business Management" to "Back Office" in the header (line 101-102)
   - Rename "Back to BizSuite" to "Back to Hub" or "Operations" (line 141)
   - Add a "To-Do" quick link in the footer

4. **`src/components/TodoSidebar.tsx`** -- 
   - Add a "Back Office" quick link in the footer alongside the existing "Back to app" link
   - Rename back link to "Operations" or "Back to Hub"

5. **`src/pages/DashboardPage.tsx`** -- Update to support the hub view

6. **`src/layouts/BusinessManagementLayout.tsx`** -- Update any references

7. **`src/components/MobileHeader.tsx`** -- No structural changes needed, titles come from context

### Hub Design

The hub page will have a clean layout:

```text
+------------------------------------------+
|            Welcome, [User]               |
|         Your Work OS                      |
+------------------------------------------+
|                                          |
|  +----------+  +----------+  +--------+  |
|  |          |  |          |  |        |  |
|  |Operations|  |Back      |  | To-Do  |  |
|  |          |  |Office    |  |        |  |
|  | 5 active |  | 3 team   |  | 2 over |  |
|  | projects |  | members  |  | due    |  |
|  +----------+  +----------+  +--------+  |
|                                          |
|  [Recent Activity / Quick Summary below] |
+------------------------------------------+
```

When a user clicks "Operations," they navigate to `/works/projects` (or the current dashboard with business context). "Back Office" goes to `/business-management`, and "To-Do" goes to `/todos`.

### Navigation Flow Summary

- Login --> Hub (`/dashboard`) -- three cards
- Hub --> Operations --> sidebar has links to Back Office + To-Do
- Hub --> Back Office --> sidebar has links to Operations + To-Do  
- Hub --> To-Do --> sidebar has links to Operations + Back Office
- Any sidebar "Home" or logo click --> back to Hub

