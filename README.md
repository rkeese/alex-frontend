# Alex Frontend

**A modern, full-featured club management SPA — built for the people who keep clubs running.**

Alex is a web-based administration platform for clubs and associations (*Vereine*). It handles everything from member records and fee collection to financial bookkeeping and document archiving — wrapped in a clean, responsive interface that works on desktop and mobile.

---

## Why Alex?

Most club management software feels like it was designed in 2005 and never updated. Alex takes a different approach: a fast single-page application backed by a REST API, with role-based access control, SEPA payment integration, and real-time PDF generation — the kind of tooling that clubs actually need but rarely get.

---

## Features

### Members
- Full member lifecycle management (create, edit, archive)
- CSV import with row-level error reporting
- Birthday and anniversary lists
- Member statistics dashboard
- Invite members via email

### Finance
- Banking transaction import (Sparkasse, Volksbank CSV formats)
- Booking review workflow with pending/finalized states
- Receipt creation and management
- Annual financial statements with configurable start balances and PDF export

### SEPA Direct Debit
- Membership fee collection via SEPA XML generation
- Per-member bank account and mandate management
- Support for recurring and one-off mandates

### Documents
- Upload, categorize, and manage club documents
- In-browser PDF preview with full-screen viewer
- Download with original filenames

### Calendar
- Event management with month and day views
- PDF export by month or year

### Administration
- Club settings and board member management
- User management with account lockout tracking
- Multi-club support with club-scoped permissions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Vue 3.5 (Composition API + `<script setup>`) |
| Language | TypeScript 5.9 (strict mode) |
| UI Components | PrimeVue 4.5 (Aura theme) |
| Styling | Tailwind CSS 4 |
| State Management | Pinia 3 |
| Routing | Vue Router 4 |
| Build Tool | Vite 7 |
| Unit Tests | Vitest |
| E2E Tests | Playwright |
| Linting | ESLint + Oxlint + Prettier |
| Deployment | Docker (multi-stage) + Nginx |

---

## Security

- **JWT-based authentication** with session-scoped storage (no persistent tokens)
- **Hierarchical RBAC** — system admin, club admin, area-level permissions (`members:read`, `finance:write`, etc.) with wildcard and role-based fallback
- **Brute-force protection** — lockout countdown on HTTP 429, blocked account detection on HTTP 403
- **Automatic session timeout** after 15 minutes of inactivity
- **Input normalization** — email trimming and lowercasing to prevent case-sensitivity bypasses

---

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+
- A running [Alex Backend](https://github.com/rkeese/alex-backend) instance

### Development

```bash
cd vue-project
npm install
npm run dev
```

The dev server starts at `http://localhost:5173` and proxies API requests to the backend.

### Build

```bash
npm run build
```

### Docker

```bash
docker build -t alex-frontend .
docker run -p 80:80 alex-frontend
```

The Nginx container serves the built SPA and reverse-proxies `/api/` requests to `http://api:8080`.

### Testing

```bash
npm run test:unit    # Vitest
npm run test:e2e     # Playwright
```

### Linting

```bash
npm run lint         # Oxlint + ESLint with auto-fix
npm run format       # Prettier
```

---

## Project Structure

```
vue-project/src/
├── layout/          # App shell (header, sidebar, layout wrapper)
├── router/          # Route definitions with permission guards
├── services/        # Centralized API client (typed, JWT-aware)
├── stores/          # Pinia stores (auth, session state)
├── types/           # TypeScript interfaces
└── views/
    ├── admin/       # Club settings, user & board management
    ├── documents/   # Document upload, categorization, PDF preview
    ├── finance/     # Bookings, receipts, financial statements
    └── members/     # Member CRUD, import, statistics, SEPA
```

---

## License

See [LICENSE](LICENSE) for details.
