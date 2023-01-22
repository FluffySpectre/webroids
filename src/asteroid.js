class Asteroid {
    constructor(startX, startY, size, speed, angle, stage = 1) {
        this.x = startX;
        this.y = startY;
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
        const dirVectorX = Math.cos((this.angle - 90) * Deg2Rad);
        const dirVectorY = Math.sin((this.angle - 90) * Deg2Rad);

        const magnitude = Math.sqrt(dirVectorX * dirVectorX + dirVectorY * dirVectorY);
        const unitVectorX = dirVectorX / magnitude;
        const unitVectorY = dirVectorY / magnitude;

        this.velX = unitVectorX * this.moveSpeed;
        this.velY = unitVectorY * this.moveSpeed;

        this.x += this.velX;
        this.y += this.velY;

        this.rotationAngle += this.rotationSpeed;

        this.checkBounds();
    }

    draw(ctx) {
        ctx.save();

        ctx.translate(this.x, this.y);

        ctx.rotate(this.rotationAngle * Deg2Rad);

        ctx.lineWidth = 2;
        ctx.strokeStyle = "white";
        ctx.fillStyle = "black";

        let eq = 360 / this.edges;
        ctx.beginPath();

        for (var i = 0 ; i <= this.edges; i++) {
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
        if (this.x + this.size < 0) this.x = gameCanvas.width + this.size;
        else if (this.x > gameCanvas.width + this.size) this.x = -this.size;

        if (this.y + this.size < 0) this.y = gameCanvas.height + this.size;
        else if (this.y > gameCanvas.height + this.size) this.y = -this.size;
    }

    hit() {
        this.splitted = true;

        // only split in two asteroids, if we are still big enough
        // otherwise just disappear
        if (this.size >= 30) {
            const a1 = new Asteroid(this.x, this.y, this.size * 0.6, 1 + ((this.stage + 1) * 0.5), Math.random() * 360, this.stage + 1);
            const a2 = new Asteroid(this.x, this.y, this.size * 0.6, 1 + ((this.stage + 1) * 0.5), Math.random() * 360, this.stage + 1);

            // TODO: find a way to not use a global here
            enemies.push(a1, a2);
        }
    }

    isAlive() {
        return !this.splitted;
    }
}