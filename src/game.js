const gameCanvas = document.getElementById("gameCanvas");
const gameCanvasContext = gameCanvas.getContext("2d");
const scoreText = document.getElementById("score");
const highscoreText = document.getElementById("highscore");
const soundToggleBtn = document.getElementById("soundToggleBtn");
const lifesElements = [
    document.getElementById("life1"),
    document.getElementById("life2"),
    document.getElementById("life3")
];
const playOverlay = document.getElementById("playOverlay");
const pauseOverlay = document.getElementById("pauseOverlay");
const gameOverOverlay = document.getElementById("gameOverOverlay");

const fps = 60;
let frameCount = 0;

let gameState = "menu"; // game, gameover, pause
let soundFX;
let score = 0, highscore = 0;
let inputs = { left: false, right: false, up: false, fire: false, pause: { pressed: false, down: false } };
let inputHorizontal = 0, inputVertical = 0;
let bgStars = [];
let ship;
let rockets = [];
let rocketShootCooldown = 0, rocketShootDelay = 15;
let maxAsteroids = 5;
let asteroidSpawnCooldown = 0, asteroidSpawnDelay = 60;
let asteroidStartSize = 60;
let explosions = [];
let ufoSize = 4;
let ufoSpawnCooldown = 0, ufoSpawnDelayMin = fps * 20, ufoSpawnDelayMax = fps * 60;
let enemies = [];
let numUFOs = 0;
let numAsteroids = 0;
let lifes = 3;

const loadHighscore = () => {
    highscore = localStorage.getItem("highscore") || 0;
    highscoreText.innerHTML = highscore;
};

const updateHighscore = () => {
    if (score > highscore) {
        highscore = score;
        localStorage.setItem("highscore", highscore);
        highscoreText.innerHTML = highscore;
    }
};

const toggleSound = () => {
    soundFX.toggleSound();
    soundToggleBtn.className = (soundFX.soundOn ? "soundOn" : "soundOff");
};

const addScore = (scoreToAdd) => {
    score += scoreToAdd;
    updateScoreDisplay();
};

const updateScoreDisplay = () => {
    scoreText.innerHTML = score;
};

const updateLifesDisplay = () => {
    if (lifes >= 0) {
        for (let i = 0; i < 3; i++) {
            if (i < lifes) {
                lifesElements[i].style.display = "inline";
            } else {
                lifesElements[i].style.display = "none";
            }
        }
    }
};

const initInput = () => {
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("keyup", handleKeyup);
};

const initSoundFX = () => {
    soundFX = new SoundFX();
    soundFX.loadSFXClips({
        pauseIn: "assets/pause_in.mp3",
        pauseOut: "assets/pause_out.mp3",
        coin: "assets/coin.mp3",
        shoot: "assets/shoot.mp3",
        ufoShoot: "assets/shoot.mp3",
        shipExplosion: "assets/ship_explosion.mp3",
        ufoExplosion: "assets/ufo_explosion.mp3",
        asteroidExplosion: "assets/asteroid_explosion.mp3",
        gameOver: "assets/gameover_2.mp3",
        // ufoFlying: "assets/ufo_flying_2.wav",
    });
};

const initGame = () => {
    loadHighscore();
    initBackgroundStars();
    initInput();
    initSoundFX();
    ship = new Ship(gameCanvas.width / 2, gameCanvas.height / 2, true);
    setInterval(gameLoop, 1000 / fps);
};

const startGame = () => {
    ship.reset();
    ship.beInvincible();

    ufoSpawnCooldown = frameCount + (ufoSpawnDelayMin + Math.random() * ufoSpawnDelayMax);

    score = 0;
    updateScoreDisplay();
    
    lifes = 3;
    updateLifesDisplay();

    gameState = "game";

    soundFX.playSound("coin");
};

const togglePause = () => {
    if (gameState === "game") {
        gameState = "pause";
        pauseOverlay.style.display = "flex";
        soundFX.playSound("pauseIn");
    } else if (gameState === "pause") {
        gameState = "game";
        pauseOverlay.style.display = "none";
        soundFX.playSound("pauseOut");
    }
};

const gameLoop = () => {   
    handleGamepadInput();
    calculateMovementInputs();

    if (inputs.pause.down) { togglePause(); }
    
    if (gameState !== "pause") {
        frameCount++;

        updateGame();
        drawGame();
        updateHighscore();
    }

    resetFrameInputs();
};

