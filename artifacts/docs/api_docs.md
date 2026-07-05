# TalentLab RMS - REST API Documentation

## Authentication
All API endpoints (except public portals) require a Bearer token in the Authorization header.
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

## Core Endpoints

### Candidates
- \`GET /api/v1/candidates\`: List all candidates (supports pagination and filtering).
- \`POST /api/v1/candidates\`: Create a new candidate profile.
- \`POST /api/v1/candidates/:id/parse\`: Trigger the AI resume parser.

### Jobs
- \`GET /api/v1/jobs\`: Fetch active job orders.
- \`POST /api/v1/jobs\`: Create a new requirement.

### Pipeline & Screening
- \`GET /api/v1/pipeline/:jobId\`: Get the kanban board for a specific job.
- \`POST /api/v1/pipeline/:jobId/move\`: Move a candidate between stages (Sourced -> Screened -> Offered).
- \`POST /api/v1/screening/:pipelineId\`: Submit a screening scorecard for a candidate.

### Workspace & Users
- \`GET /api/v1/workspace\`: Get current tenant settings and active subscription status.
- \`POST /api/v1/workspace/invite\`: Send an email invitation to a new team member.

## Rate Limiting
- **Global API Limit**: 1,000 requests per 15 minutes.
- **Auth Endpoints**: 15 requests per 15 minutes to prevent brute-force attacks.
A \`429 Too Many Requests\` response will be returned if limits are exceeded.
