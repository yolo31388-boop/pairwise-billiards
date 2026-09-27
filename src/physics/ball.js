
class Ball {
  constructor(x, y, radius) { this.x=x; this.y=y; this.vx=0; this.vy=0; this.radius=radius; this.spin=0; this.prevX=x; this.prevY=y; }
  update(dt) {
    this.prevX=this.x; this.prevY=this.y;
    this.x += this.vx*dt; this.y += this.vy*dt;
    // BUG: 固定摩擦
    this.vx *= 0.99; this.vy *= 0.99;
  }
}

module.exports = { Ball };
