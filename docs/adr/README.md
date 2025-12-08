# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records for the JobPilot AI Platform.

## What is an ADR?

An Architecture Decision Record (ADR) is a document that captures an important architectural decision made along with its context and consequences.

## ADR Format

Each ADR follows this structure:

```markdown
# ADR-XXX: Title

## Status
[Proposed | Accepted | Deprecated | Superseded]

## Context
What is the issue that we're seeing that is motivating this decision or change?

## Decision
What is the change that we're proposing and/or doing?

## Consequences
What becomes easier or more difficult to do because of this change?

## Alternatives Considered
What other options were considered and why were they rejected?

## References
- Related ADRs
- External documentation
- Discussion links
```

## Index

- [ADR-001: Microservices Architecture](001-microservices-architecture.md)
- [ADR-002: Database Per Service Pattern](002-database-per-service.md)
- [ADR-003: JWT Authentication](003-jwt-authentication.md)
- [ADR-004: Message Queue (RabbitMQ)](004-message-queue-rabbitmq.md)
- [ADR-005: TypeScript for Backend Services](005-typescript-backend.md)
- [ADR-006: Next.js for Web Application](006-nextjs-web-app.md)
- [ADR-007: PostgreSQL as Primary Database](007-postgresql-primary-db.md)
- [ADR-008: Redis for Caching](008-redis-caching.md)
- [ADR-009: Kubernetes for Orchestration](009-kubernetes-orchestration.md)
- [ADR-010: Python for AI Service](010-python-ai-service.md)

## Creating a New ADR

1. Copy the template from `template.md`
2. Number it sequentially (e.g., ADR-011)
3. Fill in all sections
4. Create a pull request
5. Discuss and refine
6. Merge when accepted

## ADR Lifecycle

1. **Proposed**: Draft stage, under discussion
2. **Accepted**: Decision has been made and approved
3. **Deprecated**: No longer the current approach but not replaced
4. **Superseded**: Replaced by a newer ADR (reference the new one)
