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