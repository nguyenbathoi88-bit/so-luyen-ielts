# Sổ Luyện IELTS — hướng dẫn đưa lên Vercel (free)

App đã nối sẵn tài khoản người dùng (Supabase) — chỉ còn bước đưa lên Vercel
và gắn API key để bật chấm AI.

## Cần gì
- Node.js trên máy (kiểm tra: `node -v`)
- Tài khoản Vercel (đăng nhập bằng GitHub/Google, không cần thẻ)
- API key Anthropic — lấy tại console.anthropic.com → API Keys

## 3 bước

1) Mở terminal tại thư mục này rồi chạy:

       npx vercel --prod

   Lần đầu sẽ hỏi đăng nhập (mở trình duyệt, bấm xác nhận), sau đó hỏi vài câu —
   cứ Enter để lấy mặc định. Xong sẽ in ra link dạng
   `https://so-luyen-ielts.vercel.app`.

2) Gắn API key để bật chấm Writing/Speaking:

       npx vercel env add ANTHROPIC_API_KEY production

   Dán key vào, rồi deploy lại để key có hiệu lực:

       npx vercel --prod

3) Xong. Gửi link cho ai cũng vào học được.

## Tài khoản người dùng (đã dựng sẵn)

| | |
|---|---|
| Supabase project | `so-luyen-ielts`, tổ chức `thoi-apps`, gói Free |
| Region | Southeast Asia (Singapore) |
| Bảng | `public.progress` — mỗi người một dòng, khoá theo `user_id` |
| Bảo mật | Row Level Security bật, 3 policy: chỉ đọc/ghi được dòng của chính mình |
| Đăng ký | Email + mật khẩu, KHÔNG cần xác nhận email (vào học ngay) |
| Giới hạn | Mỗi dòng tối đa 256 KB tiến độ |

Không đăng nhập thì app vẫn chạy đủ, tiến độ lưu trong trình duyệt.
Đăng nhập rồi thì tiến độ tự đẩy lên đám mây sau mỗi lần học, và **gộp** khi
mở ở máy khác: thẻ từ vựng lấy bản ôn nhiều lần hơn, điểm Reading/Listening
lấy điểm cao hơn, bài viết lấy bản mới hơn, chuỗi ngày học cộng gộp.

### Việc nên làm sau khi có domain
Supabase → Authentication → URL Configuration → đặt **Site URL** thành domain
Vercel của app.

### Cảnh báo vận hành
**Supabase tạm dừng project Free sau 1 tuần không có hoạt động.** Khi bị dừng,
đăng nhập sẽ lỗi cho tới khi anh bấm Restore trong dashboard. App vẫn học được
bình thường ở chế độ không đăng nhập.

## Biến môi trường Vercel
| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | Bắt buộc, để bật chấm AI |
| `ANTHROPIC_MODEL` | `claude-sonnet-5` | Model dùng để chấm |
| `DAILY_LIMIT` | `15` | Số lượt chấm mỗi IP mỗi ngày |

Van chặn chi phí thật sự nằm ở console.anthropic.com → Settings → Limits
(monthly spend limit). Đặt trước khi gửi link cho người khác.

## Cấu trúc
- `index.html` — toàn bộ app, một file, sửa trực tiếp được
- `api/grade.js` — hàm serverless gọi Anthropic để chấm bài
- `manifest.json`, `icon.svg` — để cài app lên màn hình chính
