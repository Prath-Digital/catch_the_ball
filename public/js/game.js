class Ball {
    constructor(canvas, type) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.type = type;
        this.reset();
        
        // Load ball image
        this.image = new Image();
        this.image.src = `/assets/images/${type}_ball.png`;
        
        // Add image load error handling
        this.image.onerror = (err) => {
            console.error(`Error loading ball image ${type}:`, err);
        };
    }

    reset() {
        this.x = Math.random() * (this.canvas.width - 30);
        this.y = -30;
        this.speed = this.getSpeed();
        this.caught = false;
        this.missed = false;
    }

    getSpeed() {
        switch(this.type) {
            case '1': return 3;  // Very Easy
            case '2': return 4;  // Easy
            case '3': return 5;  // Medium
            case '4': return 6;  // Hard
            case '5': return 7;  // Extreme
            default: return 3;
        }
    }

    getPoints() {
        switch(this.type) {
            case '1': return 1;  // Very Easy
            case '2': return 3;  // Easy
            case '3': return 5;  // Medium
            case '4': return 7;  // Hard
            case '5': return 10; // Extreme
            default: return 1;
        }
    }

    update() {
        this.y += this.speed;
        if (this.y > this.canvas.height && !this.caught) {
            this.missed = true;
        }
        return this.missed;
    }

    draw() {
        if (this.image.complete) {
            // Draw glow effect
            const gradient = this.ctx.createRadialGradient(
                this.x + 15, this.y + 15, 5,
                this.x + 15, this.y + 15, 20
            );
            
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(this.x + 15, this.y + 15, 20, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw ball
            this.ctx.drawImage(this.image, this.x, this.y, 30, 30);
        } else {
            // Fallback if image is not loaded
            this.ctx.beginPath();
            this.ctx.arc(this.x + 15, this.y + 15, 15, 0, Math.PI * 2);
            this.ctx.fillStyle = this.getBallColor();
            this.ctx.fill();
        }
    }

    getBallColor() {
        switch(this.type) {
            case '1': return '#00b5ff';  // Very Easy - Light Blue
            case '2': return '#4CAF50';  // Easy - Green
            case '3': return '#ff07b5ff';  // Medium - Pink
            case '4': return '#ff0000ff';  // Hard - Red
            case '5': return '#000000ff';  // Extreme - Black
            default: return '#4CAF50';
        }
    }
}

class Game {
    constructor() {
        // Initialize canvas
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('Could not find canvas element');
            return;
        }

