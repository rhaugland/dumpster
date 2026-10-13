import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL || "");

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
      return NextResponse.json({ error: "No messages to post" }, { status: 400 });
    }

    const id = `dump_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const anonName = getAnonName(email);
    const cleanMessages = JSON.stringify(chatMessages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    })));
    const postTopic = topic || "life";
    const postMode = mode || "bull";

    await sql`INSERT INTO aired_posts (id, anon_name, topic, mode, messages) VALUES (${id}, ${anonName}, ${postTopic}, ${postMode}, ${cleanMessages}::jsonb)`;

    return NextResponse.json({ id, anonName });
  } catch (error) {
    console.error("Dumpster API error:", error);
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

    // Auto-clean posts older than 24h
    await sql`DELETE FROM aired_posts WHERE created_at < NOW() - INTERVAL '24 hours'`;

    let rows;
    if (topic) {
      rows = await sql`SELECT * FROM aired_posts WHERE topic = ${topic} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${cursor}`;
    } else {
      rows = await sql`SELECT * FROM aired_posts ORDER BY created_at DESC LIMIT ${limit} OFFSET ${cursor}`;
    }

    // Increment view count for fetched posts
    const ids = rows.map(r => r.id as string);
    if (ids.length > 0) {
      await sql`UPDATE aired_posts SET view_count = view_count + 1 WHERE id = ANY(${ids}::text[])`;
    }

    const posts = rows.map((row) => ({
      id: row.id as string,
      anonName: row.anon_name as string,
      topic: row.topic as string,
      mode: row.mode as string,
      messages: typeof row.messages === "string" ? JSON.parse(row.messages) : row.messages,
      timestamp: new Date(row.created_at as string).getTime(),
      meTooCount: parseInt(row.me_too_count as string) || 0,
      viewCount: parseInt(row.view_count as string) || 0,
    }));

    let totalRows;
    if (topic) {
      totalRows = await sql`SELECT COUNT(*) as count FROM aired_posts WHERE topic = ${topic}`;
    } else {
      totalRows = await sql`SELECT COUNT(*) as count FROM aired_posts`;
    }
    const total = parseInt(totalRows[0].count as string);
    const hasMore = cursor + limit < total;

    return NextResponse.json({ posts, hasMore });
  } catch (error) {
    console.error("Dumpster feed error:", error);
    return NextResponse.json({ posts: [], hasMore: false });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing post id" }, { status: 400 });
    }

    const rows = await sql`UPDATE aired_posts SET me_too_count = me_too_count + 1 WHERE id = ${id} RETURNING me_too_count`;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ meTooCount: rows[0].me_too_count });
  } catch (error) {
    console.error("Me too error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
