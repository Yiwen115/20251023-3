// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------

let finalScore = 0;
let maxScore = 0;
let scoreText = "";

// === 煙火特效相關 ===
let fireworks = [];
let showFirework = false;

// =================================================================
// 步驟二：煙火系統設定
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
    fill(
      this.col.levels[0],
      this.col.levels[1],
      this.col.levels[2],
      this.lifespan
    );
    ellipse(this.pos.x, this.pos.y, 6);
  }

  done() {
    return this.lifespan < 0;
  }
}

// 建立煙火
function createFirework() {
  // 讓煙火在整個畫面隨機爆開
  let x = random(width);
  let y = random(height * 0.8);
  let col = color(random(255), random(255), random(255));
  for (let i = 0; i < 80; i++) {
    fireworks.push(new Particle(x, y, col));
  }
}

// =================================================================
// 步驟三：接收分數並觸發煙火
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

      // 當分數 >= 90 時啟動煙火
      if (finalScore >= 90) {
        showFirework = true;
        for (let i = 0; i < 5; i++) {
          setTimeout(createFirework, i * 400); // 間隔0.4秒連續爆
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
  // 柔亮背景（避免全黑）
  fill(0, 25);
  rect(0, 0, width, height);

  // 顯示分數文字
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
