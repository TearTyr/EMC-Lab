/* EMC Lab — single authoritative topic registry (the one place subjects are
   defined). Navigation, chapter counts, progress topics, quiz categories, the
   simulation index, formula categories, the production page list and the
   sitemap are all derived from this object — never hand-copied.
   Structure follows the graded lecture "Electric Forces and Electric Field":
   three lessons (charge → Coulomb → field). Circuits and Magnetism are beyond
   that lecture, so they live in the second subject, flagged extra: true —
   still built, shipped and quiz-filterable, but out of the main flow and out
   of the progress ring. Adding a future subject = adding an entry here + its
   content files. */
window.EMC_REGISTRY = {
  "origin": "https://emc-lab.vercel.app",
  "subjects": [
    {
      "id": "lecture",
      "title": "Electric Forces & Electric Field",
      "blurb": "The lecture in three lessons: charge, Coulomb’s law, electric field.",
      "chapters": [
        {
          "id": "charge", "num": 1, "title": "Electric Charge", "short": "Charge",
          "path": "topics/charge.html", "quizTag": "charge", "tagClass": "tag-amber",
          "summary": "Two kinds of charge, quantisation, conservation, conductors and insulators.",
          "sims": ["sim-static-room", "toy-balloon", "toy-ledger"],
          "points": ["Like repels, unlike attracts", "q = n·e and charge conservation", "Conductors vs insulators, live"]
        },
        {
          "id": "coulomb", "num": 2, "title": "Coulomb’s Law", "short": "Coulomb",
          "path": "topics/coulomb.html", "quizTag": "coulomb", "tagClass": "tag-rose",
          "summary": "The inverse-square force, superposition in 1-D and 2-D, and the Bohr atom.",
          "sims": ["sim-arena", "toy-pinforce", "toy-bohr"],
          "points": ["F = k|q₁q₂|/r², computed live", "Forces add as arrows (superposition)", "Bohr orbit: v = √(ke²/mₑr)"]
        },
        {
          "id": "field", "num": 3, "title": "Electric Field", "short": "Field",
          "path": "topics/field.html", "quizTag": "field", "tagClass": "tag-cyan",
          "summary": "E = F/|q₀|, the direction rule, field lines and the lecture’s y-axis example.",
          "sims": ["sim-fieldpaint", "toy-dipole", "toy-zerohunt"],
          "points": ["E = F/|q₀| with the +test-charge direction rule", "Field lines & superposition, paintable", "Find the zero-field point, live"]
        }
      ]
    },
    {
      "id": "extra",
      "title": "Extra",
      "blurb": "Beyond this lecture: circuits and magnetism, kept for the curious.",
      "chapters": [
        {
          "id": "current", "num": 1, "title": "Circuits & Ohm’s Law", "short": "Circuits",
          "path": "topics/current.html", "quizTag": "current", "tagClass": "tag-amber",
          "summary": "Voltage, current, resistance, power and real resistor networks.",
          "sims": ["sim-ohm", "sim-circuit"], "extra": true,
          "points": ["Ohm’s law V = IR and P = VI", "Series & parallel reduction", "Build and solve live circuits"]
        },
        {
          "id": "magind", "num": 2, "title": "Magnetism & Induction", "short": "Magnetism",
          "path": "topics/magind.html", "quizTag": "magind", "tagClass": "tag-violet",
          "summary": "Fields from moving charge, the Lorentz force, flux, Faraday and Lenz.",
          "sims": ["sim-lorentz", "sim-induction"], "extra": true,
          "points": ["F = qv × B and cyclotron motion", "Flux Φ and Faraday’s law", "Lenz’s law, live on the coil"]
        }
      ]
    }
  ]
};
/* Convenience flatteners shared by every consumer. */
window.EMC_REGISTRY.chapters = window.EMC_REGISTRY.subjects.reduce((a, s) => a.concat(s.chapters.map(c => Object.assign({ subject: s.id }, c))), []);
/* The graded lecture: every chapter NOT flagged extra. Progress, the home
   counters and the quiz "Lessons" filter all count these three only. */
window.EMC_REGISTRY.lessons = window.EMC_REGISTRY.chapters.filter(c => !c.extra);
window.EMC_REGISTRY.chapter = id => window.EMC_REGISTRY.chapters.find(c => c.id === id) || null;
