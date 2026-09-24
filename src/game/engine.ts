import { DoodleAudio } from "./audio";

export type HudSnapshot = {
  p1Hp: number;
  p2Hp: number;
  p1Ink: number;
  p2Ink: number;
  timer: number;
  combo: number;
  phase: "menu" | "fight" | "over";
  winner: "p1" | "p2" | "draw" | null;
  freeze: number;
};

type Vec = { x: number; y: number };
type Plat = { x: number; y: number; w: number; h: number };
type Hitbox = { x: number; y: number; r: number; dmg: number; kb: Vec; heavy: boolean };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string };
type Decal = { x: number; y: number; pts: Vec[]; color: string };
type Joints = Record<
  "head" | "neck" | "pelvis" | "lHand" | "rHand" | "lElbow" | "rElbow" | "lKnee" | "rKnee" | "lFoot" | "rFoot",
  Vec
>;

const W = 1280;
const H = 720;
const STEP = 1 / 60;
const GROUND = 620;

function v(x = 0, y = 0): Vec {
  return { x, y };
}

type State =
  | "IDLE"
  | "CROUCH"
  | "JAB"
  | "CROUCH_JAB"
  | "KICK"
  | "SWEEP"
  | "UPPER"
  | "AIR_AXE"
  | "SPECIAL"
  | "EX_SPECIAL"
  | "GRAB"
  | "THROWN"
  | "HURT"
  | "KO"
  | "DASH";

class Fighter {
  isP1: boolean;
  pos = v();
  vel = v();
  facing = 1;
  grounded = false;
  hp = 100;
  ink = 0;
  walk = 6.2;
  jumpF = -14.2;
  jumps = 2;
  airDashes = 1;
  isWallSliding = false;
  wallSide = 0;
  ignoringPlatTimer = 0;
  blocking = false;
  hitstun = 0;
  state: State = "IDLE";
  anim = 0;
  hitOn = false;
  hit: Hitbox | null = null;
  invuln = 0;
  comboHit = false;
  parryWin = 0;
  string = 0;
  trail: Vec[] = [];
  joints: Joints = {
    head: v(),
    neck: v(),
    pelvis: v(),
    lHand: v(),
    rHand: v(),
    lElbow: v(),
    rElbow: v(),
    lKnee: v(),
    rKnee: v(),
    lFoot: v(),
    rFoot: v(),
  };
  t = 0;

  constructor(isP1: boolean) {
    this.isP1 = isP1;
  }

  reset(x: number) {
    this.pos = v(x, GROUND - 4);
    this.vel = v();
    this.hp = 100;
    this.ink = 0;
    this.state = "IDLE";
    this.hitstun = 0;
    this.anim = 0;
    this.jumps = 2;
    this.airDashes = 1;
    this.isWallSliding = false;
    this.wallSide = 0;
    this.ignoringPlatTimer = 0;
    this.blocking = false;
    this.invuln = 0;
    this.comboHit = false;
    this.parryWin = 0;
    this.string = 0;
    this.trail = [];
  }

  canAct() {
    return this.state === "IDLE" || this.state === "CROUCH" || this.state === "DASH";
  }

  attack(
    kind: "JAB" | "CROUCH_JAB" | "KICK" | "SWEEP" | "UPPER" | "AIR_AXE" | "SPECIAL" | "EX_SPECIAL" | "GRAB",
    audio: DoodleAudio
  ) {
    if (this.state === "HURT" || this.state === "THROWN" || this.state === "KO" || this.hitstun > 0) return;
    const cancel =
      ((this.state === "JAB" || this.state === "CROUCH_JAB") && this.comboHit && this.anim < 8) ||
      ((this.state === "KICK" || this.state === "SWEEP") && this.comboHit && this.anim < 6);
    if (!this.canAct() && !cancel && this.state !== "IDLE" && this.state !== "CROUCH") return;

    if (kind === "EX_SPECIAL") {
      if (this.ink < 50) return;
      this.ink -= 50;
      this.state = "EX_SPECIAL";
      this.anim = 35;
      this.invuln = 12;
      this.comboHit = false;
      this.string = 0;
      audio.whoosh();
      return;
    }
    if (kind === "SPECIAL") {
      if (this.ink < 100) return;
      this.ink = 0;
      this.state = "SPECIAL";
      this.anim = 40;
      this.invuln = 16;
      this.comboHit = false;
      this.string = 0;
      audio.whoosh();
      return;
    }
    if (kind === "GRAB") {
      this.state = "GRAB";
      this.anim = 16;
      this.comboHit = false;
      audio.scribble(this.facing * 0.1);
      return;
    }
    if (kind === "UPPER") {
      this.state = "UPPER";
      this.anim = 24;
      this.comboHit = false;
      this.string++;
      this.vel.y = Math.min(this.vel.y, -8);
      audio.scribble(this.facing * 0.2);
      return;
    }
    if (kind === "AIR_AXE") {
      this.state = "AIR_AXE";
      this.anim = 22;
      this.comboHit = false;
      this.string++;
      this.vel.y = Math.max(this.vel.y, 4);
      audio.scribble(this.facing * 0.3);
      return;
    }
    if (kind === "CROUCH_JAB") {
      this.state = "CROUCH_JAB";
      this.anim = 10;
      this.comboHit = false;
      this.string++;
      audio.scribble(this.facing * 0.2);
      return;
    }
    if (kind === "SWEEP") {
      this.state = "SWEEP";
      this.anim = 18;
      this.comboHit = false;
      this.string++;
      audio.scribble(this.facing * 0.3);
      return;
    }
    this.state = kind;
    this.anim = kind === "JAB" ? 12 : 20;
    this.comboHit = false;
    this.string++;
    if (kind === "KICK" && !this.grounded) this.vel.y = Math.min(this.vel.y, 2);
    audio.scribble(this.facing * 0.3);
  }

