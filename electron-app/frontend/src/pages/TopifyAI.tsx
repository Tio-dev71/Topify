import { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  MessageSquare,
  Video,
  Image as ImageIcon,
  Mic,
  Repeat,
  Cpu,
  Send,
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  Play,
  Pause,
  RefreshCw,
  ExternalLink,
  Sliders,
  Flame,
  Award,
  Zap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Film,
  Volume2,
  X,
  Key,
  ShieldCheck,
  BookOpen,
  Settings,
  Loader2,
  Smartphone
} from 'lucide-react';
import api from '../lib/axios';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';

export interface AdminAiStudioSettings {
  scriptSystemPrompt: string;
  scriptSuggestedTopics: string[];
  scriptBrandVoices: string[];
  headlinesSystemPrompt: string;
  headlinesSuggestedTopics: string[];
  captionsSystemPrompt: string;
  captionsSuggestedProducts: Array<{ name: string; benefits: string; framework: 'AIDA' | 'PAS' | 'BAB' }>;
  imageSystemPrompt: string;
  imageSuggestedPrompts: string[];
  storyboardSystemPrompt: string;
  storyboardSuggestedTopics: string[];
}

export const DEFAULT_STUDIO_SETTINGS: AdminAiStudioSettings = {
  scriptSystemPrompt: 'Bạn là Giám đốc Sáng tạo kịch bản TikTok/Reels triệu view hàng đầu. Hãy tạo kịch bản 3 phần sắc nét (Hook 3s gây tò mò, Body 3 bước giải pháp, CTA kêu gọi hành động) được tối ưu cho thuật toán giữ chân người xem của TikTok.',
  scriptSuggestedTopics: [
    'Quán ốc ngon & F&B ẩm thực đường phố',
    'Review mỹ phẩm son dưỡng cấp ẩm tự nhiên',
    'Thời trang nữ công sở thanh lịch tôn dáng',
    'Gia dụng thông minh tiện lợi cho căn hộ',
    'Khóa học tiếng Anh giao tiếp phản xạ',
    'Spa trị mụn & chăm sóc da chuyên sâu',
    'Bí quyết kinh doanh đồ ăn vặt online đắt khách'
  ],
  scriptBrandVoices: [
    'Hào hứng, cuốn hút, kích thích tò mò',
    'Hài hước, dí dỏm, bắt trend Gen Z',
    'Chuyên gia chuyên sâu, uy tín, số liệu',
    'Tâm sự, nhẹ nhàng, chạm cảm xúc',
    'Nhanh gọn, dứt khoát, hướng hành động'
  ],
  headlinesSystemPrompt: 'Bạn là Bậc thầy giật tít Viral & Copywriter xuất sắc. Hãy tạo 5 tiêu đề kích thích nhấp chuột (High CTR) cho chủ đề theo đúng 5 góc độ tâm lý: FOMO, CURIOSITY, HOW_TO, CONTROVERSIAL, STATISTIC.',
  headlinesSuggestedTopics: [
    'Kinh doanh F&B ẩm thực online',
    'Tối ưu ngân sách TikTok Ads',
    'Bí quyết chốt đơn không cần giảm giá',
    'Xây dựng thương hiệu cá nhân triệu view',
    'Sai lầm chí mạng khiến video bị bóp tương tác'
  ],
  captionsSystemPrompt: 'Bạn là Copywriter bán hàng thôi miên hàng đầu. Hãy viết bài viết quảng cáo chuyển đổi cao theo các công thức kinh điển (AIDA, PAS, BAB) với Headline giật tít, nội dung thuyết phục và Call-to-action mạnh mẽ.',
  captionsSuggestedProducts: [
    { name: 'Serum dưỡng trắng mờ thâm', benefits: 'Mờ thâm mụn sau 7 ngày, dưỡng sáng mịn màng không bắt nắng', framework: 'AIDA' },
    { name: 'Nồi chiên không dầu 8L cảm ứng', benefits: 'Giảm 90% dầu mỡ, nướng gà nguyên con trong 25 phút', framework: 'PAS' },
    { name: 'Khóa học Livestream thực chiến', benefits: 'Tự tin nói trước ống kính, nắm trọn kịch bản chốt 100 đơn/phiên', framework: 'BAB' }
  ],
  imageSystemPrompt: 'Chuyên gia thiết kế mỹ thuật số và Prompt Engineer cho mô hình Text-to-Image AI. Tối ưu mô tả hình ảnh sang tiếng Anh chi tiết, màu sắc, ánh sáng, góc chụp và phong cách nghệ thuật sắc nét.',
  imageSuggestedPrompts: [
    'Futuristic AI Marketing Dashboard with holographic neon charts, 3D render',
    'Cyberpunk glowing city night market with neon signs and futuristic trees',
    'Minimalist aesthetic cosmetic bottle on clean pastel podium with soft shadow',
    'Realistic Vietnamese coffee shop street view in Hanoi autumn morning',
    'Anime style girl creator recording livestream in cozy glowing studio'
  ],
  storyboardSystemPrompt: 'Bạn là Đạo diễn Storyboard video ngắn chuyên nghiệp. Hãy thiết kế storyboard 3-4 cảnh quay chi tiết gồm góc máy (cameraMovement), mô tả hình ảnh (visualPrompt), lời thoại (voiceover) và âm nhạc nền (bgmMood).',
  storyboardSuggestedTopics: [
    'Giới thiệu ứng dụng Topify tự động hóa bán hàng',
    'Hành trình khởi nghiệp từ quán ốc vỉa hè lên chuỗi cửa hàng',
    'Một ngày làm việc hiệu quả của Content Creator',
    'Hướng dẫn 3 bước chăm sóc da buổi sáng chuẩn Hàn Quốc'
  ]
};

interface PersonaItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
  systemPrompt: string;
  welcomeMessage?: string;
  isCustom?: boolean;
}

const DEFAULT_PERSONAS: PersonaItem[] = [
  {
    id: 'MARKETING_STRATEGIST',
    name: 'Chiến Lược Gia Marketing',
    emoji: '🎯',
    description: 'Chuyên gia hoạch định chiến lược kinh doanh số, tối ưu hóa phễu và ngân sách đa kênh',
    systemPrompt: 'Bạn là Giám đốc Marketing kỳ cựu với 15 năm kinh nghiệm thực chiến trong các chiến dịch đa kênh tại Việt Nam. Bạn tư vấn dựa trên số liệu, ROI thực tế, xây dựng phễu khách hàng bền vững và đề xuất các giải pháp tăng trưởng thực thi được ngay.',
    welcomeMessage: 'Xin chào! Tôi là Trợ lý Chiến Lược Marketing Topify AI. Tôi có thể giúp bạn lập kế hoạch chiến dịch, phân bổ ngân sách và thiết kế phễu chuyển đổi đa kênh. Bạn đang quan tâm đến mục tiêu nào?',
    isCustom: false,
  },
  {
    id: 'VIRAL_COPYWRITER',
    name: 'Copywriter Viral Triệu View',
    emoji: '✍️',
    description: 'Bậc thầy viết kịch bản video ngắn, tiêu đề giật tít, caption bán hàng thôi miên',
    systemPrompt: 'Bạn là Bậc thầy sáng tạo nội dung mạng xã hội TikTok, Facebook, Shopee với hàng trăm video triệu view. Bạn chuyên viết nội dung giàu cảm xúc, sử dụng thành thạo các khung AIDA, PAS, BAB, tạo Hook 3 giây đầu giữ chân người xem tuyệt đối.',
    welcomeMessage: 'Chào bạn! Tôi là Chuyên gia Copywriting Viral. Hãy gửi cho tôi sản phẩm hoặc ý tưởng của bạn, tôi sẽ giúp bạn biến nó thành kịch bản triệu view và caption thôi miên khách hàng!',
    isCustom: false,
  },
  {
    id: 'SALES_CLOSER',
    name: 'Chuyên Viên Chốt Sales & CSKH',
    emoji: '🤝',
    description: 'Kịch bản đàm phán, xử lý từ chối về giá và kỹ thuật chốt đơn tự động tỷ lệ cao',
    systemPrompt: 'Bạn là Chuyên gia đào tạo bán hàng và chốt sale thực chiến. Bạn cung cấp kịch bản xử lý mọi tình huống từ chối của khách hàng (về giá, đối thủ, thời gian suy nghĩ), khéo léo biến phản đối thành cơ hội chốt đơn thần tốc.',
    welcomeMessage: 'Chào bạn! Tôi là Trợ lý Chốt Sales & Xử Lý Từ Chối. Tôi sẽ cung cấp cho bạn những kịch bản telesales và tin nhắn chốt đơn tỷ lệ chuyển đổi cao nhất.',
    isCustom: false,
  },
  {
    id: 'AUTO_TECH',
    name: 'Kỹ Thuật Viên Tự Động Hóa',
    emoji: '⚡',
    description: 'Thiết kế quy trình workflow, kịch bản trigger, webhook và tích hợp hệ thống',
    systemPrompt: 'Bạn là Kỹ sư Tự động hóa hệ thống Topify. Bạn hướng dẫn người dùng thiết lập các luồng tự động hóa tương tác, bắt tin nhắn theo từ khóa, điều phối tác vụ nhân viên và tối ưu hiệu suất quy trình không để sót khách hàng.',
    welcomeMessage: 'Chào bạn! Tôi là Chuyên viên Kỹ thuật & Tự động hóa Topify. Tôi sẵn sàng hỗ trợ bạn thiết lập các kịch bản Trigger, Condition và kết nối Webhook mượt mà.',
    isCustom: false,
  },
];

