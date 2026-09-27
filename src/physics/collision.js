const DEFAULT_RESTITUTION = 0.95;

// 球间碰撞：等质量两球，基于动量守恒与恢复系数的冲量响应，
// 同时修正两球的速度与位置（重叠各退一半）。
function ballBallCollision(b1, b2, restitution = DEFAULT_RESTITUTION) {
  const dx = b2.x - b1.x, dy = b2.y - b1.y;
  const dist = Math.hypot(dx, dy);
  const minDist = b1.radius + b2.radius;
  if (dist >= minDist || dist === 0) return false;

  const nx = dx / dist, ny = dy / dist;

  // 位置修正：两球各退重叠量的一半
  const overlap = minDist - dist;
  b1.x -= nx * overlap / 2;
  b1.y -= ny * overlap / 2;
  b2.x += nx * overlap / 2;
  b2.y += ny * overlap / 2;

  // 冲量：仅在两球相互接近时作用，动量守恒
  const rvx = b1.vx - b2.vx, rvy = b1.vy - b2.vy;
  const vn = rvx * nx + rvy * ny;
  if (vn > 0) {
    const j = (1 + restitution) * vn / 2;
    b1.vx -= j * nx;
    b1.vy -= j * ny;
    b2.vx += j * nx;
    b2.vy += j * ny;
  }
  return true;
}

// 入袋判定：球整体越过袋口边缘才算入袋，不能只看球心
function checkPocket(ball, pockets) {
  for (const p of pockets) {
    const dx = ball.x - p.x, dy = ball.y - p.y;
    if (Math.sqrt(dx * dx + dy * dy) + ball.radius <= p.radius) return true;
  }
  return false;
}

// 连续/同时碰撞处理：库边与球间接触迭代求解，顺序无关、幂等
function resolveCollisions(balls, cushions = [], iterations = 32) {
  for (let k = 0; k < iterations; k++) {
    let any = false;
    for (const ball of balls) {
      for (const c of cushions) any = c.collide(ball) || any;
    }
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        any = ballBallCollision(balls[i], balls[j]) || any;
      }
    }
    if (!any) break;
  }
}

module.exports = { ballBallCollision, checkPocket, resolveCollisions, DEFAULT_RESTITUTION };
