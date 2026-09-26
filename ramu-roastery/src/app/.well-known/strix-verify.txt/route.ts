import { NextResponse } from "next/server";

export async function GET() {
  return new NextResponse("strix-verify-d1f781c10ef98d2d65dd51ff6e14a4a6", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
