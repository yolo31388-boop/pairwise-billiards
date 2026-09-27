const { Ball, MAX_SPEED } = require('../src/physics/ball.js');
const { Cushion } = require('../src/physics/cushion.js');
const { ballBallCollision, checkPocket, resolveCollisions } = require('../src/physics/collision.js');

describe('台球物理', () => {
  test('库边碰撞能量减少', () => {
    const ball = new Ball(5, 5, 2);
    ball.vx = 10;
    const cushion = new Cushion(10, 0, 10, 10);
    ball.x = 9;
    cushion.collide(ball);
    expect(Math.abs(ball.vx)).toBeLessThan(10);
  });
  test('恢复系数应用', () => {
    const ball = new Ball(5, 5, 2);
    ball.vx = 10;
    const cushion = new Cushion(10, 0, 10, 10);
    cushion.restitution = 0.5;
    ball.x = 9;
    cushion.collide(ball);
    expect(Math.abs(ball.vx)).toBeCloseTo(5, 0);
  });
  test('位置分离不增速', () => {
    const ball = new Ball(5, 5, 2);
    ball.vx = 0;
    const cushion = new Cushion(10, 0, 10, 10);
    ball.x = 9;
    cushion.collide(ball);
    expect(Math.abs(ball.vx)).toBe(0);
  });
  test('球间碰撞动量守恒', () => {
    const b1 = new Ball(0, 0, 2); b1.vx = 5;
    const b2 = new Ball(5, 0, 2); b2.vx = 0;
    const before = b1.vx + b2.vx;
    ballBallCollision(b1, b2);
    expect(b1.vx + b2.vx).toBeCloseTo(before, 1);
  });
  test('旋转影响反弹', () => {
    const ball = new Ball(5, 5, 2);
    ball.spin = 10;
    ball.vx = 5;
    const cushion = new Cushion(10, 0, 10, 10);
    ball.x = 9;
    cushion.collide(ball);
    expect(ball.vy).not.toBe(0);
  });
  test('摩擦力计算', () => {
    const ball = new Ball(0, 0, 2);
    ball.vx = 10;
    ball.update(1);
    expect(ball.vx).toBeLessThan(10);
  });
  test('入袋判定', () => {
    const ball = new Ball(0, 0, 2);
    const pockets = [{x:0, y:0, radius:5}];
    expect(checkPocket(ball, pockets)).toBe(true);
  });
  test('连续碰撞处理', () => {
    const b1 = new Ball(0, 0, 2); b1.vx = 10;
    const b2 = new Ball(3, 0, 2);
    const b3 = new Ball(6, 0, 2);
    ballBallCollision(b1, b2);
    ballBallCollision(b2, b3);
    expect(b3.vx).toBeGreaterThan(0);
  });
  test('速度上下限', () => {
    const ball = new Ball(0, 0, 2);
    ball.vx = 1000;
    ball.update(0.1);
    expect(ball.vx).toBeLessThanOrEqual(100);
  });
  test('摩擦衰减速度', () => {
    const ball = new Ball(0, 0, 2);
    ball.vx = 10;
    for (let i = 0; i < 100; i++) ball.update(0.1);
    expect(Math.abs(ball.vx)).toBeLessThan(0.1);
  });
  test('多球同时碰撞', () => {
    const b1 = new Ball(0, 0, 2); b1.vx = 5;
    const b2 = new Ball(4, 0, 2);
    const b3 = new Ball(0, 4, 2); b3.vy = 5;
    ballBallCollision(b1, b2);
    ballBallCollision(b3, b1);
    expect(b1.vx).toBeDefined();
  });
  test('碰撞后角度正确', () => {
    const b1 = new Ball(0, 0, 2); b1.vx = 5; b1.vy = 0;
    const b2 = new Ball(2, 2, 2);
    ballBallCollision(b1, b2);
    expect(b2.vx).toBeGreaterThan(0);
    expect(b2.vy).toBeGreaterThan(0);
  });
});

