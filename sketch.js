////學習7程式碼所在
let circles = [];
let particles = []; // 新增：存放爆破粒子
let popSound; // 爆破音效
let bgMusic; // 背景音樂
let score = 0; // 計分
let isPaused = false; // 暫停狀態
let pauseButton;
const NUM_CIRCLES = 25;
const PALETTE = ['#fcfcfc', '#0ffc44ff', '#fffae3', '#99e1d9', '#5d576b'];
const TEXT_COLOR = '#F3FFB6';
const TEXT_SIZE = 24;

// 從 PALETTE 選顏色，但額外把綠色 '#0ffc44ff' 的機率提高 10%
function choosePaletteColor() {
  const boost = 0.10; // 提高 10%
  // 設定每個顏色的基礎權重為 1，綠色加上 boost
  const weights = PALETTE.map(c => (c.toLowerCase() === '#0ffc44ff' ? 1 + boost : 1));
  const total = weights.reduce((s, w) => s + w, 0);
  let r = random() * total;
  for (let i = 0; i < PALETTE.length; i++) {
    r -= weights[i];
    if (r <= 0) return PALETTE[i];
  }
  return PALETTE[PALETTE.length - 1];
}

function preload() {
  // 預載音效檔案
  soundFormats('mp3', 'wav');
  popSound = loadSound('pop.mp3');
  // 預載背景音樂（放在專案資料夾，檔名 bg.mp3）
  bgMusic = loadSound('bg.mp3');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
  // 建立圓物件
  for (let i = 0; i < NUM_CIRCLES; i++) {
    const d = random(50, 200);
    const r = d / 2;
    // 嘗試找到不與既有圓重疊的位置
    let x, y;
    const maxAttempts = 200;
    let placed = false;
    for (let a = 0; a < maxAttempts; a++) {
      x = random(r, width - r);
      y = random(r, height - r);
      let ok = true;
      for (let c of circles) {
        const minDist = r + c.r + 4; // 加上少量間隙
        if (dist(x, y, c.x, c.y) < minDist) {
          ok = false;
          break;
        }
      }
      if (ok) {
        placed = true;
        break;
      }
    }
    if (!placed) {
      // 如果嘗試多次依然無法放置，接受一個隨機位置（回退）
      x = random(r, width - r);
      y = random(r, height - r);
    }
  const baseColor = choosePaletteColor();
    const alpha = random(80, 255); // 不同透明度
    const speed = random(0.5, 3); // 不同速度
    // 初始方向：由下往上飄 -> vy 為負
    const vy = -abs(speed);
    circles.push(new FloatCircle(x, y, d, baseColor, alpha, vy));
  }

  // 建立暫停按鈕（固定在右下角）
  pauseButton = createButton('resume');
  // 使用 CSS 單位 cm 設定大小：寬 2cm、高 3cm，背景與文字色
  pauseButton.style('position', 'fixed');
  pauseButton.style('right', '12px');
  pauseButton.style('bottom', '12px');
  pauseButton.style('width', '4cm');
  pauseButton.style('height', '2cm');
  pauseButton.style('background', '#49A078');
  pauseButton.style('color', '#1F2421');
  pauseButton.style('border', 'none');
  pauseButton.style('border-radius', '6px');
  pauseButton.style('font-size', '16px');
  pauseButton.style('cursor', 'pointer');
  pauseButton.style('z-index', '1000');
  pauseButton.attribute('aria-label', 'Pause game');
  // 防止按鈕點擊冒泡到 canvas 的 mousePressed
  pauseButton.elt.onclick = (e) => { e.stopPropagation(); togglePause(); };
  // 嘗試自動播放背景音樂（若瀏覽器允許）
  if (bgMusic) {
    try {
      bgMusic.setLoop(true);
      bgMusic.setVolume(0.45);
      bgMusic.play();
    } catch (e) {
      // 若自動播放被阻擋，會在第一次使用者互動時啟動（mousePressed）
    }
  }
}

