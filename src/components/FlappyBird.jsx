import { useEffect, useRef, useCallback, useState } from "react";

// ─── GAME CONSTANTS ───
const GRAVITY = 0.45;
const FLAP_FORCE = -7.5;
const PIPE_WIDTH = 52;
const PIPE_GAP = 140;
const PIPE_SPEED = 2.5;
const PIPE_SPAWN_INTERVAL = 1800;
const BIRD_SIZE = 24;
const GROUND_HEIGHT = 60;
const STAR_COUNT = 60;

const GAME_STATE = { IDLE: 0, PLAYING: 1, GAME_OVER: 2 };

// ─── PIXEL ART DRAWING HELPERS ───
function drawPixelBird(ctx, x, y, size, rotation, flapFrame) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  const s = size / 12; // scale factor

  // Body glow
  ctx.shadowColor = "#32cd32";
  ctx.shadowBlur = 12;

  // Body
  ctx.fillStyle = "#32cd32";
  ctx.fillRect(-5 * s, -4 * s, 10 * s, 8 * s);

  // Head (right side — facing forward)
  ctx.fillStyle = "#3ddc3d";
  ctx.fillRect(2 * s, -5 * s, 4 * s, 6 * s);

  // Eye (white)
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(2 * s, -5 * s, 3 * s, 3 * s);

  // Pupil
  ctx.fillStyle = "#09090b";
  ctx.fillRect(3.5 * s, -4 * s, 1.5 * s, 1.5 * s);

  // Beak (pointing right)
  ctx.fillStyle = "#ffaa00";
  ctx.fillRect(5 * s, -2 * s, 3 * s, 2 * s);
  ctx.fillStyle = "#ff7700";
  ctx.fillRect(5 * s, 0, 3 * s, 1.5 * s);

  // Wing (animated, on the back/left side)
  ctx.fillStyle = "#adff2f";
  const wingY = flapFrame % 2 === 0 ? -1 * s : 1 * s;
  ctx.fillRect(-4 * s, wingY, 4 * s, 4 * s);

  // Tail (left side — trailing behind)
  ctx.fillStyle = "#228b22";
  ctx.fillRect(-7 * s, -3 * s, 2 * s, 3 * s);
  ctx.fillRect(-7 * s, 1 * s, 2 * s, 2 * s);

  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawPixelPipe(ctx, x, topHeight, gap, canvasW, canvasH, groundH) {
  const w = PIPE_WIDTH;
  const bottomY = topHeight + gap;
  const bottomH = canvasH - bottomY - groundH;

  // Pipe body gradient
  const bodyGrad = ctx.createLinearGradient(x, 0, x + w, 0);
  bodyGrad.addColorStop(0, "#145a14");
  bodyGrad.addColorStop(0.3, "#1e8c1e");
  bodyGrad.addColorStop(0.5, "#2ab52a");
  bodyGrad.addColorStop(0.7, "#1e8c1e");
  bodyGrad.addColorStop(1, "#145a14");

  // Pipe cap gradient
  const capGrad = ctx.createLinearGradient(x - 3, 0, x + w + 3, 0);
  capGrad.addColorStop(0, "#0f4f0f");
  capGrad.addColorStop(0.3, "#1a7a1a");
  capGrad.addColorStop(0.5, "#24a524");
  capGrad.addColorStop(0.7, "#1a7a1a");
  capGrad.addColorStop(1, "#0f4f0f");

  // Glow
  ctx.shadowColor = "rgba(50, 205, 50, 0.3)";
  ctx.shadowBlur = 8;

  // Top pipe body
  ctx.fillStyle = bodyGrad;
  ctx.fillRect(x, 0, w, topHeight);

  // Top pipe cap
  ctx.fillStyle = capGrad;
  ctx.fillRect(x - 3, topHeight - 20, w + 6, 24);

  // Top cap highlight
  ctx.fillStyle = "rgba(173, 255, 47, 0.2)";
  ctx.fillRect(x + 4, 0, 6, topHeight - 20);

  // Bottom pipe body
  ctx.fillStyle = bodyGrad;
  ctx.fillRect(x, bottomY, w, bottomH);

  // Bottom pipe cap
  ctx.fillStyle = capGrad;
  ctx.fillRect(x - 3, bottomY - 4, w + 6, 24);

  // Bottom cap highlight
  ctx.fillStyle = "rgba(173, 255, 47, 0.2)";
  ctx.fillRect(x + 4, bottomY + 20, 6, bottomH - 20);

  // Pixel detail lines on pipes
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
  for (let py = 0; py < topHeight - 20; py += 16) {
    ctx.fillRect(x, py, w, 1);
  }
  for (let py = bottomY + 20; py < bottomY + bottomH; py += 16) {
    ctx.fillRect(x, py, w, 1);
  }

  ctx.shadowBlur = 0;
}

