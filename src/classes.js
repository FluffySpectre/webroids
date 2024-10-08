// SoundFX
class SoundFX {
    constructor() {
        this.sfxClips = {};
        this.soundOn = true;
        this.clipsLoaded = false;
    }

    toggleSound() {
        this.soundOn = !this.soundOn;
    }

    loadSFXClips(sfxClips) {
        if (!sfxClips && typeof sfxClips !== "object") {
            return;
        }

        let newSfxClips = {};
        const clipNames = Object.keys(sfxClips);
        for (let cn of clipNames) {
            newSfxClips[cn] = this.loadAudioClip(sfxClips[cn]);
        }

        this.sfxClips = newSfxClips;
        this.clipsLoaded = true;
    }

    loadAudioClip(fileURL) {
        const clip = new Howl({
            src: [fileURL]
        });
        return clip;
    }

    playSound(clipName, loop = false) {
        if (this.soundOn) {
            const clipToUse = this.sfxClips[clipName];
            if (clipToUse) {
                clipToUse.loop(loop);
                clipToUse.play();
            }
        }
    }

    stopSound(clipName) {
        if (!this.sfxClips[clipName]) return;
        this.sfxClips[clipName].stop();
    }

    soundIsPlaying(clipName) {
        return this.sfxClips[clipName] && this.sfxClips[clipName].playing();
    }
}
// End of SoundFX

// Particles
class ParticleSystem {
    constructor(x, y) {
        this.setOrigin(x, y);
        this.particles = [];
    }

    setOrigin(x, y) {
        this.origin = new Vector(x, y);
    }

    addParticle(p) {
        p.pos = this.origin.copy();
        this.particles.push(p);
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.update();
            if (p.isDead()) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (let p of this.particles) {
            p.draw(ctx);
        }
    }

    isAlive() {
        return this.particles.length > 0;
    }
}

class Particle {
    constructor(color) {
        this.vel = new Vector();
        this.pos = new Vector();
        this.lifespan = 1.0;
        this.color = color;
    }

    update() {
        const vel = this.vel.copy();
        this.pos.add(vel.mult(deltaTime));
        this.lifespan -= deltaTime;
    }

    draw(ctx) { }

    isDead() {
        return this.lifespan < 0;
    }
}

class ExplosionParticle extends Particle {
    constructor(color) {
        super(color);
        this.vel = new Vector(getRandomFloat(-1, 1), getRandomFloat(-1, 1)).mult(2);
        this.vel = this.vel.mult(60);
        this.theta = 0.0;
    }

    update() {
        super.update();
        this.theta += (this.vel.x * this.vel.mag()) / 650.0 * deltaTime;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.theta);
        ctx.globalAlpha = this.lifespan * 2;
        ctx.strokeStyle = this.color;
        ctx.strokeRect(-4, -4, 8, 8);
        ctx.restore();
    }
}

class ShipExplosionParticle extends ExplosionParticle {
    constructor(color) {
        super(color);
        this.vel = new Vector(getRandomFloat(-1, 1), getRandomFloat(-1, 1)).mult(0.5);
        this.vel = this.vel.mult(60);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.theta);
        ctx.globalAlpha = this.lifespan * 1.5;
        ctx.strokeStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-24, -24, 24, 24);
        ctx.stroke();
        ctx.restore();
    }
}

class TrailParticle extends Particle {
    constructor(color, forwardVector) {
        super(color);
        this.vel = new Vector(forwardVector.x, forwardVector.y).mult(-1);
        this.vel = this.vel.mult(0.5 + getRandomFloat(0, 2));
        this.vel = this.vel.add(new Vector(getRandomFloat(-0.5, 0.5), getRandomFloat(-0.5, 0.5)));
        this.vel = this.vel.mult(60);
        this.theta = 0.0;
    }

    update() {
        super.update();
        this.theta += (this.vel.x * this.vel.mag()) / 65.0 * deltaTime;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.theta);
        ctx.globalAlpha = this.lifespan * 2;
        ctx.strokeStyle = this.color;
        ctx.strokeRect(-2, -2, 4, 4);
        ctx.restore();
    }
}
// End of Particles

