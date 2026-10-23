/* Independent recomputation of every lecture check value (docs/spec/brief-digest.md).
   Constants: k = 8.99e9 (lecture value, per known-error #3), e = 1.602e-19,
   m_e = 9.109e-31. Run: node docs/spec/verify-checks.mjs — exit 1 on any mismatch >1%. */
const k = 8.99e9, e = 1.602e-19, me = 9.109e-31;
let fails = 0;
const chk = (name, got, want, tol = 0.01) => {
  const rel = Math.abs(got - want) / Math.abs(want);
  const ok = rel <= tol;
  if (!ok) fails++;
  console.log(`${ok ? 'OK ' : 'FAIL'} ${name}: got ${got.toExponential(4)} want ${want.toExponential(4)} (rel ${rel.toExponential(2)})`);
};

/* 1 C in electrons */
chk('electrons per coulomb', 1 / e, 6.24e18, 0.005);

/* Coulomb: +1 C, -1 C at 1 km -> 8990 N attractive */
chk('Coulomb 1C@1km', k * 1 * 1 / 1000 ** 2, 8990, 0.002);

/* Collinear superposition: F12 ~ 2.70 N (-x), F13 ~ 8.39 N (+x), net ~ 5.69 N (+x) */
const u = 1e-6;
const F12 = k * 3 * u * 4 * u / 0.20 ** 2;
const F13 = k * 3 * u * 7 * u / 0.15 ** 2;
chk('F12 magnitude', F12, 2.70, 0.005);
chk('F13 magnitude', F13, 8.39, 0.005);
chk('net = F13 - F12 (+x)', F13 - F12, 5.69, 0.005);

/* 2D superposition: q1=+4u at origin; q2=-6u at 0.15 m bearing 73 deg; q3=-5u at 0.10 m on +x.
   Both forces on q1 are attractive: toward 73 deg and toward 0 deg. */
const Fa = k * 4 * u * 6 * u / 0.15 ** 2;
const Fb = k * 4 * u * 5 * u / 0.10 ** 2;
const Fx = Fa * Math.cos(73 * Math.PI / 180) + Fb;
const Fy = Fa * Math.sin(73 * Math.PI / 180);
chk('2D net force', Math.hypot(Fx, Fy), 22.7, 0.01);
chk('2D angle (deg above +x)', Math.atan2(Fy, Fx) * 180 / Math.PI, 24, 0.03);

/* Bohr hydrogen r = 5.29e-11 m (Coulomb pull supplies the CENTRIPETAL force mv^2/r) */
const r = 5.29e-11;
chk('Bohr force', k * e * e / r ** 2, 8.245e-8, 0.002);
chk('Bohr speed', Math.sqrt(k * e * e / (me * r)), 2.188e6, 0.002);

/* Two-charge field: +/-4.00 uC, each 0.700 m from P, lines to the charges at 31.0 deg to the
   x-axis, symmetric about y. E1 = E2 = k|q|/r^2; x-components cancel; y-components add:
   net = 2*E1*sin(31 deg) along +y. */
const E1 = k * 4e-6 / 0.700 ** 2;
chk('E1 = E2', E1, 73388, 0.001);
chk('net E along +y', 2 * E1 * Math.sin(31 * Math.PI / 180), 75595, 0.001);

/* Lecture error #1 corrected value: |q|E = 24e-8 C * 2.0 N/C = 4.8e-7 N (not 4.7e-7) */
chk('slide 21(b) corrected', 24e-8 * 2.0, 4.8e-7, 0.001);

console.log(fails === 0 ? '\nALL LECTURE CHECK VALUES REPRODUCED (<=1%)' : `\n${fails} MISMATCH(ES)`);
process.exit(fails === 0 ? 0 : 1);
