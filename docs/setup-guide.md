# Postiz – Step by Step Setup Guide (Local Dev)

This guide explains how to run Postiz locally (self‑hosted dev mode) and which environment variables / API keys you need.

> **Note:** This is a **developer** setup for local testing, not a production deployment.

---

## 1. Requirements

- **OS**: macOS / Linux (Windows WSL2 recommended)
- **Node.js**: `>=22.12.0 <23` (see `package.json`)
- **pnpm**: `>=10`  
  ```bash
  corepack enable
  corepack prepare pnpm@latest --activate
  ```
- **Docker & Docker Compose**: for PostgreSQL + Redis
- **Git**

---

## 2. Clone & install dependencies

```bash
# clone
git clone https://github.com/gitroomhq/postiz-app.git
cd postiz-app

# install
pnpm install

# generate Prisma client (also runs in postinstall)
pnpm run prisma-generate
```

---

## 3. Start Postgres + Redis (Docker)

Postiz ships a dev‑only `docker-compose.dev.yaml`:

```bash
# from repo root
pnpm run dev:docker
```

This will start:

- **Postgres** on `localhost:5432`
  - DB: `postiz-db-local`
  - User: `postiz-local`
  - Password: `postiz-local-pwd`
- **Redis** on `localhost:6379`

You can also inspect DB/Redis via:

- pgAdmin: `http://localhost:8081`
- RedisInsight: `http://localhost:5540`

---

## 4. Create `.env` file (root)

There is currently no `.env.example` in the repo, nên bạn cần tự tạo.

Tại repo root, tạo file `.env`:

```bash
cp .env .env.backup  # (optional, if file đã tồn tại)
# nếu chưa có file, tạo mới:
# touch .env
```

Dưới đây là **cấu hình tối thiểu** để mọi thứ chạy local.

### 4.1. Core URLs & DB

```env
# Backend DB (PostgreSQL)
DATABASE_URL=postgresql://postiz-local:postiz-local-pwd@localhost:5432/postiz-db-local?schema=public

# Redis (queues, rate limiting)
REDIS_URL=redis://localhost:6379

# Frontend URL (Next.js dev)
FRONTEND_URL=http://localhost:4200

# Public backend URL used by frontend (API)
NEXT_PUBLIC_BACKEND_URL=http://localhost:4001

# Internal backend URL (workers, services)
BACKEND_INTERNAL_URL=http://localhost:4001

# Main URL (marketing/base URL) – dev có thể trùng với FRONTEND_URL
MAIN_URL=http://localhost:4200

# JWT secret for auth (tự sinh chuỗi dài, random)
JWT_SECRET=change_this_to_a_long_random_string

# Storage provider – dev dùng local
STORAGE_PROVIDER=local
```

### 4.2. Email (Resend) – optional nhưng nên có

Để gửi email (reset password, invite, v.v.), Postiz dùng **Resend**.

1. Đăng ký tại: https://resend.com/
2. Tạo API Key ("Production" hoặc "Development")
3. Thêm vào `.env`:

```env
RESEND_API_KEY=your_resend_api_key_here
```

Nếu không set, một số flow email có thể fail hoặc bị disable.

### 4.3. OpenAI – cho AI features (Copilot, generator)

Để dùng AI content / copilot:

1. Tạo account tại: https://platform.openai.com/
2. Tạo **API key** trong dashboard
3. Thêm vào `.env`:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

Nếu không set, các endpoint `/copilot/*` sẽ log warning và không trả kết quả.

### 4.4. Stripe – nếu muốn test thanh toán / marketplace

Nếu bạn **không dùng thanh toán / marketplace**, có thể bỏ qua Stripe (một số route sẽ không hoạt động nhưng app chính vẫn chạy).

Để bật Stripe:

1. Tạo account tại: https://dashboard.stripe.com/
2. Trong **Developers → API keys**, lấy:
   - `Publishable key`
   - `Secret key`
3. Thêm vào `.env`:

```env
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
```

Stripe còn dùng cho payouts marketplace; để chạy full flow cần cấu hình thêm webhook & account, nhưng cho dev cơ bản chỉ cần 2 key trên.

### 4.5. OAuth Postiz SSO (tùy chọn cao cấp)

Postiz hỗ trợ custom OAuth provider qua các biến:

