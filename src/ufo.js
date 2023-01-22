class UFO {
    constructor(startX, startY, size) {
        this.x = startX;
        this.y = startY;
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

        playSound("ufoFlying", true);
    }

    update() {
        this.x += this.dir * this.speed;

        this.shooting();

        this.checkBounds();
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
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
            const deltaX = ship.x - this.x;
            const deltaY = ship.y - this.y;
            let headingAngle = Math.atan2(deltaY, deltaX);
            headingAngle *= Rad2Deg; // convert to degrees
            headingAngle += 90; // add 90 degrees offset

            enemies.push(new Rocket(this.x, this.y, 5, headingAngle));

            playSound("ufoShoot");
        }
    }

    inBounds() {
        return !(this.x + this.size < 0 || this.x > gameCanvas.width + this.size);
    }

    checkBounds() {
        if (this.x + this.size * 10 < 0) {
            this.y = this.size + Math.random() * (gameCanvas.height - this.size * 2);
            this.dir *= -1;
        }
        else if (this.x > gameCanvas.width + this.size * 10) {
            this.y = this.size + Math.random() * (gameCanvas.height - this.size * 2);
            this.dir *= -1;
        }
    }

    hit() {
        this.alive = false;
        ufoSpawnCooldown = frameCount + (ufoSpawnDelayMin + Math.random() * ufoSpawnDelayMax);
        stopSound("ufoFlying");
    }

    isAlive() {
        return this.alive;
    }
}