# APRS.fi API Proxy

> A secure, production-ready Cloudflare Worker that proxies requests to the APRS.fi API

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/yourusername/aprsfi)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)](https://workers.cloudflare.com/)
[![APRS](https://img.shields.io/badge/APRS-amateur%20radio-blue)](https://aprs.fi/)

## What is APRS?

APRS (Automatic Packet Reporting System) is a digital communications system used by amateur radio operators to share real-time information including:

- GPS coordinates and vehicle tracking
- Weather station data
- Telemetry from sensors
- Text messaging
- Emergency beacons

## Features

| Feature | Description |
|---------|-------------|
| **API Key Protection** | Your APRS.fi API key is stored securely as a Cloudflare Worker secret |
| **CORS Enabled** | Use directly from web browsers without CORS issues |
| **Request Validation** | Validates parameters before calling the upstream API |
| **Response Caching** | 30-second cache reduces API load and improves response times |
| **Error Handling** | Graceful error messages with proper HTTP status codes |
| **Health Check** | `/health` endpoint for monitoring service status |
| **Timeout Protection** | 10-second timeout prevents hanging requests |
| **Edge Network** | Deployed on Cloudflare's global network for low latency |

## Quick Start

### One-Click Deployment

Click the Deploy button above. You'll need to:

1. Authorize with your Cloudflare account
2. Set the `APRS_API_KEY` secret (get your key at [aprs.fi](https://aprs.fi/page/api))
3. Deploy!

That's it - your worker will be live at `https://aprsfi.your-subdomain.workers.dev`

### Manual Deployment

```bash
# Clone the repository
git clone https://github.com/yourusername/aprsfi.git
cd aprsfi

# Install dependencies
npm install

# Login to Cloudflare
npx wrangler login

# Set your APRS.fi API key as a secret
echo "your-api-key-here" | npx wrangler secret put APRS_API_KEY

# Deploy
npm run deploy
```

## Usage

### Basic API Calls

```bash
# Health check
curl https://your-worker.workers.dev/health

# Lookup a callsign
curl "https://your-worker.workers.dev/?what=loc&format=json&name=TA1ANW"

# Search near coordinates
curl "https://your-worker.workers.dev/?what=loc&format=json&lat=40.9935&lng=27.5983"

# Weather stations
curl "https://your-worker.workers.dev/?what=wx&format=json&lat=40.9935&lng=27.5983"
```

### From JavaScript (Browser)

```javascript
// Works directly in the browser thanks to CORS!
const response = await fetch('https://your-worker.workers.dev/?what=loc&format=json&name=TA1ANW');
const data = await response.json();
console.log(data);
```

### From JavaScript (Node.js)

```javascript
const response = await fetch('https://your-worker.workers.dev/?what=loc&format=json&name=TA1ANW');
const data = await response.json();
console.log(data);
```

## API Reference

The proxy accepts all standard APRS.fi API parameters. The `apikey` parameter is automatically added.

### Query Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `what` | Yes | Query type: `loc`, `wx`, `enter`, or `list` |
| `name` | Conditional | Callsign or identifier (for `loc` queries) |
| `lat` | Conditional | Latitude (for location-based queries) |
| `lng` | Conditional | Longitude (for location-based queries) |
| `format` | No | Response format: `json` (default) or `xml` |
| `limit` | No | Maximum number of results |

See the [APRS.fi API documentation](https://aprs.fi/page/api) for complete parameter reference.

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check and service info |
| `/health` | GET | Health check endpoint |
| `/?what=...` | GET | Proxy to APRS.fi API |

### Response Format

```json
{
  "command": "get",
  "result": "ok",
  "what": "loc",
  "found": 1,
  "entries": [
    {
      "name": "TA1ANW",
      "lat": "40.99350",
      "lng": "27.59833",
      "type": "l",
      "comment": "Test"
    }
  ]
}
```

## Development

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Set up local environment variables
cp .dev.vars.example .dev.vars
# Edit .dev.vars and add your API key

# View logs from deployed worker
npm run tail
```

## Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `APRS_API_KEY` | Your APRS.fi API key | Yes |

## Security

- API keys are stored as Cloudflare Worker secrets, never in code
- Client-provided API keys are stripped from requests
- 10-second timeout prevents resource exhaustion
- Only GET requests are allowed for API proxy calls

## Troubleshooting

### "APRS_API_KEY not configured"

Set the secret:
```bash
echo "your-api-key" | npx wrangler secret put APRS_API_KEY
```

### "Missing required parameter"

Ensure you're passing the `what` parameter and required parameters for your query type.

### Request timeout

The proxy has a 10-second timeout. If APRS.fi is slow, the request will fail gracefully.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [APRS.fi](https://aprs.fi/)
- [APRS.fi API Documentation](https://aprs.fi/page/api)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
