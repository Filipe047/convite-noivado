const SHEET_NAME = 'Responses';
const ADMIN_TOKEN_PROPERTY = 'ADMIN_TOKEN';
const SPREADSHEET_ID_PROPERTY = 'SPREADSHEET_ID';

function jsonOutput(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function getConfig() {
  const properties = PropertiesService.getScriptProperties();
  const spreadsheetId = properties.getProperty(SPREADSHEET_ID_PROPERTY);
  if (!spreadsheetId) throw new Error('SPREADSHEET_ID não configurado.');
  return {
    spreadsheet: SpreadsheetApp.openById(spreadsheetId),
    adminToken: properties.getProperty(ADMIN_TOKEN_PROPERTY) || '',
  };
}

function getSheet() {
  const sheet = getConfig().spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`A aba ${SHEET_NAME} não existe.`);
  return sheet;
}

function readResponses() {
  const values = getSheet().getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(String);
  return values.slice(1).filter(row => row.some(cell => String(cell).trim() !== '')).map(row => {
    const item = {};
    headers.forEach((header, index) => { item[header] = row[index] ?? ''; });
    return item;
  });
}

function publicResponse(item) {
  return {
    timestamp: item.timestamp instanceof Date ? item.timestamp.toISOString() : String(item.timestamp || ''),
    name: String(item.name || ''),
    phone: String(item.phone || ''),
    note: String(item.note || ''),
    status: String(item.status || 'confirmed'),
  };
}

function doGet(event) {
  try {
    const action = String(event.parameter.action || '');
    if (action === 'admin') {
      const config = getConfig();
      if (!event.parameter.token || event.parameter.token !== config.adminToken) {
        return jsonOutput({ ok: false, error: 'Token administrativo inválido.' });
      }
      return jsonOutput({ ok: true, guests: readResponses().map(publicResponse) });
    }
    return jsonOutput({ ok: false, error: 'Ação inválida.' });
  } catch (error) {
    return jsonOutput({ ok: false, error: error.message });
  }
}

function doPost(event) {
  try {
    const body = JSON.parse(event.postData.contents || '{}');
    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();
    const note = String(body.note || '').trim().slice(0, 500);
    if (!name || !phone) return jsonOutput({ ok: false, error: 'Nome e telefone são obrigatórios.' });

    const sheet = getSheet();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
    const values = {
      timestamp: new Date(),
      name,
      phone,
      note,
      status: 'confirmed',
    };
    const targetRow = sheet.getLastRow() + 1;
    headers.forEach((header, index) => {
      if (Object.prototype.hasOwnProperty.call(values, header)) sheet.getRange(targetRow, index + 1).setValue(values[header]);
    });
    return jsonOutput({ ok: true, guest: publicResponse(values) });
  } catch (error) {
    return jsonOutput({ ok: false, error: error.message });
  }
}
