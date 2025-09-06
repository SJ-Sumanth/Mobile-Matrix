# MobileMatrix Project Structure

## Overview

This is a Next.js 14 project with TypeScript and Tailwind CSS, set up for the MobileMatrix phone comparison application.

## Project Structure

```
mobile-matrix/
├── .env.local                 # Environment variables (not committed)
├── .env.example              # Environment variables template
├── .gitignore               # Git ignore rules
├── .prettierrc              # Prettier configuration
├── .prettierignore          # Prettier ignore rules
├── .husky/                  # Git hooks
│   └── pre-commit          # Pre-commit hook for linting
├── eslint.config.js         # ESLint configuration
├── next.config.ts           # Next.js configuration
├── package.json             # Dependencies and scripts
├── postcss.config.mjs       # PostCSS configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
├── public/                  # Static assets
└── src/                     # Source code
    ├── app/                 # Next.js App Router
    │   ├── globals.css      # Global styles with black-orange theme
    │   ├── layout.tsx       # Root layout
    │   └── page.tsx         # Homepage
    ├── components/          # React components
    │   ├── ui/              # Reusable UI components
    │   ├── chat/            # Chat-related components
    │   ├── comparison/      # Phone comparison components
    │   ├── phone/           # Phone display components
    │   └── layout/          # Layout components
    ├── services/            # Business logic services
    │   ├── ai.ts            # AI service integration
    │   ├── phone.ts         # Phone data service
    │   └── comparison.ts    # Comparison engine
    ├── types/               # TypeScript type definitions
    │   ├── phone.ts         # Phone-related types
    │   ├── chat.ts          # Chat-related types
    │   ├── comparison.ts    # Comparison-related types
    │   └── api.ts           # API-related types
    ├── utils/               # Utility functions
    ├── lib/                 # Library configurations
    │   └── env.ts           # Environment variable validation
    ├── hooks/               # Custom React hooks
    └── constants/           # Application constants
```

## Development Setup

### Prerequisites

- Node.js 18+ (recommended)
- npm or yarn

### Installation

```bash
cd mobile-matrix
npm install
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values:

- Database connection strings
- API keys for AI services
- External API keys for phone data

### Code Quality Tools

- **ESLint**: Code linting with Next.js rules
- **Prettier**: Code formatting
- **Husky**: Git hooks for pre-commit checks
- **lint-staged**: Run linters on staged files

### Theme Configuration

The project uses a custom black-orange theme configured in `src/app/globals.css`:

- Primary colors: Black (#000000) and Orange (#ff6b35)
- Responsive design with mobile-first approach
- Custom scrollbar styling
- Smooth transitions for better UX

## Next Steps

1. Implement core data models and TypeScript interfaces (Task 2)
2. Set up database schema and connection (Task 3)
3. Create phone database service layer (Task 4)
4. Continue with remaining implementation tasks
