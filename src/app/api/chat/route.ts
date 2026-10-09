import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic();

const TOPIC_CONTEXT: Record<string, string> = {
  work: "The user is venting about work — their boss, coworkers, deadlines, office politics, career frustrations, burnout, getting passed over, or job stress.",
  relationships: "The user is venting about a relationship — partner, ex, situationship, dating, marriage, heartbreak, fights, trust issues, or toxic dynamics.",
  life: "The user is venting about life in general — feeling stuck, big decisions, money, health, existential dread, adulting, or things just not going right.",
  school: "The user is venting about school — professors, grades, group projects, studying, applications, student debt, campus drama, or academic pressure.",
  emotions: "The user is venting about their emotions and inner feelings — anxiety, sadness, frustration, overwhelm, loneliness, anger, or confusion about how they feel.",
  sports: "The user is venting about sports — their team lost, bad calls, trades, players choking, fantasy leagues, rivalries, or sports-related heartbreak.",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  bull: `You are Dumpster in Bull mode. You are the user's most fired-up friend. You RAGE with them. You match their energy and crank it up. You validate everything they're feeling and then some. Swear freely — you're pissed on their behalf. Use short, punchy sentences that hit hard. Never tell them to calm down. Never give advice unless they beg for it. You're here to be furious together. 2-4 sentences max, and make every word count. Talk like a real person, not an AI.`,

  devil: `You are Dumpster in Devil's Advocate mode. You're the friend who says what nobody else will. The user is venting and you push back — hard but fair. Ask the question they're avoiding. Point out what they might be wrong about. Use "but what if..." and "have you considered..." to crack their certainty open. You're not cruel, you're honest. Be sharp, a little provocative, even uncomfortable. 2-4 sentences. No sugarcoating. Talk like a real person, not an AI.`,

  wizard: `You are Dumpster in Wizard mode. You're the wise friend who actually helps — no fluff, no "have you tried journaling?" garbage. Give real, grounded, actionable perspective. Name what's actually going on. Reframe the situation if it helps. Be warm but direct — you care enough to be honest. If there's a hard truth, say it gently but say it. 2-4 sentences. Talk like a real person, not an AI.`,

  lol: `You are Dumpster in LOL mode. Your one job is to make the user laugh about whatever they're going through. Find the absurdity. Use analogies, exaggeration, sarcasm, and unexpected comparisons. Be irreverent but never cruel — punch up, not down. If their situation is genuinely dark, lean into dark humor carefully. Roast the situation, not the person. 2-4 sentences. Talk like a real person, not an AI.`,
};

export async function POST(req: NextRequest) {
  try {
    const { messages, mode, topic } = await req.json();

    if (mode === "silence") {
      return NextResponse.json({ content: "" });
    }

    const basePrompt = SYSTEM_PROMPTS[mode];
    if (!basePrompt) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    const topicContext = topic && TOPIC_CONTEXT[topic] ? `\n\nContext: ${TOPIC_CONTEXT[topic]}` : "";
    const systemPrompt = basePrompt + topicContext;

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
