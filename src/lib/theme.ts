/** Theme bootstrap — shared by server layout script and client toggle. */
export const THEME_STORAGE_KEY = "clareza-theme";

/**
 * Blocking inline script for <head> — prevents FOUC.
 * Order: localStorage override → Papel (light).
 *
 * Papel is the signature theme and the default: CLAREZA is an editorial
 * observatory, and paper is where the publication voice lives. Noite stays
 * one click away as the instrument theme.
 */
export const themeBootstrapScript = `(function(){try{var k='${THEME_STORAGE_KEY}';var t=localStorage.getItem(k);if(t!=='light'&&t!=='dark'){t='light';}document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme=t;}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;