describe('物理不变量（新增）', () => {
  const ke = (b) => 0.5 * (b.vx * b.vx + b.vy * b.vy);

  test('库边碰撞总动能不增加（含旋转）', () => {
    const ball = new Ball(9, 5, 2);
    ball.vx = 5; ball.spin = 10;
    const cushion = new Cushion(10, 0, 10, 10);
    const before = ke(ball) + 0.5 * ball.spin * ball.spin;
    cushion.collide(ball);
    const after = ke(ball) + 0.5 * ball.spin * ball.spin;
    expect(after).toBeLessThanOrEqual(before + 1e-9);
  });
  test('恢复系数精确：法线缩放、切线保留', () => {
    const ball = new Ball(9, 5, 2);
    ball.vx = 10; ball.vy = 4;
    const cushion = new Cushion(10, 0, 10, 10);
    cushion.restitution = 0.6;
    cushion.collide(ball);
    expect(ball.vx).toBeCloseTo(-6, 6);
    expect(ball.vy).toBeCloseTo(4, 6);
  });
  test('位置分离到库边外且不嵌入', () => {
    const ball = new Ball(9, 5, 2);
    ball.vx = 3;
    const cushion = new Cushion(10, 0, 10, 10);
    cushion.collide(ball);
    expect(10 - ball.x).toBeGreaterThanOrEqual(2 - 1e-9);
  });
  test('重复调用碰撞不增速（幂等）', () => {
    const ball = new Ball(9, 5, 2);
    ball.vx = 10;
    const cushion = new Cushion(10, 0, 10, 10);
    cushion.collide(ball);
    const vx1 = ball.vx, vy1 = ball.vy;
    cushion.collide(ball);
    expect(ball.vx).toBeCloseTo(vx1, 9);
    expect(ball.vy).toBeCloseTo(vy1, 9);
    expect(ke(ball)).toBeLessThanOrEqual(0.5 * 100 + 1e-9);
  });
  test('球间碰撞动量守恒（重叠且对向）', () => {
    const b1 = new Ball(0, 0, 2); b1.vx = 6;
    const b2 = new Ball(3, 0, 2); b2.vx = -2;
    ballBallCollision(b1, b2);
    expect(b1.vx + b2.vx).toBeCloseTo(4, 9);
  });
  test('球间碰撞动能不增加且位置分离', () => {
    const b1 = new Ball(0, 0, 2); b1.vx = 6;
    const b2 = new Ball(3, 0, 2); b2.vx = -2;
    const before = ke(b1) + ke(b2);
    ballBallCollision(b1, b2);
    expect(ke(b1) + ke(b2)).toBeLessThanOrEqual(before + 1e-9);
    expect(Math.hypot(b2.x - b1.x, b2.y - b1.y)).toBeGreaterThanOrEqual(4 - 1e-9);
  });
  test('对心碰撞速度传递：停球获得大部分速度', () => {
    const b1 = new Ball(0, 0, 2); b1.vx = 10;
    const b2 = new Ball(3, 0, 2);
    ballBallCollision(b1, b2);
    expect(b2.vx).toBeGreaterThan(9);
    expect(Math.abs(b1.vx)).toBeLessThan(1);
  });
  test('侧旋方向决定反弹偏转方向', () => {
    const mk = (s) => { const b = new Ball(9, 5, 2); b.vx = 5; b.spin = s; return b; };
    const c = new Cushion(10, 0, 10, 10);
    const up = mk(10), down = mk(-10);
    c.collide(up); c.collide(down);
    expect(up.vy).not.toBeCloseTo(0, 6);
    expect(Math.sign(up.vy)).toBe(-Math.sign(down.vy));
  });
  test('上旋加速、下旋减速（相对同速无旋转球）', () => {
    const top = new Ball(0, 0, 2); top.hit(5, 0, 0, 10);
    const back = new Ball(0, 0, 2); back.hit(5, 0, 0, -10);
    top.update(0.1); back.update(0.1);
    expect(top.vx).toBeGreaterThan(back.vx);
  });
  test('摩擦基于相对速度：方向保持且等速减', () => {
    const b1 = new Ball(0, 0, 2); b1.vx = 6; b1.vy = 8;
    const b2 = new Ball(0, 0, 2); b2.vx = 20;
    b1.update(0.5); b2.update(0.5);
    expect(b1.vy / b1.vx).toBeCloseTo(8 / 6, 6);
    expect(20 - b2.vx).toBeCloseTo(10 - Math.hypot(b1.vx, b1.vy), 6);
  });
  test('摩擦不会使速度反向', () => {
    const ball = new Ball(0, 0, 2);
    ball.vx = 0.1;
    ball.update(1);
    expect(ball.vx).toBe(0);
  });
  test('入袋判定：整体越过袋口边缘才算', () => {
    const pockets = [{ x: 0, y: 0, radius: 5 }];
    const inside = new Ball(2.9, 0, 2);
    const edge = new Ball(4, 0, 2); // 球心在袋口内但球整体未越过边缘
    expect(checkPocket(inside, pockets)).toBe(true);
    expect(checkPocket(edge, pockets)).toBe(false);
  });
  test('连续碰撞：同时碰库边和球，能量不增且分离', () => {
    const a = new Ball(9, 5, 2); a.vx = 10;
    const b = new Ball(6.5, 5, 2);
    const cushion = new Cushion(10, 0, 10, 10);
    const before = ke(a) + ke(b);
    resolveCollisions([a, b], [cushion]);
    expect(ke(a) + ke(b)).toBeLessThanOrEqual(before + 1e-9);
    expect(10 - a.x).toBeGreaterThanOrEqual(2 - 1e-6);
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeGreaterThanOrEqual(4 - 1e-6);
  });
  test('速度上限截断、下限停止', () => {
    const fast = new Ball(0, 0, 2);
    fast.vx = 1000;
    fast.update(0.1);
    expect(Math.hypot(fast.vx, fast.vy)).toBeLessThanOrEqual(MAX_SPEED);
    const slow = new Ball(0, 0, 2);
    slow.vx = 0.04;
    slow.update(0.1);
    expect(slow.vx).toBe(0);
    expect(slow.vy).toBe(0);
  });
  test('旋转随时间衰减', () => {
    const ball = new Ball(0, 0, 2);
    ball.vx = 5; ball.spin = 10;
    for (let i = 0; i < 10; i++) ball.update(0.1);
    expect(Math.abs(ball.spin)).toBeLessThan(10);
    expect(Math.abs(ball.spin)).toBeGreaterThan(0);
  });
  test('多球同时碰撞总动量守恒', () => {
    const b1 = new Ball(0, 0, 2); b1.vx = 5;
    const b2 = new Ball(3, 0, 2); b2.vx = 0;
    const b3 = new Ball(6, 0, 2); b3.vx = -1;
    resolveCollisions([b1, b2, b3]);
    expect(b1.vx + b2.vx + b3.vx).toBeCloseTo(4, 6);
  });
  test('库边反弹角度：切向不变、法线按恢复系数缩放', () => {
    const ball = new Ball(9, 5, 2);
    ball.vx = 10; ball.vy = 6;
    const cushion = new Cushion(10, 0, 10, 10);
    cushion.collide(ball);
    expect(ball.vx).toBeCloseTo(-8, 6);
    expect(ball.vy).toBeCloseTo(6, 6);
  });
  test('斜射球间碰撞后两球沿正确方向分离', () => {
    const b1 = new Ball(0, 0, 2); b1.vx = 5;
    const b2 = new Ball(2, 2, 2);
    ballBallCollision(b1, b2);
    expect(b2.vx).toBeGreaterThan(0);
    expect(b2.vy).toBeGreaterThan(0);
    expect(b2.vx).toBeCloseTo(b2.vy, 6); // 45° 方向
  });
});
