# Garage Radiator ERP - Giải pháp quản lý xưởng két nước ô tô chuyên nghiệp

Chào mừng bạn đến với hệ thống ERP hoàn chỉnh cho Garage/Xưởng sản xuất két nước. Đây là một nền tảng quản thức hiện đại, hỗ trợ bán hàng đa kênh (Omnichannel), quản lý kho theo lô (FIFO), tài chính minh bạch và bảo mật cấp độ doanh nghiệp.

## 🌟 Tính năng nổi bật

### 1. Giao diện Elevated Design (iOS HIG)
- Hệ thống UI được đại tu 100% theo phong cách Apple, mang lại cảm giác cao cấp, mượt mà.
- Cấu trúc Card-based, bo góc cực lớn và đổ bóng mềm mại giúp giảm mỏi mắt cho nhân viên vận hành.

### 2. Quản lý kho thông minh (FIFO & Locking)
- Tự động khấu trừ hàng theo lô nhập cũ nhất (First-In, First-Out).
- Cơ chế Locking giúp bảo vệ dữ liệu tồn kho khi có hàng trăm đơn hàng cùng lúc từ các sàn TMĐT.

### 3. Tích hợp Sàn TMĐT (Shopee, TikTok)
- Đồng bộ đơn hàng, tồn kho và tin nhắn Real-time qua Webhook Hub.
- Tự động làm mới Access Token (OAuth2) giúp hệ thống luôn kết nối 24/7.

### 4. Bảo mật & Hiệu năng
- **Mã hóa AES-256**: Bảo vệ Token nhạy cảm trong Database.
- **Rate Limiting**: Chống tấn công DDoS và cào dữ liệu trái phép.
- **Security Headers & CORS**: Thắt chặt an ninh cho các giao dịch tài chính.
- **Serilog Centralized Logging**: Truy vết lỗi và hoạt động hệ thống trong 30 ngày.

## 🏗 Kiến trúc kỹ thuật

- **Backend:** ASP.NET Core 9, EF Core (SQL Server), SignalR.
- **Frontend:** Next.js 15 (App Router), Tailwind CSS v4, Radix UI.
- **Thiết kế:** Apple Human Interface Guidelines (Elevated Style).

## 🛠 Hướng dẫn triển khai (Go-live)

Hệ thống đã sẵn sàng 99% về mặt kỹ thuật. Để bắt đầu kinh doanh, hãy thực hiện:

### 1. Cấu hình Backend
Mở `appsettings.json` trong `backend/GarageRadiatorERP.Api`:
- Cập nhật Connection String tới SQL Server của bạn.
- Điền `AppKey` và `AppSecret` nhận được từ cổng dev của Shopee/TikTok.
- Thiết lập biến môi trường `ERP_ENCRYPTION_KEY` (32 ký tự) để kích hoạt mã hóa.

### 2. Triển khai Production
- **Backend:** Build và chạy trên IIS hoặc Docker Container.
- **Frontend:** Build bằng lệnh `npm run build` và deploy lên Vercel hoặc Server Node.js.

## 📖 Tài liệu chi tiết (Brain Artifacts)

Để hiểu sâu hơn về quá trình phát triển và các thông số kỹ thuật, vui lòng tham khảo:
- [✅ Lộ trình triển khai & Trạng thái kỹ thuật](C:\Users\anhnt\.gemini\antigravity\brain\d357a814-1e62-4cc2-b0c4-248314df814e\implementation_plan.md)
- [📈 Nhật ký hoàn thiện nhiệm vụ](C:\Users\anhnt\.gemini\antigravity\brain\d357a814-1e62-4cc2-b0c4-248314df814e\task.md)
- [🎥 Video trải nghiệm thực tế (Walkthrough)](C:\Users\anhnt\.gemini\antigravity\brain\d357a814-1e62-4cc2-b0c4-248314df814e\walkthrough.md)
- [🛡 Báo cáo an ninh & Kiểm định](C:\Users\anhnt\.gemini\antigravity\brain\d357a814-1e62-4cc2-b0c4-248314df814e\project_analysis_report.md)

---
*Dự án được xây dựng bởi Antigravity AI Engineer.*
