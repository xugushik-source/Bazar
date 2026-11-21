// Копия заказов в Google Таблицы. D1 — основное хранилище; таблица — резервная копия, которую можно открыть и восстановить.
//
// Настройка (секреты Cloudflare, в репозиторий не кладутся):
//  • GOOGLE_SHEETS_ID — id таблицы;
//  • GOOGLE_SERVICE_ACCOUNT_JSON — JSON ключа сервисного аккаунта; таблица должна быть открыта этому аккаунту на редактирование;
//  • GOOGLE_SHEET_NAME — имя листа (по умолчанию «Заказы»).
//
// Правила:
//  • Без настроек ничего не отправляется и ничего не помечается успешным.
//  • Строка на заказ: номер строки запоминается; изменение заказа (version) обновляет ту же строку, дублей нет.
//  • Если запрос на добавление строки пропал без ответа, строка в таблице могла появиться. Такой случай не повторяется
//    автоматически (status ERROR, last_error APPEND_UNKNOWN): оператор проверяет таблицу.
import {q,parse} from './commerce.mjs';

export const SHEET_COLUMNS=['Номер заказа','Создан','День доставки','Время','Статус','Оплата','Способ','Программа','Получатель','Телефон','Адрес','Товары','Сумма товаров (тетри)','Доставка (тетри)','Итого (тетри)','Оплачено (тетри)','Версия','Обновлено'];
const LAST_COL='R';
const MAX_ATTEMPTS=10;
// Без Buffer: в Workers его нет без nodejs_compat. Только btoa/atob и TextEncoder.
const b64url=bytes=>{let s='';for(const b of new Uint8Array(bytes))s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
const b64urlText=text=>b64url(new TextEncoder().encode(text));

export function configured(env){return !!env.GOOGLE_SHEETS_ID&&!!env.GOOGLE_SERVICE_ACCOUNT_JSON}

// ---------- доступ к Google (только запросы через переданный fetch; в тестах подменяется) ----------
async function signedAssertion(sa,at){
  const header=b64urlText(JSON.stringify({alg:'RS256',typ:'JWT'}));
  const now=Math.floor(at.getTime()/1000);
  const payload=b64urlText(JSON.stringify({iss:sa.client_email,scope:'https://www.googleapis.com/auth/spreadsheets',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600}));
  const input=`${header}.${payload}`;
  const pemBody=String(sa.private_key).replace(/-----[^-]+-----/g,'').replace(/\s+/g,'');
  const der=Uint8Array.from(atob(pemBody),c=>c.charCodeAt(0));
  const key=await crypto.subtle.importKey('pkcs8',der,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
  const sig=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(input));
  return `${input}.${b64url(sig)}`;
}

export class SheetsClient{
  constructor({spreadsheetId,serviceAccount,sheetName='Заказы',fetchImpl=fetch,at=()=>new Date()}){
    this.id=spreadsheetId;this.sa=serviceAccount;this.sheet=sheetName;this.fetch=fetchImpl;this.at=at;this.token=null;
  }
  async accessToken(){
    if(this.token)return this.token;
    const jwt=await signedAssertion(this.sa,this.at());
    const r=await this.fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:jwt})});
    if(!r.ok)throw Object.assign(new Error('SHEETS_AUTH_'+r.status),{ambiguous:false});
    this.token=(await r.json()).access_token;
    return this.token;
  }
  // ambiguous: сеть или 5xx/429 — запрос мог выполниться. 4xx (кроме 429) — точно не выполнен.
  async call(method,url,body){
    const headers={Authorization:'Bearer '+await this.accessToken(),'Content-Type':'application/json'};
    let r;
    try{r=await this.fetch(url,{method,headers,body:body===undefined?undefined:JSON.stringify(body)})}
    catch{throw Object.assign(new Error('SHEETS_TRANSPORT'),{ambiguous:true})}
    if(!r.ok)throw Object.assign(new Error('SHEETS_'+r.status),{ambiguous:r.status>=500||r.status===429});
    return r.json();
  }
  base(){return `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(this.id)}/values/`}
  async append(values){
    const range=encodeURIComponent(`${this.sheet}!A:${LAST_COL}`);
    const r=await this.call('POST',`${this.base()}${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,{values:[values]});
    const m=/!\$?[A-Z]+\$?(\d+)/.exec(r?.updates?.updatedRange||'');
    if(!m)throw Object.assign(new Error('SHEETS_NO_ROW'),{ambiguous:true});
    return Number(m[1]);
  }
  async update(rowNo,values){
    const range=encodeURIComponent(`${this.sheet}!A${rowNo}:${LAST_COL}${rowNo}`);
    await this.call('PUT',`${this.base()}${range}?valueInputOption=RAW`,{values:[values]});
  }
  async header(){
    const range=encodeURIComponent(`${this.sheet}!A1:${LAST_COL}1`);
    await this.call('PUT',`${this.base()}${range}?valueInputOption=RAW`,{values:[SHEET_COLUMNS]});
  }
}

// ---------- строка таблицы ----------
const qtyOf=quote=>{const x=parse(quote,{});return Number.isInteger(x.target_g)?`${x.target_g} г`:Number.isInteger(x.count)?`${x.count} шт`:'1 шт'};
export async function rowFor(db,o){
  const lines=(await db.prepare("SELECT l.quote,p.names FROM order_lines l JOIN products p ON p.id=l.product_id WHERE l.order_id=? ORDER BY l.line_id").bind(o.id).all()).results;
  const items=lines.map(l=>`${parse(l.names,{}).ru||''} — ${qtyOf(l.quote)}`).join('; ');
  const cu=parse(o.customer,{});
  const day=o.day,time=`${String(Math.floor(o.minute/60)).padStart(2,'0')}:${String(o.minute%60).padStart(2,'0')}`;
  return [o.id,o.created_at,day,time,o.status,o.payment,o.fulfillment==='delivery'?'Доставка':'Самовывоз',o.program_id||'',cu.name||'',cu.phone||'',cu.address||'',items,o.items_total,o.delivery_fee,o.total,o.paid,o.version,o.updated_at];
}

// ---------- синхронизация ----------
// Заказы, которых нет в таблице или версия которых изменилась. Строки с неизвестным исходом не выбираются.
const CANDIDATES=`SELECT o.*,d.program_id FROM orders o
  LEFT JOIN sheet_sync s ON s.order_id=o.id
  LEFT JOIN subscription_deliveries d ON d.order_id=o.id
  WHERE (s.order_id IS NULL OR (s.synced_version<>o.version AND s.attempts<?
     AND NOT (s.status='ERROR' AND s.last_error='APPEND_UNKNOWN')))
  ORDER BY o.created_at LIMIT ?`;

export async function syncOrders(db,client,{limit=50}={}){
  const report={synced:0,errors:0,unknown:0};
  if(!(await db.prepare("SELECT value FROM app_config WHERE key='sheet-header-v1'").first())){
    await client.header();
    await q(db,"INSERT INTO app_config(key,value) VALUES('sheet-header-v1','1') ON CONFLICT DO NOTHING").run();
  }
  const rows=(await db.prepare(CANDIDATES).bind(MAX_ATTEMPTS,limit).all()).results;
  for(const o of rows){
    const cur=await db.prepare('SELECT * FROM sheet_sync WHERE order_id=?').bind(o.id).first();
    const values=await rowFor(db,o);
    try{
      let rowNo=cur?.row_no;
      if(rowNo)await client.update(rowNo,values);
      else rowNo=await client.append(values);
      await q(db,`INSERT INTO sheet_sync(order_id,synced_version,row_no,status,attempts,last_error,synced_at) VALUES(?,?,?,'SYNCED',0,NULL,?)
        ON CONFLICT(order_id) DO UPDATE SET synced_version=excluded.synced_version,row_no=excluded.row_no,status='SYNCED',attempts=0,last_error=NULL,synced_at=excluded.synced_at`,
        o.id,o.version,rowNo,new Date().toISOString()).run();
      report.synced++;
    }catch(e){
      const unknown=!!e.ambiguous&&!cur?.row_no;
      await q(db,`INSERT INTO sheet_sync(order_id,synced_version,status,attempts,last_error) VALUES(?,-1,'ERROR',1,?)
        ON CONFLICT(order_id) DO UPDATE SET status='ERROR',attempts=attempts+1,last_error=excluded.last_error`,
        o.id,unknown?'APPEND_UNKNOWN':String(e.message||'SHEETS_ERROR')).run();
      report.errors++;if(unknown)report.unknown++;
    }
  }
  return report;
}

// Состояние копии для владельца: сколько заказов в таблице, сколько ждут, сколько с ошибкой.
export async function syncStatus(db,env){
  if(!configured(env))return {configured:false,message:'Google Таблицы не подключены: нужны GOOGLE_SHEETS_ID и GOOGLE_SERVICE_ACCOUNT_JSON.'};
  const pending=(await db.prepare(`SELECT COUNT(*) n FROM orders o LEFT JOIN sheet_sync s ON s.order_id=o.id WHERE s.order_id IS NULL OR s.synced_version<>o.version`).first()).n;
  const errors=(await db.prepare("SELECT order_id,last_error,attempts FROM sheet_sync WHERE status='ERROR' ORDER BY order_id LIMIT 100").all()).results;
  const synced=(await db.prepare("SELECT COUNT(*) n FROM sheet_sync WHERE status='SYNCED'").first()).n;
  return {configured:true,synced,pending,errors};
}

// Один запуск по cron. Без настроек — выход без записей.
export async function runSheetSync(env,{fetchImpl=fetch,at=new Date()}={}){
  if(!configured(env))return {configured:false};
  const client=new SheetsClient({spreadsheetId:env.GOOGLE_SHEETS_ID,serviceAccount:JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON),sheetName:env.GOOGLE_SHEET_NAME||'Заказы',fetchImpl,at:()=>at});
  return {configured:true,...await syncOrders(env.DB,client)};
}
