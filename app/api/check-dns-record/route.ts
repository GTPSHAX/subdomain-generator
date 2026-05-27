import Cloudflare from 'cloudflare';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const cf = new Cloudflare({
	apiToken: process.env.CLOUDFLARE_API_TOKEN,
});

const checkDnsRecordSchema = z.object({
	name: z.string().min(1),
});

export async function POST(request: Request) {
	try {
		const parsedBody = checkDnsRecordSchema.safeParse(await request.json());
		if (!parsedBody.success) {
			return NextResponse.json(
				{ error: 'Invalid request body', details: parsedBody.error.flatten() },
				{ status: 400 }
			);
		}

		const zoneId = process.env.CLOUDFLARE_ZONE_ID;
		if (!zoneId) {
			return NextResponse.json(
				{ error: 'Cloudflare zone is not configured' },
				{ status: 500 }
			);
		}

		const records = cf.dns.records.list({
			zone_id: zoneId,
			name: { exact: parsedBody.data.name },
		});

		for await (const record of records) {
			if (record.name === parsedBody.data.name) {
				return NextResponse.json(
					{ exists: true },
					{ status: 200 }
				);
			}
		}

		return NextResponse.json(
			{ exists: false },
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