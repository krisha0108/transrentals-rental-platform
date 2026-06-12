import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { ADMIN_TOOLS, executeTool } from '@/lib/ai/admin-tools';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-chat';

const SYSTEM_PROMPT = `You are an intelligent admin assistant for TransRentals, a vehicle rental platform in India.
You have direct access to the platform's live database through specialized tools.

What you can do:
- Query booking statistics across car, bike, chauffeur, and truck rentals
- Look up vendor information and approval status
- Search customer records
- View driver information and status
- Analyze inquiry/quote request data
- Get revenue statistics from completed bookings
- Check fleet and vehicle counts
- View travel agent information

Guidelines:
- Always call the relevant tool to fetch live data before answering any question about numbers or records.
- Be concise. Use bullet points or short paragraphs.
- Format Indian currency as ₹ with commas (e.g., ₹1,23,456).
- If someone asks about a specific person or company, use the search parameter in the tools.
- If data is unavailable or zero, say so clearly.
- Today's date: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  if (!['SUPER_ADMIN', 'ADMIN', 'SUB_ADMIN', 'MANAGER'].includes(user?.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'DEEPSEEK_API_KEY not configured.' }, { status: 503 });
  }

  let body: { messages: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages array required' }, { status: 400 });
  }

  try {
    // Agentic loop — handle tool calls until finish_reason is 'stop' or max 5 iterations
    const currentMessages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const MAX_ITER = 5;
    for (let i = 0; i < MAX_ITER; i++) {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: currentMessages,
          tools: ADMIN_TOOLS,
          tool_choice: 'auto',
          max_tokens: 1024,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`DeepSeek API error ${response.status}: ${text.slice(0, 300)}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      if (!choice) throw new Error('No response from DeepSeek');

      const { finish_reason, message } = choice;

      // No tool calls — return the text response
      if (finish_reason === 'stop' || !message.tool_calls?.length) {
        return NextResponse.json({ reply: message.content ?? '' });
      }

      // Execute tool calls
      if (finish_reason === 'tool_calls') {
        // Append assistant message with tool_calls
        currentMessages.push(message);

        // Execute each tool and append results
        for (const tc of message.tool_calls) {
          let args: Record<string, any> = {};
          try {
            args = JSON.parse(tc.function.arguments || '{}');
          } catch {}

          const result = await executeTool(tc.function.name, args);
          currentMessages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: result,
          });
        }
        continue;
      }

      // Unknown finish reason — return whatever content we have
      return NextResponse.json({ reply: message.content ?? '' });
    }

    return NextResponse.json({ reply: 'Could not process the request. Please try again.' });
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error('Admin chat error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
