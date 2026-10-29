import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatUzs,
  maskCardNumber,
  calculateDropCardStats,
  calculateAppealStats,
  calculateFraudStats,
  calculateClearingStats,
  computeDropperRiskScore,
} from './rules';
import { DropCardItem, AppealItem, FraudCaseItem, HumoClearingFile } from '../types/antifraud';

test('formatUzs correctly formats currency with spaces and currency label', () => {
  assert.equal(formatUzs(48500000), "48 500 000 so'm");
  assert.equal(formatUzs(1250000, false), '1 250 000');
  assert.equal(formatUzs(0), "0 so'm");
});

test('maskCardNumber properly obfuscates middle 8 digits', () => {
  const masked = maskCardNumber('9860120199482319');
  assert.equal(masked, '9860 12** **** 2319');
});

test('calculateDropCardStats correctly tallies total and current month cards and turnover', () => {
  const sampleCards: DropCardItem[] = [
    {
      id: '1',
      cardNumber: '9860123412341234',
      maskedCardNumber: '9860 12** **** 1234',
      cardHolder: 'Aliyev Vali',
      holderPinfl: '31234567890012',
      bankName: 'Kapitalbank',
      cardSystem: 'Humo',
      blockedDate: '2026-10-20',
      balanceAmount: 12000000,
      totalTurnover: 50000000,
      transactionCount: 42,
      blockingReason: 'Test blokirovka',
      blockedBy: 'B. Mirzayev',
      createdAtTime: '2026-10-20 10:00:00',
      updatedAtTime: '2026-10-20 11:00:00',
      dropPatternType: 'Tranzit tranzaksiya (Pilesos)',
      riskScore: 95,
      riskLevel: 'Kritik',
      status: 'Bloklangan',
      isCurrentMonth: true,
      dwhAccount: '20208000123456789001',
      notes: 'Test',
    },
    {
      id: '2',
      cardNumber: '8600123412345678',
      maskedCardNumber: '8600 12** **** 5678',
      cardHolder: 'Karimov Jasur',
      holderPinfl: '31234567890013',
      bankName: 'TBC',
      cardSystem: 'Uzcard',
      blockedDate: '2026-09-15',
      balanceAmount: 5000000,
      totalTurnover: 30000000,
      transactionCount: 20,
      blockingReason: 'Test blokirovka',
      blockedBy: 'D. Qodirova',
      createdAtTime: '2026-09-15 14:00:00',
      updatedAtTime: '2026-09-15 15:30:00',
      dropPatternType: 'Kripto-P2P keshout',
      riskScore: 80,
      riskLevel: 'Yuqori',
      status: 'Bloklangan',
      isCurrentMonth: false,
      dwhAccount: '20208000123456789002',
      notes: 'Test',
    },
  ];

  const stats = calculateDropCardStats(sampleCards);
  assert.equal(stats.totalCount, 2);
  assert.equal(stats.totalTurnover, 80000000);
  assert.equal(stats.currentMonthCount, 1);
  assert.equal(stats.currentMonthTurnover, 50000000);
  assert.equal(stats.criticalRiskCount, 1);
});

test('calculateAppealStats correctly computes total count, current month count, and damages', () => {
  const sampleAppeals: AppealItem[] = [
    {
      id: 'app-1',
      appealNumber: 'APP-01',
      applicantName: 'Aliyev Vali',
      address: 'Toshkent sh., Yunusobod',
      applicantPhone: '+998901234567',
      organization: 'Kapitalbank',
      cardSystem: 'Humo',
      direction: 'P2P Firibgarlik',
      clientCode: 'CIF-001',
      cardNumber: '9860 1234 5678 9012',
      incidentDate: '2026-10-25',
      creator: 'B. Mirzayev',
      createdAtTime: '2026-10-25 10:00:00',
      updatedAtTime: '2026-10-25 10:30:00',
      damageAmount: 15000000,
      amount: 15000000,
      createdAt: '2026-10-25',
      bankName: 'Kapitalbank',
      isCurrentMonth: true,
      status: 'Yangi',
    },
    {
      id: 'app-2',
      appealNumber: 'APP-02',
      applicantName: 'Karimov Jasur',
      address: 'Samarqand sh., Registon',
      applicantPhone: '+998939876543',
      organization: 'TBC Bank',
      cardSystem: 'Uzcard',
      direction: 'Karta bloklanishi',
      clientCode: 'CIF-002',
      cardNumber: '8600 9876 5432 1098',
      incidentDate: '2026-09-15',
      creator: 'D. Qodirova',
      createdAtTime: '2026-09-15 14:00:00',
      updatedAtTime: '2026-09-15 15:00:00',
      damageAmount: 5000000,
      amount: 5000000,
      createdAt: '2026-09-15',
      bankName: 'TBC Bank',
      isCurrentMonth: false,
      status: 'Tekshiruvda',
    },
  ];

  const stats = calculateAppealStats(sampleAppeals);
  assert.equal(stats.totalCount, 2);
  assert.equal(stats.currentMonthCount, 1);
  assert.equal(stats.totalDamage, 20000000);
  assert.equal(stats.currentMonthDamage, 15000000);
});

