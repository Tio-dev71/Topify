require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Try to safely load 2captcha library if available
let SolverClass = null;
try {
  const CaptchaLib = require("2captcha");
  if (typeof CaptchaLib?.Solver === 'function') {
    SolverClass = CaptchaLib.Solver;
  } else if (typeof CaptchaLib?.default?.Solver === 'function') {
    SolverClass = CaptchaLib.default.Solver;
  } else if (typeof CaptchaLib === 'function') {
    SolverClass = CaptchaLib;
  }
} catch (e) {
  // Fall back to Direct2CaptchaSolver
}

/**
 * Direct 2Captcha HTTP Solver using native fetch (Node 18+ and Electron).
 * Zero external dependencies, immune to CJS/ESM/Webpack loader mismatches.
 */
class Direct2CaptchaSolver {
  constructor(apiKey, pollingFrequency = 5000) {
    this.apiKey = apiKey || "";
    this.pollingFrequency = pollingFrequency;
    this.inUrl = "https://2captcha.com/in.php";
    this.resUrl = "https://2captcha.com/res.php";
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async pollResponse(id) {
    await this.sleep(this.pollingFrequency);
    const url = `${this.resUrl}?key=${encodeURIComponent(this.apiKey)}&action=get&id=${encodeURIComponent(id)}&json=1`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 1) {
      return { data: data.request, id };
    }
    if (data.request === "CAPCHA_NOT_READY") {
      return this.pollResponse(id);
    }
    throw new Error(data.request || "Lỗi giải captcha");
  }

  async imageCaptcha(base64Image) {
    const res = await fetch(this.inUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: this.apiKey,
        method: "base64",
        body: base64Image,
        json: 1,
        soft_id: 3316
      })
    });
    const data = await res.json();
    if (data.status === 1) {
      return this.pollResponse(data.request);
    }
    throw new Error(data.request || "Lỗi gửi image captcha");
  }

  async recaptcha(siteKey, pageUrl, extra = {}) {
    const params = new URLSearchParams({
      key: this.apiKey,
      method: "userrecaptcha",
      googlekey: siteKey,
      pageurl: pageUrl,
      json: "1",
      soft_id: "3316",
      ...extra
    });
    const res = await fetch(`${this.inUrl}?${params.toString()}`);
    const data = await res.json();
    if (data.status === 1) {
      return this.pollResponse(data.request);
    }
    throw new Error(data.request || "Lỗi gửi reCAPTCHA");
  }

  async funCaptcha(publicKey, pageUrl, serviceUrl = null, extra = {}) {
    const params = new URLSearchParams({
      key: this.apiKey,
      method: "funcaptcha",
      publickey: publicKey,
      pageurl: pageUrl,
      json: "1",
      soft_id: "3316",
      ...(serviceUrl ? { surl: serviceUrl } : {}),
      ...extra
    });
    const res = await fetch(`${this.inUrl}?${params.toString()}`);
    const data = await res.json();
    if (data.status === 1) {
      return this.pollResponse(data.request);
    }
    throw new Error(data.request || "Lỗi gửi FunCaptcha");
  }

  async bad(captchaId) {
    try {
      const url = `${this.resUrl}?key=${encodeURIComponent(this.apiKey)}&action=reportbad&id=${encodeURIComponent(captchaId)}&json=1`;
      await fetch(url);
    } catch (e) {
      // ignore error
    }
  }
}

class CaptchaSolver {
  constructor() {
    const apiKey = process.env.TWO_CAPTCHA_API_KEY;
    if (!apiKey) {
      console.warn("TWO_CAPTCHA_API_KEY is not defined in .env. Captcha bypass will not work.");
    }
    
    // Khởi tạo solver: ưu tiên Direct2CaptchaSolver chuẩn native fetch để tương thích 100% Electron & Node
    if (SolverClass) {
      try {
        this.solver = new SolverClass(apiKey || "");
      } catch (err) {
        this.solver = new Direct2CaptchaSolver(apiKey || "");
      }
    } else {
      this.solver = new Direct2CaptchaSolver(apiKey || "");
    }
  }

  /**
   * Giải captcha hình ảnh (Normal Captcha)
   * @param {string} base64Image - Ảnh captcha dưới dạng base64
   * @returns {Promise<string>} - Text được giải từ ảnh
   */
  async solveImageCaptcha(base64Image) {
    try {
      console.log("[CaptchaSolver] Đang gửi ảnh captcha đến 2Captcha...");
      const res = await this.solver.imageCaptcha(base64Image);
      console.log(`[CaptchaSolver] Giải thành công: ${res.data}`);
      return res.data;
    } catch (err) {
      console.error(`[CaptchaSolver] Lỗi khi giải Image Captcha: ${err.message}`);
      throw err;
    }
  }

  /**
   * Giải reCAPTCHA V2
   * @param {string} siteKey - Site key của trang web
   * @param {string} pageUrl - URL của trang web chứa captcha
   * @returns {Promise<string>} - Token reCAPTCHA response
   */
  async solveRecaptchaV2(siteKey, pageUrl) {
    try {
      console.log("[CaptchaSolver] Đang gửi yêu cầu giải reCAPTCHA V2...");
      const res = await this.solver.recaptcha(siteKey, pageUrl);
      console.log(`[CaptchaSolver] Giải thành công reCAPTCHA V2!`);
      return res.data;
    } catch (err) {
      console.error(`[CaptchaSolver] Lỗi khi giải reCAPTCHA V2: ${err.message}`);
      throw err;
    }
  }

  /**
   * Giải FunCaptcha (Arkose Labs) - Dạng Captcha phổ biến trên Facebook
   * @param {string} publicKey - Public Key (Site Key) của FunCaptcha
   * @param {string} pageUrl - URL của trang chứa captcha
   * @param {string} [serviceUrl] - URL của Arkose service (VD: https://client-api.arkoselabs.com), có thể null
   * @param {string} [blob] - (Tùy chọn) Tham số data[blob] nếu Facebook yêu cầu
   * @returns {Promise<string>} - Token trả về sau khi giải xong
   */
  async solveFunCaptcha(publicKey, pageUrl, serviceUrl = null, blob = null) {
    try {
      console.log("[CaptchaSolver] Đang gửi yêu cầu giải FunCaptcha (Arkose Labs)...");
      let extra = {};
      if (blob) {
        extra["data[blob]"] = blob;
      }
      
      const res = await this.solver.funCaptcha(publicKey, pageUrl, serviceUrl, extra);
      console.log(`[CaptchaSolver] Giải thành công FunCaptcha!`);
      return res.data;
    } catch (err) {
      console.error(`[CaptchaSolver] Lỗi khi giải FunCaptcha: ${err.message}`);
      throw err;
    }
  }

  /**
   * Báo cáo captcha giải sai để được hoàn tiền
   * @param {string} captchaId - ID của captcha đã giải
   */
  async reportBad(captchaId) {
    try {
      await this.solver.bad(captchaId);
      console.log(`[CaptchaSolver] Đã báo cáo captcha giải sai (ID: ${captchaId})`);
    } catch (err) {
      console.error(`[CaptchaSolver] Lỗi khi báo cáo captcha sai: ${err.message}`);
    }
  }
}

module.exports = new CaptchaSolver();
