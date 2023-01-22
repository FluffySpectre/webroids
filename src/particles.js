getRandomFloat = (min, max) => {
    return Math.random() * (max - min) + min;
};

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
