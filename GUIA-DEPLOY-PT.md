# Guia completo — Filipe & Mayika

Este pacote contém o frontend do convite, uma página pública de confirmação, a área administrativa e um Google Apps Script que liga o site ao Google Sheets.

O fluxo não usa ID individual. O PDF do convite terá um único link para `confirmar.html`; cada convidado informa nome, telefone e uma mensagem opcional.

## 1. Criar a planilha

1. Abra https://sheets.google.com e crie uma planilha.
2. Dê-lhe um nome, por exemplo `Noivado Filipe e Mayika`.
3. Renomeie a primeira aba para `Responses`.
4. Na primeira linha, crie estas colunas:

`timestamp | name | phone | note | status`

Não é necessário preencher linhas previamente. Cada confirmação será adicionada automaticamente pelo Apps Script.

## 2. Criar o Google Apps Script

1. Na planilha, abra **Extensões → Apps Script**.
2. Apague o código inicial.
3. Abra `google-apps-script/Code.gs` neste pacote.
4. Copie todo o conteúdo para o editor.
5. Clique em **Guardar**.

## 3. Configurar as propriedades do script

No editor do Apps Script, abra **Definições do projeto → Propriedades do script** e adicione:

- `SPREADSHEET_ID`: o ID da planilha, encontrado na URL entre `/d/` e `/edit`.
- `ADMIN_TOKEN`: uma senha longa e privada, por exemplo `FilipeMayikaAdmin2026!privado`.

## 4. Publicar o Apps Script

1. Clique em **Implementar → Nova implementação**.
2. Selecione **Aplicação Web**.
3. Em **Executar como**, escolha a sua conta.
4. Em **Quem tem acesso**, escolha **Qualquer pessoa**.
5. Clique em **Implementar** e autorize o acesso à planilha.
6. Copie a URL terminada em `/exec`.

O Apps Script aceita:

- `POST <URL>/exec` para gravar uma confirmação;
- `GET <URL>/exec?action=admin&token=...` para a área administrativa.

## 5. Preparar a aplicação

Na raiz do projeto, crie `.env`:

```env
VITE_SHEETS_ENDPOINT=https://script.google.com/macros/s/SEU_ID/exec
```

Depois execute:

```bash
npm install
npm run build
```

Sem essa variável, o site funciona em modo demonstração com localStorage.

## 6. Publicar na Vercel pela interface

1. Entre em https://vercel.com.
2. Clique em **Add New → Project**.
3. Importe o repositório do projeto.
4. Confirme as definições:

```text
Framework: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

5. Em **Environment Variables**, adicione:

```text
Name: VITE_SHEETS_ENDPOINT
Value: URL_DO_APPS_SCRIPT_TERMINADA_EM_EXEC
```

6. Selecione Production, Preview e Development.
7. Clique em **Deploy**.

## 7. Publicar com a Vercel CLI (opcional)

```bash
npm install -g vercel
vercel login
vercel
vercel --prod
```

Também pode configurar a variável pela CLI:

```bash
vercel env add VITE_SHEETS_ENDPOINT production
vercel --prod
```

## 8. Link para inserir no PDF

Depois do deploy, o link a colocar no botão **Confirmar presença** do PDF é:

```text
https://SEU-DOMINIO.vercel.app/confirmar.html
```

O botão do PDF pode ter o texto:

```text
Confirmar presença
```

Não inclua ID, nome, telefone ou token no link.

## 9. Link da administração

A área administrativa fica em:

```text
https://SEU-DOMINIO.vercel.app/admin.html?token=SEU_ADMIN_TOKEN
```

Mantenha este endereço privado. O token é validado no Apps Script e não deve ser colocado no código JavaScript do frontend.

## 10. Teste completo

1. Abra `/confirmar.html`.
2. Preencha nome e telefone.
3. Escreva uma mensagem opcional.
4. Clique em **Confirmar presença**.
5. Confirme se uma nova linha apareceu na aba `Responses`.
6. Abra `/admin.html?token=SEU_ADMIN_TOKEN`.
7. Confirme se a resposta aparece na tabela administrativa.

## 11. Estrutura do projeto

- `index.html`: convite principal.
- `confirmar.html`: destino do link no PDF.
- `admin.html`: área administrativa.
- `src/main.js`: lógica do convite, confirmação e painel.
- `src/styles.css`: design responsivo.
- `src/config.js`: endpoint e data do evento.
- `google-apps-script/Code.gs`: ponte com Google Sheets.
- `vercel.json`: configuração de build da Vercel.

## 12. Alterar a data

A data está configurada como **28/11/2026 às 16h00** em `src/config.js`. Se precisar alterar, edite `EVENT_DATE`, faça novo deploy e gere novamente o PDF caso o domínio também mude.

## 13. Adicionar fotografias do casal

O site já possui uma secção **Memórias a dois** com carrossel automático em fade in/out, setas e indicadores. Para colocar as fotografias, adicione estes ficheiros dentro de `public/gallery/`:

```text
public/gallery/moment-01.jpg
public/gallery/moment-02.jpg
public/gallery/moment-03.jpg
```

O carrossel funciona mesmo antes das fotos serem adicionadas: mostra espaços reservados com o nome de cada ficheiro. Depois de copiar as imagens, execute novamente o build e publique na Vercel.
