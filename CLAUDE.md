# Claude Code Guidelines for Gestão3D

- Build Command: `npm run build`
- Dev Command: `npm run dev`
- Test Command: `npm run test`
- Lint Command: `npm run lint`

## Architecture Highlights
- `src/legacy-app/App.tsx`: Main ERP entrypoint with lazy-loaded subtabs.
- `src/market3d/App.tsx`: Market intelligence & e-commerce dashboard.
- `src/routes/__root.tsx`: Root shell with accessibility skip-links and HTML lang attributes.
