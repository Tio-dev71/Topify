import { describe, it, expect } from 'vitest';
import { calculateCustomerScore } from '@/lib/crm/scoring-and-duplicates';

describe('M4 CRM Lead Scoring Engine (F100)', () => {
  it('TC-F100-01: Khách chỉ có hồ sơ đầy đủ (Tên, SĐT, Email), 0 tương tác, 0 đơn hàng => Đúng 30đ, COLD (<40đ)', () => {
    const customer = {
      name: 'Nguyễn Minh Anh',
      phone: '09983746222',
      email: 'minhanhnguyen@mail.com',
      notes: '',
      tags: '',
      deals: [],
    };

    const result = calculateCustomerScore(customer);

    expect(result.leadScore).toBe(30);
    expect(result.temperature).toBe('COLD');
    expect(result.breakdown.profileScore).toBe(30);
    expect(result.breakdown.engagementScore).toBe(0);
    expect(result.breakdown.purchaseScore).toBe(0);
    expect(result.breakdown.reasons).toContain('Hồ sơ: Có họ tên khách hàng (+10đ)');
    expect(result.breakdown.reasons).toContain('Hồ sơ: Có số điện thoại liên hệ xác thực (+10đ)');
    expect(result.breakdown.reasons).toContain('Hồ sơ: Có địa chỉ email hợp lệ (+10đ)');
  });

  it('TC-F100-02: Khách có hồ sơ đầy đủ và có tương tác thực tế hỏi mua/hỏi giá => 30 + 30 = 60đ, WARM (40-69đ)', () => {
    const customer = {
      name: 'Trần Thị Thúy Hằng',
      phone: '0977445566',
      email: 'hang.tran@gmail.com',
      notes: 'Đã hỏi tư vấn size đầm hoa nhí và xin tài khoản ngân hàng chuyển khoản.',
      tags: 'Khách lẻ, Tiềm năng',
      deals: [],
    };

    const result = calculateCustomerScore(customer);

    expect(result.leadScore).toBe(60);
    expect(result.temperature).toBe('WARM');
    expect(result.breakdown.profileScore).toBe(30);
    expect(result.breakdown.engagementScore).toBe(30);
    expect(result.breakdown.purchaseScore).toBe(0);
  });

  it('TC-F100-03: Khách có hồ sơ đầy đủ và 1 đơn hàng thành công ("Nguyễn AAA") => 30 + 40 = 70đ, HOT (≥70đ)', () => {
    const customer = {
      name: 'Nguyễn AAA',
      phone: '0182222222',
      email: 'anaa@mail.com',
      notes: '',
      tags: 'Lead',
      deals: [
        {
          id: 'deal_1',
          title: 'Đơn hàng 1',
          value: 3000000,
          status: 'OPEN',
        },
      ],
    };

    const result = calculateCustomerScore(customer);

    expect(result.leadScore).toBe(70);
    expect(result.temperature).toBe('HOT');
    expect(result.breakdown.profileScore).toBe(30);
    expect(result.breakdown.engagementScore).toBe(0);
    expect(result.breakdown.purchaseScore).toBe(40);
    expect(result.dealsCount).toBe(1);
    expect(result.totalDealValue).toBe(3000000);
  });

  it('TC-F100-04: Khách VIP có đầy đủ hồ sơ (30đ), tương tác hỏi mua sỉ (30đ), có đơn thành công (40đ) => 100đ, HOT', () => {
    const customer = {
      name: 'Nguyễn Văn Minh (Khách Sỉ Hà Nội)',
      phone: '0988112233',
      email: 'minh.nguyen@sihanoi.vn',
      notes: 'Khách hỏi mua số lượng lớn 100 áo gió, cần báo giá sỉ gấp trong tuần này.',
      tags: 'Khách sỉ, VIP, Miền Bắc',
      deals: [
        { id: 'deal_1', value: 15000000, status: 'WON' },
        { id: 'deal_2', value: 15000000, status: 'OPEN' },
      ],
    };

    const result = calculateCustomerScore(customer);

    expect(result.leadScore).toBe(100);
    expect(result.temperature).toBe('HOT');
    expect(result.breakdown.profileScore).toBe(30);
    expect(result.breakdown.engagementScore).toBe(30);
    expect(result.breakdown.purchaseScore).toBe(40);
  });

  it('Khách có ghi chú nhưng không hỏi mua/hỏi giá ("Lê Hoàng Long": chưa có tương tác lại) => 30đ, COLD', () => {
    const customer = {
      name: 'Lê Hoàng Long',
      phone: '0912998877',
      email: 'long.le@gmail.com',
      notes: 'Khách đã từng mua 1 lần cách đây 2 tháng, chưa có tương tác lại.',
      tags: 'Chưa chốt',
      deals: [],
    };

    const result = calculateCustomerScore(customer);

    expect(result.leadScore).toBe(30);
    expect(result.temperature).toBe('COLD');
    expect(result.breakdown.engagementScore).toBe(0);
    expect(result.breakdown.purchaseScore).toBe(0);
  });

  it('Khách có tương tác qua hội thoại hộp thư (Inbox) => +30đ tương tác', () => {
    const customer = {
      name: 'Trần Văn B',
      phone: '0912345678',
      email: 'b@gmail.com',
      notes: '',
      tags: '',
    };

    const relatedData = {
      conversations: [
        {
          id: 'conv_1',
          lastMessageAt: new Date(),
          messages: [{ id: 'm1', content: 'Shop ơi áo này còn size L không?' }],
        },
      ],
    };

    const result = calculateCustomerScore(customer, relatedData);

    expect(result.leadScore).toBe(60);
    expect(result.temperature).toBe('WARM');
    expect(result.breakdown.engagementScore).toBe(30);
  });

  it('Khách thiếu Email (chỉ có Tên + SĐT) và không tương tác => 10 + 10 = 20đ, COLD', () => {
    const customer = {
      name: 'Lê Văn C',
      phone: '0987654321',
      email: '',
      notes: '',
      tags: '',
    };

    const result = calculateCustomerScore(customer);

    expect(result.leadScore).toBe(20);
    expect(result.temperature).toBe('COLD');
    expect(result.breakdown.profileScore).toBe(20);
  });

  it('Kiểm tra chính xác ngưỡng phân hạng nhiệt độ: HOT (≥70), WARM (40-69), COLD (<40)', () => {
    // 39đ => COLD
    // Hồ sơ: Tên (10) + SĐT (10) + Email (10) = 30đ => COLD
    expect(
      calculateCustomerScore({ name: 'A', phone: '0912345678', email: 'a@mail.com' }).temperature
    ).toBe('COLD');

    // 40đ => WARM (Ví dụ có đơn hàng 40đ nhưng chưa có hồ sơ)
    expect(
      calculateCustomerScore(
        { name: '', phone: '', email: '' },
        { deals: [{ id: 'd1', value: 100, status: 'WON' }] }
      ).temperature
    ).toBe('WARM');

    // 60đ => WARM (Hồ sơ 30đ + Tương tác 30đ)
    expect(
      calculateCustomerScore({
        name: 'A',
        phone: '0912345678',
        email: 'a@mail.com',
        notes: 'tư vấn giá sỉ',
      }).temperature
    ).toBe('WARM');

    // 70đ => HOT (Hồ sơ 30đ + Đơn hàng 40đ)
    expect(
      calculateCustomerScore(
        { name: 'A', phone: '0912345678', email: 'a@mail.com' },
        { deals: [{ id: 'd1', value: 100, status: 'WON' }] }
      ).temperature
    ).toBe('HOT');
  });
});
