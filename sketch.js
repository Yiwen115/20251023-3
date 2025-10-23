// =================================================================
// 步驟一：全域變數和資料接收
// -----------------------------------------------------------------

let finalScore = 0; 
let maxScore = 0;
let scoreText = "等待 H5P 成績接收中..."; 
let p5CanvasWrapper; // 全域變數：儲存動態創建的覆蓋容器

let fireworks = []; 
let explosionSound; 
let gravity; 

// =================================================================
// 預載音效
// -----------------------------------------------------------------
function preload() {
    if (typeof loadSound === 'function') {
        explosionSound = loadSound('explosion.mp3', () => {
            console.log("音效載入完成。");
        }, (err) => {
             console.error("載入音效失敗，請檢查 explosion.mp3 路徑:", err);
        }); 
        explosionSound.setVolume(0.5); 
    } else {
        console.warn("p5.sound.js 未載入。煙火音效將被禁用。");
    }
}

window.addEventListener('message', function (event) {
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        finalScore = data.score; 
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 

        // H5P 成績送出後，顯示 p5.js Canvas
        if (p5CanvasWrapper) {
            p5CanvasWrapper.style.display = 'block'; 
            
            // 重新定位一次，以防 H5P 內容在分數出來後有微小調整
            repositionCanvasWrapper(); 
        }
    }
}, false);

// [關鍵修正] 修正定位的函式，使用 position: fixed 相對於視埠定位
function repositionCanvasWrapper() {
    const h5pContainer = document.getElementById('h5pContainer');
    if (!h5pContainer || !p5CanvasWrapper) return;
    
    // 獲取 H5P 容器相對於視埠的絕對位置和尺寸 (最可靠的定位方法)
    const rect = h5pContainer.getBoundingClientRect();
    
    // [關鍵修正] 1. 使用 position: fixed 確保絕對覆蓋，無視父元素布局
    p5CanvasWrapper.style.position = 'fixed'; 
    
    // [關鍵修正] 2. 直接使用 getBoundingClientRect() 提供的視埠座標
    p5CanvasWrapper.style.top = rect.top + 'px'; 
    p5CanvasWrapper.style.left = rect.left + 'px';
    
    p5CanvasWrapper.style.width = rect.width + 'px';
    p5CanvasWrapper.style.height = rect.height + 'px';
    p5CanvasWrapper.style.zIndex = '10'; // 確保 Canvas 覆蓋在 H5P 之上
    p5CanvasWrapper.style.pointerEvents = 'none'; // 讓滑鼠點擊穿透

    // 調整 Canvas 大小
    if (window.p5Instance) {
        window.p5Instance.resizeCanvas(rect.width, rect.height);
    }
}

// 監聽視窗尺寸變化，確保覆蓋層保持準確
window.addEventListener('resize', repositionCanvasWrapper);


// =================================================================
// 步驟二：p5.js 初始化與繪製
// -----------------------------------------------------------------

function setup() { 
    
    const h5pContainer = document.getElementById('h5pContainer');
    
    if (!h5pContainer) {
        console.error("錯誤：找不到 #h5pContainer 元素。請確保 index.html 中有 <div id=\"h5pContainer\">。");
        createCanvas(windowWidth / 2, windowHeight / 2); // 備用 Canvas
        return;
    } 

    // 1. 創建 p5.js Canvas 專屬的覆蓋容器 (Wrapper)
    p5CanvasWrapper = document.createElement('div');
    p5CanvasWrapper.id = 'p5-overlay';
    
    // 2. 將 wrapper 插入到 DOM 中 (直接插入到 body)
    document.body.appendChild(p5CanvasWrapper); 

    // 3. 初始化 Canvas 尺寸
    const rect = h5pContainer.getBoundingClientRect();
    const canvas = createCanvas(rect.width, rect.height);

    // 4. 將 Canvas 附加到新創建的覆蓋容器中
    canvas.parent(p5CanvasWrapper); 
    
    // 5. 初始時隱藏 Canvas，並進行初次定位
    p5CanvasWrapper.style.display = 'none';
    repositionCanvasWrapper(); // 執行定位

    // 6. 儲存 p5 實例
    window.p5Instance = this; 
    
    background(0); 
    colorMode(HSB, 255); 
    gravity = createVector(0, 0.2); 
} 

function draw() { 
    // 使用半透明黑色背景 (Alpha=25) 創造煙火的殘影拖尾效果
    colorMode(HSB, 255);
    background(0, 0, 0, 25); 

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
        this.hu = random(255); 
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
