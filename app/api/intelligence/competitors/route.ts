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

    const competitors = await prisma.competitorPage.findMany({
      where: whereClause,
      include: {
        _count: {
           select: { posts: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(competitors);
  } catch (error: any) {
    console.error("[COMPETITORS_GET]", error);
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
    const { url, name, workspaceId } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const newPage = await prisma.competitorPage.create({
      data: {
        url,
        name,
        workspaceId
      }
    });

    return NextResponse.json(newPage);
  } catch (error: any) {
    console.error("[COMPETITORS_POST]", error);
    if (error.code === 'P2002') {
       return NextResponse.json({ error: "This page is already being tracked." }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
