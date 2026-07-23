# Guia de Contribuição e Estilo de Código (Gestão3D)

Este documento estabelece as diretrizes e convenções de código para garantir alta manutenibilidade, consistência e compatibilidade com desenvolvimento assistido por IA.

---

## 1. Regras de Código (TypeScript & React)

### Tipagem Explícita
- **Sempre defina tipos explícitos** para props de componentes, retornos de funções e modelos de dados.
- **Evite o uso de `any`**. Dê preferência a `unknown` ou tipos/interfaces genéricos parametrizados.
- Exporte interfaces e enums do arquivo central `/src/legacy-app/types.ts` ou `/src/market3d/types.ts`.

### Componentes React
- Utilize **componentes funcionais** com React Hooks.
- Mantenha componentes focados em uma única responsabilidade. Se um componente ultrapassar 250 linhas, divida-o em sub-componentes.
- Garanta **desempenho** memorizando cálculos caros com `useMemo` e handlers com `useCallback` onde apropriado.

### Code Splitting & Lazy Loading
- Para novas abas ou recursos pesados no módulo `legacy-app/App.tsx`, utilize o padrão helper `lazyWithReload`:
```tsx
const NovoModulo = lazyWithReload(() => import('./imported/NovoModulo'));
```

---

## 2. Padrões de Nomenclatura

| Categoria | Convenção | Exemplo |
| :--- | :--- | :--- |
| Componentes React | PascalCase | `PrinterQueueList.tsx` |
| Custom Hooks | camelCase (`use` prefix) | `useAutoBackup.ts` |
| Funções Auxiliares | camelCase (verbo inicial) | `calculateFilamentCost()` |
| Variáveis Booleanas | camelCase (`is/has/should`) | `isLoading`, `hasStock` |
| Constantes Globais | UPPER_SNAKE_CASE | `INITIAL_CATEGORIES` |
| Arquivos de Tipos | camelCase / PascalCase | `types.ts` |

---

## 3. Acessibilidade (WCAG 2.2 AA)
- Todos os elementos interativos (`button`, `input`, `a`) devem possuir estados de foco visíveis.
- Utilize rótulos acessíveis (`aria-label`, `aria-labelledby`, `<label htmlFor="...">`).
- Nunca utilize `div` ou `span` com `onClick` sem `role="button"`, `tabIndex={0}` e manipulador de teclado (`onKeyDown`).

---

## 4. Fluxo de Commits & PRs
- Certifique-se de executar `npm run lint` e `npm run build` antes de submeter alterações.
- Escreva mensagens de commit claras e imperativas (ex.: `feat: adiciona filtro por plataforma no Market3D`).
