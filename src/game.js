const gameCanvas = document.getElementById("gameCanvas");
const gameCanvasContext = gameCanvas.getContext("2d");
const scoreText = document.getElementById("score");
const highscoreText = document.getElementById("highscore");
const soundToggleBtn = document.getElementById("soundToggleBtn");

const fps = 60;
let frameCount = 0;

let gameState = "menu"; // game, gameover
let sfxClips = {};
let soundOn = true;
let score = 0, highscore = 0;
let inputs = { left: false, right: false, up: false, fire: false };
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
    soundOn = !soundOn;
    soundToggleBtn.className = (soundOn ? "soundOn" : "soundOff");
};

const loadAudioClip = (fileURL) => {
    const clip = new Audio(fileURL);
    clip.load();
    return clip;
};

const playSound = (clipName, loop = false) => {
    if (soundOn && sfxClips[clipName]) {
        sfxClips[clipName].loop = loop;
        sfxClips[clipName].play();
    }
};

const stopSound = (clipName) => {
    if (!sfxClips[clipName]) return;
    sfxClips[clipName].pause();
    sfxClips[clipName].currentTime = 0;  
};

const addScore = (scoreToAdd) => {
    score += scoreToAdd;
    scoreText.innerHTML = score;
};

const initInput = () => {
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("keyup", handleKeyup);
};

const initGame = () => {
    loadHighscore();
    initBackgroundStars();
    initInput();
    ship = new Ship(gameCanvas.width / 2, gameCanvas.height / 2, true);
    setInterval(gameLoop, 1000 / fps);
};

const startGame = () => {
    sfxClips = {
        coin: loadAudioClip("assets/coin.wav"),
        shoot: loadAudioClip("assets/shoot.wav"),
        ufoShoot: loadAudioClip("assets/shoot.wav"),
        shipExplosion: loadAudioClip("assets/ship_explosion.wav"),
        ufoExplosion: loadAudioClip("assets/ufo_explosion.wav"),
        asteroidExplosion: loadAudioClip("assets/asteroid_explosion.wav"),
        // ufoFlying: loadAudioClip("assets/ufo_flying_2.wav"),
    };

    ship.reset();
    ship.beInvincible();

    ufoSpawnCooldown = fps * 60;

    gameState = "game";

    playSound("coin");
};

const gameLoop = () => {
    frameCount++;
    handleGamepadInput();
    calculateMovementInputs();
    updateGame();
    drawGame();
    updateHighscore();
};

const updateGame = () => {
    if (gameState === "menu") {
        if (inputs.fire) {
            startGame();
            document.getElementById('playOverlay').style.display = "none";
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

        if (ship.canBeHit() && checkCollision(ship.x, ship.y, ship.collisionRadius, d.x, d.y, d.collisionRadius)) {
            shipDied();
        }
    }

    for (let r of rockets) {
        r.update();

        // check for collisions with enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            let d = enemies[i];
            if (checkCollision(r.x, r.y, r.collisionRadius, d.x, d.y, d.collisionRadius)) {
                r.destroy();
                d.hit();
                addScore(d.hitScore);

                // we destroyed the target, spawn a huuuuge explosion
                if (!d.isAlive()) {
                    const explosion = new ParticleSystem(d.x, d.y);
                    for (let i = 0; i < 10; i++) {
                        explosion.addParticle(new ExplosionParticle("white"));
                    }
                    explosions.push(explosion);

                    if (d.explosionSound) {
                        playSound(d.explosionSound);
                    } else {
                        playSound("asteroidExplosion");
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

        playSound("shoot");
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

    // map the inputs
    inputs.up = upDpad.pressed;
    inputs.left = leftDpad.pressed;
    inputs.right = rightDpad.pressed;
    inputs.fire = aButton.pressed;

    // console.log("Button value: " + button.value);
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
    console.log("Ship died!");

    // spawn an explosion at the ships position
    const explosion = new ParticleSystem(ship.x, ship.y);
    for (let i = 0; i < 3; i++) {
        explosion.addParticle(new ShipExplosionParticle("white"));
    }
    explosions.push(explosion);

    playSound("shipExplosion");

    ship.die();

    setTimeout(() => {
        ship.reset();
        ship.beInvincible();
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