function draw() {
  background('#3a0ca3');

  // 畫面顯示：若未暫停則更新位置，否則僅顯示
  for (let c of circles) {
    if (!isPaused) c.update();
    c.display();
  }

  // 更新並顯示粒子，反向遍歷以利移除
  for (let i = particles.length - 1; i >= 0; i--) {
    if (!isPaused) particles[i].update();
    particles[i].display();
    if (particles[i].dead) particles.splice(i, 1);
  }

  // 顯示學號和分數
  textSize(TEXT_SIZE);
  fill(TEXT_COLOR);
  noStroke();
  
  // 左上角顯示學號
  textAlign(LEFT, TOP);
  text('414730662', 10, 10);
  
  // 右上角顯示分數
  textAlign(RIGHT, TOP);
  text('Score: ' + score, width - 10, 10);

  // 暫停時顯示遮罩與當前分數
  if (isPaused) {
    push();
    // 半透明黑色遮罩
    fill(0, 150);
    rect(0, 0, width, height);

    // 置中顯示暫停與分數
    textAlign(CENTER, CENTER);
    textSize(48);
    fill(TEXT_COLOR);
    noStroke();
    text('目前得分: ' + score, width / 2, height / 2);
    pop();
  }
}

class FloatCircle {
  constructor(x, y, d, hexColor, alpha, vy) {
    this.x = x;
    this.y = y;
    this.d = d;
    this.r = d / 2;
  this.vy = vy;
    this.speed = abs(vy); // 儲存速度大小，方便重置時使用
    // 保存傳入的 hex 字串（用於顏色比對）
    this.hex = (hexColor || '').toLowerCase();
    // 使用 p5 的 color 物件並設定 alpha
    this.col = color(hexColor);
    this.col.setAlpha(alpha);
  }

  // 將氣球重置到畫布底部，且 x 位置隨機
  resetPosition() {
    const maxAttempts = 100;
    let placed = false;
    for (let i = 0; i < maxAttempts; i++) {
      const nx = random(this.r, width - this.r);
      const ny = height + this.r; // 底部
      let ok = true;
      for (let c of circles) {
        if (c === this) continue;
        const minDist = this.r + c.r + 4;
        if (dist(nx, ny, c.x, c.y) < minDist) {
          ok = false;
          break;
        }
      }
      if (ok) {
        this.x = nx;
        this.y = ny;
        placed = true;
        break;
      }
    }
    if (!placed) {
      // 回退到簡單的隨機位置
      this.x = random(this.r, width - this.r);
      this.y = height + this.r;
    }
    // 隨機選擇顏色並設定 alpha
  const newHex = choosePaletteColor();
    this.hex = (newHex || '').toLowerCase();
    const a = random(80, 255);
    this.col = color(this.hex);
    this.col.setAlpha(a);
    this.vy = -this.speed;
  }

  update() {
    // 只垂直移動（移除互相彈開的分離力）
    this.y += this.vy;

    // 到達頂端則將圓重置到畫布底部繼續上升
    if (this.y - this.r <= 0) {
      this.resetPosition();
      return;
    } else if (this.y + this.r >= height) {
      this.y = height - this.r;
      this.vy = -abs(this.vy);
    }
    // 維持在畫布水平範圍內（x 不主動變動，但仍做邊界保護）
    this.x = constrain(this.x, this.r, width - this.r);
  }

  display() {
    // 畫圓
    fill(this.col);
    noStroke();
    ellipse(this.x, this.y, this.d, this.d);

    // 在圓的右上方畫一個白色半透明方形，大小為圓的 1/5，且完全位於圓內
    const s = this.d / 5; // 方形邊長
    // 方形對角線的一半（從方形中心到角的距離）
    const halfDiag = (s * Math.SQRT2) / 2;
    // 要讓方形完全位於圓內，方形中心到圓心的最大距離為 r - halfDiag
    let maxOffset = this.r - halfDiag;
    if (maxOffset < 0) maxOffset = 0; // 若方形太大，保守處理
    // 我們把方形中心放在右上 45 度方向，所以計算 x/y 偏移
    const offset = maxOffset / Math.SQRT2;
    const sqCx = this.x + offset;
    const sqCy = this.y - offset;

    push();
    rectMode(CENTER);
    noStroke();
    // 半透明白色
    fill(255, 150);
    rect(sqCx, sqCy, s, s);
    pop();
  }

