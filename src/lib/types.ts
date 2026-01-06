export interface Vector2D {
  x: number
  y: number
}

export interface Target {
  id: number
  x: number
  y: number
  radius: number
  color: string
  isHit: boolean
}

export interface Projectile {
  position: Vector2D
  velocity: Vector2D
  active: boolean
  trail: Vector2D[]
}

export interface CannonState {
  position: Vector2D
  angle: number
  length: number
  isCharging: boolean
  chargePower: number
}

export interface GameState {
  targets: Target[]
  projectile: Projectile | null
  cannon: CannonState
  score: number
  totalShots: number
  gameWon: boolean
  currentAngle: number 
  currentVelocity: number
  gravity: number
  acceleration: Vector2D
}
