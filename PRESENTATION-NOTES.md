# Presentation notes — EMC Lab interactive physics module

Companion notes for presenting the project: what the physics is, how each piece is implemented,
and a scripted live demo. Designed for a ~12 minute talk plus questions.

---

## Part 1 — The physics, in five movements

### 1. Measurement & vectors (Topic 1)
Every measurement is a number **times a unit**, and the SI builds everything from seven base
units — which is what makes **dimensional analysis** a proof technique: an equation whose two
sides carry different dimensions is wrong before any algebra is checked. Quantities then split
into **scalars** (magnitude only) and **vectors** (magnitude *and* direction), and vectors obey
one rule that does all the work: **components add independently**,

> **R<sub>x</sub> = A<sub>x</sub> + B<sub>x</sub>**, **R<sub>y</sub> = A<sub>y</sub> + B<sub>y</sub>**, then **|R| = √(R<sub>x</sub>² + R<sub>y</sub>²)**, θ = tan⁻¹(R<sub>y</sub>/R<sub>x</sub>)

Graphically the same sum is the parallelogram diagonal or the tip-to-tail walk — two drawings
of one piece of arithmetic. The classic trap the sim makes visible: |A + B| is *not* |A| + |B|;
the "Cancel to zero" preset shows two non-zero arrows whose resultant is exactly nothing.

**Teaching hook in the sim:** drag either arrowhead and watch the resultant recompose *from the
components* — students see the dashed projections land on the axes at R<sub>x</sub> and R<sub>y</sub>
while |R| and θ update live.

### 2. Fluids (Topic 2)
A fluid pushes equally in every direction, and its pressure grows linearly with depth,
**P = P₀ + ρgh** — every 10 m of water adds roughly an atmosphere. From that gradient comes
**Archimedes**: the pressure under a body exceeds the pressure above it by exactly the weight of
displaced fluid,

> **F<sub>B</sub> = ρ<sub>fluid</sub> · V<sub>displaced</sub> · g**

so floating is not magic but bookkeeping — a body settles until the displaced fluid weighs as
much as it does, which is why the submerged fraction *is* the density ratio (icebergs show 8 %).
Set the fluid moving and two more rules appear: **continuity** (A₁v₁ = A₂v₂ — a throat must run
faster) and **Bernoulli** (P + ½ρv² + ρgh = const — faster flow, *lower* pressure), which is
where wing lift and venturi suction come from.

**Teaching hook in the sim:** push the block under and let go — it rises and settles at exactly
ρ<sub>obj</sub>/ρ<sub>f</sub> submerged, with the weight and buoyancy arrows drawn to scale and
equal; then in the venturi scene, halve the throat and watch the manometer column drop by the
ΔP that ½ρ(v₂² − v₁²) predicts.

### 3. Temperature & heat (Topic 3)
**Temperature** is average particle jitter; **heat** is energy in transit from hot to cold —
keeping the two apart is half the topic. Three scales describe one temperature (°F = °C×9/5+32,
K = °C+273.15) and they cross at exactly −40°. Raising a temperature costs

> **Q = m·c·ΔT**

with water's c = 4186 J/(kg·K) remarkably large — the reason kettles take minutes and oceans
moderate climates — while phase changes hold T still and swallow latent heat instead. Energy
then travels by exactly three mechanisms: **conduction** (contact, q = kAΔT/L, metals winning
via free electrons), **convection** (the fluid itself circulating because hot fluid is less
dense) and **radiation** (electromagnetic waves, the only mechanism that crosses a vacuum,
intensity falling as 1/d²).

**Teaching hook in the sim:** in the heat-transfer lab, switch copper → wood and the flux
readout collapses by a factor of thousands while the temperature profile visibly stops relaxing;
then move the radiation plates from 1 m to 2 m and the intensity quarters, live.

### 4. Waves & sound (Topic 4)
A wave is a disturbance that carries **energy without carrying matter** — the duck bobs, the
swell passes. Four numbers describe it (A, λ, f, T = 1/f) and one equation ties them to the
medium:

> **v = f·λ**

Source sets f, medium sets v, so λ is the negotiable one. Waves split into **transverse**
(motion ⊥ travel: ropes, light) and **longitudinal** (motion ∥ travel: sound — compressions
marching). For sound, frequency *is* pitch (20 Hz–20 kHz of hearing, A4 = 440 Hz, octave = ×2)
and amplitude *is* loudness; λ = v/f explains why bass leaks through walls (λ ≈ 3 m at 110 Hz)
and thunder timing gives storm distance (3 s ≈ 1 km).

**Teaching hook in the sim:** turn on medium particles and freeze the wave — every dot is
displaced, none has travelled; then open the tone player and let the audience *hear* f double
from A3 to A4 while the note needle jumps exactly one octave on the ruler.

