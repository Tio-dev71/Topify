import { NextRequest, NextResponse } from 'next/server';
import { topifyAiStore } from '@/lib/ai/topify-ai-engine';
import { securityEngineStore } from '@/lib/security/security-engine';
import { auth } from '@/lib/auth';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'ToolAutoTop123456789!@#LongSecretString123';

async function getAuthRole(req: NextRequest): Promise<string> {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7).trim();
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded?.role) return decoded.role;
    } catch {}
  }
  try {
    const session = await auth();
    if (session?.user?.role) return session.user.role;
  } catch {}
  return 'STAFF';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      const session = topifyAiStore.getSessionById(sessionId);
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      return NextResponse.json({ session });
    }

    const sessions = topifyAiStore.getSessions();
    const personas = topifyAiStore.getPersonas();
    return NextResponse.json({ sessions, personas });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userRole = await getAuthRole(req);
    if (!securityEngineStore.hasPermission(userRole, 'automation.manage')) {
      return NextResponse.json({
        error: 'Tài khoản của bạn (Nhân viên) chưa được cấp quyền sử dụng AI Studio theo Ma Trận Phân Quyền RBAC.',
      }, { status: 403 });
    }

    const body = await req.json();
    const { action, sessionId, title, persona, message, systemPrompt, name, emoji, description, welcomeMessage, createdBy, personaId } = body;

    if (action === 'create_session') {
      const newSession = topifyAiStore.createSession(title, persona, systemPrompt);
      return NextResponse.json({ session: newSession });
    }

    if (action === 'update_session') {
      if (!sessionId) {
        return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
      }
      const updated = topifyAiStore.updateSession(sessionId, { title, persona, systemPrompt });
      if (!updated) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      return NextResponse.json({ session: updated, sessions: topifyAiStore.getSessions() });
    }

    if (action === 'get_personas') {
      return NextResponse.json({ personas: topifyAiStore.getPersonas() });
    }

    if (action === 'create_persona') {
      if (!name || !systemPrompt) {
        return NextResponse.json({ error: 'Tên vai trò và prompt đào tạo là bắt buộc' }, { status: 400 });
      }
      const newPersona = topifyAiStore.createPersona({
        name,
        emoji,
        description,
        systemPrompt,
        welcomeMessage,
        createdBy,
      });
      return NextResponse.json({ persona: newPersona, personas: topifyAiStore.getPersonas() });
    }

    if (action === 'update_persona' || action === 'edit_persona') {
      const targetId = personaId || body.id;
      if (!targetId) {
        return NextResponse.json({ error: 'personaId is required' }, { status: 400 });
      }
      const updatedPersona = topifyAiStore.updatePersona(targetId, {
        name,
        emoji,
        description,
        systemPrompt,
        welcomeMessage,
      });
      return NextResponse.json({ persona: updatedPersona, personas: topifyAiStore.getPersonas() });
    }

    if (action === 'delete_persona') {
      if (!personaId) {
        return NextResponse.json({ error: 'personaId is required' }, { status: 400 });
      }
      const success = topifyAiStore.deletePersona(personaId);
      return NextResponse.json({ success, personas: topifyAiStore.getPersonas() });
    }

    if (action === 'send_message' || (!action && sessionId && message)) {
      if (!sessionId || !message) {
        return NextResponse.json({ error: 'sessionId and message are required' }, { status: 400 });
      }
      const reply = await topifyAiStore.sendMessage(sessionId, message);
      const session = topifyAiStore.getSessionById(sessionId);
      return NextResponse.json({ reply, session });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process chat message' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userRole = await getAuthRole(req);
    if (!securityEngineStore.hasPermission(userRole, 'automation.manage')) {
      return NextResponse.json({
        error: 'Tài khoản của bạn (Nhân viên) chưa được cấp quyền xóa phiên AI theo Ma Trận Phân Quyền RBAC.',
      }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }
    const success = topifyAiStore.deleteSession(sessionId);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete session' }, { status: 500 });
  }
}
