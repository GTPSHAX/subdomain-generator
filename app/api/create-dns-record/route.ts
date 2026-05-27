import Cloudflare from 'cloudflare';
import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const cf = new Cloudflare({
  apiToken: process.env.CLOUDFLARE_API_TOKEN,
});

const createDnsRecordSchema = z.object({
  type: z.enum(['A', 'AAAA', 'CNAME', 'MX', 'TXT']),
  name: z.string().min(1),
  content: z.string().min(1),
  ttl: z.number().int().min(30).max(86400),
  proxied: z.boolean().optional(),
  settings: z
    .object({
      ipv4_only: z.boolean().optional(),
      ipv6_only: z.boolean().optional(),
    })
    .optional(),
  tags: z.array(z.string().min(1)).optional(),
});

export async function POST(request: Request) {
  try {
    const parsedBody = createDnsRecordSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsedBody.error.flatten() },
        { status: 400 }
      );
    }

    const { type, name, content, ttl, proxied, settings, tags } = parsedBody.data;
    const accessKey = randomBytes(16).toString('hex');

    const dnsRecord = await cf.dns.records.create({
      zone_id: process.env.CLOUDFLARE_ZONE_ID!,
      name: name,
      ttl,
      type,
      content,
      comment: accessKey,
      ...(proxied !== undefined && { proxied }),
      ...(settings && { settings }),
      ...(tags && { tags }),
    });

    return NextResponse.json(
      { message: 'DNS record created successfully', access_key: accessKey, dnsRecord },
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