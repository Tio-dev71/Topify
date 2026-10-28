import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import * as XLSX from 'xlsx';
import { POST as parsePOST, OPTIONS as parseOPTIONS } from '@/app/api/content-studio/import/parse/route';
import { POST as savePOST, OPTIONS as saveOPTIONS } from '@/app/api/content-studio/import/save/route';
import { GET as templateGET, OPTIONS as templateOPTIONS } from '@/app/api/content-studio/import/template/route';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => {
  const db = {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    socialAccount: {
      findMany: vi.fn(),
    },
    post: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(async (cb: any) => {
      if (typeof cb === 'function') {
        return cb(db);
      }
      return Promise.all(cb);
    }),
  };
  return { default: db };
});

vi.mock('@/lib/queue', () => ({
  enqueuePublish: vi.fn(),
  schedulePublish: vi.fn(),
}));

vi.mock('@/lib/queue/publisher-service', () => ({
  checkAndPublishDuePosts: vi.fn(),
}));

vi.mock('@/lib/audit-log', () => ({
  recordAuditLog: vi.fn(),
}));

describe('Bulk Import API Routes (F019)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('OPTIONS Preflight Handlers', () => {
    it('returns 204 with CORS headers for /parse, /save, and /template', async () => {
      const parseRes = await parseOPTIONS();
      expect(parseRes.status).toBe(204);
      expect(parseRes.headers.get('Access-Control-Allow-Origin')).toBe('*');

      const saveRes = await saveOPTIONS();
      expect(saveRes.status).toBe(204);
      expect(saveRes.headers.get('Access-Control-Allow-Origin')).toBe('*');

      const templateRes = await templateOPTIONS();
      expect(templateRes.status).toBe(204);
      expect(templateRes.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  describe('GET /api/content-studio/import/template', () => {
    it('returns Excel template buffer with CORS headers', async () => {
      const res = await templateGET();
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('spreadsheetml');
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
      const arrayBuf = await res.arrayBuffer();
      expect(arrayBuf.byteLength).toBeGreaterThan(0);
    });
  });

  describe('POST /api/content-studio/import/parse', () => {
    it('returns 401 when unauthenticated in production', async () => {
      const origEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'production';
      vi.mocked(auth).mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/content-studio/import/parse', {
        method: 'POST',
      });
      const res = await parsePOST(req);
      expect(res.status).toBe(401);

      (process.env as any).NODE_ENV = origEnv;
    });

    it('queries prisma.socialAccount without invalid SocialAccountStatus enum error and parses file', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'usr_1', workspaceId: 'ws_1' },
      } as any);

      // Return valid connected social account
      vi.mocked(prisma.socialAccount.findMany).mockResolvedValue([
        {
          provider: 'FACEBOOK' as any,
          status: 'CONNECTED' as any,
          expiresAt: new Date(Date.now() + 86400000),
          refreshToken: null,
        },
      ] as any);

      // Build sample excel buffer
      const rows = [
        {
          'Tiêu đề': 'Bài đăng mẫu',
          'Nội dung': 'Caption thử nghiệm',
          'Nền tảng': 'FACEBOOK',
        },
      ];
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      // Create mock file & request to avoid undici webidl File mismatch in Node test env
      const mockFile = {
        name: 'test.xlsx',
        arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
      };
      const req = {
        headers: new Headers({ 'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryXYZ' }),
        formData: async () => ({
          get: (key: string) => (key === 'file' ? mockFile : null),
        }),
      } as unknown as NextRequest;

      const res = await parsePOST(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.totalRows).toBe(1);
      expect(json.rows[0].title).toBe('Bài đăng mẫu');
      expect(json.rows[0].isValid).toBe(true);
      expect(json.connectedProviders).toContain('FACEBOOK');
      expect(json.connectedProviders).toContain('META');

      // Verify prisma.socialAccount.findMany was called safely without 'active' enum argument
      expect(prisma.socialAccount.findMany).toHaveBeenCalled();
      const callArgs = vi.mocked(prisma.socialAccount.findMany).mock.calls[0][0];
      if (callArgs?.where?.status) {
        expect(callArgs.where.status).not.toHaveProperty('in', expect.arrayContaining(['active']));
      }
    });

    it('gracefully handles database failure in socialAccount query without crashing with 500', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'usr_1', workspaceId: 'ws_1' },
      } as any);

      // Simulate DB exception (such as enum mismatch or connection timeout)
      vi.mocked(prisma.socialAccount.findMany).mockRejectedValue(
        new Error('Invalid value for argument in. Expected SocialAccountStatus.')
      );

      const rows = [
        {
          'Tiêu đề': 'Bài đăng fallback',
          'Nội dung': 'Vẫn parse bình thường',
          'Nền tảng': 'FACEBOOK',
        },
      ];
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const mockFile = {
        name: 'fallback.xlsx',
        arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
      };
      const req = {
        headers: new Headers({ 'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryXYZ' }),
        formData: async () => ({
          get: (key: string) => (key === 'file' ? mockFile : null),
        }),
      } as unknown as NextRequest;

      // Must NOT throw 500 error, instead parse successfully
      const res = await parsePOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.rows[0].title).toBe('Bài đăng fallback');
    });
  });

  describe('POST /api/content-studio/import/save', () => {
    it('creates posts in database and returns 200 with CORS headers', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'usr_1', workspaceId: 'ws_1' },
      } as any);

      vi.mocked(prisma.socialAccount.findMany).mockResolvedValue([]);
      vi.mocked(prisma.post.create).mockResolvedValue({
        id: 'post_new_1',
        title: 'Bài lưu thành công',
      } as any);

      const req = new NextRequest('http://localhost/api/content-studio/import/save', {
        method: 'POST',
        body: JSON.stringify({
          posts: [
            {
              title: 'Bài lưu thành công',
              caption: 'Caption',
              platforms: ['FACEBOOK_REELS'],
              scheduledAt: 'DRAFT',
            },
          ],
          importAsDraft: true,
        }),
      });

      const res = await savePOST(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.count).toBe(1);
      expect(json.postIds).toContain('post_new_1');
    });
  });
});
