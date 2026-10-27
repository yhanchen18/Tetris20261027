# 霓虹街機打磚塊 (Neon Breakout Arcade)

本專案將遵循純前端原生 **HTML5 + CSS3 + Vanilla JavaScript** 架構（無任何 React 與 TypeScript 依賴），打造一款兼具強烈霓虹街機視覺、流暢 60FPS 物理打擊反彈手感、豐富道具掉落以及多關卡挑戰的精緻打磚塊遊戲。

### User Review & Critical Decisions

> [!IMPORTANT]
> 依據用戶確認的需求與偏好設定：
> - **技術架構**：嚴格採用純 HTML、CSS、JavaScript，不使用 React 或 TypeScript。
> - **視覺風格**：經典街機霓虹暗色風格（Cyber Neon），深色漸層背景、霓虹光暈磚塊與粒子碎裂效果。
> - **遊戲機制**：豐富道具系統（多重球、板子加長/縮短、雷射射擊砲台、慢速球、磁吸底板、防墜底網）搭配 4+ 款特色關卡與磚塊硬度機制。
> - **操控方式**：同時支援滑鼠跟隨操作與鍵盤左右方向鍵（`A`/`D` 或 `←`/`→`），提供即時切換與最佳操控流暢度。

---

### 1. Overview & Core Concept

- **核心體驗**：經典街機打磚塊的現代化昇華版。玩家控制底部發光導護板（Paddle），反彈光球粉碎上方五彩斑斕的能量磚塊。打擊時伴隨粒子火花與微型震動反饋，擊破特殊磚塊會掉落各式膠囊道具。
- **目標受眾**：喜愛復古街機、休閒放鬆、追求打擊回饋與破關挑戰的廣大玩家。
- **核心特色**：
  - 零外部依賴、純原生 DOM + Canvas 2D 渲染引擎，保證極致加載速度與 60FPS 高幀率。
  - Web Audio API 原生音頻合成技術，產生經典 8-bit / 80s 復古街機反彈嗶嗶聲、爆炸聲、道具拾取音效與過關慶祝音，無需下載外部大型音檔。
  - 完整存檔與計分板系統（支援 LocalStorage 紀錄最高分數與通關歷程）。

---

### 2. User Experience & Visual Design

#### A. 遊戲流程架構
1. **開始首頁（Title Screen）**：
   - 霓虹動態發光標題「NEON BREAKOUT ARCADE」。
   - 快速操作指引卡片（滑鼠移動 / 方向鍵 / 空白鍵發球與發射雷射 / P 鍵暫停）。
   - 「開始遊戲 (START GAME)」發光按鈕與難度/關卡選擇。
2. **遊戲對戰介面（Play HUD & Canvas Arena）**：
   - 頂部 HUD：分數（Score）、最高分（High Score）、生命數（Lives 心形標記）、當前關卡（Level 1-4）、連擊倍率（Combo Multiplier）。
   - 中央畫布：800 × 600 高畫質清晰繪製區域，支援高 DPI 螢幕清晰度適配（Retina display scaling）。
   - 底部提示：當前生效道具倒數計時進度條（如加長板、雷射持續時間）。
3. **過關結算與失敗面板（Victory & Game Over Overlays）**：
   - 關卡完成：星級評分、本關分數、下一關按鈕。
   - 遊戲結束：總分統計、突破紀錄提示、一鍵「重新挑戰 (PLAY AGAIN)」無縫重啟。

#### B. 視覺主題與配色（60-30-10 霓虹街機配色）
- **60% 畫布與背景**：深邃深藍夜幕底色（`#0a0e17` ~ `#0f172a`），輔以微弱的深色網格掃描線效果。
- **30% 結構與磚塊矩陣**：
  - 一般磚塊：霓虹粉紅（`#ff2a85`）、天藍（`#00f0ff`）、翠綠（`#00ff9d`）、琥珀金（`#ffb800`）、紫羅蘭（`#a855f7`）。
  - 強化磚塊：多重耐久度金屬銀白光（帶有裂紋狀態渲染）。
  - 爆破磚塊：脈衝警示紅（`#ff3333`，擊碎時引爆周圍十字方向磚塊）。
- **10% 焦點強調與道具**：
  - 核心導護板（Cyan Glow `#00e5ff`）。
  - 能量光球（純白核心包裹青藍霓虹光芒，尾隨漸層粒子拖尾）。
  - 掉落道具膠囊：高對比色發光膠囊與動態飄落動畫。

#### C. 動態打擊感與特效
- **粒子擊碎系統**：擊破磚塊時產生 12~20 顆同色系爆炸粒子，具有速度衰減與重力漸逝效果。
- **微型鏡頭晃動（Screen Shake）**：強力爆破或失去生命時輕微晃動畫面 80~120ms，營造街機衝擊力。
- **球體軌跡光暈**：球體高速移動時繪製淡出殘影拖尾（Trail effect）。

---

### 3. Key Product Decisions & Trade-Offs

