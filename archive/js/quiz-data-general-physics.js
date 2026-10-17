/* Quiz bank: 30 multiple-choice questions with worked explanations.
   Schema: { id, topic, label, q, options[4], answer (0-based), explain }.
   Coverage: vectors 6 · fluids 6 · heat 6 · waves 6 · current 6. Exactly four
   options per question (js/quiz.js prints key labels A–D from that). */
window.EMC_QUIZ = [

  /* ---------------- Topic 1: measurement & vectors ---------------------- */
  {
    id: 1, topic: 'vectors', label: 'Measurement & vectors',
    q: 'Which one of these is an SI <strong>base</strong> unit?',
    options: ['newton (N)', 'joule (J)', 'kilogram (kg)', 'watt (W)'],
    answer: 2,
    explain: 'The kilogram is one of the seven SI base units (with the metre, second, ampere, kelvin, mole and candela). The newton, joule and watt are all <b>derived</b> units: 1 N = 1 kg·m/s², 1 J = 1 N·m, 1 W = 1 J/s. Every derived unit can be broken down into base units — that is the whole idea of dimensional analysis.'
  },
  {
    id: 2, topic: 'vectors', label: 'Measurement & vectors',
    q: 'A quantity is measured as 5 kg·m/s². Which unit is exactly equivalent to it?',
    options: ['5 N', '5 J', '5 W', '5 Pa'],
    answer: 0,
    explain: 'Force has dimensions [M][L][T]<sup>−2</sup>, and the newton is <b>defined</b> as 1 N = 1 kg·m/s², so 5 kg·m/s² = <b>5 N</b>. The joule is kg·m²/s² (one power of length more), the watt is kg·m²/s³ and the pascal is kg/(m·s²) — dimensional analysis rules all three out instantly.'
  },
  {
    id: 3, topic: 'vectors', label: 'Measurement & vectors',
    q: 'Vector <b>A</b> is 3 m due east and vector <b>B</b> is 4 m due north. The magnitude of A + B is:',
    options: ['7 m', '5 m', '1 m', '12 m'],
    answer: 1,
    explain: 'Vectors add by <b>components</b>, not by magnitudes. The two are perpendicular, so |A + B| = √(3² + 4²) = √25 = <b>5 m</b> — the classic 3-4-5 triangle — pointing 53.1° north of east. Adding 3 + 4 = 7 would only be correct if both pointed the same way.'
  },
  {
    id: 4, topic: 'vectors', label: 'Measurement & vectors',
    q: 'Two displacement vectors have magnitudes 6 m and 8 m. Their resultant CANNOT be:',
    options: ['14 m', '10 m', '2 m', '1 m'],
    answer: 3,
    explain: 'The resultant of two vectors ranges between |8 − 6| = <b>2 m</b> (pointing in opposite directions) and 8 + 6 = <b>14 m</b> (same direction), with every value in between reachable at some angle: 10 m happens at 90° (√(36+64)). <b>1 m is outside that window</b>, so it is impossible.'
  },
  {
    id: 5, topic: 'vectors', label: 'Measurement & vectors',
    q: 'Which of these quantities is a vector?',
    options: ['temperature', 'mass', 'velocity', 'time'],
    answer: 2,
    explain: '<b>Velocity</b> has both magnitude (speed) and direction, and velocities add by components — that makes it a vector. Temperature, mass and time have magnitude only: they are <b>scalars</b>. (Displacement, force, acceleration and momentum are the other vectors you will meet most.)'
  },
  {
    id: 6, topic: 'vectors', label: 'Measurement & vectors',
    q: 'A vector has components A<sub>x</sub> = −3 and A<sub>y</sub> = +4. Its magnitude and direction are:',
    options: ['5, in the first quadrant', '5, in the second quadrant',
              '7, in the second quadrant', '1, along the x-axis'],
    answer: 1,
    explain: '|A| = √(A<sub>x</sub>² + A<sub>y</sub>²) = √(9 + 16) = <b>5</b>. A negative x with a positive y places the arrow in the <b>second quadrant</b>, at tan<sup>−1</sup>(4/3) = 53.1° above the −x axis (126.9° from +x). Signs of the components tell you the quadrant; magnitudes alone never can.'
  },

  /* ---------------- Topic 2: fluids -------------------------------------- */
  {
    id: 7, topic: 'fluids', label: 'Fluids',
    q: 'An object of mass 400 kg occupies a volume of 0.5 m³. Its density is:',
    options: ['200 kg/m³', '800 kg/m³', '0.00125 kg/m³', '400.5 kg/m³'],
    answer: 1,
    explain: 'ρ = m/V = 400/0.5 = <b>800 kg/m³</b>. Since that is less than water’s 1000 kg/m³, this object floats in water — with 80% of its volume submerged, as the buoyancy simulator shows.'
  },
  {
    id: 8, topic: 'fluids', label: 'Fluids',
    q: 'A diver descends to 10 m in fresh water. Taking P<sub>atm</sub> ≈ 101 kPa, ρ = 1000 kg/m³ and g = 9.8 m/s², the ABSOLUTE pressure on the diver is about:',
    options: ['98 kPa', '101 kPa', '199 kPa', '10 kPa'],
    answer: 2,
    explain: 'P = P<sub>0</sub> + ρgh = 101 kPa + (1000)(9.8)(10) = 101 + 98 = <b>199 kPa</b> — almost exactly two atmospheres. The 98 kPa answer is only the <i>gauge</i> pressure (the water’s contribution); absolute pressure always adds the air pressing on the surface. Every extra 10 m of water adds roughly one atmosphere.'
  },
  {
    id: 9, topic: 'fluids', label: 'Fluids',
    q: 'A block floats in water with exactly HALF its volume submerged. The density of the block is:',
    options: ['2000 kg/m³', '1000 kg/m³', '500 kg/m³', 'impossible to tell without the block’s mass'],
    answer: 2,
    explain: 'Floating means weight = buoyant force: ρ<sub>obj</sub>Vg = ρ<sub>water</sub>V<sub>sub</sub>g. The volumes ratio gives ρ<sub>obj</sub> = ρ<sub>water</sub>·(V<sub>sub</sub>/V) = 1000 × ½ = <b>500 kg/m³</b>. A floating body always sinks to exactly the depth where the displaced fluid weighs as much as the body — which is why the submerged fraction <i>is</i> the density ratio.'
  },
  {
    id: 10, topic: 'fluids', label: 'Fluids',
    q: 'A rock is dropped into a deep lake and sinks. As it goes deeper (still fully underwater), the buoyant force on it:',
    options: ['increases, because pressure grows with depth',
              'decreases, because it is farther from the surface',
              'stays the same, because it always displaces the same volume of water',
              'becomes zero at the bottom'],
    answer: 2,
    explain: 'F<sub>B</sub> = ρ<sub>fluid</sub>·V<sub>displaced</sub>·g depends only on the <b>fluid</b> and the <b>displaced volume</b> — not on depth. A fully submerged rock displaces its own volume wherever it is, so F<sub>B</sub> is constant. Higher pressure at depth pushes on every side equally; only the top-bottom <i>difference</i> makes buoyancy, and that difference is depth-independent for an incompressible fluid. (At the very bottom the floor adds a normal force — the buoyancy itself is unchanged.)'
  },
  {
    id: 11, topic: 'fluids', label: 'Fluids',
    q: 'Air flows FASTER over the curved top surface of an aeroplane wing than under the flat bottom. By Bernoulli’s principle, the pressure on top is:',
    options: ['higher than below, pushing the wing down',
              'lower than below, so the wing is pushed up',
              'the same — pressure does not depend on speed',
              'zero, because the air has no time to press'],
    answer: 1,
    explain: 'Bernoulli: along a streamline P + ½ρv² is constant, so <b>faster flow ⇒ lower pressure</b>. The top surface runs at higher v and lower P; the higher pressure underneath pushes up — that pressure difference is lift. (Real wings also deflect air downward — Newton III gives the same answer from the other side.)'
  },
  {
    id: 12, topic: 'fluids', label: 'Fluids',
    q: 'A cargo ship is made of steel, which is about 8 times denser than water. Why does it float?',
    options: ['Steel becomes lighter when wet',
              'The ship’s engines push it up',
              'Its hull encloses air, so the ship’s AVERAGE density is below that of water',
              'Ocean water is denser than steel'],
    answer: 2,
    explain: 'Buoyancy cares about the <b>average</b> density of the whole floating body, not the material it is made of. The hull is mostly air, so mass/total-volume < 1000 kg/m³, and the ship settles until it displaces its own weight of water. Load it past its marks and the average density rises above water’s — which is what “sinks” means.'
  },

  /* ---------------- Topic 3: temperature & heat -------------------------- */
  {
    id: 13, topic: 'heat', label: 'Temperature & heat',
    q: 'Room temperature is often quoted as 68 °F. That is:',
    options: ['68 °C', '20 °C', '293 °C', '36 °C'],
    answer: 1,
    explain: '°C = (°F − 32) × 5/9 = (68 − 32) × 5/9 = 36 × 5/9 = <b>20 °C</b>. Subtract 32 FIRST, then rescale — the 32 is an offset between the zero points, not part of the scale factor. In kelvin that is 293.15 K, which is why 293 °C looks familiar but is badly wrong.'
  },
  {
    id: 14, topic: 'heat', label: 'Temperature & heat',
    q: 'Convert 27 °C to the kelvin scale:',
    options: ['246.15 K', '27 K', '300.15 K', '80.6 K'],
    answer: 2,
    explain: 'K = °C + 273.15, so 27 °C = <b>300.15 K</b> (300 K to three figures). The kelvin uses the same <i>step size</i> as Celsius — a 1 K rise is a 1 °C rise — but starts at absolute zero, where molecular motion reaches its quantum minimum. That is why kelvin is the unit every physics equation (PV = nRT, Stefan–Boltzmann…) demands.'
  },
  {
    id: 15, topic: 'heat', label: 'Temperature & heat',
    q: 'At what temperature do the Celsius and Fahrenheit scales read the SAME number?',
    options: ['−40°', '0°', '32°', 'there is no such temperature'],
    answer: 0,
    explain: 'Set T = (T − 32) × 5/9 → 9T = 5T − 160 → 4T = −160 → <b>T = −40</b>. So −40 °C = −40 °F exactly — the one point where the two scales cross. (0 °C = 32 °F and 100 °C = 212 °F are the fixed points they were built from.)'
  },
  {
    id: 16, topic: 'heat', label: 'Temperature & heat',
    q: 'How much heat is needed to warm 2.0 kg of water by 10 °C? (c<sub>water</sub> = 4186 J/(kg·K))',
    options: ['4186 J', '8372 J', '83 720 J', '418 600 J'],
    answer: 2,
    explain: 'Q = mcΔT = (2.0)(4186)(10) = <b>83 720 J ≈ 83.7 kJ</b>. Note ΔT in kelvin equals ΔT in Celsius, so no conversion is needed for a temperature <i>change</i>. Water’s huge c is why a kettle takes minutes for one cup — and why oceans moderate coastal climate.'
  },
  {
    id: 17, topic: 'heat', label: 'Temperature & heat',
    q: 'Equal masses of water and iron receive equal amounts of heat. Iron’s specific heat (450 J/kg·K) is far smaller than water’s (4186 J/kg·K). Which ends up hotter?',
    options: ['the water', 'the iron', 'both reach the same temperature', 'it depends on the starting temperature'],
    answer: 1,
    explain: 'ΔT = Q/(mc): with Q and m equal, the temperature change is <b>inversely proportional to c</b>. Iron’s small specific heat means each joule buys it roughly nine times more temperature rise than water — so the <b>iron</b> ends up far hotter. That is why a hot frying pan handle scorches while the soup in it is still drinkable.'
  },
  {
    id: 18, topic: 'heat', label: 'Temperature & heat',
    q: 'Which mechanism of heat transfer works through a complete vacuum?',
    options: ['conduction', 'convection', 'radiation', 'all three work in a vacuum'],
    answer: 2,
    explain: '<b>Radiation</b> is electromagnetic waves — it needs no material at all, which is how the Sun’s energy crosses 150 million km of empty space. Conduction needs contact between particles and convection needs a bulk-moving fluid, so both are impossible in a vacuum. A vacuum flask exploits exactly that: its double wall stops conduction and convection, and the silvered surface reflects radiation.'
  },

  /* ---------------- Topic 4: waves & sound ------------------------------- */
  {
    id: 19, topic: 'waves', label: 'Waves & sound',
    q: 'A sound wave has frequency 50 Hz and wavelength 6.86 m. Its speed is:',
    options: ['7.3 m/s', '137 m/s', '343 m/s', '0.14 m/s'],
    answer: 2,
    explain: 'v = fλ = 50 × 6.86 = <b>343 m/s</b> — the speed of sound in air at 20 °C. Wave speed is set by the <b>medium</b>; frequency is set by the <b>source</b>; the wavelength is whatever λ = v/f makes it. That is why your voice sounds higher-pitched but unchanged in speed when the air is cold… v drops, so λ shrinks.'
  },
  {
    id: 20, topic: 'waves', label: 'Waves & sound',
    q: 'Sound travelling through air is what type of wave?',
    options: ['transverse — the air moves perpendicular to the wave',
              'longitudinal — the air oscillates parallel to the direction of travel',
              'a mix that alternates between the two each cycle',
              'neither — sound is not a wave'],
    answer: 1,
    explain: 'Sound is <b>longitudinal</b>: layers of air alternately compress and rarefy along the direction the wave travels, like a slinky pushed end-to-end. A wave on a rope or string is <b>transverse</b> (motion ⊥ travel). Light is transverse too — and unlike sound, it needs no medium at all.'
  },
  {
    id: 21, topic: 'waves', label: 'Waves & sound',
    q: 'A wave keeps the same speed but its frequency doubles. Its wavelength:',
    options: ['doubles', 'halves', 'stays the same', 'becomes four times larger'],
    answer: 1,
    explain: 'v = fλ with v fixed makes f and λ <b>inversely proportional</b>: double f ⇒ <b>halve λ</b>. On a string the speed is set by tension and mass-per-length, in air by temperature — the source cannot change it, so squeezing more cycles per second into the same speed means each cycle is shorter.'
  },
  {
    id: 22, topic: 'waves', label: 'Waves & sound',
    q: 'A wave has a frequency of 4 Hz. Its period is:',
    options: ['4 s', '0.25 s', '2 s', '16 s'],
    answer: 1,
    explain: 'T = 1/f = 1/4 = <b>0.25 s</b>: each crest takes a quarter of a second to pass a fixed point. Period and frequency are reciprocals — one is “seconds per cycle”, the other “cycles per second”, and their product is always 1.'
  },
  {
    id: 23, topic: 'waves', label: 'Waves & sound',
    q: 'On the tone player, you raise a note’s frequency from 220 Hz to 440 Hz while keeping the amplitude the same. What do you hear?',
    options: ['a louder sound', 'a quieter sound',
              'a higher pitch, same loudness', 'the same pitch, but faster'],
    answer: 2,
    explain: '<b>Frequency is pitch; amplitude is loudness</b> — two independent controls. 220 → 440 Hz is exactly one octave up (an A3 becoming A4), and with amplitude untouched the loudness stays put. Human hearing covers roughly 20 Hz to 20 kHz; below that is infrasound, above it ultrasound.'
  },
  {
    id: 24, topic: 'waves', label: 'Waves & sound',
    q: 'A water wave has wavelength 10 m and period 0.02 s. Its speed is:',
    options: ['0.2 m/s', '5 m/s', '500 m/s', '50 m/s'],
    answer: 2,
    explain: 'f = 1/T = 1/0.02 = 50 Hz, so v = fλ = 50 × 10 = <b>500 m/s</b> (equivalently v = λ/T = 10/0.02). Real ocean waves are far slower than this — but the arithmetic is the same: speed = one wavelength per period.'
  },

  /* ---------------- Topic 5: electricity --------------------------------- */
  {
    id: 25, topic: 'current', label: 'Electricity',
    q: 'A 12 V battery is connected across a 4 Ω resistor. The current is:',
    options: ['48 A', '3 A', '0.33 A', '8 A'],
    answer: 1,
    explain: 'Ohm’s law: I = V/R = 12/4 = <b>3 A</b>. (48 A comes from multiplying instead of dividing — the most common slip.)'
  },
  {
    id: 26, topic: 'current', label: 'Electricity',
    q: 'Three resistors of 2 Ω, 3 Ω and 5 Ω are connected in SERIES. Their equivalent resistance is:',
    options: ['0.97 Ω', '10 Ω', '3.3 Ω', '30 Ω'],
    answer: 1,
    explain: 'Series resistances <b>add</b>: R<sub>eq</sub> = 2 + 3 + 5 = <b>10 Ω</b>. In series R<sub>eq</sub> is always larger than the largest single resistor.'
  },
  {
    id: 27, topic: 'current', label: 'Electricity',
    q: 'A 6 Ω and a 3 Ω resistor are connected in PARALLEL. Their equivalent resistance is:',
    options: ['9 Ω', '4.5 Ω', '2 Ω', '18 Ω'],
    answer: 2,
    explain: '1/R<sub>eq</sub> = 1/6 + 1/3 = 1/6 + 2/6 = 3/6 = 1/2 ⇒ R<sub>eq</sub> = <b>2 Ω</b>. In parallel R<sub>eq</sub> is always <b>smaller</b> than the smallest branch — adding a path makes it easier for current to flow.'
  },
  {
    id: 28, topic: 'current', label: 'Electricity',
    q: 'In a series circuit containing several different resistors, which quantity is the SAME through every resistor?',
    options: ['the voltage across it', 'the current through it', 'the power it dissipates', 'the charge stored in it'],
    answer: 1,
    explain: 'There is only one path, so the <b>current is identical</b> everywhere (charge is conserved — Kirchhoff’s current law). Voltages divide in proportion to R, so P = I²R differs too. Resistors do not store charge.'
  },
  {
    id: 29, topic: 'current', label: 'Electricity',
    q: 'A 10 Ω resistor carries a current of 2 A. The power it dissipates is:',
    options: ['5 W', '20 W', '40 W', '0.4 W'],
    answer: 2,
    explain: 'P = I²R = (2)²(10) = <b>40 W</b>. Equivalently V = IR = 20 V and P = VI = 20 × 2 = 40 W. That is far above a standard ¼ W resistor — it would need a proper power resistor and a heat sink.'
  },
  {
    id: 30, topic: 'current', label: 'Electricity',
    q: 'A household circuit breaker “trips” (switches off) after you plug in a heater, a kettle and a microwave at once. What actually happened?',
    options: ['The mains voltage rose until it became dangerous',
              'Adding appliances in parallel lowered the equivalent resistance, so the total current exceeded the safe rating',
              'One of the appliances broke the circuit',
              'The electricity meter ran out of credit'],
    answer: 1,
    explain: 'Every appliance is another <b>parallel</b> path across the same voltage, and parallel paths always lower R<sub>eq</sub>. With V fixed, I = V/R<sub>eq</sub> rises — and the cables would heat as I²R. The breaker opens before that heat becomes a fire. This is Topic 5’s parallel rule protecting your house.'
  }
];
