import { headers } from 'next/headers';
import { NextRequest, NextResponse, userAgent } from 'next/server';

// Request limiter
const idToRequestCount = new Map<string, number>();
const rateLimiter = {
  windowStart: Date.now(),
  windowSize: 10000,
  maxRequests: 10,
};

const limit = (ip: string) => {
  // Check and update current window
  const now = Date.now();
  const isNewWindow = now - rateLimiter.windowStart > rateLimiter.windowSize;
  if (isNewWindow) {
    rateLimiter.windowStart = now;
    idToRequestCount.set(ip, 0);
  }

  // Check and update current request limits
  const currentRequestCount = idToRequestCount.get(ip) ?? 0;
  if (currentRequestCount >= rateLimiter.maxRequests) return true;
  idToRequestCount.set(ip, currentRequestCount + 1);

  return false;
};

// Check if request is for static assets
const isStatic = (req: NextRequest) => {
  const pathname = req.nextUrl.pathname;
  return pathname.startsWith('/_next/') || pathname.startsWith('/favicon.ico');
}

export default async function proxy(req: NextRequest) {
  if (isStatic(req)) {
    return NextResponse.next();
  }

  const { ua } = userAgent(req);

  const headersList = headers();
  const ip = (await headersList).get("x-forwarded-for");

  const data = {
    ok: true,
    ip_address: ip,
    user_agent: ua,
  };
  
  if (ip && limit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  return NextResponse.next();
}