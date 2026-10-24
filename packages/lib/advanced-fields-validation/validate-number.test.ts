import { describe, expect, it } from 'vitest';

import { validateNumberField } from './validate-number';

describe('validateNumberField', () => {
  it('compares min/max against the value parsed with its number format', () => {
    expect(validateNumberField('5,000', { type: 'number', numberFormat: '123,456,789.00', maxValue: 1000 })).toEqual([
      'Value 5,000 is greater than the maximum value of 1000',
    ]);
    expect(validateNumberField('1,500', { type: 'number', numberFormat: '123,456,789.00', minValue: 10 })).toEqual([]);
    expect(validateNumberField('1.234,56', { type: 'number', numberFormat: '123.456.789,00', maxValue: 1000 })).toEqual(
      ['Value 1.234,56 is greater than the maximum value of 1000'],
    );
    expect(
      validateNumberField('12,5', { type: 'number', numberFormat: '123.456.789,00', minValue: 12.4, maxValue: 100 }),
    ).toEqual([]);
    expect(
      validateNumberField('900,000.50', { type: 'number', numberFormat: '123456,789.00', maxValue: 1000 }),
    ).toEqual(['Value 900,000.50 is greater than the maximum value of 1000']);
  });

  it('accepts a read-only value that is at least 1 once parsed with its number format', () => {
    expect(validateNumberField('0.900', { type: 'number', numberFormat: '123.456.789,00', readOnly: true })).toEqual(
      [],
    );
  });
});
