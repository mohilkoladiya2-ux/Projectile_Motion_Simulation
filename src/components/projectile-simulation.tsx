import type React from "react";
import { useEffect, useRef, useState } from "react";
import TARGETS from "../data/targets-config.json";
import type { GameState } from "../lib/types";
import { GameLogic } from "../lib/game-logic";
import { CanvasRenderer } from "../lib/canvas-renderer";

export default function ProjectileSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const gameLogicRef = useRef<GameLogic>(new GameLogic());
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const gameStateRef = useRef<GameState | null>(null);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const initial = gameLogicRef.current.initializeGame(TARGETS.targets);
      gameStateRef.current = initial;
      setGameState(initial);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current || isLoading) return;

    canvasRef.current.width = 1200;
    canvasRef.current.height = 600;
    rendererRef.current = new CanvasRenderer(canvasRef.current);
  }, [isLoading]);

  useEffect(() => {
    if (!gameStateRef.current || !rendererRef.current || isLoading) return;
    let running = true;

    const loop = (t: number) => {
      if (!running) return;
      const dt = t - lastTimeRef.current;
      lastTimeRef.current = t;

      let state = gameStateRef.current!;
      if (state.cannon.isCharging) {
        state = gameLogicRef.current.updateCharge(state, dt);
      }

      state = gameLogicRef.current.update(state, dt, 1200, 600);
      gameStateRef.current = state;
      setGameState({ ...state });

      const r = rendererRef.current;
      r!.clear();
      r!.drawTargets(state.targets);
      r!.drawCannon(state.cannon);

      if (!state.projectile?.active && !state.cannon.isCharging) {
        r!.drawAimLine(state.cannon, mousePos);
      }
      if (state.projectile?.active) {
        r!.drawProjectile(state.projectile);
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(animationFrameRef.current!);
    };
  }, [mousePos, isLoading]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !gameStateRef.current) return;
    const r = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    setMousePos({ x, y });

    const s = gameLogicRef.current.updateCannonAngle(
      gameStateRef.current,
      x,
      y
    );
    gameStateRef.current = s;
    setGameState({ ...s });
  };

  const handleMouseDown = () => {
    if (!gameStateRef.current) return;
    const s = gameLogicRef.current.startCharging(gameStateRef.current);
    gameStateRef.current = s;
    setGameState({ ...s });
  };

  const handleMouseUp = () => {
    if (!gameStateRef.current) return;
    const s = gameLogicRef.current.fireProjectile(gameStateRef.current);
    gameStateRef.current = s;
    setGameState({ ...s });
  };

  const handleReset = () => {
    if (!gameStateRef.current) return;
    const s = gameLogicRef.current.resetGame(gameStateRef.current);
    gameStateRef.current = s;
    setGameState({ ...s });
  };

  if (!gameState) return null;

  const accuracy =
    gameState.totalShots > 0
      ? Math.round((gameState.score / gameState.totalShots) * 100)
      : 0;

  const remaining = gameState.targets.filter((t) => !t.isHit).length;

  return (
    <div className="min-h-screen bg-black text-white px-10 py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-3xl font-extrabold tracking-tight
                   bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500
                   bg-clip-text text-transparent"
          >
            Projectile Motion Simulator
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Move mouse to aim · Hold to charge · Release to fire
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-5 py-2.5
               rounded-xl border border-zinc-800
               bg-gradient-to-b from-zinc-800 to-zinc-900
               text-sm font-medium text-white
               hover:from-zinc-700 hover:to-zinc-800
               active:scale-95 transition"
        >
          ↻ Reset
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <Stat label="Hits" value={gameState.score} color="text-emerald-400" />
        <Stat
          label="Total Shots"
          value={gameState.totalShots}
          color="text-blue-400"
        />
        <Stat label="Remaining" value={remaining} color="text-purple-400" />
        <Stat label="Accuracy" value={`${accuracy}%`} color="text-yellow-400" />
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Stat
          label="Angle"
          value={`${gameState.currentAngle.toFixed(1)}°`}
          color="text-cyan-400"
        />
        <Stat
          label="Velocity"
          value={`${Math.round(gameState.currentVelocity)} px/s`}
          color="text-green-400"
        />
        <Stat label="Acceleration" value="980 px/s²" color="text-orange-400" />
        <Stat label="Gravity" value="980 px/s²" color="text-red-400" />
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          className="w-full cursor-crosshair bg-black rounded"
        />
      </div>

      <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 tracking-tight">
          How to Play
        </h3>

        <ul className="space-y-3 text-sm text-gray-300">
          <li className="flex items-start gap-3">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white" />
            <span>Move your mouse to rotate the cannon and aim at targets</span>
          </li>

          <li className="flex items-start gap-3">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white" />
            <span>Hold the mouse button to charge projectile power</span>
          </li>

          <li className="flex items-start gap-3">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white" />
            <span>Release the mouse button to fire the projectile</span>
          </li>

          <li className="flex items-start gap-3">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white" />
            <span>
              Observe angle, velocity, acceleration, and gravity values
            </span>
          </li>

          <li className="flex items-start gap-3">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white" />
            <span>Hit all targets to complete the simulation</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="text-xs text-gray-400">{label}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
