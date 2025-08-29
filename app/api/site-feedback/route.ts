import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

type SiteFeedbackBody = {
  rating_overall: number;
  comment?: string;
  session_id?: string;
  page_path?: string;
};

function isValidRating(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 1 && value <= 5;
}

function isValidShortText(value: unknown, max = 140): value is string | undefined {
  if (value == null) return true;
  if (typeof value !== "string") return false;
  return value.length <= max;
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabase();

    const body = (await req.json()) as SiteFeedbackBody;

    const { rating_overall, comment, session_id, page_path } = (body ?? {}) as SiteFeedbackBody;

    if (!isValidRating(rating_overall)) {
      return NextResponse.json({ message: "rating_overall must be between 1 and 5" }, { status: 400 });
    }

    if (!isValidShortText(comment, 140)) {
      return NextResponse.json({ message: "comment max length is 140" }, { status: 400 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && (!session_id || typeof session_id !== "string")) {
      return NextResponse.json({ message: "session_id is required for anonymous feedback" }, { status: 400 });
    }

    const insertPayload: Record<string, unknown> = {
      rating_overall,
      comment: comment ?? null,
      user_id: user ? user.id : null,
      session_id: user ? null : session_id!,
      user_agent: typeof req.headers.get === "function" ? req.headers.get("user-agent") : null,
      page_path: page_path ?? "/",
    };

    const { data, error } = await supabase
      .from("site_feedbacks")
      .insert(insertPayload)
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ message: "Failed to save feedback" }, { status: 500 });
    }

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}