### 5. Electricity (Topic 5)
Charge in motion is current, I = ΔQ/Δt; in ohmic materials the response is linear, giving the
most useful equation in engineering,

> **V = I·R**, with **P = VI = I²R = V²/R**

Networks reduce by two conservation rules (Kirchhoff): series shares current and adds
resistance; parallel shares voltage and adds conductance — so a parallel bank is always easier
to drive than its smallest branch, which is exactly what trips a household breaker.

**Teaching hook in the sim:** the circuit builder animates charge dots whose *density and speed*
track the local current, so the unequal split in a parallel bank is something students *see*,
and the per-element table proves ΣV = V supply and ΣI = I total.

---

## Part 2 — Technical implementation

### Architecture
* **Seven static pages**: five topic pages plus home and quiz. Shared chrome (header, footer,
  progress) is plain markup; behaviour is shared through `js/common.js`.
* **The pages read as a plain tutorial, not a project report.** No course or module name, no
  "works everywhere / tested in" blurb, no build-step stats, no dev-doc links — the reading
  experience is a single centred article column: every page (home, topics, quiz) shares one
  1060 px content column, with blog-style air above every heading so one idea fills a
  screen at a time.
* **Static site, no framework, no backend.** Serve the folder (or open `index.html`). Tailwind
  is compiled at build time (`bun run build:css`) into `css/site.css`, so what ships is plain
  static HTML, CSS and JavaScript — identical bytes on `file://`, localhost or Vercel.
* **`EMC.Stage`** — a small canvas engine used by all nine simulations: HiDPI backing-store
  scaling, `ResizeObserver`-driven resizing, an rAF loop that pauses off-screen, and unified
  pointer input (mouse/touch/pen) with capture so drags keep working outside the canvas.
* **Physics is data, not decoration.** Each sim owns a `state` object and pure functions
  (`phys()`, `flux()`, `intensity()`, `wingPhys()`/`pipePhys()`) that return SI values; render
  functions only draw what those functions return, and the readouts are fed by the same call —
  which is why the canvas, the arrows and the numbers can never disagree.
* **Library choices, and where each earns its place.** All nine sims run on a tiny native
  Canvas 2D engine (zero dependencies, exact HiDPI control); the tone bench uses the browser's
  own **WebAudio** API (oscillator + AnalyserNode), so it needs no library at all. **Chart.js**
  renders the quiz analytics (doughnut, per-topic bars, attempt-history line). **Tailwind**
  handles layout utilities. Both libraries are **vendored under `vendor/` with their licence
  files**, so the site makes no third-party request and still works with no network at all.
* **Formatting** goes through one formatter (`eng`/`unit`) that emits 3 significant figures with
  a single SI prefix — so the whole site reads like an instrument, and units never wrap or stack.
* **Progress** is one `localStorage` key with a memory fallback, wrapped so blocked storage can
  never throw.

### Decisions worth defending in Q&A
| Question | Answer |
|---|---|
| Can we host it on Vercel? | Trivially — it is a static site: import the repo, preset *Other*, and let `vercel.json` pin everything: `buildCommand` runs `bun run build` (Tailwind compile + `tools/build-public.mjs` assembling `public/`) and `outputDirectory: "public"` overrides any stale dashboard value, so every `git push` redeploys; cache headers are pinned there too. There is deliberately no backend: progress is localStorage-only, so nothing to configure, bill, or lose. |
| Is Tailwind actually being used? It doesn't look like it. | It is — it *is* the pipeline. `css/input.css` declares `@layer base / components / utilities` around the three `@tailwind` directives, and the CLI compiles everything into `css/site.css` (Vercel rebuilds it on deploy). Utilities in the markup sit in the top cascade layer, the sticker components in the middle, element resets at the bottom — which is exactly why `mt-2` wins over a heading reset without a single `!important`. |
| Can we run it on Bun? Is that allowed? | Yes and yes. Bun is the project's *package manager and task runner* — `bun install`, `bun run build:css`, `bun run test` — and a runtime, not a frontend framework. Visitors' browsers receive identical static bytes no matter which tool built them; the browser-side wins come from cache headers, per-page library loading and off-screen canvas pausing. |
| Why Chart.js only for the quiz? | Score analytics are exactly what Chart.js is for (doughnut/bars/line with legends and tooltips). The physics charts (I–V line, temperature profile, manometer columns) are drawn by the sims themselves so they stay in perfect sync with the simulation state and cost nothing extra. |
| Why a drawn scope when audio is blocked? | The tone bench degrades by design: where `AudioContext` is missing (locked-down browsers, headless tests) the status line says so and the oscilloscope keeps drawing the exact waveform from the maths — the physics is still visible, and the jsdom harness asserts precisely this path. |
| Is the conduction profile scripted? | No — it is a 20-cell diffusion relaxation integrated every frame with both ends held as reservoirs, so the printed profile is the numerical solution of the heat equation; only the Fourier flux readout (exact at steady state) is closed-form. |
| Why does submitting grade the whole bank even when filtered? | Filters are a revision aid; letting them shrink the denominator would make "100 %" meaningless. The UI states this next to the toolbar. |

