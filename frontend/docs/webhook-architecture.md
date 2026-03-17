# Kiến trúc tích hợp Webhook (Shopee & TikTok Shop)

Tài liệu này mô tả kiến trúc thực tế của hệ thống Garage Radiator ERP khi kết nối với các sàn thương mại điện tử. Hệ thống được thiết kế để xử lý tải cao, đảm bảo không mất dữ liệu và bảo mật tuyệt đối.

## 1. Thành phần kiến trúc

### 1.1. Webhook Listener (API Gateway)
- **Endpoint:** `/api/webhooks/shopee` và `/api/webhooks/tiktok`.
- **Nghiệp vụ:**
  - Xác thực chữ ký (HMAC SHA256) từ Sàn.
  - Parse JSON payload và phản hồi HTTP 200 ngay lập tức (< 200ms).
  - Đẩy raw payload vào hàng đợi nội bộ (Internal Queue).

### 1.2. In-memory Message Queue (System.Threading.Channels)
- **Công nghệ:** Sử dụng `System.Threading.Channels` trong .NET để làm hàng đợi hiệu năng cao trong bộ nhớ.
- **Vai trò:** Giúp API phản hồi nhanh mà không cần chờ xử lý Database, tránh bị Sàn block do phản hồi chậm.

### 1.3. Background Processor (WebhookProcessorJob.cs)
- **Công nghệ:** Một `BackgroundService` chạy ngầm liên tục để tiêu thụ dữ liệu từ Channel.
- **Nghiệp vụ:**
  - Giải mã Token (AES-256) để lấy quyền truy cập API Sàn.
  - Map SKU từ Sàn về SKU nội bộ ERP.
  - Cập nhật tồn kho theo lô (FIFO) và tạo đơn hàng.

## 2. Luồng dữ liệu chi tiết

1. **Khách đặt hàng:** Khách mua két nước trên Shopee.
2. **Sàn bắn Webhook:** Shopee gửi POST payload sang ERP.
3. **Verify & Queue:** API kiểm tra mã bảo mật, nếu khớp sẽ đẩy vào `WebhookQueueService`.
4. **Worker xử lý:** `WebhookProcessorJob` nhận tin nhắn từ hàng đợi.
5. **Cập nhật Real-time:** Sau khi lưu DB thành công, hệ thống dùng **SignalR** để đẩy thông báo "Ting ting" và cập nhật giao diện Dashboard/Orders cho người dùng.

## 3. Bảo mật & Chống lỗi
- **Mã hóa Token:** Mọi Access Token được mã hóa AES-256 trong Database.
- **Idempotency:** Kiểm tra `OrderSn` trước khi lưu để tránh trùng lặp đơn hàng nếu Sàn bắn Webhook nhiều lần.
- **Logging:** Mọi lỗi xử lý được ghi lại qua Serilog (Rolling File) để truy vết.

---
*Dành cho kỹ thuật viên vận hành hệ thống Garage Radiator ERP.*

