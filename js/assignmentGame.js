// Game state
let score = 0;
let ammo = 100;
let health = 100;
let level = 1;
let gameActive = true;
let enemies = [];
let bullets = [];
let gameLoopId;
let enemySpawner;

// Enemy settings by level
const levelSettings = [
    { spawnRate: 2000, minSpeed: 1, maxSpeed: 2, maxEnemies: 3 },
    { spawnRate: 1500, minSpeed: 1.5, maxSpeed: 2.5, maxEnemies: 4 },
    { spawnRate: 1000, minSpeed: 2, maxSpeed: 3, maxEnemies: 5 },
    { spawnRate: 800, minSpeed: 2.5, maxSpeed: 3.5, maxEnemies: 6 },
    { spawnRate: 600, minSpeed: 3, maxSpeed: 4, maxEnemies: 8 }
];

const backgrounds = [
    "/assets/assignment-9-assets/space1.jpg",
    "/assets/assignment-9-assets/space2.jpg",
    "/assets/assignment-9-assets/space3.jpg",
    "/assets/assignment-9-assets/space4.jpg",
    "/assets/assignment-9-assets/space5.jpg"
];

document.getElementById("scoreValue").innerText = score;
document.getElementById("ammoValue").innerText = ammo;
document.getElementById("healthFill").style.width = `${health}%`;

function setBackground(level) {
    const bg = document.getElementById("background");
    bg.style.backgroundImage = `url(${backgrounds[(level - 1) % backgrounds.length]})`;
}

setBackground(level);

const player = document.getElementById("player");
let playerX = window.innerWidth / 2;
let playerY = window.innerHeight - 80;
const playerWidth = 60;
const playerHeight = 60;
let moveSpeed = 5; // player speed

function updatePlayerPosition() {
    player.style.left = `${playerX - playerWidth/2}px`;
    player.style.top = `${playerY - playerHeight/2}px`;
}

updatePlayerPosition();

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

function gameLoop() {
    if (!gameActive) return;

    if (keys.ArrowLeft || keys.a) playerX -= moveSpeed;
    if (keys.ArrowRight || keys.d) playerX += moveSpeed;
    if (keys.ArrowUp || keys.w) playerY -= moveSpeed;
    if (keys.ArrowDown || keys.s) playerY += moveSpeed;

    playerX = Math.max(playerWidth/2, Math.min(playerX, window.innerWidth - playerWidth/2));
    playerY = Math.max(playerHeight/2, Math.min(playerY, window.innerHeight - playerHeight/2));

    updatePlayerPosition();

    requestAnimationFrame(gameLoop);
}

gameLoop();

function shootBullet() {
    const bullet = document.createElement("div");
    bullet.classList.add("bullet");

    const bulletX = playerX;
    const bulletY = playerY - playerHeight/2 - 15;

    bullet.style.left = `${bulletX - 4}px`;
    bullet.style.top = `${bulletY}px`;

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

    setTimeout(() => {
        if (bulletObj.active) {
            bullet.remove();
            bullets = bullets.filter(b => b !== bulletObj);
        }
    }, 2000);
}

function updateBullets() {
    bullets.forEach(bullet => {
        if (!bullet.active) return;

        bullet.y -= bullet.speed;
        bullet.element.style.top = `${bullet.y}px`;

        if (bullet.y + bullet.height < 0) {
            bullet.element.remove();
            bullet.active = false;
        }
    });

    bullets = bullets.filter(bullet => bullet.active);
}

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
    const enemySpeed = currentLevelSettings.minSpeed + Math.random() * (currentLevelSettings.maxSpeed - currentLevelSettings.minSpeed);

    const enemyObj = {
        element: enemy,
        x: enemyX,
        y: enemyY,
        width: enemyWidth,
        height: enemyHeight,
        speed: enemySpeed,
        health: enemyType === 'enemy1' ? 1 : 2, // enemy1 has 1 health, enemy2 has 2
        type: enemyType,
        active: true
    };

    enemies.push(enemyObj);
}

function startEnemySpawnLoop() {
    clearInterval(enemySpawner);
    const currentLevelSettings = levelSettings[level-1];
    enemySpawner = setInterval(() => {
        if (gameActive && enemies.length < currentLevelSettings.maxEnemies) {
            spawnEnemy();
        }
    }, currentLevelSettings.spawnRate);
}

function updateEnemies() {
    enemies.forEach(enemy => {
        if (!enemy.active) return;

        enemy.y += enemy.speed;
        enemy.element.style.top = `${enemy.y}px`;

        if (enemy.y - enemy.height > window.innerHeight) {
            enemy.element.remove();
            enemy.active = false;
        }

        if (checkCollision({x: playerX, y: playerY, width: playerWidth, height: playerHeight}, enemy)) {
            enemy.element.remove();
            enemy.active = false;
            updateHealth(-20);
        }

        bullets.forEach(bullet => {
            if (!bullet.active || !enemy.active) return;

            if (checkCollision(bullet, enemy)) {
                enemy.health--;
                bullet.active = false;
                bullet.element.remove();

                if (enemy.health <= 0) {
                    enemy.element.remove();
                    enemy.active = false;
                    updateScore(enemy.type === 'enemy1' ? 2 : 5);  // score for enemies
                }
            }
        });
    });

    enemies = enemies.filter(enemy => enemy.active);
}

function checkCollision(obj1, obj2) {
    return (
        obj1.x - obj1.width/2 < obj2.x + obj2.width/2 &&
        obj1.x + obj1.width/2 > obj2.x - obj2.width/2 &&
        obj1.y - obj1.height/2 < obj2.y + obj2.height/2 &&
        obj1.y + obj1.height/2 > obj2.y - obj2.height/2
    );
}

let lastAmmoBonusScore = 0; // used for keeping track of ammo boost

function updateScore(points) {
    score += points;
    document.getElementById("scoreValue").innerText = score;

    const ammoBonusThreshold = Math.floor(score / 50);
    const lastBonusThreshold = Math.floor(lastAmmoBonusScore / 50);

    if (ammoBonusThreshold > lastBonusThreshold) {
        ammo = Math.min(ammo + 50, 100);
        lastAmmoBonusScore = score;
        document.getElementById("ammoValue").innerText = ammo;
    }

    const newLevel = Math.min(Math.floor(score / 50) + 1, 5);
    if (newLevel !== level) {
        level = newLevel;
        setBackground(level);
        startEnemySpawnLoop();
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

function gameOver() {
    gameActive = false;
    cancelAnimationFrame(gameLoopId);
    clearInterval(enemySpawner);
    document.getElementById("finalScore").innerText = score;
    document.getElementById("gameOver").style.display = "flex";
}

document.getElementById("restartButton").addEventListener("click", () => {
    enemies.forEach(enemy => enemy.element.remove());
    bullets.forEach(bullet => bullet.element.remove());

    enemies = [];
    bullets = [];
    score = 0;
    ammo = 100;
    health = 100;
    level = 1;

    document.getElementById("scoreValue").innerText = score;
    document.getElementById("ammoValue").innerText = ammo;
    document.getElementById("healthFill").style.width = `${health}%`;
    document.getElementById("gameOver").style.display = "none";

    playerX = window.innerWidth / 2;
    playerY = window.innerHeight - 80;
    updatePlayerPosition();
    setBackground(level);

    gameActive = true;
    gameLoop();
    updateGame();
    startEnemySpawnLoop();
});

function updateGame() {
    if (!gameActive) return;

    updateBullets();
    updateEnemies();
    gameLoopId = requestAnimationFrame(updateGame);
}

updateGame();
startEnemySpawnLoop();

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