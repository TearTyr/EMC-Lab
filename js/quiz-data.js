/* Quiz bank: 16 multiple-choice questions — exactly 8 per chapter — with
   worked explanations and hints.
   Schema: { id, topic, label, level ('easy'|'full'), q, options[4], answer
   (0-based), explain, hint }.
   Coverage: ch1 Circuits & Ohm's law 8 · ch2 Electric fields & Coulomb's law 8 Every ch2 question derives from a lecture
   item (docs/spec/brief-digest.md §1.2); the three worked-example questions
   use the lecture's own configurations and were independently recomputed
   (docs/spec/verify-checks.mjs). Displayed totals are derived from
   BANK.length, never hand-maintained. k = 8.99×10⁹ N·m²/C² everywhere —
   the lecture's value, computed AND printed.
   The bank is exactly the curated 16 (8 per chapter). */
window.EMC_QUIZ = [

  /* ================= Chapter 1 — Circuits & Ohm's law ================= */
  {
    id: 1, topic: 'ch1', label: "Circuits & Ohm’s Law", level: 'easy',
    q: "A 12 V battery is connected across a 4 Ω resistor. The current is:",
    options: ["48 A",
              "3 A",
              "0.33 A",
              "8 A"],
    answer: 1,
    explain: "Ohm’s law: I = V/R = 12/4 = <b>3 A</b>. (48 A comes from multiplying instead of dividing — the most common slip.)",
    hint: "I = V/R. Divide, don’t multiply."
  },
  {
    id: 2, topic: 'ch1', label: "Circuits & Ohm’s Law", level: 'easy',
    q: "Three resistors of 2 Ω, 3 Ω and 5 Ω are connected in SERIES. Their equivalent resistance is:",
    options: ["0.97 Ω",
              "10 Ω",
              "3.3 Ω",
              "30 Ω"],
    answer: 1,
    explain: "Series resistances <b>add</b>: R<sub>eq</sub> = 2 + 3 + 5 = <b>10 Ω</b>. In series R<sub>eq</sub> is always larger than the largest single resistor.",
    hint: "Series = one path = resistances add up."
  },
  {
    id: 3, topic: 'ch1', label: "Circuits & Ohm’s Law", level: 'full',
    q: "A 6 Ω and a 3 Ω resistor are connected in PARALLEL. Their equivalent resistance is:",
    options: ["9 Ω",
              "4.5 Ω",
              "2 Ω",
              "18 Ω"],
    answer: 2,
    explain: "1/R<sub>eq</sub> = 1/6 + 1/3 = 3/6 = 1/2 ⇒ R<sub>eq</sub> = <b>2 Ω</b>. In parallel R<sub>eq</sub> is always <b>smaller</b> than the smallest branch — adding a path makes current easier.",
    hint: "Add the CONDUCTANCES (1/R), then invert."
  },
  {
    id: 4, topic: 'ch1', label: "Circuits & Ohm’s Law", level: 'easy',
    q: "In a series circuit containing several different resistors, which quantity is the SAME through every resistor?",
    options: ["the voltage across it",
              "the current through it",
              "the power it dissipates",
              "the charge stored in it"],
    answer: 1,
    explain: "There is only one path, so the <b>current is identical</b> everywhere (charge is conserved — Kirchhoff’s current law). Voltages divide in proportion to R, so P = I²R differs too.",
    hint: "One path — can charge pile up anywhere?"
  },
  {
    id: 5, topic: 'ch1', label: "Circuits & Ohm’s Law", level: 'full',
    q: "A 10 Ω resistor carries a current of 2 A. The power it dissipates is:",
    options: ["5 W",
              "20 W",
              "40 W",
              "0.4 W"],
    answer: 2,
    explain: "P = I²R = (2)²(10) = <b>40 W</b>. Equivalently V = IR = 20 V and P = VI = 40 W — far above a standard ¼ W resistor.",
    hint: "P = I²R — the current is SQUARED."
  },
  {
    id: 6, topic: 'ch1', label: "Circuits & Ohm’s Law", level: 'full',
    q: "A battery of EMF 12 V has an internal resistance of 1 Ω. Connected to an external 5 Ω resistor, its terminal voltage is:",
    options: ["12 V",
              "10 V",
              "2 V",
              "11 V"],
    answer: 1,
    explain: "I = ε/(R + r) = 12/6 = 2 A; the internal resistance drops Ir = 2 V, leaving V = ε − Ir = <b>10 V</b>. A real battery reads less than its EMF whenever it supplies current.",
    hint: "The loop resistance is R + r. Then V = ε − Ir."
  },
  {
    id: 7, topic: 'ch1', label: "Circuits & Ohm’s Law", level: 'full',
    q: "A 12 V supply feeds two series resistors: 8 Ω then 4 Ω. The voltage across the 4 Ω resistor is:",
    options: ["8 V",
              "6 V",
              "4 V",
              "12 V"],
    answer: 2,
    explain: "Voltage divider: V<sub>out</sub> = V<sub>in</sub>·R₂/(R₁+R₂) = 12 × 4/12 = <b>4 V</b>. One current (1 A) flows through both, so voltages divide in proportion to R.",
    hint: "Same current through both — V = IR each."
  },
  {
    id: 8, topic: 'ch1', label: "Circuits & Ohm’s Law", level: 'easy',
    q: "A 2 kW electric heater runs for 3 hours at $0.15 per kWh. The running cost is:",
    options: ["$0.90",
              "$9.00",
              "$0.09",
              "$6.00"],
    answer: 0,
    explain: "Energy = 2 kW × 3 h = 6 kWh → 6 × $0.15 = <b>$0.90</b>. A kilowatt-hour is a unit of <i>energy</i> (1 kWh = 3.6 MJ), not power.",
    hint: "Cost = power × time × price. Watch the units."
  },

  /* ============ Chapter 2 — Electric fields & Coulomb's law ============ */
  {
    id: 9, topic: 'ch2', label: "Electric charge", level: 'full',
    q: "How many electrons carry a total charge of −1.00 C? (e = 1.602×10<sup>−19</sup> C)",
    options: ["1.60×10<sup>−19</sup>",
              "6.24×10<sup>−18</sup>",
              "6.24×10<sup>18</sup>",
              "1.60×10<sup>19</sup>"],
    answer: 2,
    explain: "n = q/e = 1.00 / 1.602×10<sup>−19</sup> = <b>6.24×10<sup>18</sup> electrons</b> — the lecture’s conversion. A coulomb is an enormous amount of charge.",
    hint: "Divide the total by the charge of ONE electron — don’t multiply."
  },
  {
    id: 10, topic: 'ch2', label: "Electric charge", level: 'easy',
    q: "A student writes: “Rubbing the balloon on my hair created negative charge on the balloon, so the total charge of balloon + hair increased.” What is wrong?",
    options: ["Balloons cannot be charged at all",
              "Hair cannot lose electrons",
              "Rubbing only TRANSFERS electrons — the hair gains exactly what the balloon takes, so the total never changes",
              "The total charge should have decreased instead"],
    answer: 2,
    explain: "Conservation of charge: rubbing moves electrons, it never makes them. Balloon −ne, hair +ne, total exactly 0 — the balloon sandbox cannot break it.",
    hint: "Try the balloon sandbox: can you make the total charge change?"
  },
  {
    id: 11, topic: 'ch2', label: "Coulomb’s law", level: 'full',
    q: "Charges of +1 C and −1 C are placed 1 km apart (lecture example). The force between them is:",
    options: ["8.99 N, attractive",
              "8.99×10<sup>6</sup> N, attractive",
              "8.99×10<sup>3</sup> N, attractive",
              "8.99×10<sup>9</sup> N, repulsive"],
    answer: 2,
    explain: "F = k|q₁q₂|/r² = (8.99×10<sup>9</sup>)(1)(1)/(1000)² = <b>8.99×10³ N</b> — the weight of about 900 kg, which is why real static is measured in µC. Opposite signs attract.",
    hint: "Convert km → m BEFORE squaring: r² = (10³)² = 10⁶."
  },
  {
    id: 12, topic: 'ch2', label: "Coulomb’s law", level: 'full',
    q: "Lecture line example: q₂ = −4.0 µC at x = 0, q₁ = +3.0 µC at x = 0.20 m, q₃ = −7.0 µC at x = 0.35 m. The net force on q₁ is:",
    options: ["2.70 N toward −x",
              "8.39 N toward +x",
              "5.69 N toward +x",
              "11.1 N toward +x"],
    answer: 2,
    explain: "Both neighbours <b>attract</b> the positive q₁: F₁₂ = k|q₁q₂|/(0.20)² = <b>2.70 N</b> pulls toward −x, F₁₃ = k|q₁q₃|/(0.15)² = <b>8.39 N</b> pulls toward +x. Signs choose directions, so add <i>with signs</i>: 8.39 − 2.70 = <b>5.69 N toward +x</b> — the lecture’s own answer.",
    hint: "Compute each pull separately, give each a SIGN from its direction, then add."
  },
  {
    id: 13, topic: 'ch2', label: "Coulomb’s law", level: 'full',
    q: "Lecture 2-D example: q₁ = +4.0 µC at the origin; q₂ = −6.0 µC sits 0.15 m away, 73° above the +x axis; q₃ = −5.0 µC sits on the +x axis, 0.10 m away. The net force on q₁ is closest to:",
    options: ["18.0 N along +x",
              "9.6 N at 73° above +x",
              "22.7 N at ≈24° above +x",
              "27.6 N straight up"],
    answer: 2,
    explain: "Two attractions: F₁₂ = k(4.0)(6.0)µ²/(0.15)² = <b>9.6 N</b> toward 73°; F₁₃ = k(4.0)(5.0)µ²/(0.10)² = <b>18.0 N</b> along +x. Components: Fₓ = 9.6·cos 73° + 18.0 = 20.8 N, F_y = 9.6·sin 73° = 9.2 N → |F| = √(20.8² + 9.2²) = <b>22.7 N</b> at tan⁻¹(9.2/20.8) ≈ <b>24° above +x</b>. Forces add as vectors, never as plain numbers.",
    hint: "Split each pull into x and y, add the components, then rebuild the vector."
  },
  {
    id: 14, topic: 'ch2', label: "Coulomb’s law", level: 'full',
    q: "In the Bohr model of hydrogen (lecture example) the electron orbits at r = 5.29×10<sup>−11</sup> m. Its speed is closest to:",
    options: ["2.19×10<sup>3</sup> m/s",
              "5.11×10<sup>4</sup> m/s",
              "4.79×10<sup>12</sup> m/s",
              "2.19×10<sup>6</sup> m/s"],
    answer: 3,
    explain: "Coulomb pull = centripetal force: ke²/r² = mₑv²/r → v = √(ke²/(mₑr)) = <b>2.19×10⁶ m/s</b> (~0.7% of light speed). The Bohr Tuner toy lands on this number when you hit the lecture radius.",
    hint: "Set ke²/r² = mₑv²/r, solve for v — and TAKE THE SQUARE ROOT. (4.79×10¹² is the pre-root value; 5.11×10⁴ uses the proton’s mass.)"
  },
  {
    id: 15, topic: 'ch2', label: "Electric field", level: 'full',
    q: "Lecture example: q₊ = +4.00 µC and q₋ = −4.00 µC sit symmetrically about the y-axis, each 0.700 m from point P, the lines from P to the charges making 31.0° with the x-axis. The net electric field at P is closest to:",
    options: ["73,388 N/C along +x",
              "75,595 N/C along +y (Eₓ = 0)",
              "146,776 N/C along +y",
              "0 N/C — equal charges cancel"],
    answer: 1,
    explain: "Each charge contributes E = kq/r² = (8.99×10⁹)(4.00×10⁻⁶)/(0.700)² = <b>73,388 N/C</b>. The x-components are equal and opposite → <b>Eₓ = 0</b>. The y-components add (away from the lower +, toward the upper −): E_y = 2 × 73,388 × sin 31.0° = <b>75,595 N/C along +y</b>.",
    hint: "Equal distances mean equal magnitudes — symmetry kills one component entirely."
  },
  {
    id: 16, topic: 'ch2', label: "Electric field", level: 'full',
    q: "A charge q₀ = +18×10<sup>−8</sup> C sits in the lecture’s uniform spot field E = 2.0 N/C. The force on it is:",
    options: ["9.0×10<sup>−8</sup> N",
              "3.6×10<sup>−7</sup> N, along E",
              "3.6×10<sup>−7</sup> N, opposite E",
              "3.6×10<sup>−8</sup> N"],
    answer: 1,
    explain: "F = |q₀|E = (18×10⁻⁸)(2.0) = <b>3.6×10⁻⁷ N</b>, and a POSITIVE charge is pushed <b>along</b> E. (Swap in q₀ = −24×10⁻⁸ C and you get 4.8×10⁻⁷ N opposite E — the lecture’s part (b), and the corrected value of the slide’s 4.7×10⁻⁷ N.)",
    hint: "Multiply |q₀| by E; the sign of q₀ only picks the direction. (9.0×10⁻¹¹ is the division slip.)"
  }

];
