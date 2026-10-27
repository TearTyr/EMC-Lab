/* Test helper for tools that are NOT about the intro. The intro plays on every
   bare landing-page load (no seen-flag exists any more), so a script that just
   wants the homepage controls needs to clear it. This calls the same dismiss
   function the Skip button uses, as soon as intro.js has registered it (it is
   a deferred script, so DOMContentLoaded is the earliest safe moment) and before
   the loader finishes, which removes the overlay without ever playing it.
   Usage: await page.addInitScript(skipIntroOnLoad);
   tools/intro-verify.mjs deliberately does NOT use this: it tests the real flow. */
export function skipIntroOnLoad() {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.EMC_INTRO) window.EMC_INTRO.dismiss();
  });
}
