# Project Context & Coding Guidelines for AI Agents

## Overview
Gestão3D is a full-stack 3D printing manufacturing management platform and 3D product marketplace hub built with React 19, TanStack Start, Vite 7, Tailwind CSS v4, Lucide Icons, and Three.js.

## Key Architectural Principles
1. **Zero External Breakages**: Do not rename exported API routes, hooks, or core state managers.
2. **Code Splitting**: Heavy components in `App.tsx` must be code-split using `lazyWithReload` wrapped in `<Suspense>`.
3. **State Integrity**: Local persistent state is handled via IndexedDB/localStorage. Preserve state schemas when extending types.
4. **Performance**: Wrap intensive list calculations, data mapping, and category counters in `useMemo`.
5. **Accessibility**: Maintain WCAG 2.2 AA standards across all components (keyboard focus, ARIA labels, semantic tags).

## Directory Structure
- `/src/legacy-app/`: ERP/CRM for 3D Printing business management.
- `/src/market3d/`: E-Commerce & Market Intelligence analytics hub.
- `/src/routes/`: TanStack Router routes.
- `/src/components/ui/`: Reusable Radix / Tailwind UI components.
