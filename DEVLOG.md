# InterviewDojo - Development Log (Friction Log & Engineering Journal)

## Project Overview
- **Project Name:** InterviewDojo
- **Hackathon:** Build, Ship, Shape: Amazon Developer Hackathon (Alexa+ track + AWS Builder mini challenge)
- **Architecture:** MCP Server (Streamable HTTP, spec 2025-11-25+) + AWS Bedrock Converse API + MongoDB + React Alexa+ Simulator Web App.

---

### [2026-10-05] Phase 1: Environment Setup & Foundation
- **Goal:** Initialize monorepo, setup Express server with MCP Streamable HTTP endpoint (`/mcp`), health check endpoint (`/health`), and a temporary `ping` tool.
- **MCP SDK Note:** Checked `@modelcontextprotocol/sdk` v1/v2 spec & Streamable HTTP transport patterns. Exposed single HTTP endpoint `/mcp` handling request sessions and tools.
- **Dependencies Installed:** `@modelcontextprotocol/sdk`, `@aws-sdk/client-bedrock-runtime`, `express`, `cors`, `zod`, `mongoose`, `dotenv`, `vitest`, `tsx`.
- **Status:** Phase 1 initialized cleanly.
