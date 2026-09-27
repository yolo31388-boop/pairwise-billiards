const { Ball, MAX_SPEED } = require('../src/physics/ball.js');
const { Cushion } = require('../src/physics/cushion.js');
const { ballBallCollision, checkPocket, BALL_RESTITUTION } = require('../src/physics/collision.js');

const ke = (b) => b.vx * b.vx + b.vy * b.vy;

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
    const b2 = new Ball(3, 0, 2); b2.vx = 0;
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
    const b2 = new Ball(3.5, 0, 2);
    const b3 = new Ball(7, 0, 2);
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
    const b2 = new Ball(3.5, 0, 2);
    const b3 = new Ball(0, 3.5, 2); b3.vy = 5;
    ballBallCollision(b1, b2);
    ballBallCollision(b3, b1);
    expect(b1.vx).toBeDefined();
  });
  test('碰撞后角度正确', () => {
    const b1 = new Ball(0, 0, 2); b1.vx = 5; b1.vy = 0;
    const b2 = new Ball(2.5, 2.5, 2);
    ballBallCollision(b1, b2);
    expect(b2.vx).toBeGreaterThan(0);
    expect(b2.vy).toBeGreaterThan(0);
  });
});

describe('物理不变量（新增）', () => {
  test('库边碰撞后总动能不增加（含旋转）', () => {
    const ball = new Ball(9, 5, 2);
    ball.vx = 6;
    ball.spin = 20;
    const cushion = new Cushion(10, 0, 10, 10);
    const before = ke(ball);
    cushion.collide(ball);
    expect(ke(ball)).toBeLessThanOrEqual(before + 1e-9);
  });
  test('法线速度按恢复系数精确反射，切线速度保留', () => {
    const ball = new Ball(9, 5, 2);
    ball.vx = 4; ball.vy = 3;
    const cushion = new Cushion(10, 0, 10, 10);
    cushion.collide(ball);
    expect(ball.vx).toBeCloseTo(-0.8 * 4, 10);
    expect(ball.vy).toBeCloseTo(3, 10);
  });
  test('位置分离后球不嵌入库边', () => {
    const ball = new Ball(9, 5, 2);
    ball.vx = 5;
    const cushion = new Cushion(10, 0, 10, 10);
    cushion.collide(ball);
    expect(10 - ball.x).toBeCloseTo(2, 10);
    expect(ball.x).toBeLessThan(10);
  });
  test('位置修正本身不产生速度', () => {
    const ball = new Ball(9, 5, 2);
    ball.vx = 0; ball.vy = 5;
    const cushion = new Cushion(10, 0, 10, 10);
    cushion.collide(ball);
    expect(Math.hypot(ball.vx, ball.vy)).toBeCloseTo(5, 10);
  });
  test('恢复系数被钳制在 1 以下', () => {
    const ball = new Ball(9, 5, 2);
    ball.vx = 10;
    const cushion = new Cushion(10, 0, 10, 10);
    cushion.restitution = 1.5;
    cushion.collide(ball);
    expect(Math.abs(ball.vx)).toBeLessThan(10);
  });
  test('球-球碰撞后两球位置分离', () => {
    const b1 = new Ball(0, 0, 2); b1.vx = 5;
    const b2 = new Ball(3, 0, 2);
    ballBallCollision(b1, b2);
    expect(Math.hypot(b2.x - b1.x, b2.y - b1.y)).toBeGreaterThanOrEqual(4 - 1e-9);
  });
  test('球-球碰撞恢复系数：分离速度 = e × 接近速度', () => {
    const b1 = new Ball(0, 0, 2); b1.vx = 6;
    const b2 = new Ball(3, 0, 2);
    ballBallCollision(b1, b2);
    expect(b2.vx - b1.vx).toBeCloseTo(BALL_RESTITUTION * 6, 10);
  });
  test('相向而行时动量守恒', () => {
    const b1 = new Ball(0, 0, 2); b1.vx = 4;
    const b2 = new Ball(3, 0, 2); b2.vx = -2;
    ballBallCollision(b1, b2);
    expect(b1.vx + b2.vx).toBeCloseTo(2, 10);
  });
  test('侧旋改变库边反弹角度', () => {
    const noSpin = new Ball(9, 5, 2); noSpin.vx = 5;
    const withSpin = new Ball(9, 5, 2); withSpin.vx = 5; withSpin.spin = 10;
    const c1 = new Cushion(10, 0, 10, 10);
    const c2 = new Cushion(10, 0, 10, 10);
    c1.collide(noSpin);
    c2.collide(withSpin);
    expect(noSpin.vy).toBeCloseTo(0, 10);
    expect(withSpin.vy).not.toBeCloseTo(0, 5);
    expect(Math.atan2(withSpin.vy, withSpin.vx)).not.toBeCloseTo(Math.atan2(noSpin.vy, noSpin.vx), 5);
  });
  test('旋转随时间衰减', () => {
    const ball = new Ball(0, 0, 2);
    ball.spin = 10;
    ball.update(0.1);
    expect(Math.abs(ball.spin)).toBeLessThan(10);
    for (let i = 0; i < 50; i++) ball.update(0.1);
    expect(Math.abs(ball.spin)).toBeLessThan(0.2);
  });
  test('侧旋使运动轨迹弯曲', () => {
    const ball = new Ball(0, 0, 2);
    ball.vx = 5;
    ball.spin = 10;
    ball.update(0.1);
    expect(ball.vy).toBeGreaterThan(0);
  });
  test('摩擦减速度随 dt 缩放且方向与相对速度相反', () => {
    const a = new Ball(0, 0, 2); a.vx = 10;
    const b = new Ball(0, 0, 2); b.vx = 10;
    a.update(0.1);
    b.update(0.2);
    expect(b.vx).toBeLessThan(a.vx);
    const c = new Ball(0, 0, 2); c.vx = 6; c.vy = 8;
    c.update(0.1);
    expect(c.vy / c.vx).toBeCloseTo(8 / 6, 10);
    expect(Math.hypot(c.vx, c.vy)).toBeLessThan(10);
  });
  test('摩擦不会使速度反向', () => {
    const ball = new Ball(0, 0, 2);
    ball.vx = 0.1;
    ball.update(1);
    expect(ball.vx).toBeGreaterThanOrEqual(0);
    expect(ball.vx).toBe(0);
  });
  test('入袋判定要求整球越过袋口边缘', () => {
    const pockets = [{ x: 0, y: 0, radius: 5 }];
    // 球心在袋口半径内但整体未越过边缘 → 不入袋
    expect(checkPocket(new Ball(4, 0, 2), pockets)).toBe(false);
    // 部分压在边缘上 → 不入袋
    expect(checkPocket(new Ball(3.5, 0, 2), pockets)).toBe(false);
    // 整球越过袋口边缘 → 入袋
    expect(checkPocket(new Ball(3, 0, 2), pockets)).toBe(true);
    // 远离袋口 → 不入袋
    expect(checkPocket(new Ball(20, 0, 2), pockets)).toBe(false);
  });
  test('速度上限精确钳制', () => {
    const ball = new Ball(0, 0, 2);
    ball.vx = 1000;
    ball.update(0.1);
    expect(Math.hypot(ball.vx, ball.vy)).toBeLessThanOrEqual(MAX_SPEED);
    expect(ball.vx).toBeGreaterThan(99);
  });
  test('速度低于下限时停止运动', () => {
    const ball = new Ball(0, 0, 2);
    ball.vx = 0.01;
    ball.update(0.016);
    expect(ball.vx).toBe(0);
    expect(ball.vy).toBe(0);
  });
  test('连续碰撞：球同时接触库边与另一球，能量不增且最终分离', () => {
    const cushion = new Cushion(10, 0, 10, 10);
    const a = new Ball(8.5, 5, 2); a.vx = 6;
    const b = new Ball(5.5, 5, 2); b.vx = 6;
    const keBefore = ke(a) + ke(b);
    for (let i = 0; i < 30; i++) {
      ballBallCollision(a, b);
      cushion.collide(a);
    }
    expect(ke(a) + ke(b)).toBeLessThanOrEqual(keBefore + 1e-9);
    expect(10 - a.x).toBeGreaterThanOrEqual(2 - 1e-9);
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeGreaterThanOrEqual(4 - 1e-6);
  });
  test('多球同时碰撞总动量守恒', () => {
    const b1 = new Ball(0, 0, 2); b1.vx = 5;
    const b2 = new Ball(3, 0, 2);
    const b3 = new Ball(6, 0, 2); b3.vx = -1;
    const before = b1.vx + b2.vx + b3.vx;
    ballBallCollision(b1, b2);
    ballBallCollision(b2, b3);
    ballBallCollision(b1, b3);
    expect(b1.vx + b2.vx + b3.vx).toBeCloseTo(before, 10);
  });
  test('45° 碰撞后目标球沿法线方向运动，母球保留切线速度', () => {
    const b1 = new Ball(0, 0, 2); b1.vx = 5;
    const b2 = new Ball(2.5, 2.5, 2);
    ballBallCollision(b1, b2);
    expect(b2.vx).toBeCloseTo(b2.vy, 10);
    expect(b2.vx).toBeGreaterThan(0);
    expect(b1.vy - b1.vx).toBeCloseTo(-5, 10);
  });
  test('hit() 赋予初速度与旋转', () => {
    const ball = new Ball(0, 0, 2);
    ball.hit(3, 4, 7);
    expect(ball.vx).toBe(3);
    expect(ball.vy).toBe(4);
    expect(ball.spin).toBe(7);
  });
});
