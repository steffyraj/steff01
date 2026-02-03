const GRID_SIZE = 20;
const TICK_MS = 140;

const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

function positionKey(pos) {
  return `${pos.x},${pos.y}`;
}

function spawnFood(snake, rng = Math.random) {
  const occupied = new Set(snake.map(positionKey));
  const free = [];
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const key = `${x},${y}`;
      if (!occupied.has(key)) {
        free.push({ x, y });
      }
    }
  }
  if (free.length === 0) {
    return null;
  }
  const idx = Math.floor(rng() * free.length);
  return free[idx];
}

function createInitialState(rng = Math.random) {
  const mid = Math.floor(GRID_SIZE / 2);
  const snake = [
    { x: mid + 1, y: mid },
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
  ];
  return {
    snake,
    dir: "right",
    pendingDir: null,
    food: spawnFood(snake, rng),
    score: 0,
    gameOver: false,
    message: "",
  };
}

function step(state, rng = Math.random) {
  if (state.gameOver) {
    return state;
  }

  const dir = state.pendingDir || state.dir;
  const move = DIRS[dir];
  const head = state.snake[0];
  const nextHead = { x: head.x + move.x, y: head.y + move.y };

  const hitWall =
    nextHead.x < 0 ||
    nextHead.x >= GRID_SIZE ||
    nextHead.y < 0 ||
    nextHead.y >= GRID_SIZE;

  if (hitWall) {
    return { ...state, gameOver: true, message: "Game over. Hit a wall." };
  }

  const willEat =
    state.food && nextHead.x === state.food.x && nextHead.y === state.food.y;

  const nextSnake = [nextHead, ...state.snake];
  if (!willEat) {
    nextSnake.pop();
  }

  const bodySet = new Set(nextSnake.slice(1).map(positionKey));
  if (bodySet.has(positionKey(nextHead))) {
    return { ...state, gameOver: true, message: "Game over. Hit yourself." };
  }

  let nextFood = state.food;
  let nextScore = state.score;
  let message = state.message;

  if (willEat) {
    nextScore += 1;
    nextFood = spawnFood(nextSnake, rng);
    if (!nextFood) {
      return {
        ...state,
        snake: nextSnake,
        score: nextScore,
        gameOver: true,
        message: "You win. Board full.",
      };
    }
  }

  return {
    ...state,
    snake: nextSnake,
    dir,
    pendingDir: null,
    food: nextFood,
    score: nextScore,
    message,
  };
}

function canChangeDirection(current, next) {
  if (!DIRS[next]) {
    return false;
  }
  return OPPOSITE[current] !== next;
}

const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restart");
const controlButtons = Array.from(document.querySelectorAll("[data-dir]"));

const cells = [];
for (let y = 0; y < GRID_SIZE; y += 1) {
  for (let x = 0; x < GRID_SIZE; x += 1) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.setAttribute("role", "gridcell");
    boardEl.appendChild(cell);
    cells.push(cell);
  }
}

function render(state) {
  cells.forEach((cell) => {
    cell.classList.remove("snake", "head", "food");
  });

  state.snake.forEach((segment, index) => {
    const idx = segment.y * GRID_SIZE + segment.x;
    const cell = cells[idx];
    if (!cell) {
      return;
    }
    cell.classList.add("snake");
    if (index === 0) {
      cell.classList.add("head");
    }
  });

  if (state.food) {
    const foodIdx = state.food.y * GRID_SIZE + state.food.x;
    const foodCell = cells[foodIdx];
    if (foodCell) {
      foodCell.classList.add("food");
    }
  }

  scoreEl.textContent = state.score.toString();
  statusEl.textContent = state.gameOver
    ? `${state.message} Press Restart.`
    : "";
}

let gameState = createInitialState();
render(gameState);

let timer = setInterval(() => {
  gameState = step(gameState);
  render(gameState);
}, TICK_MS);

function setDirection(nextDir) {
  const current = gameState.pendingDir || gameState.dir;
  if (canChangeDirection(current, nextDir)) {
    gameState = { ...gameState, pendingDir: nextDir };
  }
}

function restart() {
  gameState = createInitialState();
  render(gameState);
}

function handleKey(event) {
  const key = event.key.toLowerCase();
  if (key === "arrowup" || key === "w") {
    setDirection("up");
  } else if (key === "arrowdown" || key === "s") {
    setDirection("down");
  } else if (key === "arrowleft" || key === "a") {
    setDirection("left");
  } else if (key === "arrowright" || key === "d") {
    setDirection("right");
  } else if (key === "r" || key === "enter") {
    restart();
  }
}

document.addEventListener("keydown", handleKey);

controlButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const dir = button.getAttribute("data-dir");
    if (dir) {
      setDirection(dir);
    }
  });
});

restartBtn.addEventListener("click", restart);
