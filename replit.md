# Warehouse Inventory Management System

## Overview

This is an enterprise warehouse inventory management system built with a full-stack TypeScript architecture. The application enables multi-location tracking, real-time stock movements, supplier management, and comprehensive reporting for warehouse operations. It follows IBM's Carbon Design System principles for a utility-focused, data-intensive interface optimized for operational efficiency.

The system manages products across multiple warehouses, tracks inventory levels, records stock movements (in/out/transfer/adjustment), and provides low-stock alerts and analytics dashboards.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18+ with TypeScript using Vite as the build tool
- Client-side routing via Wouter (lightweight alternative to React Router)
- No Server-Side Rendering (SSR) - pure SPA architecture

**UI Component System:**
- Radix UI primitives for accessible, unstyled components
- shadcn/ui component library (New York style variant) for pre-styled components
- Tailwind CSS for utility-first styling with custom design tokens
- IBM Plex Sans and IBM Plex Mono fonts for typography
- Custom color system using CSS variables for theming (light/dark mode support)

**State Management:**
- TanStack Query (React Query) for server state management and caching
- React Hook Form with Zod resolvers for form validation
- Local component state via React hooks

**Design System:**
- Carbon Design System principles adapted for warehouse operations
- Data-first layouts with scannable information hierarchy
- 12-column responsive grid system
- Collapsible sidebar navigation (64px collapsed, 256px expanded)
- Custom spacing primitives and elevation system for depth

### Backend Architecture

**Server Framework:**
- Express.js as the HTTP server
- RESTful API design pattern
- Session-based authentication with PostgreSQL session store

**API Structure:**
- `/api/products` - Product CRUD operations with search capability
- `/api/warehouses` - Warehouse management endpoints
- `/api/suppliers` - Supplier management endpoints
- `/api/inventory/*` - Inventory level tracking and low-stock alerts
- `/api/stock-movements/*` - Stock movement history and recording
- `/api/dashboard/kpis` - Dashboard analytics and KPIs
- `/api/auth/*` - Authentication endpoints
- `/api/csv/upload/*` - CSV bulk import endpoints for products, warehouses, suppliers, and inventory
- `/api/csv/download/*` - CSV export endpoints for data download

**Authentication & Authorization:**
- Replit Auth integration using OpenID Connect (OIDC)
- Passport.js strategy for authentication flow
- Role-based access control with user roles: admin, manager, staff
- Session persistence via connect-pg-simple with PostgreSQL

**Request/Response Flow:**
- JSON body parsing with raw body preservation for webhooks
- Request logging middleware for API endpoints
- Unauthorized (401) errors trigger client-side re-authentication
- Error responses include status codes and descriptive messages

### Data Storage

**Database:**
- PostgreSQL via Neon serverless (@neondatabase/serverless)
- WebSocket connections for real-time capabilities
- Connection pooling for performance

**ORM & Schema Management:**
- Drizzle ORM for type-safe database queries
- Schema-first approach with TypeScript types generated from Drizzle schema
- Zod schema validation derived from Drizzle schemas via drizzle-zod
- Migrations stored in `/migrations` directory

**Database Schema:**
- `users` - User accounts with role-based permissions
- `products` - Product catalog with SKU, barcode, categories, supplier references
- `warehouses` - Warehouse locations with capacity and status tracking
- `suppliers` - Supplier contact information
- `inventory_levels` - Current stock quantities per product per warehouse
- `stock_movements` - Movement history with types (in/out/transfer/adjustment)
- `sessions` - Session storage for authentication (required for Replit Auth)

**Data Access Layer:**
- Storage interface pattern for database operations
- Async/await query patterns throughout
- Drizzle query builder for complex joins and aggregations
- Inventory calculations via SQL aggregations

### External Dependencies

**Authentication Service:**
- Replit Auth (OpenID Connect provider)
- Issuer URL: `process.env.ISSUER_URL` (defaults to https://replit.com/oidc)
- Client credentials: `process.env.REPL_ID` and `process.env.SESSION_SECRET`
- User profile data includes email, firstName, lastName, profileImageUrl

**Database Service:**
- Neon PostgreSQL serverless database
- Connection string: `process.env.DATABASE_URL`
- WebSocket support required for serverless execution

**Development Tools:**
- Replit-specific plugins for development environment:
  - `@replit/vite-plugin-cartographer` - Code mapping
  - `@replit/vite-plugin-dev-banner` - Development banner
  - `@replit/vite-plugin-runtime-error-modal` - Error overlay

**Third-Party Libraries:**
- Recharts for data visualization (charts, graphs)
- date-fns for date formatting and manipulation
- Lucide React for consistent iconography
- cmdk for command palette functionality
- papaparse for CSV parsing and generation

**Build & Development:**
- TypeScript strict mode enabled
- ESM module system throughout
- esbuild for production server bundling
- Vite for client-side hot module replacement (HMR)
- PostCSS with Tailwind and Autoprefixer