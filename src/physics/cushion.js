class Cushion {
  constructor(x1, y1, x2, y2) {
    this.x1 = x1; this.y1 = y1;
    this.x2 = x2; this.y2 = y2;
    this.restitution = 0.8;   // 恢复系数，必须 < 1
    this.spinTransfer = 0.3;  // 侧旋转化为切向速度的比例
  }

  // 基于冲量的库边碰撞：法线方向反射并乘恢复系数，切线方向保留；
  // 位置只分离到库边外，不因此改变速度。
  collide(ball) {
    const dx = this.x2 - this.x1, dy = this.y2 - this.y1;
    const len2 = dx * dx + dy * dy;
    let t = len2 > 0 ? ((ball.x - this.x1) * dx + (ball.y - this.y1) * dy) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    const cx = this.x1 + t * dx, cy = this.y1 + t * dy;

    let nx = ball.x - cx, ny = ball.y - cy;
    const dist = Math.hypot(nx, ny);
    if (dist >= ball.radius) return false; // 未接触

    if (dist === 0) {
      const len = Math.sqrt(len2) || 1;
      nx = -dy / len; ny = dx / len;
    } else {
      nx /= dist; ny /= dist;
    }

    // 位置分离：精确推到库边外（恰好接触），不增加速度
    ball.x = cx + nx * ball.radius;
    ball.y = cy + ny * ball.radius;

    // 冲量响应：仅在球压向库边时作用
    const vn = ball.vx * nx + ball.vy * ny;
    if (vn < 0) {
      const tx = -ny, ty = nx;
      const vt = ball.vx * tx + ball.vy * ty;
      // 侧旋转化为切向速度，同时旋转自身损耗
      const vt2 = vt + ball.spin * this.spinTransfer;
      ball.spin *= (1 - this.spinTransfer);
      const vn2 = -this.restitution * vn;
      ball.vx = vn2 * nx + vt2 * tx;
      ball.vy = vn2 * ny + vt2 * ty;
    }
    return true;
  }
}

module.exports = { Cushion };