const updateGame = () => {
    if (gameState === "menu") {
        if (inputs.fire) {
            startGame();
            document.getElementById("playOverlay").style.display = "none";
            return;
        }
    }

    // remove dead objects
    rockets = rockets.filter(r => r.isAlive());
    enemies = enemies.filter(d => d.isAlive());
    explosions = explosions.filter(e => e.isAlive());

    numAsteroids = enemies.filter(d => d instanceof Asteroid).length;
    numUFOs = enemies.filter(d => d instanceof UFO).length;

    for (let d of enemies) {
        d.update();

        if (ship.canBeHit() && checkCollision(ship.position.x, ship.position.y, ship.collisionRadius, d.position.x, d.position.y, d.collisionRadius)) {
            shipDied();
        }
    }

    for (let r of rockets) {
        r.update();

        // check for collisions with enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            let d = enemies[i];
            if (checkCollision(r.position.x, r.position.y, r.collisionRadius, d.position.x, d.position.y, d.collisionRadius)) {
                r.destroy();
                d.hit();
                addScore(d.hitScore);

                // we destroyed the target, spawn a huuuuge explosion
                if (!d.isAlive()) {
                    const explosion = new ParticleSystem(d.position.x, d.position.y);
                    for (let i = 0; i < 10; i++) {
                        explosion.addParticle(new ExplosionParticle("white"));
                    }
                    explosions.push(explosion);

                    if (d.explosionSound) {
                        soundFX.playSound(d.explosionSound);
                    } else {
                        soundFX.playSound("asteroidExplosion");
                    }
                }
            }
        }
    }

    for (let e of explosions) {
        e.update();
    }

    ship.move(inputHorizontal, inputVertical);
    ship.update();

    if (!ship.disabled && !ship.dead && inputs.fire && frameCount > rocketShootCooldown) {
        inputs.fire = false;
        rocketShootCooldown = frameCount + rocketShootDelay;

        let newRocket = ship.shootRocket();
        rockets.push(newRocket);

        soundFX.playSound("shoot");
    }

    if (numAsteroids < maxAsteroids && frameCount > asteroidSpawnCooldown) {
        spawnAsteroid();
        asteroidSpawnCooldown = frameCount + asteroidSpawnDelay;
    }

    if (gameState === "game" && numUFOs === 0 && frameCount > ufoSpawnCooldown) {
        spawnUFO();
        ufoSpawnCooldown = frameCount + (ufoSpawnDelayMin + Math.random() * ufoSpawnDelayMax);
    }
};

const drawGame = () => {
    gameCanvasContext.fillStyle = "black";
    gameCanvasContext.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

    drawBackgroundStars(gameCanvasContext);

    for (let r of rockets) {
        r.draw(gameCanvasContext);
    }

    for (let d of enemies) {
        d.draw(gameCanvasContext);
    }

    ship.draw(gameCanvasContext);

    for (let e of explosions) {
        e.draw(gameCanvasContext);
    }
};

const handleKeydown = (event) => {
    const keyCode = event.code;

    if (keyCode === "KeyA" || keyCode === "ArrowLeft") {
        inputs.left = true;
    } else if (keyCode === "KeyD" || keyCode === "ArrowRight") {
        inputs.right = true;
    }

    if (keyCode === "KeyW" || keyCode === "ArrowUp") {
        inputs.up = true;
    }

    if (keyCode === "Space") {
        inputs.fire = true;
    }

    if (keyCode === "KeyP") {
        inputs.pause.down = !inputs.pause.pressed ? true : false;
        inputs.pause.pressed = true;
    }
};

const handleKeyup = (event) => {
    const keyCode = event.code;

    if (keyCode === "KeyA" || keyCode === "ArrowLeft") {
        inputs.left = false;
    }
    else if (keyCode === "KeyD" || keyCode === "ArrowRight") {
        inputs.right = false;
    }

    if (keyCode === "KeyW" || keyCode === "ArrowUp") {
        inputs.up = false;
    }

    if (keyCode === "Space") {
        inputs.fire = false;
    }

    if (keyCode === "KeyP") {
        inputs.pause.down = false;
        inputs.pause.pressed = false;
    }
};

const handleGamepadInput = () => {
    const gamepads = navigator.getGamepads();
    if (!gamepads || gamepads.length === 0 || !gamepads[0]) {
        return;
    }
    const usedGamepad = gamepads[0];

    // blindly assuming there's a button
    const upDpad = usedGamepad.buttons[12];
    const leftDpad = usedGamepad.buttons[14];
    const rightDpad = usedGamepad.buttons[15];
    const aButton = usedGamepad.buttons[1];
    const startButton = usedGamepad.buttons[9];

    // map the inputs
    inputs.up = upDpad.pressed;
    inputs.left = leftDpad.pressed;
    inputs.right = rightDpad.pressed;
    inputs.fire = aButton.pressed;
    inputs.pause.down = !inputs.pause.pressed ? startButton.pressed : false;
    inputs.pause.pressed = startButton.pressed;

    // console.log("Button value: " + button.value);
};

