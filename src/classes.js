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
        // sfxClips format:
        // sfxClips = {
        //     shoot: "assets/shoot.mp3"
        // };
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
        return this.sfxClips[clipName]
            && this.sfxClips[clipName].playing();
    }
}
// End of SoundFX

// Particles
class ParticleSystem {
    constructor(x, y) {
        this.origin = new Vector(x, y);
        this.particles = [];
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
        this.pos.add(this.vel);
        this.lifespan -= 0.02;
    }

    draw(ctx) { }

    isDead() {
        if (this.lifespan < 0) {
            return true;
        }
        return false;
    }
}

class ExplosionParticle extends Particle {
    constructor(color) {
        super(color);

        this.vel = new Vector(getRandomFloat(-1, 1), getRandomFloat(-1, 1)).mult(2);
        this.theta = 0.0;
    }

    update() {
        super.update();

        this.theta += (this.vel.x * this.vel.mag()) / 5.0;
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
// End of Particles

// Asteroid
class Asteroid {
    constructor(startX, startY, size, speed, angle, stage = 1) {
        this.position = new Vector(startX, startY);
        this.collisionRadius = size * 0.75;
        this.edges = parseInt(8 + Math.random() * 12);
        this.pointRadiie = [];
        for (let i = 0; i < this.edges; i++) {
            this.pointRadiie.push((this.collisionRadius * 0.5) + Math.random() * (this.collisionRadius * 0.8));
        }

        this.size = size;
        this.moveSpeed = speed;
        this.angle = angle;
        this.rotationAngle = 0;
        this.rotationSpeed = 0.1 + Math.random() * 1.25;
        this.splitted = false;
        this.stage = stage;
        this.hitScore = stage * 20;
    }

    update() {
        const direction = new Vector(Math.cos((this.angle - 90) * Deg2Rad), Math.sin((this.angle - 90) * Deg2Rad));
        const velocity = direction.normalize();
        velocity.mult(this.moveSpeed);
        this.position.add(velocity);

        this.rotationAngle += this.rotationSpeed;

        this.checkBounds();
    }

    draw(ctx) {
        ctx.save();

        ctx.translate(this.position.x, this.position.y);

        ctx.rotate(this.rotationAngle * Deg2Rad);

        ctx.lineWidth = 2;
        ctx.strokeStyle = "white";
        ctx.fillStyle = "black";

        let eq = 360 / this.edges;
        ctx.beginPath();

        for (let i = 0 ; i <= this.edges; i++) {
            let deg = i * eq;
            let rad = deg * Deg2Rad;

            let x1 = this.pointRadiie[i] * Math.cos(rad);
            let y1 = this.pointRadiie[i] * Math.sin(rad);

            ctx.lineTo(x1, y1);
        }   

        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // ctx.strokeStyle = "red";
        // ctx.beginPath();
        // ctx.arc(0, 0, this.collisionRadius, 0, 2 * Math.PI);
        // ctx.stroke();

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

        // only split in two asteroids, if we are still big enough
        // otherwise just disappear
        if (this.size >= 30) {
            const a1 = new Asteroid(this.position.x, this.position.y, this.size * 0.6, 1 + ((this.stage + 1) * 0.5), Math.random() * 360, this.stage + 1);
            const a2 = new Asteroid(this.position.x, this.position.y, this.size * 0.6, 1 + ((this.stage + 1) * 0.5), Math.random() * 360, this.stage + 1);

            // TODO: find a way to not use a global here
            enemies.push(a1, a2);
        }
    }

    isAlive() {
        return !this.splitted;
    }
}
// End of Asteroid

// Rocket
class Rocket {
    constructor(startX, startY, speed, angle) {
        this.position = new Vector(startX, startY);
        this.angle = angle;
        this.moveSpeed = speed;
        this.lifetime = frameCount + fps;
        this.size = 6;
        this.collisionRadius = this.size * 0.75;
        this.hitScore = 100;
    }

    update() {
        const direction = new Vector(Math.cos((this.angle - 90) * Deg2Rad), Math.sin((this.angle - 90) * Deg2Rad));
        const velocity = direction.normalize();
        velocity.mult(this.moveSpeed);
        this.position.add(velocity);

        this.checkBounds();
    }

    draw(ctx) {
        ctx.save();

        ctx.translate(this.position.x, this.position.y);

        ctx.rotate(this.angle * Deg2Rad);

        ctx.lineWidth = 1;
        ctx.fillStyle = "white";
        ctx.fillRect(-(this.size / 2), -(this.size / 2), this.size, this.size);

        // ctx.strokeStyle = "red";
        // ctx.beginPath();
        // ctx.arc(0, 0, this.collisionRadius, 0, 2 * Math.PI);
        // ctx.stroke();

        ctx.restore();
    }

    isAlive() {
        return frameCount < this.lifetime;
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

// UFO
class UFO {
    constructor(startX, startY, size) {
        this.position = new Vector(startX, startY);
        this.size = size;
        this.collisionRadius = this.size * 2.5;
        this.dir = 1;
        this.speed = 1.5 + Math.random() * 2.5;
        this.hitScore = 250;
        this.alive = true;
        this.shootDelay = 60;
        this.shootCooldown = frameCount + this.shootDelay;
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

        soundFX.playSound("ufoFlying", true);
    }

    update() {
        this.position.x += this.dir * this.speed;

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
    
        // center point
        // ctx.fillRect(-0.5, -0.5, 1, 1);

        ctx.beginPath();
        for (let i = 1; i < this.ufoVertices.length; i++) {
            ctx.moveTo(this.ufoVertices[i].x, this.ufoVertices[i].y);
            ctx.lineTo(this.ufoVertices[i-1].x, this.ufoVertices[i-1].y);
        }
        // center line
        ctx.moveTo(-7, 1);
        ctx.lineTo(7, 1);

        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // ctx.scale(1, 1);
        // ctx.strokeStyle = "red";
        // ctx.beginPath();
        // ctx.arc(0, 0, this.collisionRadius, 0, 2 * Math.PI);
        // ctx.stroke();

        ctx.restore();
    }

    shooting() {
        if (this.inBounds() && frameCount > this.shootCooldown) {
            this.shootCooldown = frameCount + this.shootDelay;

            // calculate angle to player ship
            const deltaX = ship.position.x - this.position.x;
            const deltaY = ship.position.y - this.position.y;
            let headingAngle = Math.atan2(deltaY, deltaX);
            headingAngle *= Rad2Deg; // convert to degrees
            headingAngle += 90; // add 90 degrees offset

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
        }
        else if (this.position.x > gameCanvas.width + this.size * 10) {
            this.position.y = this.size + Math.random() * (gameCanvas.height - this.size * 2);
            this.dir *= -1;
        }
    }

    hit() {
        this.alive = false;
        ufoSpawnCooldown = frameCount + (ufoSpawnDelayMin + Math.random() * ufoSpawnDelayMax);
        soundFX.stopSound("ufoFlying");
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
        this.moveSpeed = 0.15;
        this.rotationSpeed = 3;
        this.acceleration = new Vector();
        this.velocity = new Vector();
        this.friction = 0.02;
        this.inputVertical = 0;
        this.size = 20;
        this.collisionRadius = this.size * 0.6;
        this.invincible = false;
        this.invincibleCooldown = 0;
        this.invincibleDelay = fps * 3;
        this.flickerTimer = 0;
        this.flicker = true;
        this.dead = false;
        this.disabled = disabled;
    }

    reset() {
        this.position = this.startPosition.copy();
        this.acceleration.mult(0);
        this.velocity.mult(0);
        this.angle = 0;
        this.dead = false;
        this.flicker = true;
        this.disabled = false;
    }

    canBeHit() {
        return !this.disabled && !this.dead && !this.invincible;
    }

    die() {
        this.dead = true;
    }

    beInvincible() {
        this.invincible = true;
        this.invincibleCooldown = frameCount + this.invincibleDelay;
    }

    move(inputHorizontal, inputVertical) {
        this.inputVertical = inputVertical;
        this.angle += inputHorizontal * this.rotationSpeed;

        const direction = new Vector(Math.cos((this.angle - 90) * Deg2Rad), Math.sin((this.angle - 90) * Deg2Rad));
        this.acceleration = direction.normalize();
        this.acceleration.mult(inputVertical);
        this.acceleration.mult(this.moveSpeed);
    }

    shootRocket() {
        const r = new Rocket(this.position.x, this.position.y, 8, this.angle);
        return r;
    }

    update() {
        if (this.dead || this.disabled) return;

        if (frameCount > this.invincibleCooldown) {
            this.invincible = false;
        }

        this.velocity.add(this.acceleration);
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

        ctx.scale(2, 2);
        ctx.rotate(this.angle * Deg2Rad);

        ctx.lineWidth = 1;

        if (this.invincible) {
            if (frameCount > this.flickerTimer + 5) {
                this.flickerTimer = frameCount;
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

        // ctx.strokeStyle = "red";
        // ctx.beginPath();
        // ctx.arc(0, 0, this.collisionRadius, 0, 2 * Math.PI);
        // ctx.stroke();

        ctx.restore();
    }

    drawEngineFlame(ctx) {
        if (this.inputVertical !== 0 && frameCount % 5 === 0) {
            ctx.lineWidth = 2;
            ctx.strokeRect(-2.5, 10, 5, 4);
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
