import { NextRequest } from 'next/server';
import { GET, POST, DELETE, PATCH } from '@/app/api/tasks/templates/route';
import { describe, it, expect } from 'vitest';

describe('Task Templates API (F130) - /api/tasks/templates', () => {
  describe('GET /api/tasks/templates', () => {
    it('returns built-in templates', async () => {
      const req = new NextRequest('http://localhost/api/tasks/templates');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.templates)).toBe(true);
      expect(data.templates.length).toBeGreaterThanOrEqual(4);
      expect(data.templates.some((t: any) => t.id === 'tpl_content_video')).toBe(true);
    });

    it('filters templates by category', async () => {
      const req = new NextRequest('http://localhost/api/tasks/templates?category=CSKH');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.templates.every((t: any) => t.category === 'CSKH')).toBe(true);
    });
  });

  describe('POST /api/tasks/templates', () => {
    it('validates empty name and returns 400', async () => {
      const req = new NextRequest('http://localhost/api/tasks/templates', {
        method: 'POST',
        body: JSON.stringify({
          name: '',
          steps: [{ title: 'Bước 1' }],
        }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('validates empty steps and returns 400', async () => {
      const req = new NextRequest('http://localhost/api/tasks/templates', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Quy trình mới',
          steps: [],
        }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('successfully creates a custom task template', async () => {
      const req = new NextRequest('http://localhost/api/tasks/templates', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Quy trình Livestream Bán hàng Đa kênh',
          category: 'CUSTOM',
          description: 'Quy trình chuẩn bị kịch bản, kỹ thuật và chốt đơn trong phiên livestream',
          estimatedDays: 2,
          steps: [
            { title: 'Chuẩn bị sản phẩm mồi & Setup phòng live', defaultRole: 'Livestream Host', relativeDueDays: 1 },
            { title: 'Kiểm tra đường truyền OBS & Âm thanh micro', defaultRole: 'Kỹ thuật viên', relativeDueDays: 1 },
            { title: 'Chốt đơn trực tiếp & Bắn mã giảm giá', defaultRole: 'CSKH Staff', relativeDueDays: 2 },
          ],
        }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.template).toBeDefined();
      expect(data.template.name).toBe('Quy trình Livestream Bán hàng Đa kênh');
      expect(data.template.isCustom).toBe(true);
      expect(data.template.steps.length).toBe(3);

      // Verify it appears in GET
      const getReq = new NextRequest('http://localhost/api/tasks/templates');
      const getRes = await GET(getReq);
      const getData = await getRes.json();
      expect(getData.templates.some((t: any) => t.id === data.template.id)).toBe(true);
    });
  });

  describe('DELETE /api/tasks/templates', () => {
    it('prevents deleting built-in templates', async () => {
      const req = new NextRequest('http://localhost/api/tasks/templates?id=tpl_content_video', {
        method: 'DELETE',
      });

      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('mặc định');
    });

    it('allows deleting custom templates', async () => {
      // First create one
      const postReq = new NextRequest('http://localhost/api/tasks/templates', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Quy trình xóa thử nghiệm',
          steps: [{ title: 'Bước tạm' }],
        }),
      });
      const postRes = await POST(postReq);
      const postData = await postRes.json();
      const customId = postData.template.id;

      // Now delete it
      const delReq = new NextRequest(`http://localhost/api/tasks/templates?id=${customId}`, {
        method: 'DELETE',
      });
      const delRes = await DELETE(delReq);
      const delData = await delRes.json();

      expect(delRes.status).toBe(200);
      expect(delData.success).toBe(true);

      // Verify it's gone
      const getReq = new NextRequest('http://localhost/api/tasks/templates');
      const getRes = await GET(getReq);
      const getData = await getRes.json();
      expect(getData.templates.some((t: any) => t.id === customId)).toBe(false);
    });
  });
});
