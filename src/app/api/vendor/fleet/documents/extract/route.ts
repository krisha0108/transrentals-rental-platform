import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

const PROMPTS: Record<string, string> = {
  INSURANCE: `You are an expert at reading Indian vehicle insurance documents.
Extract the following from this document image:
- insuranceProvider: Name of the insurance company
- validUntil: Expiry / validity end date (format: YYYY-MM-DD)
- policyNumber: Policy number if visible
- vehicleRegNumber: Vehicle registration number if visible

Return ONLY valid JSON, no markdown, no explanation. Example:
{"insuranceProvider":"ICICI Lombard","validUntil":"2026-05-15","policyNumber":"POL123456","vehicleRegNumber":"MH01AB1234"}
If a field is not found, set it to null.`,

  FITNESS: `You are an expert at reading Indian vehicle fitness certificates.
Extract the following from this document image:
- validUntil: Expiry / validity end date (format: YYYY-MM-DD)
- certificateNumber: Certificate or reference number if visible
- vehicleRegNumber: Vehicle registration number if visible
- issuingAuthority: RTO or issuing authority name if visible

Return ONLY valid JSON, no markdown, no explanation. Example:
{"validUntil":"2026-08-20","certificateNumber":"FC/2024/12345","vehicleRegNumber":"MH01AB1234","issuingAuthority":"RTO Mumbai"}
If a field is not found, set it to null.`,

  PERMIT: `You are an expert at reading Indian vehicle permit documents.
Extract the following from this document image:
- permitType: Type of permit (e.g., National, State, Tourist, Contract Carriage, Stage Carriage, Goods, All India Tourist)
- permitNumber: Permit number if visible
- vehicleRegNumber: Vehicle registration number if visible
- validUntil: Expiry date if visible (format: YYYY-MM-DD)

Return ONLY valid JSON, no markdown, no explanation. Example:
{"permitType":"All India Tourist","permitNumber":"PRM/2024/5678","vehicleRegNumber":"MH01AB1234","validUntil":"2027-03-10"}
If a field is not found, set it to null.`,

  RC: `You are an expert at reading Indian vehicle Registration Certificates (RC).
Extract the following from this document image:
- registrationNumber: Vehicle registration number (e.g., MH01AB1234)
- ownerName: Owner name if visible
- vehicleClass: Class of vehicle (e.g., LMV, HMV, Motor Cycle)
- engineNumber: Engine number if visible
- chassisNumber: Chassis number if visible
- fuelType: Fuel type if visible (Petrol, Diesel, CNG, Electric)
- manufacturingDate: Manufacturing year/date if visible (format: YYYY-MM-DD or YYYY)
- validUntil: RC validity/expiry date if visible (format: YYYY-MM-DD)

Return ONLY valid JSON, no markdown, no explanation. Example:
{"registrationNumber":"MH01AB1234","ownerName":"John Doe","vehicleClass":"LMV","engineNumber":"ENG123","chassisNumber":"CHS456","fuelType":"Diesel","manufacturingDate":"2020","validUntil":"2035-06-15"}
If a field is not found, set it to null.`,
};

export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Not authenticated' },
        { status: 401 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your-anthropic-api-key-here') {
      return NextResponse.json(
        { success: false, error: 'AI service not configured. Please set ANTHROPIC_API_KEY.' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const documentType = formData.get('documentType') as string;
    const file = formData.get('photo') as File | null;

    if (!documentType || !file) {
      return NextResponse.json(
        { success: false, error: 'Document type and image are required' },
        { status: 400 }
      );
    }

    const validTypes = ['INSURANCE', 'FITNESS', 'PERMIT', 'RC'];
    if (!validTypes.includes(documentType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid document type' },
        { status: 400 }
      );
    }

    // Read file as base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    // Determine media type
    let mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg';
    const mimeType = file.type?.toLowerCase();
    if (mimeType === 'image/png') mediaType = 'image/png';
    else if (mimeType === 'image/webp') mediaType = 'image/webp';
    else if (mimeType === 'image/gif') mediaType = 'image/gif';

    // PDF support: convert to message with document
    const isPdf = mimeType === 'application/pdf';

    const client = new Anthropic({ apiKey });

    const prompt = PROMPTS[documentType];

    let content: Anthropic.MessageCreateParams['messages'][0]['content'];

    if (isPdf) {
      content = [
        {
          type: 'document' as any,
          source: { type: 'base64', media_type: 'application/pdf', data: base64 },
        } as any,
        { type: 'text', text: prompt },
      ];
    } else {
      content = [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: base64 },
        },
        { type: 'text', text: prompt },
      ];
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content }],
    });

    // Extract text response
    const textBlock = message.content.find((b: any) => b.type === 'text') as any;
    const responseText = textBlock?.text || '';

    // Parse JSON from response
    let extracted: Record<string, any> = {};
    try {
      // Try to find JSON in the response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extracted = JSON.parse(jsonMatch[0]);
      }
    } catch {
      return NextResponse.json(
        { success: false, error: 'Could not parse document data', raw: responseText },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      documentType,
      extracted,
    });
  } catch (error: any) {
    console.error('[Document Extract] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to extract document data' },
      { status: 500 }
    );
  }
}
