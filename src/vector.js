const Deg2Rad = Math.PI / 180;
const Rad2Deg = 180 / Math.PI;

class Vector {
    constructor(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }

    add(v) {
        if (v instanceof Vector) {
            this.x += v.x;
            this.y += v.y;
        } else {
            this.x += v;
            this.y += v;
        }
        return this;
    }

    sub(v) {
        if (v instanceof Vector) {
            this.x -= v.x;
            this.y -= v.y;
        } else {
            this.x -= v;
            this.y -= v;
        }
        return this;
    }

    mult(v) {
        if (v instanceof Vector) {
            this.x *= v.x;
            this.y *= v.y;
        } else {
            this.x *= v;
            this.y *= v;
        }
        return this;
    }

    divide(v) {
        if (v instanceof Vector) {
            if (v.x != 0) this.x /= v.x;
            if (v.y != 0) this.y /= v.y;
        } else {
            if (v != 0) {
                this.x /= v;
                this.y /= v;
            }
        }
        return this;
    }

    normalize() {
        return this.divide(this.mag());
    }

    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    mag() {
        return Math.sqrt(this.dot(this));
    }

    copy() {
        return new Vector(this.x, this.y);
    }
}