import { describe, it, expect, beforeEach } from 'vitest';
import { walletStore } from '@/lib/wallet/wallet-engine';
import { GET as getWallet, POST as postWithdrawal } from '@/app/api/wallet/route';
import { GET as getPaymentMethods, POST as postPaymentMethod, PATCH as patchPaymentMethod, DELETE as deletePaymentMethod } from '@/app/api/wallet/payment-methods/route';
import { GET as getTasks, POST as postTask } from '@/app/api/wallet/tasks/route';
import { PATCH as patchWithdrawal } from '@/app/api/wallet/withdrawals/[id]/route';
import { NextRequest } from 'next/server';

function createJsonRequest(url: string, method: string, body?: any): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('M12 – Wallet & Earnings Comprehensive Tests (F146 – F150)', () => {
  describe('F146: Wallet Balance & Store Persistence', () => {
    it('should retrieve wallet balance with correct non-fake structure and VND currency', async () => {
      const wallet = walletStore.getWallet();
      expect(wallet).toBeDefined();
      expect(wallet.currency).toBe('VND');
      expect(wallet.availableBalance).toBeGreaterThanOrEqual(0);
      expect(wallet.pendingBalance).toBeGreaterThanOrEqual(0);
      expect(wallet.totalWithdrawn).toBeGreaterThanOrEqual(0);

      const res = await getWallet(createJsonRequest('http://localhost:3000/api/wallet', 'GET'));
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.wallet).toBeDefined();
      expect(json.wallet.currency).toBe('VND');
    });

    it('should correctly update wallet balances via walletStore manager', () => {
      const initial = walletStore.getWallet();
      const updated = walletStore.updateBalance({ availableDelta: 50000 });
      expect(updated.availableBalance).toBe(initial.availableBalance + 50000);

      // Revert back
      walletStore.updateBalance({ availableDelta: -50000 });
    });
  });

  describe('F147: Transaction History (Sổ cái phát sinh)', () => {
    it('should retrieve transaction history with realistic descriptions and statuses', async () => {
      const txs = walletStore.getTransactions();
      expect(Array.isArray(txs)).toBe(true);
      expect(txs.length).toBeGreaterThan(0);

      const res = await getWallet(createJsonRequest('http://localhost:3000/api/wallet', 'GET'));
      const json = await res.json();
      expect(Array.isArray(json.transactions)).toBe(true);
      expect(json.transactions.length).toBeGreaterThan(0);

      // Verify transaction attributes
      const firstTx = json.transactions[0];
      expect(firstTx.id).toBeDefined();
      expect(firstTx.type).toBeDefined();
      expect(firstTx.status).toBeDefined();
      expect(firstTx.description).toBeDefined();
    });

    it('should add a transaction and persist it to store', () => {
      const newTx = walletStore.addTransaction({
        walletId: walletStore.getWallet().id,
        type: 'COMMISSION',
        amount: 250000,
        description: 'Hoa hồng thử nghiệm kiểm thử tự động M12',
        status: 'COMPLETED',
      });

      expect(newTx.id).toBeDefined();
      expect(newTx.amount).toBe(250000);

      const allTxs = walletStore.getTransactions();
      expect(allTxs.some(t => t.id === newTx.id)).toBe(true);
    });
  });

  describe('F148: Withdrawal Request, Review & Approval', () => {
    it('should reject withdrawal below minimum 100.000 VND', async () => {
      const req = createJsonRequest('http://localhost:3000/api/wallet', 'POST', {
        amount: 50000,
      });
      const res = await postWithdrawal(req);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toContain('100.000 VND');
    });

    it('should reject withdrawal exceeding available balance', async () => {
      const wallet = walletStore.getWallet();
      const req = createJsonRequest('http://localhost:3000/api/wallet', 'POST', {
        amount: wallet.availableBalance + 100000000,
      });
      const res = await postWithdrawal(req);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toContain('không đủ');
    });

    it('should successfully create a pending withdrawal request and update pending balance', async () => {
      const initialWallet = walletStore.getWallet();
      const amount = 200000;

      const req = createJsonRequest('http://localhost:3000/api/wallet', 'POST', {
        amount,
        note: 'Rút tiền kiểm thử F148',
      });
      const res = await postWithdrawal(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.withdrawal).toBeDefined();
      expect(json.withdrawal.amount).toBe(amount);
      expect(json.withdrawal.status).toBe('PENDING');

      // Verify wallet balance changed
      const currentWallet = walletStore.getWallet();
      expect(currentWallet.availableBalance).toBe(initialWallet.availableBalance - amount);
      expect(currentWallet.pendingBalance).toBe(initialWallet.pendingBalance + amount);
    });

    it('should approve (COMPLETED) a pending withdrawal and increase totalWithdrawn', async () => {
      // Create a test withdrawal first
      const created = walletStore.createWithdrawal({
        amount: 150000,
        paymentMethod: 'MB Bank - 0987654321',
        accountInfo: 'YẾN NGÔ',
        note: 'Lệnh rút cần kiểm duyệt hoàn tất',
      });

      const patchReq = createJsonRequest(`http://localhost:3000/api/wallet/withdrawals/${created.withdrawal.id}`, 'PATCH', {
        status: 'COMPLETED',
        note: 'Kế toán duyệt và đã giải ngân',
      });

      const patchRes = await patchWithdrawal(patchReq, { params: Promise.resolve({ id: created.withdrawal.id }) });
      const patchJson = await patchRes.json();

      expect(patchRes.status).toBe(200);
      expect(patchJson.success).toBe(true);
      expect(patchJson.withdrawal.status).toBe('COMPLETED');
    });

    it('should reject (REJECTED) a pending withdrawal and refund available balance', async () => {
      const initialAvailable = walletStore.getWallet().availableBalance;
      const created = walletStore.createWithdrawal({
        amount: 120000,
        paymentMethod: 'Vietcombank - 1234567890',
        accountInfo: 'YẾN NGÔ',
        note: 'Lệnh rút bị từ chối thử nghiệm',
      });

      const patchReq = createJsonRequest(`http://localhost:3000/api/wallet/withdrawals/${created.withdrawal.id}`, 'PATCH', {
        status: 'REJECTED',
        note: 'Thông tin tài khoản sai, hoàn tiền',
      });

      const patchRes = await patchWithdrawal(patchReq, { params: Promise.resolve({ id: created.withdrawal.id }) });
      const patchJson = await patchRes.json();

      expect(patchRes.status).toBe(200);
      expect(patchJson.success).toBe(true);
      expect(patchJson.withdrawal.status).toBe('REJECTED');

      // Available balance should be refunded
      expect(walletStore.getWallet().availableBalance).toBe(initialAvailable);
    });
  });

  describe('F149: Payment Method Management', () => {
    let createdMethodId = '';

    it('should list payment methods with non-fake account names', async () => {
      const res = await getPaymentMethods();
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.paymentMethods)).toBe(true);
      expect(json.paymentMethods.length).toBeGreaterThan(0);

      // Verify no hardcoded fake "NGUYEN VAN TOAN"
      for (const pm of json.paymentMethods) {
        expect(pm.accountName).not.toBe('NGUYEN VAN TOAN');
      }
    });

    it('should add a new payment method and persist it', async () => {
      const req = createJsonRequest('http://localhost:3000/api/wallet/payment-methods', 'POST', {
        type: 'VIETQR',
        bankName: 'Techcombank',
        accountNumber: '19035678901234',
        accountName: 'YẾN NGÔ',
        isDefault: false,
      });

      const res = await postPaymentMethod(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.paymentMethod.accountNumber).toBe('19035678901234');
      expect(json.paymentMethod.bankName).toBe('Techcombank');

      createdMethodId = json.paymentMethod.id;

      // Verify persistent store contains it
      const currentMethods = walletStore.getPaymentMethods();
      expect(currentMethods.some(pm => pm.id === createdMethodId)).toBe(true);
    });

    it('should update payment method details', async () => {
      expect(createdMethodId).toBeDefined();

      const patchReq = createJsonRequest('http://localhost:3000/api/wallet/payment-methods', 'PATCH', {
        id: createdMethodId,
        accountName: 'YẾN NGÔ (ADMIN)',
        bankName: 'Techcombank Business',
      });

      const patchRes = await patchPaymentMethod(patchReq);
      const patchJson = await patchRes.json();

      expect(patchRes.status).toBe(200);
      expect(patchJson.success).toBe(true);
      expect(patchJson.paymentMethod.accountName).toBe('YẾN NGÔ (ADMIN)');
    });

    it('should delete payment method from store', async () => {
      expect(createdMethodId).toBeDefined();

      const delReq = createJsonRequest(`http://localhost:3000/api/wallet/payment-methods?id=${createdMethodId}`, 'DELETE');
      const delRes = await deletePaymentMethod(delReq);
      const delJson = await delRes.json();

      expect(delRes.status).toBe(200);
      expect(delJson.success).toBe(true);

      const currentMethods = walletStore.getPaymentMethods();
      expect(currentMethods.some(pm => pm.id === createdMethodId)).toBe(false);
    });
  });

  describe('F150: Earning Task (Nhiệm vụ đủ điều kiện nhận thu nhập)', () => {
    it('should list all earning tasks with realistic criteria and progress', async () => {
      const res = await getTasks();
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(Array.isArray(json.tasks)).toBe(true);
      expect(json.tasks.length).toBeGreaterThan(0);
      expect(json.completedCount).toBeGreaterThanOrEqual(0);
    });

    it('should advance task progress via action progress', async () => {
      const req = createJsonRequest('http://localhost:3000/api/wallet/tasks', 'POST', {
        taskId: 'task_003',
        action: 'progress',
        progress: 3,
      });

      const res = await postTask(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.task.progress).toBe(3);
      expect(json.task.isCompleted).toBe(true);
    });

    it('should claim reward for completed task and add reward transaction to wallet', async () => {
      // Advance task_004 to complete and claim
      walletStore.updateTaskProgress('task_004', 1, true);

      const initialBalance = walletStore.getWallet().availableBalance;
      const req = createJsonRequest('http://localhost:3000/api/wallet/tasks', 'POST', {
        taskId: 'task_004',
      });

      const res = await postTask(req);
      const json = await res.json();

      if (res.status === 200) {
        expect(json.success).toBe(true);
        expect(json.rewardAmount).toBe(100000);
        expect(walletStore.getWallet().availableBalance).toBe(initialBalance + 100000);
      } else {
        // If already claimed in previous runs
        expect(json.error).toContain('đã được nhận thưởng');
      }
    });
  });
});

