# Gestão3D / PrintFlow 3D & Market3D Platform

Uma plataforma completa de gestão de impressão 3D, precificação, CRM de clientes, ordens de serviço, orçamento, catálogo de modelos, telemetria de impressoras, inteligência de mercado e e-commerce para convertedores e estúdios de manufatura aditiva.

## 🚀 Visão Geral e Arquitetura

O sistema combina dois grandes núcleos operacionais:
1. **Gestão3D (PrintFlow OS)**: Sistema ERP/CRM de manufatura aditiva com cálculo de custos de filamento, hora-máquina, margens, faturamento, controle de estoque, ordens de produção, manutenção de impressoras, relatórios contábeis, integração WhatsApp e assistente IA.
2. **Market3D**: Hub de inteligência de mercado e e-commerce de produtos impressos em 3D, com análise estatística por categoria (Macaquinho, Decoração, Brinquedos, Colecionáveis, etc.), métricas de vendas mensais, faturamento projetado, comparativo entre marketplaces e análise de concorrência.

### Stack Tecnológica
- **Framework**: [React 19](https://react.dev/) + [TanStack Start](https://tanstack.com/router/latest) + [TanStack Router](https://tanstack.com/router)
- **Build System**: [Vite 7](https://vitejs.dev/) + [Nitro Engine](https://nitro.unjs.io/)
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/) + Radix UI + Lucide Icons + Motion (Framer Motion)
- **Visualização 3D**: Three.js + React 3D Renderers
- **Gráficos & Mapas**: Recharts + Leaflet
- **Relatórios**: jsPDF, JSZip, fflate
- **Tipagem & Qualidade**: TypeScript 5 + ESLint + Prettier + Vitest

---

## 📁 Estrutura do Projeto

```text
/
├── public/                 # Favicons, assets estáticos e mídias
├── src/
│   ├── components/         # Componentes reutilizáveis UI (Radix/shadcn)
│   ├── legacy-app/         # Núcleo do sistema Gestão3D
│   │   ├── components/     # Abas principais (ProductionTab, ClientsTab, CostsTab, etc.)
│   │   ├── hooks/          # Custom hooks (useAutoBackup, usePrintStorage, etc.)
│   │   ├── imported/       # Sub-módulos lazy-loaded (Catalogo, Marketing, Kanban, Sites)
│   │   ├── state/          # Estado global e persistência IndexedDB / localStorage
│   │   └── types.ts        # Interfaces e modelos de dados do ERP
│   ├── market3d/           # Módulo Market3D (Inteligência & E-commerce)
│   │   ├── data.ts         # Base de dados de produtos e categorias
│   │   └── App.tsx         # Dashboard Market3D
│   ├── routes/             # Rotas do TanStack Router
│   ├── styles.css          # Estilos globais e tokens Tailwind CSS
│   └── main.tsx            # Ponto de entrada da aplicação
├── vite.config.ts          # Configuração do Vite + Code Splitting
└── package.json            # Dependências e scripts
```

---

## 🛠️ Instalação e Execução

### Pré-requisitos
- Node.js (v18 ou superior)
- npm, yarn ou bun

### Passos de Instalação
```bash
# Clone o repositório
git clone <repository-url>
cd gestao3d

# Instale as dependências
npm install

# Execute em modo de desenvolvimento
npm run dev
```

A aplicação estará acessível em `http://localhost:3000`.

---

## 🧪 Testes e Qualidade

```bash
# Executar suíte de testes unitários
npm run test

# Verificar linter e formatação
npm run lint

# Formatar código
npm run format

# Gerar build de produção
npm run build
```

---

## ♿ Acessibilidade e Boas Práticas (WCAG 2.2 AA)
- Suporte total a navegação por teclado (`Tab`, `Enter`, `Esc`, setas).
- Link de atalho `Skip to main content` (`#main-content`).
- Suporte ao modo de movimento reduzido (`prefers-reduced-motion`).
- Anéis de foco de alto contraste (`:focus-visible`).
- Semântica HTML5 estrita e marcações ARIA ativas.