resetFrameInputs = () => {
    inputs.pause.down = false;
};

const calculateMovementInputs = () => {
    if (inputs.left) inputHorizontal = -1;
    else if (inputs.right) inputHorizontal = 1;
    else inputHorizontal = 0;

    if (inputs.up) inputVertical = 1;
    else inputVertical = 0;
};

const spawnAsteroid = () => {
    let spawnPosX = 0, spawnPosY = 0, spawnAngle = 0;
    const spawnSide = [0, 1, 2, 3][parseInt(Math.random() * 4)];

    // top
    if (spawnSide === 0) {
        spawnPosX = -asteroidStartSize + Math.random() * (gameCanvas.width + asteroidStartSize);
        spawnPosY = -asteroidStartSize;
        spawnAngle = 180 + (-20 + Math.random() * 20);
    }
    // right
    else if (spawnSide === 1) {
        spawnPosX = gameCanvas.width + asteroidStartSize;
        spawnPosY = -asteroidStartSize + Math.random() * (gameCanvas.height + asteroidStartSize);
        spawnAngle = 270 + (-20 + Math.random() * 20);
    }
    // bottom
    else if (spawnSide === 2) {
        spawnPosX = -asteroidStartSize + Math.random() * (gameCanvas.width + asteroidStartSize);
        spawnPosY = gameCanvas.height + asteroidStartSize;
        spawnAngle = 0 + (-20 + Math.random() * 20);
    }
    // left
    else if (spawnSide === 3) {
        spawnPosX = -asteroidStartSize;
        spawnPosY = -asteroidStartSize + Math.random() * (gameCanvas.height + asteroidStartSize);
        spawnAngle = 90 + (-20 + Math.random() * 20);
    }

    const a = new Asteroid(spawnPosX, spawnPosY, asteroidStartSize, 1, spawnAngle);
    enemies.push(a);
};

const spawnUFO = () => {
    let spawnPosX = -ufoSize;
    let spawnPosY = ufoSize + Math.random() * (gameCanvas.height - ufoSize * 2);

    const newUFO = new UFO(spawnPosX, spawnPosY, ufoSize);
    enemies.push(newUFO);
};

const shipDied = () => {
    // spawn an explosion at the ships position
    const explosion = new ParticleSystem(ship.position.x, ship.position.y);
    for (let i = 0; i < 3; i++) {
        explosion.addParticle(new ShipExplosionParticle("white"));
    }
    explosions.push(explosion);

    soundFX.playSound("shipExplosion");

    ship.die();

    lifes--;
    updateLifesDisplay();
    if (lifes > 0) {
        setTimeout(() => {
            ship.reset();
            ship.beInvincible();
        }, 1000);
    } else {
        lifes = 0;
        gameOver();
    }
};

const gameOver = () => {
    gameState = "gameover";

    setTimeout(() => {
        soundFX.playSound("gameOver");

        ship.reset();
        ship.disabled = true;

        gameOverOverlay.style.display = "flex";

        setTimeout(() => {
            pauseOverlay.style.display = "none";
            gameOverOverlay.style.display = "none";
            playOverlay.style.display = "flex";
            gameState = "menu";
        }, 3000);
    }, 1000);
};

const initBackgroundStars = () => {
    for (let i = 0; i < 50; i++) {
        const newStar = { 
            x: parseInt(1 + Math.random() * gameCanvas.width),
            y: parseInt(1 + Math.random() * gameCanvas.height),
            alpha: 0.1 + Math.random() * 0.8
        };
        bgStars.push(newStar);
    }
};

const drawBackgroundStars = (ctx) => {
    ctx.save();
    ctx.fillStyle = "white";
    for (let s of bgStars) {
        ctx.globalAlpha = s.alpha;
        ctx.fillRect(s.x, s.y, 2, 2);
    }
    ctx.restore();
};

const checkCollision = (x1, y1, r1, x2, y2, r2) => {
    const deltaX = Math.abs(x1 - x2);
    const deltaY = Math.abs(y1 - y2);
    const dist = Math.hypot(deltaX, deltaY);
    const out = (dist > (r1 + r2));
    const circleInOtherCircle = !out && (r2 > (r1 + dist)); 
    const otherCircleInCircle = !out && (r1 > (r2 + dist));
    return !(out || circleInOtherCircle || otherCircleInCircle);
};

initGame();
