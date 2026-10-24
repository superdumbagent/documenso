import type { Field } from '@prisma/client';
import { FieldType } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { extractFieldInsertionValues } from './envelope-signing';

const documentMeta = { timezone: null, dateFormat: null, typedSignatureEnabled: true };

const createTextField = (characterLimit: number) =>
  ({
    type: FieldType.TEXT,
    fieldMeta: { type: 'text', characterLimit },
  }) as unknown as Field;

describe('extractFieldInsertionValues', () => {
  it('accepts text within the character limit', () => {
    const result = extractFieldInsertionValues({
      field: createTextField(10),
      fieldValue: { type: FieldType.TEXT, value: '0123456789' },
      documentMeta,
    });

    expect(result).toEqual({ customText: '0123456789', inserted: true });
  });

  it('rejects text over the character limit with a text-specific error', () => {
    expect(() =>
      extractFieldInsertionValues({
        field: createTextField(10),
        fieldValue: { type: FieldType.TEXT, value: '012345678901234' },
        documentMeta,
      }),
    ).toThrow('Invalid text');
  });
});
