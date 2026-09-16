import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const posts = await prisma.competitorPost.findMany({
      where: { pageId: id },
      orderBy: { postedAt: 'desc' }
    });

    return NextResponse.json(posts);
  } catch (error: any) {
    console.error("[COMPETITOR_POSTS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
