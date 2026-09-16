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

    const competitor = await prisma.competitorPage.findUnique({
      where: { id },
      include: {
        posts: true,
      },
    });

    if (!competitor) {
      return NextResponse.json({ error: "Competitor not found" }, { status: 404 });
    }

    const totalPosts = competitor.posts.length;
    
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;

    competitor.posts.forEach((post) => {
      totalLikes += post.likesCount;
      totalComments += post.commentsCount;
      totalShares += post.sharesCount;
    });

    const averageLikes = totalPosts > 0 ? Math.round(totalLikes / totalPosts) : 0;
    const averageComments = totalPosts > 0 ? Math.round(totalComments / totalPosts) : 0;
    const averageShares = totalPosts > 0 ? Math.round(totalShares / totalPosts) : 0;

    // Group by date for chart
    const chartDataMap: Record<string, any> = {};
    competitor.posts.forEach((post) => {
      const date = new Date(post.postedAt || post.scrapedAt).toLocaleDateString('vi-VN');
      if (!chartDataMap[date]) {
        chartDataMap[date] = { date, posts: 0, engagement: 0 };
      }
      chartDataMap[date].posts += 1;
      chartDataMap[date].engagement += (post.likesCount + post.commentsCount + post.sharesCount);
    });

    const chartData = Object.values(chartDataMap).sort((a: any, b: any) => {
      // Simple sort by date string may not be accurate, but sufficient for short term if formats match, 
      // ideally we'd sort by actual date object. We'll leave as is for simplicity or parse back.
      const dateA = new Date(a.date.split('/').reverse().join('-')).getTime();
      const dateB = new Date(b.date.split('/').reverse().join('-')).getTime();
      return dateA - dateB;
    });

    return NextResponse.json({
      totalPosts,
      totalLikes,
      totalComments,
      totalShares,
      averageLikes,
      averageComments,
      averageShares,
      chartData,
    });
  } catch (error: any) {
    console.error("[COMPETITOR_STATS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
