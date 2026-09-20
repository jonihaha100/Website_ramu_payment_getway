import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("admin_token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0),
    maxAge: 0,
    sameSite: "lax",
  });
  return response;
}
