const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const objectiveText = document.getElementById('objectiveText');
const staminaBar = document.getElementById('staminaBar');
const threatBar = document.getElementById('threatBar');

const keys = {};
const map = {
  width: canvas.width,
  height: canvas.height,
};

const walls = [
  { x: 0, y: 0, w: map.width, h: 24 },
  { x: 0, y: map.height - 24, w: map.width, h: 24 },
  { x: 0, y: 0, w: 24, h: map.height },
  { x: map.width - 24, y: 0, w: 24, h: map.height },

  { x: 116, y: 70, w: 180, h: 18 },
  { x: 110, y: 250, w: 210, h: 18 },
  { x: 140, y: 420, w: 200, h: 18 },

  { x: 360, y: 80, w: 18, h: 120 },
  { x: 360, y: 360, w: 18, h: 150 },
  { x: 520, y: 120, w: 18, h: 210 },
  { x: 680, y: 90, w: 18, h: 180 },
  { x: 710, y: 300, w: 120, h: 18 },
  { x: 660, y: 430, w: 190, h: 18 },

  { x: 620, y: 120, w: 18, h: 120 },
  { x: 710, y: 460, w: 18, h: 90 },
  { x: 510, y: 420, w: 120, h: 18 },
  { x: 520, y: 510, w: 160, h: 18 },
];

const exitDoor = { x: 864, y: 510, w: 56, h: 58 };

const hideSpots = [
  { x: 170, y: 120, w: 46, h: 54, name: 'Locker' },
  { x: 310, y: 470, w: 52, h: 52, name: 'Closet' },
  { x: 740, y: 110, w: 52, h: 52, name: 'Library' },
  { x: 770, y: 435, w: 52, h: 52, name: 'Cabinets' },
];

const collectibles = [
  { x: 320, y: 170, r: 12, name: 'Hall Pass', found: false },
  { x: 745, y: 270, r: 12, name: 'Science Lab Key', found: false },
  { x: 560, y: 190, r: 12, name: 'Gym Code', found: false },
];

const player = {
  x: 70,
  y: 520,
  radius: 16,
  speed: 180,
  sprintBonus: 130,
  stamina: 100,
  maxStamina: 100,
  hiding: false,
  hiddenSpot: null,
  color: '#7dd3fc',
};

const monsters = [
  { x: 700, y: 180, radius: 16, color: '#ef4444', speed: 86, chill: 0 },
  { x: 220, y: 340, radius: 18, color: '#f87171', speed: 94, chill: 0 },
  { x: 620, y: 500, radius: 18, color: '#dc2626', speed: 98, chill: 0 },
];

