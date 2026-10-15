import OpenAI from 'openai';
import { getNineRouterClient, isNineRouterConfigured, cleanJsonOutput } from './9router';

// =========================================================================
// TYPES & INTERFACES FOR TOPIFY AI HUB (M14: F156 - F162)
// =========================================================================

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  modelUsed?: string;
}

export interface AiPersonaItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
  systemPrompt: string;
  welcomeMessage?: string;
  isCustom?: boolean;
  createdAt?: string;
  createdBy?: string;
}

export interface AiChatSession {
  id: string;
  title: string;
  persona: string;
  personaName?: string;
  systemPrompt?: string;
  messages: AiChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface VideoScriptScene {
  timeSlot: string; // e.g. "0:00 - 0:03"
  phase: 'HOOK' | 'BODY' | 'CTA';
  visual: string;
  audioVoiceover: string;
  onscreenText: string;
}

export interface VideoScriptResult {
  title: string;
  topic: string;
  durationSeconds: number;
  hookVariant: string;
  scenes: VideoScriptScene[];
  suggestedHashtags: string[];
  estimatedViralScore: number;
}

export interface ViralHeadlineItem {
  id: string;
  headline: string;
  angle: 'FOMO' | 'CURIOSITY' | 'HOW_TO' | 'CONTROVERSIAL' | 'STATISTIC';
  attentionScore: number; // 0 - 100
  reason: string;
}

export interface CaptionResult {
  framework: 'AIDA' | 'PAS' | 'BAB';
  headline: string;
  content: string;
  callToAction: string;
  hashtags: string[];
  characterCount: number;
}

export interface GeneratedImageItem {
  id: string;
  prompt: string;
  style: 'REALISTIC' | '3D_RENDER' | 'CYBERPUNK' | 'STUDIO_MINIMAL' | 'ANIME';
  aspectRatio: '1:1' | '9:16' | '16:9' | '4:5';
  imageUrl: string;
  createdAt: string;
  width: number;
  height: number;
}

export interface StoryboardScene {
  sceneNumber: number;
  durationSeconds: number;
  cameraMovement: string;
  visualPrompt: string;
  voiceover: string;
  bgmMood: string;
  conceptImageUrl?: string;
}

export interface GeneratedVideoItem {
  id: string;
  title: string;
  prompt: string;
  durationSeconds: number;
  aspectRatio: '9:16' | '16:9' | '1:1';
  scenes: StoryboardScene[];
  status: 'COMPLETED' | 'RENDERING' | 'DRAFT';
  videoPreviewUrl: string;
  createdAt: string;
}

export interface GeneratedVoiceItem {
  id: string;
  text: string;
  voiceId: string;
  voiceName: string;
  language: 'vi-VN' | 'en-US';
  gender: 'FEMALE' | 'MALE';
  tone: 'EMOTIONAL' | 'NEWS' | 'ENTHUSIASTIC' | 'PROFESSIONAL';
  speed: number;
  durationSeconds: number;
  audioUrl: string;
  createdAt: string;
}

export interface RepurposedPackage {
  id: string;
  originalText: string;
  shortVideoScripts: Array<{
    id: string;
    hook: string;
    body: string;
    cta: string;
    duration: string;
  }>;
  socialThread: Array<{
    postNumber: number;
    text: string;
  }>;
  emailNewsletter: {
    subject: string;
    preheader: string;
    body: string;
    ctaButton: string;
  };
  viralQuotes: string[];
  createdAt: string;
}

export interface AiModelItem {
  id: string;
  name: string;
  provider: 'OpenAI' | 'Anthropic' | 'Google' | 'DeepSeek';
  contextWindow: string;
  latencyMs: number;
  creditsPer1kTokens: number;
  recommendedFor: string;
  isDefault: boolean;
}

export interface AiGatewayStatus {
  isConfigured: boolean;
  gatewayUrl: string;
  activeModel: string;
  latencyMs: number;
  todayTokensUsed: number;
  remainingCredits: number;
  status: 'ONLINE' | 'FALLBACK_HEURISTIC';
}

export interface AdminAiStudioSettings {
  // F157: Video Script
  scriptSystemPrompt: string;
  scriptSuggestedTopics: string[];
  scriptBrandVoices: string[];

  // F157: Viral Headlines
  headlinesSystemPrompt: string;
  headlinesSuggestedTopics: string[];

  // F157: Sales Captions
  captionsSystemPrompt: string;
  captionsSuggestedProducts: Array<{ name: string; benefits: string; framework: 'AIDA' | 'PAS' | 'BAB' }>;

  // F158: Image Generator
  imageSystemPrompt: string;
  imageSuggestedPrompts: string[];

  // F159: Video Storyboard
  storyboardSystemPrompt: string;
  storyboardSuggestedTopics: string[];
}

// =========================================================================
// IN-MEMORY STORE WITH INITIAL DATA (RESILIENCE FALLBACK)
// =========================================================================

class TopifyAiStore {
  private defaultPersonas: AiPersonaItem[] = [
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

  private customPersonas: AiPersonaItem[] = [];

  private adminSettings: AdminAiStudioSettings = {
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
    ],
  };

