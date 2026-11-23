// Local SQLite runner only. Hosted D1 uses Wrangler / Sites migration journals.
import fs from 'node:fs';
function migrateCore(db){db.exec('CREATE TABLE IF NOT EXISTS _local_migrations(name TEXT PRIMARY KEY,applied_at TEXT NOT NULL)');const applied=new Set(db.sqlite.prepare('SELECT name FROM _local_migrations').all().map(r=>r.name));for(const file of fs.readdirSync(new URL('../migrations/',import.meta.url)).filter(f=>/^\d+_[a-z0-9_]+\.sql$/.test(f)).sort()){if(applied.has(file))continue;db.exec('BEGIN IMMEDIATE');try{db.exec(fs.readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));db.sqlite.prepare('INSERT INTO _local_migrations(name,applied_at) VALUES(?,?)').run(file,new Date().toISOString());db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}}}

// Тесты: BAZAR_TEST_NO_MIN_ORDER=1 отключает минимальную сумму (порог 0). Боевые базы этот файл не используют.
export function migrate(db){migrateCore(db);if(process.env.BAZAR_TEST_NO_MIN_ORDER==="1")db.exec("INSERT INTO app_config(key,value) VALUES('min-order-minor','0') ON CONFLICT(key) DO UPDATE SET value='0'");}