const state = {
  gameOver: false,
  victory: false,
  threat: 0,
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function circleRectCollision(x, y, radius, rect) {
  const closestX = clamp(x, rect.x, rect.x + rect.w);
  const closestY = clamp(y, rect.y, rect.y + rect.h);
  const dx = x - closestX;
  const dy = y - closestY;
  return dx * dx + dy * dy < radius * radius;
}

function collidesWithWall(x, y, radius) {
  for (const wall of walls) {
    if (circleRectCollision(x, y, radius, wall)) {
      return true;
    }
  }
  return false;
}

function moveEntity(entity, dx, dy, dt) {
  const nextX = entity.x + dx * dt;
  if (!collidesWithWall(nextX, entity.y, entity.radius)) {
    entity.x = nextX;
  }

  const nextY = entity.y + dy * dt;
  if (!collidesWithWall(entity.x, nextY, entity.radius)) {
    entity.y = nextY;
  }
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function findNearbyHideSpot() {
  let nearest = null;
  let bestDist = Infinity;

  for (const spot of hideSpots) {
    const centerX = spot.x + spot.w / 2;
    const centerY = spot.y + spot.h / 2;
    const dist = Math.hypot(player.x - centerX, player.y - centerY);

    if (dist < bestDist) {
      bestDist = dist;
      nearest = spot;
    }
  }

  return nearest && bestDist < 52 ? nearest : null;
}

function toggleHide() {
  if (state.gameOver || state.victory) return;

  if (!player.hiding) {
    const spot = findNearbyHideSpot();
    if (!spot) return;

    player.hiding = true;
    player.hiddenSpot = spot;
    const cx = spot.x + spot.w / 2;
    const cy = spot.y + spot.h / 2;
    player.x = cx;
    player.y = cy;
    objectiveText.textContent = `Hidden in ${spot.name}. Wait for the monsters to pass.`;
    return;
  }

  player.hiding = false;
  player.hiddenSpot = null;
  objectiveText.textContent = 'You are out of hiding. Keep moving!';
}

function collectItems() {
  for (const item of collectibles) {
    if (!item.found && distance(player, item) < player.radius + item.r + 6) {
      item.found = true;
      objectiveText.textContent = `Found: ${item.name}!`;
    }
  }
}

function updateStamina(dt) {
  const sprinting = keys.Shift || keys[' '];

  if (sprinting && !player.hiding && (keys.w || keys.a || keys.s || keys.d || keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight)) {
    player.stamina = clamp(player.stamina - 28 * dt, 0, player.maxStamina);
  } else {
    player.stamina = clamp(player.stamina + 18 * dt, 0, player.maxStamina);
  }

  const staminaRatio = player.stamina / player.maxStamina;
  staminaBar.style.width = `${Math.max(0, staminaRatio * 100)}%`;
}

function updateThreatMeter() {
  let danger = 0;
  for (const monster of monsters) {
    if (distance(player, monster) < 210) {
      danger += Math.max(0, 1 - distance(player, monster) / 210);
    }
  }
  state.threat = clamp(danger * 100, 0, 100);
  threatBar.style.width = `${state.threat}%`;
}

function updatePlayer(dt) {
  if (player.hiding) {
    player.stamina = clamp(player.stamina + 24 * dt, 0, player.maxStamina);
    return;
  }

  let moveX = 0;
  let moveY = 0;

  if (keys.w || keys.ArrowUp) moveY -= 1;
  if (keys.s || keys.ArrowDown) moveY += 1;
  if (keys.a || keys.ArrowLeft) moveX -= 1;
  if (keys.d || keys.ArrowRight) moveX += 1;

  if (moveX !== 0 || moveY !== 0) {
    const length = Math.hypot(moveX, moveY) || 1;
    moveX /= length;
    moveY /= length;
  }

  const sprinting = (keys.Shift || keys[' ']) && player.stamina > 12;
  const speed = player.speed + (sprinting ? player.sprintBonus : 0);

  moveEntity(player, moveX * speed, moveY * speed, dt);
  updateStamina(dt);
}

function updateMonsters(dt) {
  for (const monster of monsters) {
    if (player.hiding) {
      monster.chill += dt;
      const driftX = Math.cos(monster.chill * 1.7) * 18;
      const driftY = Math.sin(monster.chill * 1.3) * 18;
      monster.x += driftX * dt;
      monster.y += driftY * dt;
      if (monster.x < 30) monster.x = 30;
      if (monster.x > map.width - 30) monster.x = map.width - 30;
      if (monster.y < 30) monster.y = 30;
      if (monster.y > map.height - 30) monster.y = map.height - 30;
      continue;
    }

    const dx = player.x - monster.x;
    const dy = player.y - monster.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;

    const speed = monster.speed * (dist < 150 ? 1.2 : 0.8);
    moveEntity(monster, nx * speed, ny * speed, dt);

    if (dist < monster.radius + player.radius + 10) {
      state.gameOver = true;
      objectiveText.textContent = 'The monsters caught you. Restart the page to try again.';
    }
  }
}

function checkVictory() {
  const allCollected = collectibles.every((item) => item.found);
  const atExit = distance(player, { x: exitDoor.x + exitDoor.w / 2, y: exitDoor.y + exitDoor.h / 2 }) < 34;

  if (allCollected && atExit) {
    state.victory = true;
    objectiveText.textContent = 'You escaped the school! You made it out alive.';
  } else if (allCollected) {
    objectiveText.textContent = 'All codes collected. Run to the school exit!';
  }
}

function draw3DWall(wall) {
  const depth = 16;
  const topHeight = 20;

  ctx.fillStyle = '#64748b';
  ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

  ctx.fillStyle = '#475569';
  ctx.fillRect(wall.x + wall.w, wall.y, depth, wall.h);

  ctx.fillStyle = '#334155';
  ctx.fillRect(wall.x, wall.y - topHeight, wall.w + depth, topHeight);

  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(wall.x + 4, wall.y + 4, wall.w - 8, 3);
}

function drawHideSpot(spot) {
  const depth = 12;
  const x = spot.x;
  const y = spot.y;
  const w = spot.w;
  const h = spot.h;

  ctx.fillStyle = '#2dd4bf';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x + w - 10, y + 6, 6, h - 12);

  ctx.fillStyle = '#0f172a';
  ctx.font = '10px Arial';
  ctx.fillText(spot.name, x + 4, y + 16);

  ctx.fillStyle = '#0f766e';
  ctx.fillRect(x + w, y, depth, h);
  ctx.fillStyle = '#14b8a6';
  ctx.fillRect(x, y - 12, w + depth, 12);
}

function drawCollectible(item) {
  if (item.found) return;

  const shadowY = item.y + 14;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
  ctx.beginPath();
  ctx.ellipse(item.x, shadowY, 12, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.moveTo(item.x, item.y - item.r);
  ctx.lineTo(item.x + item.r, item.y);
  ctx.lineTo(item.x, item.y + item.r);
  ctx.lineTo(item.x - item.r, item.y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(item.x - 2, item.y - 8, 4, 14);
}

function drawExitDoor() {
  ctx.fillStyle = '#7c3aed';
  ctx.fillRect(exitDoor.x, exitDoor.y, exitDoor.w, exitDoor.h);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 18px Arial';
  ctx.fillText('EXIT', exitDoor.x + 10, exitDoor.y + 30);

  ctx.fillStyle = '#4c1d95';
  ctx.fillRect(exitDoor.x + exitDoor.w, exitDoor.y, 12, exitDoor.h);
  ctx.fillStyle = '#6d28d9';
  ctx.fillRect(exitDoor.x, exitDoor.y - 12, exitDoor.w + 12, 12);
}

function drawGround() {
  const groundGrad = ctx.createLinearGradient(0, 0, 0, map.height);
  groundGrad.addColorStop(0, '#e2e8f0');
  groundGrad.addColorStop(0.45, '#dfe4ea');
  groundGrad.addColorStop(1, '#94a3b8');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, 0, map.width, map.height);

  for (let i = 0; i < 18; i++) {
    const y = 120 + i * 28;
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.12)';
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(map.width, y + 30);
    ctx.stroke();
  }

  for (let x = 0; x < map.width; x += 60) {
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.08)';
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 60, map.height);
    ctx.stroke();
  }
}

