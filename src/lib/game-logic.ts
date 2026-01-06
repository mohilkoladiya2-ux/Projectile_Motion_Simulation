import type { GameState, Target } from "./types"
import { PhysicsEngine } from "./physics-engine"
import { CollisionDetector } from "./collision-detector"

export class GameLogic {
  private physics: PhysicsEngine
  private collisionDetector: CollisionDetector

  constructor() {
    this.physics = new PhysicsEngine()
    this.collisionDetector = new CollisionDetector()
  }

  initializeGame(targetsConfig: Target[]): GameState {
    return {
      targets: targetsConfig.map((t) => ({ ...t, isHit: false })),
      projectile: null,
      cannon: {
        position: { x: 100, y: 500 },
        angle: -Math.PI / 4,
        length: 50,
        isCharging: false,
        chargePower: 0,
      },
      score: 0,
      totalShots: 0,
      gameWon: false,
      currentAngle: -45,
      currentVelocity: 0,
      gravity: this.physics.getGravity(),
      acceleration: { x: 0, y: this.physics.getGravity() },
    }
  }

  updateCannonAngle(state: GameState, mouseX: number, mouseY: number): GameState {
    const dx = mouseX - state.cannon.position.x
    const dy = mouseY - state.cannon.position.y
    const angle = Math.atan2(dy, dx)
    const angleDegrees = (angle * 180) / Math.PI

    return {
      ...state,
      cannon: {
        ...state.cannon,
        angle,
      },
      currentAngle: angleDegrees,
    }
  }

  startCharging(state: GameState): GameState {
    if (state.projectile?.active || state.gameWon) return state

    return {
      ...state,
      cannon: {
        ...state.cannon,
        isCharging: true,
        chargePower: 0,
      },
    }
  }

  updateCharge(state: GameState, deltaTime: number): GameState {
    if (!state.cannon.isCharging) return state

    const chargeRate = 0.5 // Charge 50% per second
    const newChargePower = Math.min(1, state.cannon.chargePower + chargeRate * (deltaTime / 1000))

    const velocity = this.physics.calculateVelocity(newChargePower)

    return {
      ...state,
      cannon: {
        ...state.cannon,
        chargePower: newChargePower,
      },
      currentVelocity: velocity,
    }
  }

  fireProjectile(state: GameState): GameState {
    if (!state.cannon.isCharging || state.gameWon) return state

    const projectile = this.physics.createProjectile(
      state.cannon.position,
      state.cannon.angle,
      state.cannon.chargePower,
    )

    return {
      ...state,
      projectile,
      totalShots: state.totalShots + 1,
      cannon: {
        ...state.cannon,
        isCharging: false,
        chargePower: 0,
      },
      currentVelocity: 0,
    }
  }

  update(state: GameState, deltaTime: number, canvasWidth: number, canvasHeight: number): GameState {
    if (!state.projectile?.active) return state

    const updatedProjectile = this.physics.updateProjectile(state.projectile, deltaTime)

    const velocity = Math.sqrt(updatedProjectile.velocity.x ** 2 + updatedProjectile.velocity.y ** 2)

    const hitTarget = this.collisionDetector.detectTargetHit(updatedProjectile.position, state.targets)

    if (hitTarget) {
      const updatedTargets = state.targets.map((t) => (t.id === hitTarget.id ? { ...t, isHit: true } : t))

      const allHit = this.collisionDetector.areAllTargetsHit(updatedTargets)

      return {
        ...state,
        targets: updatedTargets,
        projectile: { ...updatedProjectile, active: false },
        score: state.score + 1,
        gameWon: allHit,
        currentVelocity: 0,
      }
    }

    if (this.physics.isOutOfBounds(updatedProjectile.position, canvasWidth, canvasHeight)) {
      return {
        ...state,
        projectile: { ...updatedProjectile, active: false },
        currentVelocity: 0,
      }
    }

    return {
      ...state,
      projectile: updatedProjectile,
      currentVelocity: velocity,
      acceleration: { x: 0, y: this.physics.getGravity() },
    }
  }

  resetGame(state: GameState): GameState {
    return {
      ...state,
      targets: state.targets.map((t) => ({ ...t, isHit: false })),
      projectile: null,
      score: 0,
      totalShots: 0,
      gameWon: false,
      cannon: {
        ...state.cannon,
        isCharging: false,
        chargePower: 0,
      },
      currentVelocity: 0,
    }
  }
}
