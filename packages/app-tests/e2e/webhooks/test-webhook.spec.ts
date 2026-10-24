import { prisma } from '@documenso/prisma';
import { seedTeam } from '@documenso/prisma/seed/teams';
import { expect, test } from '@playwright/test';
import { WebhookTriggerEvents } from '@prisma/client';

import { apiSignin } from '../fixtures/authentication';

const countQueuedWebhookJobs = async (webhookId: string) =>
  await prisma.backgroundJob.count({
    where: {
      jobId: 'internal.execute-webhook',
      payload: { path: ['webhookId'], equals: webhookId },
    },
  });

test('[WEBHOOKS]: test webhook only delivers to the tested webhook', async ({ page }) => {
  const { owner, team } = await seedTeam();

  const [otherWebhook, testedWebhook] = await Promise.all(
    ['https://example.com/other', 'https://example.com/tested'].map(
      async (webhookUrl) =>
        await prisma.webhook.create({
          data: {
            webhookUrl,
            eventTriggers: [WebhookTriggerEvents.DOCUMENT_COMPLETED],
            secret: null,
            enabled: true,
            userId: owner.id,
            teamId: team.id,
          },
        }),
    ),
  );

  await apiSignin({ page, email: owner.email });
  await page.goto(`/t/${team.url}/settings/webhooks`);

  const status = await page.evaluate(
    async ({ id, teamId }) => {
      const response = await fetch('/api/trpc/webhook.testWebhook', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-team-id': String(teamId) },
        body: JSON.stringify({ json: { id, event: 'DOCUMENT_COMPLETED' } }),
      });

      return response.status;
    },
    { id: testedWebhook.id, teamId: team.id },
  );

  expect(status).toBe(200);
  expect(await countQueuedWebhookJobs(testedWebhook.id)).toBe(1);
  expect(await countQueuedWebhookJobs(otherWebhook.id)).toBe(0);
});
