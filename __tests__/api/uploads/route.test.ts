import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/uploads/[...path]/route';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    statSync: vi.fn(),
    readFileSync: vi.fn(),
  },
  existsSync: vi.fn(),
  statSync: vi.fn(),
  readFileSync: vi.fn(),
}));

describe('GET /api/uploads/[...path]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.UPLOAD_DIR = './uploads';
  });

  const createGetRequest = () => {
    return new NextRequest('http://localhost:3000/api/uploads/test.mp4', {
      method: 'GET',
    });
  };

  it('should return 403 for directory traversal attempts', async () => {
    const req = createGetRequest();
    const params = Promise.resolve({ path: ['..', '..', 'etc', 'passwd'] });
    
    const response = await GET(req, { params });
    expect(response.status).toBe(403);
    
    const data = await response.json();
    expect(data.error).toBe('Forbidden');
  });

  it('should return 404 if file does not exist', async () => {
    const req = createGetRequest();
    const params = Promise.resolve({ path: ['test.mp4'] });
    
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const response = await GET(req, { params });
    expect(response.status).toBe(404);
  });

  it('should serve file with correct headers if it exists', async () => {
    const req = createGetRequest();
    const params = Promise.resolve({ path: ['test.mp4'] });
    
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({ size: 1024 } as any);
    vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('fake-video-content'));

    const response = await GET(req, { params });
    expect(response.status).toBe(200);
    
    expect(response.headers.get('Content-Type')).toBe('video/mp4');
    expect(response.headers.get('Content-Length')).toBe('1024');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
    
    const blob = await response.blob();
    const text = await blob.text();
    expect(text).toBe('fake-video-content');
  });

  it('should correctly map mime types for webm and mov', async () => {
    const req = createGetRequest();
    
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({ size: 100 } as any);
    vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('content'));

    // Test .webm
    let params = Promise.resolve({ path: ['test.webm'] });
    let response = await GET(req, { params });
    expect(response.headers.get('Content-Type')).toBe('video/webm');

    // Test .mov
    params = Promise.resolve({ path: ['test.mov'] });
    response = await GET(req, { params });
    expect(response.headers.get('Content-Type')).toBe('video/quicktime');
    
    // Test unknown extension
    params = Promise.resolve({ path: ['test.xyz'] });
    response = await GET(req, { params });
    expect(response.headers.get('Content-Type')).toBe('application/octet-stream');
  });

  it('should handle internal errors gracefully', async () => {
    const req = createGetRequest();
    const params = Promise.resolve({ path: ['test.mp4'] });
    
    vi.mocked(fs.existsSync).mockImplementation(() => {
      throw new Error('Disk read error');
    });

    const response = await GET(req, { params });
    expect(response.status).toBe(500);
    
    const data = await response.json();
    expect(data.error).toBe('Failed to serve file');
  });
});
