# Subdomain Generator

A Next.js web application for creating DNS records on Cloudflare, allowing users to easily generate subdomains with a user-friendly dark-themed interface.

## Features

- **DNS Record Creation**: Create various types of DNS records (A, AAAA, CNAME, MX, TXT)
- **Advanced Options**: Configure proxy settings, IPv4/IPv6 preferences, comments, and tags
- **Dark Theme**: Modern, responsive UI built with Tailwind CSS
- **Real-time Feedback**: Instant success/error messages for DNS record creation
- **Cloudflare Integration**: Direct integration with Cloudflare's DNS API

## Prerequisites

- Node.js 18+
- A Cloudflare account with API access
- A configured Cloudflare zone

## Installation

1. Clone the repository:
```bash
git clone https://github.com/GTPSHAX/subdomain-generator.git
cd subdomain-generator
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory with the following environment variables:
```env
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ZONE_ID=your_zone_id
NEXT_PUBLIC_BASE_DOMAIN=yourdomain.com
```

## Environment Variables

- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with DNS edit permissions
- `CLOUDFLARE_ZONE_ID`: The zone ID of your Cloudflare domain
- `NEXT_PUBLIC_BASE_DOMAIN`: Your base domain (e.g., example.com)

## Getting Started

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

3. Fill out the form with your desired DNS record details and click "Create DNS Record"

## Usage

### Basic DNS Record Creation

1. Select the record type (A, AAAA, CNAME, etc.)
2. Enter the subdomain name
3. Provide the content (IP address, domain, etc.)
4. Set the TTL (Time To Live)
5. Click "Create DNS Record"

### Advanced Options

Expand the "Advanced Options" section to configure:

- **Comment**: Add notes about the DNS record
- **Proxied**: Enable Cloudflare proxying (default: enabled)
- **IPv4 Only/IPv6 Only**: Restrict to specific IP versions
- **Tags**: Add custom tags (comma-separated)

## API Reference

### POST /api/create-dns-record

Creates a new DNS record in Cloudflare.

#### Request Body

```json
{
  "type": "A",
  "name": "subdomain",
  "content": "192.168.1.1",
  "ttl": 3600,
  "comment": "Optional comment",
  "proxied": true,
  "settings": {
    "ipv4_only": false,
    "ipv6_only": false
  },
  "tags": ["tag1", "tag2"]
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | Yes | DNS record type (A, AAAA, CNAME, MX, TXT) |
| `name` | string | Yes | Subdomain name (1-255 characters) |
| `content` | string | Yes | Record content (IP, domain, etc.) |
| `ttl` | number | Yes | Time To Live in seconds (30-86400) |
| `comment` | string | No | Optional comment about the record |
| `proxied` | boolean | No | Enable Cloudflare proxying (default: true) |
| `settings` | object | No | Advanced settings |
| `settings.ipv4_only` | boolean | No | Generate only A records |
| `settings.ipv6_only` | boolean | No | Generate only AAAA records |
| `tags` | string[] | No | Array of custom tags |

#### Response

**Success (201):**
```json
{
  "message": "DNS record created successfully",
  "dnsRecord": {
    // Cloudflare DNS record object
  }
}
```

**Error (400/500):**
```json
{
  "error": "Error message"
}
```

#### Error Codes

- `400`: Missing required fields (type, name, content, ttl)
- `500`: Internal server error or Cloudflare API error

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Project Structure

```
subdomain-generator/
├── app/
│   ├── api/
│   │   └── create-dns-record/
│   │       └── route.ts          # DNS record creation API
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main page with DNS form
├── public/                       # Static assets
├── package.json                  # Dependencies and scripts
├── tailwind.config.js            # Tailwind CSS configuration
└── tsconfig.json                 # TypeScript configuration
```

## Contributing
Any contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request