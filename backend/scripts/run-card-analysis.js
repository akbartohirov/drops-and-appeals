const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const cardAnalysisService = require("../services/cardAnalysisService");

async function main() {
  console.log("==================================================");
  console.log("   DROP & SHUBHALI KARTALAR KUNLIK TAHLILI       ");
  console.log("==================================================");

  try {
    const result = await cardAnalysisService.runCardAnalysisPipeline();
    console.log("\n[XULOSA]");
    console.log(`- Operatsion kun: ${result.operDay}`);
    console.log(`- Target kartalar soni: ${result.targetClientsCount.toLocaleString()}`);
    console.log(`- Yuklangan tranzaksiyalar: ${result.totalLoadedTransactions.toLocaleString()}`);
    console.log(`- Shubhali kartalar: ${result.suspectsFound} ta topildi`);
    console.log(`- Umumiy vaqt: ${result.durationSeconds} s`);
    console.log("\nJarayon muvaffaqiyatli tugadi!");
    process.exit(0);
  } catch (err) {
    console.error("\nXatolik yuz berdi:", err);
    process.exit(1);
  }
}

main();

