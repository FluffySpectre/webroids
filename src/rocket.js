class Rocket {
    constructor(startX, startY, speed, angle) {
        this.x = startX;
        this.y = startY;
        this.velX = 0;
        this.velY = 0;
        this.angle = angle;
        this.moveSpeed = speed;
        this.lifetime = frameCount + fps;
        this.size = 6;
        this.collisionRadius = this.size * 0.75;
        this.hitScore = 100;
    }

    update() {
        const dirVectorX = Math.cos((this.angle - 90) * Deg2Rad);
        const dirVectorY = Math.sin((this.angle - 90) * Deg2Rad);

        const magnitude = Math.sqrt(dirVectorX * dirVectorX + dirVectorY * dirVectorY);
        const unitVectorX = dirVectorX / magnitude;
        const unitVectorY = dirVectorY / magnitude;

        this.velX = unitVectorX * this.moveSpeed;
        this.velY = unitVectorY * this.moveSpeed;

        this.x += this.velX;
        this.y += this.velY;

        this.checkBounds();
    }

    draw(ctx) {
        ctx.save();

        ctx.translate(this.x, this.y);

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
        if (this.x < 0 - this.size) this.x = gameCanvas.width + this.size;
        else if (this.x > gameCanvas.width + this.size) this.x = 0 - this.size;

        if (this.y < 0 - this.size) this.y = gameCanvas.height + this.size;
        else if (this.y > gameCanvas.height + this.size) this.y = 0 - this.size;
    }

    hit() {
        this.lifetime = 0;
    }
}