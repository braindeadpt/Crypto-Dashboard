/** Entrada coreografada — uma vez por sessão, nunca a cada navegação. */
export const ENTRY_SESSION_KEY = "clareza-entered";

/**
 * Blocking inline script for <head> — decide antes do primeiro paint se a
 * entrada coreografada corre (`.enter-pending` no <html>). Marcada na
 * sessionStorage: cada separador novo tem direito à entrada uma vez.
 * prefers-reduced-motion salta a marcação — a entrada não corre e não
 * fica "por gastar".
 */
export const entryBootstrapScript = `(function(){try{var k='${ENTRY_SESSION_KEY}';if(!sessionStorage.getItem(k)){if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('enter-pending');}sessionStorage.setItem(k,'1');}}catch(e){}})();`;
