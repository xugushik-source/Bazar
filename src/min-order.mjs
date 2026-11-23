// Минимальная сумма товаров (владелец): 25 ₾ для всех заказов и программ — в городе, в сёлах и в «1 Городке», обычные и программы.
// Сумма считается по товарам, без доставки. Порог хранится в app_config['min-order-minor'] (тетри); без строки — 2500.
// В тестах порог выключается переменной BAZAR_TEST_NO_MIN_ORDER=1 (см. tools/migrate.mjs); отдельные тесты включают его явно.
import {fail} from './security.mjs';

export const MIN_ORDER_MINOR=2500;

export async function minimumMinor(db){
  try{
    const v=(await db.prepare("SELECT value FROM app_config WHERE key='min-order-minor'").first())?.value;
    const n=Number(v);
    return v===undefined||v===null?MIN_ORDER_MINOR:(Number.isSafeInteger(n)&&n>=0?n:MIN_ORDER_MINOR);
  }catch{return MIN_ORDER_MINOR}
}

export async function assertMinimum(db,goodsMinor){
  const min=await minimumMinor(db);
  if(!Number.isSafeInteger(goodsMinor)||goodsMinor<min)fail('MIN_ORDER',409);
}
