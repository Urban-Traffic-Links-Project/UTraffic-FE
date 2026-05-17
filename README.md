# 🚦 UTraffic Frontend

Hệ thống giao diện người dùng cho nền tảng UTraffic. Dự án được xây dựng bằng React và Vite.

## 🛠️ Hướng dẫn cài đặt và chạy ứng dụng

### 1. Yêu cầu hệ thống
- Node.js (khuyến nghị phiên bản 18.x trở lên)
- npm (thường đi kèm với Node.js)

### 2. Cài đặt thư viện
Di chuyển vào thư mục `FE` và chạy lệnh sau để cài đặt các gói phụ thuộc:
```bash
npm install
```

### 3. Cấu hình biến môi trường
Tạo một file `.env` ở thư mục `FE` với nội dung cấu hình trỏ tới backend:
```env
VITE_API_URL=http://localhost:8000/api/v1
```
*(Tham khảo mã nguồn FE để xem key env chính xác, thông thường là `VITE_API_URL` hoặc `VITE_API_BASE_URL`)*

### 4. Chạy ứng dụng ở chế độ phát triển
Khởi động ứng dụng React:
```bash
npm run dev
```
Sau đó, truy cập ứng dụng trên trình duyệt qua địa chỉ `http://localhost:5173`.

