import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { score, territories, seed, timeSurvived } = body;

    if (typeof score !== "number" || score < 0 || score > 500000) {
      return NextResponse.json({ ok: false, error: "Invalid score" }, { status: 400 });
    }
    if (typeof territories !== "number" || territories < 0 || territories > 50) {
      return NextResponse.json({ ok: false, error: "Invalid territories" }, { status: 400 });
    }
    if (typeof timeSurvived === "number" && timeSurvived < 5 && score > 3000) {
      return NextResponse.json({ ok: false, error: "Impossible score" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, rank: null, message: "Local only" });
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
}
