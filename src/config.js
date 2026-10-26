export const CONFIG = {
  // Preencha com a URL pública do Google Apps Script quando a planilha estiver pronta.
  // Enquanto estiver vazio, a aplicação usa dados de demonstração e localStorage.
  SHEETS_ENDPOINT: import.meta.env.VITE_SHEETS_ENDPOINT || '',
  EVENT_DATE: '2026-11-28T16:00:00+01:00',
  EVENT_LABEL: '28 de novembro de 2026 · 16h00',
  ADMIN_TOKEN_PARAM: 'token',
};
