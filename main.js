/** 基础上帝视角城堡战略 Demo
 * - 左侧是玩家城堡，右侧是敌方城堡
 * - 左键点击地图：在玩家城堡附近生成单位
 * - 单位会自动寻路（直线）朝敌方城堡进攻
 * - 敌方会定时生成单位反击
 */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const TILE_SIZE = 40;

// 城堡
const castles = {
  player: {
    x: TILE_SIZE * 2,
    y: HEIGHT / 2,
    hp: 100,
    color: "#4caf50",
  },
  enemy: {
    x: WIDTH - TILE_SIZE * 2,
    y: HEIGHT / 2,
    hp: 100,
    color: "#f44336",
  },
};

const units = [];
const enemyUnits = [];

let lastTime = 0;
let enemySpawnTimer = 0;

function createUnit(isPlayer = true) {
  const castle = isPlayer ? castles.player : castles.enemy;
  const offsetY = (Math.random() - 0.5) * TILE_SIZE * 2;

  unitsArray(isPlayer).push({
    x: castle.x + (isPlayer ? TILE_SIZE : -TILE_SIZE),
    y: castle.y + offsetY,
    radius: 8,
    speed: 60,
    hp: 10,
    isPlayer,
  });
}

function unitsArray(isPlayer) {
  return isPlayer ? units : enemyUnits;
}

// 计算朝目标移动
function moveUnit(unit, dt) {
  const target = unit.isPlayer ? castles.enemy : castles.player;
  const dx = target.x - unit.x;
  const dy = target.y - unit.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const vx = (dx / dist) * unit.speed;
  const vy = (dy / dist) * unit.speed;

  unit.x += vx * dt;
  unit.y += vy * dt;
}

// 碰撞检测（圆与圆）
function isColliding(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < a.radius + b.radius;
}

function update(dt) {
  enemySpawnTimer += dt;
  // 每 3 秒敌方生成一个单位
  if (enemySpawnTimer > 3) {
    enemySpawnTimer = 0;
    createUnit(false);
  }

  // 移动单位
  [...units, ...enemyUnits].forEach((u) => moveUnit(u, dt));

  // 单位互相打架
  for (let i = units.length - 1; i >= 0; i--) {
    for (let j = enemyUnits.length - 1; j >= 0; j--) {
      const a = units[i];
      const b = enemyUnits[j];
      if (isColliding(a, b)) {
        a.hp -= 10 * dt;
        b.hp -= 10 * dt;
      }
    }
  }

  // 单位攻击城堡
  units.forEach((u) => {
    if (distanceToCastle(u, castles.enemy) < u.radius + TILE_SIZE / 2) {
      castles.enemy.hp -= 5 * dt;
    }
  });

  enemyUnits.forEach((u) => {
    if (distanceToCastle(u, castles.player) < u.radius + TILE_SIZE / 2) {
      castles.player.hp -= 5 * dt;
    }
  });

  // 清理死亡单位
  removeDeadUnits(units);
  removeDeadUnits(enemyUnits);

  // 防止血量下到负数
  castles.player.hp = Math.max(0, castles.player.hp);
  castles.enemy.hp = Math.max(0, castles.enemy.hp);
}

function removeDeadUnits(arr) {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i].hp <= 0) arr.splice(i, 1);
  }
}

function distanceToCastle(unit, castle) {
  const dx = unit.x - castle.x;
  const dy = unit.y - castle.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function drawGrid() {
  ctx.strokeStyle = "#232335";
  ctx.lineWidth = 1;

  for (let x = 0; x < WIDTH; x += TILE_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }

  for (let y = 0; y < HEIGHT; y += TILE_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
}

function drawCastle(castle) {
  ctx.fillStyle = castle.color;
  ctx.fillRect(
    castle.x - TILE_SIZE / 2,
    castle.y - TILE_SIZE / 2,
    TILE_SIZE,
    TILE_SIZE
  );

  // 血条
  const barWidth = 80;
  const barHeight = 8;
  const hpRatio = castle.hp / 100;

  ctx.fillStyle = "#333";
  ctx.fillRect(castle.x - barWidth / 2, castle.y - TILE_SIZE, barWidth, barHeight);
  ctx.fillStyle = "#4caf50";
  ctx.fillRect(
    castle.x - barWidth / 2,
    castle.y - TILE_SIZE,
    barWidth * hpRatio,
    barHeight
  );
}

function drawUnit(unit) {
  ctx.beginPath();
  ctx.fillStyle = unit.isPlayer ? "#4caf50" : "#f44336";
  ctx.arc(unit.x, unit.y, unit.radius, 0, Math.PI * 2);
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawGrid();

  drawCastle(castles.player);
  drawCastle(castles.enemy);

  units.forEach(drawUnit);
  enemyUnits.forEach(drawUnit);

  // 游戏结束提示
  if (castles.player.hp <= 0 || castles.enemy.hp <= 0) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#ffffff";
    ctx.font = "36px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(
      castles.player.hp <= 0 ? "你输了…" : "你赢了！",
      WIDTH / 2,
      HEIGHT / 2
    );
  }
}

function loop(timestamp) {
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  if (castles.player.hp > 0 && castles.enemy.hp > 0) {
    update(dt);
  }
  draw();
  requestAnimationFrame(loop);
}

// 点击生成玩家单位
canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;

  // 限制：只有点击在左半边地图时，才算玩家操作
  if (x < WIDTH / 2 && castles.player.hp > 0) {
    createUnit(true);
  }
});

requestAnimationFrame(loop);
