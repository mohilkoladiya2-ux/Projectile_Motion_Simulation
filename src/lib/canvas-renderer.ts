import type { Target, Projectile, CannonState } from "./types"

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D
  private width: number
  private height: number

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Could not get canvas context")

    this.ctx = context
    this.width = canvas.width
    this.height = canvas.height
  }

  clear(): void {
    this.ctx.fillStyle = "#0a0a0a"
    this.ctx.fillRect(0, 0, this.width, this.height)
    this.drawGrid()
  }

  private drawGrid(): void {
    this.ctx.strokeStyle = "#1a1a1a"
    this.ctx.lineWidth = 1

    // Vertical lines
    for (let x = 0; x < this.width; x += 50) {
      this.ctx.beginPath()
      this.ctx.moveTo(x, 0)
      this.ctx.lineTo(x, this.height)
      this.ctx.stroke()
    }

    // Horizontal lines
    for (let y = 0; y < this.height; y += 50) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, y)
      this.ctx.lineTo(this.width, y)
      this.ctx.stroke()
    }
  }

  drawCannon(cannon: CannonState): void {
    const { position, angle, length, isCharging, chargePower } = cannon

    if (isCharging) {
      this.drawChargePowerIndicator(position, chargePower)
    }

    // Cannon base
    this.ctx.fillStyle = isCharging ? "#f59e0b" : "#fbbf24"
    this.ctx.beginPath()
    this.ctx.arc(position.x, position.y, 20, 0, Math.PI * 2)
    this.ctx.fill()

    if (isCharging && chargePower > 0.5) {
      this.ctx.shadowBlur = 20
      this.ctx.shadowColor = "#fbbf24"
    }

    this.ctx.strokeStyle = isCharging ? "#dc2626" : "#f59e0b"
    this.ctx.lineWidth = 12
    this.ctx.lineCap = "round"
    this.ctx.beginPath()
    this.ctx.moveTo(position.x, position.y)
    this.ctx.lineTo(position.x + Math.cos(angle) * length, position.y + Math.sin(angle) * length)
    this.ctx.stroke()

    this.ctx.shadowBlur = 0

    // Cannon tip glow
    this.ctx.fillStyle = isCharging ? "#fef3c7" : "#fef3c7"
    this.ctx.beginPath()
    this.ctx.arc(position.x + Math.cos(angle) * length, position.y + Math.sin(angle) * length, 4, 0, Math.PI * 2)
    this.ctx.fill()
  }

  private drawChargePowerIndicator(position: { x: number; y: number }, chargePower: number): void {
    const radius = 35
    const startAngle = -Math.PI / 2
    const endAngle = startAngle + Math.PI * 2 * chargePower

    // Background arc
    this.ctx.strokeStyle = "#2a2a2a"
    this.ctx.lineWidth = 6
    this.ctx.beginPath()
    this.ctx.arc(position.x, position.y, radius, 0, Math.PI * 2)
    this.ctx.stroke()

    // Charge arc with gradient
    const gradient = this.ctx.createLinearGradient(position.x - radius, position.y, position.x + radius, position.y)
    gradient.addColorStop(0, "#10b981")
    gradient.addColorStop(0.5, "#fbbf24")
    gradient.addColorStop(1, "#dc2626")

    this.ctx.strokeStyle = gradient
    this.ctx.lineWidth = 6
    this.ctx.lineCap = "round"
    this.ctx.beginPath()
    this.ctx.arc(position.x, position.y, radius, startAngle, endAngle)
    this.ctx.stroke()

    // Charge percentage text
    this.ctx.fillStyle = "#ffffff"
    this.ctx.font = "bold 14px sans-serif"
    this.ctx.textAlign = "center"
    this.ctx.textBaseline = "middle"
    this.ctx.fillText(`${Math.round(chargePower * 100)}%`, position.x, position.y)
  }

  drawTargets(targets: Target[]): void {
    targets.forEach((target) => {
      if (target.isHit) {
        this.drawHitTarget(target)
      } else {
        this.drawActiveTarget(target)
      }
    })
  }

  private drawActiveTarget(target: Target): void {
    // Outer glow
    const gradient = this.ctx.createRadialGradient(
      target.x,
      target.y,
      target.radius * 0.5,
      target.x,
      target.y,
      target.radius * 1.2,
    )
    gradient.addColorStop(0, target.color)
    gradient.addColorStop(1, "transparent")

    this.ctx.fillStyle = gradient
    this.ctx.beginPath()
    this.ctx.arc(target.x, target.y, target.radius * 1.2, 0, Math.PI * 2)
    this.ctx.fill()

    // Main target circle
    this.ctx.fillStyle = target.color
    this.ctx.beginPath()
    this.ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2)
    this.ctx.fill()

    // Inner rings
    this.ctx.strokeStyle = "#ffffff"
    this.ctx.lineWidth = 2
    this.ctx.beginPath()
    this.ctx.arc(target.x, target.y, target.radius * 0.7, 0, Math.PI * 2)
    this.ctx.stroke()

    this.ctx.beginPath()
    this.ctx.arc(target.x, target.y, target.radius * 0.4, 0, Math.PI * 2)
    this.ctx.stroke()
  }

  private drawHitTarget(target: Target): void {
    // Draw X mark
    this.ctx.strokeStyle = "#ef4444"
    this.ctx.lineWidth = 3
    this.ctx.beginPath()
    this.ctx.moveTo(target.x - 15, target.y - 15)
    this.ctx.lineTo(target.x + 15, target.y + 15)
    this.ctx.stroke()

    this.ctx.beginPath()
    this.ctx.moveTo(target.x + 15, target.y - 15)
    this.ctx.lineTo(target.x - 15, target.y + 15)
    this.ctx.stroke()

    // Fade circle
    this.ctx.strokeStyle = "#4a4a4a"
    this.ctx.lineWidth = 2
    this.ctx.beginPath()
    this.ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2)
    this.ctx.stroke()
  }

  drawProjectile(projectile: Projectile): void {
    // Draw trail
    if (projectile.trail.length > 1) {
      this.ctx.strokeStyle = "#06b6d4"
      this.ctx.lineWidth = 2
      this.ctx.beginPath()
      this.ctx.moveTo(projectile.trail[0].x, projectile.trail[0].y)

      for (let i = 1; i < projectile.trail.length; i++) {
        const alpha = i / projectile.trail.length
        this.ctx.globalAlpha = alpha * 0.5
        this.ctx.lineTo(projectile.trail[i].x, projectile.trail[i].y)
      }
      this.ctx.stroke()
      this.ctx.globalAlpha = 1
    }

    // Draw projectile
    const gradient = this.ctx.createRadialGradient(
      projectile.position.x,
      projectile.position.y,
      0,
      projectile.position.x,
      projectile.position.y,
      10,
    )
    gradient.addColorStop(0, "#22d3ee")
    gradient.addColorStop(1, "#06b6d4")

    this.ctx.fillStyle = gradient
    this.ctx.beginPath()
    this.ctx.arc(projectile.position.x, projectile.position.y, 5, 0, Math.PI * 2)
    this.ctx.fill()
  }

  drawAimLine(cannon: CannonState, mousePos: { x: number; y: number }): void {
    this.ctx.strokeStyle = "#fbbf24"
    this.ctx.lineWidth = 1
    this.ctx.setLineDash([5, 5])
    this.ctx.globalAlpha = 0.5

    this.ctx.beginPath()
    this.ctx.moveTo(cannon.position.x, cannon.position.y)
    this.ctx.lineTo(mousePos.x, mousePos.y)
    this.ctx.stroke()

    this.ctx.setLineDash([])
    this.ctx.globalAlpha = 1
  }
}