function drawGround(ctx, canvasW, canvasH, offset) {
  const groundY = canvasH - GROUND_HEIGHT;

  // Ground body
  const gGrad = ctx.createLinearGradient(0, groundY, 0, canvasH);
  gGrad.addColorStop(0, "#2a1f0e");
  gGrad.addColorStop(0.15, "#3d2b14");
  gGrad.addColorStop(1, "#1a1207");
  ctx.fillStyle = gGrad;
  ctx.fillRect(0, groundY, canvasW, GROUND_HEIGHT);

  // Grass top
  ctx.fillStyle = "#32cd32";
  ctx.fillRect(0, groundY, canvasW, 4);
  ctx.fillStyle = "#228b22";
  ctx.fillRect(0, groundY + 4, canvasW, 3);

  // Pixel grass blades
  ctx.fillStyle = "#3ddc3d";
  for (let gx = ((-offset * 0.5) % 12); gx < canvasW; gx += 12) {
    ctx.fillRect(gx, groundY - 3, 3, 6);
  }

  // Ground texture dots
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  for (let gx = ((-offset * 0.3) % 20); gx < canvasW; gx += 20) {
    for (let gy = groundY + 12; gy < canvasH - 5; gy += 14) {
      ctx.fillRect(gx, gy, 2, 2);
    }
  }
}

function drawBackground(ctx, canvasW, canvasH, stars, offset) {
  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, canvasH - GROUND_HEIGHT);
  skyGrad.addColorStop(0, "#020614");
  skyGrad.addColorStop(0.4, "#06101f");
  skyGrad.addColorStop(0.7, "#0a1628");
  skyGrad.addColorStop(1, "#0f1d2e");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, canvasW, canvasH - GROUND_HEIGHT);

  // Stars with parallax
  stars.forEach((star) => {
    const sx = ((star.x - offset * star.speed * 0.3) % canvasW + canvasW) % canvasW;
    const twinkle = 0.5 + 0.5 * Math.sin(Date.now() * 0.003 * star.twinkleSpeed + star.phase);
    ctx.globalAlpha = star.brightness * twinkle;
    ctx.fillStyle = star.color;
    ctx.fillRect(sx, star.y, star.size, star.size);
  });
  ctx.globalAlpha = 1;

  // Distant city silhouette parallax
  ctx.fillStyle = "rgba(15, 25, 40, 0.8)";
  const cityY = canvasH - GROUND_HEIGHT - 40;
  for (let cx = ((-offset * 0.15) % 800 + 800) % 800 - 100; cx < canvasW + 100; cx += 30 + Math.sin(cx * 0.1) * 10) {
    const bh = 15 + Math.abs(Math.sin(cx * 0.05)) * 30;
    const bw = 10 + Math.abs(Math.cos(cx * 0.07)) * 14;
    ctx.fillRect(cx, cityY - bh, bw, bh + 40);
  }

  // Closer silhouette
  ctx.fillStyle = "rgba(10, 18, 30, 0.9)";
  for (let cx = ((-offset * 0.3) % 600 + 600) % 600 - 80; cx < canvasW + 80; cx += 40 + Math.sin(cx * 0.08) * 15) {
    const bh = 20 + Math.abs(Math.sin(cx * 0.03 + 1)) * 45;
    const bw = 14 + Math.abs(Math.cos(cx * 0.05 + 2)) * 16;
    ctx.fillRect(cx, cityY - bh, bw, bh + 40);
    // windows
    ctx.fillStyle = "rgba(50, 205, 50, 0.15)";
    for (let wy = cityY - bh + 5; wy < cityY; wy += 8) {
      for (let wx = cx + 3; wx < cx + bw - 3; wx += 6) {
        if (Math.random() > 0.6) ctx.fillRect(wx, wy, 2, 3);
      }
    }
    ctx.fillStyle = "rgba(10, 18, 30, 0.9)";
  }
}

function drawScanlines(ctx, canvasW, canvasH) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
  for (let sy = 0; sy < canvasH; sy += 3) {
    ctx.fillRect(0, sy, canvasW, 1);
  }
  // Vignette
  const vigGrad = ctx.createRadialGradient(
    canvasW / 2, canvasH / 2, canvasW * 0.3,
    canvasW / 2, canvasH / 2, canvasW * 0.8
  );
  vigGrad.addColorStop(0, "rgba(0,0,0,0)");
  vigGrad.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = vigGrad;
  ctx.fillRect(0, 0, canvasW, canvasH);
}

