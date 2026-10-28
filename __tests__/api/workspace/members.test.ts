import { GET, POST } from '@/app/api/workspace/members/route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    allowedEmail: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  };
  return { prisma: mockPrisma, default: mockPrisma };
});

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

describe('/api/workspace/members API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if unauthorized', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/workspace/members');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('should return combined list of users and allowed emails', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'u1', workspaceId: 'ws1' },
    } as any);

    vi.mocked(prisma.user.findMany).mockResolvedValue([
      {
        id: 'u1',
        name: 'Admin User',
        email: 'admin@topify.vn',
        role: 'ADMIN',
        image: null,
        createdAt: new Date(),
      },
    ] as any);

    vi.mocked(prisma.allowedEmail.findMany).mockResolvedValue([
      {
        id: 'a1',
        email: 'staff@topify.vn',
        role: 'STAFF',
        createdAt: new Date(),
      },
    ] as any);

    const req = new NextRequest('http://localhost/api/workspace/members');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.members.length).toBe(2);
    expect(data.members[0].email).toBe('admin@topify.vn');
    expect(data.members[0].isCurrentUser).toBe(true);
    expect(data.members[1].email).toBe('staff@topify.vn');
    expect(data.members[1].isCurrentUser).toBe(false);
  });

  it('should invite a new member via POST', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'u1', workspaceId: 'ws1' },
    } as any);

    vi.mocked(prisma.allowedEmail.upsert).mockResolvedValue({
      id: 'inv1',
      email: 'newbie@topify.vn',
      role: 'STAFF',
      workspaceId: 'ws1',
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/workspace/members', {
      method: 'POST',
      body: JSON.stringify({ email: 'newbie@topify.vn', role: 'STAFF' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.member.email).toBe('newbie@topify.vn');
  });
});
