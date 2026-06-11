import { expect, test, type Page } from '@playwright/test';

const AUTH_KEY = 'tailora-authenticated';
const USER_PROFILE_KEY = 'tailora-user-profile';
const STORAGE_KEY = 'tailora-mvp-state';
const WORKSHOPS_KEY = 'tailora-workshops';
const ACTIVE_WORKSHOP_ID_KEY = 'tailora-active-workshop-id';

async function seedLoggedIn(page: Page, state = { clients: [], orders: [] }) {
  await page.addInitScript(({ authKey, profileKey, storageKey, appState }) => {
    localStorage.setItem(authKey, 'true');
    localStorage.setItem(profileKey, JSON.stringify({
      firstName: 'Awa',
      lastName: 'Test',
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
    }));
    localStorage.setItem(storageKey, JSON.stringify({
      ...appState,
      schemaVersion: 1,
      updatedAt: '2026-06-11T00:00:00.000Z',
    }));
  }, { authKey: AUTH_KEY, profileKey: USER_PROFILE_KEY, storageKey: STORAGE_KEY, appState: state });
}

async function openNewOrder(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Nouvelle commande' }).click();
}

test('restores an order draft after reload', async ({ page }) => {
  await seedLoggedIn(page);
  await openNewOrder(page);

  await page.getByLabel('Nom *').fill('Amina Kora');
  await page.getByLabel('Téléphone *').fill('+229 01 90 12 34 56');
  await page.getByLabel('Description *').fill('Robe droite');

  await page.waitForTimeout(500);
  await page.reload();
  await page.getByRole('button', { name: 'Nouvelle commande' }).click();

  await expect(page.getByText('Brouillon récupéré.')).toBeVisible();
  await expect(page.getByLabel('Nom *')).toHaveValue('Amina Kora');
  await expect(page.getByLabel('Description *')).toHaveValue('Robe droite');
});

test('keeps garment details progressive', async ({ page }) => {
  await seedLoggedIn(page);
  await openNewOrder(page);

  await expect(page.getByLabel('Description *')).toBeVisible();
  await expect(page.getByText('Type de tissu')).toBeHidden();

  await page.getByRole('button', { name: 'Détails du vêtement' }).click();

  await expect(page.getByText('Type de tissu')).toBeVisible();
  await expect(page.getByText('Photo du tissu')).toBeVisible();
});

test('shows a photo error without clearing form fields', async ({ page }) => {
  await seedLoggedIn(page);
  await openNewOrder(page);

  await page.getByLabel('Nom *').fill('Fati Lawani');
  await page.getByLabel('Description *').fill('Boubou brodé');
  await page.getByRole('button', { name: 'Détails du vêtement' }).click();

  await page.locator('input[type="file"]').nth(1).setInputFiles({
    name: 'not-an-image.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('not an image'),
  });

  await expect(page.getByText('Impossible de lire cette image.')).toBeVisible();
  await expect(page.getByLabel('Nom *')).toHaveValue('Fati Lawani');
  await expect(page.getByLabel('Description *')).toHaveValue('Boubou brodé');
});

test('generates WhatsApp links from an order', async ({ page }) => {
  const order = {
    id: 'order-e2e-1',
    clientId: 'client-e2e-1',
    clientName: 'Amina Kora',
    clientPhone: '+229 01 90 12 34 56',
    clientAddress: 'Cotonou',
    fabricReceivedAt: '2026-06-10',
    deliveryAt: '2026-06-18',
    status: 'En cours',
    notes: '',
    measurements: [],
    garments: [{ id: 'g-e2e-1', description: 'Robe droite', quantity: '1', price: 25000 }],
    totalPrice: 25000,
    deposit: 10000,
    createdAt: '2026-06-10T00:00:00.000Z',
  };

  await seedLoggedIn(page, {
    clients: [{ id: 'client-e2e-1', name: 'Amina Kora', phone: '+229 01 90 12 34 56', address: 'Cotonou' }],
    orders: [order],
  });
  await page.addInitScript(({ workshopsKey, activeWorkshopKey }) => {
    localStorage.setItem(workshopsKey, JSON.stringify([{
      id: 'w-e2e-1',
      name: 'Atelier Awa',
      whatsappSignature: 'Atelier Awa',
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
    }]));
    localStorage.setItem(activeWorkshopKey, 'w-e2e-1');
  }, { workshopsKey: WORKSHOPS_KEY, activeWorkshopKey: ACTIVE_WORKSHOP_ID_KEY });

  await page.goto('/');
  await page.getByRole('button', { name: 'Commandes 1' }).click();
  await page.getByText('Amina Kora').click();

  const readyLink = page.getByRole('link', { name: 'Commande prête' });
  await expect(readyLink).toHaveAttribute('href', /https:\/\/wa\.me\/2290190123456\?text=.*Atelier%20Awa/);
});
