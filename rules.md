# Rewardsy Project Rules & Guidelines

This document outlines the coding standards, development practices, and project-specific rules for the Rewardsy project. These rules complement and extend the global coding standards.

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Code Organization](#code-organization)
4. [Coding Standards](#coding-standards)
5. [State Management](#state-management)
6. [API Integration](#api-integration)
7. [Testing Strategy](#testing-strategy)
8. [Git Workflow](#git-workflow)
9. [Documentation](#documentation)
10. [Security Guidelines](#security-guidelines)

## Project Overview

Rewardsy is an AI-powered task management application that enhances user motivation through a personalized rewards system. The application is built with a modern tech stack focusing on performance, maintainability, and user experience.

## Technology Stack

### Frontend
- **Framework**: Next.js 13+ (App Router)
- **Language**: TypeScript 5.0+
- **Styling**: Tailwind CSS with CSS Modules
- **State Management**: Zustand
- **UI Components**: Radix UI Primitives + shadcn/ui
- **Form Handling**: React Hook Form with Zod validation
- **Date Handling**: date-fns
- **Testing**: Jest, React Testing Library, Cypress

### Backend (To be implemented)
- **Framework**: FastAPI
- **Database**: PostgreSQL
- **Authentication**: JWT + OAuth2
- **AI/ML**: Python-based recommendation engine

## Code Organization

### Directory Structure

```
rewardsy_frontend/
├── app/                    # App Router pages and layouts
│   ├── dashboard/          # Authenticated user dashboard
│   ├── login/              # Authentication pages
│   ├── register/
│   └── ...
├── components/             # Reusable UI components
│   ├── layout/             # Layout components
│   ├── tasks/              # Task-related components
│   ├── rewards/            # Reward-related components
│   ├── ui/                 # shadcn/ui components
│   └── ...
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions and API clients
├── store/                  # Zustand stores
├── styles/                 # Global styles and themes
├── types/                  # TypeScript type definitions
└── __tests__/              # Test files
```

## Coding Standards

### TypeScript
- Use TypeScript for all new code
- Enable strict mode in `tsconfig.json`
- Avoid `any` type - use proper type definitions
- Use type guards for type narrowing
- Prefer interfaces for public API definitions
- Use `type` for unions, tuples, and complex types

### React/Next.js
- Use functional components with TypeScript
- Follow the React Hooks rules
- Use `use client` directive only when necessary
- Implement proper error boundaries
- Use Next.js Image component for images
- Implement proper loading states

### Styling
- Use Tailwind CSS utility classes primarily
- Extract repeated utility combinations into `@apply` in CSS modules
- Follow BEM naming for custom CSS classes
- Use CSS variables for theming
- Mobile-first responsive design

### State Management
- Use Zustand for global state
- Keep state as local as possible
- Follow the single responsibility principle for stores
- Use selectors to prevent unnecessary re-renders
- Implement proper TypeScript types for all stores

## API Integration

### API Client
- Use `fetch` with proper TypeScript types
- Implement request/response interceptors
- Handle errors consistently
- Implement proper loading states
- Use React Query for server state management

### Endpoints
- Follow RESTful conventions
- Use proper HTTP methods
- Implement proper error handling
- Use proper status codes
- Document all endpoints with OpenAPI/Swagger

## Testing Strategy

### Unit Testing
- Test all utility functions
- Test custom hooks
- Test presentational components
- Use Jest for unit tests
- Aim for 80%+ code coverage

### Integration Testing
- Test component interactions
- Test API integrations
- Use React Testing Library
- Mock external dependencies

### E2E Testing
- Test critical user flows
- Use Cypress for E2E tests
- Test authentication flows
- Test form submissions

## Git Workflow

### Branch Naming
- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Critical production fixes
- `chore/` - Maintenance tasks
- `docs/` - Documentation updates

### Commit Messages
Follow Conventional Commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

### Pull Requests
- Keep PRs small and focused
- Include relevant tests
- Update documentation
- Get at least one code review
- Run all tests before merging

## Documentation

### Code Documentation
- Document all public APIs
- Use JSDoc for functions and components
- Document complex business logic
- Keep comments up-to-date

### Project Documentation
- Keep README.md up-to-date
- Document setup instructions
- Document environment variables
- Document deployment process

## Security Guidelines

### Frontend
- Sanitize all user inputs
- Use CSRF protection
- Implement proper CORS policies
- Secure sensitive data
- Use environment variables for secrets

### Authentication
- Use secure JWT storage
- Implement proper session management
- Use HTTP-only cookies for auth tokens
- Implement proper password policies
- Rate limit authentication endpoints

### Data Protection
- Encrypt sensitive data
- Implement proper access controls
- Validate all inputs
- Sanitize outputs
- Follow OWASP guidelines

---

*Last Updated: 2025-07-10*

This document should be reviewed and updated regularly to reflect any changes in the project's requirements or technology stack.
