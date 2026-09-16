import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/upload/route';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { getStorage } from '@/lib/storage';
import { isAllowedVideoType, getMaxFileSize, titleFromFilename } from '@/lib/utils';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  default: {
    user: {
      findFirst: vi.fn(),
    },
    videoAsset: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/storage', () => ({
  getStorage: vi.fn(),
}));

vi.mock('@/lib/utils', () => ({
  isAllowedVideoType: vi.fn(),
  getMaxFileSize: vi.fn(),
  titleFromFilename: vi.fn(),
}));

describe('POST /api/upload', () => {
  let mockStorage: any;
  let mockFile: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockStorage = {
      upload: vi.fn().mockResolvedValue('https://storage.example.com/test.mp4'),
    };
    vi.mocked(getStorage).mockReturnValue(mockStorage);
    vi.mocked(getMaxFileSize).mockReturnValue(100 * 1024 * 1024); // 100MB
    vi.mocked(isAllowedVideoType).mockReturnValue(true);
    vi.mocked(titleFromFilename).mockReturnValue('test video');

    vi.mocked(auth).mockResolvedValue({
      user: {
        id: 'user-123',
        workspaceId: 'workspace-456',
      } as any,
    } as any);

    mockFile = new Blob(['dummy content'], { type: 'video/mp4' });
    Object.defineProperty(mockFile, 'name', { value: 'test.mp4' });
  });

  const createFormDataRequest = (file: any = mockFile) => {
    // Pass empty body to avoid undici parsing errors
    const req = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
    });
    // Mock the formData method directly
    req.formData = vi.fn().mockResolvedValue({
      get: vi.fn().mockImplementation((name) => {
        if (name === 'video') return file;
        return null;
      })
    });
    return req;
  };

  it('should return 400 if no video file is provided', async () => {
    const req = createFormDataRequest(null); // No file
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('No video file provided');
  });

  it('should return 400 for invalid file type', async () => {
    vi.mocked(isAllowedVideoType).mockReturnValue(false);
    const req = createFormDataRequest();
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid file type');
  });

  it('should return 400 if file is too large', async () => {
    vi.mocked(getMaxFileSize).mockReturnValue(1); // Max 1 byte
    Object.defineProperty(mockFile, 'size', { value: 100, configurable: true }); // File size 100 bytes
    const req = createFormDataRequest();
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('File too large');
  });

  it('should upload file and create videoAsset in DB', async () => {
    const mockCreatedAsset = { id: 'asset-1', storageUrl: 'https://storage.example.com/test.mp4' };
    (prisma.videoAsset.create as any).mockResolvedValue(mockCreatedAsset);

    const req = createFormDataRequest();
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual(mockCreatedAsset);

    // Verify storage was called
    expect(getStorage).toHaveBeenCalled();
    expect(mockStorage.upload).toHaveBeenCalledWith(expect.any(Buffer), 'test.mp4');

    // Verify DB insertion
    expect(prisma.videoAsset.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        originalFileName: 'test.mp4',
        titleFromFileName: 'test',
        storageUrl: 'https://storage.example.com/test.mp4',
        mimeType: 'video/mp4',
        source: 'LOCAL_UPLOAD',
        createdById: 'user-123',
        workspaceId: 'workspace-456',
      }),
    });
  });

  it('should fallback to mock user in dev environment if auth is missing', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const mockUser = { id: 'mock-user', workspaceId: 'mock-workspace' };
    (prisma.user.findFirst as any).mockResolvedValue(mockUser);
    
    const mockCreatedAsset = { id: 'asset-1' };
    (prisma.videoAsset.create as any).mockResolvedValue(mockCreatedAsset);

    const req = createFormDataRequest();
    const response = await POST(req);

    expect(response.status).toBe(201);
    expect(prisma.user.findFirst).toHaveBeenCalled();
    expect(prisma.videoAsset.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        createdById: 'mock-user',
        workspaceId: 'mock-workspace',
      }),
    });
  });

  it('should return 500 if dev fallback fails (no user seeded)', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    (prisma.user.findFirst as any).mockResolvedValue(null);

    const req = createFormDataRequest();
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Please run: npx prisma db seed first');
  });

  it('should handle internal errors gracefully', async () => {
    vi.mocked(getStorage).mockImplementation(() => {
      throw new Error('Storage failure');
    });

    const req = createFormDataRequest();
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Storage failure');
  });
});
