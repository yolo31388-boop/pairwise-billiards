
class Cushion {
  constructor(x1, y1, x2, y2) { this.x1=x1; this.y1=y1; this.x2=x2; this.y2=y2; this.restitution = 0.8; }
  collide(ball) {
    // BUG: 位置修正导致速度增益
    const dx = this.x2 - this.x1, dy = this.y2 - this.y1;
    const len = Math.sqrt(dx*dx+dy*dy);
    const nx = -dy/len, ny = dx/len;
    const dot = ball.vx*nx + ball.vy*ny;
    ball.vx -= 2*dot*nx*this.restitution;
    ball.vy -= 2*dot*ny*this.restitution;
    ball.x += nx * 2;
    ball.y += ny * 2;
  }
}

module.exports = { Cushion };
