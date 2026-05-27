import Cloudflare from 'cloudflare';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const cf = new Cloudflare({
	apiToken: process.env.CLOUDFLARE_API_TOKEN,
});

const editDnsRecordSchema = z.object({
	type: z.enum(['A', 'AAAA', 'CNAME', 'MX', 'TXT']),
	name: z.string().min(1),
	content: z.string().min(1),
	ttl: z.number().int().min(30).max(86400),
	access_key: z.string().min(1),
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
		const parsedBody = editDnsRecordSchema.safeParse(await request.json());
		if (!parsedBody.success) {
			return NextResponse.json(
				{ error: 'Invalid request body', details: parsedBody.error.flatten() },
				{ status: 400 }
			);
		}

		const { type, name, content, ttl, access_key, proxied, settings, tags } = parsedBody.data;

		const zoneId = process.env.CLOUDFLARE_ZONE_ID;
		if (!zoneId) {
			return NextResponse.json(
				{ error: 'Cloudflare zone is not configured' },
				{ status: 500 }
			);
		}

		const records = cf.dns.records.list({
			zone_id: zoneId,
			name: { exact: name },
			comment: { exact: access_key },
		});

		const matchingRecords = [];
		for await (const record of records) {
			if (record.name === name && record.comment === access_key) {
				matchingRecords.push(record);
			}
		}

		if (matchingRecords.length === 0) {
			return NextResponse.json(
				{ error: 'DNS record not found for the provided access_key' },
				{ status: 404 }
			);
		}

		if (matchingRecords.length > 1) {
			return NextResponse.json(
				{ error: 'Multiple DNS records matched the provided access_key' },
				{ status: 409 }
			);
		}

		const dnsRecord = matchingRecords[0];

		const updatedDnsRecord = await cf.dns.records.edit(dnsRecord.id, {
			zone_id: zoneId,
			name,
			ttl,
			type,
			content,
			comment: access_key,
			...(proxied !== undefined && { proxied }),
			...(settings && { settings }),
			...(tags && { tags }),
		});

		return NextResponse.json(
			{ message: 'DNS record updated successfully', dnsRecord: updatedDnsRecord },
			{ status: 200 }
		);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : 'Internal Server Error';
		return NextResponse.json(
			{ error: message },
			{ status: 500 }
		);
	}
}
