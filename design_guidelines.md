# Warehouse Inventory System - Design Guidelines

## Design Approach: Carbon Design System

This utility-focused, data-intensive application follows IBM's Carbon Design System principles, optimized for enterprise warehouse operations with clear data hierarchy, efficient workflows, and minimal visual distractions.

## Core Design Principles

1. **Data First**: Information clarity takes precedence over decorative elements
2. **Workflow Efficiency**: Reduce clicks, optimize for frequent tasks
3. **Scannable Layouts**: Dense information organized for quick comprehension
4. **Operational Clarity**: Clear status indicators, alerts, and action items

## Typography System

**Primary Font**: IBM Plex Sans via Google Fonts
- **Headings**: 
  - H1: text-3xl font-semibold (Dashboard titles)
  - H2: text-2xl font-semibold (Section headers)
  - H3: text-xl font-medium (Card/panel titles)
  - H4: text-lg font-medium (Sub-sections)
- **Body Text**: text-base font-normal (Primary content)
- **Data Labels**: text-sm font-medium uppercase tracking-wide (Form labels, table headers)
- **Data Values**: text-base font-mono (SKUs, quantities, timestamps)
- **Helper Text**: text-sm (Secondary information, form hints)

## Layout System

**Spacing Primitives**: Tailwind units of 1, 2, 4, 6, 8, 12, 16
- Tight spacing (p-1, p-2): Within components, table cells
- Standard spacing (p-4, p-6): Cards, form fields
- Section spacing (p-8, p-12, p-16): Major layout sections

**Grid Structure**:
- Dashboard: 12-column grid with responsive breakpoints
- Sidebar: Fixed 64px (collapsed) or 256px (expanded) width
- Main content: Fluid with max-w-screen-2xl container
- Cards: 2-4 columns on desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4)

## Application Layout Architecture

**Primary Navigation** (Left Sidebar):
- Collapsible sidebar with icon-only collapsed state
- Navigation groups: Dashboard, Inventory, Warehouses, Suppliers, Reports, Settings
- Active state indicator with subtle left border accent
- User profile section at bottom with role badge
- Icons: Heroicons outline style

**Top Header Bar**:
- Global search with keyboard shortcut hint (Cmd+K)
- Notification bell with badge count for low stock alerts
- Quick actions dropdown (Add Product, Record Movement, New Order)
- User avatar with role display and logout

**Dashboard Layout**:
- KPI cards in 4-column grid: Total Products, Total Stock Value, Low Stock Items, Active Warehouses
- Real-time stock level chart (line graph showing trends)
- Recent movements table (last 10 transactions)
- Quick action buttons: Record Stock In, Record Stock Out, Transfer Stock
- Low stock alerts panel with actionable items

## Component Library

**Data Tables**:
- Sticky header row with sortable columns
- Alternating row backgrounds for scannability
- Inline edit capability on double-click
- Row actions menu (3-dot overflow) on hover
- Batch selection with checkboxes and bulk actions toolbar
- Pagination with page size selector (25, 50, 100, 200)
- Column customization and saved views
- Export functionality (CSV, Excel)

**Forms**:
- Single-column form layout with clear label-input pairs
- Inline validation with immediate feedback
- Required field indicators (asterisk)
- Multi-step forms with progress indicator for complex workflows (e.g., new product)
- Autosave indicator for draft states
- Cancel and Save buttons (right-aligned, Save primary)

**Cards & Panels**:
- Warehouse cards: Location name, total products, stock value, capacity indicator
- Product cards: Image thumbnail, SKU, name, total quantity across warehouses, quick view button
- Stat cards: Large number display, label, trend indicator (up/down arrow with percentage)
- Alert cards: Warning icon, message, action button, dismissible

**Modals & Overlays**:
- Stock movement modal: Product selector, quantity input, warehouse selection, notes field
- Product detail slideout: Full product information, stock levels per warehouse, movement history
- Confirmation dialogs: For destructive actions (delete product, remove warehouse)
- Filter panel: Slideout from right with filter controls and reset option

**Status Indicators**:
- Stock level badges: High (green), Medium (yellow), Low (orange), Out of Stock (red)
- Movement type tags: Stock In (blue), Stock Out (purple), Transfer (cyan), Adjustment (gray)
- User role badges: Admin (red), Manager (orange), Staff (blue)
- Warehouse status: Active (green dot), Maintenance (yellow dot), Inactive (gray dot)

**Search & Filters**:
- Omnisearch with category tabs (Products, Warehouses, Suppliers)
- Advanced filter panel with field-specific filters
- Active filter chips with remove option
- Saved filter sets for common queries

**Charts & Visualizations**:
- Stock level trends: Line chart showing historical data
- Warehouse capacity: Horizontal stacked bar charts
- Category distribution: Donut chart
- Movement frequency: Heatmap calendar view
- Supplier performance: Comparison bar chart

**Navigation Patterns**:
- Breadcrumb trail for deep navigation paths
- Tab navigation for related views (Product Details tabs: Overview, Stock Levels, History, Suppliers)
- Steppers for multi-stage processes

## Interaction Patterns

**Low Stock Alerts**:
- Toast notifications in top-right for critical alerts
- Alert banner at dashboard top for multiple low stock items
- Badge count on Alerts navigation item
- Configurable threshold settings per product

**Bulk Operations**:
- Select all/none controls
- Bulk action toolbar appears when items selected
- Actions: Update quantities, Transfer stock, Export selected, Delete selected
- Confirmation step before executing bulk changes

**Quick Actions**:
- Keyboard shortcuts for power users (displayed in tooltips)
- Right-click context menus on table rows
- Floating action button for primary action on mobile/tablet

**Responsive Behavior**:
- Desktop-first design, optimized for 1280px+ screens
- Tablet (768px-1279px): Sidebar auto-collapses, cards stack to 2 columns
- Tables remain scrollable horizontally on smaller screens
- No mobile phone optimization (warehouse environment assumption)

## Animations & Transitions

**Minimal, Functional Only**:
- Smooth sidebar expand/collapse (200ms ease)
- Modal/slideout entrance (fade + slide, 250ms)
- Loading skeletons for table data fetch
- Subtle hover states on interactive elements (100ms)
- NO decorative animations, parallax, or scroll effects

## Images

**No Hero Images**: This is a data application, not a marketing site.

**Product Thumbnails**:
- 80x80px thumbnails in tables and cards
- 400x400px in product detail views
- Placeholder image for products without photos (generic box icon)
- Image upload with drag-drop support in product forms

## Accessibility Standards

- WCAG 2.1 AA compliance throughout
- Keyboard navigation for all interactive elements
- Focus indicators on all focusable elements
- ARIA labels for icons and controls
- Screen reader announcements for dynamic content updates
- High contrast ratio for all text and data displays
- Form fields with clear labels and error messaging

This design creates a professional, efficient warehouse management interface that prioritizes data clarity, workflow efficiency, and operational effectiveness over visual decoration.