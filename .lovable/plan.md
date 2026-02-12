

## Native Mobile App Experience for Work OS

### Goal
Transform the app so it looks and feels like a native iOS/Android application on mobile devices, with a polished desktop experience to match. The key elements: a sticky bottom tab bar for primary navigation, smooth transitions, safe area handling, and touch-optimized interactions.

### What Changes

#### 1. Bottom Tab Bar (Mobile) -- The Core Native Feel
On mobile (below 768px), replace the hamburger menu + sidebar pattern with a **fixed bottom tab bar** -- the hallmark of native apps. The tab bar will have 4 tabs:

- **Home** (Hub landing page)
- **Operations** (projects, finances)
- **Back Office** (team, admin)
- **To-Do** (tasks)

This appears on ALL screens so users can switch areas instantly, just like iOS/Android apps. The active tab is highlighted. The To-Do tab shows a badge dot when there are overdue tasks.

#### 2. Mobile Header Becomes a Native-Style Top Bar
The current mobile header gets refined:
- Cleaner, thinner design with just the page title centered (iOS style)
- Back arrow on sub-pages (e.g., project detail) instead of hamburger
- Context actions (like "+" button) on the right side
- No hamburger menu needed -- bottom tabs handle navigation

#### 3. Sidebar Stays Desktop-Only
The existing sidebar system remains for desktop (768px+). On mobile, the sidebar is completely hidden and replaced by the bottom tab bar. No more sheet/drawer sidebar on mobile.

#### 4. Safe Area and PWA Optimizations
- Add `env(safe-area-inset-bottom)` padding so the tab bar doesn't overlap iPhone home indicators
- Add `viewport-fit=cover` meta tag for edge-to-edge display
- Ensure touch targets are at least 44px (Apple HIG standard)
- Add `-webkit-tap-highlight-color: transparent` for clean taps
- Prevent pull-to-refresh interference with `overscroll-behavior: none`

#### 5. Content Area Adjustments
- On mobile, content gets bottom padding to account for the tab bar height (~64px + safe area)
- Scroll areas respect the bottom tab bar
- Smooth page transitions using CSS animations

### Technical Implementation

**New file: `src/components/BottomTabBar.tsx`**
A fixed-bottom navigation component that:
- Renders only on mobile (hidden on md+ via CSS)
- Uses react-router-dom's `useLocation` to highlight the active tab
- Shows a notification dot on To-Do when overdue tasks exist
- Has haptic-style visual feedback on tap (scale animation)
- Uses `safe-area-inset-bottom` for iPhone X+ support

**Modified files:**

1. **`src/layouts/HubLayout.tsx`** -- Add `BottomTabBar`, remove `MobileHeader` hamburger trigger, add bottom padding on mobile
2. **`src/layouts/DashboardLayout.tsx`** -- Add `BottomTabBar`, adjust mobile content padding
3. **`src/layouts/BusinessManagementLayout.tsx`** -- Add `BottomTabBar`, adjust mobile content padding
4. **`src/layouts/TodoLayout.tsx`** -- Add `BottomTabBar`, adjust mobile content padding
5. **`src/components/MobileHeader.tsx`** -- Remove hamburger button, make it a clean title bar with optional back arrow and action buttons
6. **`src/components/ui/sidebar.tsx`** -- On mobile, don't render the Sheet/drawer at all (the bottom tabs replace it)
7. **`index.html`** -- Add `viewport-fit=cover` to the viewport meta tag
8. **`src/index.css`** -- Add global mobile-native styles:
   - `-webkit-tap-highlight-color: transparent`
   - `overscroll-behavior: none` on body
   - Safe area CSS variables
   - Bottom tab bar styles
   - Smooth page transition keyframes

### Visual Design

On mobile, the bottom tab bar will look like this:

```text
+----------------------------------------------+
|                 Page Content                  |
|                                               |
|                                               |
+----------------------------------------------+
|  [Home]   [Operations]  [Back Office] [To-Do] |
|   icon       icon          icon        icon*  |
+----------------------------------------------+
        * = red dot badge when overdue
```

Each tab: icon on top, label below, 44px+ touch target. Active tab uses the primary color. Inactive tabs are muted. The bar has a subtle top border and frosted glass background (`backdrop-blur`).

### Desktop Enhancements
- Sidebar transitions become smoother (already mostly handled)
- Hover states on cards get subtle lift effect
- Content areas use proper max-widths for readability on ultrawide screens