- **架構決策：純 HTML5 Canvas + 原生 Vanilla JavaScript**
  - *原因*：完全符合用戶「HTML、CSS、JavaScript，不使用 TypeScript 與 React」的要求。Canvas 2D API 在處理高頻球體碰撞、幾百個粒子與道具運動時效率極高，無 Virtual DOM 開銷與框架束縛。
- **音效系統：Web Audio API 程序化合成音效**
  - *原因*：無需依賴不可靠的外部音頻連結或龐大 mp3 資源，完全自給自足，利用振盪器（OscillatorNode）合成乾淨清脆的打擊音、道具拾取音與勝利低音。
- **關卡設計：多樣化關卡佈局矩陣**
  - *關卡 1 - 霓虹初階 (Neon Matrix)*：標準排列，熟悉打擊與反彈角度。
  - *關卡 2 - 堡壘突圍 (The Fortress)*：雙重耐久度加固磚塊 + 中央爆破磚。
  - *關卡 3 - 空間迷宮 (Space Labyrinth)*：穿透式磚塊通道與高價值金磚。
  - *關卡 4 - 終極核心 (Quantum Core)*：堅硬移動磚或密集混色陣列。
- **道具掉落機制（Power-Ups）**：
  - 🟢 **多重分裂球 (Multi-Ball)**：一分為三，火力倍增。
  - 🔵 **加長導護板 (Expand Paddle)**：增加接球容錯率。
  - 🔴 **雷射砲台 (Laser Cannons)**：導護板左右長出砲台，按空白鍵可直接射擊打磚塊！
  - 🟡 **安全防墜底網 (Safety Barrier)**：底部生成能量防墜網，可保護一次掉球。
  - 🟣 **慢速光球 (Slow Ball)**：降低球速，提供喘息與精密瞄準時間。
  - 🟠 **穿透火球 (Fireball)**：球體變為火球，直接貫穿磚塊不反彈。

---

### 4. Technical Architecture & Data Strategy

#### A. 系統模組架構圖

```
┌─────────────────────────────────────────────────────────┐
│                     index.html                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  HUD Header (Score, HighScore, Level, Lives, UI)  │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Game Canvas (800x600 Retina)                     │  │
│  │   - Ball Physics & Trailing Particle Engine       │  │
│  │   - Paddle & Angle-based Reflection Calculation   │  │
│  │   - Brick Grid & Durability/Explosion System      │  │
│  │   - Falling Power-up Capsules                     │  │
│  │   - Floating Score & Floating Particles           │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Modal Overlays: Title / Pause / Victory / Over   │  │
│  └───────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
┌───────────────────────────────┐   ┌───────────────────────────────┐
│        game.js (Core)         │   │       audio.js (Synthesizer)  │
│ - GameLoop (requestAnimFrame) │   │ - Web Audio API Synthesizer   │
│ - State Machine & Levels      │   │ - Custom frequency bleeps,    │
│ - Collision Detection (AABB)  │   │   powerup jingles, explosions │
│ - Input Handlers (Mouse/Keys) │   │ - Mute / Volume controller    │
└───────────────────────────────┘   └───────────────────────────────┘
```

#### B. 核心狀態機定義
```javascript
const GameState = {
  START: 'START',       // 標題畫面
  SERVING: 'SERVING',   // 球吸附在板上，等待發球
  PLAYING: 'PLAYING',   // 激戰中
  PAUSED: 'PAUSED',     // 暫停中
  LEVEL_WON: 'LEVEL_WON', // 關卡勝利過場
  GAME_OVER: 'GAME_OVER'  // 遊戲結束
};
```

#### C. 反彈物理細節
- 當球擊中導護板時，反射角度非純幾何鏡面，而是依據球擊中板子中心點的偏移距離（normalized hit offset $-1.0 \sim +1.0$）動態計算出反彈角度（$-60^\circ \sim +60^\circ$），給予玩家精湛的「切球」與方向操縱感。
- 磚塊四邊 AABB 精確碰撞偵測，判定是垂直反轉還是水平反轉，杜絕球體陷入磚塊或穿牆 bug。

---

### 5. Implementation Roadmap

1. **基礎頁面結構與樣式 (`index.html`, `style.css`)**：
   - 移除原有的 React/TypeScript 引用。
   - 構建俐落大氣的街機邊框容器、頂部 HUD、畫布元素以及發光覆蓋選單。
2. **音頻合成模組 (`audio.js`)**：
   - 使用 Web Audio API 建立零外部依賴的合成音效庫（擊磚音階升調、爆炸、道具、過關、失敗音效）。
3. **遊戲核心邏輯模組 (`game.js`)**：
   - 繪製系統（導護板、多球體、光暈磚塊、粒子、掉落道具）。
   - 操控事件綁定（滑鼠跟隨、鍵盤 A/D/方向鍵平滑移動、空白鍵發球/射擊、P 鍵暫停）。
   - 碰撞與物理演算、特殊道具持續時間與效果計時器。
   - 4 個獨特關卡的地圖矩陣與切關推進。
   - 本地最高紀錄（LocalStorage）整合。
4. **驗證與調校**：
   - 確保無 TypeScript 編譯、無 React 代碼，完全符合現代純 JS/CSS/HTML 標準。
   - 透過 `compile_applet` 驗證專案可正常運行與打包。
