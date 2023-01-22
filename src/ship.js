class Ship {
    constructor(startX, startY, disabled) {
        this.startX = startX;
        this.startY = startY;
        this.x = startX;
        this.y = startY;
        this.angle = 0;
        this.moveSpeed = 0.15;
        this.rotationSpeed = 3;
        this.accX = 0;
        this.accY = 0;
        this.velX = 0;
        this.velY = 0;
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
        this.x = this.startX;
        this.y = this.startY;
        this.angle = 0;
        this.accX = 0;
        this.accY = 0;
        this.velX = 0;
        this.velY = 0;
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

        const dirVectorX = Math.cos((this.angle - 90) * Deg2Rad);
        const dirVectorY = Math.sin((this.angle - 90) * Deg2Rad);

        const magnitude = Math.sqrt(dirVectorX * dirVectorX + dirVectorY * dirVectorY);
        const unitVectorX = dirVectorX / magnitude;
        const unitVectorY = dirVectorY / magnitude;

        this.accX = inputVertical * unitVectorX * this.moveSpeed;
        this.accY = inputVertical * unitVectorY * this.moveSpeed;
    }

    shootRocket() {
        const r = new Rocket(this.x, this.y, 8, this.angle);
        return r;
    }

    update() {
        if (this.dead || this.disabled) return;

        if (frameCount > this.invincibleCooldown) {
            this.invincible = false;
        }

        this.velX += this.accX;
        this.velY += this.accY;
        this.velX *= 1 - this.friction;
        this.velY *= 1 - this.friction;

        this.x += this.velX;
        this.y += this.velY;

        this.accX = 0;
        this.accY = 0;

        this.checkBounds();
    }

    draw(ctx) {
        if (this.dead || this.disabled) return;

        ctx.save();

        ctx.translate(this.x, this.y);

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
        if (this.x < 0 - collisionDiameter) this.x = gameCanvas.width + collisionDiameter;
        else if (this.x > gameCanvas.width + collisionDiameter) this.x = 0 - collisionDiameter;

        if (this.y < 0 - collisionDiameter) this.y = gameCanvas.height + collisionDiameter;
        else if (this.y > gameCanvas.height + collisionDiameter) this.y = 0 - collisionDiameter;
    }
}