        // Get context
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error('Could not get canvas context');
            return;
        }

        // Set rendering quality
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Add pause state
        this.isPaused = false;
        
        // Initialize game state
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('highScore')) || 0;
        this.balls = [];
        this.gameActive = true;
        this.currentBallType = 1;
        
        // Initialize basket
        this.basket = {
            x: 0,
            y: 0,
            width: 100,
            height: 60,
            speed: 12,
            image: new Image()
        };

        // Load basket image
        this.basket.image.onload = () => {
            console.log('Basket image loaded successfully');
            // Start game initialization after basket image loads
            this.init();
            this.bindEvents();
            this.gameLoop();
        };
        this.basket.image.onerror = (err) => {
            console.error('Error loading basket image:', err);
            // Try loading with fallback color
            this.init();
            this.bindEvents();
            this.gameLoop();
        };
        this.basket.image.src = '/assets/images/basket.png';
    }

    updateScoreDisplay() {
        document.getElementById('currentScore').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
    }

    init() {
        this.resizeCanvas();
        this.basket.x = (this.canvas.width - this.basket.width) / 2;
        this.basket.y = this.canvas.height - this.basket.height - 10;
        
        // Update score displays
        this.updateScoreDisplay();
        this.createNextBall();
    }

    resizeCanvas() {
        const headerHeight = document.querySelector('.game-header').offsetHeight;
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight - headerHeight;

        // Set fixed width for portrait mode (adjust these values as needed)
        const GAME_WIDTH = 400; // Fixed game width
        const GAME_HEIGHT = 600; // Fixed game height

        // Calculate scale to fit the container while maintaining aspect ratio
        const scale = Math.min(
            containerWidth / GAME_WIDTH,
            containerHeight / GAME_HEIGHT
        );

        // Set canvas size
        this.canvas.style.width = `${GAME_WIDTH * scale}px`;
        this.canvas.style.height = `${GAME_HEIGHT * scale}px`;
        
        // Set actual canvas dimensions (for sharp rendering)
        this.canvas.width = GAME_WIDTH;
        this.canvas.height = GAME_HEIGHT;

        // Store the scale for mouse/touch input calculations
        this.scale = scale;
        
        // Reset basket position when canvas is resized
        if (this.basket) {
            this.basket.y = this.canvas.height - this.basket.height - 10;
            this.basket.x = Math.min(this.basket.x, this.canvas.width - this.basket.width);
        }
    }

    bindEvents() {
        // Handle window resize
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            switch(e.key) {
                case ' ': // Space bar
                    e.preventDefault();
                    if (this.gameActive) {
                        this.togglePause();
                    }
                    break;
                case 'r':
                case 'R':
                    if (!this.isPaused) {
                        this.restart();
                    }
                    break;
                case 'ArrowLeft':
                    if (this.gameActive && !this.isPaused) {
                        this.basket.x = Math.max(0, this.basket.x - this.basket.speed);
                    }
                    break;
                case 'ArrowRight':
                    if (this.gameActive && !this.isPaused) {
                        this.basket.x = Math.min(
                            this.canvas.width - this.basket.width,
                            this.basket.x + this.basket.speed
                        );
                    }
                    break;
            }
        });

        // Touch controls
        let touchStartX = 0;
        let lastTouchX = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            touchStartX = (touch.clientX - rect.left) / this.scale;
            lastTouchX = touchStartX;
            e.preventDefault();
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            if (!this.gameActive) return;
            
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const currentX = (touch.clientX - rect.left) / this.scale;
            const deltaX = currentX - lastTouchX;
            
            this.basket.x = Math.max(0, Math.min(
                this.canvas.width - this.basket.width,
                this.basket.x + deltaX
            ));
            
            lastTouchX = currentX;
            e.preventDefault();
        }, { passive: false });
    }

    createNextBall() {
        if (this.gameActive) {
            // Create a new ball with the current type
            this.balls = [new Ball(this.canvas, this.currentBallType.toString())];
            
            // Increment ball type for next turn, cycle back to 1 after 5
            this.currentBallType = (this.currentBallType % 5) + 1;
        }
    }

    checkCollision(ball) {
        return (ball.x < this.basket.x + this.basket.width &&
                ball.x + 30 > this.basket.x &&
                ball.y + 30 > this.basket.y &&
                ball.y < this.basket.y + this.basket.height);
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.drawPauseOverlay();
        }
    }

    drawPauseOverlay() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Pause text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 32px Poppins';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2 - 30);
        
        // Instructions
        this.ctx.font = '16px Poppins';
        this.ctx.fillText('Press SPACE to resume', this.canvas.width / 2, this.canvas.height / 2 + 10);
        this.ctx.fillText('Press R to restart', this.canvas.width / 2, this.canvas.height / 2 + 40);
    }

    updateGame() {
        if (!this.gameActive || this.balls.length === 0 || this.isPaused) {
            return;
        }

        const ball = this.balls[0];
        
        // Check for collision
        if (this.checkCollision(ball)) {
            this.score += ball.getPoints();
            this.updateScoreDisplay();
            ball.caught = true;
            
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('highScore', this.highScore);
                document.getElementById('highScore').textContent = this.highScore;
            }
            
            // Remove the current ball and create the next one
            this.balls = [];
            this.createNextBall();
        } else {
            // Update ball position and check for miss
            if (ball.update()) {
                this.gameOver();
            }
        }
    }

    draw() {
        // Clear the canvas with a gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a1a1a');
        gradient.addColorStop(1, '#2c2c2c');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw game area border
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw balls
        this.balls.forEach(ball => {
            // Draw ball shadow
            this.ctx.beginPath();
            this.ctx.arc(ball.x + 15, ball.y + 32, 5, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fill();
            
            ball.draw();
        });
        
        // Draw basket with shadow
        if (this.basket.image.complete) {
            // Draw basket shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.fillRect(
                this.basket.x + 5,
                this.basket.y + this.basket.height,
                this.basket.width,
                10
            );
            
            this.ctx.drawImage(
                this.basket.image,
                this.basket.x,
                this.basket.y,
                this.basket.width,
                this.basket.height
            );
        }
        
        // Draw debug info
        if (this.balls.length === 0) {
            this.ctx.fillStyle = '#666';
            this.ctx.font = '16px Poppins';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Waiting for next ball...', this.canvas.width / 2, 50);
        }
    }

    gameOver() {
        this.gameActive = false;

        // Show game over overlay
        const overlay = document.getElementById('gameOverlay');
        const finalScore = document.getElementById('finalScore');
        if (overlay && finalScore) {
            finalScore.textContent = this.score;
            overlay.classList.remove('hidden');
        }

        // Set up modal handlers for score submission
        const modal = document.getElementById('nameInputModal');
        const modalOverlay = modal?.querySelector('.modal-overlay');
        const submitBtn = document.getElementById('submitScoreButton');
        const playerNameInput = document.getElementById('playerNameInput');
        const modalScoreDisplay = document.getElementById('modalScoreDisplay');
        const saveBtn = document.getElementById('saveScoreButton');
        const cancelSaveBtn = document.getElementById('cancelSaveButton');
        const saveMessage = document.getElementById('saveMessage');

        // Helper to reset and hide modal
        const hideModal = () => {
            if (modal) {
                modal.classList.add('hidden');
                if (saveMessage) saveMessage.textContent = '';
                if (playerNameInput) playerNameInput.value = '';
            }
        };

        if (submitBtn && modal && playerNameInput && saveBtn && cancelSaveBtn) {
            // Show modal when clicking Submit Score
            submitBtn.onclick = () => {
                modal.classList.remove('hidden');
                modalScoreDisplay.textContent = this.score;
                const stored = localStorage.getItem('playerName') || '';
                playerNameInput.value = stored;
                playerNameInput.focus();
            };

            // Cancel/close modal
            cancelSaveBtn.onclick = hideModal;
            
            // Close modal when clicking overlay
            modalOverlay?.addEventListener('click', (e) => {
                if (e.target === modalOverlay) hideModal();
            });

            // Handle Enter key in input field
            playerNameInput.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    saveBtn.click();
                }
            };

            // Save score
            saveBtn.onclick = () => {
                const name = (playerNameInput.value || '').trim();
                if (!name) {
                    if (saveMessage) {
                        saveMessage.textContent = 'Please enter your name';
                        saveMessage.style.color = '#ff4444';
                    }
                    playerNameInput.classList.add('error');
                    playerNameInput.focus();
                    return;
                }
                
                // Clear error states
                playerNameInput.classList.remove('error');
                if (saveMessage) {
                    saveMessage.style.color = 'inherit';
                }
                
                // Disable buttons while saving
                saveBtn.disabled = true;
                cancelSaveBtn.disabled = true;
                if (saveMessage) {
                    saveMessage.textContent = 'Saving...';
                }
                
                // Store name for next time
                try { localStorage.setItem('playerName', name); } catch (e) {}

                fetch('/api/high-scores', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, score: this.score })
                })
                .then(res => {
                    if (!res.ok) throw new Error('Failed to save score');
                    return res.json();
                })
                .then(() => {
                    if (saveMessage) {
                        saveMessage.textContent = 'Score saved successfully!';
                        saveMessage.style.color = '#4CAF50';
                    }
                    // Redirect to leaderboard after a short delay
                    setTimeout(() => {
                        window.location.href = '/leaderboard';
                    }, 1000);
                })
                .catch(err => {
                    console.error(err);
                    if (saveMessage) {
                        saveMessage.textContent = 'Error saving score. Please try again.';
                        saveMessage.style.color = '#ff4444';
                    }
                    saveBtn.disabled = false;
                    cancelSaveBtn.disabled = false;
                });
            };
        }

        // Set up restart and menu buttons
        const restartBtn = document.getElementById('restartButton');
        const menuBtn = document.getElementById('menuButton');
        
        if (restartBtn) {
            restartBtn.onclick = () => {
                hideModal(); // Ensure modal is hidden when restarting
                this.restart();
            };
        }
        
        if (menuBtn) {
            menuBtn.onclick = () => window.location.href = '/';
        }
    }

    restart() {
        this.score = 0;
        this.balls = [];
        this.gameActive = true;
        this.currentBallType = 1;
        this.updateScoreDisplay();
        document.getElementById('gameOverlay').classList.add('hidden');
        this.createNextBall();
    }

    gameLoop() {
        this.updateGame();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
});