  dash(dir: number, audio: DoodleAudio) {
    if (this.state === "KO" || this.hitstun > 0) return;
    if (this.state === "DASH") return;
    if (!this.grounded) {
      if (this.airDashes <= 0) return;
      this.airDashes--;
      this.state = "DASH";
      this.anim = 10;
      this.vel.x = dir * 17;
      this.vel.y = -2;
      this.invuln = 10;
      this.comboHit = false;
      audio.whoosh();
      return;
    }
    const fromAtk =
      this.state === "JAB" ||
      this.state === "CROUCH_JAB" ||
      this.state === "KICK" ||
      this.state === "SWEEP" ||
      this.state === "UPPER" ||
      this.state === "AIR_AXE";
    if (!this.canAct() && !fromAtk && this.state !== "IDLE") return;
    this.state = "DASH";
    this.anim = 10;
    this.vel.x = dir * 16;
    this.invuln = 8;
    this.comboHit = false;
    audio.whoosh();
  }

  hurt(amount: number, kb: Vec, heavy: boolean, audio: DoodleAudio, parried = false) {
    if (this.state === "KO" || this.invuln > 0) return "miss";
    if (parried) {
      this.hitstun = 22;
      this.state = "HURT";
      this.vel.x = -this.facing * 3;
      audio.block();
      return "parry";
    }
    if (this.blocking) {
      this.hp = Math.max(0, this.hp - amount * 0.12);
      this.vel.x = kb.x * 0.25;
      audio.block();
      return "block";
    }
    this.hp = Math.max(0, this.hp - amount);
    this.hitstun = heavy ? 18 : 10;
    this.state = this.hp <= 0 ? "KO" : "HURT";
    this.vel.x = kb.x;
    this.vel.y = kb.y;
    this.anim = 0;
    audio.snap(heavy);
    if (this.hp <= 0) audio.ko();
    return "hit";
  }

  physics(plats: Plat[]) {
    this.t += STEP;
    if (this.hitstun > 0) this.hitstun--;
    if (this.invuln > 0) this.invuln--;
    if (this.parryWin > 0) this.parryWin--;
    if (this.ignoringPlatTimer > 0) this.ignoringPlatTimer--;
    if (this.hitstun === 0 && (this.state === "HURT" || this.state === "THROWN")) this.state = "IDLE";

    this.isWallSliding = false;
    this.wallSide = 0;

    // Wall slide detection
    if (!this.grounded && (this.state === "IDLE" || this.state === "DASH")) {
      if (this.pos.x <= 112 && this.vel.y > 0) {
        this.isWallSliding = true;
        this.wallSide = -1;
      } else if (this.pos.x >= 1168 && this.vel.y > 0) {
        this.isWallSliding = true;
        this.wallSide = 1;
      }
    }

    const gravity = this.isWallSliding ? 0.18 : 0.68;
    this.vel.y += gravity;
    if (this.isWallSliding) {
      this.vel.y = Math.min(this.vel.y, 3.5);
    }

    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;
    this.vel.x *= this.grounded ? 0.78 : 0.92;

    this.grounded = false;
    for (const p of plats) {
      if (p.y < GROUND && this.ignoringPlatTimer > 0) {
        continue;
      }
      if (
        this.pos.x >= p.x &&
        this.pos.x <= p.x + p.w &&
        this.pos.y >= p.y &&
        this.pos.y - this.vel.y <= p.y + 18 &&
        this.vel.y >= 0
      ) {
        this.pos.y = p.y;
        this.vel.y = 0;
        this.grounded = true;
        this.jumps = 2;
        this.airDashes = 1;
      }
    }

    if (this.pos.x < 110) {
      this.pos.x = 110;
      if (Math.abs(this.vel.x) > 7) this.vel.y = Math.min(this.vel.y, -7);
      this.vel.x = Math.abs(this.vel.x) * 0.7;
    }
    if (this.pos.x > 1170) {
      this.pos.x = 1170;
      if (Math.abs(this.vel.x) > 7) this.vel.y = Math.min(this.vel.y, -7);
      this.vel.x = -Math.abs(this.vel.x) * 0.7;
    }
    if (this.pos.y > H + 80) {
      this.pos.y = GROUND;
      this.vel.y = 0;
    }

    this.updateHits();
    this.trail.push({ x: this.pos.x, y: this.pos.y - 40 });
    if (this.trail.length > 12) this.trail.shift();
    this.pose();
  }