function drawPlayerModel() {
  const x = player.x;
  const y = player.y;

  if (player.hiding) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 16, y - 18, 32, 36);
    return;
  }

  ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
  ctx.beginPath();
  ctx.ellipse(x, y + 16, 18, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(x - 10, y - 14, 20, 20);
  ctx.fillStyle = '#0ea5e9';
  ctx.fillRect(x - 12, y - 14, 24, 6);
  ctx.fillStyle = '#e0f2fe';
  ctx.fillRect(x - 4, y - 8, 8, 8);
}

function drawMonsterModel(monster) {
  ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
  ctx.beginPath();
  ctx.ellipse(monster.x, monster.y + 16, 18, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = monster.color;
  ctx.fillRect(monster.x - 12, monster.y - 16, 24, 20);
  ctx.fillStyle = '#7f1d1d';
  ctx.fillRect(monster.x - 10, monster.y - 4, 6, 6);
  ctx.fillRect(monster.x + 4, monster.y - 4, 6, 6);
}

function drawScene() {
  drawGround();

  for (const wall of walls) {
    draw3DWall(wall);
  }

  for (const spot of hideSpots) {
    drawHideSpot(spot);
  }

  for (const item of collectibles) {
    drawCollectible(item);
  }

  drawExitDoor();

  for (const monster of monsters) {
    drawMonsterModel(monster);
  }

  drawPlayerModel();
}

function drawStatusText() {
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px Arial';
  ctx.fillText(`Codes Found: ${collectibles.filter((item) => item.found).length}/${collectibles.length}`, 30, 42);
}

function render() {
  drawScene();
  drawStatusText();

  if (state.gameOver || state.victory) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    ctx.fillRect(0, 0, map.width, map.height);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(state.victory ? 'ESCAPED!' : 'YOU WERE CAUGHT!', map.width / 2, map.height / 2);
    ctx.font = '18px Arial';
    ctx.fillText('Refresh the page to play again.', map.width / 2, map.height / 2 + 34);
    ctx.textAlign = 'left';
  }
}

let lastTime = 0;
function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000 || 0.016, 0.03);
  lastTime = timestamp;

  if (!state.gameOver && !state.victory) {
    updatePlayer(dt);
    updateMonsters(dt);
    collectItems();
    checkVictory();
    updateThreatMeter();
  }

  render();
  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (event) => {
  const { key } = event;
  keys[key] = true;

  if (key === 'e' || key === 'E') {
    toggleHide();
  }

  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(key)) {
    event.preventDefault();
  }
});

window.addEventListener('keyup', (event) => {
  keys[event.key] = false;
});

requestAnimationFrame(gameLoop);
