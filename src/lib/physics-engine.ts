import type { Vector2D, Projectile } from "./types"

export class PhysicsEngine {
  private readonly GRAVITY = 980 
  private readonly MIN_VELOCITY = 600 
  private readonly MAX_VELOCITY = 1200 
  private readonly MAX_TRAIL_LENGTH = 50

  updateProjectile(projectile: Projectile, deltaTime: number): Projectile {
    const dt = deltaTime / 1000 
    projectile.velocity.y += this.GRAVITY * dt

    const newPosition: Vector2D = {
      x: projectile.position.x + projectile.velocity.x * dt,
      y: projectile.position.y + projectile.velocity.y * dt,
    }


    const newTrail = [...projectile.trail, { ...projectile.position }]
    if (newTrail.length > this.MAX_TRAIL_LENGTH) {
      newTrail.shift()
    }

    return {
      ...projectile,
      position: newPosition,
      trail: newTrail,
    }
  }

  createProjectile(cannonPos: Vector2D, angle: number, chargePower = 1): Projectile {
    const velocity = this.MIN_VELOCITY + (this.MAX_VELOCITY - this.MIN_VELOCITY) * chargePower

    return {
      position: { ...cannonPos },
      velocity: {
        x: Math.cos(angle) * velocity,
        y: Math.sin(angle) * velocity,
      },
      active: true,
      trail: [],
    }
  }

  isOutOfBounds(position: Vector2D, canvasWidth: number, canvasHeight: number): boolean {
    return position.x < 0 || position.x > canvasWidth || position.y < 0 || position.y > canvasHeight
  }

  checkCollision(projectilePos: Vector2D, targetPos: Vector2D, targetRadius: number): boolean {
    const dx = projectilePos.x - targetPos.x
    const dy = projectilePos.y - targetPos.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    return distance <= targetRadius + 5 
  }

  getGravity(): number {
    return this.GRAVITY
  }

  calculateVelocity(chargePower: number): number {
    return this.MIN_VELOCITY + (this.MAX_VELOCITY - this.MIN_VELOCITY) * chargePower
  }
}
