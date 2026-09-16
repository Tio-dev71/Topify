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
    const q = searchParams.get("q") || "";
    const sort = searchParams.get("sort") || "latest";
    const workspaceId = searchParams.get("workspaceId");

    const whereClause: any = {};
    if (workspaceId) {
       whereClause.page = { workspaceId: workspaceId };
    }

    if (q) {
      whereClause.content = { contains: q, mode: 'insensitive' };
    }

    let orderBy: any = { postedAt: 'desc' };
    if (sort === "viral") {
      orderBy = { likesCount: 'desc' };
    }

    const posts = await prisma.competitorPost.findMany({
      where: whereClause,
      include: {
        page: true
      },
      orderBy,
      take: 100
    });

    return NextResponse.json(posts);
  } catch (error: any) {
    console.error("[INTELLIGENCE_SEARCH_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
