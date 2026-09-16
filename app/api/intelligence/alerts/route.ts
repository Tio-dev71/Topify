import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    const whereClause: any = {};
    if (workspaceId) {
       whereClause.workspaceId = workspaceId;
    }

    const alerts = await prisma.alertSetting.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(alerts);
  } catch (error: any) {
    console.error("[ALERTS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, keywords, frequency, notifyEmail, notifyInApp, workspaceId } = body;

    if (!name || !keywords || !frequency) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newAlert = await prisma.alertSetting.create({
      data: {
        name,
        keywords,
        frequency,
        notifyEmail: notifyEmail ?? true,
        notifyInApp: notifyInApp ?? true,
        isActive: true,
        workspaceId
      }
    });

    return NextResponse.json(newAlert);
  } catch (error: any) {
    console.error("[ALERTS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
