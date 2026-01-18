// ============================================================
// Middleware giới hạn tốc độ truy cập API (rate limit)
// ============================================================
const rateLimit = require('express-rate-limit'); // Thư viện express-rate-limit

/**
 * Giới hạn tốc độ truy cập API chung
 * Mỗi IP chỉ được gửi tối đa 10.000 request mỗi 15 phút
 * Thường dùng cho toàn bộ API (middleware global)
 * Tránh DDoS attack và bảo vệ server
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10000000, // Tối đa 10.000 request
  message: {
    success: false,
    error: {
      message: 'Bạn gửi quá nhiều yêu cầu, vui lòng thử lại sau',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true, // Trả về header RateLimit-*
  legacyHeaders: false, // Không trả về header X-RateLimit-*
});

/**
 * Giới hạn tốc độ cho các endpoint xác thực (login, register, forgot password...)
 * Mỗi IP chỉ được gửi tối đa 10.000 request mỗi 15 phút (chủ yếu cho dev/test)
 * Các request thành công sẽ không bị tính vào limit (giúp user thử lại khi nhập đúng)
 * Ngăn chặn brute force attack
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10000000, // Tối đa 10.000 request
  message: {
    success: false,
    error: {
      message: 'Bạn thực hiện xác thực quá nhiều lần, vui lòng thử lại sau',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
    },
  },
  skipSuccessfulRequests: true, // Không tính các request thành công (HTTP 2xx)
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Giới hạn tốc độ upload file
 * Mỗi user chỉ được upload tối đa 10 file mỗi giờ
 * Nếu chưa đăng nhập thì tính theo IP
 * Ngăn chặn spam upload
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max:  100, // Tối đa 50 file
  message: {
    success: false,
    error: {
      message: 'Bạn upload file quá nhiều, vui lòng thử lại sau',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    },
  },
  keyGenerator: (req) => {
    // Ưu tiên lấy userId nếu đã đăng nhập, nếu không thì lấy IP
    return req.user ? `user_${req.user.userId}` : req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Giới hạn tốc độ nộp bài thi
 * Mỗi user chỉ được nộp tối đa 3 lần mỗi phút
 * Nếu chưa đăng nhập thì tính theo IP
 * Ngăn chặn user spam submit answer liên tục
 */
const submissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max:  10000000, // Tối đa 30 lần submit
  message: {
    success: false,
    error: {
      message: 'Bạn nộp bài quá nhanh, vui lòng chờ rồi thử lại',
      code: 'SUBMISSION_RATE_LIMIT_EXCEEDED',
    },
  },
  keyGenerator: (req) => {
    // Tính theo user ID nếu đã login, nếu không thì tính theo IP
    return req.user ? `user_${req.user.userId}` : req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter,
  submissionLimiter,
};
