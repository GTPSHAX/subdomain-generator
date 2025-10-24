import Cloudflare from 'cloudflare';
import { NextResponse } from 'next/server';

const cf = new Cloudflare({
  apiToken: process.env.CLOUDFLARE_API_TOKEN,
});

export async function POST(request: Request) {
  try {
    const { type, name, content, ttl, comment, proxied, settings, tags } = await request.json();
    if (!type || !name || !content || !ttl) {
      return NextResponse.json(
        { error: 'Type, name, content, and ttl are required' },
        { status: 400 }
      );
    }

    const dnsRecord = await cf.dns.records.create({
      zone_id: process.env.CLOUDFLARE_ZONE_ID!,
      name: name,
      ttl,
      type,
      content,
      ...(comment && { comment }),
      ...(proxied !== undefined && { proxied }),
      ...(settings && { settings }),
      ...(tags && { tags }),
    });

    return NextResponse.json(
      { message: 'DNS record created successfully', dnsRecord },
      { status: 201 }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}