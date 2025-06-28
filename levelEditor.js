class LevelEditor {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.circles = [];
        this.isEditing = false;
        this.currentBeat = 0;
        this.bpm = 120;
        this.grid = 32;
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => {
            if (!this.isEditing) return;
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.addCircle(x, y);
        });

        document.addEventListener('keydown', (e) => {
            if (!this.isEditing) return;
            if (e.key === 'Delete' || e.key === 'Backspace') {
                this.removeLastCircle();
            }
            if (e.key === 's' && e.ctrlKey) {
                e.preventDefault();
                this.saveLevel();
            }
        });
    }

    start() {
        this.isEditing = true;
        this.circles = [];
        this.draw();
    }

    stop() {
        this.isEditing = false;
        this.circles = [];
    }

    addCircle(x, y) {
        const circle = {
            x: Math.round(x / this.grid) * this.grid,
            y: Math.round(y / this.grid) * this.grid,
            timing: this.currentBeat,
            radius: 30
        };
        this.circles.push(circle);
        this.currentBeat += (60000 / this.bpm);
        this.draw();
    }

    removeLastCircle() {
        if (this.circles.length > 0) {
            this.circles.pop();
            this.currentBeat -= (60000 / this.bpm);
            this.draw();
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;

        for (let x = 0; x < this.canvas.width; x += this.grid) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y < this.canvas.height; y += this.grid) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        // Draw circles
        this.circles.forEach((circle, index) => {
            this.ctx.beginPath();
            this.ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(255, 102, 170, 0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Draw circle number
            this.ctx.fillStyle = 'white';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(index + 1, circle.x - 8, circle.y + 6);
        });

        // Draw editor info
        this.ctx.fillStyle = 'white';
        this.ctx.font = '18px Arial';
        this.ctx.fillText(`BPM: ${this.bpm}`, 20, 30);
        this.ctx.fillText(`Circles: ${this.circles.length}`, 20, 60);
    }

    saveLevel() {
        const levelData = {
            name: prompt('Enter level name:', 'My Level'),
            bpm: this.bpm,
            circles: this.circles
        };

        if (!levelData.name) return;

        const levels = JSON.parse(localStorage.getItem('tap_levels') || '[]');
        levels.push(levelData);
        localStorage.setItem('tap_levels', JSON.stringify(levels));
        alert('Level saved successfully!');
    }

    static loadLevels() {
        return JSON.parse(localStorage.getItem('tap_levels') || '[]');
    }
}