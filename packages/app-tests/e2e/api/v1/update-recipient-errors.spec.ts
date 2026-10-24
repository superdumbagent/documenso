import { NEXT_PUBLIC_WEBAPP_URL } from '@documenso/lib/constants/app';
import { createApiToken } from '@documenso/lib/server-only/public-api/create-api-token';
import { mapSecondaryIdToDocumentId } from '@documenso/lib/utils/envelope';
import { prisma } from '@documenso/prisma';
import { SigningStatus } from '@documenso/prisma/client';
import { seedDraftDocument } from '@documenso/prisma/seed/documents';
import { seedUser } from '@documenso/prisma/seed/users';
import { expect, test } from '@playwright/test';

const WEBAPP_BASE_URL = NEXT_PUBLIC_WEBAPP_URL();

test.describe.configure({
  mode: 'parallel',
});

const setup = async () => {
  const { user, team } = await seedUser();
  const { token } = await createApiToken({
    userId: user.id,
    teamId: team.id,
    tokenName: 'test',
    expiresIn: null,
  });

  const { user: userRecipient } = await seedUser();

  const document = await seedDraftDocument(user, team.id, [userRecipient.email]);

  const recipient = await prisma.recipient.findFirstOrThrow({
    where: {
      envelopeId: document.id,
      email: userRecipient.email,
    },
  });

  return {
    token,
    recipient,
    documentId: mapSecondaryIdToDocumentId(document.secondaryId),
  };
};

const patchData = {
  name: 'New Name',
  email: 'new@example.com',
  role: 'SIGNER',
  signingOrder: null,
  authOptions: {
    accessAuth: [],
    actionAuth: [],
  },
};

test.describe('Document recipients PATCH endpoint errors', () => {
  test('should return 404 for a recipient that does not exist on the document', async ({ request }) => {
    const { token, documentId } = await setup();

    const res = await request.patch(`${WEBAPP_BASE_URL}/api/v1/documents/${documentId}/recipients/999999999`, {
      headers: { Authorization: `Bearer ${token}` },
      data: patchData,
    });

    expect(res.status()).toBe(404);
  });

  test('should return 400 for a recipient who has already signed', async ({ request }) => {
    const { token, documentId, recipient } = await setup();

    await prisma.recipient.update({
      where: { id: recipient.id },
      data: { signingStatus: SigningStatus.SIGNED, signedAt: new Date() },
    });

    const res = await request.patch(`${WEBAPP_BASE_URL}/api/v1/documents/${documentId}/recipients/${recipient.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: patchData,
    });

    expect(res.status()).toBe(400);

    const unchangedRecipient = await prisma.recipient.findUniqueOrThrow({ where: { id: recipient.id } });

    expect(unchangedRecipient.name).toBe(recipient.name);
  });
});
