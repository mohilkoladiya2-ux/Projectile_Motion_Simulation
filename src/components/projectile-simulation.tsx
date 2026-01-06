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

      const r = rendererRef.current!;
      r.clear();
      r.drawTargets(state.targets);
      r.drawCannon(state.cannon);

      if (!state.projectile?.active && !state.cannon.isCharging) {
        r.drawAimLine(state.cannon, mousePos);
      }
      if (state.projectile?.active) {
        r.drawProjectile(state.projectile);
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
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
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
  const isFinished = remaining === 0;

  const angle =
    typeof gameState.currentAngle === "number"
      ? gameState.currentAngle.toFixed(1)
      : "0.0";

  const velocity =
    typeof gameState.currentVelocity === "number"
      ? Math.round(gameState.currentVelocity)
      : 0;

  return (
    <div className="min-h-screen bg-black text-white px-10 py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 bg-clip-text text-transparent">
            Projectile Motion Simulator
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Move mouse to aim · Hold to charge · Release to fire
          </p>
        </div>

        <button
          onClick={handleReset}
          className="px-5 py-2.5 rounded-xl border border-zinc-800
                     bg-gradient-to-b from-zinc-800 to-zinc-900
                     hover:from-zinc-700 hover:to-zinc-800
                     active:scale-95 transition"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <Stat label="Hits" value={gameState.score} color="text-emerald-400" />
        <Stat label="Total Shots" value={gameState.totalShots} color="text-blue-400" />
        <Stat label="Remaining" value={remaining} color="text-purple-400" />
        <Stat label="Accuracy" value={`${accuracy}%`} color="text-yellow-400" />
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Stat label="Angle" value={`${angle}°`} color="text-cyan-400" />
        <Stat label="Velocity" value={`${velocity} px/s`} color="text-green-400" />
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
        <h3 className="text-lg font-semibold mb-4">How to Play</h3>
        <ul className="space-y-3 text-sm text-gray-300">
          <li>Move mouse to rotate cannon and aim</li>
          <li>Hold mouse button to charge power</li>
          <li>Release mouse button to fire</li>
          <li>Observe angle, velocity and physics values</li>
          <li>Hit all targets to finish the simulation</li>
        </ul>
      </div>
  
      {isFinished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center">
            <h2 className="text-3xl font-bold mb-2">Simulation Complete</h2>
            <p className="text-gray-400 mb-6">
              All targets have been successfully hit
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="border border-zinc-800 rounded-lg p-3">
                <div className="text-xs text-gray-400">Shots Fired</div>
                <div className="text-xl font-semibold">{gameState.totalShots}</div>
              </div>
              <div className="border border-zinc-800 rounded-lg p-3">
                <div className="text-xs text-gray-400">Accuracy</div>
                <div className="text-xl font-semibold">{accuracy}%</div>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full rounded-xl px-4 py-3
                         bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500
                         text-black font-semibold
                         hover:opacity-90 active:scale-95 transition"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
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
