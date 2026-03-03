const bcrypt = require('bcryptjs');
const { sql, poolPromise } = require('./src/config/database');

async function seed() {
  const pool = await poolPromise;
  console.log('Adatbazis kapcsolodva, teszt adatok feltoltese...\n');

  // ─── FELHASZNÁLÓK ───────────────────────────────────────────────
  const users = [
    { name: 'Nagy Péter',    email: 'nagy.peter@wavealert.com',    password: 'Jelszo123', phone: '+36301234567', address: '1111 Budapest, Fő utca 1.', roles: ['admin', 'coach'] },
    { name: 'Kovács Anna',   email: 'kovacs.anna@wavealert.com',   password: 'Jelszo123', phone: '+36201234568', address: '1021 Budapest, Budai út 5.', roles: ['member'] },
    { name: 'Szabó Dávid',   email: 'szabo.david@wavealert.com',   password: 'Jelszo123', phone: '+36701234569', address: '9700 Szombathely, Kossuth u. 12.', roles: ['member'] },
    { name: 'Kiss Béla',     email: 'kiss.bela@wavealert.com',     password: 'Jelszo123', phone: '+36301234570', address: '1051 Budapest, Nádor u. 3.', roles: ['captain'] },
    { name: 'Tóth Eszter',   email: 'toth.eszter@wavealert.com',   password: 'Jelszo123', phone: '+36201234571', address: '8600 Siófok, Balatoni út 22.', roles: ['member', 'coach'] },
    { name: 'Fekete Gábor',  email: 'fekete.gabor@wavealert.com',  password: 'Jelszo123', phone: '+36701234572', address: '9400 Sopron, Mátyás király u. 8.', roles: ['member'] },
    { name: 'Varga Réka',    email: 'varga.reka@wavealert.com',    password: 'Jelszo123', phone: '+36301234573', address: '8230 Balatonfüred, Arács u. 15.', roles: ['member'] },
  ];

  const userIds = {};
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    const r = await pool.request()
      .input('name',    sql.NVarChar, u.name)
      .input('email',   sql.NVarChar, u.email)
      .input('password',sql.NVarChar, hash)
      .input('phone',   sql.NVarChar, u.phone)
      .input('address', sql.NVarChar, u.address)
      .input('is_member', sql.Bit, 1)
      .query('INSERT INTO users (name,email,password,phone,address,is_member) OUTPUT INSERTED.id VALUES (@name,@email,@password,@phone,@address,@is_member)');
    const id = r.recordset[0].id;
    userIds[u.email] = id;

    for (const roleName of u.roles) {
      await pool.request()
        .input('uid', sql.Int, id)
        .input('rname', sql.NVarChar, roleName)
        .query('INSERT INTO user_roles (user_id, role_id) SELECT @uid, id FROM roles WHERE name=@rname');
    }
    console.log(`  Felhasznalo letrehozva: ${u.name} (id=${id})`);
  }

  // ─── ÜZENETEK ────────────────────────────────────────────────────
  const adminId = userIds['nagy.peter@wavealert.com'];
  const messages = [
    { title: 'Üdvözlet a WaveAlert rendszerben!', content: 'Kedves Tagok! Örömmel tájékoztatunk, hogy az új rendszer sikeresen elindult. Kérjük, töltsétek ki a profilotokat.', status: 'sent' },
    { title: 'Verseny időpontja módosult', content: 'A március 15-i verseny időpontja megváltozott. Az új időpont: március 20., szombat 10:00.', status: 'sent' },
    { title: 'Edzési lehetőség Balatonon', content: 'Április 5-7. között közös edzőtáborozást szervezünk Balatonfüreden. Jelentkezni az eseménynél lehet.', status: 'draft' },
    { title: 'Tagdíj emlékeztető', content: 'Emlékeztetünk, hogy az éves tagdíj befizetési határideje március 31.', status: 'sent' },
  ];

  for (const m of messages) {
    await pool.request()
      .input('title',      sql.NVarChar, m.title)
      .input('content',    sql.NVarChar, m.content)
      .input('status',     sql.NVarChar, m.status)
      .input('created_by', sql.Int, adminId)
      .query('INSERT INTO messages (title,content,status,created_by) VALUES (@title,@content,@status,@created_by)');
  }
  console.log(`  ${messages.length} uzenet letrehozva`);

  // ─── TRANZAKCIÓK ─────────────────────────────────────────────────
  const transactions = [
    { user_id: userIds['kovacs.anna@wavealert.com'],  amount: 25000,  type: 'income',  category: 'tagdij',     desc: 'Éves tagdíj - Kovács Anna' },
    { user_id: userIds['szabo.david@wavealert.com'],  amount: 25000,  type: 'income',  category: 'tagdij',     desc: 'Éves tagdíj - Szabó Dávid' },
    { user_id: userIds['fekete.gabor@wavealert.com'], amount: 25000,  type: 'income',  category: 'tagdij',     desc: 'Éves tagdíj - Fekete Gábor' },
    { user_id: userIds['varga.reka@wavealert.com'],   amount: 25000,  type: 'income',  category: 'tagdij',     desc: 'Éves tagdíj - Varga Réka' },
    { user_id: null,                                  amount: 150000, type: 'expense', category: 'felszereles', desc: 'Vitorla javítás és karbantartás' },
    { user_id: null,                                  amount: 45000,  type: 'expense', category: 'verseny',    desc: 'Nevezési díj - Balaton Kupa 2026' },
    { user_id: userIds['kiss.bela@wavealert.com'],    amount: 25000,  type: 'income',  category: 'tagdij',     desc: 'Éves tagdíj - Kiss Béla' },
    { user_id: null,                                  amount: 80000,  type: 'expense', category: 'egyeb',      desc: 'Kikötői bérleti díj - Q1 2026' },
    { user_id: null,                                  amount: 120000, type: 'income',  category: 'tamogatas',  desc: 'Önkormányzati támogatás 2026' },
  ];

  for (const t of transactions) {
    await pool.request()
      .input('user_id',   sql.Int,           t.user_id)
      .input('amount',    sql.Decimal(10,2),  t.amount)
      .input('type',      sql.NVarChar,       t.type)
      .input('category',  sql.NVarChar,       t.category)
      .input('desc',      sql.NVarChar,       t.desc)
      .query('INSERT INTO transactions (user_id,amount,transaction_type,category,description) VALUES (@user_id,@amount,@type,@category,@desc)');
  }
  console.log(`  ${transactions.length} tranzakcio letrehozva`);

  // ─── CSOPORTOK ───────────────────────────────────────────────────
  const groups = [
    { name: 'A csapat - Laser', members: ['kovacs.anna@wavealert.com', 'szabo.david@wavealert.com', 'fekete.gabor@wavealert.com'] },
    { name: 'B csapat - Optimist', members: ['varga.reka@wavealert.com', 'toth.eszter@wavealert.com'] },
    { name: 'Versenyző csoport', members: ['kiss.bela@wavealert.com', 'kovacs.anna@wavealert.com', 'szabo.david@wavealert.com', 'varga.reka@wavealert.com'] },
  ];

  const groupIds = [];
  for (const g of groups) {
    const r = await pool.request()
      .input('name',       sql.NVarChar, g.name)
      .input('created_by', sql.Int, adminId)
      .query('INSERT INTO groups (name, created_by) OUTPUT INSERTED.id VALUES (@name, @created_by)');
    const gid = r.recordset[0].id;
    groupIds.push(gid);

    for (const email of g.members) {
      await pool.request()
        .input('gid', sql.Int, gid)
        .input('uid', sql.Int, userIds[email])
        .query('INSERT INTO group_members (group_id, user_id) VALUES (@gid, @uid)');
    }
    console.log(`  Csoport letrehozva: ${g.name} (${g.members.length} tag)`);
  }

  // ─── ESEMÉNYEK ───────────────────────────────────────────────────
  const events = [
    {
      title: 'Balaton Kupa 2026',
      description: 'Az éves hagyományos Balaton Kupa verseny. Minden kategóriában lehet nevezni.',
      event_date: '2026-04-15 09:00:00',
      location: 'Balatonfüred Yacht Club',
      event_type: 'verseny',
      participants: ['kovacs.anna@wavealert.com', 'szabo.david@wavealert.com', 'kiss.bela@wavealert.com', 'varga.reka@wavealert.com'],
    },
    {
      title: 'Tavaszi edzőtábor',
      description: '3 napos közös edzőtáborozás Balatonfüreden. Laser és Optimist csónakokkal.',
      event_date: '2026-04-05 08:00:00',
      location: 'Balatonfüred, Magyar Vitorlás Szövetség bázis',
      event_type: 'edzotabor',
      participants: ['kovacs.anna@wavealert.com', 'szabo.david@wavealert.com', 'fekete.gabor@wavealert.com', 'varga.reka@wavealert.com', 'toth.eszter@wavealert.com'],
    },
    {
      title: 'Heti edzés - Laser',
      description: 'Rendszeres heti edzés a Laser csapat számára.',
      event_date: '2026-03-10 16:00:00',
      location: 'Budapest, Lupa-tó',
      event_type: 'edzes',
      participants: ['kovacs.anna@wavealert.com', 'szabo.david@wavealert.com', 'fekete.gabor@wavealert.com'],
    },
    {
      title: 'Éves közgyűlés',
      description: 'Az egyesület éves rendes közgyűlése. Részvétel kötelező minden tag számára.',
      event_date: '2026-03-25 18:00:00',
      location: 'Budapest, Clubhouse',
      event_type: 'kozgyules',
      participants: ['kovacs.anna@wavealert.com', 'szabo.david@wavealert.com', 'kiss.bela@wavealert.com', 'toth.eszter@wavealert.com', 'fekete.gabor@wavealert.com', 'varga.reka@wavealert.com'],
    },
  ];

  for (const e of events) {
    const r = await pool.request()
      .input('title',       sql.NVarChar,  e.title)
      .input('description', sql.NVarChar,  e.description)
      .input('event_date',  sql.DateTime2, new Date(e.event_date))
      .input('location',    sql.NVarChar,  e.location)
      .input('event_type',  sql.NVarChar,  e.event_type)
      .input('created_by',  sql.Int,       adminId)
      .query('INSERT INTO events (title,description,event_date,location,event_type,created_by) OUTPUT INSERTED.id VALUES (@title,@description,@event_date,@location,@event_type,@created_by)');
    const eid = r.recordset[0].id;

    for (const email of e.participants) {
      await pool.request()
        .input('eid', sql.Int, eid)
        .input('uid', sql.Int, userIds[email])
        .query('INSERT INTO event_participants (event_id, user_id, status) VALUES (@eid, @uid, \'confirmed\')');
    }
    console.log(`  Esemeny letrehozva: ${e.title} (${e.participants.length} resztvevo)`);
  }

  // ─── VERSENYJELENTÉSEK ───────────────────────────────────────────
  const r1 = await pool.request()
    .input('race_name',  sql.NVarChar,  'Balaton Kupa 2025')
    .input('race_date',  sql.DateTime2, new Date('2025-09-14'))
    .input('location',   sql.NVarChar,  'Balatonfüred')
    .input('status',     sql.NVarChar,  'published')
    .input('notes',      sql.NVarChar,  'Kiváló időjárás, erős szél 15-20 csomó. 24 induló.')
    .input('created_by', sql.Int,       adminId)
    .query('INSERT INTO race_reports (race_name,race_date,location,status,notes,created_by) OUTPUT INSERTED.id VALUES (@race_name,@race_date,@location,@status,@notes,@created_by)');
  const rid = r1.recordset[0].id;

  const raceParticipants = [
    { email: 'kiss.bela@wavealert.com',    name: 'Kiss Béla',    sail: 'HUN-123', boat: 'Laser', pos: 1 },
    { email: 'kovacs.anna@wavealert.com',  name: 'Kovács Anna',  sail: 'HUN-456', boat: 'Laser', pos: 2 },
    { email: 'szabo.david@wavealert.com',  name: 'Szabó Dávid',  sail: 'HUN-789', boat: 'Laser', pos: 3 },
    { email: 'varga.reka@wavealert.com',   name: 'Varga Réka',   sail: 'HUN-321', boat: 'Laser', pos: 5 },
  ];

  for (const p of raceParticipants) {
    await pool.request()
      .input('rid',   sql.Int,     rid)
      .input('uid',   sql.Int,     userIds[p.email])
      .input('name',  sql.NVarChar, p.name)
      .input('sail',  sql.NVarChar, p.sail)
      .input('boat',  sql.NVarChar, p.boat)
      .input('pos',   sql.Int,     p.pos)
      .query('INSERT INTO race_participants (race_report_id,user_id,name,sail_number,boat_class,position) VALUES (@rid,@uid,@name,@sail,@boat,@pos)');
  }
  console.log(`  Versenyjelentes letrehozva: Balaton Kupa 2025 (${raceParticipants.length} resztvevo)`);

  // ─── DOKUMENTUMOK ────────────────────────────────────────────────
  const docs = [
    { title: 'Alapszabály 2025', description: 'Az egyesület hatályos alapszabálya', file_path: 'uploads/docs/alapszabaly_2025.pdf', category: 'szabalyzat' },
    { title: 'Tagdíj szabályzat', description: 'Tagdíjak és fizetési feltételek', file_path: 'uploads/docs/tagdij_szabalyzat.pdf', category: 'szabalyzat' },
    { title: 'Biztonsági előírások', description: 'Vízre szállás előtt kötelező elolvasni', file_path: 'uploads/docs/biztonsagi_eloirasok.pdf', category: 'biztonsag' },
    { title: 'Balaton Kupa 2025 - Eredmények', description: 'Hivatalos versenyeredmények', file_path: 'uploads/docs/balaton_kupa_2025_eredmenyek.pdf', category: 'verseny' },
  ];

  for (const d of docs) {
    await pool.request()
      .input('title',       sql.NVarChar, d.title)
      .input('description', sql.NVarChar, d.description)
      .input('file_path',   sql.NVarChar, d.file_path)
      .input('category',    sql.NVarChar, d.category)
      .input('uploaded_by', sql.Int,      adminId)
      .query('INSERT INTO documents (title,description,file_path,category,uploaded_by) VALUES (@title,@description,@file_path,@category,@uploaded_by)');
  }
  console.log(`  ${docs.length} dokumentum letrehozva`);

  console.log('\n✓ Teszt adatok sikeresen feltoltve!');
  console.log('\nBejelentkezesi adatok (jelszo: Jelszo123):');
  console.log('  Admin:   nagy.peter@wavealert.com');
  console.log('  Kapitany: kiss.bela@wavealert.com');
  console.log('  Tag:     kovacs.anna@wavealert.com');
  process.exit(0);
}

seed().catch(err => {
  console.error('Hiba:', err.message);
  process.exit(1);
});
