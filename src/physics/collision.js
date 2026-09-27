

export function ballBallCollision(b1, b2) {
  // BUG: 不同时修正位置
  const dx = b2.x-b1.x, dy = b2.y-b1.y;
  const dist = Math.sqrt(dx*dx+dy*dy);
  if (dist < b1.radius+b2.radius) {
    const nx = dx/dist, ny = dy/dist;
    const dvx = b1.vx-b2.vx, dvy = b1.vy-b2.vy;
    const dot = dvx*nx+dvy*ny;
    if (dot > 0) {
      b1.vx -= dot*nx; b1.vy -= dot*ny;
      b2.vx += dot*nx; b2.vy += dot*ny;
    }
  }
}

export function checkPocket(ball, pockets) {
  // BUG: 只看球心
  for (const p of pockets) {
    const dx = ball.x-p.x, dy = ball.y-p.y;
    if (Math.sqrt(dx*dx+dy*dy) < p.radius) return true;
  }
  return false;
}

module.exports = { ballBallCollision, checkPocket };
