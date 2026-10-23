/* EMC Lab — single authoritative chapter registry (the one place chapters are
   defined). Navigation, chapter counts, progress topics, quiz categories, the
   simulation index, the production page list and sitemap.xml are all derived
   from this object — never hand-copied.
   Scope follows the course brief exactly: THREE principal chapters, with no
   optional or beyond-scope tier —
     ch1 Circuits & Ohm's Law            (brief R1–R3)
     ch2 Electric Fields & Coulomb's Law (the graded lecture: charge,
         Coulomb's law and electric field as its three sections)
     ch3 Magnetism & Induction           (project-approved scope: Lorentz
         force, magnetic motion, flux, Faraday, Lenz, induction).
   `aliases` maps every id used by earlier site generations (charge, coulomb,
   field, efield, charges, current, circuits, magind, magnetism) onto the
   chapter that owns it now, so old hash routes, old quiz deep links and old
   progress records all resolve instead of 404ing or losing data.
   The object below must stay pure JSON: tools/build-public.mjs parses it
   directly to derive the production page list. */
window.EMC_REGISTRY = {
  "origin": "https://emc-lab.vercel.app",
  "chapters": [
    {
      "id": "ch1", "num": 1, "title": "Circuits & Ohm’s Law", "short": "Circuits",
      "path": "topics/current.html", "quizTag": "ch1", "tagClass": "tag-amber",
      "summary": "Voltage, current, resistance, power and real resistor networks.",
      "sims": ["sim-ohm", "sim-circuit"],
      "points": ["Ohm’s law V = IR and P = VI", "Series & parallel reduction", "Build and solve live circuits"]
    },
    {
      "id": "ch2", "num": 2, "title": "Electric Fields & Coulomb’s Law", "short": "Fields",
      "path": "topics/fields.html", "quizTag": "ch2", "tagClass": "tag-cyan",
      "summary": "The lecture in three sections: charge, Coulomb’s law with superposition, and the electric field.",
      "sims": ["sim-static-room", "toy-balloon", "toy-ledger", "sim-arena", "toy-pinforce", "toy-bohr", "sim-fieldpaint", "toy-dipole", "toy-zerohunt"],
      "sections": [
        { "id": "charge", "num": "2.1", "title": "Electric Charge", "anchor": "#charge" },
        { "id": "coulomb", "num": "2.2", "title": "Coulomb’s Law", "anchor": "#coulomb" },
        { "id": "field", "num": "2.3", "title": "Electric Field", "anchor": "#field" }
      ],
      "points": ["Like repels, unlike attracts; q = n·e, conserved", "F = k|q₁q₂|/r² — forces add as arrows", "E = F/|q₀| and the +test-charge direction rule"]
    },
    {
      "id": "ch3", "num": 3, "title": "Magnetism & Induction", "short": "Magnetism",
      "path": "topics/magind.html", "quizTag": "ch3", "tagClass": "tag-violet",
      "summary": "Fields from moving charge, the Lorentz force, flux, Faraday and Lenz.",
      "sims": ["sim-lorentz", "sim-induction"],
      "points": ["F = qv × B and cyclotron motion", "Flux Φ and Faraday’s law", "Lenz’s law, live on the coil"]
    }
  ],
  "aliases": {
    "charge": "ch2", "coulomb": "ch2", "field": "ch2", "efield": "ch2", "charges": "ch2",
    "current": "ch1", "circuits": "ch1",
    "magind": "ch3", "magnetism": "ch3"
  }
};
/* Convenience helpers shared by every consumer. */
window.EMC_REGISTRY.chapter = id => window.EMC_REGISTRY.chapters.find(c => c.id === id) || null;
/* chapter id OR any legacy id → the chapter object (or null). */
window.EMC_REGISTRY.resolve = id => {
  const R = window.EMC_REGISTRY;
  return R.chapter(id) || R.chapter(R.aliases[id] || '') || null;
};
