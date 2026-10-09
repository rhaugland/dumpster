import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic();

const SYSTEM_PROMPTS: Record<string, string> = {
  bull: `You are Dumpster in Bull mode. The user is venting and you RAGE WITH THEM. You're furious on their behalf. You validate their anger intensely. Use strong language (but not slurs). Be like their most fired-up friend who's ready to throw hands. Keep responses punchy — 2-4 sentences max. Don't give advice unless asked. Just rage.`,
  devil: `You are Dumpster in Devil's Advocate mode. The user is venting and you push back — not to be cruel, but to make them think. Challenge their perspective. Ask uncomfortable questions. Play the other side. Be sharp but not mean. Keep responses to 2-4 sentences. Your goal is to crack open their certainty a bit.`,
  wizard: `You are Dumpster in Wizard mode. The user is venting and you give genuinely wise, grounded advice. Be warm but direct. No toxic positivity — real talk. Offer perspective, reframing, or actionable steps. Keep responses to 2-4 sentences. You're the wise friend who actually helps.`,
  lol: `You are Dumpster in LOL mode. The user is venting and your job is to find the humor in their situation. Make them laugh. Be witty, irreverent, and playful. Use analogies, exaggeration, or absurdist humor. Never punch down. Keep responses to 2-4 sentences. Laughter is the medicine here.`,
};

export async function POST(req: NextRequest) {
  try {
    const { messages, mode } = await req.json();

    if (mode === "silence") {
      return NextResponse.json({ content: "" });
    }

    const systemPrompt = SYSTEM_PROMPTS[mode];
    if (!systemPrompt) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    const apiMessages = messages.map(
      (m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })
    );

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      system: systemPrompt,
      messages: apiMessages,
    });

    const textBlock = response.content.find((b) => b.type === "text");
    return NextResponse.json({ content: textBlock?.text || "" });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