### Testing strategy
Static validator (links, ids, data-hooks, CSS coverage) plus a jsdom harness with **292
assertions** that assert *physics* — e.g. |R| = √53 for the (3,4)+(4,−2) preset, F_B = W at the
floating depth, v₂ = 4 m/s and ΔP = 7.5 kPa in the venturi, 37 °C = 98.6 °F = 310.15 K, the
inverse-square quartering of radiation intensity, v = fλ = 3.00 m/s, A4 at 440 Hz with
λ = 0.78 m, R(10‖22‖47) = 6.00 Ω — and *behaviour*: quiz scoring at 100/33/0 %, blank-submit
guard, storage persistence. Plus a real headless-Chrome pass over all seven pages at desktop
and mobile widths with zero console errors. See `TESTING.md`.

---

## Part 3 — Live demo script (~6 minutes)

1. **Home (30 s).** Point at the hero wave animation ("the pattern travels, the particles only
   oscillate — that is the whole of Topic 4 in one image"), the five topic cards and the
   progress ring at 0 %.
2. **Topic 1 (45 s).** Vector bench: load *3-4-5* — "five, not seven, because arrows add by
   components". Drag B until R points straight up; finish on *Cancel to zero*: two real arrows,
   no resultant.
3. **Topic 2 (75 s).** Buoyancy tank: float the block at 60 % submerged, then raise ρ past 1000
   and narrate the sink, the floor contact and the amber normal-force arrow. Switch to the
   venturi: halve the throat, watch v₂ quadruple and the manometer drop.
4. **Topic 3 (60 s).** Thermometer: drag to −40° — "the one number both scales agree on".
   Heat lab: copper → wood collapses the flux; radiation 1 m → 2 m quarters the intensity.
5. **Topic 4 (75 s).** Wave bench: f = 2 Hz, λ = 1.5 m → v = 3.00 m/s; flip to longitudinal and
   point at a compression. Tone player: press Play on A4, sweep up an octave live — pitch is
   frequency, and the needle proves it.
6. **Topic 5 (60 s).** Ohm bench: type R = 4 Ω at V = 12 V → 3.00 A; push P past the rating and
   show the warning. Circuit builder: series → parallel and narrate the bulb brightening *and*
   the dot density changing; point at the table row where branch currents sum to the total.
7. **Quiz (45 s).** Answer two questions in instant mode, submit the rest, then walk across the
   score card: the grade band, the **Chart.js doughnut**, the per-topic bars ("fluids is the
   weak spot — that's Topic 2 to revise"), and the attempt-history line. Finish on the home page
   ring having moved, and mention the **Export / Import** buttons that carry a student's
   progress to another machine as a small JSON file.

**Fallback if the projector/venue has no internet:** everything still works, identically —
every library, font and stylesheet is committed in the repo, so the demo never needs the
venue's network and there is no CDN that can be blocked or throttled. (No audio at the venue?
The tone bench's drawn scope still shows exactly what the ear would hear.)

---

## Part 4 — Likely audience questions

* **"Why does a steel ship float?"** Buoyancy compares the *average* density of the whole body
  with the fluid's. A hull is a steel shell around air; load it until the average passes
  1000 kg/m³ and the deck goes under — which is what Plimsoll lines mark.
* **"Does buoyancy grow with depth?"** No: F_B depends on displaced *volume*, which is constant
  once the body is fully submerged — higher pressure pushes on every side equally.
* **"Why is −40 the crossing point?"** Solving T = (T − 32)·5/9 gives 4T = −160: one unique
  intersection of two affine scales with different zero points and different step sizes.
* **"Does higher frequency mean a faster wave?"** Not in one medium: v belongs to the medium,
  so raising f shrinks λ instead — a 10 kHz whistle and a 100 Hz bass note race at the same
  343 m/s through the same air.
* **"Is the bulb ohmic in your circuit builder?"** It is modelled as ohmic and the tutorial says
  so, alongside the real caveat that a filament's R rises ~10× from cold to operating temperature.
* **"Why do metals feel cold?"** They are not colder — they conduct your heat away faster. The
  heat lab shows exactly that: same ΔT, wildly different k.

---

## Part 5 — References

* Halliday, Resnick & Walker, *Fundamentals of Physics* — topic sequencing and worked examples
* Serway & Jewett, *Physics for Scientists and Engineers* — fluids and thermodynamics chapters
* Young & Freedman, *University Physics* — waves and sound treatment
* CODATA 2018 recommended values — g, ρ, c and e as used in `js/common.js`
* MDN Web Docs — Canvas 2D, Pointer Events, WebAudio, `localStorage`, ARIA authoring practices