```env
POSTIZ_OAUTH_URL=
POSTIZ_OAUTH_AUTH_URL=
POSTIZ_OAUTH_TOKEN_URL=
POSTIZ_OAUTH_USERINFO_URL=
POSTIZ_OAUTH_CLIENT_ID=
POSTIZ_OAUTH_CLIENT_SECRET=
```

Nếu bạn **không dùng OAuth custom**, **không nên set** các biến này. `OauthProvider` sẽ throw error nếu thiếu biến, nên chỉ bật khi bạn thực sự cấu hình đầy đủ.

### 4.6. Social integrations (X, Facebook, LinkedIn, v.v.)

Các social network dùng **official OAuth**. Mỗi nền tảng sẽ có cặp **client id / secret** và URL callback riêng, thường ở dạng:

- `X_TWITTER_CLIENT_ID`, `X_TWITTER_CLIENT_SECRET`, …
- `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, …
- `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, …

Các biến cụ thể thay đổi theo phiên bản; để dùng production bạn nên theo docs chính thức: https://docs.postiz.com/

Cho local dev cơ bản, bạn có thể **chưa cần cấu hình social OAuth**, vẫn tạo post dummy trong UI.

---

## 5. (Tuỳ chọn) Kiểm tra cấu hình `.env`

Postiz có `ConfigurationChecker` để validate env:

- Kiểm tra: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `MAIN_URL`, `FRONTEND_URL`, `NEXT_PUBLIC_BACKEND_URL`, `BACKEND_INTERNAL_URL`, `STORAGE_PROVIDER`, v.v.

Để chạy check (ví dụ bằng commands app), bạn có thể tạo script riêng hoặc chạy command NestJS tương ứng. Khi chạy, nếu có vấn đề, bạn sẽ thấy log dạng:

```text
Configuration issue: REDIS_URL not set
Configuration issue: FRONTEND_URL is not a valid URL
...
```

---

## 6. Apply Prisma schema (DB)

Đảm bảo Postgres đang chạy (bước 3), sau đó từ repo root:

```bash
pnpm run prisma-db-push
```

Lệnh này sẽ:

- Push schema Prisma vào DB (tạo bảng, index, relations…)

---

## 7. Start backend + frontend + workers

Từ repo root:

```bash
pnpm dev
```

Script này sẽ chạy song song:

- **Backend (NestJS)** – cổng mặc định: `4001`
- **Frontend (Next.js)** – cổng: `4200`
- Workers, cron, extension dev, v.v.

Khi terminal không còn lỗi nặng, mở trình duyệt:

```text
http://localhost:4200
```

Tại đây bạn có thể:

- Đăng ký tài khoản mới (nếu `DISABLE_REGISTRATION` không bật)
- Đăng nhập, tạo post, cấu hình lịch, media, analytics, v.v.

---

## 8. Tóm tắt các biến môi trường quan trọng

### Bắt buộc cho local dev ổn định

- `DATABASE_URL` – kết nối PostgreSQL
- `REDIS_URL` – kết nối Redis
- `JWT_SECRET` – ký JWT
- `MAIN_URL` – base URL chính
- `FRONTEND_URL` – URL frontend (dev: `http://localhost:4200`)
- `NEXT_PUBLIC_BACKEND_URL` – URL backend public cho FE (dev: `http://localhost:4001`)
- `BACKEND_INTERNAL_URL` – URL backend nội bộ (workers)
- `STORAGE_PROVIDER` – thường `local`

### Khuyến nghị bật thêm

- `RESEND_API_KEY` – gửi email
- `OPENAI_API_KEY` – AI content / copilot
- `STRIPE_PUBLISHABLE_KEY` + `STRIPE_SECRET_KEY` – thanh toán / marketplace

### Tuỳ chọn nâng cao

- `POSTIZ_OAUTH_*` – custom SSO cho Postiz
- OAuth keys từng social (X, Facebook, LinkedIn, TikTok, v.v.) – chỉ cần nếu bạn muốn kết nối kênh thật.

---

## 9. Nếu gặp lỗi

1. Kiểm tra log của:
   - Terminal đang chạy `pnpm dev`
   - Containers Docker (Postgres/Redis)
2. Rà lại `.env` với checklist ở mục 8.
3. Nếu lỗi liên quan OpenAI/Resend/Stripe, tạm thời xoá/disable key đó để đảm bảo core app vẫn chạy.

File này chỉ tập trung vào **setup local dev**. Với production, hãy làm theo hướng dẫn chính thức:  
https://docs.postiz.com/installation/docker-compose
