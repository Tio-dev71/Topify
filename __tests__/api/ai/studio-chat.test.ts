import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { topifyAiStore } from '@/lib/ai/topify-ai-engine';

describe('Topify AI Studio Chat API & Persona Engine (F156)', () => {
  it('should fetch all sessions and 4 default personas via GET', async () => {
    const { GET } = await import('@/app/api/ai/studio/chat/route');
    const req = new NextRequest('http://localhost:3000/api/ai/studio/chat');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.sessions).toBeDefined();
    expect(data.sessions.length).toBeGreaterThanOrEqual(1);

    expect(data.personas).toBeDefined();
    expect(data.personas.length).toBeGreaterThanOrEqual(4);

    const autoTech = data.personas.find((p: any) => p.id === 'AUTO_TECH');
    expect(autoTech).toBeDefined();
    expect(autoTech.name).toContain('Kỹ Thuật Viên Tự Động Hóa');

    const strategist = data.personas.find((p: any) => p.id === 'MARKETING_STRATEGIST');
    expect(strategist).toBeDefined();
    expect(strategist.name).toContain('Chiến Lược Gia Marketing');
  });

  it('should create a new session for AUTO_TECH persona', async () => {
    const { POST } = await import('@/app/api/ai/studio/chat/route');
    const req = {
      json: async () => ({
        action: 'create_session',
        title: 'Tư vấn Kỹ Thuật Viên Tự Động Hóa',
        persona: 'AUTO_TECH',
      }),
    } as any;

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.session).toBeDefined();
    expect(data.session.title).toBe('Tư vấn Kỹ Thuật Viên Tự Động Hóa');
    expect(data.session.persona).toBe('AUTO_TECH');
    expect(data.session.personaName).toBe('Kỹ Thuật Viên Tự Động Hóa');
    expect(data.session.messages.length).toBeGreaterThanOrEqual(1);
    expect(data.session.messages[0].role).toBe('assistant');
  });

  it('should update an existing session persona and systemPrompt via update_session action', async () => {
    const { POST } = await import('@/app/api/ai/studio/chat/route');

    // First create a session with MARKETING_STRATEGIST
    const createReq = {
      json: async () => ({
        action: 'create_session',
        title: 'Phiên thảo luận ban đầu',
        persona: 'MARKETING_STRATEGIST',
      }),
    } as any;
    const createRes = await POST(createReq);
    const createData = await createRes.json();
    const sessionId = createData.session.id;

    expect(createData.session.persona).toBe('MARKETING_STRATEGIST');

    // Now update persona to AUTO_TECH
    const updateReq = {
      json: async () => ({
        action: 'update_session',
        sessionId,
        persona: 'AUTO_TECH',
        title: 'Tư vấn Kỹ Thuật Viên Tự Động Hóa',
      }),
    } as any;

    const updateRes = await POST(updateReq);
    const updateData = await updateRes.json();

    expect(updateRes.status).toBe(200);
    expect(updateData.session).toBeDefined();
    expect(updateData.session.id).toBe(sessionId);
    expect(updateData.session.persona).toBe('AUTO_TECH');
    expect(updateData.session.personaName).toBe('Kỹ Thuật Viên Tự Động Hóa');
    expect(updateData.session.title).toBe('Tư vấn Kỹ Thuật Viên Tự Động Hóa');

    // Verify session in store matches updated values
    const stored = topifyAiStore.getSessionById(sessionId);
    expect(stored?.persona).toBe('AUTO_TECH');
    expect(stored?.personaName).toBe('Kỹ Thuật Viên Tự Động Hóa');
  });

  it('should send a message and receive response according to updated persona', async () => {
    const { POST } = await import('@/app/api/ai/studio/chat/route');

    const createReq = {
      json: async () => ({
        action: 'create_session',
        title: 'Kịch bản Webhook',
        persona: 'AUTO_TECH',
      }),
    } as any;
    const createRes = await POST(createReq);
    const { session } = await createRes.json();

    const msgReq = {
      json: async () => ({
        action: 'send_message',
        sessionId: session.id,
        message: 'Làm sao để cấu hình Webhook nhận đơn hàng mới?',
      }),
    } as any;

    const msgRes = await POST(msgReq);
    const msgData = await msgRes.json();

    expect(msgRes.status).toBe(200);
    expect(msgData.reply).toBeDefined();
    expect(msgData.reply.role).toBe('assistant');
    expect(msgData.reply.content.length).toBeGreaterThan(10);
    expect(msgData.session.messages.length).toBeGreaterThanOrEqual(3);
  });
});
