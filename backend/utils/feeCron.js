const FeeLedger = require("../models/FeeLedger");

/**
 * processMonthlyFees
 * Checks all fee ledgers. If 30 days have elapsed since `lastBillingDate`,
 * adds `monthlyFeeAmount` to `totalFee` and `amountDue`, and updates `lastBillingDate`.
 */
const processMonthlyFees = async () => {
  try {
    console.log("[CRON] Starting monthly fee processing...");
    
    // Find all ledgers where monthlyFeeAmount > 0
    const ledgers = await FeeLedger.find({ monthlyFeeAmount: { $gt: 0 } });
    
    const now = new Date();
    let processedCount = 0;

    for (const ledger of ledgers) {
      if (!ledger.lastBillingDate) {
        ledger.lastBillingDate = now;
        await ledger.save();
        continue;
      }

      // Calculate days difference
      const msDiff = now.getTime() - ledger.lastBillingDate.getTime();
      const daysDiff = msDiff / (1000 * 3600 * 24);

      if (daysDiff >= 30) {
        const feeToAdd = ledger.monthlyFeeAmount;
        
        ledger.totalFee += feeToAdd;
        ledger.amountDue += feeToAdd;
        ledger.lastBillingDate = now;
        
        await ledger.save();
        processedCount++;
      }
    }

    console.log(`[CRON] Monthly fee processing complete. Billed ${processedCount} student(s).`);
  } catch (error) {
    console.error("[CRON] Error processing monthly fees:", error.message);
  }
};

module.exports = { processMonthlyFees };