// Asteroid
class Asteroid {
    constructor(startX, startY, size, speed, angle, stage = 1) {
        this.position = new Vector(startX, startY);
        this.collisionRadius = size * 0.75;
        this.edges = parseInt(8 + Math.random() * 12);

        this.calculatedPoints = [];
        const eq = 360 / this.edges;
        for (let i = 0; i < this.edges; i++) {
            const pointRadius = (this.collisionRadius * 0.5) + Math.random() * (this.collisionRadius * 0.8);

            const deg = i * eq;
            const rad = deg * Deg2Rad;
            const x = pointRadius * Math.cos(rad);
            const y = pointRadius * Math.sin(rad);

            this.calculatedPoints.push({ x, y });
        }

        this.size = size;
        this.moveSpeed = speed * 60;
        this.angle = angle;
        this.rotationAngle = 0;
        this.rotationSpeed = 0.1 + Math.random() * 1.25 * 60;
        this.splitted = false;
        this.stage = stage;
        this.hitScore = stage * 20;
        this.velocity = 0;
    }

    update() {
        const direction = new Vector(Math.cos((this.angle - 90) * Deg2Rad), Math.sin((this.angle - 90) * Deg2Rad));
        this.velocity = direction.normalize();
        this.velocity.mult(this.moveSpeed * deltaTime);
        this.position.add(this.velocity);

        this.rotationAngle += this.rotationSpeed * deltaTime;

        this.checkBounds();
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.rotationAngle * Deg2Rad);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "white";
        ctx.fillStyle = "black";
        ctx.beginPath();
        for (let p of this.calculatedPoints) {
            ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    checkBounds() {
        if (this.position.x + this.size < 0) this.position.x = gameCanvas.width + this.size;
        else if (this.position.x > gameCanvas.width + this.size) this.position.x = -this.size;

        if (this.position.y + this.size < 0) this.position.y = gameCanvas.height + this.size;
        else if (this.position.y > gameCanvas.height + this.size) this.position.y = -this.size;
    }

    hit() {
        this.splitted = true;

        if (this.size >= 30) {
            AsteroidSpawner.spawnAsteroid(this.position.x, this.position.y, this.size * 0.6, 1 + ((this.stage + 1) * 0.5), Math.random() * 360, this.stage + 1);
            AsteroidSpawner.spawnAsteroid(this.position.x, this.position.y, this.size * 0.6, 1 + ((this.stage + 1) * 0.5), Math.random() * 360, this.stage + 1);
        }
    }

    isAlive() {
        return !this.splitted;
    }
}
// End of Asteroid

// SpecialAsteroid
class SpecialAsteroid extends Asteroid {
    constructor(startX, startY, size, speed, angle, stage = 1) {
        super(startX, startY, size, speed, angle, stage);
        this.trailParticleSystem = new ParticleSystem(startX, startY);
    }

    update() {
        super.update();
        this.trailParticleSystem.setOrigin(this.position.x, this.position.y);
        this.trailParticleSystem.addParticle(new TrailParticle("white", this.velocity));
        this.trailParticleSystem.update();
    }

    draw(ctx) {
        this.trailParticleSystem.draw(ctx);
        super.draw(ctx);
    }

    checkBounds() {
        if (this.position.x + this.size * 6 < 0 || 
            this.position.x > gameCanvas.width + this.size * 6 ||
            this.position.y + this.size * 6 < 0 ||
            this.position.y > gameCanvas.height + this.size * 6) {
                this.splitted = true;
        }
    }

    hit() {
        this.splitted = true;
        PowerupSpawner.spawnRandomPowerup(this.position);
    }

    isAlive() {
        return !this.splitted;
    }
}
// End of SpecialAsteroid

// AsteroidSpawner
class AsteroidSpawner {
    static spawnAsteroid(spawnX, spawnY, size, speed, spawnAngle, stage = 1) {
        // spawn a special asteroid with a 10% chance
        if (Math.random() < 0.1) {
            const a = new SpecialAsteroid(spawnX, spawnY, size, speed * 0.5, spawnAngle, stage);
            enemies.push(a);
        }
        else {
            const a = new Asteroid(spawnX, spawnY, size, speed, spawnAngle, stage);
            enemies.push(a);
        }
    }
}
// End of AsteroidSpawner

// Rocket
class Rocket {
    constructor(startX, startY, speed, angle) {
        this.position = new Vector(startX, startY);
        this.angle = angle;
        this.moveSpeed = speed * 60;
        this.lifetime = 1;
        this.size = 6;
        this.collisionRadius = this.size * 0.75;
        this.hitScore = 100;
    }

