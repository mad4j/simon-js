class SimonGame {
    constructor() {
        this.sequence = [];
        this.playerSequence = [];
        this.score = 0;
        this.isPlaying = false;
        this.isShowingSequence = false;
        this.currentStep = 0;
        this.sounds = {};
        this.gameState = 'waiting';
        
        this.colors = ['green', 'red', 'yellow', 'blue'];
        this.frequencies = {
            green: 329.63,
            red: 261.63,
            yellow: 220,
            blue: 196
        };
        
        this.initializeElements();
        this.initializeSounds();
        this.bindEvents();
        this.registerServiceWorker();
        this.updateCenterButton();
    }
    
    initializeElements() {
        this.buttons = document.querySelectorAll('.simon-button');
        this.startBtn = document.getElementById('startBtn');
        this.scoreDisplay = document.getElementById('score');
    }
    
    initializeSounds() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    playSound(color, duration = 300) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = this.frequencies[color];
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration / 1000);
    }
    
    bindEvents() {
        this.startBtn.addEventListener('click', () => this.restartGame());
        
        this.buttons.forEach(button => {
            button.addEventListener('click', (e) => this.handleButtonClick(e));
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleButtonClick(e);
            }, { passive: false });
        });
        
        // Previeni il comportamento di default del touch - modificato per non interferire con lo scroll
        document.addEventListener('touchmove', (e) => {
            if (e.target.closest('.simon-button') || e.target.closest('.center-button')) {
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    updateCenterButton() {
        const currentMoves = this.sequence.length;
        const moveNumber = currentMoves.toString().padStart(2, '0');
        
        this.startBtn.textContent = moveNumber;
        
        this.startBtn.classList.remove('waiting', 'playing', 'showing', 'game-over');
        this.startBtn.classList.add(this.gameState);
    }
    
    setGameState(state) {
        this.gameState = state;
        this.updateCenterButton();
    }
    
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('sw.js');
                console.log('Service Worker registrato con successo');
            } catch (error) {
                console.log('Registrazione Service Worker fallita:', error);
            }
        }
    }
    
    restartGame() {
        this.sequence = [];
        this.playerSequence = [];
        this.score = 0;
        this.currentStep = 0;
        this.isPlaying = true;
        this.isShowingSequence = false;
        
        this.setGameState('playing');
        this.addToSequence();
    }
    
    addToSequence() {
        const randomColor = this.colors[Math.floor(Math.random() * this.colors.length)];
        this.sequence.push(randomColor);
        this.playerSequence = [];
        this.currentStep = 0;
        this.updateCenterButton();
        this.showSequence();
    }
    
    async showSequence() {
        this.isShowingSequence = true;
        this.setGameState('showing');
        this.disableButtons();
        
        await this.delay(500);
        
        for (let i = 0; i < this.sequence.length; i++) {
            await this.delay(200);
            this.highlightButton(this.sequence[i]);
            await this.delay(600);
        }
        
        this.isShowingSequence = false;
        this.setGameState('playing');
        this.enableButtons();
    }
    
    highlightButton(color) {
        const button = document.querySelector(`[data-color="${color}"]`);
        button.classList.add('active');
        this.playSound(color);
        
        setTimeout(() => {
            button.classList.remove('active');
        }, 400);
    }
    
    handleButtonClick(e) {
        if (!this.isPlaying || this.isShowingSequence) return;
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        const color = e.target.dataset.color;
        this.playerSequence.push(color);
        this.highlightButton(color);
        
        if (this.playerSequence[this.currentStep] !== this.sequence[this.currentStep]) {
            this.gameOver();
            return;
        }
        
        this.currentStep++;
        
        if (this.currentStep === this.sequence.length) {
            this.score++;
            
            setTimeout(() => {
                this.addToSequence();
            }, 1000);
        }
    }
    
    gameOver() {
        this.isPlaying = false;
        this.setGameState('game-over');
        this.playErrorSound();
        this.disableButtons();
        
        this.buttons.forEach(button => {
            button.style.filter = 'brightness(0.5)';
            setTimeout(() => {
                button.style.filter = '';
            }, 500);
        });
        
        setTimeout(() => {
            this.setGameState('waiting');
        }, 3000);
    }
    
    playErrorSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = 150;
        oscillator.type = 'sawtooth';
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
    
    enableButtons() {
        this.buttons.forEach(button => {
            button.classList.remove('disabled');
        });
    }
    
    disableButtons() {
        this.buttons.forEach(button => {
            button.classList.add('disabled');
        });
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Inizializzazione del gioco
document.addEventListener('DOMContentLoaded', () => {
    const game = new SimonGame();
});

// Check per modalità PWA
if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('App in modalità PWA');
}