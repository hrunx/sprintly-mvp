import { describe, it, expect, beforeAll } from 'vitest';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';

describe('CSV Upload Functionality', () => {
  it('should parse companies CSV correctly', async () => {
    const csvPath = path.join(__dirname, '../test-csvs/linkedin-companies-sample.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    expect(records).toBeDefined();
    expect(records.length).toBeGreaterThan(0);
    expect(records[0]).toHaveProperty('name');
    expect(records[0]).toHaveProperty('sector');
    expect(records[0]).toHaveProperty('stage');
  });

  it('should parse investors CSV correctly', async () => {
    const csvPath = path.join(__dirname, '../test-csvs/linkedin-investors-sample.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    expect(records).toBeDefined();
    expect(records.length).toBeGreaterThan(0);
    expect(records[0]).toHaveProperty('name');
    expect(records[0]).toHaveProperty('sector');
    expect(records[0]).toHaveProperty('stage');
  });

  it('should handle parseInt correctly for numeric fields', () => {
    const testValues = ['1000000', '0', '', 'invalid', null, undefined];
    
    testValues.forEach(value => {
      const result = value ? (parseInt(value) || null) : null;
      // Should either be a number or null, never NaN
      expect(result === null || typeof result === 'number').toBe(true);
      expect(isNaN(result as any)).toBe(false);
    });
  });
});
