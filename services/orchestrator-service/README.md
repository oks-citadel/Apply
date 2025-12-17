# Orchestrator Service

Master orchestrator for ApplyForUs AI multi-agent system, providing workflow coordination and circuit breaker patterns.

## Overview

The Orchestrator Service coordinates multiple AI agents and microservices, managing complex workflows like job applications, interview preparation, and batch processing. It implements circuit breaker patterns for fault tolerance and provides health monitoring for all connected agents.

## Features

- **Workflow Orchestration**: Execute multi-step workflows across services
- **Circuit Breaker**: Fault tolerance with automatic recovery
- **Agent Health Monitoring**: Real-time status of all AI agents
- **Task Queue Management**: Bull-based task processing with retries
- **Service Coordination**: Coordinates auth, job, resume, and AI services
- **Compliance Module**: GDPR and data compliance checks

## Tech Stack

- Runtime: Node.js 20+
- Framework: NestJS
- Language: TypeScript
- Queue: Bull (Redis-based)
- Circuit Breaker: Opossum
- Health Checks: Terminus

## API Endpoints

### Orchestration

- POST /orchestrate - Start an orchestration task
- GET /tasks/:taskId - Get task status

### Workflows

- POST /workflows/:type - Execute a specific workflow
- GET /workflows/:executionId/status - Get workflow execution status
- GET /workflows - List available workflow definitions

### Agent Health

- GET /agents/health - Get health status of all agents
- GET /agents/:agentType/health - Get health of specific agent
- GET /agents/circuits - Get circuit breaker statistics
- POST /agents/:agentType/reset - Reset circuit breaker for agent

## Supported Workflows

- JOB_DISCOVERY - Find matching jobs
- APPLICATION - Complete job application
- INTERVIEW_PREP - Prepare for interviews
- ANALYTICS_OPTIMIZATION - Optimize application strategy
- PROFILE_SETUP - Set up user profile
- BATCH_APPLY - Batch job applications

## Agent Types

- JOB_DISCOVERY, JOB_MATCHING
- RESUME_TAILORING, COVER_LETTER
- APPLICATION_FORM, AUTHENTICATION
- PROFILE_MANAGEMENT, ANALYTICS
- NOTIFICATION, INTERVIEW_PREP
- COMPLIANCE, DOCUMENT_PROCESSING
- SALARY_NEGOTIATION, NETWORK_INTELLIGENCE
- And many more...

## Environment Variables

- PORT (3009)
- REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
- HTTP_TIMEOUT (30000)
- CORS_ORIGINS
- NODE_ENV
- SERVICE_VERSION
- LOG_LEVEL
- APPLICATIONINSIGHTS_INSTRUMENTATION_KEY

## Circuit Breaker Configuration

- Timeout: 60s
- Error Threshold: 50%
- Reset Timeout: 30s
- Volume Threshold: 10 requests

## How It Coordinates Services

1. Receives orchestration request
2. Validates request and creates task
3. Executes workflow steps in order (with dependency handling)
4. Monitors agent health via circuit breakers
5. Handles failures with retries and fallbacks
6. Reports final status with results

## Getting Started

pnpm install && cp .env.example .env && pnpm start:dev

Service runs on http://localhost:3009
Swagger docs at http://localhost:3009/api/docs

## Deployment

docker build -t applyforus/orchestrator-service:latest .
docker run -p 3009:3009 --env-file .env applyforus/orchestrator-service:latest

## License

MIT
