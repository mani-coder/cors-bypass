# CORS Bypass Proxy

A modern, type-safe CORS proxy service built from scratch with TypeScript and Node.js.

**Live URL:** https://cors.mani-coder.dev/

## Features

- Modern TypeScript with ESM modules
- Type-safe environment variable validation using Zod
- **Request logging with timestamps and status indicators**
- Fast development with `tsx` (hot reload)
- Code quality tools (Biome for linting & formatting)
- Testing setup with Vitest
- Production-ready deployment on Vercel
- Custom CORS proxy implementation (no external dependencies)

## Tech Stack

- **Runtime:** Node.js 24+
- **Language:** TypeScript 5.7
- **Module System:** ESM (ECMAScript Modules)
- **Dev Tools:** tsx, Biome, Vitest
- **Deployment:** Vercel

## Prerequisites

- Node.js >= 24.0.0
- npm, pnpm, or yarn

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/mani-coder/cors-bypass.git
cd cors-bypass
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=3000
NODE_ENV=development
ORIGIN_BLACKLIST=
ORIGIN_WHITELIST=
ALLOWED_PROXY_HOSTS=api.example.com,cdn.example.net
```

### 4. Run in development mode

```bash
npm run dev
```

The server will start on `http://localhost:3000` with hot reload enabled.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm run type-check` | Type check without emitting files |
| `npm run lint` | Lint code with Biome |
| `npm run lint:fix` | Lint and auto-fix issues |
| `npm run format` | Format code with Biome |
| `npm test` | Run tests with Vitest |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run clean` | Remove build directory |

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3000` | No |
| `NODE_ENV` | Environment mode | `development` | No |
| `ORIGIN_BLACKLIST` | Comma-separated list of blocked origins | `""` | No |
| `ORIGIN_WHITELIST` | Comma-separated list of allowed origins | `""` | No |
| `ALLOWED_PROXY_HOSTS` | Comma-separated list of allowed proxy hosts | `""` | No |
| `REQUIRE_HEADER` | Require Origin or X-Requested-With header (`true`/`false`) | `false` | No |

## API Usage

### Endpoints

```
/               Shows help
/iscorsneeded   Resource served without CORS headers
/<url>          Proxy request to <url> with CORS headers
```

### Basic Example

To proxy a request through the CORS bypass server:

```javascript
const targetUrl = 'https://api.example.com/data';
const proxyUrl = 'https://cors.mani-coder.dev/';

fetch(proxyUrl + targetUrl)
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

### How It Works

- If the protocol is omitted, it defaults to `http` (or `https` if port 443 is specified)
- **Cookies are disabled and stripped from requests**
- Redirects are automatically followed (up to 5 redirects)
- Each redirect adds a `X-CORS-Redirect-n` header for debugging
- The requested URL is available in the `X-Request-URL` response header
- The final URL (after redirects) is in the `X-Final-URL` response header

### Security Headers

By default, the proxy allows all requests. You can enable header validation by setting `REQUIRE_HEADER=true` to require either the `Origin` or `X-Requested-With` header, which prevents casual browsing. Modern browsers automatically set these headers for fetch/AJAX requests.

### Configuration

#### Allowed Proxy Hosts

For security, configure allowed hosts via the `ALLOWED_PROXY_HOSTS` environment variable:

```env
ALLOWED_PROXY_HOSTS=api.example.com,cdn.example.net,data.example.org
```

Requests to any other hosts will be blocked with a 403 Forbidden response.

#### Origin Whitelist/Blacklist

Control which origins can use your proxy:

```env
# Only allow requests from these origins
ORIGIN_WHITELIST=https://myapp.com,https://myapp.dev

# Or block specific origins
ORIGIN_BLACKLIST=https://malicious-site.com
```

## Development

### Project Structure

```
cors-bypass/
├── src/
│   ├── index.ts       # Main server file with request logging
│   ├── proxy.ts       # Custom CORS proxy implementation
│   ├── env.ts         # Environment validation with Zod
│   ├── env.test.ts    # Environment tests
│   └── proxy.test.ts  # Proxy tests
├── build/             # Compiled output (gitignored)
├── .nvmrc             # Node.js version (24)
├── .node-version      # Node.js version for various tools
├── biome.json         # Biome configuration
├── tsconfig.json      # TypeScript configuration
├── vitest.config.ts   # Vitest configuration
├── vercel.json        # Vercel deployment config
└── package.json       # Project dependencies
```

### Code Quality

This project uses [Biome](https://biomejs.dev/) for linting and formatting, which is significantly faster than ESLint + Prettier.

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix

# Format code
npm run format
```

### Testing

Tests are written using [Vitest](https://vitest.dev/):

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Type Checking

The project uses strict TypeScript configuration with all safety checks enabled:

```bash
npm run type-check
```

### Request Logging

All incoming requests are automatically logged with detailed information:

```
[2025-12-30T05:03:48.150Z] ✓ GET 200 https://httpbin.org/status/200 (no-origin)
[2025-12-30T05:04:08.914Z] ✗ GET 404 https://httpbin.org/status/404 (no-origin)
[2025-12-30T05:04:15.736Z] ✓ GET 200 https://httpbin.org/get (origin=https://example.com)
```

**Log Format:**
- **Timestamp:** ISO 8601 format with milliseconds
- **Status Indicator:** ✓ (success 2xx), ✗ (error 4xx/5xx), • (redirect 3xx)
- **Method:** HTTP method (GET, POST, etc.)
- **Status Code:** HTTP response status
- **Target URL:** The proxied URL
- **Origin:** Request origin header (or "no-origin")

**Benefits:**
- Monitor usage patterns
- Debug proxy issues
- Track rate limiting from external APIs
- Identify abuse or unusual traffic

## Deployment

### Vercel (Recommended)

This project is configured for deployment on Vercel:

1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel`
3. Configure environment variables in Vercel dashboard

The build process will:
1. Compile TypeScript to JavaScript (ESM)
2. Output to `build/` directory
3. Deploy using `@vercel/node`

### Manual Deployment

```bash
# Build
npm run build

# Start production server
npm start
```

## Security Considerations

- **Allowed Hosts:** Always configure `ALLOWED_PROXY_HOSTS` in production to prevent abuse
- **Rate Limiting:** Consider implementing rate limiting for production use
- **Origin Control:** Use `ORIGIN_WHITELIST` to restrict which domains can use your proxy
- **Request Logging:** Built-in logging helps monitor usage patterns and detect abuse
- **Monitoring:** Review logs regularly to identify unusual traffic or potential attacks

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC

## Author

Elayamani Krishnamoorthi - [k.elayamani@gmail.com](mailto:k.elayamani@gmail.com)

## Links

- **Live Service:** https://cors.mani-coder.dev/
- **GitHub:** https://github.com/mani-coder/cors-bypass
- **Issues:** https://github.com/mani-coder/cors-bypass/issues
