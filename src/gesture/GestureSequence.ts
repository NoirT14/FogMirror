export type Pose = 'Closed_Fist' | 'Open_Palm' | 'None';
export class GestureSequence {
  phase: 'waiting' | 'holding' | 'armed' | 'cooldown' = 'waiting';
  private fistSince: number | null = null;
  private openSince: number | null = null;
  private armedUntil = 0;
  private cooldownUntil = 0;
  private last = -Infinity;
  private uncertainSince: number | null = null;
  reset() {
    this.phase = 'waiting'; this.fistSince = this.openSince = null;
    this.armedUntil = this.cooldownUntil = 0; this.last = -Infinity;
    this.uncertainSince = null;
  }
  update(pose: Pose, score: number, now: number, handPresent = true): boolean {
    if (now < this.cooldownUntil) { this.phase = 'cooldown'; this.last = now; return false; }
    // Missing frames must never count as a held hand pose.
    if (now - this.last > 450 || now < this.last) {
      this.fistSince = this.openSince = null; this.armedUntil = 0;
    }
    this.last = now;
    if (!Number.isFinite(score) || score < .75) pose = 'None';
    if (this.armedUntil && now > this.armedUntil) {
      this.armedUntil = 0; this.fistSince = this.openSince = null;
    }
    if (!handPresent) { this.reset(); this.last = now; return false; }
    if (pose === 'None') {
      this.uncertainSince ??= now; this.openSince = null;
      if (!this.armedUntil || now - this.uncertainSince > 300) { this.reset(); this.last = now; }
      return false;
    }
    this.uncertainSince = null;
    if (this.armedUntil) {
      this.phase = 'armed';
      if (pose === 'Open_Palm') {
        this.openSince ??= now;
        if (now - this.openSince >= 150) {
          this.reset(); this.cooldownUntil = now + 3000; this.last = now;
          this.phase = 'cooldown'; return true;
        }
      } else this.openSince = null;
      return false;
    }
    this.openSince = null;
    if (pose === 'Closed_Fist') {
      this.fistSince ??= now; this.phase = 'holding';
      if (now - this.fistSince >= 500) {
        this.armedUntil = now + 2000; this.phase = 'armed';
      }
    } else { this.fistSince = null; this.phase = 'waiting'; }
    return false;
  }
}
