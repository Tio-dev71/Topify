import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/autopost/route';
import { NextRequest } from 'next/server';
import { addWatermark } from '@/lib/video/watermark';
import { postToFacebookGroup } from '@/lib/automation/facebook-post';
import { prisma } from '@/lib/db';
import fs from 'fs';

vi.mock('@/lib/video/watermark', () => ({
  addWatermark: vi.fn(),
}));

vi.mock('@/lib/automation/facebook-post', () => ({
  postToFacebookGroup: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    facebookAccount: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    unlinkSync: vi.fn(),
  },
}));

describe('POST /api/autopost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/autopost', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  };

  it('should return 400 if videoUrl or groupUrl are missing', async () => {
    let req = createRequest({ groupUrl: 'http://fb.com/groups/1' });
    let response = await POST(req);
    expect(response.status).toBe(400);

    req = createRequest({ videoUrl: 'http://video.com/1.mp4' });
    response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('should process default fallback profile if no accountIds provided', async () => {
    vi.mocked(addWatermark).mockResolvedValue('/tmp/watermarked.mp4');
    vi.mocked(postToFacebookGroup).mockResolvedValue();
    vi.mocked(fs.existsSync).mockReturnValue(true);

    const req = createRequest({
      videoUrl: 'http://video.com/1.mp4',
      groupUrl: 'http://fb.com/groups/1',
      caption: 'Hello World',
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.results[0].profileId).toBe('chrome-profile'); // fallback

    expect(addWatermark).toHaveBeenCalledWith('http://video.com/1.mp4', 'Topmedia');
    expect(postToFacebookGroup).toHaveBeenCalledWith('http://fb.com/groups/1', 'Hello World', '/tmp/watermarked.mp4', 'chrome-profile');
    
    // Check cleanup
    expect(fs.existsSync).toHaveBeenCalledWith('/tmp/watermarked.mp4');
    expect(fs.unlinkSync).toHaveBeenCalledWith('/tmp/watermarked.mp4');
  });

  it('should lookup profiles in db if accountIds are provided', async () => {
    vi.mocked(addWatermark).mockResolvedValue('/tmp/watermarked2.mp4');
    vi.mocked(postToFacebookGroup).mockResolvedValue();
    vi.mocked(fs.existsSync).mockReturnValue(true);

    (prisma.facebookAccount.findMany as any).mockResolvedValue([
      { profileId: 'profile-1' },
      { profileId: 'profile-2' }
    ]);

    const req = createRequest({
      videoUrl: 'http://video.com/2.mp4',
      groupUrl: 'http://fb.com/groups/2',
      accountIds: ['acc-1', 'acc-2'],
    });

    const response = await POST(req);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(prisma.facebookAccount.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['acc-1', 'acc-2'] } }
    });

    expect(postToFacebookGroup).toHaveBeenCalledTimes(2);
    expect(postToFacebookGroup).toHaveBeenCalledWith(expect.any(String), '', '/tmp/watermarked2.mp4', 'profile-1');
    expect(postToFacebookGroup).toHaveBeenCalledWith(expect.any(String), '', '/tmp/watermarked2.mp4', 'profile-2');
  });

  it('should continue processing other profiles if one fails', async () => {
    vi.mocked(addWatermark).mockResolvedValue('/tmp/watermarked3.mp4');
    vi.mocked(fs.existsSync).mockReturnValue(true);

    (prisma.facebookAccount.findMany as any).mockResolvedValue([
      { profileId: 'profile-1' },
      { profileId: 'profile-2' }
    ]);

    vi.mocked(postToFacebookGroup)
      .mockRejectedValueOnce(new Error('Browser crash'))
      .mockResolvedValueOnce(undefined);

    const req = createRequest({
      videoUrl: 'http://video.com/3.mp4',
      groupUrl: 'http://fb.com/groups/3',
      accountIds: ['acc-1', 'acc-2'],
    });

    const response = await POST(req);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.results.length).toBe(2);
    expect(data.results[0]).toEqual({ profileId: 'profile-1', success: false, error: 'Browser crash' });
    expect(data.results[1]).toEqual({ profileId: 'profile-2', success: true });
  });

  it('should return 500 if addWatermark throws', async () => {
    vi.mocked(addWatermark).mockRejectedValue(new Error('Watermark error'));
    
    const req = createRequest({
      videoUrl: 'http://video.com/4.mp4',
      groupUrl: 'http://fb.com/groups/4',
    });

    const response = await POST(req);
    expect(response.status).toBe(500);
    
    const data = await response.json();
    expect(data.error).toBe('Failed to process and post video');
    expect(data.details).toBe('Watermark error');
  });
});
