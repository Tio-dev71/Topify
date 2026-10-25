import { NextRequest } from 'next/server';
import { GET } from '@/app/api/posts/calendar/route';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/db', () => {
  const mockPrisma = {
    post: {
      findMany: vi.fn(),
    },
  };
  return {
    prisma: mockPrisma,
    default: mockPrisma,
  };
});

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

describe('Posts Calendar API Route (F021)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if unauthorized', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/posts/calendar');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns both events and posts when querying with ?month=2026-10', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN', workspaceId: 'ws-1' },
      expires: '1',
    } as any);

    const mockScheduledPost = {
      id: 'post-bts-1',
      title: "[SPECIAL CLIP] BTS 'Life Goes On'",
      caption: 'BTS video test',
      status: 'SCHEDULED',
      scheduledAt: new Date('2026-10-28T13:26:00.000Z'),
      publishedAt: null,
      createdAt: new Date('2026-10-26T00:00:00.000Z'),
      postType: 'REEL',
      platforms: [{ id: 'plat-1', platform: 'YOUTUBE_SHORTS', status: 'PENDING' }],
    };

    vi.mocked(prisma.post.findMany).mockResolvedValue([mockScheduledPost as any]);

    const req = new NextRequest('http://localhost/api/posts/calendar?month=2026-10');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toHaveProperty('events');
    expect(json).toHaveProperty('posts');
    expect(json.posts).toHaveLength(1);
    expect(json.events).toHaveLength(1);

    // Verify post properties required by CalendarView
    const postItem = json.posts[0];
    expect(postItem.id).toBe('post-bts-1');
    expect(postItem.title).toBe("[SPECIAL CLIP] BTS 'Life Goes On'");
    expect(postItem.status).toBe('SCHEDULED');
    expect(postItem.scheduledAt).toBe('2026-10-28T13:26:00.000Z');
    expect(postItem.content).toBe('BTS video test');
    expect(postItem.platforms).toEqual(['YOUTUBE_SHORTS']);

    // Verify event properties required by Web calendar
    const eventItem = json.events[0];
    expect(eventItem.id).toBe('post-bts-1');
    expect(eventItem.start).toBe('2026-10-28T13:26:00.000Z');
    expect(eventItem.scheduledAt).toBe('2026-10-28T13:26:00.000Z');

    // Verify Prisma query was called with date range and permission conditions
    expect(prisma.post.findMany).toHaveBeenCalled();
    const callArgs = vi.mocked(prisma.post.findMany).mock.calls[0][0];
    expect(callArgs?.where).toHaveProperty('AND');
  });

  it('handles query with ?start=...&end=... from web calendar', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'admin-super', role: 'SUPER_ADMIN', workspaceId: null },
      expires: '1',
    } as any);

    vi.mocked(prisma.post.findMany).mockResolvedValue([]);

    const req = new NextRequest(
      'http://localhost/api/posts/calendar?start=2026-09-28T00:00:00.000Z&end=2026-11-01T23:59:59.000Z'
    );
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.events).toEqual([]);
    expect(json.posts).toEqual([]);
  });
});
