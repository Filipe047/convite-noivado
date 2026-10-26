# Arquitetura — Filipe & Mayika

## Fluxo final

O convite é entregue em PDF. Dentro do PDF existe um único botão/link **Confirmar presença**, apontando para `https://SEU-DOMINIO.vercel.app/confirmar.html`. O convidado não recebe ID individual e não precisa abrir uma página personalizada.

Ao abrir o link, o convidado preenche apenas:

- Nome completo;
- Telefone;
- Mensagem opcional.

Cada envio representa uma confirmação de presença e é acrescentado como uma nova linha no Google Sheets.

## Componentes

O frontend é uma aplicação Vite estática publicada na Vercel. `index.html` apresenta o convite, `confirmar.html` é o destino indicado no PDF e `admin.html` mostra as respostas no painel reservado.

O Google Apps Script funciona como ponte entre o browser e a planilha. O cliente conhece apenas a URL pública `/exec` do script; credenciais Google e o ID da planilha ficam no Apps Script, não no JavaScript do site.

## Google Sheets

Use uma aba chamada `Responses` com as colunas exatamente nesta ordem ou com estes nomes:

`timestamp | name | phone | note | status`

O Apps Script grava automaticamente `timestamp` e `status=confirmed`. Não há coluna `id`.

## Contrato HTTP

O formulário envia `POST <endpoint>` com JSON:

```json
{ "name": "Maria Manuel", "phone": "+244 923 000 000", "note": "Com alegria!" }
```

A resposta esperada é:

```json
{ "ok": true, "guest": { "timestamp": "...", "name": "Maria Manuel", "phone": "+244 923 000 000", "note": "Com alegria!", "status": "confirmed" } }
```

O painel usa `GET <endpoint>?action=admin&token=...`. O Apps Script valida o token administrativo e devolve as respostas.

## Segurança

O token administrativo não deve ser colocado em variáveis `VITE_` nem no código do frontend. A proteção efetiva é feita no Apps Script através da propriedade `ADMIN_TOKEN`. O link da administração deve ser mantido privado.

## Demonstração local

Sem `VITE_SHEETS_ENDPOINT`, o site usa localStorage para simular confirmações. Isso permite testar o layout antes da configuração do Apps Script.
