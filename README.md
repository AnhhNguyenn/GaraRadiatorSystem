# Garage Radiator ERP - Dự án quản lý xưởng két nước ô tô

Hệ thống ERP hoàn chỉnh cho Garage/Xưởng sản xuất két nước, hỗ trợ bán hàng đa kênh, quản lý kho FIFO và Chat tập trung.

## 🏗 Kiến trúc hệ thống
- **Frontend:** Next.js 15 (App Router), Tailwind CSS v4, SignalR Client.
- **Backend:** ASP.NET Core 9, Entity Framework Core, SQL Server, SignalR Hub.
- **Tính năng nổi bật:** POS Hotkeys, In nhiệt K80/A6, Webhook Shopee/TikTok (với HMAC Validation), Auto-renewal Token Job.

## 🛠 Hướng dẫn cài đặt

### 1. Backend (.NET)
```bash
cd backend/GarageRadiatorERP.Api
dotnet restore
dotnet run
```
*Lưu ý: Cấu hình `AppSecret` trong `appsettings.json` cho Shopee/TikTok.*

### 2. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
*Truy cập tại: `http://localhost:3000`*

## 📖 Tài liệu hướng dẫn
- [Tổng quan kiến trúc](file:///c:/Users/anhnt/.gemini/antigravity/brain/66a4eafe-f943-48f7-bdc0-1ebcce1e76ff/architecture_overview.md)
- [Báo cáo hoàn thiện (Walkthrough)](file:///c:/Users/anhnt/.gemini/antigravity/brain/66a4eafe-f943-48f7-bdc0-1ebcce1e76ff/walkthrough.md)
- [Kế hoạch triển khai gốc](file:///c:/Users/anhnt/.gemini/antigravity/brain/66a4eafe-f943-48f7-bdc0-1ebcce1e76ff/implementation_plan.md)
