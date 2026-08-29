---
name: Canteenery Design System
colors:
  surface: '#f8f9ff'
  surface-dim: '#ccdbf2'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef4ff'
  surface-container: '#e5efff'
  surface-container-high: '#dbe9ff'
  surface-container-highest: '#d4e4fa'
  on-surface: '#0d1c2d'
  on-surface-variant: '#44474e'
  inverse-surface: '#233143'
  inverse-on-surface: '#e9f1ff'
  outline: '#74777f'
  outline-variant: '#c4c6cf'
  surface-tint: '#465f88'
  primary: '#000a1e'
  on-primary: '#ffffff'
  primary-container: '#002147'
  on-primary-container: '#708ab5'
  inverse-primary: '#aec7f6'
  secondary: '#9d4300'
  on-secondary: '#ffffff'
  secondary-container: '#fd761a'
  on-secondary-container: '#5c2400'
  tertiary: '#180500'
  on-tertiary: '#ffffff'
  tertiary-container: '#3d1500'
  on-tertiary-container: '#b97958'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#aec7f6'
  on-primary-fixed: '#001b3d'
  on-primary-fixed-variant: '#2d476f'
  secondary-fixed: '#ffdbca'
  secondary-fixed-dim: '#ffb690'
  on-secondary-fixed: '#341100'
  on-secondary-fixed-variant: '#783200'
  tertiary-fixed: '#ffdbcb'
  tertiary-fixed-dim: '#ffb691'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#6c391d'
  background: '#f8f9ff'
  on-background: '#0d1c2d'
  surface-variant: '#d4e4fa'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style
The brand personality is professional, systematic, and efficient—bridging the gap between high-end enterprise SaaS and the daily vitality of campus life. It targets university administrators and students who value speed, reliability, and clarity.

The visual style is **Corporate / Modern**, leaning heavily into a functional and systematic aesthetic. It prioritizes information density and clear wayfinding to manage high-traffic canteen environments. The interface uses generous whitespace and a "Safe" visual identity to ensure that focus remains on order status and queue logistics rather than decorative elements.

## Colors
This design system utilizes a high-contrast professional palette. The **Deep Navy (#002147)** serves as the anchor for global navigation and core branding, conveying stability and authority. 

The **Appetizing Amber (#F97316)** is used sparingly for primary actions (CTAs) to provide a warm, food-inspired contrast that draws the eye without sacrificing the professional tone. Neutral tones follow a "stainless-steel" logic, using cool grays to define borders and secondary containers. Status colors are vibrant and industry-standard to ensure immediate cognitive recognition of kitchen load and item availability.

## Typography
The system uses **Inter** exclusively to achieve a utilitarian, "startup-grade" feel. The scale is built on a tight hierarchy to manage complex data like menus and order IDs.

- **Headlines:** Use semi-bold weights with slight negative letter-spacing for a modern, compact look.
- **Body:** Standardized at 16px for readability, with 14px used for secondary metadata.
- **Labels:** Small caps or bold weights are used for status indicators and table headers to differentiate them from actionable text.
- **Mobile scaling:** For devices, `display-lg` should downscale to 32px, while `headline-lg` should downscale to 24px to prevent horizontal overflow on menu item names.

## Layout & Spacing
The design system employs a **12-column fluid grid** for desktop and a **4-column grid** for mobile. A consistent 8px base unit (linear scale) ensures a logical rhythm throughout the interface.

- **Desktop:** 24px margins and gutters. Sidebars are fixed at 280px to maximize the "Main Stage" area for queue management boards.
- **Tablets:** Gutters reduce to 16px; cards reflow from 3-column to 2-column layouts.
- **Mobile:** 16px margins. Primary actions (like "Place Order") are pinned to the bottom of the viewport using a safe-area-aware floating container.

## Elevation & Depth
Hierarchy is established through **Tonal Layers** and extremely subtle **Ambient Shadows**.

1. **Level 0 (Background):** `#F8FAFC` (Soft Gray). Used for the canvas.
2. **Level 1 (Cards/Surface):** White background with a 1px border of `#E2E8F0`. No shadow.
3. **Level 2 (Interactive/Floating):** White background with a soft, diffused shadow: `0px 4px 12px rgba(0, 33, 71, 0.05)`. This is used for dropdowns and active order cards.
4. **Level 3 (Modals):** Centered overlays with a stronger shadow and a 40% opacity Navy backdrop to focus user attention on critical inputs.

## Shapes
The design system uses a **Rounded (Level 2)** shape language to balance professional rigor with the friendly atmosphere of a dining environment.

- **Standard Elements:** 0.5rem (8px) for buttons, input fields, and small cards.
- **Large Containers:** 1rem (16px) for main content areas and modal windows.
- **Full Rounding:** Reserved exclusively for status chips and notification badges to distinguish them from interactive buttons.

## Components
- **Buttons:** Primary buttons use `#F97316` with white text. Secondary buttons use a white fill with a `#E2E8F0` border and Navy text.
- **Input Fields:** 8px rounded corners with a 1px `#E2E8F0` border. On focus, the border shifts to the Deep Navy color with a subtle 2px outer glow.
- **Status Chips:** High-contrast background tints with dark text (e.g., Success uses a light green tint with `#166534` text).
- **Queue Cards:** Use a vertical accent bar on the left side (colored by status) to allow for quick scanning of "Ready," "Cooking," or "Delayed" states.
- **Navigation:** A vertical sidebar in Deep Navy (`#002147`) with high-contrast white or light gray icons. Active states use a subtle left-border highlight in the secondary Amber color.
- **Lists:** Clean rows with 1px bottom borders. No zebra striping; use hover-state highlights in `#F1F5F9` for interactivity.