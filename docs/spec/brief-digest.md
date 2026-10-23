# Brief & Lecture Digest (substitute for the missing PDFs — transcribed from the task prompt §1.1–1.3)

## Course brief — required deliverables (Electricity group)

| Req | Must exist and work |
|---|---|
| R1 | **Circuit builder:** drag/drop **resistors, battery, light bulb** |
| R2 | **Ohm's law calculator:** change R and V, see I |
| R3 | **Quiz:** simple circuit problems (plus the other chapters per §1.3) |
| R4 | Homepage with clear navigation to every topic |
| R5 | Responsive, intuitive UI |
| R6 | Each tutorial includes an animation, quiz, or simulation |
| R7 | Multimedia: images, video, and/or interactive canvas |
| R8 | **Chart.js** visualizing quiz scores |
| R9 | **Works on Chrome, Firefox, and Edge** (tested, not assumed) |
| R10 | Progress tracking: optional; keep local storage only, no login/backend |
| R11 | Technical documentation (README: structure, run/build, how scope maps to the brief) |

Other groups' topics (Measurements/Vectors, Fluids, Temperature/Heat, Waves/Sound,
Optics) must not appear in active navigation, homepage, quiz, progress, or metadata.
Retired material may stay in `archive/`.

## Lecture slides — required Chapter 2 content (use k = 8.99×10⁹ N·m²/C²)

| Topic | Check value the site must reproduce |
|---|---|
| Charge: proton +, electron −, neutron neutral; e = 1.602×10⁻¹⁹ C; quantization; conservation; conductors vs. insulators; like repel, unlike attract | 1 C = 6.24×10¹⁸ electrons |
| Coulomb's law F = k\|q₁\|\|q₂\|/r² | +1.0 C and −1.0 C at 1.0 km → **8990 N** (attractive) |
| Superposition, collinear (q₂=−4.0 µC, q₁=+3.0 µC, q₃=−7.0 µC; 0.20 m, 0.15 m) | F₁₂ ≈ 2.70 N (−x), F₁₃ ≈ 8.39 N (+x), net ≈ **5.69 N, +x** |
| Superposition, 2D (q₁=+4.0, q₂=−6.0, q₃=−5.0 µC; r₁₂=0.15 m at 73°, r₁₃=0.10 m) | F ≈ **22.7 N (lecture rounds to 23 N)** at ≈ **24°** above +x |
| Bohr hydrogen (r = 5.29×10⁻¹¹ m) | F ≈ 8.245×10⁻⁸ N, v ≈ **2.188×10⁶ m/s** |
| Electric field E = F/\|q₀\|, direction of force on a positive test charge, N/C; field lines | F = \|q₀\|E |
| Field of a point charge, two-charge field (±4.00 µC, 0.700 m, 31.0°) | E₁ = E₂ ≈ 73,388 N/C; net **75,595 N/C along +y**, E_x = 0 |

**Known errors in the lecture — fix on the site, list in BUG_AUDIT.md:**
1. Slide 21(b): |−24×10⁻⁸ C| × 2.0 N/C = **4.8×10⁻⁷ N**, not 4.7×10⁻⁷.
2. The Bohr slide calls mv²/r the "centrifugal force." The inward force that supplies it
   is the **centripetal** force. Use that term.
3. Lecture and brief compute with k = 8.99×10⁹; the more precise value is 8.9875×10⁹.
   **Use 8.99×10⁹ everywhere and state the value used.**

## Chapters (all principal, none "Extra")

| ID | Title | Sources |
|---|---|---|
| `ch1` | Circuits & Ohm's Law | Brief R1–R3. Cover voltage, current, resistance, power, series/parallel, circuit reduction |
| `ch2` | Electric Fields & Coulomb's Law | Lecture §1.2. Existing Charge/Coulomb/Field lessons become sections of this chapter. Keep their content and sims |
| `ch3` | Magnetism & Induction | **Not in either document.** Project-approved scope: Lorentz force, magnetic motion, flux, Faraday, Lenz, induction. Keep as already built; add nothing beyond these topics |

- **Quiz:** exactly **24** unique active questions, **8 per chapter**, each with one
  correct answer and a scientifically valid explanation. Ch2 questions must derive from
  the lecture items above.
- **Derived values:** chapter, quiz, and sim counts come from the registries. No
  hand-typed duplicates in HTML, metadata, README, or dashboards.

## Independent recomputation of the lecture check values (script, k=8.99e9, e=1.602e-19)
Run: `node docs/spec/verify-checks.mjs` (results must match the table above within ≤1 %).
