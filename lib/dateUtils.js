/**
 * Utilitários de data para o fuso horário de Portugal Continental.
 *
 * Europe/Lisbon — IANA timezone database
 *   Inverno: UTC+0 (WET)
 *   Verão:   UTC+1 (WEST) — transição automática via IANA, sem hardcode de offset
 *
 * Para datas correctas no servidor/cliente independente do TZ do sistema.
 */

export const TZ_PT = "Europe/Lisbon";

/**
 * Devolve "YYYY-MM-DD" no fuso de Portugal para qualquer Date.
 * Usa Intl (en-CA formata naturalmente em ISO), garante DST correcto.
 */
export function toYMD(date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ_PT }).format(date);
}

/**
 * Devolve a data de hoje como "YYYY-MM-DD" em hora de Portugal.
 */
export function todayPT() {
  return toYMD(new Date());
}

/**
 * Devolve um objecto Date representando a meia-noite local de Portugal
 * para a string "YYYY-MM-DD" fornecida.
 */
export function parseYMD(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/**
 * Formata hora actual em Portugal: "HH:MM".
 */
export function nowTimePT() {
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: TZ_PT,
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date());
}