// ─── PARTICLE SYSTEM ───
class Particle {
  constructor(x, y, type = "flap") {
    this.x = x;
    this.y = y;
    this.type = type;
    if (type === "flap") {
      this.vx = (Math.random() - 0.5) * 2;
      this.vy = Math.random() * 2 + 1;
      this.size = Math.random() * 3 + 1;
      this.life = 1;
      this.decay = 0.03 + Math.random() * 0.02;
      this.color = Math.random() > 0.5 ? "#32cd32" : "#adff2f";
    } else {
      // explosion
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.size = Math.random() * 4 + 2;
      this.life = 1;
      this.decay = 0.015 + Math.random() * 0.015;
      this.color = ["#32cd32", "#adff2f", "#ffaa00", "#ff4444", "#ffffff"][
        Math.floor(Math.random() * 5)
      ];
    }
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= this.decay;
    if (this.type === "explosion") {
      this.vy += 0.1; // gravity on explosion particles
    }
  }

  draw(ctx) {
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;
    ctx.fillRect(
      this.x - this.size / 2,
      this.y - this.size / 2,
      this.size,
      this.size
    );
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}

// ─── MAIN COMPONENT ───
export default function FlappyBird() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameState, setGameState] = useState(GAME_STATE.IDLE);

  // Initialize high score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("flappy-highscore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Initialize game state object
  const initGame = useCallback((canvasW, canvasH) => {
    // Generate stars
    const stars = [];
    const starColors = ["#ffffff", "#aaccff", "#ffddaa", "#32cd32", "#adff2f"];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * canvasW,
        y: Math.random() * (canvasH - GROUND_HEIGHT - 60),
        size: Math.random() > 0.85 ? 2 : 1,
        brightness: 0.3 + Math.random() * 0.7,
        speed: 0.2 + Math.random() * 0.8,
        twinkleSpeed: 0.5 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
        color: starColors[Math.floor(Math.random() * starColors.length)],
      });
    }

    return {
      bird: {
        x: canvasW * 0.28,
        y: canvasH * 0.45,
        vy: 0,
        rotation: 0,
        flapFrame: 0,
        flapTimer: 0,
      },
      pipes: [],
      particles: [],
      stars,
      score: 0,
      state: GAME_STATE.IDLE,
      lastPipeSpawn: 0,
      totalOffset: 0,
      flashTimer: 0,
      shakeTimer: 0,
      shakeIntensity: 0,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false; // Pixel-perfect rendering

    // Canvas sizing
    const resize = () => {
      const parent = canvas.parentElement;
      const maxW = Math.min(parent.clientWidth, 480);
      const maxH = Math.min(window.innerHeight * 0.7, 640);
      canvas.width = maxW;
      canvas.height = maxH;
      // Re-init on resize if idle
      if (gameRef.current && gameRef.current.state === GAME_STATE.IDLE) {
        gameRef.current = initGame(canvas.width, canvas.height);
      }
    };

    resize();
    window.addEventListener("resize", resize);

    gameRef.current = initGame(canvas.width, canvas.height);

    // ─── FLAP HANDLER ───
    const flap = () => {
      const game = gameRef.current;
      if (!game) return;

      if (game.state === GAME_STATE.IDLE) {
        game.state = GAME_STATE.PLAYING;
        game.bird.vy = FLAP_FORCE;
        game.bird.flapFrame++;
        setGameState(GAME_STATE.PLAYING);
        // Spawn initial pipe
        game.lastPipeSpawn = Date.now();
        return;
      }

      if (game.state === GAME_STATE.PLAYING) {
        game.bird.vy = FLAP_FORCE;
        game.bird.flapFrame++;
        // Spawn flap particles
        for (let i = 0; i < 5; i++) {
          game.particles.push(
            new Particle(game.bird.x + 10, game.bird.y + 5, "flap")
          );
        }
      }

      if (game.state === GAME_STATE.GAME_OVER) {
        // Restart
        const newGame = initGame(canvas.width, canvas.height);
        newGame.state = GAME_STATE.PLAYING;
        newGame.bird.vy = FLAP_FORCE;
        newGame.lastPipeSpawn = Date.now();
        gameRef.current = newGame;
        setScore(0);
        setGameState(GAME_STATE.PLAYING);
      }
    };

    const handleKey = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        flap();
      }
    };

    const handleClick = (e) => {
      e.preventDefault();
      flap();
    };

    canvas.addEventListener("pointerdown", handleClick);
    window.addEventListener("keydown", handleKey);

    // ─── GAME LOOP ───
    let animId;
    const loop = () => {
      const game = gameRef.current;
      if (!game) return;
      const W = canvas.width;
      const H = canvas.height;
      const groundY = H - GROUND_HEIGHT;

      // ── UPDATE ──
      if (game.state === GAME_STATE.PLAYING) {
        // Bird physics
        game.bird.vy += GRAVITY;
        game.bird.y += game.bird.vy;
        game.bird.rotation = Math.min(
          Math.max(game.bird.vy * 0.06, -0.5),
          1.2
        );

        // Auto wing flap animation
        game.bird.flapTimer++;
        if (game.bird.flapTimer % 8 === 0) game.bird.flapFrame++;

        game.totalOffset += PIPE_SPEED;

        // Spawn pipes
        const now = Date.now();
        if (now - game.lastPipeSpawn > PIPE_SPAWN_INTERVAL) {
          const minTop = 50;
          const maxTop = groundY - PIPE_GAP - 50;
          const topHeight =
            minTop + Math.random() * (maxTop - minTop);
          game.pipes.push({
            x: W + 10,
            topHeight,
            scored: false,
          });
          game.lastPipeSpawn = now;
        }

        // Move pipes
        game.pipes.forEach((pipe) => {
          pipe.x -= PIPE_SPEED;
        });

        // Remove off-screen pipes
        game.pipes = game.pipes.filter((p) => p.x > -PIPE_WIDTH - 10);

        // Scoring
        game.pipes.forEach((pipe) => {
          if (!pipe.scored && pipe.x + PIPE_WIDTH < game.bird.x) {
            pipe.scored = true;
            game.score++;
            setScore(game.score);
          }
        });

        // Collision detection
        const bx = game.bird.x;
        const by = game.bird.y;
        const br = BIRD_SIZE * 0.4; // collision radius

        // Ground / ceiling
        if (by + br > groundY || by - br < 0) {
          triggerGameOver(game, W, H);
        }

        // Pipe collision
        game.pipes.forEach((pipe) => {
          if (bx + br > pipe.x && bx - br < pipe.x + PIPE_WIDTH) {
            if (
              by - br < pipe.topHeight ||
              by + br > pipe.topHeight + PIPE_GAP
            ) {
              triggerGameOver(game, W, H);
            }
          }
        });
      }

      // Idle bobbing animation
      if (game.state === GAME_STATE.IDLE) {
        game.bird.y =
          canvas.height * 0.45 + Math.sin(Date.now() * 0.003) * 12;
        game.bird.flapTimer++;
        if (game.bird.flapTimer % 10 === 0) game.bird.flapFrame++;
        game.totalOffset += 0.5; // slow background scroll in idle
      }

      // Update particles
      game.particles = game.particles.filter((p) => p.life > 0);
      game.particles.forEach((p) => p.update());

      // Flash and shake timers
      if (game.flashTimer > 0) game.flashTimer -= 0.05;
      if (game.shakeTimer > 0) game.shakeTimer--;

      // ── DRAW ──
      ctx.save();

      // Screen shake
      if (game.shakeTimer > 0) {
        const sx =
          (Math.random() - 0.5) * game.shakeIntensity * game.shakeTimer * 0.3;
        const sy =
          (Math.random() - 0.5) * game.shakeIntensity * game.shakeTimer * 0.3;
        ctx.translate(sx, sy);
      }

      // Background
      drawBackground(ctx, W, H, game.stars, game.totalOffset);

      // Pipes
      game.pipes.forEach((pipe) => {
        drawPixelPipe(ctx, pipe.x, pipe.topHeight, PIPE_GAP, W, H, GROUND_HEIGHT);
      });

      // Ground
      drawGround(ctx, W, H, game.totalOffset);

      // Bird
      drawPixelBird(
        ctx,
        game.bird.x,
        game.bird.y,
        BIRD_SIZE,
        game.bird.rotation,
        game.bird.flapFrame
      );

      // Particles
      game.particles.forEach((p) => p.draw(ctx));

      // Score display (in-game)
      if (game.state === GAME_STATE.PLAYING) {
        drawScore(ctx, game.score, W);
      }

      // Flash effect on death
      if (game.flashTimer > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${game.flashTimer})`;
        ctx.fillRect(0, 0, W, H);
      }

      // Idle state overlay
      if (game.state === GAME_STATE.IDLE) {
        drawIdleScreen(ctx, W, H);
      }

      // Game over overlay
      if (game.state === GAME_STATE.GAME_OVER) {
        drawGameOver(ctx, W, H, game.score, parseInt(localStorage.getItem("flappy-highscore") || "0", 10));
      }

      // CRT scanlines (always on top)
      drawScanlines(ctx, W, H);

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    // ─── GAME OVER TRIGGER ───
    function triggerGameOver(game) {
      if (game.state === GAME_STATE.GAME_OVER) return;
      game.state = GAME_STATE.GAME_OVER;
      game.flashTimer = 1;
      game.shakeTimer = 15;
      game.shakeIntensity = 6;
      setGameState(GAME_STATE.GAME_OVER);

      // Explosion particles
      for (let i = 0; i < 30; i++) {
        game.particles.push(
          new Particle(game.bird.x, game.bird.y, "explosion")
        );
      }

      // High score
      if (game.score > (parseInt(localStorage.getItem("flappy-highscore") || "0", 10))) {
        localStorage.setItem("flappy-highscore", game.score.toString());
        setHighScore(game.score);
      }
    }

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("pointerdown", handleClick);
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("resize", resize);
    };
  }, [initGame]);

  return (
    <div className="flappy-game-wrapper">
      <canvas ref={canvasRef} className="flappy-canvas" />
      <div className="flappy-hud">
        <div className="flappy-hud-item">
          <span className="flappy-hud-label">SCORE</span>
          <span className="flappy-hud-value">{score}</span>
        </div>
        <div className="flappy-hud-item">
          <span className="flappy-hud-label">BEST</span>
          <span className="flappy-hud-value flappy-hud-best">{highScore}</span>
        </div>
      </div>
    </div>
  );
}

// ─── UI DRAWING FUNCTIONS ───
function drawScore(ctx, score, canvasW) {
  const text = score.toString();
  ctx.save();
  ctx.font = "bold 48px 'Outfit', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  // Shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillText(text, canvasW / 2 + 2, 32);

  // Main text
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "#32cd32";
  ctx.shadowBlur = 12;
  ctx.fillText(text, canvasW / 2, 30);
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawIdleScreen(ctx, W, H) {
  // Darken
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.fillRect(0, 0, W, H);

  // Title
  ctx.save();
  ctx.font = "bold 28px 'Outfit', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = "#32cd32";
  ctx.shadowColor = "#32cd32";
  ctx.shadowBlur = 16;
  ctx.fillText("FLAPPY BIRD", W / 2, H * 0.25);

  ctx.shadowBlur = 0;
  ctx.font = "14px 'Inter', sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";

  // Pulsing prompt
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.004);
  ctx.globalAlpha = 0.4 + pulse * 0.6;
  ctx.fillText("TAP / CLICK / SPACE TO START", W / 2, H * 0.65);
  ctx.globalAlpha = 1;

  // Controls info
  ctx.font = "11px 'Inter', monospace";
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.fillText("AVOID THE PIPES • SCORE POINTS", W / 2, H * 0.72);
  ctx.restore();
}

function drawGameOver(ctx, W, H, score, highScore) {
  // Darken overlay
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // GAME OVER title
  ctx.font = "bold 32px 'Outfit', sans-serif";
  ctx.fillStyle = "#ff4444";
  ctx.shadowColor = "#ff4444";
  ctx.shadowBlur = 16;
  ctx.fillText("GAME OVER", W / 2, H * 0.3);
  ctx.shadowBlur = 0;

  // Score panel background
  const panelW = 180;
  const panelH = 90;
  const panelX = (W - panelW) / 2;
  const panelY = H * 0.38;

  ctx.fillStyle = "rgba(20, 20, 25, 0.85)";
  ctx.strokeStyle = "rgba(50, 205, 50, 0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelW, panelH, 8);
  ctx.fill();
  ctx.stroke();

  // Score
  ctx.font = "12px 'Inter', sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.fillText("SCORE", W / 2, panelY + 22);
  ctx.font = "bold 24px 'Outfit', monospace";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(score.toString(), W / 2, panelY + 46);

  // Best
  ctx.font = "12px 'Inter', sans-serif";
  ctx.fillStyle = "rgba(173, 255, 47, 0.5)";
  ctx.fillText("BEST: " + highScore, W / 2, panelY + 72);

  // Restart prompt
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.004);
  ctx.globalAlpha = 0.4 + pulse * 0.6;
  ctx.font = "13px 'Inter', sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.fillText("TAP TO PLAY AGAIN", W / 2, H * 0.7);
  ctx.globalAlpha = 1;

  ctx.restore();
}