  explode(cx, cy) {
    // 播放爆破音效（安全檢查）
    if (popSound && typeof popSound.isLoaded === 'function') {
      if (popSound.isLoaded()) popSound.play();
    } else if (popSound && typeof popSound.play === 'function' && !popSound.isLoaded) {
      // 若 loadSound 回傳的物件沒有 isLoaded，但有 play，嘗試播放
      try { popSound.play(); } catch (e) { /* ignore */ }
    }

    // 建立多個粒子，依圓大小調整數量與速度
    const count = floor(map(this.d, 50, 200, 8, 40));
    for (let i = 0; i < count; i++) {
      const angle = random(0, TWO_PI);
      const speed = random(0.8, 6) * (this.d / 150); // 大圓爆破更猛烈
      const vx = cos(angle) * speed;
      const vy = sin(angle) * speed;
      const col = this.col; // 使用同色系
      particles.push(new Particle(cx, cy, vx, vy, col));
    }
  }

  // 檢查是否被點擊
  checkClick(mx, my) {
    let d = dist(mx, my, this.x, this.y);
    if (d < this.r) {
      // 檢查傳入的 hex 是否為目標顏色 (#0ffc44ff 或 #0ffc44)
      if (this.hex === '#0ffc44ff' || this.hex === '#0ffc44') {
        score++;
      } else {
        score--;
      }
      this.explode(this.x, this.y);
      this.resetPosition(); // 隨機重置位置
      return true;
    }
    return false;
  }
}

class Particle {
  constructor(x, y, vx, vy, col) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = random(40, 90); // 存活幀數
    this.maxLife = this.life;
    // 複製色彩並取較亮 alpha
    this.col = color(red(col), green(col), blue(col), 220);
    this.size = random(3, 10);
    this.dead = false;
  }

  update() {
    // 加入簡單阻力與重力效果（視覺上更自然）
    this.vx *= 0.98;
    this.vy *= 0.99;
    this.vy += 0.05; // 微重力
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    if (this.life <= 0) this.dead = true;
  }

  display() {
    push();
    noStroke();
    const a = map(this.life, 0, this.maxLife, 0, 255);
    fill(red(this.col), green(this.col), blue(this.col), a);
    ellipse(this.x, this.y, this.size, this.size);
    pop();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // 調整圓的位置，避免超出新的畫布範圍
  for (let c of circles) {
    c.x = constrain(c.x, c.r, width - c.r);
    c.y = constrain(c.y, c.r, height - c.r);
  }
}

function mousePressed() {
  // 嘗試在第一次使用者互動時啟動背景音樂（以避免自動播放被瀏覽器阻擋）
  if (bgMusic && typeof bgMusic.play === 'function' && !bgMusic.isPlaying()) {
    try { bgMusic.play(); } catch (e) { /* ignore */ }
  }

  // 若處於暫停狀態，不處理點擊
  if (isPaused) return;
  // 檢查是否點擊到任何氣球
  for (let c of circles) {
    c.checkClick(mouseX, mouseY);
  }
}

// 切換暫停狀態並更新按鈕文字
function togglePause() {
  isPaused = !isPaused;
  if (pauseButton) pauseButton.html(isPaused ? 'Resume' : 'Pause');
  // 暫停時同步暫停背景音樂，恢復時嘗試播放
  if (bgMusic) {
    try {
      if (isPaused) {
        if (typeof bgMusic.pause === 'function') bgMusic.pause();
      } else {
        if (typeof bgMusic.play === 'function') bgMusic.play();
      }
    } catch (e) { /* ignore */ }
  }
}
