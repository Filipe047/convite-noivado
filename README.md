# Filipe & Mayika — Noivado

Site de confirmação de presença para o noivado de Filipe & Mayika.

- Frontend: Vite + JavaScript.
- Hospedagem: Vercel.
- Dados: Google Sheets através de Google Apps Script.
- Data: 28 de novembro de 2026, às 16h00.
- Link público: `confirmar.html`, inserido no botão Confirmar presença do PDF.
- Galeria: carrossel de momentos em `public/gallery/`.

Leia o passo a passo completo em [GUIA-DEPLOY-PT.md](./GUIA-DEPLOY-PT.md).

O convidado informa nome, telefone e mensagem opcional. O projeto funciona em modo demonstração sem endpoint configurado. Para ligar à planilha, configure `VITE_SHEETS_ENDPOINT` na Vercel.
