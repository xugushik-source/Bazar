// Режим остатков. DAILY — товар продаётся, пока поставщик не закрыл его на день («нет сегодня», day_closures).
// LIMITED — прежний режим: заказ не проходит, если stock − reserved меньше нужного.
// Без строки в app_config действует LIMITED, чтобы старое поведение не менялось без явного решения.
export async function stockLimited(db){
  try{
    const v=(await db.prepare("SELECT value FROM app_config WHERE key='stock-mode'").first())?.value;
    return v!=='DAILY';
  }catch{return true}
}
