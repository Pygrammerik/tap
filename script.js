class ScorePopup {
    constructor(x, y, score, hitType) {
        this.x = x;
        this.y = y;
        this.score = score;
        this.hitType = hitType;
        this.alpha = 1;
        this.scale = 1.5;
        this.vy = -2;

        // Define colors based on hit type
        switch (hitType) {
            case 'Perfect!':
                this.color = 'rgb(255, 215, 0)';
                this.scale = 2.0;
                break;
            case 'Great!':
                this.color = 'rgb(0, 255, 255)';
                this.scale = 1.8;
                break;
            case 'Good!':
                this.color = 'rgb(0, 255, 127)';
                this.scale = 1.6;
                break;
            default:
                this.color = 'rgb(255, 255, 255)';
                this.scale = 1.5;
        }
    }

    update() {
        this.y += this.vy;
        this.alpha *= 0.95;
        this.scale = Math.max(1, this.scale * 0.95);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);

        // Draw hit type text
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = `rgba(${this.color.slice(4, -1)}, ${this.alpha})`;
        ctx.strokeStyle = 'rgba(0, 0, 0, ' + this.alpha + ')';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        ctx.strokeText(this.hitType, 0, -20);
        ctx.fillText(this.hitType, 0, -20);

        // Draw score
        ctx.font = 'bold 24px Arial';
        ctx.strokeText(`+${this.score}`, 0, 10);
        ctx.fillText(`+${this.score}`, 0, 10);

        ctx.restore();
    }
}

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.alpha = 1;
        this.radius = Math.random() * 3 + 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha *= 0.95;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 153, 204, ${this.alpha})`;
        ctx.fill();
    }
}

class GameTarget {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.alpha = 1;
        this.hit = false;
        this.missTime = 2000;
        this.createTime = Date.now();
        this.particles = [];
        this.points = 100;
    }

    checkHit(x, y) {
        return { hit: false };
    }

    update() {}
    draw(ctx) {}
}

class Circle extends GameTarget {
    constructor(x, y, radius, approachRate) {
        super(x, y, radius);
        this.approachRate = approachRate;
        this.currentRadius = radius * 3;
    }

    update() {
        if (!this.hit) {
            this.currentRadius = Math.max(this.radius, this.currentRadius - this.approachRate);
            const timePassed = Date.now() - this.createTime;
            if (timePassed > this.missTime) {
                this.alpha = Math.max(0, this.alpha - 0.1);
            }
        } else {
            this.alpha = Math.max(0, this.alpha - 0.1);
            this.currentRadius *= 0.9;

            // Update particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                this.particles[i].update();
                if (this.particles[i].alpha < 0.01) {
                    this.particles.splice(i, 1);
                }
            }
        }
    }

    draw(ctx) {
        // Draw particles first
        for (const particle of this.particles) {
            particle.draw(ctx);
        }

        // Outer glow
        const gradient = ctx.createRadialGradient(this.x, this.y, this.currentRadius - 10, this.x, this.y, this.currentRadius + 10);
        gradient.addColorStop(0, `rgba(255, 102, 170, 0)`);
        gradient.addColorStop(0.5, `rgba(255, 102, 170, ${this.alpha * 0.2})`);
        gradient.addColorStop(1, `rgba(255, 102, 170, 0)`);
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentRadius + 10, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Approach circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
        const strokeGradient = ctx.createLinearGradient(this.x - this.currentRadius, this.y - this.currentRadius, 
                                                      this.x + this.currentRadius, this.y + this.currentRadius);
        strokeGradient.addColorStop(0, `rgba(255, 102, 170, ${this.alpha})`);
        strokeGradient.addColorStop(1, `rgba(255, 153, 204, ${this.alpha})`);
        ctx.strokeStyle = strokeGradient;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Inner circle with gradient
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        const innerGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        innerGradient.addColorStop(0, `rgba(255, 153, 204, ${this.alpha * 0.4})`);
        innerGradient.addColorStop(1, `rgba(255, 102, 170, ${this.alpha * 0.2})`);
        ctx.fillStyle = innerGradient;
        ctx.fill();
    }

    checkHit(x, y) {
        const distance = Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2);
        if (distance <= this.radius && !this.hit) {
            // Calculate accuracy
            const accuracy = 1 - (distance / this.radius);
            let hitType = '';
            let particleCount = 20;
            let points = 100;

            if (accuracy > 0.9) {
                hitType = 'Perfect!';
                particleCount = 30;
                points = 30;
            } else if (accuracy > 0.7) {
                hitType = 'Great!';
                particleCount = 25;
                points = 20;
            } else if (accuracy > 0.5) {
                hitType = 'Good!';
                particleCount = 20;
                points = 15;
            } else {
                hitType = 'Okay';
                particleCount = 15;
                points = 10;
            }

            // Create particles on hit
            for (let i = 0; i < particleCount; i++) {
                this.particles.push(new Particle(this.x, this.y));
            }

            return { hit: true, points, hitType };
        }
        return { hit: false };
    }
    }




class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.targets = [];
        this.scorePopups = [];
        this.isPlaying = false;
        this.lastSpawnTime = 0;
        this.spawnInterval = 1000;
        this.levelEditor = new LevelEditor();
        this.currentLevel = null;
        this.circleIndex = 0;
        this.levelStartTime = 0;
        this.gameMode = 'menu';
        this.hitSound = new Audio('osu-hit-sound.mp3');
        this.practiceSettings = {
            spawnInterval: 1000,
            approachRate: 2,
            circleSize: 30,
            gameTime: 60
        };

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.setupEventListeners();
        this.updateLevelList();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupEventListeners() {
        document.querySelector('.play-button').addEventListener('click', () => {
            this.showPracticeSettings();
        });

        document.querySelector('.credits-button').addEventListener('click', () => {
            document.querySelector('.menu').style.display = 'none';
            document.querySelector('.credits-menu').style.display = 'block';
        });

        document.querySelector('.back-button').addEventListener('click', () => {
            document.querySelector('.credits-menu').style.display = 'none';
            document.querySelector('.menu').style.display = 'block';
        });

        document.querySelector('.credits-button')?.addEventListener('click', () => {
            document.querySelector('.menu').style.display = 'none';
            document.querySelector('.credits-menu').style.display = 'block';
        });

        document.querySelector('.back-button')?.addEventListener('click', () => {
            document.querySelector('.credits-menu').style.display = 'none';
            document.querySelector('.menu').style.display = 'block';
        });
        
        this.canvas.addEventListener('click', (e) => {
            if (!this.isPlaying) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.checkHits(x, y);
        });
    }

    showPracticeSettings() {
        const menu = document.querySelector('.menu');
        menu.innerHTML = `
            <div class="logo">tap!</div>
            <div class="practice-settings">
                <h2>Practice Mode Settings</h2>
                <div class="setting">
                    <label>Spawn Interval (ms):</label>
                    <input type="range" min="500" max="2000" value="${this.practiceSettings.spawnInterval}" 
                           class="spawn-interval" oninput="this.nextElementSibling.value = this.value">
                    <output>${this.practiceSettings.spawnInterval}</output>
                </div>
                <div class="setting">
                    <label>Approach Rate:</label>
                    <input type="range" min="1" max="5" step="0.5" value="${this.practiceSettings.approachRate}" 
                           class="approach-rate" oninput="this.nextElementSibling.value = this.value">
                    <output>${this.practiceSettings.approachRate}</output>
                </div>
                <div class="setting">
                    <label>Circle Size:</label>
                    <input type="range" min="20" max="50" value="${this.practiceSettings.circleSize}" 
                           class="circle-size" oninput="this.nextElementSibling.value = this.value">
                    <output>${this.practiceSettings.circleSize}</output>
                </div>
                <div class="setting">
                    <label>Game Time (seconds):</label>
                    <input type="range" min="30" max="300" step="30" value="${this.practiceSettings.gameTime}" 
                           class="game-time" oninput="this.nextElementSibling.value = this.value">
                    <output>${this.practiceSettings.gameTime}</output>
                </div>
                <button class="start-practice">Start Practice</button>
                <button class="back-to-menu">Back</button>
            </div>
        `;

        menu.querySelector('.start-practice').addEventListener('click', () => {
            this.practiceSettings.spawnInterval = parseInt(menu.querySelector('.spawn-interval').value);
            this.practiceSettings.approachRate = parseFloat(menu.querySelector('.approach-rate').value);
            this.practiceSettings.circleSize = parseInt(menu.querySelector('.circle-size').value);
            this.practiceSettings.gameTime = parseInt(menu.querySelector('.game-time').value);
            this.startPractice();
        });

        menu.querySelector('.back-to-menu').addEventListener('click', () => {
            this.stopGame();
            this.updateLevelList();
        });
    }

    startPractice() {
        this.gameMode = 'practice';
        this.isPlaying = true;
        this.score = 0;
        this.targets = [];
        this.scorePopups = [];
        this.currentLevel = null;
        this.startTime = Date.now();
        document.querySelector('.menu').style.display = 'none';
        this.gameLoop();
    }

    showLevelSelect() {
        const levels = LevelEditor.loadLevels();
        const menu = document.querySelector('.menu');
        menu.innerHTML = '<div class="logo">tap!</div><div class="level-select"></div>';
        
        const levelSelect = menu.querySelector('.level-select');
        if (levels.length === 0) {
            levelSelect.innerHTML = '<p>No custom levels found. Create one in the editor!</p>';
        } else {
            levels.forEach((level, index) => {
                const button = document.createElement('button');
                button.textContent = level.name;
                button.addEventListener('click', () => this.startGame(level));
                levelSelect.appendChild(button);
            });
        }

        const backButton = document.createElement('button');
        backButton.textContent = 'Back';
        backButton.addEventListener('click', () => {
            this.stopGame();
            this.updateLevelList();
        });
        menu.appendChild(backButton);
    }

    updateLevelList() {
        const menu = document.querySelector('.menu');
        menu.innerHTML = `
            <div class="logo">tap!</div>
            <button class="play-button">Play</button>
            <button class="credits-button">Credits</button>
        `;
        this.setupEventListeners();
    }

    startEditor() {
        this.gameMode = 'editor';
        document.querySelector('.menu').style.display = 'none';
        this.levelEditor.start();
    }

    startGame() {
        this.startPractice();

    }

    playCustomLevel() {
        if (!this.currentLevel || !this.isPlaying) return;

        const currentTime = Date.now() - this.levelStartTime;
        
        // Spawn new circles based on timing
        while (this.circleIndex < this.currentLevel.circles.length && 
               currentTime >= this.currentLevel.circles[this.circleIndex].timing) {
            const circleData = this.currentLevel.circles[this.circleIndex];
            const circle = new Circle(circleData.x, circleData.y, circleData.radius, 2);
            this.circles.push(circle);
            this.circleIndex++;
        }

        // Update game state
        for (let i = this.circles.length - 1; i >= 0; i--) {
            this.circles[i].update();
            if (this.circles[i].alpha <= 0) {
                this.circles.splice(i, 1);
            }
        }

        // Update score popups
        for (let i = this.scorePopups.length - 1; i >= 0; i--) {
            this.scorePopups[i].update();
            if (this.scorePopups[i].alpha < 0.01) {
                this.scorePopups.splice(i, 1);
            }
        }

        // Draw everything
        this.draw();

        // Check level completion
        if (this.circleIndex >= this.currentLevel.circles.length && this.circles.length === 0) {
            this.finishLevel();
        } else if (this.isPlaying) {
            requestAnimationFrame(() => this.playCustomLevel());
        }
    }

    finishPractice() {
        this.isPlaying = false;
        const menu = document.querySelector('.menu');
        menu.style.display = 'block';

        // Определяем результат
        let rating;
        if (this.score >= 2000) {
            rating = 'Perfect!';
        } else if (this.score >= 1000) {
            rating = 'Good!';
        } else {
            rating = 'Not Bad';
        }

        menu.innerHTML = `
            <div class="logo">tap!</div>
            <div class="level-complete">
                <h2>Time's Up!</h2>
                <h3 style="color: #ff66aa; margin: 10px 0;">${rating}</h3>
                <p>Final Score: ${this.score}</p>
                <button class="play-again">Play Again</button>
                <button class="back-to-menu">Back to Menu</button>
            </div>
        `;

        menu.querySelector('.play-again').addEventListener('click', () => this.showPracticeSettings());
        menu.querySelector('.back-to-menu').addEventListener('click', () => {
            this.stopGame();
        });
    }

    finishLevel() {
        this.isPlaying = false;
        const menu = document.querySelector('.menu');
        menu.style.display = 'block';
        menu.innerHTML = `
            <div class="logo">tap!</div>
            <div class="level-complete">
                <h2>Level Complete!</h2>
                <p>Score: ${this.score}</p>
                <button class="play-again">Play Again</button>
                <button class="back-to-menu">Back to Menu</button>
            </div>
        `;

        menu.querySelector('.play-again').addEventListener('click', () => this.startGame(this.currentLevel));
        menu.querySelector('.back-to-menu').addEventListener('click', () => {
            this.currentLevel = null;
            this.stopGame();
            this.updateLevelList();
        });
    }

    stopGame() {
        this.isPlaying = false;
        this.targets = [];
        this.scorePopups = [];
        this.gameMode = 'menu';
        document.querySelector('.menu').style.display = 'block';
        this.updateLevelList();
    }

    checkHits(x, y) {
        for (let target of this.targets) {
            const result = target.checkHit(x, y);
            if (result.hit && !target.hit) {
                target.hit = true;
                this.score += result.points;
                this.scorePopups.push(new ScorePopup(x, y, result.points, result.hitType));
                this.createHitEffect(x, y);
                this.hitSound.currentTime = 0;
                this.hitSound.play();
            }
        }
    }

    createHitEffect(x, y) {
        const ctx = this.ctx;
        let size = 10;
        let alpha = 1;

        const animate = () => {
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fill();

            size += 5;
            alpha -= 0.1;

            if (alpha > 0) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    update() {
        if (!this.isPlaying) return;

        if (this.gameMode === 'practice') {
            const currentTime = Date.now();
            if (currentTime - this.lastSpawnTime > this.practiceSettings.spawnInterval) {
                this.spawnPracticeTarget();
                this.lastSpawnTime = currentTime;
            }
        }

        // Update targets
        for (let i = this.targets.length - 1; i >= 0; i--) {
            this.targets[i].update();
            if (this.targets[i].alpha <= 0) {
                this.targets.splice(i, 1);
            }
        }

        // Update score popups
        for (let i = this.scorePopups.length - 1; i >= 0; i--) {
            this.scorePopups[i].update();
            if (this.scorePopups[i].alpha < 0.01) {
                this.scorePopups.splice(i, 1);
            }
        }
    }

    spawnPracticeTarget() {
        const margin = 100;
        const x = margin + Math.random() * (this.canvas.width - 2 * margin);
        const y = margin + Math.random() * (this.canvas.height - 2 * margin);
        
        const target = new Circle(x, y, this.practiceSettings.circleSize, this.practiceSettings.approachRate);
        
        this.targets.push(target);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.targets.forEach(target => target.draw(this.ctx));

        // Draw score popups
        this.scorePopups.forEach(popup => popup.draw(this.ctx));

        // Draw score and time with enhanced style in top right corner
        this.ctx.save();
        this.ctx.font = 'bold 36px Arial';
        const scoreText = this.score.toString();
        const x = this.canvas.width - 40;
        const y = 50;

        // Draw remaining time if in practice mode
        if (this.gameMode === 'practice') {
            const currentTime = Date.now();
            const elapsedTime = Math.floor((currentTime - this.startTime) / 1000);
            const remainingTime = Math.max(0, this.practiceSettings.gameTime - elapsedTime);
            const timeText = remainingTime.toString() + 's';
            
            this.ctx.font = 'bold 24px Arial';
            const timeX = this.canvas.width - 40;
            const timeY = 100;
            
            const timeGradient = this.ctx.createLinearGradient(timeX - 60, timeY - 20, timeX, timeY);
            timeGradient.addColorStop(0, '#ff99cc');
            timeGradient.addColorStop(1, '#ff66aa');
            this.ctx.fillStyle = timeGradient;
            this.ctx.fillText(timeText, timeX, timeY);
            
            this.ctx.font = 'bold 16px Arial';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.fillText('time', timeX, timeY - 25);
        }

        // Draw glow effect
        this.ctx.shadowColor = 'rgba(255, 102, 170, 0.8)';
        this.ctx.shadowBlur = 15;
        this.ctx.textAlign = 'right';

        // Draw gradient score
        const gradient = this.ctx.createLinearGradient(x - 100, y - 30, x, y);
        gradient.addColorStop(0, '#ff66aa');
        gradient.addColorStop(1, '#ff99cc');
        this.ctx.fillStyle = gradient;
        this.ctx.fillText(scoreText, x, y);

        // Draw small 'score' text above
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillText('score', x, y - 25);
        this.ctx.restore();

        if (this.gameMode === 'practice') {
            this.ctx.save();
            this.ctx.font = 'bold 18px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            
            // Draw settings with icons
            const settings = [
                { icon: '⏱', text: `${this.practiceSettings.spawnInterval}ms`, label: 'spawn' },
                { icon: '⚡', text: `${this.practiceSettings.approachRate}`, label: 'speed' },
                { icon: '⭕', text: `${this.practiceSettings.circleSize}px`, label: 'size' }
            ];

            settings.forEach((setting, index) => {
                const y = 40 + index * 35;
                // Draw icon
                this.ctx.font = '20px Arial';
                this.ctx.fillText(setting.icon, 20, y);
                
                // Draw value with gradient
                this.ctx.font = 'bold 18px Arial';
                const gradient = this.ctx.createLinearGradient(45, y - 15, 120, y);
                gradient.addColorStop(0, '#ff66aa');
                gradient.addColorStop(1, '#ff99cc');
                this.ctx.fillStyle = gradient;
                this.ctx.fillText(setting.text, 45, y);

                // Draw label
                this.ctx.font = '14px Arial';
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                this.ctx.fillText(setting.label, 45, y - 18);
            });
            
            this.ctx.restore();
        }
    }

    gameLoop() {
        if (!this.isPlaying) return;
        
        if (this.gameMode === 'practice') {
            const currentTime = Date.now();
            const elapsedTime = Math.floor((currentTime - this.startTime) / 1000);
            
            if (elapsedTime >= this.practiceSettings.gameTime) {
                this.finishPractice();
                return;
            }
            
            this.update();
            this.draw();
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}

// Credits
// Created by Pygrammerik
// GitHub: https://github.com/Pygrammerik

window.onload = () => {
    window.game = new Game();
};