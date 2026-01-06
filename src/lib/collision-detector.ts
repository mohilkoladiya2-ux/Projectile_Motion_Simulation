import type { Vector2D, Target } from "./types";

export class CollisionDetector {
  detectTargetHit(position: Vector2D, targets: Target[]): Target | null {
    for (const target of targets) {
      if (target.isHit) continue;

      const dx = position.x - target.x;
      const dy = position.y - target.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= target.radius + 5) {
        return target;
      }
    }
    return null;
  }
  areAllTargetsHit(targets: Target[]): boolean {
    return targets.every((target) => target.isHit);
  }
}
