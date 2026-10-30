const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const clearingSyncService = require("../services/clearingSyncService");

async function main() {
  console.log("=== HUMO CLEARING ETL SINXRONIZATSIYASI BOSHLANDI ===");
  try {
    const result = await clearingSyncService.syncPendingClearingFiles();
    console.log("\n=== NATIJA ===");
    console.log(JSON.stringify(result, null, 2));

    const status = await clearingSyncService.getSyncStatus();
    console.log("\n=== POSTGRESQL 'humo_clearing_p2p' BAZASI HOLATI ===");
    console.log(`humo2humo jami qatorlar: ${status.totalHumo2HumoRows}`);
    console.log(`uzcard2humo jami qatorlar: ${status.totalUzcard2HumoRows}`);
    console.log("\nOxirgi yuklangan fayllar:");
    console.table(status.recentFiles);

  } catch (err) {
    console.error("Xatolik yuz berdi:", err);
  } finally {
    process.exit(0);
  }
}

main();