  updateHits() {
    this.hitOn = false;
    this.hit = null;
    if (this.state === "JAB") {
      this.anim--;
      if (this.anim > 4 && this.anim < 11) {
        this.hitOn = !this.comboHit;
        this.hit = {
          x: this.pos.x + this.facing * 38,
          y: this.pos.y - 48,
          r: 26,
          dmg: 7,
          kb: v(this.facing * 6.5, -3.2),
          heavy: false,
        };
      }
      if (this.anim <= 0) this.state = "IDLE";
    } else if (this.state === "CROUCH_JAB") {
      this.anim--;
      if (this.anim > 3 && this.anim < 9) {
        this.hitOn = !this.comboHit;
        this.hit = {
          x: this.pos.x + this.facing * 36,
          y: this.pos.y - 20,
          r: 24,
          dmg: 6,
          kb: v(this.facing * 5, -2.5),
          heavy: false,
        };
      }
      if (this.anim <= 0) this.state = "CROUCH";
    } else if (this.state === "KICK") {
      this.anim--;
      if (this.anim > 6 && this.anim < 16) {
        this.hitOn = !this.comboHit;
        this.hit = {
          x: this.pos.x + this.facing * 52,
          y: this.pos.y - (this.grounded ? 36 : 70),
          r: 34,
          dmg: 13,
          kb: v(this.facing * 11, this.grounded ? -6.5 : 4),
          heavy: true,
        };
      }
      if (this.anim <= 0) this.state = "IDLE";
    } else if (this.state === "SWEEP") {
      this.anim--;
      if (this.anim > 5 && this.anim < 14) {
        this.hitOn = !this.comboHit;
        this.hit = {
          x: this.pos.x + this.facing * 48,
          y: this.pos.y - 12,
          r: 30,
          dmg: 11,
          kb: v(this.facing * 8, -7.5),
          heavy: true,
        };
      }
      if (this.anim <= 0) this.state = "CROUCH";
    } else if (this.state === "UPPER") {
      this.anim--;
      if (this.anim > 8 && this.anim < 18) {
        this.hitOn = !this.comboHit;
        this.hit = {
          x: this.pos.x + this.facing * 36,
          y: this.pos.y - 78,
          r: 36,
          dmg: 15,
          kb: v(this.facing * 4, -16),
          heavy: true,
        };
      }
      if (this.anim <= 0) this.state = "IDLE";
    } else if (this.state === "AIR_AXE") {
      this.anim--;
      if (this.anim > 6 && this.anim < 18) {
        this.hitOn = !this.comboHit;
        this.hit = {
          x: this.pos.x + this.facing * 32,
          y: this.pos.y - 16,
          r: 38,
          dmg: 16,
          kb: v(this.facing * 3, 15),
          heavy: true,
        };
      }
      if (this.anim <= 0) this.state = "IDLE";
    } else if (this.state === "SPECIAL") {
      this.anim--;
      if (this.anim > 10 && this.anim < 32) {
        this.hitOn = !this.comboHit;
        this.hit = {
          x: this.pos.x + this.facing * 62,
          y: this.pos.y - 45,
          r: 68,
          dmg: 28,
          kb: v(this.facing * 18, -12),
          heavy: true,
        };
      }
      if (this.anim <= 0) this.state = "IDLE";
    } else if (this.state === "EX_SPECIAL") {
      this.anim--;
      if (this.anim > 8 && this.anim < 28) {
        this.hitOn = !this.comboHit;
        this.hit = {
          x: this.pos.x + this.facing * 50,
          y: this.pos.y - 48,
          r: 54,
          dmg: 19,
          kb: v(this.facing * 14, -10),
          heavy: true,
        };
      }
      if (this.anim <= 0) this.state = "IDLE";
    } else if (this.state === "GRAB") {
      this.anim--;
      if (this.anim > 6 && this.anim < 12) {
        this.hitOn = !this.comboHit;
        this.hit = {
          x: this.pos.x + this.facing * 30,
          y: this.pos.y - 40,
          r: 28,
          dmg: 14,
          kb: v(this.facing * 12, -8),
          heavy: true,
        };
      }
      if (this.anim <= 0) this.state = "IDLE";
    } else if (this.state === "DASH") {
      this.anim--;
      if (this.anim <= 0) this.state = "IDLE";
    }
  }

