import { useState, useEffect } from 'react';
import { 
  Wallet, 
  ArrowDownToLine, 
  ArrowUpRight, 
  CreditCard, 
  TrendingUp, 
  ShieldAlert, 
  Gift, 
  Copy, 
  Check, 
  Share2, 
  QrCode, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2, 
  Sparkles, 
  Filter, 
  Search, 
  Plus,
  RefreshCw,
  Users,
  Eye,
  Trash2,
  Edit3,
  X,
  AlertCircle
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/axios';
import { toast } from 'sonner';

interface WalletEarningsProps {
  defaultTab?: 'balance' | 'transactions' | 'payment_methods' | 'tasks' | 'referral';
}

export default function WalletEarnings({ defaultTab }: WalletEarningsProps = {}) {
  const [searchParams] = useSearchParams();
  const queryTab = searchParams.get('tab') as any;
  const [activeTab, setActiveTab] = useState<'balance' | 'transactions' | 'payment_methods' | 'tasks' | 'referral'>(
    defaultTab || (queryTab && ['balance', 'transactions', 'payment_methods', 'tasks', 'referral'].includes(queryTab) ? queryTab : 'balance')
  );
  const [loading, setLoading] = useState(true);

  // Wallet State (F146, F147, F148)
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  // Modals State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [withdrawNote, setWithdrawNote] = useState('');
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  const [showAddMethodModal, setShowAddMethodModal] = useState(false);
  const [newMethodType, setNewMethodType] = useState('VIETQR');
  const [newAccountName, setNewAccountName] = useState('YẾN NGÔ');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newBankName, setNewBankName] = useState('MB Bank');

  // Edit Payment Method Modal
  const [editingMethod, setEditingMethod] = useState<any | null>(null);
  const [editMethodType, setEditMethodType] = useState('VIETQR');
  const [editAccountName, setEditAccountName] = useState('');
  const [editAccountNumber, setEditAccountNumber] = useState('');
  const [editBankName, setEditBankName] = useState('MB Bank');

  // Transactions Filter & Search (F147)
  const [txFilterType, setTxFilterType] = useState<string>('ALL');
  const [txSearchQuery, setTxSearchQuery] = useState<string>('');

  // Earning Tasks State (F150)
  const [earningTasks, setEarningTasks] = useState<any[]>([]);
  const [claimingTaskId, setClaimingTaskId] = useState<string | null>(null);

  // Referral State (F151 - F155)
  const [referralProfile, setReferralProfile] = useState<any>(null);
  const [referredUsers, setReferredUsers] = useState<any[]>([]);
  const [commissionRules, setCommissionRules] = useState<any[]>([]);
  const [commissionHistory, setCommissionHistory] = useState<any[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<any[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [scanningFraud, setScanningFraud] = useState(false);

  // Referral Modals & Action States (F151 - F155)
  const [showCustomCodeModal, setShowCustomCodeModal] = useState(false);
  const [customCodeInput, setCustomCodeInput] = useState('');
  const [savingCode, setSavingCode] = useState(false);

  const [showSimulateUserModal, setShowSimulateUserModal] = useState(false);
  const [simName, setSimName] = useState('');
  const [simEmail, setSimEmail] = useState('');
  const [simPlan, setSimPlan] = useState<'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE'>('PRO');
  const [simStatus, setSimStatus] = useState<'TRIAL' | 'ACTIVE_PAID'>('ACTIVE_PAID');
  const [simulatingUser, setSimulatingUser] = useState(false);

  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [ruleForm, setRuleForm] = useState({
    planName: '',
    firstMonthRate: 20,
    recurringRate: 10,
    cookieDays: 60,
    payoutSchedule: 'Ngày 15 hàng tháng',
    description: '',
  });
  const [savingRule, setSavingRule] = useState(false);

  const [commissionFilter, setCommissionFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'PAID'>('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchWalletData();
    fetchTasks();
    fetchReferralData();
    fetchCommissionData();
    fetchFraudAlerts();
  }, []);

  const getClaimedLocalTaskIds = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem('topify_claimed_task_ids') || '[]');
    } catch {
      return [];
    }
  };

  const getLocalBalanceOffset = (): number => {
    try {
      return Number(localStorage.getItem('topify_wallet_balance_offset') || 0);
    } catch {
      return 0;
    }
  };

  const getLocalTransactions = (): any[] => {
    try {
      return JSON.parse(localStorage.getItem('topify_local_transactions') || '[]');
    } catch {
      return [];
    }
  };

  const getLocalWithdrawals = (): any[] => {
    try {
      return JSON.parse(localStorage.getItem('topify_local_withdrawals') || '[]');
    } catch {
      return [];
    }
  };

  const getLocalPaymentMethods = (): any[] => {
    try {
      return JSON.parse(localStorage.getItem('topify_payment_methods') || '[]');
    } catch {
      return [];
    }
  };

  const getLocalReferralProfile = (): any => {
    try {
      const stored = localStorage.getItem('topify_referral_profile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const getLocalReferredUsers = (): any[] => {
    try {
      return JSON.parse(localStorage.getItem('topify_referred_users') || '[]');
    } catch {
      return [];
    }
  };

  const getLocalCommissionRules = (): any[] => {
    try {
      return JSON.parse(localStorage.getItem('topify_commission_rules') || '[]');
    } catch {
      return [];
    }
  };

  const getLocalCommissionHistory = (): any[] => {
    try {
      return JSON.parse(localStorage.getItem('topify_commission_history') || '[]');
    } catch {
      return [];
    }
  };

  const getLocalFraudAlerts = (): any[] => {
    try {
      return JSON.parse(localStorage.getItem('topify_fraud_alerts') || '[]');
    } catch {
      return [];
    }
  };

  const fetchWalletData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get('/wallet');
      if (res.data) {
        const localOffset = getLocalBalanceOffset();
        const baseWallet = res.data.wallet || { availableBalance: 4850000, pendingBalance: 0, totalWithdrawn: 0 };
        setWallet({
          ...baseWallet,
          availableBalance: Math.max(0, (baseWallet.availableBalance || 0) + localOffset),
        });

        const localTxs = getLocalTransactions();
        const serverTxs = res.data.transactions || [];
        const mergedTxs = [...localTxs, ...serverTxs.filter((st: any) => !localTxs.some((lt: any) => lt.id === st.id))];
        setTransactions(mergedTxs);

        const localWds = getLocalWithdrawals();
        const serverWds = res.data.withdrawals || [];
        const mergedWds = [...localWds, ...serverWds.filter((sw: any) => !localWds.some((lw: any) => lw.id === sw.id))];
        setWithdrawals(mergedWds);

        const localPms = getLocalPaymentMethods();
        const serverPms = res.data.paymentMethods || [];
        const mergedPms = localPms.length > 0
          ? [...localPms, ...serverPms.filter((sp: any) => !localPms.some((lp: any) => lp.id === sp.id))]
          : serverPms;
        setPaymentMethods(mergedPms);
        if (mergedPms?.length > 0) {
          const defaultPm = mergedPms.find((p: any) => p.isDefault) || mergedPms[0];
          setSelectedMethodId(defaultPm.id);
        }
      }
    } catch (e) {
      console.error(e);
      if (!silent) toast.error('Không thể tải thông tin ví');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await api.get('/wallet/tasks');
      if (res.data?.tasks) {
        const localClaimed = getClaimedLocalTaskIds();
        const enriched = res.data.tasks.map((t: any) => ({
          ...t,
          isClaimed: t.isClaimed || localClaimed.includes(t.id),
        }));
        setEarningTasks(enriched);
      }
    } catch (e) {}
  };

  const fetchReferralData = async () => {
    try {
      const localProfile = getLocalReferralProfile();
      if (localProfile) setReferralProfile(localProfile);
      const localUsers = getLocalReferredUsers();
      if (localUsers.length > 0) setReferredUsers(localUsers);

      const res = await api.get('/referral');
      if (res.data) {
        const mergedProfile = { ...(res.data.profile || {}), ...(localProfile || {}) };
        setReferralProfile(mergedProfile);
        localStorage.setItem('topify_referral_profile', JSON.stringify(mergedProfile));

        const serverUsers = res.data.referredUsers || [];
        const mergedUsers = localUsers.length > 0
          ? [...localUsers, ...serverUsers.filter((su: any) => !localUsers.some((lu: any) => lu.id === su.id))]
          : serverUsers;
        setReferredUsers(mergedUsers);
        localStorage.setItem('topify_referred_users', JSON.stringify(mergedUsers));
      }
    } catch (e) {}
  };

  const fetchCommissionData = async () => {
    try {
      const localRules = getLocalCommissionRules();
      if (localRules.length > 0) setCommissionRules(localRules);
      const localHistory = getLocalCommissionHistory();
      if (localHistory.length > 0) setCommissionHistory(localHistory);

      const res = await api.get('/referral/commissions');
      if (res.data) {
        const serverRules = res.data.rules || [];
        const mergedRules = localRules.length > 0
          ? [...localRules, ...serverRules.filter((sr: any) => !localRules.some((lr: any) => lr.id === sr.id))]
          : serverRules;
        setCommissionRules(mergedRules);
        localStorage.setItem('topify_commission_rules', JSON.stringify(mergedRules));

        const serverHistory = res.data.history || [];
        const mergedHistory = localHistory.length > 0
          ? [...localHistory, ...serverHistory.filter((sh: any) => !localHistory.some((lh: any) => lh.id === sh.id))]
          : serverHistory;
        setCommissionHistory(mergedHistory);
        localStorage.setItem('topify_commission_history', JSON.stringify(mergedHistory));
      }
    } catch (e) {}
  };

  const fetchFraudAlerts = async () => {
    try {
      const localAlerts = getLocalFraudAlerts();
      if (localAlerts.length > 0) setFraudAlerts(localAlerts);

      const res = await api.get('/referral/anti-fraud');
      if (res.data?.alerts) {
        const serverAlerts = res.data.alerts;
        const mergedAlerts = localAlerts.length > 0
          ? [...localAlerts, ...serverAlerts.filter((sa: any) => !localAlerts.some((la: any) => la.id === sa.id))]
          : serverAlerts;
        setFraudAlerts(mergedAlerts);
        localStorage.setItem('topify_fraud_alerts', JSON.stringify(mergedAlerts));
      }
    } catch (e) {}
  };

  // Handle Withdraw (F148)
  const handleCreateWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (!amount || amount < 100000) {
      toast.error('Số tiền rút tối thiểu là 100.000 VND');
      return;
    }
    if (amount > (wallet?.availableBalance || 0)) {
      toast.error('Số dư khả dụng không đủ');
      return;
    }

    try {
      setSubmittingWithdraw(true);
      const res = await api.post('/wallet', {
        amount,
        paymentMethodId: selectedMethodId,
        note: withdrawNote,
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Tạo lệnh rút tiền thành công!');
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setWithdrawNote('');

        // Cập nhật số dư và lưu offset cục bộ
        const currentOffset = getLocalBalanceOffset() - amount;
        localStorage.setItem('topify_wallet_balance_offset', String(currentOffset));

        const pm = paymentMethods.find((p: any) => p.id === selectedMethodId) || paymentMethods[0];
        const pmDesc = pm ? `${pm.bankName || pm.type} - ${pm.accountNumber}` : 'Ngân hàng mặc định';

        const newWd = res.data?.withdrawal || {
          id: `wd_${Date.now()}`,
          amount,
          fee: 0,
          netAmount: amount,
          paymentMethod: pmDesc,
          accountInfo: pm?.accountName || 'YẾN NGÔ',
          status: 'PENDING',
          note: withdrawNote || 'Yêu cầu rút tiền tự động',
          createdAt: new Date().toISOString(),
        };

        const localWds = [newWd, ...getLocalWithdrawals().filter((w: any) => w.id !== newWd.id)];
        localStorage.setItem('topify_local_withdrawals', JSON.stringify(localWds));
        setWithdrawals((prev: any[]) => [newWd, ...prev.filter((w: any) => w.id !== newWd.id)]);

        const wdTx = {
          id: `tx_${Date.now()}`,
          type: 'WITHDRAWAL',
          amount: -amount,
          description: `Yêu cầu rút tiền về ${pmDesc}`,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        };
        const localTxs = [wdTx, ...getLocalTransactions()].slice(0, 50);
        localStorage.setItem('topify_local_transactions', JSON.stringify(localTxs));
        setTransactions((prev: any[]) => [wdTx, ...prev]);

        setWallet((prev: any) => ({
          ...prev,
          availableBalance: Math.max(0, (prev?.availableBalance || 0) - amount),
          pendingBalance: (prev?.pendingBalance || 0) + amount,
        }));

        fetchWalletData(true);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi rút tiền');
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  // Handle Review / Approval of Withdrawal (F148)
  const handleUpdateWithdrawalStatus = async (withdrawalId: string, status: 'COMPLETED' | 'REJECTED') => {
    try {
      const res = await api.patch(`/wallet/withdrawals/${withdrawalId}`, {
        status,
        note: status === 'COMPLETED' ? 'Đã duyệt và giải ngân thành công' : 'Đã từ chối và hoàn số dư ví',
      });
      if (res.data?.success) {
        toast.success(status === 'COMPLETED' ? 'Đã duyệt lệnh rút tiền thành công!' : 'Đã từ chối và hoàn tiền vào ví!');
        
        const updatedWds = withdrawals.map((w: any) => w.id === withdrawalId ? { ...w, status, processedAt: new Date().toISOString() } : w);
        setWithdrawals(updatedWds);
        localStorage.setItem('topify_local_withdrawals', JSON.stringify(updatedWds));

        const targetWd = withdrawals.find((w: any) => w.id === withdrawalId);
        if (targetWd) {
          if (status === 'REJECTED') {
            const currentOffset = getLocalBalanceOffset() + targetWd.amount;
            localStorage.setItem('topify_wallet_balance_offset', String(currentOffset));
            setWallet((prev: any) => ({
              ...prev,
              availableBalance: (prev?.availableBalance || 0) + targetWd.amount,
              pendingBalance: Math.max(0, (prev?.pendingBalance || 0) - targetWd.amount),
            }));

            const refundTx = {
              id: `tx_${Date.now()}`,
              type: 'REFUND',
              amount: targetWd.amount,
              description: `Hoàn tiền lệnh rút tiền bị từ chối (${targetWd.id})`,
              status: 'COMPLETED',
              createdAt: new Date().toISOString(),
            };
            const localTxs = [refundTx, ...getLocalTransactions()].slice(0, 50);
            localStorage.setItem('topify_local_transactions', JSON.stringify(localTxs));
            setTransactions((prev: any[]) => [refundTx, ...prev]);
          } else if (status === 'COMPLETED') {
            setWallet((prev: any) => ({
              ...prev,
              pendingBalance: Math.max(0, (prev?.pendingBalance || 0) - targetWd.amount),
              totalWithdrawn: (prev?.totalWithdrawn || 0) + targetWd.amount,
            }));
          }
        }
        fetchWalletData(true);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi cập nhật trạng thái lệnh rút');
    }
  };

  // Handle Add Payment Method (F149)
  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim() || !newAccountNumber.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin tài khoản');
      return;
    }

    try {
      const res = await api.post('/wallet/payment-methods', {
        type: newMethodType,
        accountName: newAccountName.trim().toUpperCase(),
        accountNumber: newAccountNumber.trim(),
        bankName: newMethodType === 'VIETQR' ? newBankName : undefined,
        isDefault: paymentMethods.length === 0,
      });

      if (res.data?.success) {
        toast.success('Đã lưu phương thức nhận tiền thành công');
        setShowAddMethodModal(false);
        setNewAccountNumber('');
        const addedMethod = res.data.paymentMethod;
        if (addedMethod) {
          const currentPms = [addedMethod, ...paymentMethods.filter((p: any) => p.id !== addedMethod.id)];
          setPaymentMethods(currentPms);
          localStorage.setItem('topify_payment_methods', JSON.stringify(currentPms));
        }
        fetchWalletData(true);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi thêm phương thức');
    }
  };

  // Handle Delete & Edit Payment Method (F149)
  const openEditMethodModal = (pm: any) => {
    setEditingMethod(pm);
    setEditMethodType(pm.type || 'VIETQR');
    setEditAccountName(pm.accountName || 'YẾN NGÔ');
    setEditAccountNumber(pm.accountNumber || '');
    setEditBankName(pm.bankName || 'MB Bank');
  };

  const handleUpdatePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMethod) return;
    try {
      const res = await api.patch('/wallet/payment-methods', {
        id: editingMethod.id,
        type: editMethodType,
        accountName: editAccountName.trim().toUpperCase(),
        accountNumber: editAccountNumber.trim(),
        bankName: editMethodType === 'VIETQR' ? editBankName : undefined,
      });
      if (res.data?.success) {
        toast.success('Đã cập nhật phương thức nhận tiền thành công');
        setEditingMethod(null);
        const updated = res.data.paymentMethod;
        if (updated) {
          const currentPms = paymentMethods.map((p: any) => p.id === updated.id ? updated : p);
          setPaymentMethods(currentPms);
          localStorage.setItem('topify_payment_methods', JSON.stringify(currentPms));
        }
        fetchWalletData(true);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi cập nhật phương thức nhận tiền');
    }
  };

  const handleDeletePaymentMethod = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa phương thức nhận tiền "${name}" khỏi danh sách?`)) {
      return;
    }
    try {
      const res = await api.delete(`/wallet/payment-methods?id=${id}`);
      if (res.data?.success) {
        toast.success(res.data.message || 'Đã xóa phương thức nhận tiền thành công');
        const remaining = paymentMethods.filter((p: any) => p.id !== id);
        setPaymentMethods(remaining);
        localStorage.setItem('topify_payment_methods', JSON.stringify(remaining));
        fetchWalletData(true);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi xóa phương thức nhận tiền');
    }
  };

  // Handle Task Progress Advance (F150)
  const handleAdvanceTaskProgress = async (task: any) => {
    try {
      const newProgress = Math.min(task.maxProgress, task.progress + 1);
      const isCompleted = newProgress >= task.maxProgress;
      const res = await api.post('/wallet/tasks', {
        taskId: task.id,
        action: 'progress',
        progress: newProgress,
      });
      if (res.data?.success) {
        toast.success(`Đã cập nhật tiến độ: ${newProgress}/${task.maxProgress} ${task.unit}`);
        setEarningTasks((prev: any[]) => prev.map((t: any) => t.id === task.id ? { ...t, progress: newProgress, isCompleted } : t));
        fetchTasks();
      }
    } catch (e) {
      toast.error('Lỗi khi cập nhật tiến độ');
    }
  };

  // Handle Claim Earning Task (F150)
  const handleClaimTask = async (task: any) => {
    try {
      setClaimingTaskId(task.id);
      const res = await api.post('/wallet/tasks', { taskId: task.id });
      if (res.data?.success) {
        toast.success(res.data.message);

        const rewardAmt = res.data.rewardAmount || task.rewardAmount || 100000;

        // Lưu offset số dư vào localStorage
        const currentOffset = getLocalBalanceOffset() + rewardAmt;
        localStorage.setItem('topify_wallet_balance_offset', String(currentOffset));

        // Lưu ID nhiệm vụ đã nhận vào localStorage
        const claimedIds = Array.from(new Set([...getClaimedLocalTaskIds(), task.id]));
        localStorage.setItem('topify_claimed_task_ids', JSON.stringify(claimedIds));

        // 1. Cập nhật ngay lập tức số dư ví
        setWallet((prev: any) => ({
          ...prev,
          availableBalance: (prev?.availableBalance || 0) + rewardAmt,
        }));

        // 2. Thêm ngay giao dịch thưởng vào đầu danh sách sổ cái & lưu localStorage
        const rewardTx = res.data.transaction || {
          id: `tx_${Date.now()}`,
          type: 'EARNING',
          amount: rewardAmt,
          description: `Thưởng hoàn thành nhiệm vụ: ${task.title}`,
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
        };
        const localTxs = [rewardTx, ...getLocalTransactions()].slice(0, 50);
        localStorage.setItem('topify_local_transactions', JSON.stringify(localTxs));
        setTransactions((prev: any[]) => [rewardTx, ...prev.filter((t: any) => t.id !== rewardTx.id)]);

        // 3. Đánh dấu nhiệm vụ đã nhận thưởng trên card
        setEarningTasks((prev: any[]) => prev.map((t: any) => t.id === task.id ? { ...t, isClaimed: true } : t));

        // 4. Đồng bộ lại dữ liệu ngầm từ server
        fetchTasks();
        fetchWalletData(true);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Không thể nhận thưởng');
    } finally {
      setClaimingTaskId(null);
    }
  };

  // Handle Copy Link & Code (F151)
  const copyToClipboard = (text: string, isLink: boolean) => {
    navigator.clipboard.writeText(text);
    if (isLink) {
      setCopiedLink(true);
      toast.success('Đã sao chép liên kết giới thiệu!');
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      toast.success('Đã sao chép mã giới thiệu!');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Handle Anti-Fraud Simulation Scan (F155)
  const handleRunFraudScan = async () => {
    try {
      setScanningFraud(true);
      const res = await api.post('/referral/anti-fraud', {
        scanData: {
          userName: 'kiem_tra_gian_lan@gmail.com',
          fingerprint: 'fp_sim_test_scanner',
        },
      });
      if (res.data?.success) {
        toast.success(res.data.message);
        fetchFraudAlerts();
      }
    } catch (e: any) {
      toast.error('Lỗi khi quét gian lận');
    } finally {
      setScanningFraud(false);
    }
  };

  // Handle Update Referral Code (F151)
  const handleUpdateReferralCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customCodeInput.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (clean.length < 3) {
      toast.error('Mã giới thiệu phải có ít nhất 3 ký tự (chữ hoa, số, gạch nối)');
      return;
    }
    try {
      setSavingCode(true);
      const res = await api.post('/referral', { customCode: clean });
      if (res.data?.profile) {
        setReferralProfile(res.data.profile);
        localStorage.setItem('topify_referral_profile', JSON.stringify(res.data.profile));
        toast.success(`Đã đổi mã giới thiệu thành ${clean} thành công!`);
        setShowCustomCodeModal(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Không thể đổi mã giới thiệu');
    } finally {
      setSavingCode(false);
    }
  };

  // Handle Simulate Referred User (F152)
  const handleSimulateReferredUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSimulatingUser(true);
      const planRates: Record<string, number> = {
        STARTER: 299000,
        PRO: 598000,
        ENTERPRISE: 2500000,
        FREE: 0,
      };
      const earned = simStatus === 'ACTIVE_PAID' ? (planRates[simPlan] || 0) : 0;
      const res = await api.post('/referral', {
        action: 'SIMULATE_USER',
        userSimulation: {
          name: simName || 'Công ty TNHH Sáng Tạo Số',
          emailMasked: simEmail ? `${simEmail.split('@')[0].slice(0, 3)}***@${simEmail.split('@')[1] || 'gmail.com'}` : 'sangtao_***@gmail.com',
          plan: simPlan,
          status: simStatus,
          commissionEarned: earned,
        },
      });
      if (res.data?.user) {
        const updatedUsers = [res.data.user, ...referredUsers.filter((u) => u.id !== res.data.user.id)];
        setReferredUsers(updatedUsers);
        localStorage.setItem('topify_referred_users', JSON.stringify(updatedUsers));
        if (res.data?.profile) {
          setReferralProfile(res.data.profile);
          localStorage.setItem('topify_referral_profile', JSON.stringify(res.data.profile));
        }
        toast.success(`Đã thêm khách hàng giới thiệu "${res.data.user.name}" thành công!`);
        setShowSimulateUserModal(false);
        setSimName('');
        setSimEmail('');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi giả lập khách hàng');
    } finally {
      setSimulatingUser(false);
    }
  };

  // Handle Commission Rule Form (F153)
  const openAddRuleModal = () => {
    setEditingRule(null);
    setRuleForm({
      planName: '',
      firstMonthRate: 20,
      recurringRate: 10,
      cookieDays: 60,
      payoutSchedule: 'Ngày 15 hàng tháng',
      description: '',
    });
    setShowRuleModal(true);
  };

  const openEditRuleModal = (rule: any) => {
    setEditingRule(rule);
    setRuleForm({
      planName: rule.planName,
      firstMonthRate: rule.firstMonthRate,
      recurringRate: rule.recurringRate,
      cookieDays: rule.cookieDays,
      payoutSchedule: rule.payoutSchedule,
      description: rule.description,
    });
    setShowRuleModal(true);
  };

  const handleSaveCommissionRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingRule(true);
      if (editingRule?.id) {
        const res = await api.post('/referral/commissions', {
          id: editingRule.id,
          planName: ruleForm.planName,
          firstMonthRate: Number(ruleForm.firstMonthRate),
          recurringRate: Number(ruleForm.recurringRate),
          cookieDays: Number(ruleForm.cookieDays),
          payoutSchedule: ruleForm.payoutSchedule,
          description: ruleForm.description,
        });
        if (res.data?.rules) {
          setCommissionRules(res.data.rules);
          localStorage.setItem('topify_commission_rules', JSON.stringify(res.data.rules));
        }
        toast.success('Đã cập nhật chính sách hoa hồng thành công!');
      } else {
        const res = await api.post('/referral/commissions', {
          action: 'ADD_RULE',
          ruleData: {
            planName: ruleForm.planName,
            firstMonthRate: Number(ruleForm.firstMonthRate),
            recurringRate: Number(ruleForm.recurringRate),
            cookieDays: Number(ruleForm.cookieDays),
            payoutSchedule: ruleForm.payoutSchedule,
            description: ruleForm.description,
          },
        });
        if (res.data?.rules) {
          setCommissionRules(res.data.rules);
          localStorage.setItem('topify_commission_rules', JSON.stringify(res.data.rules));
        }
        toast.success('Đã thêm chính sách hoa hồng mới thành công!');
      }
      setShowRuleModal(false);
      setEditingRule(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Không thể lưu chính sách hoa hồng');
    } finally {
      setSavingRule(false);
    }
  };

  const handleDeleteCommissionRule = async (ruleId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa chính sách hoa hồng này?')) return;
    try {
      const res = await api.delete(`/referral/commissions?id=${ruleId}`);
      if (res.data?.rules) {
        setCommissionRules(res.data.rules);
        localStorage.setItem('topify_commission_rules', JSON.stringify(res.data.rules));
        toast.success('Đã xóa chính sách hoa hồng');
      }
    } catch (err: any) {
      toast.error('Không thể xóa chính sách');
    }
  };

  // Handle Commission Payout / Approve (F154)
  const handleCommissionAction = async (id: string, action: 'APPROVE' | 'PAYOUT') => {
    try {
      setActionLoadingId(id);
      const res = await api.post('/referral/commissions', {
        action,
        id,
      });
      if (res.data?.success) {
        toast.success(res.data.message);
        if (res.data?.history) {
          setCommissionHistory(res.data.history);
          localStorage.setItem('topify_commission_history', JSON.stringify(res.data.history));
        }
        if (action === 'PAYOUT' && res.data?.wallet) {
          setWallet(res.data.wallet);
          fetchWalletData(true);
        }
        fetchReferralData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi xử lý hoa hồng');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Update Fraud Action (F155)
  const handleUpdateFraudAction = async (alertId: string, actionTaken: string) => {
    try {
      const res = await api.post('/referral/anti-fraud', {
        action: 'UPDATE_STATUS',
        alertId,
        newStatus: actionTaken,
      });
      if (res.data?.success) {
        toast.success(res.data.message);
        if (res.data?.alerts) {
          setFraudAlerts(res.data.alerts);
          localStorage.setItem('topify_fraud_alerts', JSON.stringify(res.data.alerts));
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Không thể cập nhật biện pháp xử lý');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-2 sm:p-4 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-200 shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight leading-snug">
                Ví Doanh Thu & Tiếp Thị Liên Kết (Wallet & Referral)
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap shrink-0 inline-flex items-center">
                M12 & M13
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed max-w-3xl">
              Quản lý số dư (F146), lịch sử giao dịch (F147), rút tiền (F148), nhiệm vụ kiếm tiền (F150), tiếp thị liên kết (F151-F154) và chống gian lận (F155).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start xl:self-center shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200 transition-all whitespace-nowrap shrink-0"
          >
            <ArrowDownToLine className="w-4 h-4 shrink-0" />
            Rút Tiền Ngay
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 sm:gap-1.5 border-b border-gray-200/80 px-1 sm:px-2 overflow-x-auto no-scrollbar scroll-smooth text-xs">
        {[
          { key: 'balance', label: 'Ví & Rút Tiền', icon: Wallet, badge: 'F146, F148' },
          { key: 'transactions', label: 'Lịch Sử Giao Dịch', icon: ArrowUpRight, badge: 'F147' },
          { key: 'payment_methods', label: 'Tài Khoản Nhận Tiền', icon: CreditCard, badge: 'F149' },
          { key: 'tasks', label: 'Nhiệm Vụ Kiếm Thưởng', icon: Gift, badge: 'F150' },
          { key: 'referral', label: 'Tiếp Thị & Chống Gian Lận', icon: TrendingUp, badge: 'F151-F155' },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 font-bold border-b-2 transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-t-xl'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">{tab.label}</span>
              <span className="hidden xl:inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-mono shrink-0 whitespace-nowrap">
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Ví & Rút Tiền (F146, F148) */}
      {activeTab === 'balance' && (
        <div className="space-y-6">
          {/* 3 Main Balances Card (F146) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between opacity-90 text-xs font-medium mb-1">
                  <span>Số Dư Khả Dụng (Available)</span>
                  <DollarSign className="w-4 h-4 shrink-0" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 truncate">
                  {(wallet?.availableBalance || 0).toLocaleString()} <span className="text-base font-normal">VND</span>
                </div>
              </div>
              <div className="mt-5 pt-3.5 border-t border-white/20 flex items-center justify-between gap-2 text-xs">
                <span className="opacity-80 text-xs truncate min-w-0">Sẵn sàng rút về ngân hàng</span>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-white text-emerald-700 font-bold hover:bg-emerald-50 transition-colors whitespace-nowrap shrink-0 text-xs shadow-sm"
                >
                  Rút ngay
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-gray-500 text-xs font-medium mb-1">
                  <span>Chờ Đối Soát (Pending Review)</span>
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight mt-2 truncate">
                  {(wallet?.pendingBalance || 0).toLocaleString()} <span className="text-base font-normal text-gray-500">VND</span>
                </div>
              </div>
              <div className="mt-5 pt-3.5 border-t border-gray-100 flex items-center justify-between gap-2 text-xs text-gray-500">
                <span className="truncate min-w-0 text-xs">Kỳ giải ngân ngày 15</span>
                <span className="font-semibold text-gray-700 whitespace-nowrap shrink-0 text-xs">Tự động cộng ví</span>
              </div>
            </div>

            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-gray-500 text-xs font-medium mb-1">
                  <span>Đã Rút Thành Công (Withdrawn)</span>
                  <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-2 truncate">
                  {(wallet?.totalWithdrawn || 0).toLocaleString()} <span className="text-base font-normal text-gray-500">VND</span>
                </div>
              </div>
              <div className="mt-5 pt-3.5 border-t border-gray-100 flex items-center justify-between gap-2 text-xs text-gray-500">
                <span className="truncate min-w-0 text-xs">Tổng luỹ kế các kỳ</span>
                <span className="font-semibold text-emerald-600 whitespace-nowrap shrink-0 text-xs">{withdrawals.length} lệnh rút</span>
              </div>
            </div>
          </div>

          {/* Withdrawals List (F148) */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-gray-900">Lịch Sử Yêu Cầu Rút Tiền (Withdrawals - F148)</h3>
                <p className="text-xs text-gray-500">Theo dõi tiến độ duyệt và trạng thái chuyển khoản ngân hàng</p>
              </div>
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                Tạo lệnh rút
              </button>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4">Số tiền rút</th>
                    <th className="py-3 px-4">Phương thức nhận</th>
                    <th className="py-3 px-4">Chủ tài khoản</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4">Ghi chú đối soát</th>
                    <th className="py-3 px-4 text-right">Kiểm duyệt & Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {withdrawals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-gray-400">Chưa có lệnh rút tiền nào</td>
                    </tr>
                  ) : (
                    withdrawals.map((wd: any) => (
                      <tr key={wd.id} className="hover:bg-gray-50/50">
                        <td className="py-3.5 px-4 text-gray-500">
                          {new Date(wd.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          {wd.amount.toLocaleString()} VND
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-800">
                          {wd.paymentMethod}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600 font-semibold">
                          {wd.accountInfo}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            wd.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            wd.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            wd.status === 'PROCESSING' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {wd.status === 'COMPLETED' ? '✓ Đã giải ngân' :
                             wd.status === 'PENDING' ? '⏳ Chờ duyệt' :
                             wd.status === 'PROCESSING' ? '🔄 Đang chuyển tiền' :
                             '✕ Đã từ chối'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 max-w-xs truncate">
                          {wd.note || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {wd.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleUpdateWithdrawalStatus(wd.id, 'COMPLETED')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-all whitespace-nowrap"
                                title="Phê duyệt lệnh rút và giải ngân tiền"
                              >
                                Duyệt lệnh
                              </button>
                              <button
                                onClick={() => handleUpdateWithdrawalStatus(wd.id, 'REJECTED')}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-[11px] transition-all whitespace-nowrap"
                                title="Từ chối lệnh rút và hoàn số dư ví"
                              >
                                Từ chối
                              </button>
                            </div>
                          ) : wd.status === 'COMPLETED' ? (
                            <span className="text-[11px] font-medium text-emerald-600">✓ Hoàn tất</span>
                          ) : (
                            <span className="text-[11px] font-medium text-rose-600">✕ Đã hoàn tiền</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Lịch Sử Giao Dịch (F147) */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Sổ Cái Biến Động Số Dư (Transaction History - F147)</h3>
              <p className="text-xs text-gray-500">Chi tiết mọi khoản thu nhập hoa hồng, thưởng nhiệm vụ và rút tiền</p>
            </div>
            <span className="text-xs font-semibold text-gray-600 px-3 py-1 bg-gray-100 rounded-xl whitespace-nowrap shrink-0">
              Tổng {transactions.length} giao dịch
            </span>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-50/70 p-3 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'COMMISSION', label: 'Hoa hồng' },
                { id: 'EARNING', label: 'Nhiệm vụ' },
                { id: 'WITHDRAWAL', label: 'Rút tiền' },
                { id: 'REFUND', label: 'Hoàn tiền' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setTxFilterType(tab.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap shrink-0 ${
                    txFilterType === tab.id
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm giao dịch, nội dung..."
                value={txSearchQuery}
                onChange={e => setTxSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Mã giao dịch</th>
                  <th className="py-3 px-4">Phân loại</th>
                  <th className="py-3 px-4">Mô tả nội dung</th>
                  <th className="py-3 px-4">Số tiền</th>
                  <th className="py-3 px-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions
                  .filter((tx: any) => {
                    const matchesType = txFilterType === 'ALL' || (tx.type || '').toUpperCase() === txFilterType;
                    const matchesQuery = !txSearchQuery ||
                      (tx.description || '').toLowerCase().includes(txSearchQuery.toLowerCase()) ||
                      (tx.id || '').toLowerCase().includes(txSearchQuery.toLowerCase());
                    return matchesType && matchesQuery;
                  })
                  .map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-gray-50/50">
                      <td className="py-3.5 px-4 text-gray-500">
                        {new Date(tx.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-gray-500">
                        #{tx.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                          tx.type === 'COMMISSION' ? 'bg-purple-50 text-purple-700' :
                          tx.type === 'EARNING' ? 'bg-blue-50 text-blue-700' :
                          tx.type === 'REFUND' ? 'bg-emerald-50 text-emerald-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-800 font-medium">
                        {tx.description}
                      </td>
                      <td className="py-3.5 px-4 font-bold">
                        <span className={tx.amount > 0 ? 'text-emerald-600' : 'text-gray-900'}>
                          {tx.amount > 0 ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()} VND
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Thành công
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Phương Thức Nhận Tiền (F149) */}
      {activeTab === 'payment_methods' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Quản Lý Phương Thức Nhận Tiền (Payment Methods - F149)</h3>
              <p className="text-xs text-gray-500">Lưu tài khoản ngân hàng VietQR, ví điện tử Momo hoặc PayPal để nhận tiền rút tự động</p>
            </div>
            <button
              onClick={() => setShowAddMethodModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" />
              Thêm Tài Khoản Mới
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {paymentMethods.map((pm: any) => (
              <div 
                key={pm.id}
                className={`p-5 rounded-3xl bg-white border transition-all flex flex-col justify-between space-y-4 hover:shadow-sm ${
                  pm.isDefault ? 'border-emerald-300 ring-2 ring-emerald-100 shadow-md' : 'border-gray-200'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        {pm.type}
                      </span>
                      {pm.isDefault && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Mặc định
                        </span>
                      )}
                    </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditMethodModal(pm)}
                          className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                          title="Chỉnh sửa tài khoản nhận tiền này"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePaymentMethod(pm.id, `${pm.bankName ? pm.bankName + ' - ' : ''}${pm.accountNumber}`)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Xóa tài khoản nhận tiền này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                  </div>

                  <div>
                    <span className="text-xs text-gray-400 block">{pm.bankName || 'Ví điện tử'}</span>
                    <h4 className="text-base font-extrabold font-mono text-gray-900 tracking-wider mt-0.5">
                      {pm.accountNumber}
                    </h4>
                    <p className="text-xs font-semibold text-gray-700 mt-1 uppercase">{pm.accountName}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-gray-400">Đã kích hoạt</span>
                  <div className="flex items-center gap-3">
                    {!pm.isDefault && (
                      <button
                        onClick={async () => {
                          await api.patch('/wallet/payment-methods', { id: pm.id });
                          fetchWalletData();
                          toast.success('Đã đặt làm phương thức mặc định');
                        }}
                        className="text-xs font-semibold text-emerald-600 hover:underline"
                      >
                        Đặt làm mặc định
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePaymentMethod(pm.id, `${pm.bankName ? pm.bankName + ' - ' : ''}${pm.accountNumber}`)}
                      className="text-xs font-medium text-red-500 hover:text-red-700 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Nhiệm Vụ Kiếm Tiền (F150) */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Gift className="w-4 h-4 text-purple-600 shrink-0" />
                Nhiệm Vụ Đủ Điều Kiện Nhận Thu Nhập (Earning Tasks - F150)
              </h3>
              <p className="text-xs text-gray-500">Hoàn thành các nhiệm vụ tăng trưởng và bấm Nhận thưởng để cộng tiền trực tiếp vào Ví</p>
            </div>
            <div className="text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 whitespace-nowrap shrink-0">
              Cập nhật hàng tuần
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {earningTasks.map((task: any) => {
              const percent = Math.min(100, Math.round((task.progress / task.maxProgress) * 100));
              const isExpired = task.isExpired ?? (new Date(task.expiresAt).getTime() < Date.now());
              const isOverdue = isExpired && !task.isCompleted;

              return (
                <div 
                  key={task.id}
                  className={`p-5 rounded-3xl bg-white border shadow-sm flex flex-col justify-between space-y-4 transition-all ${
                    isOverdue 
                      ? 'border-rose-200 bg-rose-50/20' 
                      : task.isCompleted && !task.isClaimed
                      ? 'border-emerald-200 bg-emerald-50/10'
                      : 'border-gray-200 hover:border-purple-200'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                          isOverdue 
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>
                          {task.category}
                        </span>
                        {isOverdue && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200">
                            Quá hạn
                          </span>
                        )}
                      </div>
                      <span className={`text-sm font-extrabold ${
                        isOverdue ? 'text-gray-400 line-through' : 'text-emerald-600'
                      }`}>
                        +{task.rewardAmount.toLocaleString()} VND
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{task.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-gray-600">
                        <span>Tiến độ:</span>
                        <span className={isOverdue ? 'text-rose-600 font-bold' : ''}>
                          {task.progress.toLocaleString()} / {task.maxProgress.toLocaleString()} {task.unit} ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 rounded-full ${
                            isOverdue 
                              ? 'bg-rose-400' 
                              : task.isCompleted 
                              ? 'bg-emerald-500' 
                              : 'bg-purple-600'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    {isOverdue ? (
                      <span className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        Hết hạn: {new Date(task.expiresAt).toLocaleDateString('vi-VN')}
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        Hết hạn: {new Date(task.expiresAt).toLocaleDateString('vi-VN')}
                      </span>
                    )}

                    {task.isClaimed ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-xl whitespace-nowrap shrink-0">
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Đã nhận thưởng
                      </span>
                    ) : task.isCompleted ? (
                      <button
                        onClick={() => handleClaimTask(task)}
                        disabled={claimingTaskId === task.id}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all flex items-center gap-1.5 animate-pulse whitespace-nowrap shrink-0"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {claimingTaskId === task.id ? 'Đang nhận...' : 'Nhận Thưởng Ngay'}
                      </button>
                    ) : isOverdue ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl whitespace-nowrap shrink-0">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Đã hết hạn
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl whitespace-nowrap shrink-0">
                          <Clock className="w-3.5 h-3.5 text-amber-500" /> Đang thực hiện
                        </span>
                        <button
                          onClick={() => handleAdvanceTaskProgress(task)}
                          className="px-2.5 py-1 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors whitespace-nowrap shrink-0"
                          title="Tăng tiến độ để kiểm tra hoàn thành và nhận thưởng"
                        >
                          + Tiến độ
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: Tiếp Thị Liên Kết & Chống Gian Lận (F151 - F155) */}
      {activeTab === 'referral' && (
        <div className="space-y-6">
          {/* Referral Link & Code Header (F151) */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white shadow-lg space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/20 text-purple-200">
                  Affiliate & Growth Program (F151)
                </span>
                <h3 className="text-xl font-bold">Chương Trình Giới Thiệu & Hoa Hồng Trọn Đời</h3>
                <p className="text-xs text-purple-200 max-w-xl">
                  Nhận tới 25% hoa hồng cho mỗi người dùng đăng ký qua liên kết của bạn. Hoa hồng tự động chuyển vào Ví định kỳ ngày 15.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCustomCodeInput(referralProfile?.code || 'TOP-YEN99');
                    setShowCustomCodeModal(true);
                  }}
                  className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Edit3 className="w-4 h-4" />
                  Đổi Mã (F151)
                </button>
                <button
                  onClick={() => setShowQrModal(true)}
                  className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <QrCode className="w-4 h-4" />
                  Mã QR Giới Thiệu
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-purple-300 block">Liên kết giới thiệu duy nhất:</span>
                  <span className="text-xs font-mono font-bold text-white truncate block max-w-xs">
                    {referralProfile?.referralLink || 'https://topify.app/ref/TOP-YEN99'}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(referralProfile?.referralLink || '', true)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-colors flex items-center gap-1"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-purple-300 block">Mã kích hoạt quà tặng (Code):</span>
                  <span className="text-base font-mono font-extrabold text-amber-400 tracking-wider">
                    {referralProfile?.code || 'TOP-YEN99'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setCustomCodeInput(referralProfile?.code || 'TOP-YEN99');
                      setShowCustomCodeModal(true);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-bold text-white transition-colors flex items-center gap-1"
                    title="Chỉnh sửa mã giới thiệu"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => copyToClipboard(referralProfile?.code || '', false)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-gray-900 transition-colors flex items-center gap-1"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCode ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Referral Funnel Tracking 4-Steps (F152) */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-gray-900">Phễu Chuyển Đổi Tăng Trưởng (Referral Funnel - F152)</h4>
                <p className="text-xs text-gray-500">Đo lường hành trình từ lượt nhấp chuột đến khách hàng trả phí</p>
              </div>
              <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 whitespace-nowrap shrink-0">
                Tỷ lệ chuyển đổi: {referralProfile?.conversionRate || 16.67}%
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-xs text-gray-500">1. Lượt Nhấp (Clicks)</span>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {(referralProfile?.totalClicks || 0).toLocaleString()}
                </div>
                <span className="text-[11px] text-gray-400">100% người xem</span>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
                <span className="text-xs text-blue-700">2. Đăng Ký Mới</span>
                <div className="text-2xl font-bold text-blue-900 mt-1">
                  {(referralProfile?.totalRegistrations || 0).toLocaleString()}
                </div>
                <span className="text-[11px] text-blue-600 font-semibold">11.8% từ lượt click</span>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100">
                <span className="text-xs text-purple-700">3. Kích Hoạt Dùng Thử</span>
                <div className="text-2xl font-bold text-purple-900 mt-1">
                  {(referralProfile?.totalTrialUsers || 0).toLocaleString()}
                </div>
                <span className="text-[11px] text-purple-600 font-semibold">56.5% đăng ký</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-xs text-emerald-700">4. Đã Trả Phí (Paid)</span>
                <div className="text-2xl font-bold text-emerald-900 mt-1">
                  {(referralProfile?.totalPaidSubscribers || 0).toLocaleString()}
                </div>
                <span className="text-[11px] text-emerald-600 font-bold">Sinh hoa hồng</span>
              </div>
            </div>
          </div>

          {/* Referred Users Table (F152) */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  Khách Hàng Đã Giới Thiệu (Referred Users - F152)
                </h4>
                <p className="text-xs text-gray-500">Theo dõi khách hàng đã đăng ký qua mã giới thiệu và hoa hồng phát sinh</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs border border-purple-200">
                  {referredUsers.length} khách hàng
                </span>
                <button
                  onClick={() => setShowSimulateUserModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Giả Lập Khách Hàng
                </button>
              </div>
            </div>

            {referredUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                Chưa có khách hàng nào đăng ký qua mã giới thiệu của bạn. Hãy chia sẻ liên kết để bắt đầu nhận hoa hồng!
              </div>
            ) : (
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                    <tr>
                      <th className="py-2.5 px-3">Khách hàng</th>
                      <th className="py-2.5 px-3">Email nhận diện</th>
                      <th className="py-2.5 px-3">Ngày đăng ký</th>
                      <th className="py-2.5 px-3">Gói dịch vụ</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                      <th className="py-2.5 px-3 text-right">Hoa hồng phát sinh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {referredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-gray-900">
                          {u.name}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-gray-500 text-[11px]">
                          {u.emailMasked}
                        </td>
                        <td className="py-2.5 px-3 text-gray-500">
                          {new Date(u.registeredAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                            u.plan === 'ENTERPRISE' ? 'bg-amber-100 text-amber-800' :
                            u.plan === 'PRO' ? 'bg-purple-100 text-purple-800' :
                            u.plan === 'STARTER' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {u.plan}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                            u.status === 'ACTIVE_PAID' ? 'bg-emerald-100 text-emerald-800' :
                            u.status === 'TRIAL' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {u.status === 'ACTIVE_PAID' ? '✓ Đã thanh toán' :
                             u.status === 'TRIAL' ? '⏳ Dùng thử' : u.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-emerald-600">
                          {u.commissionEarned > 0 ? `+${u.commissionEarned.toLocaleString()} VND` : '0 VND'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Commission Rules Table (F153) */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-gray-900">Chính Sách Hoa Hồng Đa Tầng (Commission Rules - F153)</h4>
                <p className="text-xs text-gray-500">Mức chiết khấu và thời gian lưu trữ cookie theo từng gói dịch vụ</p>
              </div>

              <button
                onClick={openAddRuleModal}
                className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                + Thêm Chính Sách
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {commissionRules.map(rule => (
                <div key={rule.id} className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80 flex flex-col justify-between space-y-3 hover:border-purple-300 transition-all">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-sm text-gray-900 block leading-tight">{rule.planName}</span>
                    </div>
                    <p className="text-gray-500 text-[11px]">{rule.description}</p>
                    <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between font-semibold">
                      <span className="text-purple-700">Tháng đầu: {rule.firstMonthRate}%</span>
                      <span className="text-emerald-700">Định kỳ: {rule.recurringRate}%</span>
                    </div>
                    <div className="text-[11px] text-gray-400">Cookie: {rule.cookieDays} ngày • {rule.payoutSchedule}</div>
                  </div>

                  <div className="pt-2 border-t border-gray-200/60 flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => openEditRuleModal(rule)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteCommissionRule(rule.id)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Commission History & Direct Payout (F154) */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Lịch Sử Hoa Hồng & Quyết Toán Vào Ví (Commission History - F154)
                </h4>
                <p className="text-xs text-gray-500">Đối soát và quyết toán hoa hồng trực tiếp vào Số Dư Ví F146/F147</p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl text-xs font-semibold">
                <button
                  onClick={() => setCommissionFilter('ALL')}
                  className={`px-3 py-1 rounded-xl transition-all ${
                    commissionFilter === 'ALL' ? 'bg-white text-gray-900 shadow-sm font-bold' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Tất cả ({commissionHistory.length})
                </button>
                <button
                  onClick={() => setCommissionFilter('PENDING')}
                  className={`px-3 py-1 rounded-xl transition-all ${
                    commissionFilter === 'PENDING' ? 'bg-white text-amber-700 shadow-sm font-bold' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Chờ duyệt
                </button>
                <button
                  onClick={() => setCommissionFilter('APPROVED')}
                  className={`px-3 py-1 rounded-xl transition-all ${
                    commissionFilter === 'APPROVED' ? 'bg-white text-blue-700 shadow-sm font-bold' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Đã duyệt
                </button>
                <button
                  onClick={() => setCommissionFilter('PAID')}
                  className={`px-3 py-1 rounded-xl transition-all ${
                    commissionFilter === 'PAID' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Đã nhận ví
                </button>
              </div>
            </div>

            {commissionHistory.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                Chưa có phát sinh hoa hồng nào trong lịch sử.
              </div>
            ) : (
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                    <tr>
                      <th className="py-2.5 px-3">Mã đơn & Khách hàng</th>
                      <th className="py-2.5 px-3">Gói dịch vụ</th>
                      <th className="py-2.5 px-3">Giá trị đơn</th>
                      <th className="py-2.5 px-3">Tỷ lệ</th>
                      <th className="py-2.5 px-3">Hoa hồng</th>
                      <th className="py-2.5 px-3">Ngày ghi nhận</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                      <th className="py-2.5 px-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {commissionHistory
                      .filter((c) => commissionFilter === 'ALL' || c.status === commissionFilter)
                      .map((comm) => (
                        <tr key={comm.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-gray-900 block">{comm.referredUserName}</span>
                            <span className="font-mono text-[11px] text-gray-400">{comm.orderId}</span>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-gray-700">
                            {comm.planName}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-gray-800">
                            {comm.orderAmount.toLocaleString()} VND
                          </td>
                          <td className="py-2.5 px-3 font-bold text-purple-700">
                            {comm.commissionRate}%
                          </td>
                          <td className="py-2.5 px-3 font-extrabold text-emerald-600">
                            +{comm.commissionAmount.toLocaleString()} VND
                          </td>
                          <td className="py-2.5 px-3 text-gray-500 text-[11px]">
                            {new Date(comm.createdAt).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="py-2.5 px-3 font-bold">
                            <span className={`px-2 py-0.5 rounded-md text-[11px] ${
                              comm.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                              comm.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {comm.status === 'PAID' ? '✓ Đã nhận ví' :
                               comm.status === 'APPROVED' ? 'Đã duyệt đối soát' : '⏳ Chờ đối soát'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {comm.status === 'PENDING' ? (
                              <button
                                onClick={() => handleCommissionAction(comm.id, 'APPROVE')}
                                disabled={actionLoadingId === comm.id}
                                className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 text-[11px] transition-colors inline-flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                Duyệt
                              </button>
                            ) : comm.status === 'APPROVED' ? (
                              <button
                                onClick={() => handleCommissionAction(comm.id, 'PAYOUT')}
                                disabled={actionLoadingId === comm.id}
                                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-colors inline-flex items-center gap-1"
                              >
                                <DollarSign className="w-3 h-3" />
                                Quyết toán vào ví
                              </button>
                            ) : (
                              <span className="text-[11px] text-gray-400 font-medium">
                                Ngày {comm.payoutDate || 'hoàn tất'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Anti-Fraud Inspection (F155) */}
          <div className="p-5 rounded-3xl bg-rose-50/50 border border-rose-200 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-rose-950">Trung Tâm Phòng Chống Gian Lận Tiếp Thị (Anti-Fraud Engine - F155)</h4>
                  <p className="text-xs text-rose-700">Phát hiện tự giới thiệu (Self-referral), trùng IP, giả mạo thiết bị và spam tài khoản rác</p>
                </div>
              </div>

              <button
                onClick={handleRunFraudScan}
                disabled={scanningFraud}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${scanningFraud ? 'animate-spin' : ''}`} />
                {scanningFraud ? 'Đang quét...' : 'Chạy Quét Gian Lận'}
              </button>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-white/80 text-gray-500 border-b border-rose-100">
                  <tr>
                    <th className="py-2.5 px-3">Thời điểm</th>
                    <th className="py-2.5 px-3">Tài khoản khả nghi</th>
                    <th className="py-2.5 px-3">Địa chỉ IP / Thiết bị</th>
                    <th className="py-2.5 px-3">Dấu hiệu phát hiện</th>
                    <th className="py-2.5 px-3">Mức rủi ro</th>
                    <th className="py-2.5 px-3">Biện pháp xử lý</th>
                    <th className="py-2.5 px-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-100/60">
                  {fraudAlerts.map(alert => (
                    <tr key={alert.id} className="hover:bg-white/50">
                      <td className="py-2.5 px-3 text-gray-500">
                        {new Date(alert.detectedAt).toLocaleTimeString('vi-VN')} {new Date(alert.detectedAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-gray-900">
                        {alert.suspectedUserName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-gray-600">
                        {alert.ipAddress} • {alert.deviceFingerprint}
                      </td>
                      <td className="py-2.5 px-3 text-rose-800 font-medium">
                        {alert.reasons.join('; ')}
                      </td>
                      <td className="py-2.5 px-3 font-bold">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] ${
                          alert.riskLevel === 'HIGH_RISK' ? 'bg-rose-100 text-rose-800' :
                          alert.riskLevel === 'SUSPICIOUS' ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {alert.riskLevel} ({alert.riskScore}/100)
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-gray-700">
                        <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${
                          alert.actionTaken === 'COMMISSION_HELD' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          alert.actionTaken === 'SUSPENDED' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                          'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {alert.actionTaken === 'COMMISSION_HELD' ? 'Đang giữ hoa hồng' :
                           alert.actionTaken === 'SUSPENDED' ? 'Đã khóa tài khoản' :
                           alert.actionTaken === 'DISMISSED' ? 'Đã bỏ qua / An toàn' : alert.actionTaken}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {alert.actionTaken !== 'COMMISSION_HELD' && (
                            <button
                              onClick={() => handleUpdateFraudAction(alert.id, 'COMMISSION_HELD')}
                              className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold"
                              title="Chặn giải ngân hoa hồng"
                            >
                              Giữ HH
                            </button>
                          )}
                          {alert.actionTaken !== 'SUSPENDED' && (
                            <button
                              onClick={() => handleUpdateFraudAction(alert.id, 'SUSPENDED')}
                              className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold"
                              title="Đình chỉ tài khoản gian lận"
                            >
                              Khóa TK
                            </button>
                          )}
                          {alert.actionTaken !== 'DISMISSED' && (
                            <button
                              onClick={() => handleUpdateFraudAction(alert.id, 'DISMISSED')}
                              className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold"
                              title="Bỏ qua cảnh báo"
                            >
                              Bỏ qua
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal (F148) */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 text-xs">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <ArrowDownToLine className="w-5 h-5 text-emerald-600" />
                Yêu Cầu Rút Tiền Về Tài Khoản (F148)
              </h3>
              <button onClick={() => setShowWithdrawModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWithdrawal} className="p-5 space-y-4">
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <span className="text-gray-500">Số dư khả dụng:</span>
                <span className="font-extrabold text-sm text-emerald-600">
                  {(wallet?.availableBalance || 0).toLocaleString()} VND
                </span>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Số tiền muốn rút (VND) *</label>
                <input
                  type="number"
                  min="100000"
                  step="10000"
                  required
                  placeholder="Tối thiểu 100.000 VND"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Tài khoản nhận tiền *</label>
                <select
                  value={selectedMethodId}
                  onChange={e => setSelectedMethodId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-medium text-gray-800"
                >
                  {paymentMethods.map(pm => (
                    <option key={pm.id} value={pm.id}>
                      {pm.bankName || pm.type} - {pm.accountNumber} ({pm.accountName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Ghi chú đối soát</label>
                <input
                  type="text"
                  placeholder="Ghi chú cho kế toán (không bắt buộc)..."
                  value={withdrawNote}
                  onChange={e => setWithdrawNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200"
                />
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-800 space-y-1">
                <div className="font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Phí giao dịch: 0 VND (Miễn phí hoàn toàn)
                </div>
                <p>Tiền sẽ được giải ngân tự động qua VietQR trong 15 - 30 phút sau khi duyệt.</p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold text-gray-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingWithdraw}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-sm"
                >
                  {submittingWithdraw ? 'Đang gửi...' : 'Xác Nhận Rút Tiền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Payment Method Modal (F149) */}
      {showAddMethodModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 text-xs">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                Thêm Tài Khoản Nhận Tiền Mới (F149)
              </h3>
              <button onClick={() => setShowAddMethodModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPaymentMethod} className="p-5 space-y-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Loại phương thức *</label>
                <select
                  value={newMethodType}
                  onChange={e => setNewMethodType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-medium"
                >
                  <option value="VIETQR">Ngân hàng Việt Nam (VietQR 24/7)</option>
                  <option value="MOMO">Ví điện tử Momo</option>
                  <option value="PAYPAL">Cổng quốc tế PayPal</option>
                  <option value="CRYPTO">Ví Crypto (USDT BEP20)</option>
                </select>
              </div>

              {newMethodType === 'VIETQR' && (
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Tên ngân hàng *</label>
                  <select
                    value={newBankName}
                    onChange={e => setNewBankName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-medium"
                  >
                    <option value="MB Bank">MB Bank (Quân Đội)</option>
                    <option value="Vietcombank">Vietcombank</option>
                    <option value="Techcombank">Techcombank</option>
                    <option value="VietinBank">VietinBank</option>
                    <option value="BIDV">BIDV</option>
                    <option value="ACB">ACB</option>
                    <option value="VPBank">VPBank</option>
                    <option value="TPBank">TPBank</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {newMethodType === 'MOMO' ? 'Số điện thoại Momo *' :
                   newMethodType === 'PAYPAL' ? 'Email PayPal *' :
                   newMethodType === 'CRYPTO' ? 'Địa chỉ ví USDT *' :
                   'Số tài khoản ngân hàng *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập số tài khoản / địa chỉ..."
                  value={newAccountNumber}
                  onChange={e => setNewAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Tên chủ tài khoản (Không dấu) *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: YẾN NGÔ"
                  value={newAccountName}
                  onChange={e => setNewAccountName(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 uppercase"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowAddMethodModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold text-gray-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-sm"
                >
                  Lưu Phương Thức
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Payment Method Modal */}
      {editingMethod && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 text-xs">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-purple-50/50">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-purple-600" />
                Chỉnh Sửa Tài Khoản Nhận Tiền
              </h3>
              <button onClick={() => setEditingMethod(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePaymentMethod} className="p-5 space-y-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Loại phương thức *</label>
                <select
                  value={editMethodType}
                  onChange={e => setEditMethodType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-medium"
                >
                  <option value="VIETQR">Ngân hàng Việt Nam (VietQR 24/7)</option>
                  <option value="MOMO">Ví điện tử Momo</option>
                  <option value="PAYPAL">Cổng quốc tế PayPal</option>
                  <option value="CRYPTO">Ví Crypto (USDT BEP20)</option>
                </select>
              </div>

              {editMethodType === 'VIETQR' && (
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Tên ngân hàng *</label>
                  <select
                    value={editBankName}
                    onChange={e => setEditBankName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-medium"
                  >
                    <option value="MB Bank">MB Bank (Quân Đội)</option>
                    <option value="Vietcombank">Vietcombank</option>
                    <option value="Techcombank">Techcombank</option>
                    <option value="VietinBank">VietinBank</option>
                    <option value="BIDV">BIDV</option>
                    <option value="ACB">ACB</option>
                    <option value="VPBank">VPBank</option>
                    <option value="TPBank">TPBank</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {editMethodType === 'MOMO' ? 'Số điện thoại Momo *' :
                   editMethodType === 'PAYPAL' ? 'Email PayPal *' :
                   editMethodType === 'CRYPTO' ? 'Địa chỉ ví USDT *' :
                   'Số tài khoản ngân hàng *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập số tài khoản / địa chỉ..."
                  value={editAccountNumber}
                  onChange={e => setEditAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Tên chủ tài khoản (Không dấu) *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: YẾN NGÔ"
                  value={editAccountName}
                  onChange={e => setEditAccountName(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 uppercase"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setEditingMethod(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold text-gray-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-sm"
                >
                  Cập Nhật Phương Thức
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal (F151) */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm border border-gray-100 p-6 text-center space-y-4">
            <h3 className="text-base font-bold text-gray-900">Mã QR Giới Thiệu (F151)</h3>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 inline-block">
              <img
                src={referralProfile?.qrCodeUrl || 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://topify.app'}
                alt="Referral QR Code"
                className="w-48 h-48 mx-auto rounded-xl"
              />
            </div>
            <p className="text-xs text-gray-500">
              Quét mã để truy cập trực tiếp liên kết giới thiệu Topify của bạn
            </p>
            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Custom Referral Code Modal (F151) */}
      {showCustomCodeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 text-xs">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-purple-50/50">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-purple-600" />
                Đổi Mã Giới Thiệu Cá Nhân (F151)
              </h3>
              <button onClick={() => setShowCustomCodeModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateReferralCode} className="p-5 space-y-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Mã giới thiệu mong muốn (Tối thiểu 3 ký tự) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={20}
                    placeholder="VD: TOP-YEN99, MARKETING2026, VIP-TOPIFY"
                    value={customCodeInput}
                    onChange={(e) => setCustomCodeInput(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-mono font-bold text-purple-900 tracking-wider focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Chỉ gồm chữ in hoa không dấu, chữ số và dấu gạch nối (-).
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-100 text-[11px] text-purple-800 space-y-1">
                <div className="font-semibold">Xem trước liên kết giới thiệu mới:</div>
                <div className="font-mono font-bold text-purple-900 truncate">
                  https://topify.app/ref/{customCodeInput || 'YOUR-CODE'}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowCustomCodeModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold text-gray-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingCode}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingCode ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {savingCode ? 'Đang lưu...' : 'Lưu Mã Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simulate Referred User Modal (F152) */}
      {showSimulateUserModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 text-xs">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-blue-50/50">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Giả Lập Khách Hàng Đăng Ký (F152)
              </h3>
              <button onClick={() => setShowSimulateUserModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSimulateReferredUser} className="p-5 space-y-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Tên khách hàng / doanh nghiệp *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Công ty TNHH Thời Trang ABC"
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-medium text-gray-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Email đăng ký *</label>
                <input
                  type="email"
                  required
                  placeholder="VD: contact@thoitrangabc.vn"
                  value={simEmail}
                  onChange={(e) => setSimEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-medium text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Gói dịch vụ</label>
                  <select
                    value={simPlan}
                    onChange={(e: any) => setSimPlan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-medium text-gray-800"
                  >
                    <option value="STARTER">STARTER (299k/tháng)</option>
                    <option value="PRO">PRO CREATOR (599k/tháng)</option>
                    <option value="ENTERPRISE">ENTERPRISE (Doanh nghiệp)</option>
                    <option value="FREE">FREE (Miễn phí)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Trạng thái tài khoản</label>
                  <select
                    value={simStatus}
                    onChange={(e: any) => setSimStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-medium text-gray-800"
                  >
                    <option value="ACTIVE_PAID">Đã thanh toán (Trả phí)</option>
                    <option value="TRIAL">Dùng thử 14 ngày (Trial)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 text-[11px] text-blue-800">
                Thêm khách hàng giả lập sẽ cập nhật ngay lập tức các chỉ số phễu chuyển đổi (Clicks, Đăng ký, Dùng thử, Trả phí) và bảng khách hàng F152.
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowSimulateUserModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold text-gray-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={simulatingUser}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {simulatingUser ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  {simulatingUser ? 'Đang tạo...' : 'Tạo Khách Hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Commission Rule Modal (F153) */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 text-xs">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-purple-50/50">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-purple-600" />
                {editingRule ? 'Chỉnh Sửa Chính Sách Hoa Hồng' : 'Thêm Chính Sách Hoa Hồng Mới'} (F153)
              </h3>
              <button onClick={() => setShowRuleModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCommissionRule} className="p-5 space-y-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Tên gói hoặc Sự kiện áp dụng *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Gói Agency Studio, Chiến dịch Khởi nghiệp 2026"
                  value={ruleForm.planName}
                  onChange={(e) => setRuleForm({ ...ruleForm, planName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-medium text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Tỷ lệ tháng đầu (%) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={ruleForm.firstMonthRate}
                    onChange={(e) => setRuleForm({ ...ruleForm, firstMonthRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-bold text-purple-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Tỷ lệ định kỳ (%) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={ruleForm.recurringRate}
                    onChange={(e) => setRuleForm({ ...ruleForm, recurringRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-bold text-emerald-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Thời hạn Cookie (Ngày)</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={ruleForm.cookieDays}
                    onChange={(e) => setRuleForm({ ...ruleForm, cookieDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-medium text-gray-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Lịch đối soát & chi trả</label>
                  <input
                    type="text"
                    value={ruleForm.payoutSchedule}
                    onChange={(e) => setRuleForm({ ...ruleForm, payoutSchedule: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-medium text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Mô tả chính sách</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú chi tiết điều kiện hưởng hoa hồng..."
                  value={ruleForm.description}
                  onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-medium text-gray-800"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold text-gray-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingRule}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingRule ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {savingRule ? 'Đang lưu...' : 'Lưu Chính Sách'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
