/* EMC Lab — single authoritative topic registry (the one place subjects are
   defined). Navigation, chapter counts, progress topics, quiz categories, the
   simulation index, formula categories, the production page list and the
   sitemap are all derived from this object — never hand-copied.
   Adding a future subject = adding an entry here + its content files. */
window.EMC_REGISTRY = {
  "origin": "https://emc-physics.vercel.app",
  "subjects": [
    {
      "id": "electromagnetics",
      "title": "Electromagnetics",
      "blurb": "Charge, current and field: the complete calculus-based treatment.",
      "chapters": [
        {
          "id": "current", "num": 1, "title": "Circuits & Ohm’s Law", "short": "Circuits",
          "path": "topics/current.html", "quizTag": "current", "tagClass": "tag-amber",
          "summary": "Voltage, current, resistance, power and real resistor networks.",
          "sims": ["sim-ohm", "sim-circuit"],
          "points": ["Ohm’s law V = IR and P = VI", "Series & parallel reduction", "Build and solve live circuits"]
        },
        {
          "id": "efield", "num": 2, "title": "Electric Fields & Coulomb’s Law", "short": "Fields",
          "path": "topics/efield.html", "quizTag": "efield", "tagClass": "tag-rose",
          "summary": "Charge, the inverse-square force, fields, superposition and potential.",
          "sims": ["sim-coulomb", "sim-efield"],
          "points": ["Coulomb’s inverse-square law", "Field lines & superposition", "Potential and −∫E·dr, measured live"]
        },
        {
          "id": "magind", "num": 3, "title": "Magnetism & Induction", "short": "Magnetism",
          "path": "topics/magind.html", "quizTag": "magind", "tagClass": "tag-violet",
          "summary": "Fields from moving charge, the Lorentz force, flux, Faraday and Lenz.",
          "sims": ["sim-lorentz", "sim-induction"],
          "points": ["F = qv × B and cyclotron motion", "Flux Φ and Faraday’s law", "Lenz’s law, live on the coil"]
        }
      ]
    }
  ]
};
/* Convenience flatteners shared by every consumer. */
window.EMC_REGISTRY.chapters = window.EMC_REGISTRY.subjects.reduce((a, s) => a.concat(s.chapters.map(c => Object.assign({ subject: s.id }, c))), []);
window.EMC_REGISTRY.chapter = id => window.EMC_REGISTRY.chapters.find(c => c.id === id) || null;