    update() {
        const direction = new Vector(Math.cos((this.angle - 90) * Deg2Rad), Math.sin((this.angle - 90) * Deg2Rad));
        const velocity = direction.normalize();
        velocity.mult(this.moveSpeed * deltaTime);
        this.position.add(velocity);

        this.lifetime -= deltaTime;

        this.checkBounds();
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.angle * Deg2Rad);
        ctx.lineWidth = 1;
        ctx.fillStyle = "white";
        ctx.fillRect(-(this.size / 2), -(this.size / 2), this.size, this.size);
        ctx.restore();
    }

    isAlive() {
        return this.lifetime > 0;
    }

    destroy() {
        this.lifetime = 0;
    }

    checkBounds() {
        if (this.position.x < 0 - this.size) this.position.x = gameCanvas.width + this.size;
        else if (this.position.x > gameCanvas.width + this.size) this.position.x = 0 - this.size;

        if (this.position.y < 0 - this.size) this.position.y = gameCanvas.height + this.size;
        else if (this.position.y > gameCanvas.height + this.size) this.position.y = 0 - this.size;
    }

    hit() {
        this.lifetime = 0;
    }
}
// End of Rocket

// HomingRocket
class HomingRocket extends Rocket {
    constructor(startX, startY, speed, angle) {
        super(startX, startY, speed, angle);
        this.turnSpeed = 20;
        this.target = null;
    }

    update() {
        if (!this.target || !this.target.isAlive()) {
            this.target = this.findNearestEnemy();
        }
        if (this.target && this.target.isAlive()) {
            this.adjustAngleTowards(this.target);
        }
        super.update();
    }

    findNearestEnemy() {
        let closestEnemy = null;
        let closestDistance = Infinity;

        for (let enemy of enemies) {
            const dist = this.position.dist(enemy.position);
            if (dist < closestDistance) {
                closestDistance = dist;
                closestEnemy = enemy;
            }
        }

        return closestEnemy;
    }

    adjustAngleTowards(target) {
        const targetAngle = Math.atan2(target.position.y - this.position.y, target.position.x - this.position.x) * (180 / Math.PI) + 90;
        const angleDiff = (targetAngle - this.angle + 360) % 360;

        if (angleDiff < 180) {
            this.angle += Math.min(this.turnSpeed, angleDiff);
        } else {
            this.angle -= Math.min(this.turnSpeed, 360 - angleDiff);
        }
    }
}
// End of HomingRocket

// UFO
class UFO {
    constructor(startX, startY, size) {
        this.position = new Vector(startX, startY);
        this.size = size;
        this.collisionRadius = this.size * 2.5;
        this.dir = 1;
        this.dirY = 0;
        this.speed = (1.5 + Math.random() * 2.5) * 60; 
        this.hitScore = 250;
        this.alive = true;
        this.shootDelay = 1;
        this.shootTimer = this.shootDelay;
        this.ufoVertices = [
            { x: -2, y: -3 },
            { x: 2, y: -3 },
            { x: 4, y: -1 },
            { x: 7, y: 1 },
            { x: 4, y: 3 },
            { x: -4, y: 3 },
            { x: -7, y: 1 },
            { x: -4, y: -1 },
            { x: -2, y: -3 },
        ];
        this.explosionSound = "ufoExplosion";

        this.changeYDirectionTimer = 0;
        this.nextYDirChange = 0.5 + Math.random() * 1.0;

        soundFX.playSound("ufoFlying", true);
    }

    moveBehaviour() {
        this.position.x += this.dir * this.speed * deltaTime;
        this.position.y += this.dirY * this.speed * deltaTime;

        this.changeYDirectionTimer += deltaTime;
        if (this.changeYDirectionTimer > this.nextYDirChange) {
            this.changeYDirectionTimer = 0;
            this.nextYDirChange = 0.5 + Math.random() * 1.0;

            if (this.position.y < gameCanvas.height / 2) {
                this.dirY = Math.random() < 0.5 ? 1 : 0;
            } else {
                this.dirY = Math.random() < 0.5 ? -1 : 0;
            }

            // change direction based on the player ship
            // if (this.position.y < ship.position.y) {
            //     this.dirY = 1;
            // }
            // else {
            //     this.dirY = -1;
            // }
        }
    }

