import { describe, it, expect } from 'vitest';
import { auditContent } from '@/lib/content-studio/audit-engine';

describe('Pre-Publish Content Audit Engine (F078)', () => {
  it('correctly audits minimal/too short caption without link (user scenario: "🔥 abc" with empty link)', () => {
    const result = auditContent('🔥 abc', '');

    expect(result.passCount).toBe(3);
    expect(result.warnCount).toBe(2);
    expect(result.failCount).toBe(1);
    expect(result.score).toBe(55); // 100 - 25 - 10*2 = 55

    // Check spelling/length
    const spellingCheck = result.items.find(i => i.id === 'check_spelling');
    expect(spellingCheck?.status).toBe('FAIL');
    expect(spellingCheck?.recommendation).toContain('Nội dung quá ngắn');

    // Check link & UTM
    const linkCheck = result.items.find(i => i.id === 'check_link');
    expect(linkCheck?.status).toBe('WARN');
    expect(linkCheck?.recommendation).toContain('Chưa phát hiện liên kết đích');

    // Check policy - MUST BE PASS, must NOT falsely mention "giảm giá 50%"
    const policyCheck = result.items.find(i => i.id === 'check_policy');
    expect(policyCheck?.status).toBe('PASS');
    expect(policyCheck?.recommendation).toContain('Nội dung an toàn');
    expect(policyCheck?.recommendation).not.toContain('giảm giá 50%');

    // Check CTA
    const ctaCheck = result.items.find(i => i.id === 'check_cta');
    expect(ctaCheck?.status).toBe('WARN');
    expect(ctaCheck?.recommendation).toContain('chưa có lời kêu gọi hành động');
  });

  it('correctly audits post with valid HTTPS link and full UTM tags', () => {
    const caption =
      'Bí quyết tăng trưởng doanh số đa kênh hiệu quả trong năm 2026. Nhấn vào link bên dưới để nhận tài liệu miễn phí!';
    const link = 'https://topify.vn/growth?utm_source=facebook&utm_medium=post&utm_campaign=q4';

    const result = auditContent(caption, link);

    const linkCheck = result.items.find(i => i.id === 'check_link');
    expect(linkCheck?.status).toBe('PASS');
    expect(linkCheck?.recommendation).toContain('source=facebook');
    expect(linkCheck?.recommendation).toContain('medium=post');

    const spellingCheck = result.items.find(i => i.id === 'check_spelling');
    expect(spellingCheck?.status).toBe('PASS');

    const ctaCheck = result.items.find(i => i.id === 'check_cta');
    expect(ctaCheck?.status).toBe('PASS');

    const policyCheck = result.items.find(i => i.id === 'check_policy');
    expect(policyCheck?.status).toBe('PASS');

    expect(result.score).toBe(100);
    expect(result.failCount).toBe(0);
    expect(result.warnCount).toBe(0);
    expect(result.passCount).toBe(6);
  });

  it('detects policy violations when sensitive words are actually present', () => {
    const caption = 'Cơ hội làm giàu nhanh với lãi suất khủng, cam kết 100% không rủi ro!';
    const result = auditContent(caption, '');

    const policyCheck = result.items.find(i => i.id === 'check_policy');
    expect(policyCheck?.status).toBe('FAIL');
    expect(policyCheck?.recommendation).toContain('làm giàu nhanh');
    expect(policyCheck?.recommendation).toContain('lãi suất khủng');
    expect(policyCheck?.recommendation).toContain('cam kết 100%');
  });

  it('detects discount policy warning only when discount words are present', () => {
    const caption =
      'Siêu bão sale sập sàn chỉ hôm nay! Nhấn vào link để nhận voucher giảm giá 50% ngay!';
    const link = 'https://topify.vn/promo?utm_source=facebook&utm_medium=post';

    const result = auditContent(caption, link);

    const policyCheck = result.items.find(i => i.id === 'check_policy');
    expect(policyCheck?.status).toBe('WARN');
    expect(policyCheck?.recommendation).toContain('giảm giá 50%');
  });

  it('detects link without UTM tags', () => {
    const caption = 'Bài viết hướng dẫn marketing. Nhấn vào website xem chi tiết nhé!';
    const link = 'https://topify.vn/blog/content-marketing';

    const result = auditContent(caption, link);

    const linkCheck = result.items.find(i => i.id === 'check_link');
    expect(linkCheck?.status).toBe('WARN');
    expect(linkCheck?.recommendation).toContain('chưa gắn UTM tracking');
  });

  it('detects invalid URL', () => {
    const caption = 'Bài viết hay này!';
    const link = 'not-a-valid-url';

    const result = auditContent(caption, link);

    const linkCheck = result.items.find(i => i.id === 'check_link');
    expect(linkCheck?.status).toBe('FAIL');
    expect(linkCheck?.recommendation).toContain('không hợp lệ');
  });
});
