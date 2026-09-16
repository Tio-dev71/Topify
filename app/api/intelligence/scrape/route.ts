import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { pageId, fbAccountId } = body;

    if (!pageId || !fbAccountId) {
      return NextResponse.json({ error: "pageId and fbAccountId are required" }, { status: 400 });
    }

    const page = await prisma.competitorPage.findUnique({ where: { id: pageId } });
    if (!page) {
      return NextResponse.json({ error: "Competitor page not found" }, { status: 404 });
    }

    const fbAccount = await prisma.facebookAccount.findUnique({ where: { id: fbAccountId } });
    if (!fbAccount) {
      return NextResponse.json({ error: "Facebook account not found" }, { status: 404 });
    }

    // Create an AutomationTask to trigger the engine
    const task = await prisma.automationTask.create({
      data: {
        name: `Scrape Fanpage: ${page.url}`,
        type: 'fb_scrape_fanpage',
        config: {
          targetUrl: page.url,
        },
        profileIds: [fbAccount.profileId],
        status: 'IDLE'
      }
    });

    return NextResponse.json({ success: true, taskId: task.id });
  } catch (error: any) {
    console.error("[INTELLIGENCE_SCRAPE_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
