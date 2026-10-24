import { Settings } from 'luxon';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { convertToLocalSystemFormat } from './date-formats';

describe('convertToLocalSystemFormat', () => {
  const originalDefaultZone = Settings.defaultZone;

  beforeEach(() => {
    Settings.defaultZone = 'America/Chicago';
  });

  afterEach(() => {
    Settings.defaultZone = originalDefaultZone;
  });

  it('keeps the calendar day of date-only values for viewers west of the document timezone', () => {
    expect(convertToLocalSystemFormat('10/20/2026', 'MM/dd/yyyy', 'Etc/UTC')).toBe('10/20/2026');
    expect(convertToLocalSystemFormat('Tuesday, October 20, 2026', 'EEEE, MMMM dd, yyyy', 'Etc/UTC')).toBe(
      'Tuesday, October 20, 2026',
    );
  });

  it('converts values with a time component to the viewer timezone', () => {
    expect(convertToLocalSystemFormat('2026-10-20 10:00 AM', 'yyyy-MM-dd hh:mm a', 'Etc/UTC')).toBe(
      '2026-10-20 05:00 AM',
    );
  });
});
