# Agency OS - UI/UX & Design System Guidelines

This document serves as the single source of truth for the Agency OS visual identity, styling conventions, and UI/UX patterns following the "Professional SaaS Light Theme" major refactor. It ensures consistency across all dashboards, components, and user interfaces, aligning the application with modern, enterprise software standards (similar to Jira, Linear, and ClickUp).

---

## 1. Core Philosophy & Theme

*   **Aesthetic**: Professional SaaS Light Mode. Clean, structured, highly readable, and devoid of distracting elements like neon blurs or heavy gradients.
*   **Focus**: Usability and data hierarchy. The interface stays out of the way to let metrics, tasks, and data be the focal point.
*   **Vibe**: Trustworthy, efficient, and snappy. 

---

## 2. Color Palette

The application relies heavily on Tailwind's `slate` color palette to maintain a cool, professional grayscale, accented by semantic colors for data and a custom brand green.

### Base Colors (Grayscale & Surfaces)
*   **App Background**: `bg-slate-50` (A very light, cool gray that reduces eye strain compared to pure white).
*   **Card/Panel Background**: `bg-white` (Provides stark, clean contrast against the `slate-50` background).
*   **Borders (Default)**: `border-slate-200` (Subtle, barely-there separation lines).
*   **Borders (Hover/Active)**: `border-slate-300` (Provides clear interactive feedback without being harsh).

### Typography Colors
*   **Primary Headings & Key Data**: `text-slate-900` (High contrast, highly legible).
*   **Secondary Text & Subtitles**: `text-slate-600` (Used for descriptions, card subtitles, and table headers).
*   **Tertiary Text & Meta**: `text-slate-500` or `text-slate-400` (Used for timestamps, micro-copy, and breadcrumbs).
*   **Inverted Text**: `text-white` (Exclusively used on solid, dark-colored buttons like the primary brand button).

### Brand & Semantic Colors
*   **Primary Brand/Action**: `[#42CA80]` (A vibrant, reassuring green). Used for primary CTAs (e.g., "Sign In", "Save", "Create Project").
*   **Info / Analytics**: `blue-600` over `blue-50` backgrounds (Used for neutral data points like "Total Calls" or "Total Leads").
*   **Success / Completed**: `emerald-600` over `emerald-50` backgrounds (Used for won deals, completed tasks, or positive metrics).
*   **Warning / Pending**: `amber-600` or `orange-500` over `amber-50` backgrounds (Used for pending states, overdue warnings, or actionable items).
*   **Danger / Critical**: `red-500` over `red-50` backgrounds (Used for destructive actions like delete, critical system alerts, and severely overdue tasks).
*   **Strategy / Special**: `purple-600` over `purple-50` backgrounds (Used to highlight strategic metrics like Strategy Sessions or premium features).

---

## 3. Shadows & Depth (Elevation)

We utilize a "flat but elevated" design language. Elements don't feel heavy, but hierarchy is established through very subtle shadows.
*   **Level 0 (Flat)**: Backgrounds (`bg-slate-50`).
*   **Level 1 (Cards & Panels)**: `shadow-sm` on `bg-white`. This creates a slight paper-like lift.
*   **Level 2 (Hover States)**: `shadow-md`. When a user hovers over a clickable card (like a project or task), the shadow increases to indicate interactivity.
*   **Level 3 (Modals & Dropdowns)**: `shadow-lg` or `shadow-xl`. Used for floating menus or popups to ensure they sit clearly above the underlying interface.

*(Note: Glowing blurs and aggressive gradient backgrounds have been explicitly retired from the design system).*

---

## 4. Sizing, Spacing & Layout

The app's layout uses generous whitespace to prevent cognitive overload.

### Border Radius (Rounded Corners)
*   **Cards & Major Panels**: `rounded-xl` (12px radius). Strikes a balance between friendly and structural. 
*   **Buttons & Inputs**: `rounded-lg` (8px radius).
*   **Badges & Icons**: `rounded-full` or `rounded-md` depending on the surrounding context.

### Container & Grids
*   **Main Container**: `max-w-7xl mx-auto`. Restricts extreme width on ultra-wide monitors to maintain readability.
*   **Page Padding**: `px-4 py-6` or `py-8` globally. 
*   **Card Layouts**: We utilize CSS Grid heavily (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`) with a consistent `gap-4` or `gap-6` between cards.
*   **Inner Card Padding**: `p-6` for standard KPI cards and data panels to ensure breathing room.

### Typography Sizing
*   **Page Titles**: `text-2xl` to `text-3xl font-bold` (e.g., "Command Hub").
*   **Card Titles**: `text-base font-semibold` (e.g., "Telecaller Leaderboard").
*   **KPI Numbers**: `text-3xl font-bold`.
*   **Micro-copy / Uppercase Labels**: `text-xs font-medium uppercase tracking-wider` (Used for "SUPER TITLE" descriptors above KPIs).

---

## 5. UI Components & Patterns

### 1. KPI Cards (The Dashboard Standard)
Every dashboard scorecard should follow this structure exactly:
*   White background, slate-200 border, shadow-sm.
*   Hover state: elevates to shadow-md and darkens border to slate-300.
*   Top section: A flexbox containing the metric title (slate-500, uppercase, text-sm) and the metric number (text-3xl).
*   Icon: A 12x12 (`h-12 w-12`) rounded container with a very light background tint (e.g., `bg-blue-50`) and a heavily tinted icon (e.g., `text-blue-600`).
*   Bottom section: A descriptive subtitle (`text-xs text-slate-500`).

### 2. Buttons
*   **Primary Action**: `bg-[#42CA80] text-white hover:bg-[#3ab872] transition-colors rounded-lg px-4 py-2 font-semibold`.
*   **Secondary Action**: `bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200 rounded-lg px-4 py-2 font-medium`.
*   **Destructive Action**: `bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg`.

### 3. Tables & Leaderboards
*   **Header Row**: `bg-slate-50 border-b border-slate-200`. Headers should be `text-xs uppercase tracking-wider text-slate-500 font-semibold`.
*   **Table Body**: `divide-y divide-slate-200`.
*   **Rows**: `hover:bg-slate-50/50 transition-colors` to highlight the row the user's cursor is currently over.

### 4. Modals and Overlays
*   Background backdrop: `bg-black/60 backdrop-blur-sm`.
*   Modal Window: `bg-white rounded-xl shadow-xl border border-slate-200`.

---

## 6. Development Rules for Future Components
When building new pages or features:
1.  **Do not use `#HEX` colors directly** unless it is the explicit brand green (`#42CA80`). Always use Tailwind's `slate` or semantic color classes.
2.  **Avoid pure black and pure white where possible**: Pure white is for foregrounds (cards), pure black is almost never used (use `slate-900` instead).
3.  **Ensure Contrast**: Text must always be legible. `slate-500` is the lightest text color allowed on a `white` or `slate-50` background.
4.  **No explicit Dark Mode classes**: Avoid `dark:bg-...` or `dark:text-...` classes. The application enforces a universal light theme to ensure consistency.
