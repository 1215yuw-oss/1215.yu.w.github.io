# MotorSync 智能保養紀錄系統 (Vanilla Serverless Edition)

MotorSync 是一款專為機車族群打造的「無伺服器架構 (Serverless)」雲端保養紀錄應用程式。有別於傳統龐大難以維護的前端框架，本系統極致追求輕量化與運行速度，採用純 `index.html` 單檔架構，並深度整合 Google Firebase 雲端生態系。

## 🌟 核心架構特點 (Architecture)

1. **極限單檔架構 (Single-File App)**
   - 捨棄 React, Vue, Vite, Tailwind 等現代前端編譯框架。
   - 所有版面結構 (HTML)、響應式樣式 (CSS) 與商業邏輯引擎 (Vanilla JS) 皆濃縮於唯一的 `index.html` 中。
   - 優勢：**零建置時間**，更新程式碼丟上 GitHub 即可秒速生效，且大幅降低主機儲存負擔。

2. **跨裝置雲端同步 (Cross-Device Cloud Sync)**
   - 藉由 HTML 原生 ES Module CDN (`<script type="module">`) 引入 **Firebase V10 SDK**。
   - **Authentication**: 搭載 Google OAuth 單一登入 (SSO) 系統。一鍵以 Google 帳號授權登入後才可解鎖系統。
   - **Firestore Database**: 採用強大的 NoSQL 資料庫。使用者登入後，系統會透過安全機制將您的保養軌跡指派寫入 `users/{您的唯一 UID}/records` 隔離資料夾中。無論您用電腦還是手機，都能保證 100% 的即時雙向資料同步。

3. **行動響應式深度設計 (Mobile First & PWA)**
   - **Card Layout 轉換**: 在寬度不足的行動裝置 (手機) 上，歷史表格會自動解除原本的橫豎網格限制，原地碎裂並重組為直立式卡片堆疊介面 (Stack Cards)，以適應單手大拇指的極限滑動範圍，並從根本上解決了選單被邊界切斷的遮擋問題。
   - **PWA 沈浸式標籤**: 掛載 `<meta name="theme-color">`，使行動裝置上方狀態列自動融入金黃專屬配色，提供宛如原生 App 的沉浸式體驗。

## 🕹️ 功能模組 (Features)

1. **智慧儀表板推算引擎 (Dashboard Logic)**
   - 系統採用動態降階回溯演算法：只要載入所有雲端紀錄，系統會瞬間掃描並抓出您的「歷史最大里程總數」。
   - 接著會交叉比對機油、齒輪油、空濾等特定核心保養項目，運用預設週期規則 (Rules) ，精準算出並在畫面上方大字版面提醒您「各項部品下次該進車行的確切里程數」。

2. **草稿行內編輯器 (Inline Draft Engine)**
   - 為了追求最快輸入速度，捨棄了繁瑣的彈出式視窗 (Modal)。
   - 點擊新增紀錄時，會在列表頂端掛載一條淡黃色的「編輯草稿行」。
   - 撰寫完包含日期、花費、多選項目的數值後，點擊「✔️ 儲存上傳 (Save)」，資料會秒飛雲端並將該行瞬間固化為唯讀紀錄。

3. **React 級自定義多選下拉 (Custom Dropdown)**
   - 徹底拋棄傳統 `select` 標籤的醜陋外觀。在原生 DOM 環境下手刻多選下拉核心 (Multi-select component)，滿足一口氣更換機油、齒輪油等複合情境。

## 🚀 部署與執行邏輯 (Deployment)

目前由 **GitHub Pages Workflow** 全自動接管發布。

- **觸發條件**：透過 Terminal 執行 `git push origin main`。
- **發布動作**：Workflow 會略過所有 `npm build` 步驟，直接將根目錄中的 `index.html` 作為最終靜態資產，上傳並映射至預設網域。讀取後，前端腳本在各個裝置瀏覽器中直接啟動並連上 Google 雲端主機即完成運行。