  private sessions: AiChatSession[] = [
    {
      id: 'session-demo-1',
      title: 'Tư vấn chiến lược Content TikTok Shop Mega Sale',
      persona: 'MARKETING_STRATEGIST',
      personaName: 'Chiến Lược Gia Marketing',
      systemPrompt: 'Bạn là Giám đốc Marketing kỳ cựu với 15 năm kinh nghiệm thực chiến trong các chiến dịch đa kênh tại Việt Nam. Bạn tư vấn dựa trên số liệu, ROI thực tế, xây dựng phễu khách hàng bền vững và đề xuất các giải pháp tăng trưởng thực thi được ngay.',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Làm sao để đẩy mạnh doanh số TikTok Shop đợt sale cuối tháng này cho ngành mỹ phẩm?',
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Chào bạn! Để bùng nổ doanh số TikTok Shop ngành mỹ phẩm đợt này, tôi gợi ý 3 chiến thuật cốt lõi:\n\n1. **Chuỗi Video Teaser 3 ngày trước sale:** Tập trung vào nỗi đau da dầu mụn mùa hè, sử dụng Hook gây tò mò trong 3 giây đầu.\n2. **Kịch bản Live Stream Flash Sale:** Chuẩn bị deal chớp nhoáng 9k/19k đầu phiên để kéo tương tác và giữ chân người xem.\n3. **Tận dụng tính năng Topify Automation:** Tự động gửi tin nhắn kèm voucher giảm 15% cho mọi khách để lại bình luận hỏi giá!',
          createdAt: new Date(Date.now() - 3600000 * 5 + 2000).toISOString(),
          modelUsed: 'Topify AI Ultra',
        },
      ],
    },
    {
      id: 'session-demo-2',
      title: 'Soạn kịch bản Telesales chốt đơn VIP',
      persona: 'SALES_CLOSER',
      personaName: 'Chuyên Viên Chốt Sales & CSKH',
      systemPrompt: 'Bạn là Chuyên gia đào tạo bán hàng và chốt sale thực chiến. Bạn cung cấp kịch bản xử lý mọi tình huống từ chối của khách hàng (về giá, đối thủ, thời gian suy nghĩ), khéo léo biến phản đối thành cơ hội chốt đơn thần tốc.',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      messages: [
        {
          id: 'msg-3',
          role: 'user',
          content: 'Cho tôi mẫu kịch bản telesales khi khách hàng phân vân về giá gói Enterprise.',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 'msg-4',
          role: 'assistant',
          content: 'Dạ anh/chị, khi khách lăn tăn về giá gói Enterprise, hãy áp dụng kỹ thuật "Chuyển hóa chi phí thành lợi nhuận":\n\n"Em hoàn toàn hiểu chi phí ban đầu là điều anh/chị rất cân nhắc. Tuy nhiên với 50 tài khoản tự động hóa, mỗi tháng Topify giúp doanh nghiệp tiết kiệm ít nhất 2 nhân sự vận hành (~20 triệu/tháng) và tăng gấp 3 lượng khách chốt đơn. Như vậy gói này sẽ hoàn vốn ngay trong 2 tuần đầu tiên anh/chị nhé!"',
          createdAt: new Date(Date.now() - 86400000 + 2000).toISOString(),
          modelUsed: 'Topify AI Ultra',
        },
      ],
    },
  ];

  private generatedImages: GeneratedImageItem[] = [
    {
      id: 'img-1',
      prompt: 'Futuristic AI Marketing Dashboard with holographic neon charts, high resolution cinematic 3D render',
      style: '3D_RENDER',
      aspectRatio: '16:9',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      width: 1200,
      height: 675,
    },
    {
      id: 'img-2',
      prompt: 'Cyberpunk young Vietnamese content creator streaming live with neon lighting',
      style: 'CYBERPUNK',
      aspectRatio: '9:16',
      imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      width: 720,
      height: 1280,
    },
    {
      id: 'img-3',
      prompt: 'Minimalist product photography cosmetic serum glass bottle on clean pastel background',
      style: 'STUDIO_MINIMAL',
      aspectRatio: '1:1',
      imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      width: 800,
      height: 800,
    },
  ];

  private generatedVideos: GeneratedVideoItem[] = [
    {
      id: 'vid-1',
      title: 'Phân cảnh TikTok Viral: Bí quyết x3 doanh số từ Topify Automation',
      prompt: 'Review quy trình tự động hóa trả lời comment và chốt đơn trong 5 giây',
      durationSeconds: 45,
      aspectRatio: '9:16',
      status: 'COMPLETED',
      videoPreviewUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-working-with-a-laptop-42174-large.mp4',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      scenes: [
        {
          sceneNumber: 1,
          durationSeconds: 3,
          cameraMovement: 'Fast Zoom-In',
          visualPrompt: 'Màn hình điện thoại nổ liên tục 100+ thông báo đơn hàng TikTok Shop',
          voiceover: 'Đừng lướt qua nếu bạn vẫn đang trả lời comment khách hàng bằng tay!',
          bgmMood: 'Hồi hộp, kịch tính',
        },
        {
          sceneNumber: 2,
          durationSeconds: 20,
          cameraMovement: 'Smooth Pan Right',
          visualPrompt: 'Giao diện Topify Automation tự động bắt tin nhắn và điều phối nhân sự',
          voiceover: 'Topify vừa ra mắt tính năng tự động trả lời và gắn tag khách hàng tiềm năng chỉ trong 0.5 giây.',
          bgmMood: 'Năng lượng tích cực',
        },
        {
          sceneNumber: 3,
          durationSeconds: 12,
          cameraMovement: 'Static Center Focus',
          visualPrompt: 'Biểu đồ doanh thu tăng vọt từ 10 triệu lên 50 triệu/ngày',
          voiceover: 'Nhờ vậy tỷ lệ chốt đơn tăng gấp 3 mà không cần thuê thêm nhân viên trực page.',
          bgmMood: 'Hào hứng',
        },
        {
          sceneNumber: 4,
          durationSeconds: 10,
          cameraMovement: 'Slow Zoom-Out',
          visualPrompt: 'Nút bấm Tải ngay Topify Desktop App trên màn hình',
          voiceover: 'Bấm vào link bio để trải nghiệm miễn phí 14 ngày ngay hôm nay nhé!',
          bgmMood: 'Quyết liệt, chốt sale',
        },
      ],
    },
  ];

  private generatedVoices: GeneratedVoiceItem[] = [
    {
      id: 'voice-1',
      text: 'Chào mừng bạn đã đến với Topify - Nền tảng quản trị và tăng trưởng đa kênh số 1 Việt Nam.',
      voiceId: 'vi-VN-HoaiMy',
      voiceName: 'Hoài My (Nữ miền Nam)',
      language: 'vi-VN',
      gender: 'FEMALE',
      tone: 'ENTHUSIASTIC',
      speed: 1.0,
      durationSeconds: 4.8,
      audioUrl: 'https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'voice-2',
      text: 'Đừng bỏ lỡ ưu đãi giảm giá 30% gói Pro Agency duy nhất trong hôm nay.',
      voiceId: 'vi-VN-NamMinh',
      voiceName: 'Nam Minh (Nam miền Bắc)',
      language: 'vi-VN',
      gender: 'MALE',
      tone: 'PROFESSIONAL',
      speed: 1.1,
      durationSeconds: 3.5,
      audioUrl: 'https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg',
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    },
  ];

  private repurposedPackages: RepurposedPackage[] = [
    {
      id: 'rep-1',
      originalText: 'Topify ra mắt hệ thống Ví & Hoa hồng M12 M13 giúp các nhà sáng tạo nội dung và agency kiếm thêm thu nhập thụ động bền vững từ việc chia sẻ phần mềm đến cộng đồng.',
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      shortVideoScripts: [
        {
          id: 'sc-1',
          hook: 'Bạn có biết cách kiếm 20 triệu/tháng từ nghề affiliate phần mềm mà không cần vốn?',
          body: 'Topify vừa ra mắt tính năng Ví thu nhập với hoa hồng lên tới 25% trọn đời mỗi khi khách gia hạn...',
          cta: 'Lấy link mời độc quyền tại tab Ví trong app Topify nhé!',
          duration: '35 giây',
        },
        {
          id: 'sc-2',
          hook: 'Đừng làm affiliate nếu bạn chưa biết đến cơ chế hoa hồng trọn đời này!',
          body: 'Khác với sản phẩm vật lý chỉ ăn 1 lần, phần mềm SaaS giúp bạn nhận tiền định kỳ hàng tháng...',
          cta: 'Bình luận "NHẬN LINK" để mình gửi mã mời có sẵn 50k trong ví.',
          duration: '40 giây',
        },
      ],
      socialThread: [
        {
          postNumber: 1,
          text: '🧵 THREAD: Làm thế nào mình xây dựng dòng thu nhập thụ động $500/tháng từ việc giới thiệu Topify cho các chủ shop online? (1/4)',
        },
        {
          postNumber: 2,
          text: '1. Không spam link: Mình quay video hướng dẫn cách tự động hóa comment và gửi mã mời ở phần mô tả (2/4)',
        },
        {
          postNumber: 3,
          text: '2. Nhận hoa hồng trọn đời: Khách hàng dùng Topify thường gia hạn từ 6 - 12 tháng, thu nhập đều như vắt chanh (3/4)',
        },
        {
          postNumber: 4,
          text: '3. Rút tiền tức thì: Hỗ trợ VietQR, MoMo rút về ngân hàng chỉ trong 5 phút. Hãy bắt đầu ngay hôm nay! (4/4)',
        },
      ],
      emailNewsletter: {
        subject: '[Cơ hội hợp tác] Nhận hoa hồng tới 25% trọn đời cùng Topify Growth Partner',
        preheader: 'Khám phá chương trình Đối tác Tăng trưởng mới nhất từ Topify...',
        body: 'Xin chào bạn,\n\nTopify xin trân trọng giới thiệu chương trình Tiếp Thị Liên Kết & Chia Sẻ Lợi Nhuận dành riêng cho đối tác. Giờ đây bạn có thể vừa tối ưu marketing vừa tạo thêm nguồn thu nhập ổn định...',
        ctaButton: 'Kích hoạt Mã Giới Thiệu Của Bạn',
      },
      viralQuotes: [
        'Thu nhập thụ động đỉnh cao nhất là khi bạn nhận tiền định kỳ từ sản phẩm khách hàng yêu thích mỗi ngày.',
        'Đừng bán sản phẩm một lần, hãy bán giải pháp giúp khách hàng kiếm ra tiền liên tục.',
        'Tự động hóa không lấy đi việc làm, tự động hóa giải phóng bạn để làm việc sáng tạo hơn.',
      ],
    },
  ];

  private activeModelId: string = process.env.NINE_ROUTER_MODEL?.trim() || 'mainTop';

  private isInvalidOrRefusal(text: string): boolean {
    if (!text || text.trim().length === 0) return true;
    const lower = text.toLowerCase();
    return (
      lower.includes('is no longer available') ||
      lower.includes('gemini 3.5 flash') ||
      lower.includes('switch to gemini') ||
      lower.includes('requested entity was not found') ||
      lower.includes('usage_limit_exceeded') ||
      lower.includes("i'm kiro") ||
      lower.includes('i am kiro') ||
      lower.includes('as an ai language model, i cannot')
    );
  }

  private availableModels: AiModelItem[] = [
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini (Khuyên dùng)',
      provider: 'OpenAI',
      contextWindow: '128K Tokens',
      latencyMs: 145,
      creditsPer1kTokens: 1,
      recommendedFor: 'Phản hồi siêu tốc, soạn thảo văn bản, tối ưu chi phí',
      isDefault: true,
    },
    {
      id: 'gpt-4o',
      name: 'GPT-4o Omni Pro',
      provider: 'OpenAI',
      contextWindow: '128K Tokens',
      latencyMs: 380,
      creditsPer1kTokens: 5,
      recommendedFor: 'Phân tích chiến lược phức tạp, giải quyết bài toán khó',
      isDefault: false,
    },
    {
      id: 'claude-3-5-sonnet',
      name: 'Claude 3.5 Sonnet',
      provider: 'Anthropic',
      contextWindow: '200K Tokens',
      latencyMs: 420,
      creditsPer1kTokens: 6,
      recommendedFor: 'Viết văn phong tự nhiên, cảm xúc, copywriting chuyên sâu',
      isDefault: false,
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      provider: 'Google',
      contextWindow: '1M Tokens',
      latencyMs: 310,
      creditsPer1kTokens: 4,
      recommendedFor: 'Đọc tài liệu siêu dài, tóm tắt video và dữ liệu lớn',
      isDefault: false,
    },
    {
      id: 'deepseek-chat',
      name: 'DeepSeek V3',
      provider: 'DeepSeek',
      contextWindow: '64K Tokens',
      latencyMs: 220,
      creditsPer1kTokens: 2,
      recommendedFor: 'Logic suy luận, viết code & prompt automation',
      isDefault: false,
    },
  ];

  public getAdminSettings(): AdminAiStudioSettings {
    return this.adminSettings;
  }

  public updateAdminSettings(settings: Partial<AdminAiStudioSettings>): AdminAiStudioSettings {
    this.adminSettings = {
      ...this.adminSettings,
      ...settings,
    };
    return this.adminSettings;
  }

  // ==========================================
  // CHAT SESSIONS & PERSONAS (F156)
  // ==========================================

  public getPersonas(): AiPersonaItem[] {
    return [...this.defaultPersonas, ...this.customPersonas];
  }

  public getPersonaById(id: string): AiPersonaItem | undefined {
    return this.getPersonas().find((p) => p.id === id);
  }

  public createPersona(data: {
    id?: string;
    name: string;
    emoji?: string;
    description?: string;
    systemPrompt: string;
    welcomeMessage?: string;
    createdBy?: string;
  }): AiPersonaItem {
    const id = data.id || `custom_${Date.now()}`;
    const newPersona: AiPersonaItem = {
      id,
      name: data.name.trim(),
      emoji: data.emoji?.trim() || '🤖',
      description: data.description?.trim() || '',
      systemPrompt: data.systemPrompt.trim(),
      welcomeMessage: data.welcomeMessage?.trim() || `Xin chào! Tôi là ${data.name.trim()}. Tôi đã được nạp đầy đủ chỉ dẫn đào tạo và sẵn sàng hỗ trợ cho phiên làm việc của bạn!`,
      isCustom: true,
      createdAt: new Date().toISOString(),
      createdBy: data.createdBy || 'Admin',
    };
    const existingIdx = this.customPersonas.findIndex((p) => p.id === id);
    if (existingIdx >= 0) {
      this.customPersonas[existingIdx] = newPersona;
    } else {
      this.customPersonas.push(newPersona);
    }
    return newPersona;
  }

  public deletePersona(id: string): boolean {
    const idx = this.customPersonas.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.customPersonas.splice(idx, 1);
      return true;
    }
    return false;
  }

  public getSessions(): AiChatSession[] {
    return this.sessions;
  }

  public getSessionById(id: string): AiChatSession | undefined {
    return this.sessions.find((s) => s.id === id);
  }

  public createSession(title?: string, persona?: string, systemPrompt?: string): AiChatSession {
    const chosenPersonaId = persona || 'MARKETING_STRATEGIST';
    const personaItem = this.getPersonaById(chosenPersonaId);
    const personaName = personaItem ? personaItem.name : chosenPersonaId;
    const effectiveTitle = title?.trim() || `Phiên ${personaName}`;
    const effectiveSystemPrompt = (systemPrompt && systemPrompt.trim()) ? systemPrompt.trim() : (personaItem?.systemPrompt || this.getPersonaSystemPrompt(chosenPersonaId));

    const welcomeContent = personaItem?.welcomeMessage
      ? personaItem.welcomeMessage
      : `Xin chào! Tôi là ${personaName} trên Topify AI. Tôi đã được nạp chỉ dẫn đào tạo và sẵn sàng hỗ trợ cho phiên "${effectiveTitle}". Hãy đặt câu hỏi hoặc gửi yêu cầu cho tôi nhé!`;

    const newSession: AiChatSession = {
      id: `session-${Date.now()}`,
      title: effectiveTitle,
      persona: chosenPersonaId,
      personaName,
      systemPrompt: effectiveSystemPrompt,
      messages: [
        {
          id: `msg-welcome-${Date.now()}`,
          role: 'assistant',
          content: welcomeContent,
          createdAt: new Date().toISOString(),
          modelUsed: this.activeModelId,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.sessions.unshift(newSession);
    return newSession;
  }

  public async sendMessage(sessionId: string, userContent: string): Promise<AiChatMessage> {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const userMsg: AiChatMessage = {
      id: `msg-u-${Date.now()}`,
      role: 'user',
      content: userContent,
      createdAt: new Date().toISOString(),
    };
    session.messages.push(userMsg);
    session.updatedAt = new Date().toISOString();

    let assistantResponse = '';
    let modelUsed = this.activeModelId;

    const personaItem = this.getPersonaById(session.persona);
    const personaName = session.personaName || personaItem?.name || session.persona;
    const effectiveSystemPrompt = session.systemPrompt || personaItem?.systemPrompt || this.getPersonaSystemPrompt(session.persona);

    // 1. Try AI Gateway if configured
    if (isNineRouterConfigured()) {
      try {
        const client = getNineRouterClient();
        if (client) {
          const sysPrompt = `<role_definition>
Bạn là ${personaName}, chuyên gia cố vấn AI trên nền tảng Topify AI Studio.
Nhiệm vụ của bạn là phục vụ phiên làm việc: "${session.title}".
</role_definition>

<training_instructions>
${effectiveSystemPrompt}
</training_instructions>

<interaction_guidelines>
- Luôn giữ vai trò chuyên môn ${personaName}, trả lời sâu sát, thực chiến và hữu ích.
- Khi người dùng gửi lời chào hỏi, hãy chào đón chuyên nghiệp và giới thiệu sẵn sàng hỗ trợ cho phiên "${session.title}".
- Luôn trả lời bằng tiếng Việt chuẩn mực, mạch lạc, có cấu trúc rõ ràng.
</interaction_guidelines>`;

          const modelToUse = this.activeModelId || 'mainTop';
          const MAX_RETRIES = 3;

          for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
              const completion = await client.chat.completions.create({
                model: modelToUse,
                messages: [
                  { role: 'system', content: sysPrompt },
                  ...session.messages.map((m) => ({ role: m.role, content: m.content })),
                ],
                temperature: 0.7,
              });
              let raw = completion.choices?.[0]?.message?.content?.trim() || '';
              if (raw && !this.isInvalidOrRefusal(raw)) {
                if (raw.includes("I'm Kiro") || raw.includes("I am Kiro")) {
                  raw = `Chào bạn! Tôi là ${personaName} trên Topify AI Studio.\n\nĐối với phiên làm việc "${session.title}", tôi đã sẵn sàng hỗ trợ bạn theo đúng định hướng chuyên môn:\n\n${this.generateHeuristicChatReply(session.persona, userContent, personaName)}`;
                }
                assistantResponse = raw;
                modelUsed = 'Topify AI Ultra';
                break;
              } else {
                console.warn(`[TopifyAI] Lần thử ${attempt}/${MAX_RETRIES} với combo "${modelToUse}" nhận nội dung không hợp lệ hoặc ngừng hỗ trợ, 9Router sẽ tự động Round-Robin sang model tiếp theo...`);
              }
            } catch (innerErr) {
              console.warn(`[TopifyAI] Lần thử ${attempt}/${MAX_RETRIES} qua "${modelToUse}" thất bại, 9Router sẽ tự động Round-Robin sang model tiếp theo:`, innerErr);
            }
          }
        }
      } catch (e) {
        console.warn('[TopifyAI] AI chat call failed, falling back to heuristic:', e);
      }
    }

    // 2. Intelligent Heuristic Fallback
    if (!assistantResponse) {
      assistantResponse = this.generateHeuristicChatReply(session.persona, userContent, personaName);
      modelUsed = 'Topify AI Engine';
    }

    const assistantMsg: AiChatMessage = {
      id: `msg-a-${Date.now()}`,
      role: 'assistant',
      content: assistantResponse,
      createdAt: new Date().toISOString(),
      modelUsed,
    };
    session.messages.push(assistantMsg);

    // Update title if it was first user message and title was still default
    if (session.messages.length <= 3 && session.title.includes('mới')) {
      session.title = userContent.slice(0, 40) + '...';
    }

    return assistantMsg;
  }

  public deleteSession(id: string): boolean {
    const idx = this.sessions.findIndex((s) => s.id === id);
    if (idx !== -1) {
      this.sessions.splice(idx, 1);
      return true;
    }
    return false;
  }

  // ==========================================
  // CONTENT GENERATOR (F157)
  // ==========================================

  public async generateVideoScript(params: {
    topic: string;
    brandVoice?: string;
    targetDuration?: number;
    systemPrompt?: string;
  }): Promise<VideoScriptResult> {
    const { topic, brandVoice = 'Hào hứng, cuốn hút', targetDuration = 45 } = params;
    const sysPrompt = (params.systemPrompt && params.systemPrompt.trim())
      ? params.systemPrompt.trim()
      : this.adminSettings.scriptSystemPrompt;

    // Check 9router
    if (isNineRouterConfigured()) {
      try {
        const client = getNineRouterClient();
        if (client) {
          const completion = await client.chat.completions.create({
            model: this.activeModelId,
            messages: [
              {
                role: 'system',
                content: `${sysPrompt}\nPhản hồi CHỈ BẰNG JSON thuần túy (không kèm markdown): { "title": "...", "hookVariant": "...", "scenes": [{ "timeSlot": "0:00 - 0:03", "phase": "HOOK", "visual": "...", "audioVoiceover": "...", "onscreenText": "..." }], "suggestedHashtags": ["#xuhuong", "#marketing", "#topify"], "estimatedViralScore": 95 }`,
              },
              {
                role: 'user',
                content: `Chủ đề: ${topic}. Văn phong: ${brandVoice}. Thời lượng mục tiêu: ${targetDuration}s.`,
              },
            ],
            temperature: 0.7,
          });
          const raw = completion.choices[0]?.message?.content?.trim();
          if (raw) {
            const parsed = JSON.parse(cleanJsonOutput(raw));
            if (Array.isArray(parsed.scenes) && parsed.scenes.length > 0) {
              return {
                title: parsed.title || `Kịch bản TikTok: ${topic}`,
                topic,
                durationSeconds: targetDuration,
                hookVariant: parsed.hookVariant || 'Hook tò mò & nghịch lý',
                scenes: parsed.scenes,
                suggestedHashtags: Array.isArray(parsed.suggestedHashtags) ? parsed.suggestedHashtags : ['#xuhuong', '#marketing', '#topify'],
                estimatedViralScore: parsed.estimatedViralScore || 92,
              };
            }
          }
        }
      } catch (e) {
        console.warn('[TopifyAI] Video script AI failed, using heuristic fallback:', e);
      }
    }

    // Heuristic Fallback Video Script
    return {
      title: `Kịch bản TikTok Viral: Bí quyết ${topic}`,
      topic,
      durationSeconds: targetDuration,
      hookVariant: 'Hook nghịch lý 3 giây đầu (Attention Grabber)',
      scenes: [
        {
          timeSlot: '0:00 - 0:03',
          phase: 'HOOK',
          visual: 'Diễn viên chỉ thẳng vào camera với vẻ mặt sửng sốt, chữ to màu đỏ xuất hiện',
          audioVoiceover: `90% người làm kinh doanh đều đang mắc sai lầm chí mạng này về ${topic}!`,
          onscreenText: 'DỪNG LẠI NGAY! ⚠️',
        },
        {
          timeSlot: '0:03 - 0:25',
          phase: 'BODY',
          visual: 'Màn hình chia đôi: Bên trái làm thủ công mất 3 tiếng, bên phải dùng Topify chỉ mất 30 giây',
          audioVoiceover: `Thay vì ngồi cặm cụi cả ngày, đây là 3 bước giúp bạn giải quyết triệt để ${topic} hoàn toàn tự động.`,
          onscreenText: '3 BƯỚC TỰ ĐỘNG HÓA 🚀',
        },
        {
          timeSlot: '0:25 - 0:38',
          phase: 'BODY',
          visual: 'Quay cận cảnh kết quả doanh thu và lượng khách hàng phản hồi tích cực',
          audioVoiceover: 'Chỉ sau 1 tuần áp dụng, hiệu quả công việc đã tăng gấp 3 mà không cần tốn thêm chi phí nhân sự.',
          onscreenText: 'KẾT QUẢ THỰC TẾ 📈',
        },
        {
          timeSlot: '0:38 - 0:45',
          phase: 'CTA',
          visual: 'Chỉ tay xuống phần bình luận và biểu tượng thả tim',
          audioVoiceover: 'Thả tim và để lại bình luận để mình gửi tặng trọn bộ kịch bản này miễn phí nhé!',
          onscreenText: 'BÌNH LUẬN "XIN" ĐỂ NHẬN 🎁',
        },
      ],
      suggestedHashtags: ['#xuhuong', '#kinhdoanhtiktok', '#topify', '#marketingonline', '#viralvideo'],
      estimatedViralScore: 94,
    };
  }

  public async generateViralHeadlines(params: { topic: string; systemPrompt?: string } | string): Promise<ViralHeadlineItem[]> {
    const topic = typeof params === 'string' ? params : params.topic;
    const customPrompt = typeof params === 'string' ? undefined : params.systemPrompt;
    const sysPrompt = (customPrompt && customPrompt.trim()) ? customPrompt.trim() : this.adminSettings.headlinesSystemPrompt;

    if (isNineRouterConfigured()) {
      try {
        const client = getNineRouterClient();
        if (client) {
          const completion = await client.chat.completions.create({
            model: this.activeModelId,
            messages: [
              {
                role: 'system',
                content: `${sysPrompt}\nTrả về JSON thuần túy theo định dạng (không kèm markdown): { "headlines": [ { "id": "hl-1", "headline": "...", "angle": "FOMO", "attentionScore": 95, "reason": "..." }, ... ] }`,
              },
              { role: 'user', content: `Chủ đề bài viết: ${topic}` },
            ],
            temperature: 0.7,
          });
          const raw = completion.choices[0]?.message?.content?.trim();
          if (raw) {
            const parsed = JSON.parse(cleanJsonOutput(raw));
            if (Array.isArray(parsed.headlines) && parsed.headlines.length > 0) {
              return parsed.headlines;
            }
          }
        }
      } catch (e) {
        console.warn('[TopifyAI] Viral headlines AI failed, using heuristic fallback:', e);
      }
    }

    return [
      {
        id: 'hl-1',
        headline: `Sự thật gây sốc về ${topic} mà không chuyên gia nào dám nói với bạn!`,
        angle: 'CURIOSITY',
        attentionScore: 96,
        reason: 'Đánh trúng tâm lý tò mò và khao khát tiếp cận thông tin độc quyền',
      },
      {
        id: 'hl-2',
        headline: `Nếu bạn không áp dụng cách này về ${topic}, bạn đang vứt tiền qua cửa sổ mỗi ngày!`,
        angle: 'FOMO',
        attentionScore: 92,
        reason: 'Kích hoạt nỗi sợ mất tiền (Loss Aversion) cực mạnh',
      },
      {
        id: 'hl-3',
        headline: `Quy trình 3 bước làm chủ ${topic} trong 15 phút (Người mới cũng làm được)`,
        angle: 'HOW_TO',
        attentionScore: 88,
        reason: 'Cung cấp giải pháp rõ ràng, cụ thể và không rào cản kỹ thuật',
      },
      {
        id: 'hl-4',
        headline: `Tại sao 99% mọi người thất bại với ${topic}? (Và bí quyết của top 1%)`,
        angle: 'CONTROVERSIAL',
        attentionScore: 94,
        reason: 'Tạo đối trọng tâm lý giữa đa số thất bại và nhóm tinh hoa dẫn đầu',
      },
      {
        id: 'hl-5',
        headline: `Khám phá con số 300% tăng trưởng thần tốc từ ${topic} chỉ sau 30 ngày`,
        angle: 'STATISTIC',
        attentionScore: 90,
        reason: 'Bằng chứng số liệu thuyết phục gia tăng độ tin cậy tức thì',
      },
    ];
  }

  public async generateCaptions(params: {
    productName: string;
    benefits: string;
    framework: 'AIDA' | 'PAS' | 'BAB';
    systemPrompt?: string;
  }): Promise<CaptionResult> {
    const { productName, benefits, framework } = params;
    const sysPrompt = (params.systemPrompt && params.systemPrompt.trim())
      ? params.systemPrompt.trim()
      : this.adminSettings.captionsSystemPrompt;

    if (isNineRouterConfigured()) {
      try {
        const client = getNineRouterClient();
        if (client) {
          const completion = await client.chat.completions.create({
            model: this.activeModelId,
            messages: [
              {
                role: 'system',
                content: `${sysPrompt}\nHãy viết bài viết quảng cáo / caption bán hàng theo khung ${framework} cho sản phẩm được yêu cầu. Đảm bảo ngôn từ thu hút, có emoji, ngắt dòng đẹp mắt và lời kêu gọi hành động cụ thể. Trả về JSON thuần túy (không kèm markdown): { "framework": "${framework}", "headline": "...", "content": "...", "callToAction": "...", "hashtags": ["#tag1", "#tag2", "#tag3"] }`,
              },
              { role: 'user', content: `Tên sản phẩm: ${productName}. Lợi ích cốt lõi: ${benefits}. Khung viết: ${framework}.` },
            ],
            temperature: 0.7,
          });
          const raw = completion.choices[0]?.message?.content?.trim();
          if (raw) {
            const parsed = JSON.parse(cleanJsonOutput(raw));
            if (parsed.headline && parsed.content) {
              return {
                framework,
                headline: parsed.headline,
                content: parsed.content,
                callToAction: parsed.callToAction || '👉 Bấm link Bio để đặt ngay hôm nay!',
                hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : ['#topify', '#marketing', '#viral'],
                characterCount: (parsed.content || '').length,
              };
            }
          }
        }
      } catch (e) {
        console.warn('[TopifyAI] Caption AI failed, using heuristic fallback:', e);
      }
    }


    if (framework === 'PAS') {
      return {
        framework: 'PAS',
        headline: `🚨 CÓ PHẢI BẠN ĐANG MỆT MỎI VÌ TỐN QUÁ NHIỀU THỜI GIAN?`,
        content: `• Problem (Vấn đề): Bạn phải thức khuya dậy sớm trả lời từng tin nhắn, quản lý bài viết và đối soát doanh thu bằng tay.\n• Agitate (Đào sâu nỗi đau): Mỗi phút chậm trễ là khách hàng chạy sang đối thủ, đơn hàng trôi đi, chi phí quảng cáo tăng chóng mặt.\n• Solution (Giải pháp): ${productName} ra đời để giải phóng hoàn toàn sức lao động cho bạn. Với ${benefits}, mọi quy trình từ đăng bài đến chốt đơn đều tự động 100%!`,
        callToAction: `👉 Nhấp vào đường link bên dưới để dùng thử miễn phí 14 ngày ngay!`,
        hashtags: ['#giaiphapkinhdoanh', '#tudonghoa', '#topify', '#marketing', '#tangdoanhso'],
        characterCount: 485,
      };
    } else if (framework === 'BAB') {
      return {
        framework: 'BAB',
        headline: `✨ TỪ 0 ĐƠN HÀNG ĐẾN DOANH SỐ HÀNG TRĂM TRIỆU MỖI THÁNG`,
        content: `• Before (Trước đây): Tối mặt tối mũi với bảng tính Excel, sót đơn, cạn kiệt ý tưởng nội dung.\n• After (Hiện tại): Thảnh thơi uống cafe mỗi sáng trong khi hệ thống tự động đăng bài lên 5 nền tảng và báo về 50+ đơn hàng mới.\n• Bridge (Cầu nối): Bí mật chính là ${productName} - Nền tảng sở hữu ${benefits}.`,
        callToAction: `🔥 Inbox ngay hôm nay để nhận trọn bộ công cụ quà tặng trị giá 5.000.000đ!`,
        hashtags: ['#thanhcong', '#chuyendoiso', '#kinhdoanhol', '#tietkiemthoigian'],
        characterCount: 460,
      };
    }

    // Default AIDA
    return {
      framework: 'AIDA',
      headline: `🔥 ĐỘT PHÁ DOANH SỐ VỚI SIÊU PHẨM ${productName.toUpperCase()}!`,
      content: `• Attention: Bạn đã sẵn sàng nâng cấp quy trình bán hàng đa kênh lên chuẩn chuyên nghiệp?\n• Interest: ${productName} tích hợp trí tuệ nhân tạo AI giúp ${benefits}.\n• Desire: Hơn 10.000+ nhà bán hàng và agency đã áp dụng và tiết kiệm tới 70% thời gian vận hành.\n• Action: Đăng ký ngay để nhận ưu đãi giảm 30% gói bản quyền trọn đời.`,
      callToAction: `⚡ Bấm vào link Bio hoặc để lại bình luận để nhận tư vấn trực tiếp!`,
      hashtags: ['#sieusaletopify', '#marketingtudong', '#hotdeal', '#tangtruong'],
      characterCount: 512,
    };
  }

  // ==========================================
  // IMAGE GENERATOR (F158)
  // ==========================================

  public getGeneratedImages(): GeneratedImageItem[] {
    return this.generatedImages;
  }

  public async generateImage(params: {
    prompt: string;
    style: GeneratedImageItem['style'];
    aspectRatio: GeneratedImageItem['aspectRatio'];
    systemPrompt?: string;
  }): Promise<GeneratedImageItem> {
    const { prompt, style, aspectRatio } = params;

    const dimensions = {
      '1:1': { w: 1024, h: 1024 },
      '9:16': { w: 720, h: 1280 },
      '16:9': { w: 1280, h: 720 },
      '4:5': { w: 1080, h: 1350 },
    }[aspectRatio] || { w: 1024, h: 1024 };

    const stylePromptModifier: Record<string, string> = {
      '3D_RENDER': '3d render, octane render, 8k resolution, cinematic lighting, ultra detailed masterpiece',
      'CYBERPUNK': 'cyberpunk style, neon lights, glowing accents, futuristic aesthetic, 8k wallpaper',
      'STUDIO_MINIMAL': 'minimalist studio lighting, clean elegant pastel background, soft shadows, sharp focus',
      'REALISTIC': 'photorealistic, ultra detailed, natural lighting, professional photography, 8k UHD',
      'ANIME': 'anime art style, vibrant colors, makoto shinkai aesthetic, high quality illustration',
    };

    const modifier = stylePromptModifier[style] || 'high quality aesthetic 8k';
    const seed = Math.floor(Math.random() * 9000000) + 1000000;
    const enrichedPrompt = `${prompt.trim()}, ${modifier}`;
    const encodedPrompt = encodeURIComponent(enrichedPrompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${dimensions.w}&height=${dimensions.h}&seed=${seed}&nologo=true`;

    const newImg: GeneratedImageItem = {
      id: `img-${Date.now()}`,
      prompt: prompt.trim(),
      style,
      aspectRatio,
      imageUrl,
      createdAt: new Date().toISOString(),
      width: dimensions.w,
      height: dimensions.h,
    };

    this.generatedImages.unshift(newImg);
    return newImg;
  }

  // ==========================================
  // VIDEO & STORYBOARD GENERATOR (F159)
  // ==========================================

  public getGeneratedVideos(): GeneratedVideoItem[] {
    return this.generatedVideos;
  }

  public async generateVideoStoryboard(params: {
    prompt: string;
    aspectRatio: GeneratedVideoItem['aspectRatio'];
    systemPrompt?: string;
  }): Promise<GeneratedVideoItem> {
    const { prompt, aspectRatio } = params;
    const sysPrompt = (params.systemPrompt && params.systemPrompt.trim())
      ? params.systemPrompt.trim()
      : this.adminSettings.storyboardSystemPrompt;

    if (isNineRouterConfigured()) {
      try {
        const client = getNineRouterClient();
        if (client) {
          const completion = await client.chat.completions.create({
            model: this.activeModelId,
            messages: [
              {
                role: 'system',
                content: `${sysPrompt}\nThiết kế storyboard 3-4 cảnh quay chi tiết từ ý tưởng của người dùng. Mỗi cảnh quay gồm: sceneNumber (số), durationSeconds (số), cameraMovement (vd: "Fast Drone In", "Close-Up Tracking", "Slow Orbit Right", "Pan Left"), visualPrompt (mô tả cảnh quay và ánh sáng), voiceover (lời đọc), bgmMood (cảm xúc âm nhạc nền). Trả về JSON thuần túy (không kèm markdown): { "title": "...", "scenes": [...] }`,
              },
              { role: 'user', content: `Ý tưởng video: ${prompt}. Tỉ lệ khung hình: ${aspectRatio}.` },
            ],
            temperature: 0.7,
          });
          const raw = completion.choices[0]?.message?.content?.trim();
          if (raw) {
            const parsed = JSON.parse(cleanJsonOutput(raw));
            if (Array.isArray(parsed.scenes) && parsed.scenes.length > 0) {
              const enhancedScenes: StoryboardScene[] = parsed.scenes.map((s: any, idx: number) => {
                const sNum = s.sceneNumber || idx + 1;
                const seed = Math.floor(Math.random() * 800000) + (idx + 1) * 1000;
                const conceptImg = `https://image.pollinations.ai/prompt/${encodeURIComponent((s.visualPrompt || prompt) + ', cinematic vertical video scene concept, 8k')}?width=720&height=1280&seed=${seed}&nologo=true`;
                return {
                  sceneNumber: sNum,
                  durationSeconds: s.durationSeconds || 6,
                  cameraMovement: s.cameraMovement || 'Cinematic Tracking',
                  visualPrompt: s.visualPrompt || `Cảnh quay mô tả ${prompt}`,
                  voiceover: s.voiceover || '',
                  bgmMood: s.bgmMood || 'Hào hứng, hiện đại',
                  conceptImageUrl: conceptImg,
                };
              });

              const newVideo: GeneratedVideoItem = {
                id: `vid-${Date.now()}`,
                title: parsed.title || `Video Storyboard: ${prompt.slice(0, 35)}...`,
                prompt,
                durationSeconds: enhancedScenes.reduce((acc, s) => acc + (s.durationSeconds || 5), 0) || 30,
                aspectRatio,
                status: 'COMPLETED',
                videoPreviewUrl: enhancedScenes[0]?.conceptImageUrl || '',
                createdAt: new Date().toISOString(),
                scenes: enhancedScenes,
              };
              this.generatedVideos.unshift(newVideo);
              return newVideo;
            }
          }
        }
      } catch (e) {
        console.warn('[TopifyAI] Storyboard AI failed, using heuristic fallback:', e);
      }
    }

    const fallbackScenes: StoryboardScene[] = [
      {
        sceneNumber: 1,
        durationSeconds: 4,
        cameraMovement: 'Fast Drone In',
        visualPrompt: `Cảnh quay mở đầu ấn tượng thể hiện: ${prompt}`,
        voiceover: 'Chào mừng các bạn đã quay trở lại với series bí quyết marketing hôm nay!',
        bgmMood: 'Hào hứng, hiện đại',
        conceptImageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + ', cinematic opening drone shot, 8k')}?width=720&height=1280&seed=101&nologo=true`,
      },
      {
        sceneNumber: 2,
        durationSeconds: 16,
        cameraMovement: 'Close-Up Tracking',
        visualPrompt: `Chi tiết giải pháp thực hiện: ${prompt} với kết quả vượt trội`,
        voiceover: 'Tất cả các bước thực thi đều được tối ưu hóa chỉ trong vòng 3 phút.',
        bgmMood: 'Năng động, truyền cảm hứng',
        conceptImageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + ', close-up detailed workflow demonstration, 8k')}?width=720&height=1280&seed=102&nologo=true`,
      },
      {
        sceneNumber: 3,
        durationSeconds: 10,
        cameraMovement: 'Slow Orbit Right',
        visualPrompt: 'Thương hiệu xuất hiện cùng nút kêu gọi hành động ấn tượng',
        voiceover: 'Nhấn vào link bên dưới để nhận ngay ưu đãi dùng thử độc quyền hôm nay!',
        bgmMood: 'Quyết liệt, chốt đơn',
        conceptImageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + ', call to action closing shot with logo, 8k')}?width=720&height=1280&seed=103&nologo=true`,
      },
    ];

    const newVideo: GeneratedVideoItem = {
      id: `vid-${Date.now()}`,
      title: `Video Storyboard: ${prompt.slice(0, 35)}...`,
      prompt,
      durationSeconds: 30,
      aspectRatio,
      status: 'COMPLETED',
      videoPreviewUrl: fallbackScenes[0].conceptImageUrl || '',
      createdAt: new Date().toISOString(),
      scenes: fallbackScenes,
    };

    this.generatedVideos.unshift(newVideo);
    return newVideo;
  }

  // ==========================================
  // VOICE & AUDIO TTS STUDIO (F160)
  // ==========================================

  public getGeneratedVoices(): GeneratedVoiceItem[] {
    return this.generatedVoices;
  }

  public async generateVoice(params: {
    text: string;
    voiceId: string;
    tone: GeneratedVoiceItem['tone'];
    speed: number;
  }): Promise<GeneratedVoiceItem> {
    const { text, voiceId, tone, speed = 1.0 } = params;

    const voiceNames: Record<string, { name: string; lang: 'vi-VN' | 'en-US'; gender: 'FEMALE' | 'MALE' }> = {
      'vi-VN-HoaiMy': { name: 'Hoài My (Nữ miền Nam)', lang: 'vi-VN', gender: 'FEMALE' },
      'vi-VN-NamMinh': { name: 'Nam Minh (Nam miền Bắc)', lang: 'vi-VN', gender: 'MALE' },
      'vi-VN-ThuThao': { name: 'Thu Thảo (Nữ miền Trung)', lang: 'vi-VN', gender: 'FEMALE' },
      'en-US-Jenny': { name: 'Jenny (US Female Accent)', lang: 'en-US', gender: 'FEMALE' },
      'en-US-Guy': { name: 'Guy (US Male Professional)', lang: 'en-US', gender: 'MALE' },
    };

    const voiceMeta = voiceNames[voiceId] || voiceNames['vi-VN-HoaiMy'];
    const wordCount = text.trim().split(/\s+/).length;
    const estDuration = Math.max(2, Math.round((wordCount / (2.5 * speed)) * 10) / 10);

    const newVoice: GeneratedVoiceItem = {
      id: `voice-${Date.now()}`,
      text,
      voiceId,
      voiceName: voiceMeta.name,
      language: voiceMeta.lang,
      gender: voiceMeta.gender,
      tone,
      speed,
      durationSeconds: estDuration,
      audioUrl: 'https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg',
      createdAt: new Date().toISOString(),
    };

    this.generatedVoices.unshift(newVoice);
    return newVoice;
  }

  // ==========================================
  // REPURPOSING ENGINE (F161)
  // ==========================================

  public getRepurposedPackages(): RepurposedPackage[] {
    return this.repurposedPackages;
  }

  public async repurposeContent(originalText: string): Promise<RepurposedPackage> {
    if (isNineRouterConfigured()) {
      try {
        const client = getNineRouterClient();
        if (client) {
          const completion = await client.chat.completions.create({
            model: this.activeModelId,
            messages: [
              {
                role: 'system',
                content: `Bạn là Chuyên gia Tái chế Nội dung Đa Kênh (Omnichannel Content Repurposing). Tiếp nhận 1 bài viết hoặc ý tưởng dài, tự động chuyển đổi thành trọn bộ gói truyền thông:
