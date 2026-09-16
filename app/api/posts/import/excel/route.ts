import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import * as xlsx from 'xlsx';
import { PostStatus, VideoSource } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = (session.user as any).workspaceId;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet) as any[];

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Excel file is empty' }, { status: 400 });
    }

    const postsToCreate: Array<{
      title: string;
      caption: string | null;
      firstComment: string | null;
      scheduledAt: Date | null;
      videoUrl: string;
    }> = [];
    
    // Parse the data sequentially or in parallel
    for (const row of data) {
      const title = row['Title'] || row['title'];
      const caption = row['Caption'] || row['caption'] || null;
      const firstComment = row['First Comment'] || row['firstComment'] || null;
      let scheduledTime = row['Scheduled Time'] || row['scheduledTime'] || null;
      const videoUrl = row['Video URL'] || row['videoUrl'] || row['VideoUrl'];

      if (!title || !videoUrl) {
        continue; // Skip invalid rows
      }

      let parsedDate = null;
      if (scheduledTime) {
        // If it's a number, xlsx might have parsed it as Excel serial date
        if (typeof scheduledTime === 'number') {
          // Convert Excel serial date to JS Date
          parsedDate = new Date(Math.round((scheduledTime - 25569) * 86400 * 1000));
        } else {
          parsedDate = new Date(scheduledTime);
        }
      }

      postsToCreate.push({
        title: String(title),
        caption: caption ? String(caption) : null,
        firstComment: firstComment ? String(firstComment) : null,
        scheduledAt: parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : null,
        videoUrl: String(videoUrl),
      });
    }

    if (postsToCreate.length === 0) {
      return NextResponse.json({ error: 'No valid rows found in Excel file. Make sure you have "Title" and "Video URL" columns.' }, { status: 400 });
    }

    // Create the assets and posts in a transaction
    const createdPosts = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const item of postsToCreate) {
        // Create video asset first
        const videoAsset = await tx.videoAsset.create({
          data: {
            originalFileName: 'Imported from Excel',
            titleFromFileName: item.title,
            storageUrl: item.videoUrl,
            source: VideoSource.LOCAL_UPLOAD, // Or maybe a new source TYPE if added
            mimeType: 'video/mp4', // Default guess
            size: 0, // Unknown
            createdById: session.user.id,
            workspaceId,
          }
        });

        const post = await tx.post.create({
          data: {
            title: item.title,
            caption: item.caption,
            firstComment: item.firstComment,
            videoAssetId: videoAsset.id,
            createdById: session.user.id,
            workspaceId,
            status: item.scheduledAt ? PostStatus.SCHEDULED : PostStatus.DRAFT,
            scheduledAt: item.scheduledAt,
          }
        });
        
        results.push(post);
      }
      return results;
    });

    return NextResponse.json({ 
      success: true, 
      count: createdPosts.length,
      message: `Successfully imported ${createdPosts.length} posts` 
    });

  } catch (error: any) {
    console.error('Excel import error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
