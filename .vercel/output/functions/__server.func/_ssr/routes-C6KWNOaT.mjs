import { i as __toESM } from "../_runtime.mjs";
import { L as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-C6KWNOaT.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DoodleAudio = class {
	ctx = null;
	master = null;
	sfx = null;
	muted = false;
	unlock() {
		if (!this.ctx) {
			const Ctx = window.AudioContext || window.webkitAudioContext;
			this.ctx = new Ctx({ latencyHint: "interactive" });
			this.master = this.ctx.createGain();
			this.sfx = this.ctx.createGain();
			this.sfx.gain.value = .55;
			this.sfx.connect(this.master);
			this.master.connect(this.ctx.destination);
		}
		if (this.ctx.state === "suspended") this.ctx.resume();
	}
	setMuted(m) {
		this.muted = m;
		if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, .02);
	}
	noise(duration, color = .4) {
		if (!this.ctx || !this.sfx || this.muted) return;
		const n = this.ctx.sampleRate * duration;
		const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
		const d = buf.getChannelData(0);
		let last = 0;
		for (let i = 0; i < n; i++) {
			const w = Math.random() * 2 - 1;
			last = last * color + w * (1 - color);
			d[i] = last;
		}
		const src = this.ctx.createBufferSource();
		src.buffer = buf;
		return src;
	}
	scribble(pan = 0) {
		if (!this.ctx || !this.sfx) return;
		const src = this.noise(.09, .85);
		if (!src) return;
		const bp = this.ctx.createBiquadFilter();
		bp.type = "bandpass";
		bp.frequency.value = 1800 + Math.random() * 900;
		bp.Q.value = 1.4;
		const g = this.ctx.createGain();
		g.gain.setValueAtTime(.22, this.ctx.currentTime);
		g.gain.exponentialRampToValueAtTime(.001, this.ctx.currentTime + .09);
		const p = this.ctx.createStereoPanner();
		p.pan.value = pan;
		src.connect(bp);
		bp.connect(g);
		g.connect(p);
		p.connect(this.sfx);
		src.start();
	}
	snap(heavy = false) {
		if (!this.ctx || !this.sfx) return;
		const o = this.ctx.createOscillator();
		o.type = "triangle";
		const t = this.ctx.currentTime;
		o.frequency.setValueAtTime(heavy ? 140 : 280, t);
		o.frequency.exponentialRampToValueAtTime(40, t + (heavy ? .22 : .12));
		const g = this.ctx.createGain();
		g.gain.setValueAtTime(heavy ? .5 : .28, t);
		g.gain.exponentialRampToValueAtTime(.001, t + (heavy ? .24 : .13));
		o.connect(g);
		g.connect(this.sfx);
		o.start();
		o.stop(t + .26);
		const n = this.noise(heavy ? .18 : .08, .2);
		if (n) {
			const ng = this.ctx.createGain();
			ng.gain.setValueAtTime(heavy ? .35 : .16, t);
			ng.gain.exponentialRampToValueAtTime(.001, t + .18);
			n.connect(ng);
			ng.connect(this.sfx);
			n.start();
		}
	}
	whoosh() {
		if (!this.ctx || !this.sfx) return;
		const src = this.noise(.16, .7);
		if (!src) return;
		const bp = this.ctx.createBiquadFilter();
		bp.type = "bandpass";
		const t = this.ctx.currentTime;
		bp.frequency.setValueAtTime(400, t);
		bp.frequency.exponentialRampToValueAtTime(2200, t + .12);
		const g = this.ctx.createGain();
		g.gain.setValueAtTime(.18, t);
		g.gain.exponentialRampToValueAtTime(.001, t + .16);
		src.connect(bp);
		bp.connect(g);
		g.connect(this.sfx);
		src.start();
	}
	block() {
		if (!this.ctx || !this.sfx) return;
		const o = this.ctx.createOscillator();
		o.type = "square";
		const t = this.ctx.currentTime;
		o.frequency.setValueAtTime(520, t);
		o.frequency.exponentialRampToValueAtTime(180, t + .08);
		const g = this.ctx.createGain();
		g.gain.setValueAtTime(.12, t);
		g.gain.exponentialRampToValueAtTime(.001, t + .09);
		o.connect(g);
		g.connect(this.sfx);
		o.start();
		o.stop(t + .1);
	}
	ko() {
		if (!this.ctx || !this.sfx) return;
		const t = this.ctx.currentTime;
		const o = this.ctx.createOscillator();
		o.type = "sawtooth";
		o.frequency.setValueAtTime(90, t);
		o.frequency.exponentialRampToValueAtTime(28, t + .6);
		const g = this.ctx.createGain();
		g.gain.setValueAtTime(.4, t);
		g.gain.exponentialRampToValueAtTime(.001, t + .62);
		o.connect(g);
		g.connect(this.sfx);
		o.start();
		o.stop(t + .65);
	}
};
var W = 1280;
var H = 720;
var STEP = 1 / 60;
var GROUND = 620;
function v(x = 0, y = 0) {
	return {
		x,
		y
	};
}
var Fighter = class {
	isP1;
	pos = v();
	vel = v();
	facing = 1;
	grounded = false;
	hp = 100;
	ink = 0;
	walk = 6.2;
	jumpF = -14.2;
	jumps = 2;
	blocking = false;
	hitstun = 0;
	state = "IDLE";
	anim = 0;
	hitOn = false;
	hit = null;
	invuln = 0;
	comboHit = false;
	joints = {
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
		rFoot: v()
	};
	t = 0;
	constructor(isP1) {
		this.isP1 = isP1;
	}
	reset(x) {
		this.pos = v(x, 616);
		this.vel = v();
		this.hp = 100;
		this.ink = 0;
		this.state = "IDLE";
		this.hitstun = 0;
		this.anim = 0;
		this.jumps = 2;
		this.blocking = false;
		this.invuln = 0;
	}
	attack(kind, audio) {
		if (this.state === "HURT" || this.state === "KO" || this.hitstun > 0) return;
		if (this.state === "JAB" || this.state === "KICK" || this.state === "SPECIAL") return;
		if (kind === "SPECIAL") {
			if (this.ink < 100) return;
			this.ink = 0;
			this.state = "SPECIAL";
			this.anim = 40;
			this.comboHit = false;
			audio.whoosh();
			return;
		}
		this.state = kind;
		this.anim = kind === "JAB" ? 14 : 22;
		this.comboHit = false;
		audio.scribble(this.facing * .3);
	}
	dash(dir, audio) {
		if (this.state === "KO" || this.hitstun > 0) return;
		if (this.state === "DASH") return;
		this.state = "DASH";
		this.anim = 10;
		this.vel.x = dir * 16;
		this.invuln = 8;
		audio.whoosh();
	}
	hurt(amount, kb, heavy, audio) {
		if (this.state === "KO" || this.invuln > 0) return "miss";
		if (this.blocking) {
			this.hp = Math.max(0, this.hp - amount * .12);
			this.vel.x = kb.x * .25;
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
	physics(plats) {
		this.t += STEP;
		if (this.hitstun > 0) this.hitstun--;
		if (this.invuln > 0) this.invuln--;
		if (this.hitstun === 0 && this.state === "HURT") this.state = "IDLE";
		this.vel.y += .68;
		this.pos.x += this.vel.x;
		this.pos.y += this.vel.y;
		this.vel.x *= this.grounded ? .78 : .92;
		this.grounded = false;
		for (const p of plats) if (this.pos.x >= p.x && this.pos.x <= p.x + p.w && this.pos.y >= p.y && this.pos.y - this.vel.y <= p.y + 16 && this.vel.y >= 0) {
			this.pos.y = p.y;
			this.vel.y = 0;
			this.grounded = true;
			this.jumps = 2;
		}
		if (this.pos.x < 110) {
			this.pos.x = 110;
			this.vel.x = Math.abs(this.vel.x) * .55;
		}
		if (this.pos.x > 1170) {
			this.pos.x = 1170;
			this.vel.x = -Math.abs(this.vel.x) * .55;
		}
		if (this.pos.y > 800) {
			this.pos.y = GROUND;
			this.vel.y = 0;
		}
		this.updateHits();
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
					heavy: false
				};
			}
			if (this.anim <= 0) this.state = "IDLE";
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
					heavy: true
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
					heavy: true
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
		j.neck.x = bx + this.vel.x * .7;
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
		} else if (Math.abs(this.vel.x) > .8) {
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
		if (this.state === "JAB") {
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
			const swing = Math.sin(this.t * 14) * (Math.abs(this.vel.x) > .8 ? 16 : 4);
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
	draw(ctx) {
		const trem = () => (Math.random() - .5) * 1.1;
		const col = this.isP1 ? "#14171a" : "#7a2424";
		ctx.save();
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
};
var DoodleGame = class {
	canvas;
	ctx;
	audio = new DoodleAudio();
	keys = /* @__PURE__ */ new Set();
	forced = /* @__PURE__ */ new Set();
	p1;
	p2;
	plats = [
		{
			x: 60,
			y: GROUND,
			w: 1160,
			h: 50
		},
		{
			x: 240,
			y: 448,
			w: 210,
			h: 18
		},
		{
			x: 820,
			y: 408,
			w: 220,
			h: 18
		},
		{
			x: 510,
			y: 286,
			w: 250,
			h: 18
		}
	];
	particles = [];
	decals = [];
	paper = null;
	acc = 0;
	last = 0;
	raf = 0;
	running = false;
	phase = "menu";
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
	aiBlockT = 0;
	touch = {
		lx: 0,
		ly: 0,
		id: null
	};
	onHud;
	reduced = false;
	constructor(canvas, onHud) {
		this.canvas = canvas;
		const c = canvas.getContext("2d");
		if (!c) throw new Error("Canvas 2D unavailable");
		this.ctx = c;
		this.onHud = onHud;
		this.p1 = new Fighter(true);
		this.p2 = new Fighter(false);
		this.p1.reset(280);
		this.p2.reset(1e3);
		this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		this.resize();
		this.bind();
		this.bakePaper();
		this.emit();
	}
	startFight() {
		this.audio.unlock();
		this.p1.reset(280);
		this.p2.reset(1e3);
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
		const down = (e) => {
			this.keys.add(e.code);
			if ([
				"Space",
				"ArrowUp",
				"ArrowDown",
				"ArrowLeft",
				"ArrowRight"
			].includes(e.code)) e.preventDefault();
			this.audio.unlock();
		};
		const up = (e) => this.keys.delete(e.code);
		const clear = () => this.keys.clear();
		window.addEventListener("keydown", down);
		window.addEventListener("keyup", up);
		window.addEventListener("blur", clear);
		document.addEventListener("visibilitychange", () => {
			if (document.hidden) this.keys.clear();
			else this.audio.unlock();
		});
		window.addEventListener("resize", () => this.resize());
		const ptr = (e) => {
			const r = this.canvas.getBoundingClientRect();
			const x = (e.clientX - r.left) / r.width * W;
			const y = (e.clientY - r.top) / r.height * H;
			if (e.type === "pointerdown") {
				this.audio.unlock();
				if (x < W * .42) {
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
			setKeys: (codes) => {
				this.forced = new Set(codes);
			}
		};
	}
	held(code) {
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
			g.moveTo(0, y + (Math.random() - .5));
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
			g.arc(34, y, 14, Math.PI * .5, Math.PI * 1.85);
			g.stroke();
		}
		g.fillStyle = "rgba(61,90,122,0.35)";
		g.font = "15px \"Courier New\", monospace";
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
		g.arc(1080, 520, 42, .4, Math.PI * 1.9);
		g.stroke();
		this.paper = c;
	}
	drawCube(g, x, y) {
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
	drawDragon(g, x, y) {
		g.strokeStyle = "#5a574e";
		g.lineWidth = 1.8;
		g.beginPath();
		g.moveTo(x, y);
		g.quadraticCurveTo(x + 22, y - 24, x + 44, y);
		g.quadraticCurveTo(x + 64, y - 32, x + 86, y - 8);
		g.stroke();
	}
	clipPlat(g, p) {
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
	loop = (ts) => {
		this.raf = requestAnimationFrame(this.loop);
		if (!this.last) this.last = ts;
		let dt = (ts - this.last) / 1e3;
		this.last = ts;
		dt = Math.min(dt, .1);
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
			p.vy += .28;
			p.life--;
			if (p.life <= 0) this.particles.splice(i, 1);
		}
		const want = ((this.p1.pos.x + this.p2.pos.x) / 2 - W / 2) * .28;
		this.cam += (want - this.cam) * .08;
		if (this.p1.hp <= 0 || this.p2.hp <= 0 || this.timer <= 0) this.phase = "over";
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
		const dash = this.held("Space");
		if (this.touch.id != null) {
			const dx = this.touch.lx - 160;
			if (dx < -18) this.p1.vel.x = -this.p1.walk;
			else if (dx > 18) this.p1.vel.x = this.p1.walk;
			if (this.touch.ly < 420 && this.p1.jumps > 0 && !this.jumpLatch) {
				this.p1.vel.y = this.p1.jumpF;
				this.p1.jumps--;
				this.jumpLatch = true;
				this.audio.scribble();
			}
		}
		if (left) this.p1.vel.x = -this.p1.walk;
		else if (right) this.p1.vel.x = this.p1.walk;
		if (up) {
			if (this.p1.jumps > 0 && !this.jumpLatch) {
				this.p1.vel.y = this.p1.jumpF;
				this.p1.jumps--;
				this.jumpLatch = true;
				this.audio.scribble();
			}
		} else this.jumpLatch = false;
		this.p1.blocking = down && this.p1.grounded;
		if (jab && !this.jabLatch) {
			this.p1.attack("JAB", this.audio);
			this.jabLatch = true;
		} else if (!jab) this.jabLatch = false;
		if (kick && !this.kickLatch) {
			this.p1.attack("KICK", this.audio);
			this.kickLatch = true;
		} else if (!kick) this.kickLatch = false;
		if (spec && !this.specLatch) {
			this.p1.attack("SPECIAL", this.audio);
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
		if (ai.hitstun > 0 || ai.state === "KO") return;
		const dx = this.p1.pos.x - ai.pos.x;
		const dist = Math.abs(dx);
		ai.blocking = this.aiBlockT > 0;
		if (dist > 170) {
			ai.vel.x = Math.sign(dx) * ai.walk * .82;
			if (ai.grounded && Math.random() < .012) {
				ai.vel.y = ai.jumpF;
				ai.jumps--;
			}
		} else if (dist < 70 && Math.random() < .04) ai.vel.x = -Math.sign(dx) * ai.walk;
		else {
			if (this.p1.state.startsWith("JAB") || this.p1.state === "KICK") {
				if (Math.random() < .35) this.aiBlockT = 18;
			}
			if (Math.random() < .045) ai.attack(Math.random() < .62 ? "JAB" : "KICK", this.audio);
			else if (ai.ink >= 100 && Math.random() < .02) ai.attack("SPECIAL", this.audio);
		}
	}
	resolve(a, b) {
		if (!a.hitOn || !a.hit) return;
		const hb = a.hit;
		const ty = b.pos.y - 36;
		if (Math.hypot(hb.x - b.pos.x, hb.y - ty) < hb.r + 20) {
			a.comboHit = true;
			a.hitOn = false;
			if (b.hurt(hb.dmg, hb.kb, hb.heavy, this.audio) === "hit") {
				this.trauma = Math.min(1, this.trauma + (hb.heavy ? .55 : .28));
				this.freeze = hb.heavy ? 6 : 3;
				this.combo++;
				this.comboT = 90;
				a.ink = Math.min(100, a.ink + (hb.heavy ? 22 : 11));
				this.splatter(hb.x, hb.y, b.isP1 ? "#1e293b" : "#7a2424", hb.heavy ? 16 : 8);
			}
		}
	}
	splatter(x, y, color, n) {
		const pts = [];
		const r = 6 + Math.random() * 14;
		const c = 10 + Math.floor(Math.random() * 8);
		for (let i = 0; i < c; i++) {
			const ang = i / c * Math.PI * 2;
			const d = r * (.55 + Math.random() * .8);
			pts.push({
				x: Math.cos(ang) * d,
				y: Math.sin(ang) * d
			});
		}
		this.decals.push({
			x,
			y,
			pts,
			color
		});
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
				color
			});
		}
	}
	draw() {
		this.resize();
		const ctx = this.ctx;
		ctx.save();
		if (this.trauma > 0 && !this.reduced) {
			const s = this.trauma * this.trauma;
			ctx.translate((Math.random() - .5) * 14 * s, (Math.random() - .5) * 12 * s);
		}
		if (this.paper) ctx.drawImage(this.paper, 0, 0);
		ctx.save();
		ctx.translate(-this.cam * .35, 0);
		ctx.fillStyle = "rgba(90,87,78,0.28)";
		ctx.font = "14px \"Courier New\", monospace";
		ctx.fillText("margin notes...", 180, 160);
		ctx.restore();
		ctx.save();
		ctx.translate(-this.cam * .15, 0);
		for (const d of this.decals) {
			ctx.fillStyle = d.color;
			ctx.globalAlpha = .55;
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
			winner: this.phase === "over" ? this.p1.hp === this.p2.hp ? "draw" : this.p1.hp > this.p2.hp ? "p1" : "p2" : null,
			freeze: this.freeze
		});
	}
	touchAttack(kind) {
		this.audio.unlock();
		if (this.phase !== "fight") return;
		if (kind === "DASH") this.p1.dash(this.p1.facing, this.audio);
		else this.p1.attack(kind, this.audio);
	}
};
function GameView() {
	const canvasRef = (0, import_react.useRef)(null);
	const gameRef = (0, import_react.useRef)(null);
	const p1Hp = (0, import_react.useRef)(null);
	const p2Hp = (0, import_react.useRef)(null);
	const p1Ink = (0, import_react.useRef)(null);
	const p2Ink = (0, import_react.useRef)(null);
	const timerEl = (0, import_react.useRef)(null);
	const comboEl = (0, import_react.useRef)(null);
	const [phase, setPhase] = (0, import_react.useState)("menu");
	const [winner, setWinner] = (0, import_react.useState)(null);
	const [muted, setMuted] = (0, import_react.useState)(false);
	const phaseRef = (0, import_react.useRef)(phase);
	(0, import_react.useEffect)(() => {
		phaseRef.current = phase;
	}, [phase]);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const game = new DoodleGame(canvas, (h) => {
			if (p1Hp.current) p1Hp.current.style.width = `${h.p1Hp}%`;
			if (p2Hp.current) p2Hp.current.style.width = `${h.p2Hp}%`;
			if (p1Ink.current) p1Ink.current.style.width = `${h.p1Ink}%`;
			if (p2Ink.current) p2Ink.current.style.width = `${h.p2Ink}%`;
			if (timerEl.current) timerEl.current.textContent = String(h.timer);
			if (comboEl.current) {
				comboEl.current.textContent = h.combo > 1 ? `${h.combo} hit combo` : "";
				comboEl.current.style.opacity = h.combo > 1 ? "1" : "0";
			}
			if (h.phase !== phaseRef.current) {
				phaseRef.current = h.phase;
				setPhase(h.phase);
				setWinner(h.winner);
			}
		});
		gameRef.current = game;
		game.mount();
		return () => game.destroy();
	}, []);
	const play = () => gameRef.current?.startFight();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative h-dvh w-full overflow-hidden bg-[#1a1917] text-graphite",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
				ref: canvasRef,
				className: "absolute inset-0 h-full w-full touch-none",
				style: { touchAction: "none" }
			}),
			phase !== "menu" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3 pt-[max(12px,env(safe-area-inset-top))] sm:p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex w-[38%] min-w-0 flex-col",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mb-1 font-display text-[11px] font-semibold uppercase tracking-[0.18em] sm:text-sm",
								children: "Sketch"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-5 w-full overflow-hidden border-[3px] border-graphite bg-paper-deep shadow-[2px_3px_0_#2a2a28] sm:h-6",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									ref: p1Hp,
									className: "h-full bg-graphite",
									style: { width: "100%" }
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1.5 h-2 w-[70%] overflow-hidden border-2 border-graphite bg-paper",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									ref: p1Ink,
									className: "h-full bg-ink",
									style: { width: "0%" }
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						ref: timerEl,
						className: "mt-1 min-w-14 rotate-[-2deg] border-[3px] border-graphite bg-paper px-3 py-1 text-center font-display text-2xl font-semibold tabular-nums shadow-[3px_4px_0_#2a2a28] sm:text-4xl",
						children: "99"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex w-[38%] min-w-0 flex-col items-end text-right",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mb-1 font-display text-[11px] font-semibold uppercase tracking-[0.18em] sm:text-sm",
								children: "Ink Boss"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-5 w-full overflow-hidden border-[3px] border-graphite bg-paper-deep shadow-[2px_3px_0_#2a2a28] sm:h-6",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									ref: p2Hp,
									className: "ml-auto h-full bg-margin",
									style: { width: "100%" }
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1.5 h-2 w-[70%] self-end overflow-hidden border-2 border-graphite bg-paper",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									ref: p2Ink,
									className: "h-full bg-ink",
									style: { width: "0%" }
								})
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref: comboEl,
				className: "pointer-events-none absolute left-1/2 top-24 z-10 -translate-x-1/2 rotate-[-4deg] font-display text-xl font-semibold text-margin opacity-0 sm:text-3xl"
			}),
			phase === "menu" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-0 z-20 flex flex-col items-center justify-center bg-paper/92 px-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-2 rotate-[-3deg] font-display text-[11px] font-semibold uppercase tracking-[0.28em] text-ink",
						children: "Notebook melee"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "max-w-[16ch] rotate-[-3deg] text-center font-display text-4xl font-semibold leading-tight tracking-tight text-graphite sm:text-6xl",
						children: "Doodle Strike"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 max-w-md text-center font-body text-sm text-graphite-soft",
						children: "Stick-figure combat on ruled paper. Jabs, kicks, ink specials, and graphite stains that stay on the page."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: play,
						className: "mt-8 min-h-12 skew-x-[-6deg] border-[3px] border-graphite bg-graphite px-8 py-3 font-display text-lg font-semibold text-paper shadow-[4px_5px_0_#1a1917] transition-transform duration-150 hover:-translate-y-0.5",
						children: "Sketch battle"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-8 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "border-2 border-dashed border-graphite-soft/50 bg-paper-deep/60 p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mb-2 font-display text-xs font-semibold uppercase tracking-widest",
								children: "Controls"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
								className: "space-y-1 font-body text-xs text-graphite-soft",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "A / D or arrows — move" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "W — jump / double jump" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "S — block" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "J / K / L — jab, kick, ink blast" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Space — dash cancel" })
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "border-2 border-dashed border-graphite-soft/50 bg-paper-deep/60 p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mb-2 font-display text-xs font-semibold uppercase tracking-widest",
								children: "Dynamics"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
								className: "space-y-1 font-body text-xs text-graphite-soft",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Wall bounce on page margins" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Block chips, freeze on heavy hits" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Ink stains stay until next page" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Paperclip platforms, mid-air kicks" })
								]
							})]
						})]
					})
				]
			}),
			phase === "over" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-0 z-20 flex flex-col items-center justify-center bg-paper/92 px-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "rotate-[-3deg] text-center font-display text-4xl font-semibold sm:text-5xl",
						children: winner === "p1" ? "Page claimed" : winner === "draw" ? "Smear draw" : "Sketch wiped"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 font-body text-sm text-graphite-soft",
						children: winner === "p1" ? "The ink boss is a stain." : winner === "draw" ? "Even graphite." : "Turn the page and try again."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: play,
						className: "mt-8 min-h-12 skew-x-[-6deg] border-[3px] border-graphite bg-graphite px-8 py-3 font-display text-lg font-semibold text-paper shadow-[4px_5px_0_#1a1917]",
						children: "Next page"
					})
				]
			}),
			phase === "fight" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute bottom-3 right-3 z-10 flex flex-wrap items-end justify-end gap-2 pb-[env(safe-area-inset-bottom)] sm:hidden",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchKey, {
						label: "Jab",
						onClick: () => gameRef.current?.touchAttack("JAB")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchKey, {
						label: "Kick",
						onClick: () => gameRef.current?.touchAttack("KICK")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchKey, {
						label: "Ink",
						onClick: () => gameRef.current?.touchAttack("SPECIAL")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchKey, {
						label: "Dash",
						onClick: () => gameRef.current?.touchAttack("DASH")
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => {
					const next = !muted;
					setMuted(next);
					gameRef.current?.audio.setMuted(next);
				},
				className: "absolute bottom-3 left-3 z-20 min-h-11 border-2 border-graphite bg-paper px-3 font-display text-xs font-semibold uppercase tracking-wide",
				children: muted ? "Sound off" : "Sound on"
			})
		]
	});
}
function TouchKey({ label, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onPointerDown: (e) => {
			e.preventDefault();
			onClick();
		},
		className: "min-h-12 min-w-14 border-2 border-graphite bg-paper/90 px-3 font-display text-xs font-semibold uppercase",
		children: label
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameView, {});
}
//#endregion
export { Home as component };
