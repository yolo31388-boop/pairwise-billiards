const MAX_RESTITUTION = 0.98; // 恢复系数必须小于 1
const SPIN_THROW = 0.15;      // 侧旋转化为切线反弹速度的系数
const SPIN_RETAIN = 0.5;      // 碰撞后保留的旋转比例

class Cushion {
  constructor(x1, y1, x2, y2) {
    this.x1 = x1; this.y1 = y1;
    this.x2 = x2; this.y2 = y2;
    this.restitution = 0.8;
  }

  collide(ball) {
    const dx = this.x2 - this.x1;
    const dy = this.y2 - this.y1;
    const len = Math.hypot(dx, dy);
    if (len === 0) return;

    // 法线指向球所在一侧
    let nx = -dy / len;
    let ny = dx / len;
    const side = (ball.x - this.x1) * nx + (ball.y - this.y1) * ny;
    if (side < 0) { nx = -nx; ny = -ny; }
    const dist = Math.abs(side);

    // 只有嵌入（或接触）库边时才响应
    if (dist >= ball.radius) return;

    const e = Math.min(Math.max(this.restitution, 0), MAX_RESTITUTION);
    const keBefore = ball.vx * ball.vx + ball.vy * ball.vy;

    // 冲量响应：法线方向速度反射并乘以恢复系数 e (< 1)，切线方向保留
    const vn = ball.vx * nx + ball.vy * ny;
    if (vn < 0) {
      ball.vx -= (1 + e) * vn * nx;
      ball.vy -= (1 + e) * vn * ny;
    }

    // 侧旋影响反弹：旋转部分转化为切线速度，改变反弹角度
    if (ball.spin !== 0) {
      const tx = -ny;
      const ty = nx;
      ball.vx += tx * ball.spin * SPIN_THROW;
      ball.vy += ty * ball.spin * SPIN_THROW;
      ball.spin *= SPIN_RETAIN;
    }

    // 能量守卫：碰撞后总动能不得增加
    const keAfter = ball.vx * ball.vx + ball.vy * ball.vy;
    if (keAfter > keBefore && keAfter > 0) {
      const scale = Math.sqrt(keBefore / keAfter);
      ball.vx *= scale;
      ball.vy *= scale;
    }

    // 位置分离：沿法线把球推出到刚好接触库边（分离到库边外），
    // 只修位置、不因此改变速度
    const penetration = ball.radius - dist;
    ball.x += nx * penetration;
    ball.y += ny * penetration;
  }
}

module.exports = { Cushion };
