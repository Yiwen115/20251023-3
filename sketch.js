// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------

// 全域變數
let finalScore = 0;
let maxScore = 0;
let scoreText = "";

// === 新增：煙火相關 ===
let fireworks = [];
let showFirework = false;

// =================================================================
// 步驟二：煙火特效系統
// -----------------------------------------------------------------

class Particle {
  constructor(x, y, col) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(2, 6));
    this.acc = createVector(0, 0.05);
    this.col = col;
    this.lifespan = 255;
  }

  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.lifespan -= 4;
  }

  show() {
    noStroke();
    fill(this.col.levels[0], this.col.levels[1], this.col.levels[2], this.lifespan);
    ellipse(this.pos.x, this.pos.y, 6);
  }

  done() {
    return this.lifespan < 0;
  }
}

function createFirework() {
  let x = random(width);
  let y = random(height / 2);
  let col = color(random(255), random(255), random(255));
  for (let i = 0; i < 80; i++) {
    fireworks.push(new Particle(x, y, col));
  }
}

// =================================================================
// 步驟三：接收 H5P 傳入分數
// -----------------------------------------------------------------

window.addEventListener(
  "message",
  function (event) {
    const data = event.data;
    if (data && data.type === "H5P_SCORE_RESULT") {
      finalScore = data.score;
      maxScore = data.maxScore;
      scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
      console.log("新的分數已接收:", scoreText);

      if (typeof redraw === "function") redraw();

      // 成績達 90 以上放煙火
      if (finalScore >= 90) {
        showFirework = true;
        for (let i = 0; i < 5; i++) {
          setTimeout(createFirework, i * 400); // 連續五次爆開
        }
      }
    }
  },
  false
);

// =================================================================
// 步驟四：p5.js 主繪圖
// -----------------------------------------------------------------

function setup() {
  createCanvas(800, 400);
  textSize(24);
  textAlign(CENTER, CENTER);
}

function draw() {
  // 使用半透明背景避免文字消失
  background(0, 40);

  // 顯示分數
  fill(255);
  text(scoreText, width / 2, height / 2);

  // 顯示煙火特效
  if (showFirework) {
    for (let i = fireworks.length - 1; i >= 0; i--) {
      let p = fireworks[i];
      p.update();
      p.show();
      if (p.done()) {
        fireworks.splice(i, 1);
      }
    }
  }
}
