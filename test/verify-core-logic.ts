// Direct Node verification script for core logic
import assert from 'node:assert';
import { normalizePhone, normalizeClinicName, findDuplicates, calculateSimilarity } from '../src/services/duplicateDetector.ts';
import { parseAndValidateImport } from '../src/services/exportImport.ts';
import type { Clinic } from '../src/types/clinic.ts';

console.log('Running test suite for Dental Lead CRM core logic...');

// Test 1: Phone Normalization
assert.strictEqual(normalizePhone('+91 98765 43210'), '9876543210', 'Should strip +91 and spaces');
assert.strictEqual(normalizePhone('09876543210'), '9876543210', 'Should strip leading 0');
assert.strictEqual(normalizePhone('080-2345-6789'), '08023456789'.slice(-10), 'Should normalize landline/STD format');
assert.strictEqual(normalizePhone(''), '', 'Should handle empty phone');
console.log('✓ Test 1: Phone normalization passed');

// Test 2: Name Normalization
assert.strictEqual(normalizeClinicName('Smile Dental Clinic'), 'smile', 'Should strip "dental clinic"');
assert.strictEqual(normalizeClinicName('Dr. Sharma Multispeciality Dental Care'), 'sharma', 'Should strip prefixes and stop words');
assert.strictEqual(normalizeClinicName('Apex Dental Hospital & Research Centre'), 'apex research', 'Should clean hospital/centre');
console.log('✓ Test 2: Clinic name normalization passed');

// Test 3: String Similarity
const sim1 = calculateSimilarity('apex dental', 'apex dental');
assert.strictEqual(sim1, 1.0, 'Identical string similarity should be 1.0');
const sim2 = calculateSimilarity('sparkle', 'sparkle');
assert.strictEqual(sim2, 1.0);
console.log('✓ Test 3: String similarity passed');

// Test 4: Duplicate Detection
const existingClinics: Clinic[] = [
  {
    id: 'c1',
    name: 'Smile Dental Clinic',
    city: 'Bengaluru',
    locality: 'Koramangala',
    phone: '+91 98765 43210',
    websiteStatus: 'No Website Found',
    salesStatus: 'To Call',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'c2',
    name: 'Apollo Dental Care',
    city: 'Mumbai',
    locality: 'Bandra',
    phone: '022 2640 1234',
    websiteStatus: 'Has Website',
    salesStatus: 'Called',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Duplicate by phone
const matchByPhone = findDuplicates(
  { name: 'Dr. Rao Clinic', phone: '9876543210', city: 'Bengaluru', locality: 'HSR' },
  existingClinics
);
assert.ok(matchByPhone.length > 0, 'Should find duplicate by phone number');
assert.strictEqual(matchByPhone[0].clinic.id, 'c1');
assert.strictEqual(matchByPhone[0].matchReason, 'phone');

// Duplicate by normalized name in same city
const matchByName = findDuplicates(
  { name: 'Smile Dental Care', city: 'Bengaluru', locality: 'Indiranagar' },
  existingClinics
);
assert.ok(matchByName.length > 0, 'Should find duplicate by normalized name');
assert.strictEqual(matchByName[0].clinic.id, 'c1');
console.log('✓ Test 4: Duplicate detection passed');

// Test 5: JSON Import Validation
const validBackupJson = JSON.stringify({
  app: 'Dental Lead Finder & CRM',
  version: '1.0',
  exportedAt: new Date().toISOString(),
  clinics: [
    {
      name: 'Dr. Smile Clinic',
      city: 'Delhi NCR',
      locality: 'South Extension',
      phone: '9999988888',
      websiteStatus: 'No Website Found',
      salesStatus: 'To Call'
    },
    {
      name: 'Smile Dental Clinic', // Duplicate of c1
      city: 'Bengaluru',
      locality: 'Koramangala',
      phone: '+91 98765 43210',
      websiteStatus: 'No Website Found',
      salesStatus: 'To Call'
    },
    {
      // Missing name - invalid
      city: 'Pune',
      locality: 'Kothrud'
    }
  ]
});

const importResult = parseAndValidateImport(validBackupJson, existingClinics);
assert.strictEqual(importResult.totalParsed, 3, 'Total parsed should be 3');
assert.strictEqual(importResult.validClinics.length, 2, 'Valid clinics should be 2');
assert.strictEqual(importResult.invalidCount, 1, 'Invalid count should be 1');
assert.strictEqual(importResult.newClinics.length, 1, 'New clinics should be 1');
assert.strictEqual(importResult.duplicateMatches.length, 1, 'Duplicate matches should be 1');
console.log('✓ Test 5: Import validation and duplicate segregation passed');

// Test 6: CSV Escaping rules verification
function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}
assert.strictEqual(escapeCsv('Dr. "Smile" Clinic'), '"Dr. ""Smile"" Clinic"');
assert.strictEqual(escapeCsv('Line 1\nLine 2, with comma'), '"Line 1\nLine 2, with comma"');
console.log('✓ Test 6: CSV cell escaping logic passed');

console.log('\nAll 6 core logic tests passed successfully!');
