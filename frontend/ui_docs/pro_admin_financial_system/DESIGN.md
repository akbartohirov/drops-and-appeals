---
name: Pro-Admin Financial System
colors:
  surface: '#f8f9ff'
  surface-dim: '#d1dbec'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dfe9fa'
  surface-container-highest: '#d9e3f4'
  on-surface: '#121c28'
  on-surface-variant: '#43474f'
  inverse-surface: '#27313e'
  inverse-on-surface: '#eaf1ff'
  outline: '#737780'
  outline-variant: '#c3c6d1'
  surface-tint: '#3a5f94'
  primary: '#001e40'
  on-primary: '#ffffff'
  primary-container: '#003366'
  on-primary-container: '#799dd6'
  inverse-primary: '#a7c8ff'
  secondary: '#5b5f61'
  on-secondary: '#ffffff'
  secondary-container: '#dde0e2'
  on-secondary-container: '#5f6365'
  tertiary: '#002416'
  on-tertiary: '#ffffff'
  tertiary-container: '#003c27'
  on-tertiary-container: '#00b27b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#a7c8ff'
  on-primary-fixed: '#001b3c'
  on-primary-fixed-variant: '#1f477b'
  secondary-fixed: '#e0e3e5'
  secondary-fixed-dim: '#c4c7c9'
  on-secondary-fixed: '#181c1e'
  on-secondary-fixed-variant: '#434749'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#121c28'
  surface-variant: '#d9e3f4'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
  code-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  sidebar-width: 280px
  container-padding: 2rem
  gutter: 1.5rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 2rem
---

## Brand & Style

The design system is engineered for high-stakes administrative environments where precision, security, and clarity are paramount. The brand personality is authoritative yet approachable, evoking a sense of institutional stability and modern efficiency. 

The aesthetic follows a **Corporate / Modern** direction with a heavy emphasis on **Minimalism**. By prioritizing whitespace and a restrained color palette, the UI reduces cognitive load for operators managing complex financial data. The emotional response should be one of "controlled transparency"—users should feel they have a clear, unobstructed view of the data they are managing.

Key stylistic principles:
- **Functional Density:** Information is packed efficiently but never feels cluttered.
- **Visual Verification:** Every action is met with clear, high-contrast feedback.
- **Reductionist UI:** Non-data elements (decorations) are stripped away to focus on the content.

## Colors

The palette is anchored by **Deep Banking Blue** (Primary), used for core navigation, primary actions, and brand identification to signal trust and heritage. The background uses a **Light Gray** (Secondary) to create a soft contrast that reduces eye strain during long working hours.

**Emerald Green** (Tertiary) is reserved exclusively for success states, positive financial trends, and "active" status indicators. **Error Red** and **Warning Amber** provide high-visibility alerts for failed transactions or security risks.

Color usage guidelines:
- **Surface:** Use #F4F7F9 for the main application canvas.
- **Primary Action:** Use #003366 for main buttons and active sidebar states.
- **Success:** Use #10B981 for amounts deposited or verified statuses.
- **Text:** Use #111827 for high-emphasis text and #4B5563 for secondary metadata.

## Typography

This design system utilizes **Inter** for all typography levels due to its exceptional legibility in data-heavy contexts and its neutral, professional character. 

The type hierarchy is optimized for the Uzbek language, ensuring that descenders and specific characters are clearly visible even at smaller sizes. 

Specific usage rules:
- **Numbers:** Tabular lining (tnum) should be enabled for all data tables to ensure currency and account numbers align vertically.
- **Labels:** Use `label-md` for table headers and form labels to create clear structural separation.
- **Data:** Use `body-md` for standard table row content.

## Layout & Spacing

The layout utilizes a **Fixed Grid** model for the sidebar and a **Fluid Grid** for the main content area. This ensures that the navigation remains constant while the data tables and dashboards expand to utilize the full breadth of the screen.

**Structure:**
- **Sidebar:** Fixed at 280px. Collapses to 80px on smaller viewports.
- **Main Canvas:** 12-column fluid grid with a 24px (1.5rem) gutter.
- **Margins:** 32px (2rem) outer padding for the dashboard container.

**Responsiveness:**
- **Desktop (1280px+):** Full sidebar, 12 columns.
- **Tablet (768px - 1279px):** Collapsed sidebar, 8 columns. Statistical cards stack 2x2.
- **Mobile (Below 768px):** Bottom navigation or hamburger menu, 4 columns. Tables convert to "card view".

## Elevation & Depth

To maintain a professional and clean look, this design system avoids heavy shadows. Instead, it uses **Tonal Layers** and **Low-contrast Outlines** to define hierarchy.

- **Level 0 (Base):** #F4F7F9. The primary background.
- **Level 1 (Surface):** #FFFFFF. Used for cards, table rows, and the sidebar. Defined by a 1px solid border (#E5E7EB) rather than a shadow.
- **Level 2 (Active/Hover):** A subtle, ultra-diffused shadow (0px 4px 6px -1px rgba(0, 0, 0, 0.05)) is used only for interactive elements like floating menus or active cards to suggest clickability.
- **Overlays:** Modal backdrops use a 40% opacity Deep Banking Blue tint to maintain brand presence even during focused tasks.

## Shapes

The design system employs **Soft** roundedness. This 0.25rem (4px) base radius provides a modern touch while maintaining the rigid, structured feel necessary for a banking institution.

- **Buttons & Inputs:** 4px (rounded-md).
- **Cards & Containers:** 8px (rounded-lg).
- **Status Badges/Chips:** 100px (Pill) to distinguish them from interactive buttons.
- **Checkboxes:** 2px radius to maintain a crisp, functional look.

## Components

### Sidebar Navigation
The sidebar uses the Primary color (#003366) as its background. Active states are indicated with a vertical Emerald Green bar on the left edge and a subtle background tint. Labels are in Uzbek (e.g., "Boshqaruv paneli", "Tranzaksiyalar", "Mijozlar").

### Data Tables
Tables are the heart of the system.
- **Header:** Light gray background (#F9FAFB) with uppercase labels.
- **Rows:** Alternating "zebra" stripes or simple 1px dividers.
- **Filtering:** A persistent top bar with search and date range pickers.

### Statistical Cards
Used for the dashboard to show totals (e.g., "Umumiy balans").
- **Structure:** Title (Top-left), Value (Center-large), Trend indicator (Bottom-right).
- **Trend:** Positive trends use Emerald Green; negative trends use Error Red.

### Form Fields
- **Default:** 1px gray border with a clear label above the field.
- **Focus:** 2px solid Deep Banking Blue border.
- **Error:** 1px Red border with a supporting "Xatolik" message below.

### Buttons
- **Primary:** Deep Banking Blue background with White text.
- **Secondary:** White background with Deep Banking Blue border and text.
- **Success:** Emerald Green background (used for "Tasdiqlash" or "To'lovni amalga oshirish").