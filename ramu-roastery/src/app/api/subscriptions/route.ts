import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { requireAdmin, getUserSession } from "../../../lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userEmail = searchParams.get("userEmail");

  if (!userEmail) {
    return NextResponse.json({ error: "userEmail is required" }, { status: 400 });
  }

  const cleanEmail = userEmail.toLowerCase().trim();
  const adminCheck = await requireAdmin(req);
  const isAdmin = !adminCheck;
  const session = await getUserSession(req);
  const isOwner = session && session.email.toLowerCase() === cleanEmail;

  if (!isAdmin && !isOwner) {
    return NextResponse.json(
      { error: "Unauthorized: Silakan login untuk melihat paket langganan Anda." },
      { status: 401 }
    );
  }

  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { userEmail: cleanEmail },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error("Failed to fetch subscriptions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, action } = body;
    
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const subscription = await prisma.subscription.findUnique({ where: { id } });
    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const adminCheck = await requireAdmin(req);
    const isAdmin = !adminCheck;
    const session = await getUserSession(req);
    const isOwner = session && session.email.toLowerCase() === subscription.userEmail.toLowerCase();

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "Forbidden: Anda tidak memiliki akses untuk mengubah paket langganan ini." },
        { status: 403 }
      );
    }

    let updateData: any = {};

    if (status) {
      updateData.status = status;
    }

    if (action === "skip") {
      const currentNext = new Date(subscription.nextDelivery);
      const skippedDate = new Date(currentNext);
      if (subscription.frequency === "1_WEEK") skippedDate.setDate(skippedDate.getDate() + 7);
      else if (subscription.frequency === "2_WEEKS") skippedDate.setDate(skippedDate.getDate() + 14);
      else skippedDate.setMonth(skippedDate.getMonth() + 1);

      updateData.nextDelivery = skippedDate;
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update subscription:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
