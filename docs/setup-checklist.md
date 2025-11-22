# Postiz – 1‑Page Setup Checklist (Non‑dev)

> Mục tiêu: chạy được Postiz local để test tính năng chính (đăng ký, đăng nhập, calendar, posts).

---

## A. Chuẩn bị máy

- [ ] **Cài Node + pnpm**  
      - Node 22.x (LTS mới nhất, >= 22.12)  
      - Bật pnpm: `corepack enable && corepack prepare pnpm@latest --activate`
- [ ] **Cài Docker Desktop** (để chạy Postgres + Redis)
- [ ] **Cài Git** (nếu chưa có)

---

## B. Tải source & cài package

- [ ] Mở Terminal, chạy:

  ```bash
  git clone https://github.com/gitroomhq/postiz-app.git
  cd postiz-app
  pnpm install
  ```

---

## C. Chạy Postgres + Redis bằng Docker

- [ ] Trong thư mục `postiz-app`, chạy:

  ```bash
  pnpm run dev:docker
  ```

- [ ] Kiểm tra nhanh:
  - Postgres: chạy trên `localhost:5432`
  - Redis: chạy trên `localhost:6379`

---

## D. Tạo file `.env` tối thiểu

- [ ] Ở thư mục `postiz-app`, tạo file `.env` (nếu chưa có):

  ```bash
  touch .env
  ```

- [ ] Dán **mẫu đơn giản** sau vào `.env`:

  ```env
  DATABASE_URL=postgresql://postiz-local:postiz-local-pwd@localhost:5432/postiz-db-local?schema=public
  REDIS_URL=redis://localhost:6379

  MAIN_URL=http://localhost:4200
  FRONTEND_URL=http://localhost:4200
  NEXT_PUBLIC_BACKEND_URL=http://localhost:4001
  BACKEND_INTERNAL_URL=http://localhost:4001

  STORAGE_PROVIDER=local
  JWT_SECRET=change_this_to_a_long_random_string
  ```

- [ ] (Khuyến nghị) Nếu có API key, thêm vào `.env`:
  - Email: `RESEND_API_KEY=...`
  - AI: `OPENAI_API_KEY=...`
  - Thanh toán: `STRIPE_PUBLISHABLE_KEY=...` + `STRIPE_SECRET_KEY=...`

> Với non‑dev: nếu chưa có key, có thể **bỏ trống**, core app vẫn chạy (một số chức năng nâng cao sẽ tắt).

---

## E. Khởi tạo database

- [ ] Đảm bảo Docker đang chạy (Postgres OK).  
- [ ] Trong `postiz-app`, chạy:

  ```bash
  pnpm run prisma-db-push
  ```

Nếu lệnh này hoàn thành không lỗi → DB đã sẵn sàng.

---

## F. Chạy ứng dụng

- [ ] Trong `postiz-app`, chạy:

  ```bash
  pnpm dev
  ```

- [ ] Chờ tới khi terminal không báo lỗi nặng.
- [ ] Mở trình duyệt và truy cập:

  ```text
  http://localhost:4200
  ```

---

## G. Test nhanh tính năng chính

- [ ] **Đăng ký tài khoản** mới
- [ ] **Đăng nhập** bằng tài khoản vừa tạo
- [ ] Vào **Calendar / Launches** để:
  - [ ] Tạo 1 post mới (không cần kết nối mạng xã hội thật)
- [ ] Vào **Media** để:
  - [ ] Upload thử 1 hình ảnh
- [ ] Vào **Analytics** (có thể chưa có dữ liệu nếu chưa post gì)

Nếu các bước trên đều chạy được → môi trường local đã OK cho việc demo & test.

---

## H. Khi gặp lỗi

- [ ] Kiểm tra lại `.env` đúng như mẫu ở mục D  
- [ ] Đảm bảo Docker containers `postiz-postgres` và `postiz-redis` đang chạy  
- [ ] Xem log trong terminal đang chạy `pnpm dev` để biết biến môi trường nào thiếu

Nếu vẫn không xử lý được, có thể gửi `.env` (ẩn key nhạy cảm) + log cho dev để họ hỗ trợ tiếp.
