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