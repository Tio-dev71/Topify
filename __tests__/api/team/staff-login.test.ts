import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as POST_LOGIN } from '@/app/api/auth/login/route';
import { GET as GET_CREDENTIALS, POST as POST_CREDENTIALS } from '@/app/api/team/credentials/route';
import { GET as GET_TEAM, POST as POST_TEAM } from '@/app/api/team/route';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: 'admin_1', email: 'admin@topify.vn', role: 'ADMIN', workspaceId: 'ws_1', name: 'Admin Topify' },
  }),
}));

vi.mock('@/lib/audit-log', () => ({
  recordAuditLog: vi.fn().mockResolvedValue(true),
}));

// In-memory mock tables for User and AllowedEmail
let mockUsers: any[] = [];
let mockAllowedEmails: any[] = [];

vi.mock('@/lib/db', () => ({
  default: {
    user: {
      findUnique: vi.fn().mockImplementation(({ where }: any) => {
        if (where.email) return Promise.resolve(mockUsers.find(u => u.email === where.email) || null);
        if (where.id) return Promise.resolve(mockUsers.find(u => u.id === where.id) || null);
        if (where.licenseKey) return Promise.resolve(mockUsers.find(u => u.licenseKey === where.licenseKey) || null);
        return Promise.resolve(null);
      }),
      create: vi.fn().mockImplementation(({ data }: any) => {
        const user = {
          id: `usr_${Date.now()}_${Math.random()}`,
          email: data.email,
          name: data.name || data.email.split('@')[0],
          role: data.role || 'STAFF',
          workspaceId: data.workspaceId,
          password: data.password,
          licenseKey: data.licenseKey || 'TOP-STAF-TEST',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockUsers.push(user);
        return Promise.resolve(user);
      }),
      update: vi.fn().mockImplementation(({ where, data }: any) => {
        const user = mockUsers.find(u => u.id === where.id || u.email === where.email);
        if (user) {
          Object.assign(user, data, { updatedAt: new Date() });
          return Promise.resolve(user);
        }
        return Promise.resolve({ id: where.id || 'usr_mock', ...data });
      }),
      upsert: vi.fn().mockImplementation(({ where, update, create }: any) => {
        let user = mockUsers.find(u => u.email === where.email);
        if (user) {
          Object.assign(user, update, { updatedAt: new Date() });
        } else {
          user = {
            id: `usr_${Date.now()}_${Math.random()}`,
            email: create.email,
            name: create.name || create.email.split('@')[0],
            role: create.role || 'STAFF',
            workspaceId: create.workspaceId,
            password: create.password,
            licenseKey: create.licenseKey || 'TOP-STAF-TEST',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockUsers.push(user);
        }
        return Promise.resolve(user);
      }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    allowedEmail: {
      findMany: vi.fn().mockImplementation(() => Promise.resolve(mockAllowedEmails)),
      findUnique: vi.fn().mockImplementation(({ where }: any) => {
        return Promise.resolve(mockAllowedEmails.find(a => a.email === where.email) || null);
      }),
      create: vi.fn().mockImplementation(({ data }: any) => {
        const item = {
          id: `allow_${Date.now()}`,
          email: data.email,
          role: data.role || 'STAFF',
          workspaceId: data.workspaceId,
          invitedById: data.invitedById,
          createdAt: new Date(),
          invitedBy: { name: 'Admin', email: 'admin@topify.vn' },
        };
        mockAllowedEmails.push(item);
        return Promise.resolve(item);
      }),
      update: vi.fn().mockImplementation(({ where, data }: any) => {
        const item = mockAllowedEmails.find(a => a.id === where.id || a.email === where.email);
        if (item) Object.assign(item, data);
        return Promise.resolve(item);
      }),
      delete: vi.fn().mockResolvedValue({ id: 'deleted' }),
    },
    workspace: {
      create: vi.fn().mockResolvedValue({ id: 'ws_auto_created', name: 'Auto Workspace' }),
    },
  },
}));

describe('F116/F117 Team Members & Staff Authentication', () => {
  beforeEach(async () => {
    mockUsers = [];
    mockAllowedEmails = [];

    // Prepopulate with a member like minh@topify.vn in AllowedEmail (as in user screenshot)
    mockAllowedEmails.push({
      id: 'allow_minh',
      email: 'minh@topify.vn',
      role: 'STAFF',
      workspaceId: 'ws_1',
      invitedById: 'admin_1',
      createdAt: new Date(),
      invitedBy: { name: 'Admin Topify', email: 'admin@topify.vn' },
    });
  });

  describe('GET /api/team - Auto Provisioning', () => {
    it('automatically ensures members in AllowedEmail have active User accounts with login credentials', async () => {
      const res = await GET_TEAM();
      const body = await res.json();

      expect(body.members).toHaveLength(1);
      expect(body.members[0].email).toBe('minh@topify.vn');
      expect(body.members[0].hasPassword).toBe(true);
      expect(body.members[0].defaultPassword).toBe('Topify@123');
      expect(body.members[0].licenseKey).toMatch(/^TOP-STAF-/);

      // Verify User table was populated
      expect(mockUsers.find(u => u.email === 'minh@topify.vn')).toBeDefined();
    });
  });

  describe('POST /api/auth/login - Email & Password Login', () => {
    it('allows a staff member to login with their email and default password (Topify@123)', async () => {
      // First ensure user is provisioned via GET /api/team
      await GET_TEAM();

      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'minh@topify.vn',
          password: 'Topify@123',
        }),
      });

      const res = await POST_LOGIN(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
      expect(data.user.email).toBe('minh@topify.vn');
      expect(data.user.role).toBe('STAFF');
      expect(data.user.workspaceId).toBe('ws_1');
    });

    it('rejects login when password does not match', async () => {
      await GET_TEAM();

      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'minh@topify.vn',
          password: 'WrongPassword123',
        }),
      });

      const res = await POST_LOGIN(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toContain('Mật khẩu không chính xác');
    });

    it('auto-provisions invited staff on first login attempt if they enter Topify@123', async () => {
      // Create another allowed email without calling GET_TEAM first
      mockAllowedEmails.push({
        id: 'allow_new_staff',
        email: 'hoa@topify.vn',
        role: 'STAFF',
        workspaceId: 'ws_1',
        createdAt: new Date(),
      });

      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'hoa@topify.vn',
          password: 'Topify@123',
        }),
      });

      const res = await POST_LOGIN(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.email).toBe('hoa@topify.vn');
      expect(data.user.workspaceId).toBe('ws_1');
    });
  });

  describe('Team Credentials API (F116/F117)', () => {
    it('allows Admin to fetch member login credentials and license key', async () => {
      await GET_TEAM();

      const req = new NextRequest('http://localhost:3000/api/team/credentials?email=minh@topify.vn', {
        method: 'GET',
      });

      const res = await GET_CREDENTIALS(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.credentials.email).toBe('minh@topify.vn');
      expect(data.credentials.role).toBe('STAFF');
      expect(data.credentials.licenseKey).toBeDefined();
    });

    it('allows Admin to update/reset password for a member and member can immediately login with new password', async () => {
      await GET_TEAM();

      // 1. Admin sets new password
      const resetReq = new NextRequest('http://localhost:3000/api/team/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'minh@topify.vn',
          password: 'NewSecurePassword!2026',
        }),
      });

      const resetRes = await POST_CREDENTIALS(resetReq);
      const resetData = await resetRes.json();

      expect(resetRes.status).toBe(200);
      expect(resetData.success).toBe(true);
      expect(resetData.credentials.password).toBe('NewSecurePassword!2026');

      // 2. Staff member logs in with the new password
      const loginReq = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'minh@topify.vn',
          password: 'NewSecurePassword!2026',
        }),
      });

      const loginRes = await POST_LOGIN(loginReq);
      const loginData = await loginRes.json();

      expect(loginRes.status).toBe(200);
      expect(loginData.success).toBe(true);
      expect(loginData.user.email).toBe('minh@topify.vn');
    });
  });
});

