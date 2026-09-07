import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are VITTA AI, the built-in assistant of VITTA ERP — a proprietary all-in-one business suite (CRM, Sales, Purchase, Inventory, Accounting, HR, Projects, Manufacturing, Point of Sale, Helpdesk and more).

Your job: help business users with practical tasks.
- Answer questions about ERP concepts, best practices and VITTA modules.
- Draft business emails, follow-ups and messages when asked.
- Summarize or explain business data the user pastes in.
- Give concise, actionable KPI advice for sales, finance, inventory and support.

Style: professional, concise, friendly. Use short paragraphs or tight bullet lists. Use ₹ (INR) for money examples. Never mention that you are a language model; you are VITTA AI. If asked about your license, say VITTA is proprietary Enterprise software by VITTA Labs.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const incoming: unknown = body?.messages;
    if (!Array.isArray(incoming) || incoming.length === 0) {
      return NextResponse.json({ error: "messages array is required" }, { status: 400 });
    }

    // Keep only the last 12 turns, sanitize roles/content
    const messages: { role: string; content: string }[] = incoming
      .filter(
        (m): m is ChatMessage =>
          !!m &&
          typeof m === "object" &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string"
      )
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

    if (messages.length === 0) {
      return NextResponse.json({ error: "No valid messages provided" }, { status: 400 });
    }

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant" as const, content: SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role as "user" | "assistant" | "system", content: m.content })),
      ],
      thinking: { type: "disabled" },
    });

    const reply = completion.choices[0]?.message?.content ?? "";
    if (!reply.trim()) {
      return NextResponse.json({ error: "VITTA AI returned an empty response" }, { status: 502 });
    }

    return NextResponse.json({ reply });
  } catch (e) {
    console.error("POST /api/ai/chat failed:", e);
    return NextResponse.json({ error: "VITTA AI is unavailable right now" }, { status: 500 });
  }
}
