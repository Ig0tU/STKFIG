import { useEffect, useRef, useState } from "react";
import { DoodleGame, type HudSnapshot } from "@/game/engine";

export function GameView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<DoodleGame | null>(null);
  const p1Hp = useRef<HTMLDivElement>(null);
  const p2Hp = useRef<HTMLDivElement>(null);
  const p1Ink = useRef<HTMLDivElement>(null);
  const p2Ink = useRef<HTMLDivElement>(null);
  const timerEl = useRef<HTMLDivElement>(null);
  const comboEl = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<HudSnapshot["phase"]>("menu");
  const [winner, setWinner] = useState<HudSnapshot["winner"]>(null);
  const [muted, setMuted] = useState(false);
  const phaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
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

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#1a1917] text-graphite">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        style={{ touchAction: "none" }}
      />

      {phase !== "menu" && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3 pt-[max(12px,env(safe-area-inset-top))] sm:p-5">
          <div className="flex w-[38%] min-w-0 flex-col">
            <div className="mb-1 font-display text-[11px] font-semibold uppercase tracking-[0.18em] sm:text-sm">Sketch</div>
            <div className="h-5 w-full overflow-hidden border-[3px] border-graphite bg-paper-deep shadow-[2px_3px_0_#2a2a28] sm:h-6">
              <div ref={p1Hp} className="h-full bg-graphite" style={{ width: "100%" }} />
            </div>
            <div className="mt-1.5 h-2 w-[70%] overflow-hidden border-2 border-graphite bg-paper">
              <div ref={p1Ink} className="h-full bg-ink" style={{ width: "0%" }} />
            </div>
          </div>
          <div
            ref={timerEl}
            className="mt-1 min-w-14 rotate-[-2deg] border-[3px] border-graphite bg-paper px-3 py-1 text-center font-display text-2xl font-semibold tabular-nums shadow-[3px_4px_0_#2a2a28] sm:text-4xl"
          >
            99
          </div>
          <div className="flex w-[38%] min-w-0 flex-col items-end text-right">
            <div className="mb-1 font-display text-[11px] font-semibold uppercase tracking-[0.18em] sm:text-sm">Ink Boss</div>
            <div className="h-5 w-full overflow-hidden border-[3px] border-graphite bg-paper-deep shadow-[2px_3px_0_#2a2a28] sm:h-6">
              <div ref={p2Hp} className="ml-auto h-full bg-margin" style={{ width: "100%" }} />
            </div>
            <div className="mt-1.5 h-2 w-[70%] self-end overflow-hidden border-2 border-graphite bg-paper">
              <div ref={p2Ink} className="h-full bg-ink" style={{ width: "0%" }} />
            </div>
          </div>
        </div>
      )}

      <div
        ref={comboEl}
        className="pointer-events-none absolute left-1/2 top-24 z-10 -translate-x-1/2 rotate-[-4deg] font-display text-xl font-semibold text-margin opacity-0 sm:text-3xl"
      />

      {phase === "menu" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-paper/92 px-4">
          <p className="mb-2 rotate-[-3deg] font-display text-[11px] font-semibold uppercase tracking-[0.28em] text-ink">
            Notebook melee
          </p>
          <h1 className="max-w-[16ch] rotate-[-3deg] text-center font-display text-4xl font-semibold leading-tight tracking-tight text-graphite sm:text-6xl">
            Doodle Strike
          </h1>
          <p className="mt-3 max-w-md text-center font-body text-sm text-graphite-soft">
            Stick-figure combat on ruled paper. Jabs, kicks, ink specials, and graphite stains that stay on the page.
          </p>
          <button
            type="button"
            onClick={play}
            className="mt-8 min-h-12 skew-x-[-6deg] border-[3px] border-graphite bg-graphite px-8 py-3 font-display text-lg font-semibold text-paper shadow-[4px_5px_0_#1a1917] transition-transform duration-150 hover:-translate-y-0.5"
          >
            Sketch battle
          </button>
          <div className="mt-8 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="border-2 border-dashed border-graphite-soft/50 bg-paper-deep/60 p-4">
              <h2 className="mb-2 font-display text-xs font-semibold uppercase tracking-widest">Controls</h2>
              <ul className="space-y-1 font-body text-xs text-graphite-soft">
                <li>A / D or arrows — move · S — crouch / block</li>
                <li>W — jump / double jump / wall jump</li>
                <li>J / K / L — jab, kick, ink special</li>
                <li>U or J+K — grab / throw</li>
                <li>S + J / K — crouch jab & sweep</li>
                <li>S + K (air) — axe kick · Space — air/ground dash</li>
              </ul>
            </div>
            <div className="border-2 border-dashed border-graphite-soft/50 bg-paper-deep/60 p-4">
              <h2 className="mb-2 font-display text-xs font-semibold uppercase tracking-widest">Dynamics</h2>
              <ul className="space-y-1 font-body text-xs text-graphite-soft">
                <li>50 Ink — EX special move · 100 Ink — Super</li>
                <li>Air dash & wall slide mechanics</li>
                <li>Drop through elevated ledges with S</li>
                <li>Parry tap-blocks & persistent ink stains</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {phase === "over" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-paper/92 px-4">
          <h2 className="rotate-[-3deg] text-center font-display text-4xl font-semibold sm:text-5xl">
            {winner === "p1" ? "Page claimed" : winner === "draw" ? "Smear draw" : "Sketch wiped"}
          </h2>
          <p className="mt-2 font-body text-sm text-graphite-soft">
            {winner === "p1" ? "The ink boss is a stain." : winner === "draw" ? "Even graphite." : "Turn the page and try again."}
          </p>
          <button
            type="button"
            onClick={play}
            className="mt-8 min-h-12 skew-x-[-6deg] border-[3px] border-graphite bg-graphite px-8 py-3 font-display text-lg font-semibold text-paper shadow-[4px_5px_0_#1a1917]"
          >
            Next page
          </button>
        </div>
      )}

      {phase === "fight" && (
        <div className="absolute bottom-3 right-3 z-10 flex flex-wrap items-end justify-end gap-2 pb-[env(safe-area-inset-bottom)] sm:hidden">
          <TouchKey label="Jab" onClick={() => gameRef.current?.touchAttack("JAB")} />
          <TouchKey label="Kick" onClick={() => gameRef.current?.touchAttack("KICK")} />
          <TouchKey label="Grab" onClick={() => gameRef.current?.touchAttack("GRAB")} />
          <TouchKey label="Ink" onClick={() => gameRef.current?.touchAttack("SPECIAL")} />
          <TouchKey label="Dash" onClick={() => gameRef.current?.touchAttack("DASH")} />
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          const next = !muted;
          setMuted(next);
          gameRef.current?.audio.setMuted(next);
        }}
        className="absolute bottom-3 left-3 z-20 min-h-11 border-2 border-graphite bg-paper px-3 font-display text-xs font-semibold uppercase tracking-wide"
      >
        {muted ? "Sound off" : "Sound on"}
      </button>
    </div>
  );
}

function TouchKey({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="min-h-12 min-w-14 border-2 border-graphite bg-paper/90 px-3 font-display text-xs font-semibold uppercase"
    >
      {label}
    </button>
  );
}
