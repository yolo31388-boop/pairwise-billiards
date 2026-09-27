
const { Ball } = require('../src/physics/ball.js');
const { Cushion } = require('../src/physics/cushion.js');
const { ballBallCollision, checkPocket } = require('../src/physics/collision.js');

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
    const b2 = new Ball(5, 0, 2);
    const b3 = new Ball(10, 0, 2);
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
    const b2 = new Ball(3, 3, 2);
    ballBallCollision(b1, b2);
    expect(b2.vx).toBeGreaterThan(0);
    expect(b2.vy).toBeGreaterThan(0);
  });
});
