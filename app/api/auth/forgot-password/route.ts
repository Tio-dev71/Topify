import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/db';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawEmail = body.email?.trim();

    if (!rawEmail) {
      return NextResponse.json({ error: 'Vui lòng nhập địa chỉ email.' }, { status: 400 });
    }

    const email = rawEmail.toLowerCase();

    // 1. Check if user exists in Prisma DB or AllowedEmail
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    const allowed = await prisma.allowedEmail.findUnique({
      where: { email },
    });

    if (!user && !allowed) {
      // Do not reveal email non-existence (security best practice)
      return NextResponse.json({
        success: true,
        message: 'Nếu địa chỉ email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.',
      });
    }

    // 2. Generate secure reset token (valid for 1 hour)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600 * 1000);

    // 3. Save to Prisma PasswordResetToken table
    try {
      await prisma.passwordResetToken.deleteMany({ where: { email } });
      await prisma.passwordResetToken.create({
        data: {
          email,
          token,
          expiresAt,
        },
      });
    } catch (dbErr: any) {
      console.error('[AUTH] Failed to save PasswordResetToken to DB:', dbErr.message);
    }

    const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'https://topify.vn';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    console.log(`[AUTH] 🔑 Password reset link generated for ${email}: ${resetUrl}`);

    // 4. Send email via Supabase Auth (Recovery flow)
    let supabaseSent = false;
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        const { error: sbErr } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${baseUrl}/auth/callback?next=/reset-password`,
        });
        if (!sbErr) {
          supabaseSent = true;
          console.log(`[AUTH] ✅ Supabase recovery email triggered for ${email}`);
        } else {
          console.warn(`[AUTH] Supabase resetPasswordForEmail warning:`, sbErr.message);
        }
      }
    } catch (sbError: any) {
      console.warn(`[AUTH] Supabase recovery exception:`, sbError.message);
    }

    // 5. Send email via Nodemailer SMTP if configured
    let smtpSent = false;
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 465,
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          tls: { rejectUnauthorized: false },
        });

        let sender = process.env.SMTP_FROM || 'Topify <no-reply@topify.vn>';
        // Nếu cấu hình cũ còn dính onboarding@resend.dev thì tự động dùng domain đã verify topify.vn
        if (sender.includes('resend.dev')) {
          sender = 'Topify <no-reply@topify.vn>';
        }
        await transporter.sendMail({
          from: sender,
          to: email,
          subject: 'Đặt lại mật khẩu tài khoản Topify',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="color: #5B3DF5; margin: 0; font-size: 26px; font-weight: 800;">Topify</h2>
                <p style="color: #6b7280; font-size: 13px; margin-top: 4px;">Nền tảng Tự động hóa Đa kênh & Marketing số</p>
              </div>
              <h3 style="color: #111827; margin-bottom: 16px; font-size: 18px;">Yêu cầu đặt lại mật khẩu</h3>
              <p style="color: #374151; line-height: 1.6; font-size: 14px;">
                Chào bạn, chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>${email}</strong>.
              </p>
              <p style="color: #374151; line-height: 1.6; font-size: 14px;">
                Vui lòng bấm vào nút bên dưới để thiết lập mật khẩu mới (liên kết có hiệu lực trong vòng 60 phút):
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" style="background-color: #5B3DF5; color: #ffffff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(91, 61, 245, 0.2);">
                  Đặt Lại Mật Khẩu
                </a>
              </div>
              <p style="color: #6b7280; font-size: 12px; line-height: 1.5;">
                Hoặc copy liên kết sau vào trình duyệt nếu nút bấm không phản hồi:<br />
                <a href="${resetUrl}" style="color: #5B3DF5; word-break: break-all;">${resetUrl}</a>
              </p>
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin-top: 20px;">
                Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email. Mật khẩu của bạn vẫn an toàn và không bị thay đổi.
              </p>
              <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
              <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 0;">
                © 2026 Topify Team • <a href="https://topify.vn" style="color: #5B3DF5; text-decoration: none;">topify.vn</a>
              </p>
            </div>
          `,
        });
        smtpSent = true;
        console.log(`[AUTH] ✅ Nodemailer SMTP sent successfully to ${email}`);
      } catch (smtpErr: any) {
        console.warn(`[AUTH] Nodemailer SMTP send warning:`, smtpErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Đã gửi email hướng dẫn lấy lại mật khẩu. Vui lòng kiểm tra hộp thư của bạn (bao gồm cả thư mục Spam/Quảng cáo).',
      dispatched: Boolean(supabaseSent || smtpSent),
    });
  } catch (error: any) {
    console.error('[AUTH] forgot-password error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi xử lý yêu cầu. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