  pose() {
    const f = this.facing;
    const bx = this.pos.x;
    const by = this.pos.y;
    const j = this.joints;
    j.pelvis.x = bx;
    j.pelvis.y = by - 38;
    j.neck.x = bx + this.vel.x * 0.7;
    j.neck.y = by - 64;
    j.head.x = j.neck.x + f * 4;
    j.head.y = j.neck.y - 14;

    if (this.state === "KO") {
      j.head.x = bx + f * 28;
      j.head.y = by - 18;
      j.neck.x = bx + f * 10;
      j.neck.y = by - 22;
      j.pelvis.x = bx;
      j.pelvis.y = by - 10;
      j.lFoot.x = bx - 20;
      j.lFoot.y = by;
      j.rFoot.x = bx + 24;
      j.rFoot.y = by - 4;
      j.lHand.x = bx - 16;
      j.lHand.y = by - 8;
      j.rHand.x = bx + 30;
      j.rHand.y = by - 6;
      j.lKnee.x = bx - 10;
      j.lKnee.y = by - 6;
      j.rKnee.x = bx + 12;
      j.rKnee.y = by - 8;
      j.lElbow.x = bx - 8;
      j.lElbow.y = by - 12;
      j.rElbow.x = bx + 18;
      j.rElbow.y = by - 10;
      return;
    }

    if (!this.grounded) {
      j.lKnee.x = bx - f * 12;
      j.lKnee.y = by - 24;
      j.lFoot.x = bx - f * 18;
      j.lFoot.y = by - 12;
      j.rKnee.x = bx + f * 10;
      j.rKnee.y = by - 18;
      j.rFoot.x = bx + f * 14;
      j.rFoot.y = by - 6;
    } else if (Math.abs(this.vel.x) > 0.8) {
      const c = Math.sin(this.t * 14);
      j.lKnee.x = bx + c * 18;
      j.lKnee.y = by - 20;
      j.lFoot.x = bx + c * 24;
      j.lFoot.y = by;
      j.rKnee.x = bx - c * 18;
      j.rKnee.y = by - 20;
      j.rFoot.x = bx - c * 24;
      j.rFoot.y = by;
    } else {
      const b = Math.sin(this.t * 3) * 1.6;
      j.pelvis.y += b;
      j.lKnee.x = bx - 10;
      j.lKnee.y = by - 18;
      j.lFoot.x = bx - 12;
      j.lFoot.y = by;
      j.rKnee.x = bx + 10;
      j.rKnee.y = by - 18;
      j.rFoot.x = bx + 12;
      j.rFoot.y = by;
    }

    if (this.state === "CROUCH") {
      j.pelvis.y = by - 22;
      j.neck.y = by - 40;
      j.head.y = j.neck.y - 12;
      j.lKnee.x = bx - f * 16;
      j.lKnee.y = by - 10;
      j.lFoot.x = bx - f * 22;
      j.lFoot.y = by;
      j.rKnee.x = bx + f * 14;
      j.rKnee.y = by - 12;
      j.rFoot.x = bx + f * 20;
      j.rFoot.y = by;
      j.lHand.x = bx + f * 12;
      j.lHand.y = by - 18;
      j.rHand.x = bx + f * 18;
      j.rHand.y = by - 16;
    } else if (this.state === "CROUCH_JAB") {
      j.pelvis.y = by - 22;
      j.neck.y = by - 40;
      j.head.y = j.neck.y - 12;
      j.rHand.x = bx + f * 38;
      j.rHand.y = by - 20;
      j.rElbow.x = bx + f * 22;
      j.rElbow.y = by - 24;
    } else if (this.state === "SWEEP") {
      j.pelvis.y = by - 18;
      j.neck.y = by - 34;
      j.head.y = j.neck.y - 12;
      j.rFoot.x = bx + f * 50;
      j.rFoot.y = by - 10;
      j.rKnee.x = bx + f * 26;
      j.rKnee.y = by - 14;
    } else if (this.state === "AIR_AXE") {
      j.rFoot.x = bx + f * 24;
      j.rFoot.y = by - 12;
      j.rKnee.x = bx + f * 18;
      j.rKnee.y = by - 32;
      j.rHand.x = bx + f * 28;
      j.rHand.y = by - 56;
    } else if (this.state === "GRAB") {
      j.rHand.x = j.neck.x + f * 34;
      j.rHand.y = j.neck.y - 6;
      j.lHand.x = j.neck.x + f * 32;
      j.lHand.y = j.neck.y + 2;
    } else if (this.state === "EX_SPECIAL") {
      j.rHand.x = j.neck.x + f * 44;
      j.rHand.y = j.neck.y - 18;
      j.lHand.x = j.neck.x + f * 48;
      j.lHand.y = j.neck.y + 10;
    } else if (this.state === "JAB") {
      const punch = (14 - this.anim) / 14;
      j.rElbow.x = j.neck.x + f * 24;
      j.rElbow.y = j.neck.y + 4;
      j.rHand.x = j.neck.x + f * (30 + punch * 28);
      j.rHand.y = j.neck.y + 2;
      j.lElbow.x = j.neck.x - f * 8;
      j.lElbow.y = j.neck.y + 12;
      j.lHand.x = j.neck.x + f * 4;
      j.lHand.y = j.neck.y + 6;
    } else if (this.state === "KICK") {
      j.rKnee.x = bx + f * 26;
      j.rKnee.y = by - 36;
      j.rFoot.x = bx + f * 56;
      j.rFoot.y = by - (this.grounded ? 42 : 78);
      j.lElbow.x = j.neck.x - f * 18;
      j.lElbow.y = j.neck.y + 6;
      j.lHand.x = j.neck.x - f * 24;
      j.lHand.y = j.neck.y + 16;
      j.rElbow.x = j.neck.x + f * 8;
      j.rElbow.y = j.neck.y + 10;
      j.rHand.x = j.neck.x + f * 4;
      j.rHand.y = j.neck.y + 18;
    } else if (this.state === "UPPER") {
      j.rHand.x = j.neck.x + f * 18;
      j.rHand.y = j.neck.y - 28;
      j.rElbow.x = j.neck.x + f * 10;
      j.rElbow.y = j.neck.y - 8;
      j.lHand.x = j.neck.x - f * 12;
      j.lHand.y = j.neck.y + 10;
      j.lElbow.x = j.neck.x - f * 6;
      j.lElbow.y = j.neck.y + 8;
    } else if (this.state === "SPECIAL") {
      j.rHand.x = j.neck.x + f * 50;
      j.rHand.y = j.neck.y - 12;
      j.lHand.x = j.neck.x + f * 54;
      j.lHand.y = j.neck.y + 4;
      j.rElbow.x = j.neck.x + f * 28;
      j.rElbow.y = j.neck.y - 4;
      j.lElbow.x = j.neck.x + f * 26;
      j.lElbow.y = j.neck.y + 8;
    } else if (this.blocking) {
      j.lElbow.x = j.neck.x + f * 10;
      j.lElbow.y = j.neck.y - 4;
      j.lHand.x = j.neck.x + f * 16;
      j.lHand.y = j.neck.y - 16;
      j.rElbow.x = j.neck.x + f * 12;
      j.rElbow.y = j.neck.y + 2;
      j.rHand.x = j.neck.x + f * 18;
      j.rHand.y = j.neck.y - 10;
    } else {
      const swing = Math.sin(this.t * 14) * (Math.abs(this.vel.x) > 0.8 ? 16 : 4);
      j.lElbow.x = j.neck.x - swing;
      j.lElbow.y = j.neck.y + 14;
      j.lHand.x = j.neck.x - swing * 1.2;
      j.lHand.y = j.neck.y + 26;
      j.rElbow.x = j.neck.x + swing;
      j.rElbow.y = j.neck.y + 14;
      j.rHand.x = j.neck.x + swing * 1.2;
      j.rHand.y = j.neck.y + 26;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    const trem = () => (Math.random() - 0.5) * 1.1;
    const col = this.isP1 ? "#14171a" : "#7a2424";
    ctx.save();
    if (this.trail.length > 1 && Math.abs(this.vel.x) + Math.abs(this.vel.y) > 6) {
      ctx.strokeStyle = col;
      ctx.globalAlpha = 0.18;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.trail[0].x, this.trail[0].y);
      for (const p of this.trail) ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.lineWidth = this.state === "HURT" ? 5.2 : 3.8;
    const j = this.joints;
    ctx.beginPath();
    ctx.arc(j.head.x + trem(), j.head.y + trem(), 10, 0, Math.PI * 2);
    ctx.stroke();
    if (this.ink >= 100) {
      ctx.beginPath();
      ctx.arc(j.head.x, j.head.y, 6.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(j.neck.x + trem(), j.neck.y + trem());
    ctx.lineTo(j.pelvis.x + trem(), j.pelvis.y + trem());
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(j.neck.x, j.neck.y);
    ctx.lineTo(j.lElbow.x + trem(), j.lElbow.y + trem());
    ctx.lineTo(j.lHand.x + trem(), j.lHand.y + trem());
    ctx.moveTo(j.neck.x, j.neck.y);
    ctx.lineTo(j.rElbow.x + trem(), j.rElbow.y + trem());
    ctx.lineTo(j.rHand.x + trem(), j.rHand.y + trem());
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(j.pelvis.x, j.pelvis.y);
    ctx.lineTo(j.lKnee.x + trem(), j.lKnee.y + trem());
    ctx.lineTo(j.lFoot.x + trem(), j.lFoot.y + trem());
    ctx.moveTo(j.pelvis.x, j.pelvis.y);
    ctx.lineTo(j.rKnee.x + trem(), j.rKnee.y + trem());
    ctx.lineTo(j.rFoot.x + trem(), j.rFoot.y + trem());
    ctx.stroke();
    if (this.state === "SPECIAL" && this.hit) {
      ctx.strokeStyle = "#2f4a68";
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.arc(this.hit.x, this.hit.y, 42 + Math.random() * 14, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (this.blocking) {
      ctx.strokeStyle = "rgba(61,90,122,0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.pos.x + this.facing * 18, this.pos.y - 40, 22, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export class DoodleGame {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  audio = new DoodleAudio();
  keys = new Set<string>();
  forced = new Set<string>();
  p1: Fighter;
  p2: Fighter;
  plats: Plat[] = [
    { x: 60, y: GROUND, w: 1160, h: 50 },
    { x: 240, y: 448, w: 210, h: 18 },
    { x: 820, y: 408, w: 220, h: 18 },
    { x: 510, y: 286, w: 250, h: 18 },
  ];
  particles: Particle[] = [];
  decals: Decal[] = [];
  paper: HTMLCanvasElement | null = null;
  acc = 0;
  last = 0;
  raf = 0;
  running = false;
  phase: HudSnapshot["phase"] = "menu";
  timer = 99;
  timerAcc = 0;
  freeze = 0;
  trauma = 0;
  combo = 0;
  comboT = 0;
  cam = 0;
  jumpLatch = false;
  jabLatch = false;
  kickLatch = false;
  specLatch = false;
  dashLatch = false;
  blockLatch = false;
  aiBlockT = 0;
  touch: { lx: number; ly: number; id: number | null } = { lx: 0, ly: 0, id: null };
  onHud?: (h: HudSnapshot) => void;
  reduced = false;

  constructor(canvas: HTMLCanvasElement, onHud?: (h: HudSnapshot) => void) {
    this.canvas = canvas;
    const c = canvas.getContext("2d");
    if (!c) throw new Error("Canvas 2D unavailable");
    this.ctx = c;
    this.onHud = onHud;
    this.p1 = new Fighter(true);
    this.p2 = new Fighter(false);
    this.p1.reset(280);
    this.p2.reset(1000);
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.resize();
    this.bind();
    this.bakePaper();
    this.emit();
  }

  startFight() {
    this.audio.unlock();
    this.p1.reset(280);
    this.p2.reset(1000);
    this.particles = [];
    this.decals = [];
    this.timer = 99;
    this.timerAcc = 0;
    this.combo = 0;
    this.phase = "fight";
    this.running = true;
    this.emit();
  }

  bind() {
    const down = (e: KeyboardEvent) => {
      this.keys.add(e.code);
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
      this.audio.unlock();
    };
    const up = (e: KeyboardEvent) => this.keys.delete(e.code);
    const clear = () => this.keys.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.keys.clear();
      else this.audio.unlock();
    });
    window.addEventListener("resize", () => this.resize());

    const ptr = (e: PointerEvent) => {
      const r = this.canvas.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * W;
      const y = ((e.clientY - r.top) / r.height) * H;
      if (e.type === "pointerdown") {
        this.audio.unlock();
        if (x < W * 0.42) {
          this.touch.id = e.pointerId;
          this.touch.lx = x;
          this.touch.ly = y;
        }
      }
      if (e.type === "pointermove" && this.touch.id === e.pointerId) {
        this.touch.lx = x;
        this.touch.ly = y;
      }
      if (e.type === "pointerup" || e.type === "pointercancel") {
        if (this.touch.id === e.pointerId) this.touch.id = null;
      }
    };
    this.canvas.addEventListener("pointerdown", ptr);
    this.canvas.addEventListener("pointermove", ptr);
    this.canvas.addEventListener("pointerup", ptr);
    this.canvas.addEventListener("pointercancel", ptr);

    window.__controlsTest = {
      getYaw: () => this.p1.pos.x,
      getSpeed: () => Math.abs(this.p1.vel.x),
      getX: () => this.p1.pos.x,
      setKeys: (codes: string[]) => {
        this.forced = new Set(codes);
      },
    };
  }

  held(code: string) {
    return this.keys.has(code) || this.forced.has(code);
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.floor(r.width * dpr));
    const h = Math.max(1, Math.floor(r.height * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.ctx.setTransform(w / W, 0, 0, h / H, 0, 0);
  }

  bakePaper() {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d");
    if (!g) return;
    g.fillStyle = "#fbf9f3";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "rgba(196,168,130,0.08)";
    for (let i = 0; i < 40; i++) {
      g.beginPath();
      g.ellipse(Math.random() * W, Math.random() * H, 40 + Math.random() * 80, 12 + Math.random() * 20, Math.random(), 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = "#c45c4a";
    g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(90, 0);
    g.lineTo(88, H);
    g.stroke();
    g.strokeStyle = "rgba(147,181,214,0.55)";
    g.lineWidth = 1.1;
    for (let y = 64; y < H; y += 34) {
      g.beginPath();
      g.moveTo(0, y + (Math.random() - 0.5));
      g.lineTo(W, y);
      g.stroke();
    }
    for (let y = 28; y < H; y += 42) {
      g.fillStyle = "#2a2a28";
      g.beginPath();
      g.arc(34, y, 6, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#5a574e";
      g.lineWidth = 3;
      g.beginPath();
      g.arc(34, y, 14, Math.PI * 0.5, Math.PI * 1.85);
      g.stroke();
    }
    g.fillStyle = "rgba(61,90,122,0.35)";
    g.font = '15px "Courier New", monospace';
    g.fillText("E = mc^2", 150, 118);
    g.fillText("int f(x) dx", 400, 92);
    g.fillText("x = (-b +/- sqrt)/2a", 820, 136);
    this.drawCube(g, 610, 78);
    this.drawDragon(g, 1020, 96);
    g.strokeStyle = "rgba(90,87,78,0.35)";
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(1080, 520, 54, 0, Math.PI * 1.6);
    g.stroke();
    g.beginPath();
    g.arc(1080, 520, 42, 0.4, Math.PI * 1.9);
    g.stroke();
    this.paper = c;
  }

  drawCube(g: CanvasRenderingContext2D, x: number, y: number) {
    g.strokeStyle = "#5a574e";
    g.lineWidth = 1.7;
    const s = 28;
    g.strokeRect(x, y, s, s);
    g.strokeRect(x + 10, y - 10, s, s);
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + 10, y - 10);
    g.moveTo(x + s, y);
    g.lineTo(x + s + 10, y - 10);
    g.moveTo(x + s, y + s);
    g.lineTo(x + s + 10, y + s - 10);
    g.stroke();
  }

  drawDragon(g: CanvasRenderingContext2D, x: number, y: number) {
    g.strokeStyle = "#5a574e";
    g.lineWidth = 1.8;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + 22, y - 24, x + 44, y);
    g.quadraticCurveTo(x + 64, y - 32, x + 86, y - 8);
    g.stroke();
  }

  clipPlat(g: CanvasRenderingContext2D, p: Plat) {
    g.save();
    g.strokeStyle = "#2a2a28";
    g.lineWidth = 4;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(p.x, p.y);
    g.lineTo(p.x + p.w, p.y);
    g.stroke();
    g.strokeStyle = "rgba(90,87,78,0.35)";
    g.lineWidth = 1.4;
    for (let i = 0; i < p.w; i += 11) {
      g.beginPath();
      g.moveTo(p.x + i, p.y + 2);
      g.lineTo(p.x + i - 8, p.y + 14);
      g.stroke();
    }
    g.restore();
  }

  loop = (ts: number) => {
    this.raf = requestAnimationFrame(this.loop);
    if (!this.last) this.last = ts;
    let dt = (ts - this.last) / 1000;
    this.last = ts;
    dt = Math.min(dt, 0.1);
    this.acc += dt;
    while (this.acc >= STEP) {
      if (this.freeze > 0) this.freeze--;
      else if (this.phase === "fight") this.step();
      this.acc -= STEP;
    }
    this.draw();
  };

  mount() {
    cancelAnimationFrame(this.raf);
    this.last = 0;
    this.raf = requestAnimationFrame(this.loop);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
  }

  step() {
    this.timerAcc += STEP;
    if (this.timerAcc >= 1) {
      this.timerAcc = 0;
      if (this.timer > 0) this.timer--;
    }
    if (this.comboT > 0) this.comboT--;
    else this.combo = 0;
    this.trauma = Math.max(0, this.trauma - STEP * 1.8);
    if (this.aiBlockT > 0) this.aiBlockT--;

    this.inputP1();
    this.aiThink();
    if (this.p1.pos.x < this.p2.pos.x) {
      this.p1.facing = 1;
      this.p2.facing = -1;
    } else {
      this.p1.facing = -1;
      this.p2.facing = 1;
    }
    this.p1.physics(this.plats);
    this.p2.physics(this.plats);
    this.resolve(this.p1, this.p2);
    this.resolve(this.p2, this.p1);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.28;
      p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    const mid = (this.p1.pos.x + this.p2.pos.x) / 2;
    const want = (mid - W / 2) * 0.28;
    this.cam += (want - this.cam) * 0.08;
    if (this.p1.hp <= 0 || this.p2.hp <= 0 || this.timer <= 0) {
      this.phase = "over";
    }
    this.emit();
  }

  inputP1() {
    if (this.p1.hitstun > 0 || this.p1.state === "KO") return;
    const left = this.held("KeyA") || this.held("ArrowLeft");
    const right = this.held("KeyD") || this.held("ArrowRight");
    const up = this.held("KeyW") || this.held("ArrowUp");
    const down = this.held("KeyS") || this.held("ArrowDown");
    const jab = this.held("KeyJ") || this.held("KeyF");
    const kick = this.held("KeyK") || this.held("KeyG");
    const spec = this.held("KeyL") || this.held("KeyH");
    const grab = this.held("KeyU") || (jab && kick);
    const dash = this.held("Space");

    if (this.touch.id != null) {
      const dx = this.touch.lx - 160;
      if (dx < -18) this.p1.vel.x = -this.p1.walk;
      else if (dx > 18) this.p1.vel.x = this.p1.walk;
      if (this.touch.ly < 420 && !this.jumpLatch) {
        if (this.p1.isWallSliding) {
          this.p1.vel.y = this.p1.jumpF * 0.9;
          this.p1.vel.x = -this.p1.wallSide * 10;
          this.p1.jumps = 1;
          this.jumpLatch = true;
          this.audio.scribble();
        } else if (this.p1.jumps > 0) {
          this.p1.vel.y = this.p1.jumpF;
          this.p1.jumps--;
          this.jumpLatch = true;
          this.audio.scribble();
        }
      }
    }

    if (down && down && this.p1.grounded && !up) {
      if (down && !this.jumpLatch && this.held("KeyS")) {
        // drop through platform check
        this.p1.ignoringPlatTimer = 12;
      }
    }

    if (left) this.p1.vel.x = -this.p1.walk;
    else if (right) this.p1.vel.x = this.p1.walk;

    if (up) {
      if (!this.jumpLatch) {
        if (this.p1.isWallSliding) {
          this.p1.vel.y = this.p1.jumpF * 0.9;
          this.p1.vel.x = -this.p1.wallSide * 10;
          this.p1.jumps = 1;
          this.jumpLatch = true;
          this.audio.scribble();
        } else if (this.p1.jumps > 0) {
          this.p1.vel.y = this.p1.jumpF;
          this.p1.jumps--;
          this.jumpLatch = true;
          this.audio.scribble();
        }
      }
    } else this.jumpLatch = false;

    this.p1.blocking = down && this.p1.grounded && !left && !right;
    if (down && this.p1.grounded && (left || right)) {
      if (this.p1.canAct()) this.p1.state = "CROUCH";
    } else if (down && this.p1.grounded && !jab && !kick && !spec && !grab) {
      if (this.p1.canAct()) this.p1.state = "CROUCH";
    } else if (!down && this.p1.state === "CROUCH") {
      this.p1.state = "IDLE";
    }

    if (down && !this.blockLatch) {
      this.p1.parryWin = 10;
      this.blockLatch = true;
    } else if (!down) this.blockLatch = false;

    if (grab) {
      this.p1.attack("GRAB", this.audio);
    } else if (jab && !this.jabLatch) {
      if (this.p1.state === "CROUCH" || (down && this.p1.grounded)) {
        this.p1.attack("CROUCH_JAB", this.audio);
      } else {
        this.p1.attack("JAB", this.audio);
      }
      this.jabLatch = true;
    } else if (!jab) this.jabLatch = false;

    if (kick && !this.kickLatch) {
      if (!this.p1.grounded && down) {
        this.p1.attack("AIR_AXE", this.audio);
      } else if (this.p1.state === "CROUCH" || (down && this.p1.grounded)) {
        this.p1.attack("SWEEP", this.audio);
      } else if (up) {
        this.p1.attack("UPPER", this.audio);
      } else {
        this.p1.attack("KICK", this.audio);
      }
      this.kickLatch = true;
    } else if (!kick) this.kickLatch = false;

    if (spec && !this.specLatch) {
      if (this.p1.ink >= 100) {
        this.p1.attack("SPECIAL", this.audio);
      } else if (this.p1.ink >= 50) {
        this.p1.attack("EX_SPECIAL", this.audio);
      }
      this.specLatch = true;
    } else if (!spec) this.specLatch = false;

    if (dash && !this.dashLatch) {
      const dir = left ? -1 : right ? 1 : this.p1.facing;
      this.p1.dash(dir, this.audio);
      this.dashLatch = true;
    } else if (!dash) this.dashLatch = false;
  }

  aiThink() {
    const ai = this.p2;
    if (ai.hitstun > 0 || ai.state === "KO" || ai.state === "THROWN") return;
    const dx = this.p1.pos.x - ai.pos.x;
    const dist = Math.abs(dx);
    ai.blocking = this.aiBlockT > 0;

    // AI wall jump recovery
    if (ai.isWallSliding && Math.random() < 0.1) {
      ai.vel.y = ai.jumpF * 0.9;
      ai.vel.x = -ai.wallSide * 10;
      ai.jumps = 1;
      this.audio.scribble();
      return;
    }

    if (dist > 180) {
      ai.vel.x = Math.sign(dx) * ai.walk * 0.85;
      if (ai.grounded && Math.random() < 0.02) {
        ai.vel.y = ai.jumpF;
        ai.jumps--;
      } else if (!ai.grounded && ai.airDashes > 0 && Math.random() < 0.03) {
        ai.dash(Math.sign(dx) || ai.facing, this.audio);
      }
    } else if (dist < 55) {
      const closeRoll = Math.random();
      if (closeRoll < 0.08) {
        ai.attack("GRAB", this.audio);
      } else if (closeRoll < 0.15) {
        ai.attack("CROUCH_JAB", this.audio);
      } else if (closeRoll < 0.2) {
        ai.dash(-Math.sign(dx) || ai.facing, this.audio);
      } else {
        ai.vel.x = -Math.sign(dx) * ai.walk * 0.6;
      }
    } else {
      if (this.p1.state === "JAB" || this.p1.state === "KICK" || this.p1.state === "UPPER" || this.p1.state === "SPECIAL") {
        if (Math.random() < 0.5) this.aiBlockT = 18;
      }
      const roll = Math.random();
      if (roll < 0.06) {
        ai.attack("JAB", this.audio);
      } else if (roll < 0.1) {
        if (this.p1.pos.y < ai.pos.y - 30) {
          ai.attack("UPPER", this.audio);
        } else if (!ai.grounded && this.p1.pos.y > ai.pos.y + 20) {
          ai.attack("AIR_AXE", this.audio);
        } else {
          ai.attack(Math.random() < 0.5 ? "SWEEP" : "KICK", this.audio);
        }
      } else if (ai.ink >= 100 && roll < 0.14) {
        ai.attack("SPECIAL", this.audio);
      } else if (ai.ink >= 50 && roll < 0.2) {
        ai.attack("EX_SPECIAL", this.audio);
      } else if (roll < 0.24) {
        ai.dash(-Math.sign(dx) || ai.facing, this.audio);
      }
    }
  }

  resolve(a: Fighter, b: Fighter) {
    if (!a.hitOn || !a.hit) return;
    const hb = a.hit;
    const ty = b.pos.y - 36;
    const d = Math.hypot(hb.x - b.pos.x, hb.y - ty);
    if (d < hb.r + 22) {
      a.comboHit = true;
      a.hitOn = false;
      const didParry = b.parryWin > 0 && b.blocking;
      if (didParry) {
        a.hurt(0, v(-a.facing * 4, 0), false, this.audio, true);
        b.parryWin = 0;
        b.ink = Math.min(100, b.ink + 18);
        this.splatter(hb.x, hb.y, "#2f4a68", 12);
        return;
      }
      const res = b.hurt(hb.dmg, hb.kb, hb.heavy, this.audio);
      if (res === "hit") {
        this.trauma = Math.min(1, this.trauma + (hb.heavy ? 0.55 : 0.28));
        this.freeze = hb.heavy ? 6 : 3;
        this.combo++;
        this.comboT = 90;
        a.ink = Math.min(100, a.ink + (hb.heavy ? 22 : 11));
        this.splatter(hb.x, hb.y, b.isP1 ? "#1e293b" : "#7a2424", hb.heavy ? 16 : 8);
      } else if (res === "block") {
        this.trauma = Math.min(1, this.trauma + 0.12);
        this.freeze = 2;
        this.splatter(hb.x, hb.y, "rgba(61,90,122,0.4)", 4);
      }
    }
  }

  splatter(x: number, y: number, color: string, n: number) {
    const pts: Vec[] = [];
    const r = 6 + Math.random() * 14;
    const c = 10 + Math.floor(Math.random() * 8);
    for (let i = 0; i < c; i++) {
      const ang = (i / c) * Math.PI * 2;
      const d = r * (0.55 + Math.random() * 0.8);
      pts.push({ x: Math.cos(ang) * d, y: Math.sin(ang) * d });
    }
    this.decals.push({ x, y, pts, color });
    if (this.decals.length > 48) this.decals.shift();
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 8;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 2,
        life: 22,
        max: 22,
        size: 2 + Math.random() * 3,
        color,
      });
    }
  }

  draw() {
    this.resize();
    const ctx = this.ctx;
    ctx.save();
    if (this.trauma > 0 && !this.reduced) {
      const s = this.trauma * this.trauma;
      ctx.translate((Math.random() - 0.5) * 14 * s, (Math.random() - 0.5) * 12 * s);
    }
    if (this.paper) ctx.drawImage(this.paper, 0, 0);
    ctx.save();
    ctx.translate(-this.cam * 0.35, 0);
    ctx.fillStyle = "rgba(90,87,78,0.28)";
    ctx.font = '14px "Courier New", monospace';
    ctx.fillText("margin notes...", 180, 160);
    ctx.restore();

    ctx.save();
    ctx.translate(-this.cam * 0.15, 0);
    for (const d of this.decals) {
      ctx.fillStyle = d.color;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.moveTo(d.x + d.pts[0].x, d.y + d.pts[0].y);
      for (let i = 1; i < d.pts.length; i++) ctx.lineTo(d.x + d.pts[i].x, d.y + d.pts[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    for (const p of this.plats) this.clipPlat(ctx, p);
    this.p1.draw(ctx);
    this.p2.draw(ctx);
    for (const p of this.particles) {
      ctx.globalAlpha = p.life / p.max;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 1.4, p.y - p.vy * 1.4);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    ctx.save();
    ctx.translate(-this.cam * 0.7, 0);
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = "#2a2a28";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-20, 640);
    ctx.lineTo(90, 500);
    ctx.lineTo(40, 720);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(1180, 80);
    ctx.quadraticCurveTo(1260, 200, 1220, 340);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
    ctx.restore();
  }

  emit() {
    this.onHud?.({
      p1Hp: this.p1.hp,
      p2Hp: this.p2.hp,
      p1Ink: this.p1.ink,
      p2Ink: this.p2.ink,
      timer: this.timer,
      combo: this.combo,
      phase: this.phase,
      winner: this.phase === "over" ? (this.p1.hp === this.p2.hp ? "draw" : this.p1.hp > this.p2.hp ? "p1" : "p2") : null,
      freeze: this.freeze,
    });
  }

  touchAttack(kind: "JAB" | "KICK" | "SPECIAL" | "DASH" | "GRAB") {
    this.audio.unlock();
    if (this.phase !== "fight") return;
    if (kind === "DASH") this.p1.dash(this.p1.facing, this.audio);
    else if (kind === "SPECIAL") {
      if (this.p1.ink >= 100) this.p1.attack("SPECIAL", this.audio);
      else if (this.p1.ink >= 50) this.p1.attack("EX_SPECIAL", this.audio);
    } else this.p1.attack(kind, this.audio);
  }
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      getX?: () => number;
      setKeys?: (codes: string[]) => void;
    };
  }
}
