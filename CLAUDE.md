# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Cloudflare Worker that relays requests to the APRS.fi API. It allows clients to query APRS (Automatic Packet Reporting System) data without exposing the API key.

## Architecture

The project is a single-file Cloudflare Worker (`index.js`) that:
1. Handles CORS preflight requests for web browser access
2. Provides a `/health` endpoint for monitoring
3. Validates query parameters before calling the API
4. Injects the APRS.fi API key from environment variable `APRS_API_KEY`
5. Relays the request to `https://api.aprs.fi/api/get`
6. Returns the API response with CORS headers and caching

Features:
- CORS enabled for direct browser usage
- Request validation with proper error responses
- 30-second response caching
- 10-second timeout protection
- Strips client-provided API keys to prevent misuse

## Development Commands

```bash
# Deploy to Cloudflare Workers
npx wrangler deploy

# Run local development server
npx wrangler dev

# View recent deployments
npx wrangler deployments list

# Tail logs from the deployed worker
npx wrangler tail

# Set/update the APRS.fi API key secret
echo "your-api-key" | npx wrangler secret put APRS_API_KEY
```

## Configuration

- `wrangler.toml` contains worker configuration including account ID
- `.dev.vars` contains local environment variables (not committed to git)
- `APRS_API_KEY` environment variable holds the APRS.fi API key (set via Cloudflare Workers secrets or `.dev.vars` for local development)

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check and service info |
| `/health` | GET | Health check endpoint |
| `/?what=...` | GET | Relay to APRS.fi API |

## APRS.fi API Usage Examples

```bash
# Health check
curl https://your-worker.workers.dev/health

# Lookup a specific callsign
curl "https://your-worker.workers.dev/?what=loc&format=json&name=TA1ANW"

# Search weather stations
curl "https://your-worker.workers.dev/?what=wx&format=json&lat=40.9935&lng=27.5983"
```

See [APRS.fi API documentation](https://aprs.fi/page/api) for available query parameters.
