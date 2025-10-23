// =================================================================
// 步驟一：全域變數和資料接收
// -----------------------------------------------------------------

let finalScore = 0; 
let maxScore = 0;
// [修正] 設定初始文字，避免畫面一片空白
let scoreText = "請完成上方答題..."; 

let fireworks = []; 
let explosionSound; 
let gravity; 

// =================================================================
// 預載音效 (!!! 必須確保 explosion.mp3 檔案存在 !!!)
// -----------------------------------------------------------------
function preload() {
    if (typeof loadSound === 'function') {
        // 假設音效檔案名為 explosion.mp3
        explosionSound = loadSound('explosion.mp3'); 
        explosionSound.setVolume(0.5); 
    } else {
        console.warn("p5.sound.js 未載入或 loadSound 未定義。煙火音效將被禁用。");
    }
}

window.addEventListener('message', function (event) {
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        finalScore = data.score; 
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
    }
}, false);


// =================================================================
// 步驟二：p5.js 初始化與繪製
// -----------------------------------------------------------------

function setup() { 
    createCanvas(windowWidth / 2, windowHeight / 2); 
    background(0); // 黑色背景
    colorMode(HSB, 255); // 使用 HSB 顏色模式
    gravity = createVector(0, 0.2); // 定義重力向量
    // 原有的 noLoop(); **已移除**，draw() 將持續循環
} 

function draw() { 
    // 關鍵：使用半透明黑色背景 (Alpha=25) 創造煙火的殘影拖尾效果
    colorMode(HSB, 255);
    background(0, 0, 0, 25); 

    // 避免除以零錯誤
    let percentage = (maxScore > 0) ? (finalScore / maxScore) * 100 : 0; 

    // -----------------------------------------------------------------
    // 煙火發射邏輯 (分數 >= 90 且以 4% 機率發射)
    // -----------------------------------------------------------------
    if (percentage >= 90) {
        if (random(1) < 0.04) { 
            fireworks.push(new Firework()); 
        }
    }

    // -----------------------------------------------------------------
    // 煙火更新與顯示邏輯
    // -----------------------------------------------------------------
    for (let i = fireworks.length - 1; i >= 0; i--) { 
        fireworks[i].update(); 
        fireworks[i].show(); 
        
        if (fireworks[i].done()) { 
            fireworks.splice(i, 1); 
        }
    }
    
    // -----------------------------------------------------------------
    // 分數文字與圖形顯示
    // -----------------------------------------------------------------
    textSize(80); 
    textAlign(CENTER);
    
    // 文字顯示 (使用 HSB 顏色)
    if (percentage >= 90) {
        fill(80, 200, 200); // 綠色
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
    } else if (percentage >= 60) {
        fill(30, 255, 255); // 黃色/橘色
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else {
        // [修正] 如果未收到分數或分數為零，使用較亮的顏色確保看得見
        fill(0, 0, 200); // HSB 亮灰色
        text(scoreText, width / 2, height / 2);
    }

    textSize(50);
    fill(0, 0, 255); // 白色
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // 圖形顯示
    if (percentage >= 90) {
        fill(80, 200, 200, 150); 
        noStroke();
        circle(width / 2, height / 2 + 150, 150);
        
    } else if (percentage >= 60) {
        fill(30, 255, 255, 150);
        rectMode(CENTER);
        rect(width / 2, height / 2 + 150, 150, 150);
    }
}


// =================================================================
// Particle 類別 (用於煙火的碎片)
// -----------------------------------------------------------------
class Particle {
    constructor(x, y, hu, isFirework) {
        this.pos = createVector(x, y);
        this.isFirework = isFirework; 
        this.lifespan = 255;
        this.hu = hu; 

        if (this.isFirework) {
            this.vel = createVector(0, random(-12, -8)); 
        } else {
            this.vel = p5.Vector.random2D(); 
            this.vel.mult(random(2, 10)); 
        }
        this.acc = createVector(0, 0);
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.isFirework) {
            this.vel.mult(0.9); 
            this.lifespan -= 4; 
        }
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0);
    }

    show() {
        colorMode(HSB, 255);

        if (this.isFirework) {
            strokeWeight(4); 
            stroke(this.hu, 255, 255); 
        } else {
            strokeWeight(2);
            stroke(this.hu, 255, 255, this.lifespan); 
        }
        point(this.pos.x, this.pos.y);
    }

    done() {
        return this.lifespan < 0; 
    }
}

// =================================================================
// Firework 類別 (用於管理整個煙火過程)
// -----------------------------------------------------------------
class Firework {
    constructor() {
        this.hu = random(255); // 隨機顏色
        this.firework = new Particle(random(width), height, this.hu, true); 
        this.exploded = false;
        this.particles = [];
    }

    update() {
        if (!this.exploded) {
            this.firework.applyForce(gravity); 
            this.firework.update();

            if (this.firework.vel.y >= 0) { 
                this.exploded = true;
                this.explode(); 
            }
        }
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].applyForce(gravity);
            this.particles[i].update();
            if (this.particles[i].done()) {
                this.particles.splice(i, 1);
            }
        }
    }

    explode() {
        // 播放爆炸音效
        if (explosionSound && typeof explosionSound.isLoaded === 'function' && explosionSound.isLoaded()) {
            explosionSound.play();
        }

        for (let i = 0; i < 100; i++) { 
            const p = new Particle(this.firework.pos.x, this.firework.pos.y, random(this.hu - 20, this.hu + 20), false);
            this.particles.push(p);
        }
    }

    show() {
        if (!this.exploded) {
            this.firework.show(); 
        }
        
        for (const p of this.particles) {
            p.show();
        }
    }

    done() {
        return this.exploded && this.particles.length === 0;
    }
}
