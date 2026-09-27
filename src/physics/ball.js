// 速度/旋转限制与台呢摩擦参数
const MAX_SPEED = 100;        // 速度上限
const MIN_SPEED = 0.05;       // 速度下限，低于此值停止运动
const FRICTION_DECEL = 2.0;   // 台呢滚动摩擦减速度（单位/秒^2），方向与相对速度相反
const SPIN_DECAY_RATE = 0.8;  // 旋转随时间的衰减率
const MIN_SPIN = 0.01;        // 旋转下限，低于此值归零
const CURVE_FACTOR = 0.05;    // 侧旋（Magnus 效应）对轨迹的弯曲系数

class Ball {
  constructor(x, y, radius) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.radius = radius;
    this.spin = 0;
    this.prevX = x; this.prevY = y;
  }

  // 击球：赋予初速度（可选旋转，正为侧旋方向之一，负为相反）
  hit(vx, vy, spin = 0) {
    this.vx = vx;
    this.vy = vy;
    this.spin = spin;
  }

  update(dt) {
    this.prevX = this.x;
    this.prevY = this.y;

    // 速度上限
    let speed = Math.hypot(this.vx, this.vy);
    if (speed > MAX_SPEED) {
      const scale = MAX_SPEED / speed;
      this.vx *= scale;
      this.vy *= scale;
      speed = MAX_SPEED;
    }

    // 台呢摩擦：基于球与台呢的相对速度（台呢静止，即球速向量），
    // 减速度方向与相对速度相反、大小随 dt 缩放，且不会使速度反向
    if (speed > 0) {
      const decel = Math.min(FRICTION_DECEL * dt, speed);
      this.vx -= (this.vx / speed) * decel;
      this.vy -= (this.vy / speed) * decel;
    }

    // 侧旋产生 Magnus 力，使运动轨迹弯曲
    speed = Math.hypot(this.vx, this.vy);
    if (speed > 0 && this.spin !== 0) {
      const px = -this.vy / speed;
      const py = this.vx / speed;
      const accel = CURVE_FACTOR * this.spin * speed;
      this.vx += px * accel * dt;
      this.vy += py * accel * dt;
    }

    // 旋转随时间衰减
    this.spin *= Math.exp(-SPIN_DECAY_RATE * dt);
    if (Math.abs(this.spin) < MIN_SPIN) this.spin = 0;

    // 速度下限：低于阈值停止运动
    speed = Math.hypot(this.vx, this.vy);
    if (speed < MIN_SPEED) {
      this.vx = 0;
      this.vy = 0;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
}

module.exports = { Ball, MAX_SPEED, MIN_SPEED, FRICTION_DECEL };
