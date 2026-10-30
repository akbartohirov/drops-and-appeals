/**
 * Antifraud System Core Rules and Calculation Utilities
 */

import { AppealItem, DropCardItem, FraudCaseItem, HumoClearingFile, DwhDropperProfile } from '../types/antifraud';

/**
 * Formats a numeric value into Uzbek So'm (UZS) with space separators
 */
export function formatUzs(amount: number, showCurrency = true): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return showCurrency ? "0 so'm" : "0";
  }
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return showCurrency ? `${formatted} so'm` : formatted;
}

/**
 * Masks a 16-digit card number safely for UI preview
 */
export function maskCardNumber(cardNumber: string): string {
  const clean = cardNumber.replace(/\s+/g, '');
  if (clean.length < 16) return cardNumber;
  return `${clean.substring(0, 4)} ${clean.substring(4, 6)}** **** ${clean.substring(12, 16)}`;
}

/**
 * Computes drop card summary statistics:
 * Total cards count, total sum, current month cards count, current month sum
 */
export function calculateDropCardStats(cards: DropCardItem[]): {
  totalCount: number;
  totalTurnover: number;
  currentMonthCount: number;
  currentMonthTurnover: number;
  criticalRiskCount: number;
} {
  return cards.reduce(
    (acc, card) => {
      acc.totalCount += 1;
      acc.totalTurnover += card.totalTurnover;
      if (card.isCurrentMonth) {
        acc.currentMonthCount += 1;
        acc.currentMonthTurnover += card.totalTurnover;
      }
      if (card.riskLevel === 'Kritik') {
        acc.criticalRiskCount += 1;
      }
      return acc;
    },
    {
      totalCount: 0,
      totalTurnover: 0,
      currentMonthCount: 0,
      currentMonthTurnover: 0,
      criticalRiskCount: 0,
    }
  );
}

/**
 * Computes appeals summary statistics:
 * 1. Barcha murojaatlar (soni)
 * 2. Joriy oydagi ko'rsatkichlar (soni)
 * 3. Umumiy zarar summasi (UZS)
 * 4. Joriy oydagi zarar summasi (UZS)
 */
export function calculateAppealStats(appeals: AppealItem[]): {
  totalCount: number;
  currentMonthCount: number;
  totalDamage: number;
  currentMonthDamage: number;
  totalAmount: number; // backward compatibility
  newCount: number;
  underReviewCount: number;
  resolvedCount: number;
  rejectedCount: number;
} {
  return appeals.reduce(
    (acc, item) => {
      const damage = item.damageAmount ?? item.amount ?? 0;
      acc.totalCount += 1;
      acc.totalDamage += damage;
      acc.totalAmount += damage;

      if (item.isCurrentMonth) {
        acc.currentMonthCount += 1;
        acc.currentMonthDamage += damage;
      }

      if (item.status === 'Yangi') acc.newCount += 1;
      if (item.status === 'Tekshiruvda') acc.underReviewCount += 1;
      if (item.status === 'Ijobiy hal qilindi') acc.resolvedCount += 1;
      if (item.status === 'Rad etildi') acc.rejectedCount += 1;
      return acc;
    },
    {
      totalCount: 0,
      currentMonthCount: 0,
      totalDamage: 0,
      currentMonthDamage: 0,
      totalAmount: 0,
      newCount: 0,
      underReviewCount: 0,
      resolvedCount: 0,
      rejectedCount: 0,
    }
  );
}

/**
 * Computes fraud cases summary statistics:
 * 1. Jami holatlar
 * 2. Jami zarar
 * 3. Joriy oydagi holatlar
 * 4. Joriy oydagi zarar
 */
export function calculateFraudStats(cases: FraudCaseItem[]): {
  totalCases: number;
  totalDamage: number;
  currentMonthCases: number;
  currentMonthDamage: number;
  totalBlocked: number;
  totalFiles: number;
  activeInvestigations: number;
} {
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  return cases.reduce(
    (acc, item) => {
      const damage = Number(item.totalDamage) || 0;
      acc.totalCases += 1;
      acc.totalDamage += damage;
      acc.totalBlocked += Number(item.blockedAmount) || 0;
      acc.totalFiles += item.attachedFiles?.length || 0;

      const dateStr = item.detectedDate ? String(item.detectedDate).slice(0, 7) : '';
      if (dateStr === currentMonthStr) {
        acc.currentMonthCases += 1;
        acc.currentMonthDamage += damage;
      }

      if (item.status === 'Ochiq' || item.status === 'Tergovda') {
        acc.activeInvestigations += 1;
      }
      return acc;
    },
    {
      totalCases: 0,
      totalDamage: 0,
      currentMonthCases: 0,
      currentMonthDamage: 0,
      totalBlocked: 0,
      totalFiles: 0,
      activeInvestigations: 0,
    }
  );
}

/**
 * Computes Humo clearing processing statistics
 */
export function calculateClearingStats(files: HumoClearingFile[]): {
  totalFiles: number;
  totalVolumeUzs: number;
  totalAnomaliesCount: number;
  totalFlaggedVolumeUzs: number;
  totalDetectedDropsCount: number;
} {
  return files.reduce(
    (acc, file) => {
      acc.totalFiles += 1;
      acc.totalVolumeUzs += file.totalVolumeUzs;
      acc.totalAnomaliesCount += file.flaggedAnomaliesCount;
      acc.totalFlaggedVolumeUzs += file.flaggedVolumeUzs;
      acc.totalDetectedDropsCount += file.detectedDropCardsCount;
      return acc;
    },
    {
      totalFiles: 0,
      totalVolumeUzs: 0,
      totalAnomaliesCount: 0,
      totalFlaggedVolumeUzs: 0,
      totalDetectedDropsCount: 0,
    }
  );
}

/**
 * Evaluates dropper risk score based on DWH signals
 */
export function computeDropperRiskScore(profile: {
  holdingTimeSeconds: number;
  inOutRatio: number;
  velocityPerMinute: number;
  associatedCardsCount: number;
}): number {
  let score = 20;

  // Ultra-short holding time is prime drop hallmark (< 120s)
  if (profile.holdingTimeSeconds <= 60) {
    score += 35;
  } else if (profile.holdingTimeSeconds <= 180) {
    score += 25;
  } else if (profile.holdingTimeSeconds <= 600) {
    score += 10;
  }

  // In/Out ratio close to 1.0 (transit account without savings)
  if (profile.inOutRatio >= 0.95 && profile.inOutRatio <= 1.05) {
    score += 25;
  } else if (profile.inOutRatio >= 0.85) {
    score += 15;
  }

  // Velocity of P2P transfers
  if (profile.velocityPerMinute >= 4) {
    score += 20;
  } else if (profile.velocityPerMinute >= 2) {
    score += 10;
  }

  // Multiple associated cards registered to single PINFL
  if (profile.associatedCardsCount >= 5) {
    score += 20;
  } else if (profile.associatedCardsCount >= 3) {
    score += 10;
  }

  return Math.min(100, Math.max(0, score));
}
