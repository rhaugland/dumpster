import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

interface AiredPost {
  id: string;
  anonName: string;
  topic: string;
  mode: string;
  messages: { role: string; content: string }[];
  timestamp: number;
}

function getAnonName(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash + email.charCodeAt(i)) | 0;
  }
  return `dumpster#${Math.abs(hash) % 10000}`;
}

export async function POST(req: NextRequest) {
  try {
    const { email, topic, mode, messages } = await req.json();
    if (!email || !messages || messages.length === 0) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const chatMessages = messages.filter(
      (m: { role: string }) => m.role === "user" || m.role === "assistant"
    );
    if (chatMessages.length === 0) {
      return NextResponse.json({ error: "No messages to air" }, { status: 400 });
    }

    const post: AiredPost = {
      id: `air_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      anonName: getAnonName(email),
      topic: topic || "life",
      mode: mode || "bull",
      messages: chatMessages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
      timestamp: Date.now(),
    };

    // Store post and add to sorted set for ordering
    await redis.set(`air:${post.id}`, JSON.stringify(post), { ex: 86400 }); // 24h expiry
    await redis.zadd("air:feed", { score: post.timestamp, member: post.id });

    // Also add to topic-specific feed
    await redis.zadd(`air:topic:${post.topic}`, {
      score: post.timestamp,
      member: post.id,
    });

    return NextResponse.json({ id: post.id, anonName: post.anonName });
  } catch (error) {
    console.error("Air API error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const topic = req.nextUrl.searchParams.get("topic");
    const cursor = parseInt(req.nextUrl.searchParams.get("cursor") || "0");
    const limit = 20;

    const feedKey = topic ? `air:topic:${topic}` : "air:feed";

    // Get post IDs sorted by timestamp (newest first)
    const postIds = await redis.zrange(feedKey, cursor, cursor + limit - 1, {
      rev: true,
    });

    if (!postIds || postIds.length === 0) {
      return NextResponse.json({ posts: [], hasMore: false });
    }

    // Fetch each post
    const posts: AiredPost[] = [];
    for (const id of postIds) {
      const raw = await redis.get(`air:${id}`);
      if (raw) {
        const post = typeof raw === "string" ? JSON.parse(raw) : raw;
        posts.push(post);
      }
    }

    const total = await redis.zcard(feedKey);
    const hasMore = cursor + limit < (total || 0);

    return NextResponse.json({ posts, hasMore });
  } catch (error) {
    console.error("Air feed error:", error);
    return NextResponse.json({ posts: [], hasMore: false });
  }
}