1. shortVideoScripts: 2 kịch bản video ngắn TikTok/Reels có hook, body, cta, duration.
2. socialThread: 1 chuỗi bài 3 phần đăng Twitter/Threads/Facebook (postNumber, text).
3. emailNewsletter: 1 bản tin email (subject, preheader, body, ctaButton).
4. viralQuotes: 3 câu trích dẫn ngắn gọn ấn tượng.
Trả về JSON thuần túy:
{
  "shortVideoScripts": [ { "id": "sc-1", "hook": "...", "body": "...", "cta": "...", "duration": "35s" } ],
  "socialThread": [ { "postNumber": 1, "text": "..." } ],
  "emailNewsletter": { "subject": "...", "preheader": "...", "body": "...", "ctaButton": "..." },
  "viralQuotes": ["...", "..."]
}`,
              },
              { role: 'user', content: `Nội dung gốc cần tái chế:\n"""\n${originalText}\n"""` },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
          });
          const raw = completion.choices[0]?.message?.content?.trim();
          if (raw) {
            const parsed = JSON.parse(cleanJsonOutput(raw));
            if (Array.isArray(parsed.shortVideoScripts) && Array.isArray(parsed.socialThread)) {
              const pkg: RepurposedPackage = {
                id: `rep-${Date.now()}`,
                originalText,
                createdAt: new Date().toISOString(),
                shortVideoScripts: parsed.shortVideoScripts,
                socialThread: parsed.socialThread,
                emailNewsletter: parsed.emailNewsletter || {
                  subject: `[Bản tin] Tối ưu hiệu suất cùng Topify`,
                  preheader: 'Chia sẻ kiến thức thực chiến',
                  body: originalText.slice(0, 200),
                  ctaButton: 'Xem chi tiết',
                },
                viralQuotes: Array.isArray(parsed.viralQuotes) ? parsed.viralQuotes : [],
              };
              this.repurposedPackages.unshift(pkg);
              return pkg;
            }
          }
        }
      } catch (e) {
        console.warn('[TopifyAI] Repurpose AI failed, using heuristic fallback:', e);
      }
    }

    const pkg: RepurposedPackage = {
      id: `rep-${Date.now()}`,
      originalText,
      createdAt: new Date().toISOString(),
      shortVideoScripts: [
        {
          id: 'sc-rep-1',
          hook: 'Nếu bạn đang làm marketing, đây là bí mật bạn không thể bỏ qua!',
          body: originalText.slice(0, 180) + '...',
          cta: 'Lưu lại video và áp dụng ngay nhé!',
          duration: '35s',
        },
        {
          id: 'sc-rep-2',
          hook: '3 điều mình ước mình biết sớm hơn trước khi bắt đầu kinh doanh online:',
          body: 'Thứ nhất: Tự động hóa là chìa khóa. Thứ hai: Đo lường số liệu realtime. Thứ ba: Không bỏ sót bất kỳ khách hàng tiềm năng nào...',
          cta: 'Bình luận để nhận tài liệu hướng dẫn chi tiết!',
          duration: '45s',
        },
      ],
      socialThread: [
        {
          postNumber: 1,
          text: `🧵 Đúc kết kinh nghiệm thực chiến từ: "${originalText.slice(0, 50)}..." (Phần 1/3)`,
        },
        {
          postNumber: 2,
          text: `Chi tiết cốt lõi: ${originalText.slice(0, 150)}... Bạn thấy điểm nào quan trọng nhất? (Phần 2/3)`,
        },
        {
          postNumber: 3,
          text: `Hành động ngay hôm nay: Hãy cài đặt tự động hóa và tối ưu chuyển đổi để không bị tụt lại phía sau! (Phần 3/3)`,
        },
      ],
      emailNewsletter: {
        subject: `[Bản tin tuần] Tối ưu hóa hiệu suất với giải pháp mới nhất`,
        preheader: `Những điểm cốt lõi bạn cần nắm vững trong tuần này...`,
        body: `Chào bạn,\n\nChúng tôi vừa có một phát hiện rất thú vị muốn chia sẻ cùng bạn:\n\n"${originalText}"\n\nHãy dành 5 phút để ứng dụng vào công việc kinh doanh của bạn ngay nhé!`,
        ctaButton: 'Xem Chi Tiết Chiến Dịch',
      },
      viralQuotes: [
        `"Thành công trong kinh doanh không đến từ việc làm nhiều hơn, mà từ việc tự động hóa những gì lặp lại."`,
        `"Khách hàng không chờ đợi bạn. Ai phản hồi nhanh hơn, người đó chiến thắng."`,
        `"Một hệ thống tốt đáng giá hơn mười nhân viên làm việc chăm chỉ nhưng thiếu công cụ."`,
      ],
    };

    this.repurposedPackages.unshift(pkg);
    return pkg;
  }

  // ==========================================
  // MODEL ROUTING & GATEWAY (F162)
  // ==========================================

  public getModels(): AiModelItem[] {
    return this.availableModels.map((m) => ({
      ...m,
      isDefault: m.id === this.activeModelId,
    }));
  }

  public setActiveModel(modelId: string): boolean {
    const found = this.availableModels.find((m) => m.id === modelId);
    if (found) {
      this.activeModelId = modelId;
      return true;
    }
    return false;
  }

  public getGatewayStatus(): AiGatewayStatus {
    const isConfigured = isNineRouterConfigured();
    return {
      isConfigured,
      gatewayUrl: 'Topify AI Cloud Engine',
      activeModel: 'Topify AI Cloud v2.5',
      latencyMs: isConfigured ? 145 : 18,
      todayTokensUsed: 14250,
      remainingCredits: 985750,
      status: isConfigured ? 'ONLINE' : 'FALLBACK_HEURISTIC',
    };
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  private getPersonaWelcomeMessage(persona: AiChatSession['persona']): string {
    switch (persona) {
      case 'MARKETING_STRATEGIST':
        return 'Xin chào! Tôi là Trợ lý Chiến Lược Marketing Topify AI. Tôi có thể giúp bạn lập kế hoạch chiến dịch, phân bổ ngân sách và thiết kế phễu chuyển đổi đa kênh. Bạn đang quan tâm đến mục tiêu nào?';
      case 'VIRAL_COPYWRITER':
        return 'Chào bạn! Tôi là Chuyên gia Copywriting Viral. Hãy gửi cho tôi sản phẩm hoặc ý tưởng của bạn, tôi sẽ giúp bạn biến nó thành kịch bản triệu view và caption thôi miên khách hàng!';
      case 'SALES_CLOSER':
        return 'Chào bạn! Tôi là Trợ lý Chốt Sales & Xử Lý Từ Chối. Tôi sẽ cung cấp cho bạn những kịch bản telesales và tin nhắn chốt đơn tỷ lệ chuyển đổi cao nhất.';
      case 'AUTO_TECH':
        return 'Chào bạn! Tôi là Chuyên viên Kỹ thuật & Tự động hóa Topify. Tôi sẵn sàng hỗ trợ bạn thiết lập các kịch bản Trigger, Condition và kết nối Webhook mượt mà.';
      default:
        return 'Xin chào! Tôi là Topify AI Assistant. Tôi có thể hỗ trợ gì cho bạn hôm nay?';
    }
  }

  private getPersonaSystemPrompt(persona: AiChatSession['persona']): string {
    switch (persona) {
      case 'MARKETING_STRATEGIST':
        return 'Bạn là Giám đốc Marketing kỳ cựu với 15 năm kinh nghiệm. Trả lời sắc bén, thực chiến, tập trung vào ROI và chuyển đổi doanh thu cho doanh nghiệp Việt Nam.';
      case 'VIRAL_COPYWRITER':
        return 'Bạn là Bậc thầy sáng tạo nội dung mạng xã hội TikTok, Facebook, Shopee. Viết cuốn hút, sử dụng từ ngữ giàu hình ảnh, áp dụng các khung AIDA, PAS và tạo Hook mạnh mẽ.';
      case 'SALES_CLOSER':
        return 'Bạn là Chuyên gia đào tạo bán hàng hàng đầu. Đưa ra các câu trả lời trực diện, xử lý từ chối khéo léo, biến phản đối thành cơ hội chốt đơn tức thì.';
      case 'AUTO_TECH':
        return 'Bạn là Kỹ sư Tự động hóa hệ thống. Hướng dẫn logic, rành mạch, bảo mật và tối ưu hiệu suất luồng công việc.';
      default:
        return 'Bạn là Trợ lý AI toàn năng của nền tảng Topify. Luôn thân thiện, chuyên nghiệp và hữu ích.';
    }
  }

  private generateHeuristicChatReply(persona: string, userContent: string, personaName?: string): string {
    const lc = userContent.toLowerCase();
    const displayName = personaName || this.getPersonaById(persona)?.name || 'Trợ lý Topify AI';

    if (lc.includes('giá') || lc.includes('chi phí') || lc.includes('bao nhiêu')) {
      return 'Về bảng giá dịch vụ Topify:\n- **Gói Basic:** $19/tháng (Thích hợp cá nhân, nuôi 5 tài khoản)\n- **Gói Pro Agency:** $49/tháng (Phổ biến nhất, 25 tài khoản, full AI & Automation)\n- **Gói Enterprise:** $99/tháng (Không giới hạn tính năng, hỗ trợ kỹ thuật riêng 24/7)\n\nĐặc biệt khi giới thiệu bạn bè, bạn nhận ngay 15% - 25% hoa hồng trọn đời vào Ví Topify!';
    }

    if (lc.includes('kịch bản') || lc.includes('video') || lc.includes('tiktok') || lc.includes('reels')) {
      return `Dưới đây là gợi ý kịch bản viral 30s cho ý tưởng "${userContent.slice(0, 30)}":\n\n1. **Hook (0-3s):** "Nếu bạn đang làm việc này mỗi ngày, hãy dừng lại ngay trước khi quá muộn!"\n2. **Nội dung (3-20s):** Chia sẻ giải pháp nhanh gọn bằng công nghệ tự động hóa, minh họa kết quả cụ thể.\n3. **Kêu gọi hành động (20-30s):** "Nhấn theo dõi kênh và bình luận bên dưới để nhận tài liệu miễn phí!"`;
    }

    if (lc.includes('tự động') || lc.includes('automation') || lc.includes('bot')) {
      return 'Topify Automation (M11) hỗ trợ bạn:\n- Tự động trả lời comment & tin nhắn theo từ khóa\n- Tự động phân loại và gắn thẻ tag CRM cho khách VIP\n- Tự động tạo công việc khẩn cấp cho nhân viên ca trực\n\nBạn có thể vào tab "Tự động hóa" trên thanh menu để áp dụng ngay 5 mẫu kịch bản 1-click có sẵn!';
    }

    return `Cảm ơn bạn đã đặt câu hỏi! Với tư cách là ${displayName}, tôi luôn sẵn sàng hỗ trợ bạn:\n\n1. **Tính nhất quán:** Duy trì đăng tải nội dung đều đặn mỗi ngày.\n2. **Tối ưu tốc độ phản hồi:** Đừng để khách chờ quá 5 phút, hãy bật Topify Inbox Auto-Reply.\n3. **Kiểm tra số liệu:** Thường xuyên theo dõi Báo cáo & Phân tích để tối ưu ngân sách.\n\nBạn có muốn tôi hỗ trợ viết chi tiết hơn về phần nào không?`;
  }
}

// Singleton Export
export const topifyAiStore = new TopifyAiStore();
