import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

type FeedbackBody = {
  tts_id: string;
  rating_overall: number;
  comment?: string;
  session_id?: string;
};

function isValidRating(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 1 && value <= 5;
}

function isValidShortText(value: unknown, max = 140): value is string | undefined {
  if (value == null) return true;
  if (typeof value !== "string") return false;
  return value.length <= max;
}

function getErrorCode(err: unknown): string | undefined {
  if (err && typeof err === 'object' && 'code' in (err as Record<string, unknown>)) {
    const code = (err as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabase();

    const body = (await req.json()) as FeedbackBody;

    const { tts_id, rating_overall, comment, session_id } = body ?? {} as FeedbackBody;

    if (!tts_id || typeof tts_id !== "string") {
      return NextResponse.json({ message: "tts_id is required" }, { status: 400 });
    }

    const ratingsValid = [rating_overall].every(isValidRating);

    if (!ratingsValid) {
      return NextResponse.json({ message: "All ratings must be numbers between 1 and 5" }, { status: 400 });
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
      tts_id,
      rating_overall,
      comment: comment ?? null,
      user_id: user ? user.id : null,
      session_id: user ? null : session_id!,
      user_agent: typeof req.headers.get === "function" ? req.headers.get("user-agent") : null,
    };

    const { data, error, status } = await supabase
      .from("feedbacks")
      .insert(insertPayload)
      .select("id")
      .single();

    if (error) {
      // Unique violation usually returns Postgres code 23505, sometimes surfaced as status 409
      const code = getErrorCode(error);
      if (code === "23505" || status === 409 || (error.message && /duplicate key|unique/i.test(error.message))) {
        return NextResponse.json({ message: "Feedback already exists for this tts_id" }, { status: 409 });
      }
      return NextResponse.json({ message: "Failed to save feedback" }, { status: 500 });
    }

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabase();
    const url = new URL(req.url);
    const ttsId = url.searchParams.get('tts_id');
    const sessionIdFromQuery = url.searchParams.get('session_id');
    const sessionIdFromHeader = (req.headers.get('x-feedback-session-id') || '').trim();
    if (!ttsId) {
      return NextResponse.json({ message: 'tts_id is required' }, { status: 400 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    const sessionId = user ? null : (sessionIdFromHeader || sessionIdFromQuery);
    if (!user && !sessionId) {
      return NextResponse.json({ message: 'session_id is required for anonymous user' }, { status: 400 });
    }

    const query = supabase
      .from('feedbacks')
      .select('id, rating_overall, comment')
      .eq('tts_id', ttsId)
      .limit(1);

    const { data, error } = user
      ? await query.eq('user_id', user.id)
      : await query.eq('session_id', sessionId!);

    if (error) {
      return NextResponse.json({ message: 'Failed to fetch' }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    const fb = data[0];
    return NextResponse.json({ exists: true, feedback: fb }, { status: 200 });
  } catch {
    return NextResponse.json({ message: 'Unexpected error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = await createServerSupabase();
    const body = await req.json();
    const { id, tts_id, comment, session_id, rating_overall } = body as Partial<FeedbackBody> & { id?: string };

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ message: 'id is required' }, { status: 400 });
    }
    if (comment !== undefined && !isValidShortText(comment, 140)) {
      return NextResponse.json({ message: 'comment max length is 140' }, { status: 400 });
    }
    if (rating_overall !== undefined && !isValidRating(rating_overall)) {
      return NextResponse.json({ message: 'rating_overall must be 1..5' }, { status: 400 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user && (!session_id || typeof session_id !== 'string')) {
      return NextResponse.json({ message: 'session_id is required for anonymous user' }, { status: 400 });
    }

    // Ownership check
    const { data: found, error: findErr } = await supabase
      .from('feedbacks')
      .select('id, user_id, session_id, tts_id')
      .eq('id', id)
      .single();
    if (findErr || !found) {
      return NextResponse.json({ message: 'Feedback not found' }, { status: 404 });
    }
    if (tts_id && tts_id !== found.tts_id) {
      return NextResponse.json({ message: 'Invalid tts_id' }, { status: 400 });
    }
    if (user) {
      if (found.user_id !== user.id) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }
    } else {
      if (found.session_id !== session_id) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }
    }

    const updatePayload: Record<string, unknown> = {};
    if (comment !== undefined) updatePayload.comment = comment ?? null;
    if (rating_overall !== undefined) updatePayload.rating_overall = rating_overall;
    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ message: 'Nothing to update' }, { status: 400 });
    }

    const { error: updErr } = await supabase
      .from('feedbacks')
      .update(updatePayload)
      .eq('id', id);
    if (updErr) {
      return NextResponse.json({ message: 'Failed to update' }, { status: 500 });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ message: 'Unexpected error' }, { status: 500 });
  }
}


