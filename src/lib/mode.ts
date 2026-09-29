/**
 * The one-way door between the two modes.
 *
 * Cinematic (/) can hand a visitor to Professional (/professional), never the
 * reverse. The lock is enforced in four independent layers so no single path
 * (a link, the back button, bfcache, or typing "/" by hand) can bypass it:
 *
 *   1. The professional route renders no link, logo or control that leads to "/".
 *   2. Entering professional uses location.replace(), so the cinematic entry is
 *      removed from session history and Back cannot return to it.
 *   3. src/proxy.ts sets a lock cookie on /professional and redirects any later
 *      request for "/" back to /professional on the server.
 *   4. The cinematic layout carries an inline pre-paint guard plus a pageshow
 *      listener, which catch client-side restores (bfcache, stale tabs).
 */
export const MODE_COOKIE = "sv_mode";
export const MODE_LOCKED = "professional";
export const PROFESSIONAL_PATH = "/professional";

/** Inline script for the cinematic <head>: runs before first paint. */
export const cinematicGuardScript = `(function(){try{var l=function(){if(document.cookie.split('; ').indexOf('${MODE_COOKIE}=${MODE_LOCKED}')>-1){document.documentElement.style.visibility='hidden';location.replace('${PROFESSIONAL_PATH}');return true}return false};if(l())return;window.addEventListener('pageshow',function(e){l()});}catch(e){}})();`;

export function lockToProfessional() {
  document.cookie = `${MODE_COOKIE}=${MODE_LOCKED}; path=/; SameSite=Lax`;
}

/** Leave cinematic for good: lock, then replace the history entry. */
export function goProfessional() {
  lockToProfessional();
  window.location.replace(PROFESSIONAL_PATH);
}
