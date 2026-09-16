/**
 * Marca CLAREZA — abertura de lente ("aperture") em forma de C com o ponto
 * observado ao centro. Observatório: a lente abre-se, o mercado fica claro.
 * Usa os tokens de acento — segue Dia/Noite automaticamente.
 */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M26.5 7.2 A13 13 0 1 0 26.5 24.8"
        stroke="var(--accent)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="4" fill="var(--accent-2)" />
    </svg>
  );
}