    update() {
        this.moveBehaviour();
        this.shooting();
        this.checkBounds();
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.scale(this.size, this.size);
        ctx.fillStyle = "black";
        ctx.strokeStyle = "white";
        ctx.lineWidth = 0.4;
        ctx.beginPath();
        for (let i = 1; i < this.ufoVertices.length; i++) {
            ctx.moveTo(this.ufoVertices[i].x, this.ufoVertices[i].y);
            ctx.lineTo(this.ufoVertices[i-1].x, this.ufoVertices[i-1].y);
        }
        ctx.moveTo(-7, 1);
        ctx.lineTo(7, 1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    shooting() {
        this.shootTimer -= deltaTime;
        if (this.inBounds() && this.shootTimer < 0) {
            this.shootTimer = this.shootDelay;

            const deltaX = ship.position.x - this.position.x;
            const deltaY = ship.position.y - this.position.y;
            let headingAngle = Math.atan2(deltaY, deltaX);
            headingAngle *= Rad2Deg; 
            headingAngle += 90;

            enemies.push(new Rocket(this.position.x, this.position.y, 5, headingAngle));

            soundFX.playSound("ufoShoot");
        }
    }

    inBounds() {
        return !(this.position.x + this.size < 0 || this.position.x > gameCanvas.width + this.size);
    }

    checkBounds() {
        if (this.position.x + this.size * 10 < 0) {
            this.position.y = this.size + Math.random() * (gameCanvas.height - this.size * 2);
            this.dir *= -1;
            this.dirY = 0;
        }
        else if (this.position.x > gameCanvas.width + this.size * 10) {
            this.position.y = this.size + Math.random() * (gameCanvas.height - this.size * 2);
            this.dir *= -1;
            this.dirY = 0;
        }
    }

    hit() {
        this.alive = false;
        ufoSpawnTimer = ufoSpawnDelayMin + Math.random() * ufoSpawnDelayMax;
        soundFX.stopSound("ufoFlying");
        PowerupSpawner.spawnRandomPowerup(this.position);
    }

    isAlive() {
        return this.alive;
    }
}
// End of UFO

// Ship
class Ship {
    constructor(startX, startY, disabled) {
        this.startPosition = new Vector(startX, startY);
        this.position = new Vector(startX, startY);
        this.angle = 0;
        this.moveSpeed = 6;
        this.rotationSpeed = 180;
        this.acceleration = new Vector();
        this.velocity = new Vector();
        this.friction = 0.02;
        this.inputVertical = 0;
        this.size = 20;
        this.scale = 2;
        this.collisionRadius = this.size * 0.6;
        this.invincible = false;
        this.invincibleCooldown = 0;
        this.invincibleDelay = 3;
        this.flickerTimer = 0;
        this.flicker = true;
        this.dead = false;
        this.disabled = disabled;
        this.numProjectiles = 1;
        this.projectile = Rocket;
        this.flameFlickerTimer = 0;
        this.activePowerups = {};
    }

    reset() {
        this.position = this.startPosition.copy();
        this.acceleration.mult(0);
        this.velocity.mult(0);
        this.angle = 0;
        this.dead = false;
        this.flicker = true;
        this.disabled = false;
        this.numProjectiles = 1;
        this.collisionRadius = this.size * 0.6;
        this.scale = 2;
        this.projectile = Rocket;
    }

    canBeHit() {
        return !this.disabled && !this.dead && !this.invincible;
    }

    die() {
        this.dead = true;
    }

    beInvincible() {
        this.invincible = true;
        this.invincibleCooldown = this.invincibleDelay;
    }

    move(inputHorizontal, inputVertical) {
        this.inputVertical = inputVertical;
        this.angle += inputHorizontal * this.rotationSpeed * deltaTime;

        const direction = new Vector(Math.cos((this.angle - 90) * Deg2Rad), Math.sin((this.angle - 90) * Deg2Rad));
        this.acceleration = direction.normalize();
        this.acceleration.mult(inputVertical);
        this.acceleration.mult(this.moveSpeed);
    }

    shoot() {
        const projectiles = [];

        if (this.numProjectiles > 1) {
            let spread = -30;
            for (let i = 0; i < this.numProjectiles; i++) {
                projectiles.push(new this.projectile(this.position.x, this.position.y, 8, this.angle + spread));
                spread += 30;
            }
        }
        else {
            projectiles.push(new this.projectile(this.position.x, this.position.y, 8, this.angle));
        }

        return projectiles;
    }

    update() {
        if (this.dead || this.disabled) return;

        if (this.invincible) {
            this.invincibleCooldown -= deltaTime;
            this.flickerTimer += deltaTime;
            if (this.invincibleCooldown <= 0) {
                this.invincible = false;
            }
        }

        this.velocity.add(this.acceleration.mult(deltaTime));
        this.velocity.mult(1 - this.friction);
        this.position.add(this.velocity);

        // reset acceleration
        this.acceleration.mult(0);

        this.checkBounds();
    }

    draw(ctx) {
        if (this.dead || this.disabled) return;

        ctx.save();

        ctx.translate(this.position.x, this.position.y);

        ctx.scale(this.scale, this.scale);
        ctx.rotate(this.angle * Deg2Rad);

        ctx.lineWidth = 1;

        if (this.invincible) {
            if (this.flickerTimer > 0.1) {
                this.flickerTimer = 0;
                this.flicker = !this.flicker;
            }
            ctx.strokeStyle = this.flicker ? "white" : "#888";
        } else {
            ctx.strokeStyle = "white";
        }

        // draw the actual ship
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(5, 10);
        ctx.lineTo(-5, 10);
        ctx.lineTo(0, -10);
        ctx.stroke();

        this.drawEngineFlame(ctx);

        ctx.restore();
    }

    drawEngineFlame(ctx) {
        this.flameFlickerTimer -= deltaTime;
        if (this.inputVertical !== 0 && this.flameFlickerTimer < 0) {
            ctx.lineWidth = 2;
            ctx.strokeRect(-2.5, 10, 5, 4);
            this.flameFlickerTimer = 0.07;
        }
    }

    checkBounds() {
        const collisionDiameter = this.collisionRadius * 2;
        if (this.position.x < 0 - collisionDiameter) this.position.x = gameCanvas.width + collisionDiameter;
        else if (this.position.x > gameCanvas.width + collisionDiameter) this.position.x = 0 - collisionDiameter;

        if (this.position.y < 0 - collisionDiameter) this.position.y = gameCanvas.height + collisionDiameter;
        else if (this.position.y > gameCanvas.height + collisionDiameter) this.position.y = 0 - collisionDiameter;
    }
}
// End of Ship

// PowerupSpawner
class PowerupSpawner {
    static spawnRandomPowerup(position) {
        // calculate a random powerup type
        const powerupType = this.getRandomPowerup(lifes, maxLifes);

        if (powerupType === "HealthPowerup") {
            powerups.push(new HealthPowerup(position));
        }
        else if (powerupType === "ShrinkPowerup") {
            powerups.push(new ShrinkPowerup(position));
        }
        else if (powerupType == "TripleShotPowerup") {
            powerups.push(new TripleShotPowerup(position));
        }
        else if (powerupType === "HomingRocketsPowerup") {
            powerups.push(new HomingRocketsPowerup(position));
        }
    }

    static getRandomPowerup(playerLifes, maxLifes) {
        const healthWeight = Math.max(20 * (maxLifes - playerLifes), 5);

        const powerups = [
            { name: "HealthPowerup", baseWeight: healthWeight },
            { name: "ShrinkPowerup", baseWeight: 20 },
            { name: "TripleShotPowerup", baseWeight: 25 },
            { name: "HomingRocketsPowerup", baseWeight: 25 },
        ];

        // sum all weights
        const totalWeight = powerups.reduce((sum, powerup) => sum + powerup.baseWeight, 0);

        // pick a random powerup based on its weight
        let random = Math.random() * totalWeight;
        for (let powerup of powerups) {
            if (random < powerup.baseWeight) {
                return powerup.name;
            }
            random -= powerup.baseWeight;
        }
    }
}
// End of PowerupSpawner

// Powerup
class Powerup {
    constructor(position) {
        this.position = position;
        this.pickedUp = false;
        this.theta = 0;
        this.collisionRadius = 10;
        this.pickupTimer = 10;
        this.dead = false;
        this.player = null;
        this.blinkTimer = 0;
    }

    update() {
        this.theta += 3 * deltaTime;

        this.pickupTimer -= deltaTime;
        if (this.pickupTimer < 0) {
            this.dead = true;
        }
    }

    draw(ctx) {
        if (this.pickedUp) return;

        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.scale(2, 2);
        ctx.rotate(this.theta);

        // blinking powerup
        if (this.pickupTimer < 5) {
            this.blinkTimer += deltaTime * 60;
            const minFrequency = 5;
            const blinkSpeed = minFrequency + this.pickupTimer * (20 / 5); 
            const blink = Math.sin(this.blinkTimer / blinkSpeed) > 0 ? "white" : "gray";
            ctx.strokeStyle = blink;
        } else {
            ctx.strokeStyle = "white";
            this.blinkTimer = 0;
        }

        ctx.lineWidth = 1;
        ctx.strokeRect(-5, -5, 10, 10);

        ctx.rotate(45 * Deg2Rad);
        ctx.strokeRect(-1, -1, 2, 2);

        ctx.restore();
    }

    pickup(player) {
        this.pickedUp = true;
        this.collisionRadius = 0;
        this.player = player;
    }

    isAlive() {
        return !this.dead && !this.pickedUp;
    }
}
// End of Powerup

// TimedPowerup
class TimedPowerup extends Powerup {
    constructor(position, duration = 10) {
        super(position);
        this.duration = duration;
        this.active = false;
    }

    activated() {}
    deactivated() {
        const powerupType = this.constructor.name;
        if (this.player && this.player.activePowerups[powerupType] === this) {
            delete this.player.activePowerups[powerupType];
        }
        this.dead = true;
    }
    deactivatedEarly() {
        this.duration = 0;
        this.active = false;
        this.deactivated();
    }

    update() {
        super.update();

        if (this.active) {
            this.duration -= deltaTime;
            if (this.duration <= 0) {
                this.active = false;
                this.deactivated();
            }
        }
    }

    pickup(player) {
        super.pickup(player);

        const powerupType = this.constructor.name;
        if (player.activePowerups[powerupType]) {
            player.activePowerups[powerupType].deactivatedEarly();
        }
        player.activePowerups[powerupType] = this;

        this.active = true;
        this.activated();
    }

    isAlive() {
        return this.active || (!this.dead && !this.pickedUp);
    }
}
// End of TimedPowerup

// HealthPowerup
class HealthPowerup extends Powerup {
    constructor(position) {
        super(position);
    }

    pickup(player) {
        super.pickup(player);

        if (lifes < maxLifes) {
            lifes++;
            updateLifesDisplay();
        }
    }
}
// End of HealthPowerup

// TripleShotPowerup
class TripleShotPowerup extends TimedPowerup {
    constructor(position) {
        super(position, 10);
    }

    activated() {
        this.player.numProjectiles = 3;
    }

    deactivated() {
        super.deactivated();

        this.player.numProjectiles = 1;
    }
}
// End of TripleShotPowerup

// ShrinkPowerup
class ShrinkPowerup extends TimedPowerup {
    constructor(position) {
        super(position, 10);
    }

    activated() {
        this.player.scale = 1;
        this.player.collisionRadius = 10 * 0.6;
    }

    deactivated() {
        super.deactivated();

        this.player.scale = 2;
        this.player.collisionRadius = this.player.size * 0.6;
    }
}
// End of ShrinkPowerup

// HomingRocketsPowerup
class HomingRocketsPowerup extends TimedPowerup {
    constructor(position) {
        super(position, 10);
    }

    activated() {
        this.player.projectile = HomingRocket;
    }

    deactivated() {
        super.deactivated();

        this.player.projectile = Rocket;
    }
}
// End of HomingRocketsPowerup
