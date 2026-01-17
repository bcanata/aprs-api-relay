/**
 * APRS.fi API Proxy
 * A Cloudflare Worker that securely proxies requests to the APRS.fi API
 */

// CORS headers for web clients
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
};

// Cache configuration - cache responses for 30 seconds
const CACHE_TTL = 30;

/**
 * Handle OPTIONS requests for CORS preflight
 */
function handleOptions() {
    return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
    });
}

/**
 * Handle health check requests
 */
function handleHealth() {
    return new Response(JSON.stringify({
        status: 'healthy',
        service: 'aprsfi-proxy',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
        },
    });
}

/**
 * Create an error response
 */
function errorResponse(message, status = 500) {
    return new Response(JSON.stringify({
        error: message,
        service: 'aprsfi-proxy',
    }), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
        },
    });
}

/**
 * Validate that required API parameters are present
 */
function validateRequest(params) {
    const what = params.get('what');

    if (!what) {
        return { valid: false, error: 'Missing required parameter: what' };
    }

    const validTypes = ['loc', 'wx', 'enter', 'list'];
    if (!validTypes.includes(what)) {
        return { valid: false, error: `Invalid "what" parameter. Must be one of: ${validTypes.join(', ')}` };
    }

    // For loc and wx queries, a name or location is typically required
    if ((what === 'loc' || what === 'wx') && !params.get('name') && !params.get('lat')) {
        return { valid: false, error: `Missing required parameter for ${what} query: name or lat/lng` };
    }

    return { valid: true };
}

/**
 * Main request handler
 */
async function handleRequest(request, env, ctx) {
    try {
        const url = new URL(request.url);
        const path = url.pathname;

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return handleOptions();
        }

        // Health check endpoint (only when no query parameters)
        if (path === '/health' || (path === '/' && url.search === '')) {
            return handleHealth();
        }

        // Only allow GET requests for the proxy
        if (request.method !== 'GET') {
            return errorResponse('Method not allowed. Use GET.', 405);
        }

        // Verify API key is configured
        if (!env.APRS_API_KEY) {
            return errorResponse('APRS_API_KEY not configured. Please set the worker secret.', 500);
        }

        // Extract and validate query parameters
        const params = new URLSearchParams(url.search);

        // Remove any client-provided API key to prevent misuse
        params.delete('apikey');

        // Add the server API key
        params.set('apikey', env.APRS_API_KEY);

        // Validate request parameters
        const validation = validateRequest(params);
        if (!validation.valid) {
            return errorResponse(validation.error, 400);
        }

        // Construct the aprs.fi API URL
        const apiUrl = `https://api.aprs.fi/api/get?${params.toString()}`;

        // Fetch from APRS.fi API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(apiUrl, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'aprsfi-proxy/1.0.0 (Cloudflare Worker)',
            },
        }).finally(() => clearTimeout(timeoutId));

        // Check for API errors
        if (!response.ok) {
            return errorResponse(`APRS.fi API error: ${response.status} ${response.statusText}`, response.status);
        }

        // Parse response to check for API-level errors
        const data = await response.json();

        if (data.result === 'fail') {
            return new Response(JSON.stringify(data), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    ...CORS_HEADERS,
                },
            });
        }

        // Return successful response with CORS and caching headers
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': `public, max-age=${CACHE_TTL}`,
                ...CORS_HEADERS,
            },
        });

    } catch (error) {
        // Handle different error types
        if (error.name === 'AbortError') {
            return errorResponse('Request timeout. APRS.fi API did not respond in time.', 504);
        }

        // Log error for debugging (won't show in production without wrangler tail)
        console.error('APRS.fi Proxy Error:', error);

        return errorResponse('Internal server error. Please try again later.', 500);
    }
}

export default {
    async fetch(request, env, ctx) {
        return handleRequest(request, env, ctx);
    },
};
