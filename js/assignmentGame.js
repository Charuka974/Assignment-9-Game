    // Game state
    let score = 0;
    let ammo = 100;
    let health = 100;
    let level = 1;
    let gameActive = true;
    let enemies = [];
    let bullets = [];

    // Enemy settings by level
    const levelSettings = [
        { spawnRate: 2000, minSpeed: 1, maxSpeed: 2, maxEnemies: 3 },  // Level 1
        { spawnRate: 1500, minSpeed: 1.5, maxSpeed: 2.5, maxEnemies: 4 },  // Level 2
        { spawnRate: 1000, minSpeed: 2, maxSpeed: 3, maxEnemies: 5 },  // Level 3
        { spawnRate: 800, minSpeed: 2.5, maxSpeed: 3.5, maxEnemies: 6 },  // Level 4
        { spawnRate: 600, minSpeed: 3, maxSpeed: 4, maxEnemies: 8 }   // Level 5
    ];

    // Background images
    const backgrounds = [
        "/assets/assignment-9-assets/space1.jpg",
        "/assets/assignment-9-assets/space2.jpg",
        "/assets/assignment-9-assets/space3.jpg",
        "/assets/assignment-9-assets/space4.jpg",
        "/assets/assignment-9-assets/space5.jpg"
    ];

    // Set initial values in the HUD
    document.getElementById("scoreValue").innerText = score;
    document.getElementById("ammoValue").innerText = ammo;
    document.getElementById("healthFill").style.width = `${health}%`;

    // Set background image for the level
    function setBackground(level) {
        const bg = document.getElementById("background");
        bg.style.backgroundImage = `url(${backgrounds[(level - 1) % backgrounds.length]})`;
    }

    setBackground(level);

    // Player movement and positioning
    const player = document.getElementById("player");
    let playerX = window.innerWidth / 2;
    let playerY = window.innerHeight - 80;
    const playerWidth = 60;
    const playerHeight = 60;
    let moveSpeed = 5;

    // Update player position function
    function updatePlayerPosition() {
        player.style.left = `${playerX - playerWidth/2}px`;
        player.style.top = `${playerY - playerHeight/2}px`;
    }

    // Initialize player position
    updatePlayerPosition();

    // Controls: Arrow keys or WASD to move player
    const keys = {
        ArrowLeft: false,
        ArrowRight: false,
        ArrowUp: false,
        ArrowDown: false,
        a: false,
        d: false,
        w: false,
        s: false
    };

    document.addEventListener("keydown", (e) => {
        if (!gameActive) return;
        
        if (e.key in keys) {
            keys[e.key] = true;
            e.preventDefault();
        }
        
        // Spacebar to shoot
        if (e.key === " " && ammo > 0) {
            shootBullet();
            ammo -= 1;
            document.getElementById("ammoValue").innerText = ammo;
            e.preventDefault();
        }
    });

    document.addEventListener("keyup", (e) => {
        if (e.key in keys) {
            keys[e.key] = false;
            e.preventDefault();
        }
    });

    // Game loop for smooth movement
    function gameLoop() {
        if (!gameActive) return;

        // Handle player movement
        if (keys.ArrowLeft || keys.a) playerX -= moveSpeed;
        if (keys.ArrowRight || keys.d) playerX += moveSpeed;
        if (keys.ArrowUp || keys.w) playerY -= moveSpeed;
        if (keys.ArrowDown || keys.s) playerY += moveSpeed;

        // Ensure player stays within bounds of the screen
        playerX = Math.max(playerWidth/2, Math.min(playerX, window.innerWidth - playerWidth/2));
        playerY = Math.max(playerHeight/2, Math.min(playerY, window.innerHeight - playerHeight/2));

        updatePlayerPosition();

        requestAnimationFrame(gameLoop);
    }

    gameLoop();

    function shootBullet() {
        const bullet = document.createElement("div");
        bullet.classList.add("bullet");

        // Set bullet initial position (centered above the player)
        const bulletX = playerX;
        const bulletY = playerY - playerHeight/2 - 15;
        
        bullet.style.left = `${bulletX - 4}px`;
        bullet.style.top = `${bulletY}px`;

        // Append bullet to game container
        document.getElementById("gameContainer").appendChild(bullet);

        const bulletObj = {
            element: bullet,
            x: bulletX,
            y: bulletY,
            width: 8,
            height: 30,
            speed: 15,
            active: true
        };

        bullets.push(bulletObj);

        // Remove bullet when it's out of view
        setTimeout(() => {
            if (bulletObj.active) {
                bullet.remove();
                bullets = bullets.filter(b => b !== bulletObj);
            }
        }, 2000);
    }

    // Update bullet positions
    function updateBullets() {
        bullets.forEach(bullet => {
            if (!bullet.active) return;
            
            bullet.y -= bullet.speed;
            bullet.element.style.top = `${bullet.y}px`;

            // Remove if off screen
            if (bullet.y + bullet.height < 0) {
                bullet.element.remove();
                bullet.active = false;
            }
        });

        // Clean up inactive bullets
        bullets = bullets.filter(bullet => bullet.active);
    }

    // Function to generate enemies
    function spawnEnemy() {
        if (!gameActive || enemies.length >= levelSettings[level-1].maxEnemies) return;
        
        const enemyType = Math.random() < 0.5 ? 'enemy1' : 'enemy2';
        const enemy = document.createElement("div");
        enemy.classList.add("enemy", enemyType);

        const enemyWidth = 60;
        const enemyHeight = 60;
        const enemyX = Math.random() * (window.innerWidth - enemyWidth) + enemyWidth/2;
        const enemyY = -enemyHeight;

        enemy.style.left = `${enemyX - enemyWidth/2}px`;
        enemy.style.top = `${enemyY}px`;

        document.getElementById("gameContainer").appendChild(enemy);

        const currentLevelSettings = levelSettings[level-1];
        const enemySpeed = currentLevelSettings.minSpeed + 
                         Math.random() * (currentLevelSettings.maxSpeed - currentLevelSettings.minSpeed);

        const enemyObj = {
            element: enemy,
            x: enemyX,
            y: enemyY,
            width: enemyWidth,
            height: enemyHeight,
            speed: enemySpeed,
            health: enemyType === 'enemy1' ? 1 : 2,
            type: enemyType,
            active: true
        };

        enemies.push(enemyObj);
    }

    // Spawn enemies at intervals based on level
    function spawnEnemies() {
        if (!gameActive) return;
        
        spawnEnemy();
        const currentLevelSettings = levelSettings[level-1];
        const spawnDelay = currentLevelSettings.spawnRate;
        setTimeout(spawnEnemies, spawnDelay);
    }

    // Update enemy positions and check collisions
    function updateEnemies() {
        enemies.forEach(enemy => {
            if (!enemy.active) return;
            
            enemy.y += enemy.speed;
            enemy.element.style.top = `${enemy.y}px`;

            // Check if enemy is off screen
            if (enemy.y - enemy.height > window.innerHeight) {
                enemy.element.remove();
                enemy.active = false;
            }

            // Check collision with player
            if (checkCollision(
                {x: playerX, y: playerY, width: playerWidth, height: playerHeight},
                enemy
            )) {
                enemy.element.remove();
                enemy.active = false;
                updateHealth(-20);
            }

            // Check collision with bullets
            bullets.forEach(bullet => {
                if (!bullet.active || !enemy.active) return;
                
                if (checkCollision(bullet, enemy)) {
                    // Bullet hit the enemy
                    enemy.health--;
                    bullet.active = false;
                    bullet.element.remove();
                    
                    if (enemy.health <= 0) {
                        enemy.element.remove();
                        enemy.active = false;
                        updateScore(enemy.type === 'enemy1' ? 10 : 20); // score for shooting enemy
                    }
                }
            });
        });

        // Clean up inactive enemies
        enemies = enemies.filter(enemy => enemy.active);
    }

    // Check collision between two objects
    function checkCollision(obj1, obj2) {
        return (
            obj1.x - obj1.width/2 < obj2.x + obj2.width/2 &&
            obj1.x + obj1.width/2 > obj2.x - obj2.width/2 &&
            obj1.y - obj1.height/2 < obj2.y + obj2.height/2 &&
            obj1.y + obj1.height/2 > obj2.y - obj2.height/2
        );
    }

    // Update score to handle level changes
    function updateScore(points) {
        score += points;
        document.getElementById("scoreValue").innerText = score;

        // Every 100 points, refill ammo
        if (score % 100 === 0) {
            ammo = Math.min(ammo + 50, 100);
            document.getElementById("ammoValue").innerText = ammo;
        }

        // Change level based on the score
        const newLevel = Math.min(Math.floor(score / 50) + 1, 5);
        if (newLevel !== level) {
            level = newLevel;
            setBackground(level);
        }
    }

    function updateHealth(amount) {
        health += amount;
        if (health > 100) health = 100;
        if (health <= 0) {
            health = 0;
            gameOver();
        }
        document.getElementById("healthFill").style.width = `${health}%`;
    }

    // Game over function
    function gameOver() {
        gameActive = false;
        document.getElementById("finalScore").innerText = score;
        document.getElementById("gameOver").style.display = "flex";
    }

    // Restart game
    document.getElementById("restartButton").addEventListener("click", () => {
        // Remove all enemies and bullets
        enemies.forEach(enemy => enemy.element.remove());
        bullets.forEach(bullet => bullet.element.remove());
        
        // Reset game state
        enemies = [];
        bullets = [];
        score = 0;
        ammo = 100;
        health = 100;
        level = 1;
        
        // Update UI
        document.getElementById("scoreValue").innerText = score;
        document.getElementById("ammoValue").innerText = ammo;
        document.getElementById("healthFill").style.width = `${health}%`;
        document.getElementById("gameOver").style.display = "none";
        
        // Reset player position
        playerX = window.innerWidth / 2;
        playerY = window.innerHeight - 80;
        updatePlayerPosition();
        
        // Set background
        setBackground(level);
        
        // Start game
        gameActive = true;
        gameLoop();
        spawnEnemies();
    });

    // Main game update loop
    function updateGame() {
        if (!gameActive) return;
        
        updateBullets();
        updateEnemies();
        requestAnimationFrame(updateGame);
    }

    // Start game loops
    gameLoop();
    updateGame();
    spawnEnemies();

    // Redraw background when the window is resized
    window.addEventListener("resize", () => {
        setBackground(level);
        updatePlayerPosition();
    });

    // Mobile Controls Implementation
    const joystick = document.getElementById("joystick");
    const joystickWrapper = document.getElementById("joystick-wrapper");
    const shootButton = document.getElementById("shootButton");
    
    let joystickActive = false;
    let joystickOrigin = { x: 0, y: 0 };
    let joystickPosition = { x: 0, y: 0 };
    const joystickMaxDistance = 40;
    
    // Set up joystick event listeners
    joystickWrapper.addEventListener("touchstart", handleJoystickStart);
    joystickWrapper.addEventListener("touchmove", handleJoystickMove);
    joystickWrapper.addEventListener("touchend", handleJoystickEnd);
    
    joystickWrapper.addEventListener("mousedown", handleJoystickStart);
    document.addEventListener("mousemove", handleJoystickMove);
    document.addEventListener("mouseup", handleJoystickEnd);
    
    // Set up shoot button event listeners
    shootButton.addEventListener("touchstart", handleShootStart);
    shootButton.addEventListener("touchend", handleShootEnd);
    shootButton.addEventListener("mousedown", handleShootStart);
    shootButton.addEventListener("mouseup", handleShootEnd);
    
    function handleJoystickStart(e) {
        if (!gameActive) return;
        
        joystickActive = true;
        const rect = joystickWrapper.getBoundingClientRect();
        joystickOrigin.x = rect.left + rect.width / 2;
        joystickOrigin.y = rect.top + rect.height / 2;
        
        // For touch events
        if (e.touches) {
            const touch = e.touches[0];
            joystickPosition.x = touch.clientX;
            joystickPosition.y = touch.clientY;
        } else {
            // For mouse events
            joystickPosition.x = e.clientX;
            joystickPosition.y = e.clientY;
        }
        
        updateJoystickPosition();
    }
    
    function handleJoystickMove(e) {
        if (!joystickActive || !gameActive) return;
        
        if (e.touches) {
            const touch = e.touches[0];
            joystickPosition.x = touch.clientX;
            joystickPosition.y = touch.clientY;
        } else {
            joystickPosition.x = e.clientX;
            joystickPosition.y = e.clientY;
        }
        
        updateJoystickPosition();
    }
    
    function handleJoystickEnd() {
        joystickActive = false;
        joystick.style.transform = "translate(0, 0)";
    }
    
    function updateJoystickPosition() {
        const dx = joystickPosition.x - joystickOrigin.x;
        const dy = joystickPosition.y - joystickOrigin.y;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        const limitedDistance = Math.min(distance, joystickMaxDistance);
        
        const moveX = Math.cos(angle) * limitedDistance;
        const moveY = Math.sin(angle) * limitedDistance;
        
        joystick.style.transform = `translate(${moveX}px, ${moveY}px)`;
        
        // Update player movement based on joystick position
        const normalizedX = moveX / joystickMaxDistance;
        const normalizedY = moveY / joystickMaxDistance;
        
        // Apply movement to player
        playerX += normalizedX * moveSpeed;
        playerY += normalizedY * moveSpeed;
        
        // Ensure player stays within bounds
        playerX = Math.max(playerWidth/2, Math.min(playerX, window.innerWidth - playerWidth/2));
        playerY = Math.max(playerHeight/2, Math.min(playerY, window.innerHeight - playerHeight/2));
        
        updatePlayerPosition();
    }
    
    function handleShootStart(e) {
        if (!gameActive) return;
        e.preventDefault(); // Prevent touch events from causing page scroll
        
        if (ammo > 0) {
            shootBullet();
            ammo -= 1;
            document.getElementById("ammoValue").innerText = ammo;
        }
    }
    
    function handleShootEnd(e) {
        e.preventDefault();
    }
    
    // Detect if the device is touch capable
    function isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
    }
    
    // Show controls only on touch devices
    if (isTouchDevice()) {
        document.getElementById("controls").style.display = "flex";
    }