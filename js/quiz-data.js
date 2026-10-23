/* Quiz bank: 35 multiple-choice questions with worked explanations and hints.
   Schema: { id, topic, label, level ('easy'|'full'), q, options[4], answer
   (0-based), explain, hint }.
   Coverage: charge 6 · coulomb 6 · field 7 (the graded lecture — every
   calculation uses the lecture's own numbers, independently verified) plus
   Extra: current 8 · magind 8. Displayed totals are derived from BANK.length,
   never hand-maintained. The printed Coulomb constant is 8.99×10<sup>9</sup>,
   the lecture's value; the code computes on full-precision k. */
window.EMC_QUIZ = [

  /* ================= Lesson 1 — Electric charge ================= */
  {
    id: 1, topic: 'charge', label: 'Electric charge', level: 'easy',
    q: 'Two objects attract each other electrically. Which statement must be true?',
    options: ['Both carry positive charge', 'Both carry negative charge',
              'They carry opposite signs of net charge', 'One of them must be a magnet'],
    answer: 2,
    explain: 'Unlike attracts: an electric <b>attraction</b> requires opposite net charges — like signs would repel, and magnetism is a separate interaction.',
    hint: 'Lesson 1’s one rule: like repels, unlike attracts.'
  },
  {
    id: 2, topic: 'charge', label: 'Electric charge', level: 'easy',
    q: 'Why can a rubber balloon hold a static charge for hours while a copper ball held in your hand cannot?',
    options: ['Rubber creates more electrons than copper',
              'Rubber is an insulator — charge stays where it was put; copper is a conductor and your body drains it',
              'Copper contains no electrons at all',
              'Rubber is heavier, so the charge sinks in'],
    answer: 1,
    explain: 'Conductors let charge <b>move</b> (here, straight into you); insulators trap it where you rubbed it — that is the whole conductor/insulator story.',
    hint: 'Which material lets charge wander freely — and where does it wander to?'
  },
  {
    id: 3, topic: 'charge', label: 'Electric charge', level: 'full',
    q: 'How many electrons carry a total charge of −1.00 C? (e = 1.602×10<sup>−19</sup> C)',
    options: ['1.60×10<sup>−19</sup>', '6.24×10<sup>−18</sup>',
              '6.24×10<sup>18</sup>', '1.60×10<sup>19</sup>'],
    answer: 2,
    explain: 'n = q/e = 1.00 / 1.602×10<sup>−19</sup> = <b>6.24×10<sup>18</sup> electrons</b> — the lecture’s conversion. A coulomb is an enormous amount of charge.',
    hint: 'Divide the total by the charge of ONE electron — don’t multiply.'
  },
  {
    id: 4, topic: 'charge', label: 'Electric charge', level: 'full',
    q: 'A dust speck loses 5.0×10<sup>6</sup> electrons. Its net charge becomes:',
    options: ['+8.0×10<sup>−13</sup> C', '−8.0×10<sup>−13</sup> C',
              '+5.0×10<sup>6</sup> C', '+3.2×10<sup>−25</sup> C'],
    answer: 0,
    explain: 'q = n·e = (5.0×10<sup>6</sup>)(1.602×10<sup>−19</sup>) = 8.01×10<sup>−13</sup> C, and losing <b>negative</b> charge leaves the speck <b>positive</b>.',
    hint: 'q = n·e — then ask which sign is LEFT BEHIND when electrons leave.'
  },
  {
    id: 5, topic: 'charge', label: 'Electric charge', level: 'easy',
    q: 'A student writes: “Rubbing the balloon on my hair created negative charge on the balloon, so the total charge of balloon + hair increased.” What is wrong?',
    options: ['Balloons cannot be charged at all',
              'Hair cannot lose electrons',
              'Rubbing only TRANSFERS electrons — the hair gains exactly what the balloon takes, so the total never changes',
              'The total charge should have decreased instead'],
    answer: 2,
    explain: 'Conservation of charge: rubbing moves electrons, it never makes them. Balloon −ne, hair +ne, total exactly 0 — the Charge Ledger toy cannot be broken.',
    hint: 'Play with the Charge Ledger: can you make the big tally move?'
  },
  {
    id: 6, topic: 'charge', label: 'Electric charge', level: 'easy',
    q: 'An atom of carbon is electrically neutral. Why?',
    options: ['It contains no charged particles at all',
              'It has equal numbers of protons and electrons',
              'Protons and electrons are the same particle',
              'Its neutrons cancel out the protons'],
    answer: 1,
    explain: 'Neutrality is a <b>balance</b>, not an absence: six protons (+6e) and six electrons (−6e) sum to zero — and neutrons carry no charge at all. Rub the atom’s material and you move electrons around; that imbalance <i>is</i> static charge, and it is where Lesson 1 begins.',
    hint: 'Neutral ≠ empty. Count the + and the −.'
  },

  /* ================= Lesson 2 — Coulomb’s law ================= */
  {
    id: 7, topic: 'coulomb', label: 'Coulomb’s law', level: 'easy',
    q: 'A +1 µC charge and a +1000 µC charge sit 1 m apart. Compare the electric forces they feel.',
    options: ['The big charge feels 1000× more force',
              'Both feel exactly the same magnitude, in opposite directions',
              'The small charge feels more force',
              'Only the big charge feels a force'],
    answer: 1,
    explain: 'Newton’s third law: F = k|q₁q₂|/r² uses the <b>product</b>, so the pair is always equal and opposite — even 1 µC vs 1000 µC.',
    hint: 'Two skaters pushing off each other: does the heavier one push harder?'
  },
  {
    id: 8, topic: 'coulomb', label: 'Coulomb’s law', level: 'full',
    q: 'Two Coulomb forces act on one charge: 3 N east and 4 N north. The net force is:',
    options: ['7 N, northeast', '1 N east',
              '5 N, at 53° north of east', '12 N'],
    answer: 2,
    explain: 'Forces add as <b>vectors</b>: √(3² + 4²) = 5 N and θ = tan⁻¹(4/3) = 53° — magnitudes at right angles never just sum to 7.',
    hint: '3-4-5. Two perpendicular arrows make a triangle — what is its hypotenuse?'
  },
  {
    id: 9, topic: 'coulomb', label: 'Coulomb’s law', level: 'full',
    q: 'Charges of +1 C and −1 C are placed 1 km apart (lecture example). The force between them is:',
    options: ['8.99 N, attractive', '8.99×10<sup>6</sup> N, attractive',
              '8.99×10<sup>3</sup> N, attractive', '8.99×10<sup>9</sup> N, repulsive'],
    answer: 2,
    explain: 'F = k|q₁q₂|/r² = (8.99×10<sup>9</sup>)(1)(1)/(1000)² = <b>8.99×10³ N</b> — the weight of about 900 kg, which is why real static is measured in µC. Opposite signs attract.',
    hint: 'Convert km → m BEFORE squaring: r² = (10³)² = 10⁶.'
  },
  {
    id: 10, topic: 'coulomb', label: 'Coulomb’s law', level: 'full',
    q: 'In the Bohr model of hydrogen (lecture example) the electron orbits at r = 5.29×10<sup>−11</sup> m. Its speed is closest to:',
    options: ['2.19×10<sup>3</sup> m/s', '5.11×10<sup>4</sup> m/s',
              '4.79×10<sup>12</sup> m/s', '2.19×10<sup>6</sup> m/s'],
    answer: 3,
    explain: 'Coulomb pull = centripetal force: ke²/r² = mₑv²/r → v = √(ke²/(mₑr)) = <b>2.19×10⁶ m/s</b> (~0.7% of light speed). The Bohr Tuner toy lands on this number when you hit the lecture radius.',
    hint: 'Set ke²/r² = mₑv²/r, solve for v — and TAKE THE SQUARE ROOT. (4.79×10¹² is the pre-root value; 5.11×10⁴ uses the proton’s mass.)'
  },
  {
    id: 11, topic: 'coulomb', label: 'Coulomb’s law', level: 'full',
    q: 'For q₁ = −4 µC at x = 0, q₂ = +3 µC at x = 0.20 m, q₃ = −7 µC at x = 0.40 m (lecture example), a student computes F₂₁ = 2.70 N and F₃₁ = 1.57 N, then answers “net force on q₁ = 4.27 N”. The mistake is:',
    options: ['The two individual forces were computed wrong',
              'They ADDED magnitudes, but the forces point opposite ways — the net is 2.70 − 1.57 = 1.1 N toward q₂',
              'They should have multiplied the two forces',
              'There is no mistake'],
    answer: 1,
    explain: 'q₂ <b>attracts</b> q₁ (+x) while q₃ <b>repels</b> it (−x): opposite arrows subtract. Directions first, arithmetic second — the arena’s “balance” challenge is this skill as a game.',
    hint: 'Draw both force arrows on the x-axis. Do they point the same way?'
  },
  {
    id: 12, topic: 'coulomb', label: 'Coulomb’s law', level: 'easy',
    q: 'Two charges exert a force F on each other. The separation is doubled while the charges stay the same. The new force is:',
    options: ['F/4', 'F/2', '2F', '4F'],
    answer: 0,
    explain: 'Coulomb’s law is <b>inverse-square</b>: F ∝ 1/r². Doubling r divides F by 2² = 4 — Pin the Force draws exactly this hyperbola live.',
    hint: 'The r in the formula is SQUARED. What does 2² do to a denominator?'
  },

  /* ================= Lesson 3 — Electric field ================= */
  {
    id: 13, topic: 'field', label: 'Electric field', level: 'easy',
    q: 'The direction of E at a point is defined as the direction of the electric force on:',
    options: ['an electron placed there', 'a positive test charge placed there',
              'the source charge itself', 'a neutron placed there'],
    answer: 1,
    explain: 'The convention: E points the way a <b>positive</b> q₀ would be pushed — field lines leave + and enter −, and an electron feels the force backwards.',
    hint: 'Field lines start on + and end on −. Which way would a POSITIVE leaf blow?'
  },
  {
    id: 14, topic: 'field', label: 'Electric field', level: 'full',
    q: 'Two equal positive point charges sit 1 m apart. At the exact midpoint:',
    options: ['E is zero because no charge is there',
              'E is doubled, because both charges contribute',
              'E is zero because the two field vectors are equal and opposite',
              'E is undefined at that point'],
    answer: 2,
    explain: 'Each charge contributes kq/r² along the same line but in <b>opposite directions</b>, so the vectors cancel. E = 0 means cancellation, never emptiness — the Zero-Field Hunt exists to prove it.',
    hint: 'Add the two fields as ARROWS, not numbers. Which way does each point at the midpoint?'
  },
  {
    id: 15, topic: 'field', label: 'Electric field', level: 'full',
    q: 'A +4 µC charge sits at y = −0.50 m and a −4 µC charge at y = +0.50 m (lecture example). The net electric field at P = (x = 0.60 m, y = 0) is:',
    options: ['1.18×10<sup>5</sup> N/C, along +y', '5.90×10<sup>4</sup> N/C, along +x',
              '0 N/C, because the charges are equal and opposite', '7.55×10<sup>4</sup> N/C, along +y'],
    answer: 3,
    explain: 'r² = 0.60² + 0.50² = 0.61 m² from each charge, so each gives E = kq/r² = 5.90×10⁴ N/C. The x-components cancel by symmetry; the y-components add: 2 × 5.90×10⁴ × (0.50/0.781) = <b>7.55×10⁴ N/C along +y</b> (the lecture prints 75.6×10³ using k ≈ 9×10⁹). The Field Painter’s Lecture-replica preset measures it.',
    hint: 'Symmetry kills one axis. Compute ONE charge’s field, then keep only the components that survive.'
  },
  {
    id: 16, topic: 'field', label: 'Electric field', level: 'full',
    q: 'A charge q₀ = +18×10<sup>−8</sup> C sits in a uniform field E = 2.0×10<sup>3</sup> N/C (lecture example). The force on it is:',
    options: ['9.0×10<sup>−11</sup> N', '3.6×10<sup>−4</sup> N, along E',
              '3.6×10<sup>−4</sup> N, opposite E', '3.6×10<sup>−11</sup> N'],
    answer: 1,
    explain: 'F = |q₀|E = (18×10⁻⁸)(2.0×10³) = <b>3.6×10⁻⁴ N</b>, and a POSITIVE charge is pushed <b>along</b> E. (Swap in q₀ = −24×10⁻⁸ C and you get 4.8×10⁻⁴ N opposite E — the lecture’s part b.)',
    hint: 'Multiply |q₀| by E; the sign of q₀ only picks the direction. (9.0×10⁻¹¹ is the division slip.)'
  },
  {
    id: 17, topic: 'field', label: 'Electric field', level: 'easy',
    q: 'A student says: “I held a −2 µC test charge at point P, measured the force pointing west, so E at P points west.” The mistake is:',
    options: ['There is no mistake — E always points along the measured force',
              'E points opposite the force on a NEGATIVE charge, so E at P points east',
              'A force cannot point west',
              'E at P would point straight up'],
    answer: 1,
    explain: 'F = q₀E keeps the sign: with q₀ < 0 the force is <b>opposite</b> E. The direction rule is defined for a positive test charge — flip the electron’s answer and you get E: east.',
    hint: 'Which way would a POSITIVE charge be pushed at the same spot?'
  },
  {
    id: 18, topic: 'field', label: 'Electric field', level: 'easy',
    q: 'Electric field lines around an isolated NEGATIVE point charge…',
    options: ['point radially outward from the charge', 'point radially inward toward the charge',
              'form closed circles around the charge', 'are parallel straight lines'],
    answer: 1,
    explain: 'Lines start on positive charge and end on negative charge, so around a lone negative they point <b>radially inward</b> — a positive test charge nearby would be pulled toward it.',
    hint: 'Lines END on negatives. Which way is “toward an end”?'
  },
  {
    id: 19, topic: 'field', label: 'Electric field', level: 'easy',
    q: 'A proton is released from rest in a uniform electric field that points to the right. It will:',
    options: ['accelerate to the right', 'accelerate to the left',
              'move right at constant speed', 'stay where it is'],
    answer: 0,
    explain: 'F = qE with q > 0, so the force is <b>along</b> E — to the right. Released from rest it <b>accelerates</b> (a net force acts, so constant speed is impossible).',
    hint: 'Positive charge: force points WITH E. Then ask: rest + net force = ?'
  },

  /* ================= Extra — Circuits & Ohm’s law ================= */
  {
    id: 20, topic: 'current', label: 'Circuits & Ohm’s law (Extra)', level: 'easy',
    q: 'A 12 V battery is connected across a 4 Ω resistor. The current is:',
    options: ['48 A', '3 A', '0.33 A', '8 A'],
    answer: 1,
    explain: 'Ohm’s law: I = V/R = 12/4 = <b>3 A</b>. (48 A comes from multiplying instead of dividing — the most common slip.)',
    hint: 'I = V/R. Divide, don’t multiply.'
  },
  {
    id: 21, topic: 'current', label: 'Circuits & Ohm’s law (Extra)', level: 'easy',
    q: 'Three resistors of 2 Ω, 3 Ω and 5 Ω are connected in SERIES. Their equivalent resistance is:',
    options: ['0.97 Ω', '10 Ω', '3.3 Ω', '30 Ω'],
    answer: 1,
    explain: 'Series resistances <b>add</b>: R<sub>eq</sub> = 2 + 3 + 5 = <b>10 Ω</b>. In series R<sub>eq</sub> is always larger than the largest single resistor.',
    hint: 'Series = one path = resistances add up.'
  },
  {
    id: 22, topic: 'current', label: 'Circuits & Ohm’s law (Extra)', level: 'full',
    q: 'A 6 Ω and a 3 Ω resistor are connected in PARALLEL. Their equivalent resistance is:',
    options: ['9 Ω', '4.5 Ω', '2 Ω', '18 Ω'],
    answer: 2,
    explain: '1/R<sub>eq</sub> = 1/6 + 1/3 = 3/6 = 1/2 ⇒ R<sub>eq</sub> = <b>2 Ω</b>. In parallel R<sub>eq</sub> is always <b>smaller</b> than the smallest branch — adding a path makes current easier.',
    hint: 'Add the CONDUCTANCES (1/R), then invert.'
  },
  {
    id: 23, topic: 'current', label: 'Circuits & Ohm’s law (Extra)', level: 'easy',
    q: 'In a series circuit containing several different resistors, which quantity is the SAME through every resistor?',
    options: ['the voltage across it', 'the current through it', 'the power it dissipates', 'the charge stored in it'],
    answer: 1,
    explain: 'There is only one path, so the <b>current is identical</b> everywhere (charge is conserved — Kirchhoff’s current law). Voltages divide in proportion to R, so P = I²R differs too.',
    hint: 'One path — can charge pile up anywhere?'
  },
  {
    id: 24, topic: 'current', label: 'Circuits & Ohm’s law (Extra)', level: 'full',
    q: 'A 10 Ω resistor carries a current of 2 A. The power it dissipates is:',
    options: ['5 W', '20 W', '40 W', '0.4 W'],
    answer: 2,
    explain: 'P = I²R = (2)²(10) = <b>40 W</b>. Equivalently V = IR = 20 V and P = VI = 40 W — far above a standard ¼ W resistor.',
    hint: 'P = I²R — the current is SQUARED.'
  },
  {
    id: 25, topic: 'current', label: 'Circuits & Ohm’s law (Extra)', level: 'full',
    q: 'A battery of EMF 12 V has an internal resistance of 1 Ω. Connected to an external 5 Ω resistor, its terminal voltage is:',
    options: ['12 V', '10 V', '2 V', '11 V'],
    answer: 1,
    explain: 'I = ε/(R + r) = 12/6 = 2 A; the internal resistance drops Ir = 2 V, leaving V = ε − Ir = <b>10 V</b>. A real battery reads less than its EMF whenever it supplies current.',
    hint: 'The loop resistance is R + r. Then V = ε − Ir.'
  },
  {
    id: 26, topic: 'current', label: 'Circuits & Ohm’s law (Extra)', level: 'full',
    q: 'A 12 V supply feeds two series resistors: 8 Ω then 4 Ω. The voltage across the 4 Ω resistor is:',
    options: ['8 V', '6 V', '4 V', '12 V'],
    answer: 2,
    explain: 'Voltage divider: V<sub>out</sub> = V<sub>in</sub>·R₂/(R₁+R₂) = 12 × 4/12 = <b>4 V</b>. One current (1 A) flows through both, so voltages divide in proportion to R.',
    hint: 'Same current through both — V = IR each.'
  },
  {
    id: 27, topic: 'current', label: 'Circuits & Ohm’s law (Extra)', level: 'easy',
    q: 'A 2 kW electric heater runs for 3 hours at $0.15 per kWh. The running cost is:',
    options: ['$0.90', '$9.00', '$0.09', '$6.00'],
    answer: 0,
    explain: 'Energy = 2 kW × 3 h = 6 kWh → 6 × $0.15 = <b>$0.90</b>. A kilowatt-hour is a unit of <i>energy</i> (1 kWh = 3.6 MJ), not power.',
    hint: 'Cost = power × time × price. Watch the units.'
  },

  /* ================= Extra — Magnetism & induction ================= */
  {
    id: 28, topic: 'magind', label: 'Magnetism & induction (Extra)', level: 'easy',
    q: 'Outside a bar magnet, magnetic field lines run:',
    options: ['from the south pole to the north pole', 'from the north pole to the south pole',
              'only through the middle of the magnet', 'in straight lines that never curve'],
    answer: 1,
    explain: 'Outside the magnet lines go <b>N → S</b>; inside they continue S → N, so every line is a <b>closed loop</b> — the graphical statement of “no magnetic monopoles”.',
    hint: 'Compass needles point away from N…'
  },
  {
    id: 29, topic: 'magind', label: 'Magnetism & induction (Extra)', level: 'easy',
    q: 'A charged particle moves PARALLEL to a uniform magnetic field. The magnetic force on it is:',
    options: ['maximum', 'qvB', 'zero', 'perpendicular to the field'],
    answer: 2,
    explain: 'F = qvB sinθ with θ = 0°, so sinθ = 0 and <b>F = 0</b> — the particle continues in a straight line at constant speed.',
    hint: 'F = qvB sinθ. What is sin 0°?'
  },
  {
    id: 30, topic: 'magind', label: 'Magnetism & induction (Extra)', level: 'full',
    q: 'A positive charge moves to the right (+x) through a magnetic field pointing OUT of the page (+z). The force points:',
    options: ['up (+y)', 'down (−y)', 'to the right (+x)', 'out of the page (+z)'],
    answer: 1,
    explain: 'F = qv × B: x̂ × ẑ = −ŷ, so the force is <b>downward</b>. Right hand: fingers along v, curl out of the page, thumb points down.',
    hint: 'Cross-product order matters: v × B, not B × v.'
  },
  {
    id: 31, topic: 'magind', label: 'Magnetism & induction (Extra)', level: 'full',
    q: 'A charged particle moves in a circle at constant speed in a uniform magnetic field. Which statement is correct?',
    options: ['The magnetic force does work, increasing its kinetic energy',
              'The force is always perpendicular to v, so it does no work and only bends the path',
              'The particle accelerates along its velocity',
              'The orbit radius is independent of the particle’s mass'],
    answer: 1,
    explain: 'F = qv × B is always ⊥ v, so F·v = 0: <b>no work, no change of speed</b> — only direction. And r = mv/(|q|B) certainly depends on mass.',
    hint: 'A perpendicular force can never change the SPEED.'
  },
  {
    id: 32, topic: 'magind', label: 'Magnetism & induction (Extra)', level: 'full',
    q: 'A 200-turn coil sees its flux change at 0.05 Wb/s per turn. The induced EMF is:',
    options: ['0.25 V', '10 V', '4000 V', '0.00025 V'],
    answer: 1,
    explain: 'Faraday: |EMF| = N·|dΦ/dt| = 200 × 0.05 = <b>10 V</b> — it depends on the RATE of change of flux, not the flux itself.',
    hint: 'EMF = N × rate. Multiply, don’t divide.'
  },
  {
    id: 33, topic: 'magind', label: 'Magnetism & induction (Extra)', level: 'easy',
    q: 'Lenz’s law says the induced current flows so that it:',
    options: ['reinforces the change in flux that produced it',
              'opposes the change in flux that produced it',
              'always flows clockwise',
              'makes the total flux through the coil zero'],
    answer: 1,
    explain: 'The induced current <b>opposes the CHANGE</b> (the minus sign in EMF = −NdΦ/dt) — energy conservation in disguise: you must do work against the opposition.',
    hint: 'Nature resists change — but it opposes the CHANGE, not the flux itself.'
  },
  {
    id: 34, topic: 'magind', label: 'Magnetism & induction (Extra)', level: 'full',
    q: 'A bar magnet is pushed through a coil connected to a resistor. Which change would NOT alter the induced EMF?',
    options: ['Moving the magnet faster', 'Using more turns',
              'Using a stronger magnet', 'Increasing the circuit resistance'],
    answer: 3,
    explain: 'EMF = −N dΦ/dt depends on turns, strength and speed only. R changes the induced <b>current</b> (I = EMF/R) and the heating — never the EMF.',
    hint: 'Which quantity appears in Faraday’s law — and which only in Ohm’s?'
  },
  {
    id: 35, topic: 'magind', label: 'Magnetism & induction (Extra)', level: 'easy',
    q: 'A strong magnet dropped down a vertical copper tube falls much more slowly than in free fall. Why?',
    options: ['Copper is magnetic and attracts the magnet',
              'The moving magnet induces eddy currents whose fields oppose the motion (Lenz’s law)',
              'Air resistance inside the tube is much larger',
              'The magnet loses its magnetism inside copper'],
    answer: 1,
    explain: 'The falling magnet changes the flux through the tube, driving <b>eddy currents</b>; by Lenz’s law their field drags upward. The lost potential energy becomes heat (I²R) in the copper — the eddy-current brake.',
    hint: 'Copper is not magnetic — but it IS a conductor. What does a moving magnet do to conductors?'
  },
];
