# Bitespeed Identity Reconciliation

A production-grade backend service for identifying and reconciling customer identities across multiple purchases. Built for FluxKart.com to link different orders made with different contact information to the same person.

## Architecture

```
Request → Middleware (Tracing, Validation, Logging) → Controller → Service → Repository → PostgreSQL
```

**Layered architecture** with clear separation of concerns:

| Layer | Responsibility |
|---|---|
| **Middleware** | Request ID tracing, input validation (Zod), structured logging, error handling |
| **Controller** | HTTP concern — parse request, delegate to service, format response |
| **Service** | Business logic — identity reconciliation, primary/secondary linking, merging |
| **Repository** | Data access — Prisma ORM queries with transactional safety |

## Tech Stack

- **Runtime:** Node.js 20+ with TypeScript
- **Framework:** Express.js
- **ORM:** Prisma
- **Database:** PostgreSQL 16
- **Validation:** Zod
- **Logging:** Pino (structured JSON)
- **API Docs:** Swagger/OpenAPI via swagger-jsdoc
- **Testing:** Jest + ts-jest

## Getting Started

### Prerequisites

- Node.js ≥ 18
- PostgreSQL (Neon cloud or any PostgreSQL instance)

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Setup database**
   ```bash
   npx prisma migrate deploy
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## API Reference

### `POST /identify`

Identify and reconcile a customer contact.

**Request:**
```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

At least one of `email` or `phoneNumber` must be provided.

**Response (200):**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [23]
  }
}
```

### `GET /health`

Health check endpoint.

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2023-04-01T00:00:00.000Z",
  "uptime": 123.456
}
```

### Interactive API Docs

Visit `http://localhost:3000/api-docs` for Swagger UI.

## Business Logic

### Identity Reconciliation Rules

1. **New customer:** If no existing contact matches the email or phone, create a new `primary` contact.

2. **Linking contacts:** If a request shares an email or phone with an existing contact but includes new information, create a `secondary` contact linked to the primary.

3. **Merging primaries:** If a request bridges two previously unlinked primary contacts (e.g., email matches one primary, phone matches another), the older primary stays `primary` and the newer one is demoted to `secondary`. All secondaries of the demoted primary are re-linked.

4. **Exact duplicate:** If the exact email + phone combination already exists, no new contact is created — the existing consolidated view is returned.

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Project Structure

```
src/
├── config/              # App config, database client, Swagger setup
├── middleware/           # Request ID, logging, validation, error handling
├── modules/
│   └── contact/         # Contact feature module
│       ├── contact.controller.ts
│       ├── contact.service.ts
│       ├── contact.repository.ts
│       ├── contact.routes.ts
│       └── contact.schema.ts
├── common/
│   ├── errors/          # Custom error classes
│   ├── logger/          # Pino structured logger
│   └── types/           # Shared TypeScript types
├── app.ts               # Express app setup
└── server.ts            # Entry point with graceful shutdown
prisma/
├── schema.prisma        # Database schema
└── migrations/          # Auto-generated migrations
tests/
├── contact.service.test.ts
└── contact.schema.test.ts
docs/
└── bitespeed.postman_collection.json
```

## Database Schema

```sql
CREATE TABLE contacts (
  id              SERIAL PRIMARY KEY,
  phone_number    VARCHAR(20),
  email           VARCHAR(255),
  linked_id       INTEGER REFERENCES contacts(id),
  link_precedence link_precedence NOT NULL DEFAULT 'primary',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

-- Indexes for fast lookups
CREATE INDEX idx_contact_email ON contacts(email);
CREATE INDEX idx_contact_phone_number ON contacts(phone_number);
CREATE INDEX idx_contact_linked_id ON contacts(linked_id);
```



## Production Considerations

- **Request tracing:** Every request gets a unique `X-Request-Id` header for end-to-end tracing
- **Graceful shutdown:** Handles SIGTERM/SIGINT, drains connections before exit
- **Structured logging:** JSON logs via Pino for easy parsing by log aggregators
- **Security:** Helmet headers, CORS, input validation and sanitization
- **Health checks:** `/health` endpoint for load balancer integration
- **Connection pooling:** Prisma manages PostgreSQL connection pooling
- **Soft deletes:** `deletedAt` column for audit trail without data loss

## Scaling Suggestions

- Add Redis for caching frequently accessed contact groups
- Deploy behind a load balancer with multiple stateless app instances
- Add read replicas for read-heavy traffic patterns
- Implement rate limiting per IP/API key
- Add database partitioning if contact table grows beyond millions of rows
- Consider event sourcing for audit trail requirements

## License

MIT
