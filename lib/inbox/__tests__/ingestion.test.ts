import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ingestInboundMessage } from '../ingestion';
import prisma from '@/lib/db';

vi.mock('@/lib/db', () => {
  return {
    default: {
      message: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      conversation: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      customer: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      socialAccount: {
        findFirst: vi.fn(),
      },
      workspace: {
        findFirst: vi.fn(),
      },
    },
  };
});

describe('Omnichannel Ingestion Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should ignore duplicate message when messageExternalId already exists', async () => {
    vi.mocked(prisma.message.findFirst).mockResolvedValueOnce({
      id: 'msg_existing',
      externalId: 'ext_123',
      conversation: { id: 'conv_123' },
    } as any);

    const result = await ingestInboundMessage({
      platform: 'TELEGRAM',
      channelExternalId: 'test_bot',
      senderId: 'user_456',
      senderName: 'Test User',
      messageExternalId: 'ext_123',
      content: 'Hello duplicate',
    });

    expect(result.success).toBe(true);
    expect(result.isDuplicate).toBe(true);
    expect(result.message.id).toBe('msg_existing');
    expect(prisma.conversation.create).not.toHaveBeenCalled();
  });

  it('should create new conversation, message, and CRM customer for new contact', async () => {
    vi.mocked(prisma.message.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.workspace.findFirst).mockResolvedValueOnce({ id: 'ws_demo' } as any);
    vi.mocked(prisma.conversation.findFirst).mockResolvedValueOnce(null);
    
    vi.mocked(prisma.conversation.create).mockResolvedValueOnce({
      id: 'conv_new_1',
      platform: 'TELEGRAM',
      contactName: 'Nguyen Van A',
      status: 'NEW',
    } as any);

    vi.mocked(prisma.customer.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.customer.create).mockResolvedValueOnce({
      id: 'cust_new_1',
      name: 'Nguyen Van A',
      tags: 'Mới, #telegram',
    } as any);

    vi.mocked(prisma.conversation.update).mockResolvedValueOnce({
      id: 'conv_new_1',
      contactId: 'cust_new_1',
    } as any);

    vi.mocked(prisma.message.create).mockResolvedValueOnce({
      id: 'msg_new_1',
      content: 'Chào shop!',
      direction: 'INBOUND',
      externalId: 'tg_msg_789',
    } as any);

    const result = await ingestInboundMessage({
      platform: 'TELEGRAM',
      channelExternalId: 'topify_bot',
      senderId: 'tg_user_111',
      senderName: 'Nguyen Van A',
      messageExternalId: 'tg_msg_789',
      content: 'Chào shop!',
    });

    expect(result.success).toBe(true);
    expect(result.isDuplicate).toBe(false);
    expect(result.conversation).toBeDefined();
    expect(result.customer).toBeDefined();
    expect(result.customer.id).toBe('cust_new_1');
    expect(result.message.id).toBe('msg_new_1');
    expect(prisma.customer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Nguyen Van A',
          tags: expect.stringContaining('#telegram'),
        }),
      })
    );
  });
});
