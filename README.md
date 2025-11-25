# BulletinFlow

A modern web application for church bulletin management with AI-powered PDF editing.

## Overview

BulletinFlow allows churches to upload bulletin PDFs, define reusable templates, and quickly generate updated bulletins by editing specific fields without manually recreating the entire document.

## Tech Stack

- **Framework**: Next.js 15 (App Router) with TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **PDF Processing**: Docker services (ONLYOFFICE + Python PDF2DOCX)
- **Testing**: Vitest + React Testing Library

## Current Status

✅ **Phase 0 Complete** - Project foundation is set up and verified

See the [walkthrough document](./docs/phase-0-walkthrough.md) for detailed implementation notes.

## Getting Started

### Prerequisites

- Node.js 20+
- Docker Desktop
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bulletin-flow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Set up Supabase database**
   - Create a new Supabase project
   - Run the schema in the SQL Editor:
     ```sql
     -- Copy contents from supabase/schema.sql
     ```
   - Create storage buckets: `bulletin-pdfs`, `bulletin-outputs`, `bulletin-temp`

5. **Start Docker services**
   ```bash
   docker-compose up -d
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to see the app.

## Available Scripts

### Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Testing
```bash
npm test             # Run tests in watch mode
npm run test:ui      # Run tests with UI
npm run test:coverage # Generate coverage report
```

### Docker Services
```bash
docker-compose up -d              # Start services
docker-compose down               # Stop services
docker-compose logs pdf2docx      # View PDF service logs
docker-compose logs onlyoffice    # View ONLYOFFICE logs
```

## Project Structure

```
bulletin-flow/
├── app/                 # Next.js App Router
├── components/          # React components
│   └── ui/             # shadcn/ui components
├── lib/                # Utilities and libraries
│   └── supabase/       # Supabase clients
├── services/           # Docker services
│   └── pdf2docx/       # PDF to DOCX converter
├── supabase/           # Database schema
├── __tests__/          # Test files
└── public/             # Static assets
```

## Services

### ONLYOFFICE Document Server
- **Port**: 8080
- **Purpose**: Document editing and conversion
- **URL**: http://localhost:8080

### PDF2DOCX Service
- **Port**: 8001
- **Purpose**: Convert PDF files to DOCX format
- **Health Check**: http://localhost:8001/health
- **Convert Endpoint**: POST http://localhost:8001/convert

## Development Roadmap

- [x] **Phase 0**: Project Setup (Complete)
  - Next.js + TypeScript + Tailwind
  - Supabase integration
  - Docker services
  - Testing infrastructure

- [ ] **Phase 1**: MVP Core
  - Authentication & church management
  - PDF upload & template definition
  - Template auto-matching
  - PDF generation pipeline

- [ ] **Phase 2**: ONLYOFFICE Integration
  - True WYSIWYG editing

- [ ] **Phase 3**: AI Features
  - Smart field detection with Google Gemini
  - Auto-template creation

- [ ] **Phase 4**: Advanced Features
  - Visual fingerprinting
  - Copy from last week
  - PlanningCenter API integration

## Testing

All code includes comprehensive unit tests with >80% coverage target.

Run tests:
```bash
npm test
```

View coverage:
```bash
npm run test:coverage
```

## Contributing

This project follows a Test-Driven Development (TDD) approach. Please ensure all new features include tests.

## License

[Add your license here]

## Support

For questions or issues, please open an issue on GitHub.
