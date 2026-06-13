# Flechas — Game Rules (current)

Two daily arrow games sharing the same launch rule: **tap an arrow whose lane
to the edge is clear and it launches in the direction of its tip** (the head
leads, the body trains out behind it). A blocked arrow bounces instead. Both
games use 3 hearts and the same 10 ranks (Debutante → Eficiente → Constante →
Diligente → Admirable → Excelente → Increíble → Brillante → Eminente →
Maestro/a). All stats are stored locally in the browser only.

---

## PERÍMETRO — the daily run

A daily **run of 5 boards** (14×18 grids of Cascada-sized arrows), the same for
everyone. **Clear a board and the next one falls in** — the **timer, hearts, beam
and freeze charge all carry over** from board to board. **Goal: clear all five as
fast and as clean as you can.** Your rank is the **total time** across the run, so
*rápido y limpio gana*.

### The run
- 5 boards, board 1 on the shared daily seed, boards 2–5 seeded from it.
- The board counter to the right of the timer shows **Tablero N/5**.
- The clock never resets between boards; only your finishing time on board 5 matters.

### Launching
- Tap an arrow with a clear lane → it launches (flashes **green** as it leaves).
- A blocked arrow flies to the obstacle and **bounces back** (no penalty for a wall bounce; see the beam).

### Hearts = your lives
- You have **3 hearts** (left of the timer). No banking past 3.
- A **choque** (tapping a blocked arrow / a bad launch) costs **½ heart** (Cascada parity) — so 3 hearts = 6 bumps to spill. The faster you go, the easier it is to misfire.
- At **0 hearts** the cup spills — **game over** (see *Daily & training* below).
- Hearts are **not** your score — your score is your **time**. Heart-giving arrows (yellow) just keep you alive to finish, so save them for when you're hurt.
- Hearts react like Cascada: the row dips **down** when you lose one, **up** when you earn one (no +/− text popups).

### Daily & training
- Your **first attempt is your official daily result** — whether you finish (a time + rank) or spill (a fail). It's recorded once and **locked**; you can't improve it by replaying.
- After that first attempt concludes, the board drops into **Entrenamiento (training)**: replay the same puzzle freely to practice and get better for future days. Training runs **don't count** and don't change your recorded result. A gold "Entrenamiento" badge shows above the board.

### The beam (haz)
- One edge is **always lit purple** and rotates edge to edge, **jumping to the next every 5 s**.
- The lit edge holds and **breathes once** in its final stretch to warn it's about to jump (the glow is the countdown): fades in (1 s), holds, one dim-to-50%-and-back breath, then fades out (1 s) as the next edge takes over — no dark gap.
- An arrow that would launch **through the lit edge doesn't launch**: it flies to the edge, turns **purple**, and bounces back — **no penalty, doesn't break your racha**. Wait for the beam to pass, launch another side, or freeze to cross it.
- The rotation (start edge + direction) is the same for everyone each day.

### Special arrows (risk / reward)
Each board carries a handful of specials (≈2 yellow, 4 red, 2 shield — kept light on
heart-givers so hearts don't come back too easily, heavy on danger), placed by a
farthest-point spread and interleaved by colour so they're distributed evenly across
the board — no bunching.

- **Yellow — Racha.** Clearing it starts a streak of **6 clean launches → +½ heart** (exactly one bump bought back). **Stacks:** 2 yellow = 12 clean → **+1**, 3 = 18 → **+1½**. A choque breaks the **whole** streak and costs an extra **½ heart** — the longer the racha, the more you're risking.
- **Red — Peligro.** Clearing it opens a **6 s danger window** (board turns red) where each choque costs **double — 1 heart**. Survive clean → **+½ heart**. **Stacks:** 2 red = 12 s → **+1**, 3 = 18 s → **+1½** — more reward, more time exposed. Countdown shows in the status box.
- **Cyan — Escudo (shield).** Clearing it opens a **6 s grace window** (board gets a cyan glow ring) where **bumps cost 0 hearts** — permission to go all-out. **Stacks** (longer window per shield). It protects your **life, not your bonuses**: a bump still breaks a racha and still forfeits a Peligro reward. The danger is *overconfidence* — when it expires you're usually still going fast, and that's when you crash. Stacking a Shield over a Red lets you blitz a danger window without dying.
- **Freeze — Carga (auto-charging).** The full-width **❄ Congelar** bar fills with time (~20 s); when ready, spend it to **freeze 5 s** — pauses the clock *and* the beam, your defense for crossing a lit edge — then it recharges. **Single charge, no banking — identical to Cascada.**

### Status box
Three tiles: **Racha** (progress x/total, ×N when stacked) · **Peligro** (seconds left, ×N when stacked) · **Escudo** (seconds left, ×N when stacked). The freeze countdown lives on its button, not the box.

### Freeze visual (shared with Cascada)
Board pulses **in** from the original colour → dark blue (0.5 s), holds dark (~2.5 s), **breathes once** out to light blue and back (1 s), then **fades** dark → original (1 s). The timer text rides along (ink → freeze blue and back).

### Rank
Your score is your **finishing time**, plain — faster is better, and since a choque can end the run you go *fast but clean*. Ten ranks (Debutante → Maestro/a). There's a date-hashed **Reto del día** (target time, 2:00–3:00 window) — finish under it for a **¡Buen sorbo!**

---

## CASCADA — the arcade mode

**2 minutes to score as many points as you can.** Same launch rule as Perímetro.

### Board & refresh
- A 14×18 grid of arrow "snakes", always generated **fully solvable** with enough opening moves.
- **Every 30 s a new board falls from the top**, pushing the old one down and off — whatever you didn't clear is gone. Choose well: the easy ones now, or open that cluster?
- The board warns by **pulsing 3 times** (last ~2.4 s) before it falls.

### Scoring, combo & multiplier
- Clearing quickly in succession builds a **combo** (×2, ×3…). Within a ~1.8 s window each clear bumps it; every 4 clears raises the **multiplier up to ×5**. Points per clear = current multiplier.
- A blocked tap **charges up, bounces back, breaks the combo, and costs ½ heart**.
- **Clear a whole board** before it refreshes → **+25 points**, the pink combo ring **pulses once**, and a fresh board cascades in. The reward is **+½ heart**, or — if you're already at full hearts — **+5 seconds** on the clock instead. The status box tracks how many boards you've cleaned (**Tableros**).
- Successful launches flash **green**.

### Hearts
**3 hearts**, each bad bump costs **½**. At 0 the game ends. The row dips on a loss (Cascada's spill).

### Freeze
Auto-charges (~20 s). When ready, the freeze button **stops the clock and the board refresh for 5 s**. Same freeze visual and button countdown as Perímetro.

### Rank & end
Rank is decided by **total points in 2:00** (clears × combo). Ends on **¡Sin corazones!** (0 hearts) or **¡Se acabó el tiempo!**, showing points, rank, arrows cleared, and today's record.

---

## Shared conventions
- One self-contained `index.html` per game (inline CSS+JS, no build step), deployed to Cloudflare.
- Arrow colours: **black** by default, **green** on a successful launch, **yellow / red** for special roles, **purple** on a beam bounce (Perímetro).
- 3 hearts; 10 ranks (Debutante → Maestro/a); freeze is 5 s with the dark↔light blue pulse.
- All progress and stats live only in the player's browser — nothing is sent to a server.
