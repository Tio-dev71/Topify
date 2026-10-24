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
  X,
  AlertCircle
} from 'lucide-react';
import api from '../lib/axios';
import { toast } from 'sonner';

export default function WalletEarnings() {
  const [activeTab, setActiveTab] = useState<'balance' | 'transactions' | 'payment_methods' | 'tasks' | 'referral'>('balance');
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
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newBankName, setNewBankName] = useState('Vietcombank');

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

  useEffect(() => {
    fetchWalletData();
    fetchTasks();
    fetchReferralData();
    fetchCommissionData();
    fetchFraudAlerts();
  }, []);

  const fetchWalletData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get('/wallet');
      if (res.data) {
        setWallet(res.data.wallet);
        setTransactions(res.data.transactions || []);
        setWithdrawals(res.data.withdrawals || []);
        setPaymentMethods(res.data.paymentMethods || []);
        if (res.data.paymentMethods?.length > 0) {
          const defaultPm = res.data.paymentMethods.find((p: any) => p.isDefault) || res.data.paymentMethods[0];
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
      if (res.data?.tasks) setEarningTasks(res.data.tasks);
    } catch (e) {}
  };

  const fetchReferralData = async () => {
    try {
      const res = await api.get('/referral');
      if (res.data) {
        setReferralProfile(res.data.profile);
        setReferredUsers(res.data.referredUsers || []);
      }
    } catch (e) {}
  };

  const fetchCommissionData = async () => {
    try {
      const res = await api.get('/referral/commissions');
      if (res.data) {
        setCommissionRules(res.data.rules || []);
        setCommissionHistory(res.data.history || []);
      }
    } catch (e) {}
  };

  const fetchFraudAlerts = async () => {
    try {
      const res = await api.get('/referral/anti-fraud');
      if (res.data?.alerts) setFraudAlerts(res.data.alerts);
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
        fetchWalletData();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi rút tiền');
    } finally {
      setSubmittingWithdraw(false);
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
        accountName: newAccountName,
        accountNumber: newAccountNumber,
        bankName: newMethodType === 'VIETQR' ? newBankName : undefined,
        isDefault: paymentMethods.length === 0,
      });

      if (res.data?.success) {
        toast.success('Đã lưu phương thức nhận tiền thành công');
        setShowAddMethodModal(false);
        setNewAccountName('');
        setNewAccountNumber('');
        fetchWalletData();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi thêm phương thức');
    }
  };

  // Handle Delete Payment Method (F149)
  const handleDeletePaymentMethod = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa phương thức nhận tiền "${name}" khỏi danh sách?`)) {
      return;
    }
    try {
      const res = await api.delete(`/wallet/payment-methods?id=${id}`);
      if (res.data?.success) {
        toast.success(res.data.message || 'Đã xóa phương thức nhận tiền thành công');
        fetchWalletData();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi xóa phương thức nhận tiền');
    }
  };

  // Handle Claim Earning Task (F150)
  const handleClaimTask = async (task: any) => {
    try {
      setClaimingTaskId(task.id);
      const res = await api.post('/wallet/tasks', { taskId: task.id });
      if (res.data?.success) {
        toast.success(res.data.message);

        // 1. Cập nhật ngay lập tức số dư ví
        if (res.data.wallet) {
          setWallet(res.data.wallet);
        } else {
          setWallet((prev: any) => ({
            ...prev,
            availableBalance: (prev?.availableBalance || 0) + (res.data.rewardAmount || task.rewardAmount),
          }));
        }

        // 2. Thêm ngay giao dịch thưởng vào đầu danh sách sổ cái
        if (res.data.transaction) {
          setTransactions((prev: any[]) => [res.data.transaction, ...prev]);
        }

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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {withdrawals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-gray-400">Chưa có lệnh rút tiền nào</td>
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
                        <td className="py-3.5 px-4 text-gray-600">
                          {wd.accountInfo}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            wd.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            wd.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {wd.status === 'COMPLETED' ? 'Hoàn thành' : wd.status === 'PENDING' ? 'Đang duyệt' : wd.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 max-w-xs truncate">
                          {wd.note || '—'}
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
                {transactions.map((tx: any) => (
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
                    <button
                      onClick={() => handleDeletePaymentMethod(pm.id, `${pm.bankName ? pm.bankName + ' - ' : ''}${pm.accountNumber}`)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Xóa tài khoản nhận tiền này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl whitespace-nowrap shrink-0">
                        <Clock className="w-3.5 h-3.5 text-amber-500" /> Đang thực hiện
                      </span>
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

              <button
                onClick={() => setShowQrModal(true)}
                className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <QrCode className="w-4 h-4" />
                Mã QR Giới Thiệu
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-purple-300 block">Liên kết giới thiệu duy nhất:</span>
                  <span className="text-xs font-mono font-bold text-white truncate block max-w-xs">
                    {referralProfile?.referralLink || 'https://topify.app/ref/TOP-VIET99'}
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
                    {referralProfile?.code || 'TOP-VIET99'}
                  </span>
                </div>
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

          {/* Commission Rules Table (F153) */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-gray-900">Chính Sách Hoa Hồng Đa Tầng (Commission Rules - F153)</h4>
                <p className="text-xs text-gray-500">Mức chiết khấu và thời gian lưu trữ cookie theo từng gói dịch vụ</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {commissionRules.map(rule => (
                <div key={rule.id} className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80 space-y-2">
                  <span className="font-bold text-sm text-gray-900 block">{rule.planName}</span>
                  <p className="text-gray-500 text-[11px]">{rule.description}</p>
                  <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between font-semibold">
                    <span className="text-purple-700">Tháng đầu: {rule.firstMonthRate}%</span>
                    <span className="text-emerald-700">Định kỳ: {rule.recurringRate}%</span>
                  </div>
                  <div className="text-[11px] text-gray-400">Cookie: {rule.cookieDays} ngày • {rule.payoutSchedule}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Anti-Fraud Inspection (F155) */}
          <div className="p-5 rounded-3xl bg-rose-50/50 border border-rose-200 space-y-4">
            <div className="flex items-center justify-between">
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
                        <span className="px-2 py-0.5 rounded bg-white border border-rose-200 text-rose-700 text-[11px]">
                          {alert.actionTaken}
                        </span>
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
                    <option value="Vietcombank">Vietcombank</option>
                    <option value="Techcombank">Techcombank</option>
                    <option value="MB Bank">MB Bank (Quân Đội)</option>
                    <option value="VietinBank">VietinBank</option>
                    <option value="BIDV">BIDV</option>
                    <option value="ACB">ACB</option>
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
                  placeholder="VD: NGUYEN VAN A"
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
    </div>
  );
}
