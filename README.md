# 保養品存貨清單

全家共用的保養品庫存清單 PWA。拍照辨識效期（僅在手機本機用 OCR 辨識，照片辨識完就丟棄、不會上傳或儲存），按分類管理，標示效期提醒，清單可分享給家人共同編輯，也可以建立自己的私人清單。

## 技術

- React + Vite + TypeScript
- Tailwind CSS
- Supabase（Postgres + Row Level Security + Auth Google 登入 + Realtime 即時同步）
- Tesseract.js（瀏覽器端 OCR，辨識效期日期）
- vite-plugin-pwa（可安裝到手機主畫面）

## 第一次設定

### 1. 建立 Supabase 專案

1. 前往 [supabase.com](https://supabase.com/) 建立新專案（免費方案即可），地區選離台灣近的（如 Singapore）。
2. 專案建好後，到 **Project Settings → API**，複製 `Project URL` 和 `anon public` key。

### 2. 建立資料表與權限規則

到 Supabase Dashboard 左側 **SQL Editor**，貼上整份 [supabase/schema.sql](supabase/schema.sql) 並執行。這會建立：

- `lists`、`list_members`、`items` 三張表
- Row Level Security 規則：只有清單成員能讀寫該清單與其品項
- 刪除清單會自動連帶刪除底下所有品項（`ON DELETE CASCADE`）
- Realtime 訂閱設定，讓家人之間的新增/打勾/刪除即時同步

### 3. 設定 Google 登入

Supabase 的 Google 登入需要你自己在 Google Cloud 申請一組 OAuth Client（比 Firebase 多一步，但只需做一次）：

1. 到 [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 建立 OAuth 2.0 用戶端 ID（應用程式類型選「網頁應用程式」）。
2. 「已授權的重新導向 URI」填入：`https://<你的專案 ref>.supabase.co/auth/v1/callback`（在 Supabase Dashboard 的 Authentication → URL Configuration 可以看到專案 ref）。
3. 複製 Google 給的 Client ID 和 Client Secret。
4. 回 Supabase Dashboard → **Authentication → Providers → Google**，貼上 Client ID / Secret 並啟用。
5. 到 **Authentication → URL Configuration**，把 `Site URL` 設成你本機開發網址（如 `http://localhost:5173`）；之後部署上線後要記得改成正式網址，並把兩者都加進 `Redirect URLs`。

### 4. 設定環境變數

複製 `.env.example` 為 `.env`，貼上步驟 1 取得的設定值：

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxx
```

### 5. 安裝套件並啟動

```bash
npm install
npm run dev
```

手機要測試相機功能需要 `https`（或用電腦瀏覽器的裝置模擬測試邏輯），正式使用建議部署上線後用手機瀏覽器開啟。

### 6. 部署上線（讓家人用手機安裝）

Supabase 只負責資料庫和登入，網站本身要另外部署到靜態網站託管服務，最簡單是用 [Vercel](https://vercel.com/)：

```bash
npm install -g vercel
vercel
```

部署時把 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY` 設定成 Vercel 專案的環境變數，並記得回 Supabase **Authentication → URL Configuration** 把正式網址加入 `Site URL` / `Redirect URLs`，Google 登入才會導回正確網址。

部署後把網址傳給家人，請他們用該網址登入 Google 帳號、在手機瀏覽器選「加入主畫面」即可像 App 一樣使用。

## 使用方式

1. 用 Google 帳號登入。
2. 建立一個清單（例如「新竹家裡保養品」），在清單管理裡用 Gmail 信箱邀請其他 3 位家人加入，他們登入後就能看到並共同編輯。
3. 每個人也可以額外建立自己的私人清單（不邀請任何人即可）。
4. 點右下角「+」新增品項：可先拍照讓系統自動辨識包裝上的效期日期並帶入表單（照片辨識後立即丟棄，不會上傳），再確認/手動修改品名、分類、效期、數量。
5. 清單依效期由近到遠排序，快過期／已過期的品項會用顏色標示。用完後點左邊圓圈打勾（或之後可再刪除）。任何一個家人新增/打勾/刪除都會即時同步給其他人。

## 已知限制（MVP）

- OCR 辨識準確度取決於包裝上日期印刷是否清晰，建議拍照後務必確認辨識出的日期是否正確。
