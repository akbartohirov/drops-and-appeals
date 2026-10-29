const db = require("./config/db");
const bcrypt = require("bcryptjs");

async function testDatabase() {
  console.log("--- POSTGRESQL DATABASE VERIFICATION TEST ---");

  try {
    // 1. Verify Users Table
    console.log("\n[1/4] Testing users table...");
    const users = await db.queryAll("SELECT id, username, is_admin, created_at FROM users");
    console.log(`Successfully fetched ${users.length} users:`);
    users.forEach(u => {
      const role = (u.is_admin === 1 || u.is_admin === true || u.is_admin === "1") ? "Admin" : "User";
      console.log(`  - User: ${u.username} (ID: ${u.id}, Role: ${role}, Created At: ${u.created_at})`);
    });

    // Verify encryption works
    const admin = await db.queryOne("SELECT password_hash FROM users WHERE username = ?", ["admin"]);
    if (admin) {
      const isMatch = bcrypt.compareSync("admin123", admin.password_hash);
      console.log(`  - Encryption Check: admin password 'admin123' verification ${isMatch ? "PASSED" : "FAILED"}`);
    }

    // 2. Verify Appeals Table
    console.log("\n[2/4] Testing appeals table...");
    const appeals = await db.queryAll("SELECT id, applicant_name, subject, damage_amount FROM appeals LIMIT 10");
    console.log(`Successfully fetched ${appeals.length} appeals:`);
    appeals.forEach(a => {
      console.log(`  - Appeal ID: ${a.id}, Client: ${a.applicant_name}, Subject: ${a.subject}, Loss: ${a.damage_amount} UZS`);
    });

    // 3. Verify Drop Cards Table
    console.log("\n[3/4] Testing drop_cards table...");
    const cards = await db.queryAll("SELECT card_number, blocked_at, balance, comment FROM drop_cards LIMIT 10");
    console.log(`Successfully fetched ${cards.length} blocked cards:`);
    cards.forEach(c => {
      console.log(`  - Card: ${c.card_number}, Blocked At: ${c.blocked_at}, Balance: ${c.balance} UZS, Comment: ${c.comment}`);
    });

    // 4. Verify Fraud Registry Table
    console.log("\n[4/4] Testing fraud_registry table...");
    const frauds = await db.queryAll("SELECT id, fraud_type, victim_name, damage_amount FROM fraud_registry LIMIT 10");
    console.log(`Successfully fetched ${frauds.length} fraud cases:`);
    for (const f of frauds) {
      const attachments = await db.queryAll("SELECT original_name FROM fraud_attachments WHERE fraud_id = ?", [f.id]);
      const filesStr = attachments.map(a => a.original_name).join(", ") || "Fayl yo'q";
      console.log(`  - Fraud Case ID: ${f.id}, Type: ${f.fraud_type}, Victim: ${f.victim_name}, Loss: ${f.damage_amount} UZS, Files: [${filesStr}]`);
    }

    console.log("\n--- POSTGRESQL VERIFICATION TEST COMPLETED: SUCCESS ---");
  } catch (error) {
    console.error("\n!!! VERIFICATION TEST FAILED !!!");
    console.error(error.message);
  } finally {
    await db.pool.end();
  }
}

testDatabase();