export default function TopifyAI() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'chat' | 'content' | 'voice' | 'repurpose_models'>('chat');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // User auth & Admin state
  const userData = localStorage.getItem('topify_user') || localStorage.getItem('user');
  let user: any = null;
  try {
    user = userData ? JSON.parse(userData) : null;
  } catch (e) {
    user = null;
  }
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN' || isSuperAdmin;
  const canManagePersonas = isAdmin;

  // ==========================================
  // TAB 1: CHAT ASSISTANT STATE (F156)
  // ==========================================
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [personas, setPersonas] = useState<PersonaItem[]>(DEFAULT_PERSONAS);
  const [selectedPersona, setSelectedPersona] = useState<string>('MARKETING_STRATEGIST');

  // Modal 1: Create Session Modal state
  const [isCreateSessionModalOpen, setIsCreateSessionModalOpen] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionPersona, setNewSessionPersona] = useState('MARKETING_STRATEGIST');
  const [newSessionPrompt, setNewSessionPrompt] = useState('');

  // Modal 2: Persona Manager Modal state (Admin only)
  const [isPersonaManagerModalOpen, setIsPersonaManagerModalOpen] = useState(false);
  const [newPersonaName, setNewPersonaName] = useState('');
  const [newPersonaEmoji, setNewPersonaEmoji] = useState('🛍️');
  const [newPersonaDescription, setNewPersonaDescription] = useState('');
  const [newPersonaPrompt, setNewPersonaPrompt] = useState('');

  // Modal 4: Prompt Viewer Modal state
  const [showPromptViewerModal, setShowPromptViewerModal] = useState(false);

  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const currentPersonaObj = personas.find((p) => p.id === (currentSession?.persona || selectedPersona)) || personas[0];

  // ==========================================
  // DEDICATED GENERATION LOADERS
  // ==========================================
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingHeadlines, setIsGeneratingHeadlines] = useState(false);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

  // ==========================================
  // ADMIN STUDIO SETTINGS (F157)
  // ==========================================
  const [adminSettings, setAdminSettings] = useState<AdminAiStudioSettings>(DEFAULT_STUDIO_SETTINGS);
  const [isAdminStudioSettingsModalOpen, setIsAdminStudioSettingsModalOpen] = useState(false);
  const [adminStudioTab, setAdminStudioTab] = useState<'content'>('content');
  const [adminKeyTarget, setAdminKeyTarget] = useState<'persona' | 'studio'>('persona');

  // ==========================================
  // TAB 2: CONTENT GENERATOR STATE (F157)
  // ==========================================
  const [contentSubTab, setContentSubTab] = useState<'script' | 'headline' | 'caption'>('script');
  const [scriptTopic, setScriptTopic] = useState('');
  const [scriptVoice, setScriptVoice] = useState('Hào hứng, cuốn hút, kích thích tò mò');
  const [scriptDuration, setScriptDuration] = useState(45);
  const [generatedScript, setGeneratedScript] = useState<any>(null);

  const [headlineTopic, setHeadlineTopic] = useState('');
  const [generatedHeadlines, setGeneratedHeadlines] = useState<any[]>([]);

  const [captionProduct, setCaptionProduct] = useState('');
  const [captionBenefits, setCaptionBenefits] = useState('');
  const [captionFramework, setCaptionFramework] = useState<'AIDA' | 'PAS' | 'BAB'>('AIDA');
  const [generatedCaption, setGeneratedCaption] = useState<any>(null);

  // ==========================================
  // TAB 5: VOICE TTS STUDIO STATE (F160)
  // ==========================================
  const [voiceText, setVoiceText] = useState('');
  const [selectedVoiceId, setSelectedVoiceId] = useState('vi-VN-HoaiMy');
  const [voiceTone, setVoiceTone] = useState<'ENTHUSIASTIC' | 'PROFESSIONAL' | 'EMOTIONAL' | 'NEWS'>('ENTHUSIASTIC');
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [voiceList, setVoiceList] = useState<any[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // ==========================================
  // TAB 6: REPURPOSE & MODEL ROUTING STATE (F161 & F162)
  // ==========================================
  const [repurposeInput, setRepurposeInput] = useState('');
  const [repurposePackages, setRepurposePackages] = useState<any[]>([]);
  const [activeRepurpose, setActiveRepurpose] = useState<any>(null);

  const [aiModels, setAiModels] = useState<any[]>([]);
  const [gatewayStatus, setGatewayStatus] = useState<any>(null);

  // ==========================================
  // INITIAL FETCH
  // ==========================================
  useEffect(() => {
    fetchChatSessions();
    fetchStudioSettings();
    fetchVoices();
    fetchRepurposed();
    fetchModels();
  }, []);

  useEffect(() => {
    if (searchParams.get('manage_personas') === 'true' && isAdmin) {
      setActiveTab('chat');
      setIsPersonaManagerModalOpen(true);
    }
  }, [searchParams, isAdmin]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Đã sao chép vào bộ nhớ tạm!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Chat APIs & Persona Handlers
  const fetchChatSessions = async () => {
    try {
      const res = await api.get('/ai/studio/chat');
      if (res.data?.sessions) {
        setSessions(res.data.sessions);
        if (res.data.sessions.length > 0 && !currentSessionId) {
          setCurrentSessionId(res.data.sessions[0].id);
          setChatMessages(res.data.sessions[0].messages || []);
          if (res.data.sessions[0].persona) {
            setSelectedPersona(res.data.sessions[0].persona);
          }
        }
      }
      if (res.data?.personas && res.data.personas.length > 0) {
        // Merge with any custom personas saved in localStorage
        const localCustom = localStorage.getItem('topify_custom_personas');
        let parsedLocal: PersonaItem[] = [];
        try {
          parsedLocal = localCustom ? JSON.parse(localCustom) : [];
        } catch (e) {
          parsedLocal = [];
        }
        const mergedMap = new Map<string, PersonaItem>();
        res.data.personas.forEach((p: PersonaItem) => mergedMap.set(p.id, p));
        parsedLocal.forEach((p: PersonaItem) => {
          if (!mergedMap.has(p.id)) mergedMap.set(p.id, p);
        });
        setPersonas(Array.from(mergedMap.values()));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectSession = (session: any) => {
    setCurrentSessionId(session.id);
    setChatMessages(session.messages || []);
    if (session.persona) {
      setSelectedPersona(session.persona);
    }
  };

  const handleSelectPersonaQuick = (personaId: string) => {
    setSelectedPersona(personaId);
    const p = personas.find((item) => item.id === personaId);
    if (p) {
      toast.info(`Đã chọn vai trò: ${p.emoji} ${p.name}`);
    }
  };

  const handleOpenCreateSessionModal = () => {
    const activePersonaObj = personas.find((p) => p.id === selectedPersona) || personas[0];
    const defaultPersonaId = activePersonaObj ? activePersonaObj.id : 'MARKETING_STRATEGIST';
    setNewSessionTitle(`Tư vấn ${activePersonaObj ? activePersonaObj.name : 'Chiến Lược'}`);
    setNewSessionPersona(defaultPersonaId);
    setNewSessionPrompt(activePersonaObj?.systemPrompt || '');
    setIsCreateSessionModalOpen(true);
  };

  const handleModalPersonaChange = (personaId: string) => {
    setNewSessionPersona(personaId);
    const p = personas.find((item) => item.id === personaId);
    if (p) {
      setNewSessionPrompt(p.systemPrompt || '');
      if (!newSessionTitle || newSessionTitle.startsWith('Tư vấn ') || newSessionTitle.startsWith('Phiên ')) {
        setNewSessionTitle(`Tư vấn ${p.name}`);
      }
    }
  };

  const handleConfirmCreateSession = async () => {
    if (!newSessionTitle.trim()) {
      toast.error('Vui lòng nhập tên phiên trò chuyện');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/ai/studio/chat', {
        action: 'create_session',
        title: newSessionTitle.trim(),
        persona: newSessionPersona,
        systemPrompt: newSessionPrompt.trim(),
      });
      if (res.data?.session) {
        setSessions([res.data.session, ...sessions]);
        setCurrentSessionId(res.data.session.id);
        setChatMessages(res.data.session.messages || []);
        setSelectedPersona(res.data.session.persona);
        setIsCreateSessionModalOpen(false);
        toast.success(`Đã khởi tạo phiên "${res.data.session.title}" với prompt đào tạo chuyên sâu!`);
      }
    } catch (e: any) {
      toast.error('Lỗi khởi tạo phiên chat');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudioSettings = async () => {
    try {
      const res = await api.get('/ai/studio/settings');
      if (res.data?.settings) {
        setAdminSettings(res.data.settings);
      }
    } catch (e) {
      console.error('fetchStudioSettings error', e);
    }
  };

  const handleSaveAdminStudioSettings = async (updated: AdminAiStudioSettings) => {
    try {
      setLoading(true);
      const adminKey = localStorage.getItem('topify_ai_admin_key_val') || 'topify-admin';
      const res = await api.post('/ai/studio/settings', { settings: updated, adminKey });
      if (res.data?.settings) {
        setAdminSettings(res.data.settings);
        toast.success('Đã lưu cấu hình Prompt & Chủ đề hệ thống thành công!');
        setIsAdminStudioSettingsModalOpen(false);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi lưu cấu hình studio');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStudioAdminSettings = () => {
    setAdminStudioTab('content');
    setIsAdminStudioSettingsModalOpen(true);
  };

  const handleOpenPersonaManager = () => {
    setIsPersonaManagerModalOpen(true);
  };

  const handleCreateCustomPersona = async () => {
    if (!newPersonaName.trim()) {
      toast.error('Vui lòng nhập tên vai trò trợ lý');
      return;
    }
    if (!newPersonaPrompt.trim()) {
      toast.error('Vui lòng nạp prompt đào tạo / chỉ dẫn cho vai trò');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/ai/studio/chat', {
        action: 'create_persona',
        name: newPersonaName.trim(),
        emoji: newPersonaEmoji || '🤖',
        description: newPersonaDescription.trim(),
        systemPrompt: newPersonaPrompt.trim(),
        createdBy: user?.name || 'Admin',
      });
      if (res.data?.personas) {
        setPersonas(res.data.personas);
        const customOnly = res.data.personas.filter((p: any) => p.isCustom);
        localStorage.setItem('topify_custom_personas', JSON.stringify(customOnly));
      }
      toast.success(`Đã thêm vai trò trợ lý "${newPersonaName}" thành công!`);
      setNewPersonaName('');
      setNewPersonaDescription('');
      setNewPersonaPrompt('');
      if (res.data?.persona) {
        setSelectedPersona(res.data.persona.id);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi tạo vai trò trợ lý mới');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomPersona = async (personaId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.post('/ai/studio/chat', {
        action: 'delete_persona',
        personaId,
      });
      if (res.data?.personas) {
        setPersonas(res.data.personas);
        const customOnly = res.data.personas.filter((p: any) => p.isCustom);
        localStorage.setItem('topify_custom_personas', JSON.stringify(customOnly));
        if (selectedPersona === personaId) {
          setSelectedPersona('MARKETING_STRATEGIST');
        }
        toast.success('Đã xóa vai trò trợ lý');
      }
    } catch (e: any) {
      toast.error('Không thể xóa vai trò này');
    }
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/ai/studio/chat?sessionId=${id}`);
      const filtered = sessions.filter((s) => s.id !== id);
      setSessions(filtered);
      if (currentSessionId === id) {
        if (filtered.length > 0) {
          handleSelectSession(filtered[0]);
        } else {
          setCurrentSessionId('');
          setChatMessages([]);
        }
      }
      toast.success('Đã xóa phiên hội thoại');
    } catch (e) {
      toast.error('Không thể xóa phiên');
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentSessionId) return;
    const userText = inputMessage;
    setInputMessage('');

    // Optimistic user message
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userText,
      createdAt: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, tempUserMsg]);

    try {
      setLoading(true);
      const res = await api.post('/ai/studio/chat', {
        action: 'send_message',
        sessionId: currentSessionId,
        message: userText,
      });
      if (res.data?.reply) {
        setChatMessages((prev) => [...prev, res.data.reply]);
        fetchChatSessions();
      }
    } catch (e: any) {
      toast.error('Gửi tin nhắn thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Content APIs
  const handleGenerateScript = async () => {
    if (!scriptTopic.trim()) {
      toast.error('Vui lòng nhập chủ đề video');
      return;
    }
    try {
      setIsGeneratingScript(true);
      const res = await api.post('/ai/studio/content', {
        type: 'video_script',
        topic: scriptTopic,
        brandVoice: scriptVoice,
        targetDuration: scriptDuration,
        systemPrompt: adminSettings?.scriptSystemPrompt,
      });
      if (res.data?.script) {
        setGeneratedScript(res.data.script);
        toast.success('Đã tạo kịch bản video TikTok thành công!');
      }
    } catch (e) {
      toast.error('Lỗi khi sinh kịch bản');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleGenerateHeadlines = async () => {
    if (!headlineTopic.trim()) {
      toast.error('Vui lòng nhập chủ đề tiêu đề');
      return;
    }
    try {
      setIsGeneratingHeadlines(true);
      const res = await api.post('/ai/studio/content', {
        type: 'viral_headlines',
        topic: headlineTopic,
        systemPrompt: adminSettings?.headlinesSystemPrompt,
      });
      if (res.data?.headlines) {
        setGeneratedHeadlines(res.data.headlines);
        toast.success('Đã tạo 5 tiêu đề viral giật tít!');
      }
    } catch (e) {
      toast.error('Lỗi sinh tiêu đề');
    } finally {
      setIsGeneratingHeadlines(false);
    }
  };

  const handleGenerateCaptions = async () => {
    if (!captionProduct.trim() || !captionBenefits.trim()) {
      toast.error('Vui lòng nhập đủ tên sản phẩm và lợi ích');
      return;
    }
    try {
      setIsGeneratingCaption(true);
      const res = await api.post('/ai/studio/content', {
        type: 'captions',
        productName: captionProduct,
        benefits: captionBenefits,
        framework: captionFramework,
        systemPrompt: adminSettings?.captionsSystemPrompt,
      });
      if (res.data?.caption) {
        setGeneratedCaption(res.data.caption);
        toast.success(`Đã tạo Caption bán hàng theo công thức ${captionFramework}!`);
      }
    } catch (e) {
      toast.error('Lỗi sinh caption');
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  // Voice APIs
  const fetchVoices = async () => {
    try {
      const res = await api.get('/ai/studio/voice');
      if (res.data?.voices) setVoiceList(res.data.voices);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateVoice = async () => {
    if (!voiceText.trim()) {
      toast.error('Vui lòng nhập văn bản cần đọc');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/ai/studio/voice', {
        text: voiceText,
        voiceId: selectedVoiceId,
        tone: voiceTone,
        speed: voiceSpeed,
      });
      if (res.data?.voice) {
        setVoiceList([res.data.voice, ...voiceList]);
        toast.success('Đã chuyển văn bản thành giọng đọc AI (TTS) thành công!');
      }
    } catch (e) {
      toast.error('Lỗi tạo giọng đọc');
    } finally {
      setLoading(false);
    }
  };

  // Repurpose APIs
  const fetchRepurposed = async () => {
    try {
      const res = await api.get('/ai/studio/repurpose');
      if (res.data?.packages) {
        setRepurposePackages(res.data.packages);
        if (res.data.packages.length > 0) setActiveRepurpose(res.data.packages[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRepurposeContent = async () => {
    if (repurposeInput.trim().length < 20) {
      toast.error('Bài viết cần ít nhất 20 ký tự để tái chế');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/ai/studio/repurpose', {
        text: repurposeInput,
      });
      if (res.data?.package) {
        setRepurposePackages([res.data.package, ...repurposePackages]);
        setActiveRepurpose(res.data.package);
        toast.success('Đã tái chế nội dung thành công thành 4 định dạng đa kênh!');
      }
    } catch (e) {
      toast.error('Lỗi tái chế bài viết');
    } finally {
      setLoading(false);
    }
  };

  // Models & Routing APIs
  const fetchModels = async () => {
    try {
      const res = await api.get('/ai/studio/models');
      if (res.data?.models) setAiModels(res.data.models);
      if (res.data?.gateway) setGatewayStatus(res.data.gateway);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSwitchModel = async (modelId: string) => {
    try {
      const res = await api.post('/ai/studio/models', {
        action: 'switch_model',
        modelId,
      });
      if (res.data?.success) {
        setAiModels(res.data.models);
        setGatewayStatus(res.data.gateway);
        toast.success(`Đã chuyển sang mô hình AI: ${modelId}`);
      }
    } catch (e) {
      toast.error('Không thể chuyển đổi model');
    }
  };

  const handlePingGateway = async () => {
    try {
      const res = await api.post('/ai/studio/models', {
        action: 'ping_gateway',
      });
      if (res.data?.success) {
        setGatewayStatus(res.data.gateway);
        toast.success(`Đo độ trễ thành công: ${res.data.latencyMs}ms!`);
      }
    } catch (e) {
      toast.error('Không thể kiểm tra kết nối');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                Topify AI Studio
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                  Topify AI Cloud v2.5
                </span>
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Trung tâm sáng tạo toàn diện: Trợ lý đàm thoại (F156), Video Script & Content Viral (F157) & Tái chế đa kênh (F161)
              </p>
            </div>
          </div>
        </div>

        {/* Gateway quick status */}
        {gatewayStatus && (
          <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${gatewayStatus.status === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-gray-800 font-medium">{gatewayStatus.activeModel}</span>
            </div>
            <div className="h-3 w-[1px] bg-gray-200" />
            <span className="text-gray-500">{gatewayStatus.latencyMs}ms</span>
            <div className="h-3 w-[1px] bg-gray-200" />
            <span className="text-blue-600 font-medium">{gatewayStatus.status === 'ONLINE' ? 'AI Sẵn Sàng' : 'AI Offline'}</span>
          </div>
        )}
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3 mb-6">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'chat'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Bot className="w-4 h-4" />
          Trợ Lý AI (F156)
        </button>

        <button
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'content'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Flame className="w-4 h-4" />
          Sáng Tạo Nội Dung (F157)
        </button>

        <button
          onClick={() => setActiveTab('repurpose_models')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'repurpose_models'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Repeat className="w-4 h-4" />
          Tái Chế Đa Kênh (F161)
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AI CHAT ASSISTANT (F156) */}
      {/* ========================================================================= */}
      {activeTab === 'chat' && (
        <div className="flex flex-col lg:flex-row gap-5 h-[calc(100vh-230px)] min-h-[580px]">
          {/* Left: Chat Sessions & Persona */}
          <div className="w-full lg:w-80 xl:w-[340px] shrink-0 bg-white border border-gray-200 rounded-2xl p-4 flex flex-col justify-between overflow-hidden shadow-xs">
            <div className="flex flex-col min-h-0 flex-1">
              <div className="flex items-center justify-between mb-4 gap-2">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 whitespace-nowrap">
                  <MessageSquare className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Phiên Trò Chuyện</span>
                </h3>
                <button
                  onClick={handleOpenCreateSessionModal}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0 active:scale-95 cursor-pointer"
                  title="Tạo phiên mới kèm Prompt nạp"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Mới</span>
                </button>
              </div>

              {/* Persona selector for current chat / quick switch */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <label className="text-xs text-gray-700 font-semibold whitespace-nowrap">
                    Vai trò Trợ lý (Persona):
                  </label>
                  {isAdmin && (
                    <button
                      onClick={handleOpenPersonaManager}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 hover:underline whitespace-nowrap shrink-0"
                      title="Bảng điều khiển Quản lý vai trò (Dành riêng cho Admin)"
                    >
                      <Settings className="w-3 h-3 shrink-0" />
                      <span>Quản lý vai trò (Admin)</span>
                    </button>
                  )}
                </div>
                <select
                  value={selectedPersona}
                  onChange={(e: any) => handleSelectPersonaQuick(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium cursor-pointer shadow-2xs"
                >
                  {personas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.emoji} {p.name} {p.isCustom ? '⭐ (Tùy chỉnh)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Session list */}
              <div className="space-y-1.5 overflow-y-auto flex-1 pr-1 min-h-0">
                {sessions.map((sess) => {
                  const isCur = sess.id === currentSessionId;
                  return (
                    <div
                      key={sess.id}
                      onClick={() => handleSelectSession(sess)}
                      className={`group flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all ${
                        isCur
                          ? 'bg-blue-50/90 border border-blue-200 text-blue-900 font-semibold shadow-2xs'
                          : 'bg-gray-50/70 hover:bg-gray-100 border border-transparent text-gray-700'
                      }`}
                      title={sess.title}
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <p className="truncate font-medium text-xs text-gray-900">{sess.title}</p>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-400">
                          <span className="shrink-0 whitespace-nowrap">
                            {new Date(sess.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                          {sess.personaName && (
                            <span className="text-blue-600 font-medium truncate">• {sess.personaName}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteSession(sess.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-all shrink-0"
                        title="Xóa phiên"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Persona Quick Indicator */}
            <div className="pt-3 mt-3 border-t border-gray-100 text-[11px] flex items-center gap-1.5 min-w-0">
              <span className="text-gray-400 shrink-0 whitespace-nowrap">Đang trò chuyện cùng:</span>
              <span
                className="text-blue-600 font-semibold truncate"
                title={currentPersonaObj ? `${currentPersonaObj.emoji} ${currentPersonaObj.name}` : selectedPersona}
              >
                {currentPersonaObj ? `${currentPersonaObj.emoji} ${currentPersonaObj.name}` : selectedPersona}
              </span>
            </div>
          </div>

          {/* Right: Messages Area */}
          <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-2xl flex flex-col justify-between overflow-hidden shadow-xs">
            {/* Chat Panel Header */}
            <div className="px-5 py-3 border-b border-gray-200 bg-gray-50/70 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
                  {currentPersonaObj?.emoji || '🤖'}
                </div>
                <div className="min-w-0 flex-1">
                  <h4
                    className="text-sm font-semibold text-gray-900 truncate"
                    title={currentSession?.title || 'Phiên trò chuyện Topify AI'}
                  >
                    {currentSession?.title || 'Phiên trò chuyện Topify AI'}
                  </h4>
                  <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5 min-w-0">
                    <span className="truncate">
                      Vai trò: <strong className="text-blue-600 font-semibold">{currentSession?.personaName || currentPersonaObj?.name || 'Trợ lý AI'}</strong>
                    </span>
                    {currentSession?.systemPrompt && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/80 shrink-0 whitespace-nowrap">
                        ✓ Đã nạp Prompt
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                {currentSession?.systemPrompt && (
                  <button
                    onClick={() => setShowPromptViewerModal(true)}
                    className="px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center gap-1.5 shadow-2xs transition-colors font-medium hover:border-gray-300"
                    title="Xem nội dung prompt đào tạo của phiên này"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span className="whitespace-nowrap">Xem Prompt nạp</span>
                  </button>
                )}
                <button
                  onClick={handleOpenCreateSessionModal}
                  className="px-3 py-1.5 text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-2xs transition-colors font-semibold"
                  title="Khởi tạo phiên mới"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">Phiên mới</span>
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-3 text-blue-600">
                    <Bot className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-semibold text-gray-900 mb-1">Trợ lý Topify AI đã sẵn sàng</h4>
                  <p className="text-xs text-gray-500 max-w-md mb-6">
                    Đặt câu hỏi về kịch bản video, chiến dịch bán hàng, công thức viết quảng cáo hoặc tối ưu tự động hóa.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-lg w-full text-left">
                    {[
                      'Làm thế nào để tăng tương tác bài viết Reels?',
                      'Soạn kịch bản flash sale TikTok 30s ngành thời trang',
                      'Cách xử lý khi khách hàng chê giá sản phẩm cao?',
                      'Gợi ý 5 công thức viết tiêu đề giật tít AIDA',
                    ].map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInputMessage(prompt);
                        }}
                        className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs text-gray-700 transition-colors"
                      >
                        💡 {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          isUser
                            ? 'bg-blue-600 text-white rounded-tr-none shadow-xs'
                            : 'bg-gray-50 border border-gray-200 text-gray-800 rounded-tl-none'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                        {!isUser && (
                          <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-500">
                            <span>{msg.modelUsed || 'Topify AI'}</span>
                            <button
                              onClick={() => handleCopy(msg.content, msg.id)}
                              className="flex items-center gap-1 hover:text-gray-900"
                            >
                              {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedId === msg.id ? 'Đã copy' : 'Sao chép'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              {loading && (
                <div className="flex items-center gap-3 text-gray-500 text-xs pl-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                  <span>Topify AI đang suy nghĩ và phản hồi...</span>
                </div>
              )}
            </div>

            {/* Input Form */}
            <div className="p-3 border-t border-gray-200 bg-gray-50/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Nhập câu hỏi hoặc yêu cầu cho Topify AI..."
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={loading || !inputMessage.trim()}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium flex items-center gap-2 shadow-sm transition-all"
                >
                  <Send className="w-4 h-4" />
                  Gửi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CONTENT GENERATOR (F157) */}
      {/* ========================================================================= */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Sub-tabs & Admin Configuration Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setContentSubTab('script')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  contentSubTab === 'script'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                🎬 Kịch Bản Video TikTok/Reels (30s - 60s)
              </button>
              <button
                onClick={() => setContentSubTab('headline')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  contentSubTab === 'headline'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                💥 5 Tiêu Đề Viral Giật Tít
              </button>
              <button
                onClick={() => setContentSubTab('caption')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  contentSubTab === 'caption'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                📝 Caption Bán Hàng AIDA / PAS / BAB
              </button>
            </div>

            {isAdmin && (
              <button
                onClick={() => handleOpenStudioAdminSettings()}
                className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-all shadow-2xs shrink-0"
                title="Quản trị Prompt & Chủ đề mẫu (Dành riêng cho Admin)"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Quản Trị Prompt & Chủ Đề (Admin)</span>
              </button>
            )}
          </div>

          {/* SubTab 1: Script Generator */}
          {contentSubTab === 'script' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Film className="w-5 h-5 text-blue-600" />
                  Cấu Hình Kịch Bản Video
                </h3>

                <div>
                  <label className="text-xs text-gray-600 block mb-1 font-medium">Chủ đề / Sản phẩm video:</label>
                  <textarea
                    rows={3}
                    value={scriptTopic}
                    onChange={(e) => setScriptTopic(e.target.value)}
                    placeholder="VD: Quán ốc ngon, kem chống nắng kiểm dầu, mẹo kinh doanh online..."
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  {/* Quick Topics Configured by Admin */}
                  <div className="flex flex-wrap items-center gap-1 mt-2">
                    <span className="text-[11px] text-gray-500 font-medium">Chủ đề mẫu:</span>
                    {(adminSettings?.scriptSuggestedTopics || []).map((t, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setScriptTopic(t)}
                        className="text-[11px] px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-700 transition-colors border border-gray-200"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-600 block mb-1 font-medium">Văn phong / Brand Voice:</label>
                  <input
                    type="text"
                    value={scriptVoice}
                    onChange={(e) => setScriptVoice(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <div className="flex flex-wrap items-center gap-1 mt-2">
                    {(adminSettings?.scriptBrandVoices || []).map((v, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setScriptVoice(v)}
                        className={`text-[10px] px-2 py-0.5 rounded-lg transition-colors border ${
                          scriptVoice === v
                            ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-200'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-600 block mb-1 font-medium">Thời lượng mục tiêu:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[15, 30, 45, 60].map((dur) => (
                      <button
                        key={dur}
                        onClick={() => setScriptDuration(dur)}
                        className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          scriptDuration === dur
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {dur} giây
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerateScript}
                  disabled={isGeneratingScript}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-75 disabled:cursor-not-allowed text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {isGeneratingScript ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Đang Phân Tích & Sinh Kịch Bản TikTok...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Sinh Kịch Bản TikTok Triệu View</span>
                    </>
                  )}
                </button>
              </div>

              {/* Output Result */}
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                {isGeneratingScript ? (
                  <div className="h-full min-h-[350px] flex flex-col items-center justify-center text-center p-8 space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 animate-pulse">
                      <Sparkles className="w-7 h-7 animate-spin" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">AI Đang Biên Soạn Kịch Bản TikTok Triệu View...</h4>
                      <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                        Đang phân tích cấu trúc Hook nghịch lý 3s đầu, chia nhỏ phân cảnh và tối ưu điểm Viral.
                      </p>
                    </div>
                    <div className="w-full max-w-md space-y-2 pt-2">
                      <div className="h-3 bg-blue-100/60 rounded-full animate-pulse w-3/4 mx-auto" />
                      <div className="h-3 bg-gray-100 rounded-full animate-pulse w-5/6 mx-auto" />
                      <div className="h-3 bg-gray-100 rounded-full animate-pulse w-2/3 mx-auto" />
                    </div>
                  </div>
                ) : generatedScript ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                      <div>
                        <h4 className="text-base font-bold text-gray-900">{generatedScript.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="text-blue-600 font-medium">Thời lượng: {generatedScript.durationSeconds}s</span>
                          <span>•</span>
                          <span className="text-emerald-600 font-medium">Điểm Viral: {generatedScript.estimatedViralScore}/100</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopy(JSON.stringify(generatedScript, null, 2), 'script-all')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs text-gray-700 font-medium"
                      >
                        {copiedId === 'script-all' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        Copy toàn bộ
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-900">
                      🎯 <strong>Chiến lược Hook:</strong> {generatedScript.hookVariant}
                    </div>

                    {/* Timeline scenes */}
                    <div className="space-y-3">
                      {generatedScript.scenes.map((sc: any, idx: number) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-blue-600">{sc.timeSlot} — {sc.phase}</span>
                            <span className="px-2 py-0.5 rounded bg-white border border-gray-200 text-[10px] text-gray-700 font-mono">{sc.onscreenText}</span>
                          </div>
                          <p className="text-gray-700"><strong>Hình ảnh:</strong> {sc.visual}</p>
                          <p className="text-gray-900 font-medium"><strong>Lời thoại:</strong> "{sc.audioVoiceover}"</p>
                        </div>
                      ))}
                    </div>

                    {/* Hashtags */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {generatedScript.suggestedHashtags.map((tag: string, i: number) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-blue-700 border border-gray-200 font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
                    <Film className="w-12 h-12 mb-3 text-gray-300" />
                    <p className="text-sm font-medium text-gray-600">Chưa có kịch bản nào được sinh.</p>
                    <p className="text-xs text-gray-400 mt-1">Nhập chủ đề và bấm nút sinh kịch bản bên trái.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SubTab 2: Viral Headlines */}
          {contentSubTab === 'headline' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    type="text"
                    value={headlineTopic}
                    onChange={(e) => setHeadlineTopic(e.target.value)}
                    placeholder="Nhập chủ đề cần giật tít (VD: Khóa học bán hàng TikTok Shop, Dịch vụ phần mềm Topify)..."
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    onClick={handleGenerateHeadlines}
                    disabled={isGeneratingHeadlines}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-75 disabled:cursor-not-allowed text-white text-sm font-medium flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    {isGeneratingHeadlines ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Đang Tạo 5 Tiêu Đề...</span>
                      </>
                    ) : (
                      <>
                        <Flame className="w-4 h-4" />
                        <span>Tạo 5 Tiêu Đề Viral</span>
                      </>
                    )}
                  </button>
                </div>
                {/* Quick Headline Topics */}
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <span className="text-[11px] text-gray-500 font-medium">Chủ đề mẫu:</span>
                  {(adminSettings?.headlinesSuggestedTopics || []).map((t, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setHeadlineTopic(t)}
                      className="text-[11px] px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-700 transition-colors border border-gray-200"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {isGeneratingHeadlines ? (
                <div className="p-8 text-center bg-white border border-gray-200 rounded-2xl shadow-sm space-y-3">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-gray-900">AI đang phân tích 5 góc độ tâm lý (FOMO, Tò mò, How-to, Tranh cãi, Thống kê)...</p>
                </div>
              ) : generatedHeadlines.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generatedHeadlines.map((hl) => (
                    <div key={hl.id} className="p-4 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 shadow-sm transition-all space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          GÓC TIẾP CẬN: {hl.angle}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                          <Zap className="w-3.5 h-3.5" />
                          {hl.attentionScore}/100 Điểm
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-900 leading-snug">{hl.headline}</p>
                      <p className="text-xs text-gray-500">{hl.reason}</p>
                      <button
                        onClick={() => handleCopy(hl.headline, hl.id)}
                        className="w-full py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs text-gray-700 font-medium flex items-center justify-center gap-1.5"
                      >
                        {copiedId === hl.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        Sao chép tiêu đề
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SubTab 3: Captions */}
          {contentSubTab === 'caption' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
                <h3 className="text-base font-semibold text-gray-900">Cấu Hình Bài Viết Bán Hàng</h3>

                <div>
                  <label className="text-xs text-gray-600 block mb-1 font-medium">Tên sản phẩm / dịch vụ:</label>
                  <input
                    type="text"
                    value={captionProduct}
                    onChange={(e) => setCaptionProduct(e.target.value)}
                    placeholder="VD: Topify Pro Automation"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  {/* Quick Product Presets */}
                  <div className="flex flex-wrap items-center gap-1 mt-2">
                    <span className="text-[11px] text-gray-500 font-medium">Mẫu gợi ý:</span>
                    {(adminSettings?.captionsSuggestedProducts || []).map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setCaptionProduct(p.name);
                          setCaptionBenefits(p.benefits);
                          setCaptionFramework(p.framework);
                        }}
                        className="text-[11px] px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-700 transition-colors border border-gray-200"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-600 block mb-1 font-medium">Điểm nổi bật / Lợi ích cốt lõi:</label>
                  <textarea
                    rows={3}
                    value={captionBenefits}
                    onChange={(e) => setCaptionBenefits(e.target.value)}
                    placeholder="VD: Tự động trả lời comment, chốt đơn trong 5s, tiết kiệm 70% thời gian..."
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600 block mb-1 font-medium">Công thức Copywriting:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['AIDA', 'PAS', 'BAB'] as const).map((frm) => (
                      <button
                        key={frm}
                        onClick={() => setCaptionFramework(frm)}
                        className={`py-2 rounded-xl text-xs font-medium transition-colors ${
                          captionFramework === frm
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {frm}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerateCaptions}
                  disabled={isGeneratingCaption}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-75 disabled:cursor-not-allowed text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {isGeneratingCaption ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Đang Soạn Bài Viết Bán Hàng...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Tạo Bài Viết Bán Hàng</span>
                    </>
                  )}
                </button>
              </div>

              {/* Result */}
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                {isGeneratingCaption ? (
                  <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 space-y-3">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                    <p className="text-sm font-semibold text-gray-900">AI đang viết bài theo công thức {captionFramework}...</p>
                    <p className="text-xs text-gray-500">Tối ưu Headline giật tít, khơi gợi nhu cầu và thiết lập CTA chuyển đổi.</p>
                  </div>
                ) : generatedCaption ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        CÔNG THỨC: {generatedCaption.framework}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCopy(`${generatedCaption.headline}\n\n${generatedCaption.content}\n\n${generatedCaption.callToAction}\n\n${generatedCaption.hashtags.join(' ')}`, 'caption-full')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs text-gray-700 font-medium"
                        >
                          {copiedId === 'caption-full' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          Copy toàn bộ
                        </button>
                        <button
                          onClick={() => navigate('/create')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs text-white shadow-xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Mở trang Tạo bài
                        </button>
                      </div>
                    </div>

                    <h4 className="text-base font-bold text-gray-900">{generatedCaption.headline}</h4>
                    <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed p-4 rounded-xl bg-gray-50 border border-gray-200">
                      {generatedCaption.content}
                    </div>
                    <p className="text-sm font-semibold text-blue-600">{generatedCaption.callToAction}</p>

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {generatedCaption.hashtags.map((tag: string, idx: number) => (
                        <span key={idx} className="text-xs px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
                    <MessageSquare className="w-12 h-12 mb-3 text-gray-300" />
                    <p className="text-sm font-medium text-gray-600">Chưa có bài viết bán hàng nào.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}





      {/* ========================================================================= */}
      {/* TAB 5: REPURPOSING (F161) */}
      {/* ========================================================================= */}
      {activeTab === 'repurpose_models' && (
        <div className="space-y-8">
          {/* SECTION 1: REPURPOSING ENGINE (F161) */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Repeat className="w-5 h-5 text-blue-600" />
                  AI Content Repurposing Engine (F161)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tái chế 1 bài viết dài thành chuỗi video ngắn TikTok, Social thread, Email newsletter và Quotes viral
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <textarea
                rows={4}
                value={repurposeInput}
                onChange={(e) => setRepurposeInput(e.target.value)}
                placeholder="Dán nội dung bài viết blog, bài báo, bài chia sẻ kinh nghiệm dài vào đây (Tối thiểu 20 ký tự)..."
                className="w-full bg-white border border-gray-200 rounded-xl p-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                onClick={handleRepurposeContent}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm flex items-center gap-2 shadow-sm transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Tái Chế Tức Thì Thành 4 Định Dạng
              </button>
            </div>

            {activeRepurpose && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                {/* 1. Video Short Scripts */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                  <h4 className="text-xs font-bold text-blue-700 flex items-center gap-1.5 uppercase">
                    🎬 2 Kịch Bản Video Ngắn
                  </h4>
                  {activeRepurpose.shortVideoScripts?.map((sc: any) => (
                    <div key={sc.id} className="p-3 rounded-lg bg-white border border-gray-200 text-xs space-y-1 shadow-xs">
                      <p className="font-bold text-gray-900">Hook: "{sc.hook}"</p>
                      <p className="text-gray-700">{sc.body}</p>
                      <p className="text-blue-600 font-medium">CTA: {sc.cta}</p>
                    </div>
                  ))}
                </div>

                {/* 2. Social Thread */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                  <h4 className="text-xs font-bold text-indigo-700 flex items-center gap-1.5 uppercase">
                    🧵 1 Chuỗi Bài Viết Thread
                  </h4>
                  {activeRepurpose.socialThread?.map((th: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-800 shadow-xs">
                      {th.text}
                    </div>
                  ))}
                </div>

                {/* 3. Email Newsletter */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
                  <h4 className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 uppercase">
                    ✉️ 1 Bản Tin Email Marketing
                  </h4>
                  <p className="text-gray-900 font-semibold">Tiêu đề: {activeRepurpose.emailNewsletter?.subject}</p>
                  <p className="text-gray-500">Preheader: {activeRepurpose.emailNewsletter?.preheader}</p>
                  <div className="whitespace-pre-wrap text-gray-800 p-2.5 rounded bg-white border border-gray-200 shadow-xs">
                    {activeRepurpose.emailNewsletter?.body}
                  </div>
                  <span className="inline-block px-3 py-1 rounded bg-blue-600 text-white font-semibold text-[11px] shadow-xs">
                    Nút: {activeRepurpose.emailNewsletter?.ctaButton}
                  </span>
                </div>

                {/* 4. Viral Quotes */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
                  <h4 className="text-xs font-bold text-amber-700 flex items-center gap-1.5 uppercase">
                    💬 3 Câu Trích Dẫn Viral (Quotes)
                  </h4>
                  {activeRepurpose.viralQuotes?.map((q: string, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-white border border-gray-200 text-gray-800 italic shadow-xs">
                      "{q}"
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: TẠO PHIÊN TRÒ CHUYỆN MỚI (CÓ TÊN VÀ PROMPT NẠP) */}
      {/* ========================================================================= */}
      {isCreateSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/60 via-indigo-50/30 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Khởi Tạo Phiên Trò Chuyện Mới</h3>
                  <p className="text-xs text-gray-500">Đặt tên phiên và nạp prompt huấn luyện cho AI của bạn</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateSessionModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Tên đoạn chat */}
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1.5">
                  Tên đoạn chat (Phiên trò chuyện): <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                  placeholder="VD: Chiến lược sale TikTok Shop 11/11, Kịch bản Livestream chốt đơn..."
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                {/* Gợi ý tên nhanh */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-gray-400">Gợi ý nhanh:</span>
                  {[
                    'Tư vấn chiến lược Content TikTok',
                    'Soạn kịch bản Livestream chốt đơn',
                    'Kịch bản Telesales xử lý từ chối',
                    'Thiết lập kịch bản Tự động hóa',
                  ].map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewSessionTitle(s)}
                      className="px-2 py-0.5 rounded-md text-[11px] bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-600 border border-gray-200 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chọn vai trò trợ lý */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-800">
                    Vai trò Trợ lý (Persona): <span className="text-red-500">*</span>
                  </label>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreateSessionModalOpen(false);
                        handleOpenPersonaManager();
                      }}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 hover:underline"
                      title="Bảng điều khiển vai trò trợ lý (Admin)"
                    >
                      <Settings className="w-3 h-3" />
                      <span>Quản lý vai trò (Admin)</span>
                    </button>
                  )}
                </div>
                <select
                  value={newSessionPersona}
                  onChange={(e) => handleModalPersonaChange(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                >
                  {personas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.emoji} {p.name} {p.isCustom ? '⭐ (Tùy chỉnh)' : ''}
                    </option>
                  ))}
                </select>
                {personas.find((p) => p.id === newSessionPersona) && (
                  <p className="text-[11px] text-gray-500 mt-1 italic">
                    ℹ️ {personas.find((p) => p.id === newSessionPersona)?.description}
                  </p>
                )}
              </div>

              {/* Prompt nạp vào cho AI */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-800">
                    Prompt nạp vào cho AI (Chỉ dẫn huấn luyện phiên này): <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const p = personas.find((item) => item.id === newSessionPersona);
                      if (p) setNewSessionPrompt(p.systemPrompt);
                      toast.info('Đã tải lại prompt nạp mặc định của vai trò!');
                    }}
                    className="text-[11px] text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                    title="Khôi phục prompt gốc của vai trò"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Khôi phục prompt gốc</span>
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={newSessionPrompt}
                  onChange={(e) => setNewSessionPrompt(e.target.value)}
                  placeholder="Nhập hoặc chỉnh sửa prompt nạp đào tạo AI... AI sẽ nhớ ngữ cảnh và chỉ dẫn này suốt phiên chat."
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs leading-relaxed text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  💡 <strong>Mẹo:</strong> Bạn có thể bổ sung thông tin ngành hàng, sản phẩm, đối tượng khách hàng mục tiêu để AI trả lời sát thực tế nhất.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
              <button
                type="button"
                onClick={() => setIsCreateSessionModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmCreateSession}
                disabled={loading || !newSessionTitle.trim()}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Bắt Đầu Trò Chuyện</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BẢNG ĐIỀU KHIỂN QUẢN TRỊ VAI TRÒ TRỢ LÝ (DÀNH CHO ADMIN) */}
      {/* ========================================================================= */}
      {isPersonaManagerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/60 via-indigo-50/30 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900">Bảng Điều Khiển Vai Trò Trợ Lý AI</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700 font-semibold border border-blue-200">
                      Admin Dashboard
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Thêm và thiết lập prompt đào tạo vai trò trợ lý dùng chung cho toàn bộ nhân sự</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPersonaManagerModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Form thêm vai trò mới */}
              <div className="bg-blue-50/40 border border-blue-200/60 rounded-2xl p-4 space-y-4">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  Thêm Vai Trò Trợ Lý Mới Vào Hệ Thống
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Emoji / Icon:</label>
                    <input
                      type="text"
                      value={newPersonaEmoji}
                      onChange={(e) => setNewPersonaEmoji(e.target.value)}
                      placeholder="🛍️"
                      className="w-full text-center text-lg bg-white border border-gray-200 rounded-xl py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    {/* Quick Emojis */}
                    <div className="flex flex-wrap gap-1 mt-1.5 justify-center">
                      {['🛍️', '⚖️', '🩺', '🚀', '💡', '💰', '🎓', '🎬'].map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setNewPersonaEmoji(em)}
                          className="w-6 h-6 rounded hover:bg-blue-100 text-xs flex items-center justify-center transition-colors"
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Tên vai trò trợ lý: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newPersonaName}
                      onChange={(e) => setNewPersonaName(e.target.value)}
                      placeholder="VD: Chuyên Gia TikTok Shop & Thuật Toán"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Mô tả ngắn gọn:</label>
                  <input
                    type="text"
                    value={newPersonaDescription}
                    onChange={(e) => setNewPersonaDescription(e.target.value)}
                    placeholder="VD: Tối ưu gian hàng, xây dựng phễu livestream và kịch bản video viral"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      Prompt nạp đào tạo (System Prompt nạp sẵn): <span className="text-red-500">*</span>
                    </label>
                    {/* Quick Template Fill */}
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                      <span>Mẫu nạp sẵn:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setNewPersonaEmoji('🛍️');
                          setNewPersonaName('Chuyên Gia TikTok Shop');
                          setNewPersonaDescription('Tối ưu hóa sản phẩm, xây dựng kịch bản livestream và tối ưu thuật toán TikTok Shop');
                          setNewPersonaPrompt(
                            'Bạn là Chuyên gia TikTok Shop với 8 năm kinh nghiệm thực chiến điều hành hàng trăm gian hàng đạt doanh số hàng tỷ đồng/tháng.\nNhiệm vụ: Phân tích thuật toán TikTok Shop, tối ưu tiêu đề SEO sản phẩm, xây dựng kịch bản livestream giữ chân người xem và tư vấn chiến lược chạy ads GMV Max hiệu quả nhất.\nPhong cách: Thực chiến, rành mạch, dẫn chứng số liệu cụ thể, luôn đưa ra giải pháp hành động ngay.'
                          );
                        }}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        TikTok Shop
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => {
                          setNewPersonaEmoji('⚖️');
                          setNewPersonaName('Tư Vấn Pháp Lý TMĐT');
                          setNewPersonaDescription('Tư vấn quy định bản quyền, chính sách quảng cáo và pháp lý doanh nghiệp TMĐT');
                          setNewPersonaPrompt(
                            'Bạn là Luật sư kiêm Chuyên gia Pháp lý Thương Mại Điện Tử và Bản Quyền Số tại Việt Nam.\nNhiệm vụ: Cung cấp chỉ dẫn chính xác về quyền sở hữu trí tuệ, bản quyền âm nhạc/hình ảnh trên mạng xã hội, các chính sách cấm quảng cáo của Meta/TikTok và quy định pháp lý thuế TMĐT hiện hành.\nPhong cách: Nghiêm túc, cẩn trọng, trích dẫn quy định rõ ràng và bảo vệ tối đa an toàn pháp lý cho doanh nghiệp.'
                          );
                        }}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        Pháp lý TMĐT
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={5}
                    value={newPersonaPrompt}
                    onChange={(e) => setNewPersonaPrompt(e.target.value)}
                    placeholder="Nhập prompt đào tạo đầy đủ: danh tính, kiến thức chuyên sâu, phong cách xưng hô, quy tắc trả lời..."
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs leading-relaxed text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleCreateCustomPersona}
                    disabled={loading || !newPersonaName.trim() || !newPersonaPrompt.trim()}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Lưu & Nạp Vào Hệ Thống Cho User Dùng Nhanh</span>
                  </button>
                </div>
              </div>

              {/* Danh sách các vai trò đang có */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                  Danh Sách Vai Trò Hiện Có Trong Hệ Thống ({personas.length})
                </h4>
                <div className="space-y-2">
                  {personas.map((p) => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-all flex items-start justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="text-xl p-2 rounded-xl bg-gray-50 border border-gray-100 shrink-0">{p.emoji}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs font-bold text-gray-900 truncate">{p.name}</h5>
                            {p.isCustom ? (
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                                Admin tạo
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-gray-100 text-gray-600 font-medium">
                                Mặc định
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{p.description}</p>
                          <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 bg-gray-50 p-2 rounded-lg font-mono">
                            {p.systemPrompt}
                          </p>
                        </div>
                      </div>

                      {p.isCustom && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCustomPersona(p.id, e)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 shrink-0 transition-colors"
                          title="Xóa vai trò này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-end bg-gray-50/50">
              <button
                type="button"
                onClick={() => setIsPersonaManagerModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: XEM PROMPT ĐÀO TẠO CỦA PHIÊN HIỆN TẠI */}
      {/* ========================================================================= */}
      {showPromptViewerModal && currentSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-white">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900">Prompt Đào Tạo Của Phiên Này</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPromptViewerModal(false)}
                className="p-1 rounded text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <span className="text-[11px] text-gray-500">Tên đoạn chat:</span>
                <p className="text-xs font-semibold text-gray-800">{currentSession.title}</p>
              </div>
              <div>
                <span className="text-[11px] text-gray-500">Vai trò trợ lý:</span>
                <p className="text-xs font-semibold text-blue-600">
                  {currentSession.personaName || currentPersonaObj?.name || currentSession.persona}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-gray-500">Nội dung prompt huấn luyện nạp cho AI:</span>
                <div className="mt-1 p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-800 font-mono leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {currentSession.systemPrompt || currentPersonaObj?.systemPrompt || 'Prompt mặc định theo vai trò.'}
                </div>
              </div>
            </div>
            <div className="px-5 py-2.5 border-t border-gray-100 flex justify-end bg-gray-50/50">
              <button
                type="button"
                onClick={() => setShowPromptViewerModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: QUẢN TRỊ PROMPT & CHỦ ĐỀ TOÀN HỆ THỐNG (ADMIN) */}
      {/* ========================================================================= */}
      {isAdminStudioSettingsModalOpen && (
        <AdminStudioSettingsModal
          initialTab={adminStudioTab}
          settings={adminSettings}
          onClose={() => setIsAdminStudioSettingsModalOpen(false)}
          onSave={handleSaveAdminStudioSettings}
        />
      )}
    </div>
  );
}

interface AdminStudioSettingsModalProps {
  initialTab?: 'content';
  settings: AdminAiStudioSettings;
  onClose: () => void;
  onSave: (settings: AdminAiStudioSettings) => Promise<void>;
}

function AdminStudioSettingsModal({ settings, onClose, onSave }: AdminStudioSettingsModalProps) {
  const [draft, setDraft] = useState<AdminAiStudioSettings>(() => JSON.parse(JSON.stringify(settings)));
  const [saving, setSaving] = useState(false);

  // Quick addition inputs
  const [newScriptTopic, setNewScriptTopic] = useState('');
  const [newBrandVoice, setNewBrandVoice] = useState('');
  const [newHeadlineTopic, setNewHeadlineTopic] = useState('');
  const [newProdName, setNewProdName] = useState('');
  const [newProdBenefits, setNewProdBenefits] = useState('');
  const [newProdFramework, setNewProdFramework] = useState<'AIDA' | 'PAS' | 'BAB'>('AIDA');

  const handleAddScriptTopic = () => {
    if (!newScriptTopic.trim()) return;
    setDraft((prev) => ({
      ...prev,
      scriptSuggestedTopics: [...prev.scriptSuggestedTopics, newScriptTopic.trim()],
    }));
    setNewScriptTopic('');
  };

  const handleRemoveScriptTopic = (idx: number) => {
    setDraft((prev) => ({
      ...prev,
      scriptSuggestedTopics: prev.scriptSuggestedTopics.filter((_, i) => i !== idx),
    }));
  };

  const handleAddBrandVoice = () => {
    if (!newBrandVoice.trim()) return;
    setDraft((prev) => ({
      ...prev,
      scriptBrandVoices: [...prev.scriptBrandVoices, newBrandVoice.trim()],
    }));
    setNewBrandVoice('');
  };

  const handleRemoveBrandVoice = (idx: number) => {
    setDraft((prev) => ({
      ...prev,
      scriptBrandVoices: prev.scriptBrandVoices.filter((_, i) => i !== idx),
    }));
  };

  const handleAddHeadlineTopic = () => {
    if (!newHeadlineTopic.trim()) return;
    setDraft((prev) => ({
      ...prev,
      headlinesSuggestedTopics: [...prev.headlinesSuggestedTopics, newHeadlineTopic.trim()],
    }));
    setNewHeadlineTopic('');
  };

  const handleRemoveHeadlineTopic = (idx: number) => {
    setDraft((prev) => ({
      ...prev,
      headlinesSuggestedTopics: prev.headlinesSuggestedTopics.filter((_, i) => i !== idx),
    }));
  };

  const handleAddProduct = () => {
    if (!newProdName.trim() || !newProdBenefits.trim()) {
      toast.error('Vui lòng nhập tên sản phẩm và lợi ích');
      return;
    }
    setDraft((prev) => ({
      ...prev,
      captionsSuggestedProducts: [
        ...prev.captionsSuggestedProducts,
        { name: newProdName.trim(), benefits: newProdBenefits.trim(), framework: newProdFramework },
      ],
    }));
    setNewProdName('');
    setNewProdBenefits('');
  };

  const handleRemoveProduct = (idx: number) => {
    setDraft((prev) => ({
      ...prev,
      captionsSuggestedProducts: prev.captionsSuggestedProducts.filter((_, i) => i !== idx),
    }));
  };

  const handleResetDefaults = () => {
    if (confirm('Bạn có chắc muốn khôi phục toàn bộ cài đặt Prompt & Chủ đề về mặc định gốc của Topify?')) {
      setDraft(JSON.parse(JSON.stringify(DEFAULT_STUDIO_SETTINGS)));
      toast.info('Đã tải lại cấu hình mặc định gốc');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900">Quản Trị Prompt & Chủ Đề Studio</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700 font-semibold border border-blue-200">
                  Admin Control
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Tùy biến System Prompt đào tạo và kho chủ đề/prompt mẫu gợi ý sẵn cho toàn bộ người dùng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Header */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-gray-200 bg-gray-50/40">
          <div className="pb-2.5 px-3 text-xs font-semibold border-b-2 border-blue-600 text-blue-600 flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-blue-600" />
            <span>Sáng Tạo Nội Dung & Kịch Bản Viral (F157)</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="space-y-6">
              {/* 1. Kịch bản TikTok */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-blue-600" />
                  1. Kịch Bản Video TikTok/Reels Triệu View
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    System Prompt Đào Tạo Kịch Bản:
                  </label>
                  <textarea
                    rows={3}
                    value={draft.scriptSystemPrompt}
                    onChange={(e) => setDraft({ ...draft, scriptSystemPrompt: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Danh Sách Chủ Đề Mẫu Gợi Ý (User bấm chọn nhanh):
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {draft.scriptSuggestedTopics.map((top, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-800 shadow-2xs"
                      >
                        <span>{top}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveScriptTopic(idx)}
                          className="text-gray-400 hover:text-red-600 p-0.5 rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newScriptTopic}
                      onChange={(e) => setNewScriptTopic(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddScriptTopic()}
                      placeholder="Thêm chủ đề kịch bản mẫu mới..."
                      className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddScriptTopic}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
                    >
                      + Thêm
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Danh Sách Brand Voice Mẫu:
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {draft.scriptBrandVoices.map((bv, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-800 shadow-2xs"
                      >
                        <span>{bv}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBrandVoice(idx)}
                          className="text-gray-400 hover:text-red-600 p-0.5 rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newBrandVoice}
                      onChange={(e) => setNewBrandVoice(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddBrandVoice()}
                      placeholder="Thêm giọng điệu / Brand Voice mới..."
                      className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddBrandVoice}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
                    >
                      + Thêm
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Tiêu đề Viral */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  2. 5 Tiêu Đề Viral Giật Tít
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    System Prompt Tạo Tiêu Đề:
                  </label>
                  <textarea
                    rows={2}
                    value={draft.headlinesSystemPrompt}
                    onChange={(e) => setDraft({ ...draft, headlinesSystemPrompt: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Chủ đề tiêu đề gợi ý mẫu:
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {draft.headlinesSuggestedTopics.map((top, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-800 shadow-2xs"
                      >
                        <span>{top}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveHeadlineTopic(idx)}
                          className="text-gray-400 hover:text-red-600 p-0.5 rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newHeadlineTopic}
                      onChange={(e) => setNewHeadlineTopic(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddHeadlineTopic()}
                      placeholder="Thêm chủ đề giật tít mẫu..."
                      className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddHeadlineTopic}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
                    >
                      + Thêm
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Caption Bán Hàng */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  3. Caption Bán Hàng (AIDA / PAS / BAB)
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    System Prompt Caption:
                  </label>
                  <textarea
                    rows={2}
                    value={draft.captionsSystemPrompt}
                    onChange={(e) => setDraft({ ...draft, captionsSystemPrompt: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Sản phẩm mẫu gợi ý:
                  </label>
                  <div className="space-y-1.5 mb-2">
                    {draft.captionsSuggestedProducts.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-200 text-xs"
                      >
                        <div>
                          <strong className="text-gray-900">{p.name}</strong>{' '}
                          <span className="text-blue-600 font-mono">({p.framework})</span>
                          <p className="text-[11px] text-gray-500 line-clamp-1">{p.benefits}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(idx)}
                          className="text-gray-400 hover:text-red-600 p-1 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                      placeholder="Tên sản phẩm..."
                      className="bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-900"
                    />
                    <input
                      type="text"
                      value={newProdBenefits}
                      onChange={(e) => setNewProdBenefits(e.target.value)}
                      placeholder="Lợi ích cốt lõi..."
                      className="sm:col-span-2 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-900"
                    />
                    <div className="flex gap-1.5">
                      <select
                        value={newProdFramework}
                        onChange={(e: any) => setNewProdFramework(e.target.value)}
                        className="bg-white border border-gray-200 rounded-xl px-2 py-1.5 text-xs text-gray-900"
                      >
                        <option value="AIDA">AIDA</option>
                        <option value="PAS">PAS</option>
                        <option value="BAB">BAB</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleAddProduct}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 transition-colors font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Khôi phục mặc định gốc</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Lưu Cấu Hình Toàn Hệ Thống</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
