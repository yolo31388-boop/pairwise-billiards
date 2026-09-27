const BALL_RESTITUTION = 0.95; // 球间碰撞恢复系数 (< 1)

// 球-球碰撞：同时修正两球的位置与速度
// 速度：基于动量守恒 + 恢复系数的冲量（等质量）
// 位置：两球各退一半，消除嵌入
function ballBallCollision(b1, b2) {
  const dx = b2.x - b1.x;
  const dy = b2.y - b1.y;
  const dist = Math.hypot(dx, dy);
  const minDist = b1.radius + b2.radius;
  if (dist >= minDist) return;

  let nx, ny;
  if (dist === 0) {
    nx = 1; ny = 0;
  } else {
    nx = dx / dist; ny = dy / dist;
  }

  // 位置分离：两球各承担一半嵌入量
  const overlap = dist === 0 ? minDist : minDist - dist;
  b1.x -= nx * overlap / 2;
  b1.y -= ny * overlap / 2;
  b2.x += nx * overlap / 2;
  b2.y += ny * overlap / 2;

  // 冲量响应：仅当两球相互接近时
  const dvx = b1.vx - b2.vx;
  const dvy = b1.vy - b2.vy;
  const vn = dvx * nx + dvy * ny;
  if (vn > 0) {
    const impulse = (1 + BALL_RESTITUTION) * vn / 2;
    b1.vx -= impulse * nx;
    b1.vy -= impulse * ny;
    b2.vx += impulse * nx;
    b2.vy += impulse * ny;
  }
}

// 入袋判定：整球越过袋口边缘才算入袋，不能只看球心
function checkPocket(ball, pockets) {
  for (const p of pockets) {
    const dx = ball.x - p.x;
    const dy = ball.y - p.y;
    if (Math.hypot(dx, dy) + ball.radius <= p.radius) return true;
  }
  return false;
}

module.exports = { ballBallCollision, checkPocket, BALL_RESTITUTION };
