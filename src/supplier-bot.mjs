// Owner 29.10: suppliers work only in their Telegram group, never on the site. Whoever presses a button in a group the owner
// connected for a supplier gets a bot-only account: SUPPLIER of that group's vendor, linked to the Telegram user, with no
// password that could ever log in. The group is the trust boundary the owner chose; revoking such a person in the cabinet
// switches the account off for good (they are not re-created), and the owner should also remove them from the group.
import {q}from './commerce.mjs';import {staffUser}from './couriers.mjs';import {uuid,now}from './security.mjs';
export const botDomain='@telegram.bazar.invalid';
export const botOnly=user=>!!user?.email?.endsWith(botDomain);
export async function supplierBotUser(db,link,from){if(link?.kind!=='SUPPLIER'||!from||from.is_bot)return null;const tg=String(from.id);
 let i=await q(db,'SELECT user_id FROM tg_identities WHERE telegram_user=?',tg).first();
 if(!i){const id=uuid(),name=([from.first_name,from.last_name].filter(Boolean).join(' ')||from.username||'Telegram').slice(0,100);
  await db.batch([q(db,"INSERT INTO users(id,email,name,hash,salt,owner) VALUES(?,?,?,'TELEGRAM-ONLY','-',0)",id,'tg-'+tg+botDomain,name),
   q(db,'INSERT INTO tg_identities(telegram_user,user_id,chat_id,linked_at) VALUES(?,?,?,?)',tg,id,link.chat_id,now()),
   q(db,"INSERT INTO memberships(user_id,vendor_id,role) VALUES(?,?,'SUPPLIER')",id,link.ref_id)]);return staffUser(db,id)}
 const user=await staffUser(db,i.user_id);
 // A bot-only person who presses in another supplier's group serves that supplier too; a real site account is never widened.
 if(botOnly(user)&&!user.memberships.some(m=>m.vendor_id===link.ref_id)){await q(db,"INSERT INTO memberships(user_id,vendor_id,role) VALUES(?,?,'SUPPLIER') ON CONFLICT DO NOTHING",user.id,link.ref_id).run();return staffUser(db,user.id)}
 return user}
