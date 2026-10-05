const Captcha = require("2captcha");
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

class CaptchaSolver {
  constructor() {
    const apiKey = process.env.TWO_CAPTCHA_API_KEY;
    if (!apiKey) {
      console.warn("TWO_CAPTCHA_API_KEY is not defined in .env. Captcha bypass will not work.");
    }
    
    // Khởi tạo solver với 2captcha API key
    this.solver = new Captcha.Solver(apiKey || "");
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
