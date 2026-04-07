# Garage Radiator ERP - Nền tảng Quản trị Xưởng Két Nước Đa Kênh

![License](https://img.shields.io/badge/License-Proprietary-blue)
![Version](https://img.shields.io/badge/Version-1.0.0--Stable-brightgreen)
![Framework](https://img.shields.io/badge/.NET-9.0-purple)
![Frontend](https://img.shields.io/badge/Next.js-15-black)

Chào mừng bạn đến với **Garage Radiator ERP** - Hệ thống Hoạch định Nguồn lực Doanh nghiệp (ERP) thiết kế chuyên biệt cho các Gara và Xưởng sản xuất két nước ô tô. Nền tảng được xây dựng với kiến trúc hướng dịch vụ, quy trình quản lý kho theo lô (FIFO) chặt chẽ, và tích hợp đa kênh (Omnichannel) mượt mà.

---

## 🌟 Tính năng Cốt lõi

### 1. Quản trị Kho hàng Thông minh (Inventory & FIFO)
- **Quy trình Nhập hàng (PO):** Luồng nhập hàng thực tế (Pending -> Completed) ngăn chặn tuyệt đối tình trạng sai lệch dữ liệu tài chính.
- **Tính toán Giá vốn:** Hệ thống sử dụng giá nhập lô thực tế kết hợp `StandardCost` dự phòng, chặn đứng các giao dịch làm âm giá trị kho hoặc sai lệch tỷ suất lợi nhuận.
- **Cơ chế Khóa Đồng thời (Concurrency Locking):** Bảo vệ dữ liệu tồn kho khi phát sinh hàng trăm đơn hàng cùng lúc từ đa nền tảng.

### 2. Tích hợp Sàn Thương mại Điện tử (Omnichannel)
- Đồng bộ đơn hàng, tồn kho và tin nhắn Real-time qua Webhook Hub (Shopee, TikTok).
- Cơ chế tự động làm mới Access Token (OAuth2) giữ kết nối liên tục 24/7.

### 3. Trải nghiệm Người dùng Đỉnh cao (Elevated UI)
- Giao diện được phát triển theo tiêu chuẩn Apple Human Interface Guidelines (iOS HIG).
- Cấu trúc Card-based, bo góc và hiệu ứng đổ bóng mượt mà, tối ưu trải nghiệm cho nhân viên vận hành trên Next.js 15.
- Dữ liệu hoàn toàn động, loại bỏ hoàn toàn các Mock Data giả lập trên production.

### 4. Bảo mật & Kiến trúc Enterprise
- **Clean Architecture:** Phân tách rõ ràng giữa các Layer (Interface, Service) và tuân thủ chặt chẽ SRP. DTO mapping tự động qua thư viện `AutoMapper`.
- **An toàn Tuyệt đối:** Các thông tin nhạy cảm (Connection Strings, App Secrets) được quản lý qua Environment Variables, hoàn toàn tách biệt khỏi mã nguồn.
- **Bảo mật Hạ tầng:** Mã hóa AES-256 cho Token, cấu hình Rate Limiting chống DDoS, Security Headers chặn XSS, Clickjacking.
- **Truy vết Hệ thống:** Log tập trung qua Serilog.

---

## 🏗 Stack Công nghệ

- **Backend:** C# ASP.NET Core 9, Entity Framework Core (SQL Server), SignalR, AutoMapper, Serilog.
- **Frontend:** Next.js 15 (App Router), TypeScript (Strict Typing), Tailwind CSS v4, Radix UI.

---

## 🛠 Hướng dẫn Triển khai (Go-live)

Hệ thống đã sẵn sàng cho môi trường Production. Vui lòng tuân thủ các bước dưới đây:

### 1. Cấu hình Môi trường
Các biến cấu hình bắt buộc phải được truyền qua Environment Variables hoặc Trình quản lý Secrets (Azure Key Vault / AWS Secrets Manager), KHÔNG sửa trực tiếp `appsettings.json`:
- `ConnectionStrings__DefaultConnection`: Chuỗi kết nối Database SQL Server.
- `Shopee__AppSecret` & `TikTok__AppSecret`: Token ứng dụng TMĐT.
- `JWT_SECRET_KEY`: Khóa mã hóa JWT (Tối thiểu 32 ký tự).

### 2. Triển khai Database
- Chạy lệnh `dotnet ef database update` để đồng bộ toàn bộ schema và migrations (bao gồm các cập nhật về `StandardCost`).

### 3. Khởi chạy
- **Backend:** Chạy trên IIS, Kestrel hoặc build thành Docker Container.
- **Frontend:** Build bằng lệnh `npm run build` và deploy lên Vercel hoặc Node.js Server.

---

## 📖 Hồ sơ & Thẩm định

Dự án đã vượt qua bài kiểm tra Audit khắt khe nhất từ Ban Giám đốc, đảm bảo không có Mock Data, không rò rỉ bảo mật, và logic kế toán hoàn chỉnh.

- [✅ Báo cáo Thẩm định Nghiệm thu (Audit Report)](audit_report.md)

---
*Phát triển và Thiết kế hệ thống bởi **AnhhNguyenn**.*
