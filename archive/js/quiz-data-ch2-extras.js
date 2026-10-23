/* Archived during the 24-question curation (brief: exactly 8 per chapter).
   These 11 lesson questions are scientifically sound but exceed the ch2 quota;
   kept recoverable, original ids preserved. See BUG_AUDIT.md SCOPE-01. */
window.EMC_QUIZ_CH2_EXTRAS = [
  {
    "id": 1,
    "topic": "charge",
    "label": "Electric charge",
    "level": "easy",
    "q": "Two objects attract each other electrically. Which statement must be true?",
    "options": [
      "Both carry positive charge",
      "Both carry negative charge",
      "They carry opposite signs of net charge",
      "One of them must be a magnet"
    ],
    "answer": 2,
    "explain": "Unlike attracts: an electric <b>attraction</b> requires opposite net charges — like signs would repel, and magnetism is a separate interaction.",
    "hint": "Lesson 1’s one rule: like repels, unlike attracts."
  },
  {
    "id": 2,
    "topic": "charge",
    "label": "Electric charge",
    "level": "easy",
    "q": "Why can a rubber balloon hold a static charge for hours while a copper ball held in your hand cannot?",
    "options": [
      "Rubber creates more electrons than copper",
      "Rubber is an insulator — charge stays where it was put; copper is a conductor and your body drains it",
      "Copper contains no electrons at all",
      "Rubber is heavier, so the charge sinks in"
    ],
    "answer": 1,
    "explain": "Conductors let charge <b>move</b> (here, straight into you); insulators trap it where you rubbed it — that is the whole conductor/insulator story.",
    "hint": "Which material lets charge wander freely — and where does it wander to?"
  },
  {
    "id": 4,
    "topic": "charge",
    "label": "Electric charge",
    "level": "full",
    "q": "A dust speck loses 5.0×10<sup>6</sup> electrons. Its net charge becomes:",
    "options": [
      "+8.0×10<sup>−13</sup> C",
      "−8.0×10<sup>−13</sup> C",
      "+5.0×10<sup>6</sup> C",
      "+3.2×10<sup>−25</sup> C"
    ],
    "answer": 0,
    "explain": "q = n·e = (5.0×10<sup>6</sup>)(1.602×10<sup>−19</sup>) = 8.01×10<sup>−13</sup> C, and losing <b>negative</b> charge leaves the speck <b>positive</b>.",
    "hint": "q = n·e — then ask which sign is LEFT BEHIND when electrons leave."
  },
  {
    "id": 6,
    "topic": "charge",
    "label": "Electric charge",
    "level": "easy",
    "q": "An atom of carbon is electrically neutral. Why?",
    "options": [
      "It contains no charged particles at all",
      "It has equal numbers of protons and electrons",
      "Protons and electrons are the same particle",
      "Its neutrons cancel out the protons"
    ],
    "answer": 1,
    "explain": "Neutrality is a <b>balance</b>, not an absence: six protons (+6e) and six electrons (−6e) sum to zero — and neutrons carry no charge at all. Rub the atom’s material and you move electrons around; that imbalance <i>is</i> static charge, and it is where Lesson 1 begins.",
    "hint": "Neutral ≠ empty. Count the + and the −."
  },
  {
    "id": 7,
    "topic": "coulomb",
    "label": "Coulomb’s law",
    "level": "easy",
    "q": "A +1 µC charge and a +1000 µC charge sit 1 m apart. Compare the electric forces they feel.",
    "options": [
      "The big charge feels 1000× more force",
      "Both feel exactly the same magnitude, in opposite directions",
      "The small charge feels more force",
      "Only the big charge feels a force"
    ],
    "answer": 1,
    "explain": "Newton’s third law: F = k|q₁q₂|/r² uses the <b>product</b>, so the pair is always equal and opposite — even 1 µC vs 1000 µC.",
    "hint": "Two skaters pushing off each other: does the heavier one push harder?"
  },
  {
    "id": 12,
    "topic": "coulomb",
    "label": "Coulomb’s law",
    "level": "easy",
    "q": "Two charges exert a force F on each other. The separation is doubled while the charges stay the same. The new force is:",
    "options": [
      "F/4",
      "F/2",
      "2F",
      "4F"
    ],
    "answer": 0,
    "explain": "Coulomb’s law is <b>inverse-square</b>: F ∝ 1/r². Doubling r divides F by 2² = 4 — Pin the Force draws exactly this hyperbola live.",
    "hint": "The r in the formula is SQUARED. What does 2² do to a denominator?"
  },
  {
    "id": 13,
    "topic": "field",
    "label": "Electric field",
    "level": "easy",
    "q": "The direction of E at a point is defined as the direction of the electric force on:",
    "options": [
      "an electron placed there",
      "a positive test charge placed there",
      "the source charge itself",
      "a neutron placed there"
    ],
    "answer": 1,
    "explain": "The convention: E points the way a <b>positive</b> q₀ would be pushed — field lines leave + and enter −, and an electron feels the force backwards.",
    "hint": "Field lines start on + and end on −. Which way would a POSITIVE leaf blow?"
  },
  {
    "id": 14,
    "topic": "field",
    "label": "Electric field",
    "level": "full",
    "q": "Two equal positive point charges sit 1 m apart. At the exact midpoint:",
    "options": [
      "E is zero because no charge is there",
      "E is doubled, because both charges contribute",
      "E is zero because the two field vectors are equal and opposite",
      "E is undefined at that point"
    ],
    "answer": 2,
    "explain": "Each charge contributes kq/r² along the same line but in <b>opposite directions</b>, so the vectors cancel. E = 0 means cancellation, never emptiness — the Zero-Field Hunt exists to prove it.",
    "hint": "Add the two fields as ARROWS, not numbers. Which way does each point at the midpoint?"
  },
  {
    "id": 17,
    "topic": "field",
    "label": "Electric field",
    "level": "easy",
    "q": "A student says: “I held a −2 µC test charge at point P, measured the force pointing west, so E at P points west.” The mistake is:",
    "options": [
      "There is no mistake — E always points along the measured force",
      "E points opposite the force on a NEGATIVE charge, so E at P points east",
      "A force cannot point west",
      "E at P would point straight up"
    ],
    "answer": 1,
    "explain": "F = q₀E keeps the sign: with q₀ < 0 the force is <b>opposite</b> E. The direction rule is defined for a positive test charge — flip the electron’s answer and you get E: east.",
    "hint": "Which way would a POSITIVE charge be pushed at the same spot?"
  },
  {
    "id": 18,
    "topic": "field",
    "label": "Electric field",
    "level": "easy",
    "q": "Electric field lines around an isolated NEGATIVE point charge…",
    "options": [
      "point radially outward from the charge",
      "point radially inward toward the charge",
      "form closed circles around the charge",
      "are parallel straight lines"
    ],
    "answer": 1,
    "explain": "Lines start on positive charge and end on negative charge, so around a lone negative they point <b>radially inward</b> — a positive test charge nearby would be pulled toward it.",
    "hint": "Lines END on negatives. Which way is “toward an end”?"
  },
  {
    "id": 19,
    "topic": "field",
    "label": "Electric field",
    "level": "easy",
    "q": "A proton is released from rest in a uniform electric field that points to the right. It will:",
    "options": [
      "accelerate to the right",
      "accelerate to the left",
      "move right at constant speed",
      "stay where it is"
    ],
    "answer": 0,
    "explain": "F = qE with q > 0, so the force is <b>along</b> E — to the right. Released from rest it <b>accelerates</b> (a net force acts, so constant speed is impossible).",
    "hint": "Positive charge: force points WITH E. Then ask: rest + net force = ?"
  }
];
