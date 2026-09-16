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

    const keywords = await prisma.keywordTracker.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(keywords);
  } catch (error: any) {
    console.error("[KEYWORDS_GET]", error);
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
    const { keyword, workspaceId } = body;

    if (!keyword) {
      return NextResponse.json({ error: "Keyword is required" }, { status: 400 });
    }

    // Mock initial volume and trend for demonstration purposes
    const volume = Math.floor(Math.random() * 1000) + 100;
    const trend = ['UP', 'DOWN', 'STABLE'][Math.floor(Math.random() * 3)];

    const newKeyword = await prisma.keywordTracker.create({
      data: {
        keyword,
        workspaceId,
        volume,
        trend
      }
    });

    return NextResponse.json(newKeyword);
  } catch (error: any) {
    console.error("[KEYWORDS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
