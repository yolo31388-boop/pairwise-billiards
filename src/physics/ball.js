const MAX_SPEED = 100;
const MIN_SPEED = 0.05;
const CLOTH_FRICTION = 2.0;    // 台呢摩擦减速度 (units/s^2)，方向与相对速度相反
const SPIN_DECAY = 1.2;        // 旋转随时间的衰减率
const CURVE_FACTOR = 0.05;     // 侧旋对轨迹的横向影响（Magnus 效应）
const TOPSPIN_TRANSFER = 0.8;  // 上旋/下旋向前进速度的转化率

class Ball {
  constructor(x, y, radius) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.radius = radius;
    this.spin = 0;     // 侧旋
    this.topSpin = 0;  // 上旋(+) / 下旋(-)
    this.prevX = x; this.prevY = y;
  }

  hit(vx, vy, spin = 0, topSpin = 0) {
    this.vx = vx; this.vy = vy;
    this.spin = spin; this.topSpin = topSpin;
  }

  update(dt) {
    this.prevX = this.x; this.prevY = this.y;

    let speed = Math.hypot(this.vx, this.vy);

    // 侧旋使轨迹横向弯曲，方向垂直于当前速度
    if (speed > 0 && this.spin !== 0) {
      const ax = (-this.vy / speed) * this.spin * CURVE_FACTOR;
      const ay = (this.vx / speed) * this.spin * CURVE_FACTOR;
      this.vx += ax * dt;
      this.vy += ay * dt;
    }

    // 上旋/下旋沿运动方向转化为前进速度（或反向）
    if (this.topSpin !== 0 && speed > 0) {
      const add = this.topSpin * TOPSPIN_TRANSFER * dt;
      this.vx += (this.vx / speed) * add;
      this.vy += (this.vy / speed) * add;
    }

    // 台呢摩擦：基于球与台呢的相对速度，沿相对速度反方向减速（库仑摩擦）
    speed = Math.hypot(this.vx, this.vy);
    if (speed > 0) {
      const newSpeed = Math.max(0, speed - CLOTH_FRICTION * dt);
      const k = newSpeed / speed;
      this.vx *= k;
      this.vy *= k;
    }

    // 旋转随时间衰减
    const decay = Math.exp(-SPIN_DECAY * dt);
    this.spin *= decay;
    this.topSpin *= decay;

    // 速度上下限：超过上限截断，低于下限停止
    speed = Math.hypot(this.vx, this.vy);
    if (speed > MAX_SPEED) {
      const k = MAX_SPEED / speed;
      this.vx *= k;
      this.vy *= k;
    } else if (speed < MIN_SPEED) {
      this.vx = 0;
      this.vy = 0;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
}

module.exports = { Ball, MAX_SPEED, MIN_SPEED, CLOTH_FRICTION };
