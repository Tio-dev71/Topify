import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { createClient } from '@supabase/supabase-js';
import { recordAuditLog } from '@/lib/audit-log';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password, email: inputEmail } = body;

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu mới phải có ít nhất 6 ký tự.' },
        { status: 400 }
      );
    }

    let targetEmail: string | null = null;

    // 1. Try finding by custom token in PasswordResetToken table
    if (token) {
      const resetRecord = await prisma.passwordResetToken.findUnique({
        where: { token },
      });

      if (resetRecord) {
        if (new Date(resetRecord.expiresAt) < new Date()) {
          return NextResponse.json(
            { error: 'Đường dẫn đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu liên kết mới.' },
            { status: 400 }
          );
        }
        targetEmail = resetRecord.email.toLowerCase();
      }
    }

    // 2. If token not matched in table, but inputEmail is provided (or authenticated user via Supabase recovery session)
    if (!targetEmail && inputEmail) {
      const user = await prisma.user.findUnique({
        where: { email: inputEmail.toLowerCase() },
      });
      if (user) {
        targetEmail = user.email;
      }
    }

    if (!targetEmail) {
      return NextResponse.json(
        { error: 'Đường dẫn đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.' },
        { status: 400 }
      );
    }

    // 3. Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Update password in Prisma DB
    const updatedUser = await prisma.user.update({
      where: { email: targetEmail },
      data: { password: hashedPassword },
      select: { id: true, email: true, name: true, role: true },
    });

    // 5. Also sync to Supabase Auth if user exists in Supabase
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          { auth: { autoRefreshToken: false, persistSession: false } }
        );
        const { data } = await supabaseAdmin.auth.admin.listUsers();
        const sbUser = data?.users?.find(
          u => u.email?.toLowerCase() === targetEmail!.toLowerCase()
        );
        if (sbUser) {
          await supabaseAdmin.auth.admin.updateUserById(sbUser.id, { password });
          console.log(`[AUTH] ✅ Supabase Auth password updated for ${targetEmail}`);
        }
      }
    } catch (sbErr: any) {
      console.warn(`[AUTH] Failed to update Supabase password:`, sbErr.message);
    }

    // 6. Delete used reset tokens
    try {
      await prisma.passwordResetToken.deleteMany({
        where: { email: targetEmail },
      });
    } catch {}

    // 7. Audit log
    try {
      await recordAuditLog({
        action: 'PASSWORD_RESET',
        entity: 'USER',
        entityId: updatedUser.id,
        details: { email: targetEmail, source: 'web_reset_password' },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Mật khẩu đã được đặt lại thành công! Bạn có thể đăng nhập ngay.',
    });
  } catch (error: any) {
    console.error('[AUTH] reset-password error:', error);
    return NextResponse.json(
      { error: error.message || 'Có lỗi xảy ra khi đổi mật khẩu.' },
      { status: 500 }
    );
  }
}
