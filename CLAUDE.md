# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Cloudflare Worker that proxies requests to the APRS.fi API. It allows clients to query APRS (Automatic Packet Reporting System) data without exposing the API key.

**Live URL:** https://aprsfi.bugra.workers.dev

## Architecture

The project is a single-file Cloudflare Worker (`index.js`) that:
1. Intercepts incoming fetch events
2. Extracts query parameters from the request
3. Injects the APRS.fi API key from environment variable `APRS_API_KEY`
4. Proxies the request to `https://api.aprs.fi/api/get`
5. Returns the API response transparently

The proxy passes through all query parameters (except `apikey` which is overridden) and returns the response as-is from the APRS.fi API.

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

## APRS.fi API Usage Examples

```bash
# Lookup a specific callsign
curl "https://aprsfi.bugra.workers.dev/?what=loc&format=json&name=TA1ANW"

# Search weather stations (requires location parameter)
curl "https://aprsfi.bugra.workers.dev/?what=wx&format=json&..."
```

See [APRS.fi API documentation](https://aprs.fi/page/api) for available query parameters.
