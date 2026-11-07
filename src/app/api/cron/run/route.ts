import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { runAutomations } from "@/lib/domain/automation";

export const runtime = "nodejs";
export const maxDuration = 300;

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") || "";
  const given = Buffer.from(header.replace(/^Bearer\s+/i, ""));
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

async function handle(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const summary = await runAutomations("CRON");
  return NextResponse.json({ ok: true, summary });
}

export const GET = handle; // Vercel Cron uses GET with the Authorization header
export const POST = handle;
