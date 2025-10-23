// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------

// 確保這是全域變數
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; // 用於 p5.js 繪圖的文字

// [新增] 煙火全域變數
let fireworks = []; // 儲存煙火物件的陣列
let explosionSound; // 爆炸音效變數
let gravity; // 重力向量

// =================================================================
// [新增] 預載音效
// -----------------------------------------------------------------
// !!! 確保您的網頁已引入 p5.sound.js 函式庫 
// 且 'explosion.mp3' 檔案存在於專案根目錄
function preload() {
    // 檢查 p5.sound 是否載入，並載入音效
    if (typeof loadSound === 'function') {
        // 假設音效檔案名為 explosion.mp3
        explosionSound = loadSound('explosion.mp3'); 
        explosionSound.setVolume(0.5); // 設定音量
    } else {
        console.warn("p5.sound.js 未載入，煙火音效將被禁用。");
    }
}

window.addEventListener('message', function (event) {
    // 執行來源驗證...
    // ...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; // 更新全域變數
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        // ----------------------------------------
        // 關鍵步驟 2: 呼叫重新繪製 (如果 draw() 有持續循環則可移除)
        // ----------------------------------------
        // 由於我們移除 noLoop() 讓 draw() 連續循環，這裡可以保留或移除。
        // 保留 redraw() 可以確保在接收到第一筆分數時立即繪製。
        if (typeof redraw === 'function') {
            redraw(); 
        }
    }
}, false);


// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

function setup() { 
    // ... (其他設置)
    createCanvas(windowWidth / 2, windowHeight / 2); 
    background(0); // 煙火效果建議使用黑色背景
    colorMode(HSB, 255); // 使用 HSB 顏色模式，方便煙火顏色和透明度控制
    gravity = createVector(0, 0.2); // 定義重力向量
    // noLoop(); // <<== 必須移除此行，讓 draw() 循環執行才能實現連續動畫
} 

function draw() { 
    // 關鍵：使用半透明黑色背景 (B: 0, Alpha: 0.1) 創造煙火的殘影拖尾效果
    colorMode(HSB, 255);
    background(0, 0, 0, 25); // HSB: 色相0, 飽和度0, 亮度0, 透明度25 (約 0.1)

    // 計算百分比
    let percentage = (finalScore / maxScore) * 100;

    // -----------------------------------------------------------------
    // [新增] 煙火發射邏輯
    // -----------------------------------------------------------------
    if (percentage >= 90) {
        // 如果分數 >= 90，以 4% 的機率（每秒約 2.4 次，假設 60fps）發射新煙火
        if (random(1) < 0.04) { 
            fireworks.push(new Firework()); 
        }
    }

    // -----------------------------------------------------------------
    // [新增] 煙火更新與顯示邏輯
    // -----------------------------------------------------------------
    // 逐一更新和顯示煙火
    for (let i = fireworks.length - 1; i >= 0; i--) { // 從後往前迭代，方便移除
        fireworks[i].update(); // 更新位置
        fireworks[i].show(); // 顯示
        
        if (fireworks[i].done()) { // 檢查是否完成
            fireworks.splice(i, 1); // 從陣列中移除
        }
    }
    
    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容 (畫面反映一)
    // -----------------------------------------------------------------
    textSize(80); 
    textAlign(CENTER);
    
    if (percentage >= 90) {
        // 滿分或高分 (綠色 HSB: 80, 200, 200)
        fill(80, 200, 200); 
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
    } else if (percentage >= 60) {
        // 中等分數 (黃色/橘色 HSB: 30, 255, 255)
        fill(30, 255, 255); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        // 低分 (紅色 HSB: 0, 255, 200)
        fill(0, 255, 200); 
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 尚未收到分數或分數為 0 (灰色 HSB: 0, 0, 150)
        fill(0, 0, 150);
        text(scoreText, width / 2, height / 2);
    }

    // 顯示具體分數
    textSize(50);
    fill(0, 0, 200); // 淺灰色
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映 (畫面反映二)
    // -----------------------------------------------------------------
    
    if (percentage >= 90) {
        // 畫一個大圓圈代表完美 (綠色 HSB: 80, 200, 200, Alpha: 150)
        fill(80, 200, 200, 150); 
        noStroke();
        circle(width / 2, height / 2 + 150, 150);
        
    } else if (percentage >= 60) {
        // 畫一個方形 (黃色/橘色 HSB: 30, 255, 255, Alpha: 150)
        fill(30, 255, 255, 150);
        rectMode(CENTER);
        rect(width / 2, height / 2 + 150, 150, 150);
    }
}


// =================================================================
// [新增] Particle 類別 (用於煙火的碎片)
// -----------------------------------------------------------------
class Particle {
    constructor(x, y, hu, isFirework) {
        this.pos = createVector(x, y);
        this.isFirework = isFirework; // 判斷是上升的火箭 (true) 還是爆炸碎片 (false)
        this.lifespan = 255;
        this.hu = hu; // 顏色色相

        if (this.isFirework) {
            // 上升中的火箭：給予向上速度
            this.vel = createVector(0, random(-12, -8)); 
        } else {
            // 爆炸後的碎片：給予隨機方向和速度
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
            this.vel.mult(0.9); // 爆炸後碎片速度減慢 (空氣阻力模擬)
            this.lifespan -= 4; // 減少生命值 (用於淡出效果)
        }
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0);
    }

    show() {
        // 確保顏色模式與 setup 保持一致
        colorMode(HSB, 255);

        if (this.isFirework) {
            // 上升的火箭：白色或單色，不透明
            strokeWeight(4); 
            stroke(this.hu, 255, 255);
        } else {
            // 爆炸碎片：使用顏色和生命值作為透明度
            strokeWeight(2);
            stroke(this.hu, 255, 255, this.lifespan); 
        }
        point(this.pos.x, this.pos.y);
    }

    done() {
        return this.lifespan < 0; // 生命值小於 0 時即完成
    }
}

// =================================================================
// [新增] Firework 類別 (用於管理整個煙火過程)
// -----------------------------------------------------------------
class Firework {
    constructor() {
        this.hu = random(255); // 隨機顏色
        // 在畫面底部隨機 X 位置創建一個上升的火箭粒子
        this.firework = new Particle(random(width), height, this.hu, true); 
        this.exploded = false;
        this.particles = [];
    }

    update() {
        if (!this.exploded) {
            this.firework.applyForce(gravity); // 套用重力
            this.firework.update();

            // 檢查上升中的火箭是否開始下降 (達到最高點)
            if (this.firework.vel.y >= 0) {
                this.exploded = true;
                this.explode(); // 爆炸
            }
        }
        
        // 更新爆炸後的碎片
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
        if (explosionSound && explosionSound.isLoaded()) {
            explosionSound.play();
        }

        // 產生 100 個碎片
        for (let i = 0; i < 100; i++) { 
            // 碎片的顏色與火箭顏色相近
            const p = new Particle(this.firework.pos.x, this.firework.pos.y, random(this.hu - 20, this.hu + 20), false);
            this.particles.push(p);
        }
    }

    show() {
        if (!this.exploded) {
            this.firework.show(); // 顯示上升的火箭
        }
        
        // 顯示碎片
        for (const p of this.particles) {
            p.show();
        }
    }

    done() {
        // 當爆炸完成且所有碎片都消失時，則整個煙火過程完成
        return this.exploded && this.particles.length === 0;
    }
}
