class Game {
    constructor() {
        this.score = 0;
        this.timeLeft = 60;
        this.isGameRunning = false;
        this.currentMiniGame = null;
        this.powerUps = {
            solar: true,
            wind: true
        };
        this.chillGuyClicks = 0;
        this.partyMode = false;
        this.activeClones = [];
        this.cloneInterval = null;
        this.sabotageTimeout = null;
        this.chillGuyCam = new ChillGuyCam(); // Initialize Chill Guy Cam
        
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        // Screens
        this.homeScreen = document.getElementById('home-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        
        // Buttons
        this.startButton = document.getElementById('start-button');
        this.restartButton = document.getElementById('restart-button');
        
        // Game elements
        this.scoreElement = document.getElementById('current-score');
        this.timerElement = document.getElementById('time-left');
        this.energyBar = document.getElementById('energy-bar');
        
        // Power-ups
        this.solarPowerUp = document.getElementById('solar-power');
        this.windPowerUp = document.getElementById('wind-power');
        
        // Party mode elements
        this.chillGuy = document.getElementById('chill-guy');
        this.partyOverlay = document.getElementById('party-overlay');
        this.partySound = document.getElementById('party-sound');
    }

    setupEventListeners() {
        this.startButton.addEventListener('click', () => this.startGame());
        this.restartButton.addEventListener('click', () => this.resetGame());
        
        this.solarPowerUp.addEventListener('click', () => this.activateSolarPowerUp());
        this.windPowerUp.addEventListener('click', () => this.activateWindPowerUp());
        
        // Add party mode click handler
        this.chillGuy.addEventListener('click', () => this.handleChillGuyClick());
    }

    startGame() {
        this.isGameRunning = true;
        this.switchScreen(this.gameScreen);
        this.startTimer();
        this.spawnMiniGame();
        this.startCloneChaos();
    }

    startCloneChaos() {
        // Spawn clones randomly every 5-15 seconds
        this.cloneInterval = setInterval(() => {
            if (Math.random() < 0.7) { // 70% chance to spawn a clone
                this.spawnClone();
            }
        }, Math.random() * 10000 + 5000);
    }

    spawnClone() {
        const clone = document.createElement('div');
        clone.className = 'clone-container';
        clone.innerHTML = `
            <div class="clone"></div>
            <div class="clone-message">Catch me if you can!</div>
        `;

        // Random position within game area
        const gameArea = document.getElementById('game-area');
        const rect = gameArea.getBoundingClientRect();
        
        clone.style.left = Math.random() * (rect.width - 100) + 'px';
        clone.style.top = Math.random() * (rect.height - 100) + 'px';

        // Add click handler
        let hits = 0;
        clone.addEventListener('click', () => this.hitClone(clone, hits++));

        // Start random movement
        this.moveCloneRandomly(clone);

        // Add to game area and active clones list
        gameArea.appendChild(clone);
        this.activeClones.push({
            element: clone,
            interval: setInterval(() => this.causeChaos(clone), 3000)
        });

        // Show warning
        this.showSabotageWarning();
    }

    moveCloneRandomly(clone) {
        const moveInterval = setInterval(() => {
            if (!this.isGameRunning) {
                clearInterval(moveInterval);
                return;
            }

            const gameArea = document.getElementById('game-area');
            const rect = gameArea.getBoundingClientRect();
            
            const newX = Math.random() * (rect.width - 100);
            const newY = Math.random() * (rect.height - 100);
            
            clone.style.transition = 'all 1s ease';
            clone.style.left = newX + 'px';
            clone.style.top = newY + 'px';
        }, 2000);
    }

    hitClone(clone, hits) {
        if (hits < 2) {
            clone.classList.add(`hit-${hits + 1}`);
            this.score += 5; // Bonus points for hitting clone
            this.updateScore();
        } else {
            // Remove clone
            clone.classList.add('disappearing');
            setTimeout(() => {
                const index = this.activeClones.findIndex(c => c.element === clone);
                if (index !== -1) {
                    clearInterval(this.activeClones[index].interval);
                    this.activeClones.splice(index, 1);
                }
                clone.remove();
            }, 500);
            this.score += 15; // Bonus points for defeating clone
            this.updateScore();
        }
    }

    causeChaos(clone) {
        if (!this.isGameRunning) return;

        const interference = document.createElement('div');
        interference.className = 'clone-interference';
        clone.appendChild(interference);
        setTimeout(() => interference.remove(), 1000);

        switch (this.currentMiniGame) {
            case 'lightSwitch':
                // Turn random lights back on
                const offLights = document.querySelectorAll('.light:not(.on)');
                if (offLights.length > 0) {
                    const light = offLights[Math.floor(Math.random() * offLights.length)];
                    light.classList.add('on');
                }
                break;
            case 'acControl':
                // Move the temperature slider
                const slider = document.querySelector('input[type="range"]');
                if (slider) {
                    slider.value = Math.min(100, parseInt(slider.value) + 20);
                    slider.dispatchEvent(new Event('input'));
                }
                break;
            case 'plugPull':
                // Plug things back in
                const unpluggedPlugs = document.querySelectorAll('.plug.unplugged');
                if (unpluggedPlugs.length > 0) {
                    const plug = unpluggedPlugs[Math.floor(Math.random() * unpluggedPlugs.length)];
                    plug.classList.remove('unplugged');
                }
                break;
        }
    }

    showSabotageWarning() {
        const warning = document.createElement('div');
        warning.className = 'sabotage-warning';
        warning.textContent = 'Clone Alert! Catch them quick!';
        document.getElementById('game-area').appendChild(warning);
        setTimeout(() => warning.remove(), 1000);
    }

    switchScreen(screen) {
        [this.homeScreen, this.gameScreen, this.gameOverScreen].forEach(s => {
            s.classList.remove('active');
        });
        screen.classList.add('active');
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimer();
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    updateTimer() {
        this.timerElement.textContent = this.timeLeft;
    }

    updateScore(points) {
        this.score += points;
        this.scoreElement.textContent = this.score;
        
        // Make Chill Guy react based on points
        if (points > 0) {
            this.chillGuyCam.cheer();
        } else if (points < 0) {
            this.chillGuyCam.cry();
        }
    }

    spawnMiniGame() {
        const games = ['lightSwitch', 'acControl', 'plugPull', 'solarPanel', 'batteryBoost'];
        const randomGame = games[Math.floor(Math.random() * games.length)];
        
        this.currentMiniGame = randomGame;
        this.createMiniGame(randomGame);
    }

    createMiniGame(type) {
        const gameArea = document.getElementById('game-area');
        gameArea.innerHTML = '';
        
        // Add game title
        const gameTitle = document.createElement('h2');
        gameTitle.style.textAlign = 'center';
        gameTitle.style.color = 'white';
        gameTitle.style.marginTop = '20px';
        gameTitle.style.fontFamily = "'Fredoka One', cursive";
        
        switch(type) {
            case 'lightSwitch':
                gameTitle.textContent = 'Light Switch Madness!';
                gameArea.appendChild(gameTitle);
                this.createLightSwitchGame(gameArea);
                break;
            case 'acControl':
                gameTitle.textContent = 'Chill the A/C!';
                gameArea.appendChild(gameTitle);
                this.createACControlGame(gameArea);
                break;
            case 'plugPull':
                gameTitle.textContent = 'Plug Pull Frenzy!';
                gameArea.appendChild(gameTitle);
                this.createPlugPullGame(gameArea);
                break;
            case 'solarPanel':
                gameTitle.textContent = 'Solar Panel Cleanup!';
                gameArea.appendChild(gameTitle);
                this.createSolarPanelGame(gameArea);
                break;
            case 'batteryBoost':
                gameTitle.textContent = 'Battery Boost Bonanza!';
                gameArea.appendChild(gameTitle);
                this.createBatteryBoostGame(gameArea);
                break;
        }
        
        // Add Chill Guy commentary
        this.addChillGuyComment(type);
    }

    addChillGuyComment(gameType) {
        const comments = {
            lightSwitch: "Bro, these lights are out of control! Click 'em off!",
            acControl: "It's getting too hot in here! Slide it down to chill!",
            plugPull: "Unplug everything before they explode, dude!",
            solarPanel: "These panels are filthy! Clean 'em up for maximum energy!",
            batteryBoost: "Time to charge it up! Smash that button like it's a dance party!"
        };
        
        const comment = document.createElement('div');
        comment.className = 'chill-guy-comment';
        comment.textContent = comments[gameType];
        comment.style.position = 'absolute';
        comment.style.bottom = '20px';
        comment.style.left = '50%';
        comment.style.transform = 'translateX(-50%)';
        comment.style.background = 'rgba(0, 0, 0, 0.8)';
        comment.style.color = 'white';
        comment.style.padding = '10px 20px';
        comment.style.borderRadius = '20px';
        comment.style.fontFamily = "'Fredoka One', cursive";
        
        document.getElementById('game-area').appendChild(comment);
    }

    createLightSwitchGame(container) {
        const gameContainer = document.createElement('div');
        gameContainer.className = 'light-switch-game';
        
        const lights = Array(6).fill(null).map(() => {
            const light = document.createElement('div');
            light.className = 'light on';
            light.addEventListener('click', () => {
                if (light.classList.contains('on')) {
                    light.classList.remove('on');
                    this.score += 10;
                    this.updateScore();
                    
                    // Check if all lights are off
                    const remainingLights = gameContainer.querySelectorAll('.light.on');
                    if (remainingLights.length === 0) {
                        setTimeout(() => this.spawnMiniGame(), 1000);
                    }
                }
            });
            return light;
        });
        
        lights.forEach(light => gameContainer.appendChild(light));
        container.appendChild(gameContainer);
    }

    createACControlGame(container) {
        const gameContainer = document.createElement('div');
        gameContainer.style.textAlign = 'center';
        gameContainer.style.padding = '40px';
        
        const thermometer = document.createElement('div');
        thermometer.style.fontSize = '72px';
        thermometer.textContent = '🌡️';
        gameContainer.appendChild(thermometer);
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '100';
        slider.value = '100';
        
        slider.addEventListener('input', () => {
            const value = parseInt(slider.value);
            thermometer.style.filter = `hue-rotate(${value * 2}deg)`;
            
            if (value < 30) {
                this.score += 15;
                this.updateScore();
                setTimeout(() => this.spawnMiniGame(), 1000);
            }
        });
        
        gameContainer.appendChild(slider);
        container.appendChild(gameContainer);
    }

    createPlugPullGame(container) {
        const gameContainer = document.createElement('div');
        gameContainer.className = 'plug-pull-game';
        
        const plugs = Array(8).fill(null).map(() => {
            const plug = document.createElement('div');
            plug.className = 'plug';
            plug.innerHTML = '🔌';
            plug.style.fontSize = '40px';
            plug.style.display = 'flex';
            plug.style.alignItems = 'center';
            plug.style.justifyContent = 'center';
            
            plug.addEventListener('click', () => {
                if (!plug.classList.contains('unplugged')) {
                    plug.classList.add('unplugged');
                    this.score += 5;
                    this.updateScore();
                    
                    // Check if all plugs are unplugged
                    const remainingPlugs = gameContainer.querySelectorAll('.plug:not(.unplugged)');
                    if (remainingPlugs.length === 0) {
                        setTimeout(() => this.spawnMiniGame(), 1000);
                    }
                }
            });
            return plug;
        });
        
        plugs.forEach(plug => gameContainer.appendChild(plug));
        container.appendChild(gameContainer);
    }

    createSolarPanelGame(container) {
        const gameContainer = document.createElement('div');
        gameContainer.className = 'solar-panel-game';
        
        const panels = Array(9).fill(null).map(() => {
            const panel = document.createElement('div');
            panel.className = 'solar-panel dirty';
            
            panel.addEventListener('click', () => {
                if (panel.classList.contains('dirty')) {
                    panel.classList.remove('dirty');
                    this.score += 20;
                    this.updateScore();
                    
                    // Add clean effect
                    const effect = document.createElement('div');
                    effect.className = 'clean-effect';
                    effect.textContent = '✨';
                    effect.style.left = '50%';
                    effect.style.top = '50%';
                    panel.appendChild(effect);
                    setTimeout(() => effect.remove(), 500);
                    
                    // Check if all panels are clean
                    const dirtyPanels = gameContainer.querySelectorAll('.solar-panel.dirty');
                    if (dirtyPanels.length === 0) {
                        setTimeout(() => this.spawnMiniGame(), 1000);
                    }
                }
            });
            
            return panel;
        });
        
        panels.forEach(panel => gameContainer.appendChild(panel));
        container.appendChild(gameContainer);
    }

    createBatteryBoostGame(container) {
        const gameContainer = document.createElement('div');
        gameContainer.className = 'battery-boost-game';
        
        // Create battery display
        const batteryContainer = document.createElement('div');
        batteryContainer.className = 'battery-container';
        const batteryLevel = document.createElement('div');
        batteryLevel.className = 'battery-level';
        batteryContainer.appendChild(batteryLevel);
        
        // Create percentage display
        const percentage = document.createElement('div');
        percentage.className = 'battery-percentage';
        percentage.textContent = '0%';
        
        // Create charge button
        const chargeButton = document.createElement('button');
        chargeButton.className = 'charge-button';
        chargeButton.textContent = '⚡ CHARGE! ⚡';
        
        let currentCharge = 0;
        let clickCount = 0;
        let combo = 0;
        let lastClickTime = 0;
        
        chargeButton.addEventListener('click', () => {
            const now = Date.now();
            const timeDiff = now - lastClickTime;
            
            // Check for combo (clicks within 500ms)
            if (timeDiff < 500) {
                combo++;
            } else {
                combo = 0;
            }
            lastClickTime = now;
            
            // Calculate charge increase based on combo
            const chargeIncrease = Math.min(5 * (1 + combo * 0.5), 20);
            currentCharge = Math.min(currentCharge + chargeIncrease, 100);
            
            // Update visuals
            batteryLevel.style.width = currentCharge + '%';
            percentage.textContent = Math.floor(currentCharge) + '%';
            
            // Add spark effect
            const spark = document.createElement('div');
            spark.className = 'energy-spark';
            spark.textContent = '⚡';
            spark.style.setProperty('--fly-x', (Math.random() * 200 - 100) + 'px');
            spark.style.setProperty('--fly-y', (Math.random() * -100 - 50) + 'px');
            chargeButton.appendChild(spark);
            setTimeout(() => spark.remove(), 1000);
            
            // Show combo multiplier
            if (combo > 0) {
                const multiplier = document.createElement('div');
                multiplier.className = 'boost-multiplier';
                multiplier.textContent = `x${combo + 1}`;
                batteryContainer.appendChild(multiplier);
                setTimeout(() => multiplier.remove(), 500);
            }
            
            // Add score based on combo
            this.score += 10 * (1 + combo * 0.5);
            this.updateScore();
            
            // Check for completion
            if (currentCharge >= 100) {
                setTimeout(() => this.spawnMiniGame(), 1000);
            }
            
            clickCount++;
        });
        
        gameContainer.appendChild(batteryContainer);
        gameContainer.appendChild(percentage);
        gameContainer.appendChild(chargeButton);
        container.appendChild(gameContainer);
    }

    activateSolarPowerUp() {
        if (this.powerUps.solar) {
            clearInterval(this.timerInterval);
            setTimeout(() => this.startTimer(), 5000);
            this.powerUps.solar = false;
            this.solarPowerUp.disabled = true;
        }
    }

    activateWindPowerUp() {
        if (this.powerUps.wind) {
            this.score += 50;
            this.updateScore();
            this.spawnMiniGame();
            this.powerUps.wind = false;
            this.windPowerUp.disabled = true;
        }
    }

    handleChillGuyClick() {
        this.chillGuyClicks++;
        
        if (this.chillGuyClicks >= 5 && !this.partyMode) {
            this.activatePartyMode();
        }
    }

    activatePartyMode() {
        this.partyMode = true;
        this.partyOverlay.classList.remove('hidden');
        this.chillGuy.classList.add('party');
        
        // Play the party sound
        this.partySound.currentTime = 0;
        this.partySound.play();
        
        // Add bonus points
        this.score += 100;
        this.updateScore();
        
        // Party mode lasts for 10 seconds
        setTimeout(() => {
            this.deactivatePartyMode();
        }, 10000);
    }

    deactivatePartyMode() {
        this.partyMode = false;
        this.partyOverlay.classList.add('hidden');
        this.chillGuy.classList.remove('party');
        this.chillGuyClicks = 0;
    }

    resetGame() {
        this.score = 0;
        this.timeLeft = 60;
        this.isGameRunning = false;
        this.updateScore();
        this.updateTimer();
        this.switchScreen(this.homeScreen);
        this.powerUps = { solar: true, wind: true };
        this.chillGuyClicks = 0;
        this.deactivatePartyMode();
        
        // Clear clone chaos
        clearInterval(this.cloneInterval);
        this.activeClones.forEach(clone => {
            clearInterval(clone.interval);
            clone.element.remove();
        });
        this.activeClones = [];
    }

    endGame() {
        clearInterval(this.timerInterval);
        this.isGameRunning = false;
        this.updateLeaderboard();
        this.switchScreen(this.gameOverScreen);
        
        // Clear clone chaos
        clearInterval(this.cloneInterval);
        this.activeClones.forEach(clone => {
            clearInterval(clone.interval);
            clone.element.remove();
        });
        this.activeClones = [];
    }

    updateLeaderboard() {
        const leaderboard = document.getElementById('leaderboard-list');
        const finalScore = document.getElementById('final-score');
        
        finalScore.textContent = `Final Score: ${this.score}`;
        
        // In a real implementation, this would interact with a backend
        const mockScores = [
            { name: "CHI", score: 1000 },
            { name: "ZEN", score: 800 },
            { name: "BRO", score: 600 }
        ];
        
        leaderboard.innerHTML = mockScores
            .map(entry => `<li>${entry.name}: ${entry.score}</li>`)
            .join('');
    }
}

class ChillGuyCam {
    constructor() {
        this.avatar = document.querySelector('.chill-guy-avatar');
        this.reactions = ['cheering', 'crying', 'dancing'];
        this.currentReaction = null;
        this.danceTimer = null;
        this.setupRandomDances();
    }

    setupRandomDances() {
        // Random dance intervals between 10-30 seconds when bored
        setInterval(() => {
            if (!this.currentReaction) {
                const shouldDance = Math.random() < 0.3; // 30% chance to dance
                if (shouldDance) {
                    this.react('dancing', '🕺');
                    setTimeout(() => this.resetReaction(), 3000);
                }
            }
        }, 10000 + Math.random() * 20000);
    }

    react(reaction, emoji = null) {
        if (this.currentReaction) {
            this.avatar.classList.remove(this.currentReaction);
        }

        this.currentReaction = reaction;
        this.avatar.classList.add(reaction);

        if (emoji) {
            this.avatar.textContent = emoji;
        }

        // Add floating reaction text
        const reactionText = document.createElement('div');
        reactionText.className = 'reaction-effect';
        
        switch(reaction) {
            case 'cheering':
                reactionText.textContent = '🎉 AWESOME!';
                break;
            case 'crying':
                reactionText.textContent = '😭 OH NO!';
                break;
            case 'dancing':
                reactionText.textContent = '💃 VIBING!';
                break;
        }

        document.querySelector('.chill-guy-cam').appendChild(reactionText);
        setTimeout(() => reactionText.remove(), 1000);
    }

    resetReaction() {
        if (this.currentReaction) {
            this.avatar.classList.remove(this.currentReaction);
            this.currentReaction = null;
            this.avatar.textContent = '😎';
        }
    }

    cheer() {
        this.react('cheering', '🥳');
        setTimeout(() => this.resetReaction(), 2000);
    }

    cry() {
        this.react('crying', '😭');
        setTimeout(() => this.resetReaction(), 2000);
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    const game = new Game();
});
