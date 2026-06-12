import { expect, test, type Page } from '@playwright/test';

const AUTH_KEY = 'tailora-authenticated';
const CREDENTIALS_KEY = 'tailora-credentials';
const USER_PROFILE_KEY = 'tailora-user-profile';
const STORAGE_KEY = 'tailora-mvp-state';
const WORKSHOPS_KEY = 'tailora-workshops';
const ACTIVE_WORKSHOP_ID_KEY = 'tailora-active-workshop-id';
const WORKSHOP_FEATURES_NOTICE_KEY = 'tailora-workshop-features-notice-dismissed';
const WORKSHOP_MIGRATION_NOTICE_KEY = 'tailora-workshop-migration-dismissed';
const PUBLIC_WORKSHOP_LOCAL_PREFIX = 'tailora-public-workshop:';
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64',
);

const baseOrder = {
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

async function seedLoggedIn(page: Page, state = { clients: [], orders: [] }) {
  await page.addInitScript(({ authKey, credentialsKey, profileKey, storageKey, appState }) => {
    localStorage.setItem(authKey, 'true');
    localStorage.setItem(credentialsKey, JSON.stringify({
      phone: '+229 01 90 12 34 56',
      authProvider: 'local',
      updatedAt: '2026-06-11T00:00:00.000Z',
    }));
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
  }, { authKey: AUTH_KEY, credentialsKey: CREDENTIALS_KEY, profileKey: USER_PROFILE_KEY, storageKey: STORAGE_KEY, appState: state });
}

async function seedWorkshop(page: Page, workshop = {}) {
  await page.addInitScript(({ workshopsKey, activeWorkshopKey, featuresKey, migrationKey, workshopData }) => {
    localStorage.setItem(workshopsKey, JSON.stringify([{
      id: 'w-e2e-1',
      name: 'Atelier Awa',
      slug: 'atelier-awa',
      address: 'Cotonou',
      professionalPhone: '+229 01 90 12 34 56',
      openingSchedule: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
        day,
        open: true,
        start: '00:00',
        end: '23:59',
        note: '',
      })),
      whatsappSignature: 'Atelier Awa',
      bannerStyle: 'from-emerald-600 to-teal-500',
      publicLinks: [],
      publicProfileEnabled: true,
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
      ...workshopData,
    }]));
    localStorage.setItem(activeWorkshopKey, 'w-e2e-1');
    localStorage.removeItem(featuresKey);
    localStorage.removeItem(migrationKey);
  }, {
    workshopsKey: WORKSHOPS_KEY,
    activeWorkshopKey: ACTIVE_WORKSHOP_ID_KEY,
    featuresKey: WORKSHOP_FEATURES_NOTICE_KEY,
    migrationKey: WORKSHOP_MIGRATION_NOTICE_KEY,
    workshopData: workshop,
  });
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
  await seedLoggedIn(page, {
    clients: [{ id: 'client-e2e-1', name: 'Amina Kora', phone: '+229 01 90 12 34 56', address: 'Cotonou' }],
    orders: [baseOrder],
  });
  await seedWorkshop(page);

  await page.goto('/');
  await page.getByRole('button', { name: 'Commandes 1' }).click();
  await page.getByText('Amina Kora').click();

  const readyLink = page.getByRole('link', { name: 'Commande prête' });
  await expect(readyLink).toHaveAttribute('href', /https:\/\/wa\.me\/2290190123456\?text=.*Atelier%20Awa/);
});

test('creates a workshop then returns to dashboard with closable feature notice', async ({ page }) => {
  await seedLoggedIn(page);

  await page.goto('/');
  await page.getByRole('button', { name: 'Atelier' }).click();
  await page.getByLabel("Nom de l'atelier").fill('Atelier Awa');
  await page.getByLabel('Téléphone WhatsApp professionnel').fill('+229 01 90 12 34 56');
  await page.getByRole('button', { name: "Créer l'atelier" }).click();

  await expect(page.getByRole('heading', { name: 'Nouvelles fonctionnalités atelier' })).toBeVisible();
  await page.getByRole('button', { name: 'Fermer' }).first().click();
  await expect(page.getByRole('heading', { name: 'Nouvelles fonctionnalités atelier' })).toBeHidden();
});

test('uses the registration phone when workshop phone is empty', async ({ page }) => {
  await seedLoggedIn(page);

  await page.goto('/');
  await page.getByRole('button', { name: 'Atelier' }).click();
  await page.getByLabel("Nom de l'atelier").fill('Atelier Sans Tel');
  await page.getByLabel('Activer le profil public').check();
  await page.getByRole('button', { name: "Créer l'atelier" }).click();

  await page.goto('/atelier/atelier-sans-tel');
  await expect(page.getByRole('heading', { name: 'Atelier Sans Tel' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Commander sur WhatsApp' })).toHaveAttribute('href', /https:\/\/wa\.me\/2290190123456\?text=/);
});

test('opens the banner palette and changes the workshop banner choice', async ({ page }) => {
  await seedLoggedIn(page);
  await seedWorkshop(page);

  await page.goto('/');
  await page.getByRole('button', { name: 'Atelier' }).click();
  await page.getByRole('button', { name: 'Choisir la couleur de bannière' }).click();

  await expect(page.getByRole('dialog', { name: 'Couleur de bannière' })).toBeVisible();
  await page.getByRole('button', { name: 'Bleu' }).click();
  await expect(page.getByRole('dialog', { name: 'Couleur de bannière' })).toBeHidden();
});

test('migrates selected personal orders to the workshop', async ({ page }) => {
  await seedLoggedIn(page, {
    clients: [{ id: 'client-e2e-1', name: 'Amina Kora', phone: '+229 01 90 12 34 56', address: 'Cotonou' }],
    orders: [baseOrder],
  });
  await seedWorkshop(page);

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Organiser les commandes existantes' })).toBeVisible();
  await page.getByRole('button', { name: 'Choisir les commandes' }).click();
  await page.getByLabel(/Amina Kora/).check();
  await page.getByRole('button', { name: 'Migrer la sélection' }).click();

  await page.getByRole('button', { name: 'Commandes 1' }).click();
  await expect(page.getByRole('table').getByText('Atelier')).toBeVisible();
});

test('shows a public workshop profile without requiring auth', async ({ page }) => {
  await page.addInitScript(({ prefix }) => {
    localStorage.setItem(`${prefix}atelier-awa`, JSON.stringify({
      id: 'w-e2e-1',
      ownerUid: 'local-dev',
      slug: 'atelier-awa',
      name: 'Atelier Awa',
      address: 'Cotonou',
      professionalPhone: '+229 01 90 12 34 56',
      openingSchedule: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
        day,
        open: true,
        start: '00:00',
        end: '23:59',
        note: '',
      })),
      whatsappSignature: 'Atelier Awa',
      bannerStyle: 'from-emerald-600 to-teal-500',
      publicLinks: [{ id: 'instagram', label: 'Instagram', url: 'https://example.com/atelier-awa' }],
      updatedAt: '2026-06-11T00:00:00.000Z',
    }));
  }, { prefix: PUBLIC_WORKSHOP_LOCAL_PREFIX });

  await page.goto('/atelier/atelier-awa');

  await expect(page.getByRole('heading', { name: 'Atelier Awa' })).toBeVisible();
  await expect(page.getByText('Atelier couture')).toBeHidden();
  await expect(page.getByText('Ouvert')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Commander sur WhatsApp' })).toHaveAttribute('href', /https:\/\/wa\.me\/2290190123456\?text=/);
});

test('updates time format settings and republishes the public profile', async ({ page }) => {
  await seedLoggedIn(page);
  await seedWorkshop(page);

  await page.goto('/');
  await page.getByRole('button', { name: 'Paramètres' }).click();
  await page.getByRole('button', { name: /Format 12h/ }).click();

  await page.goto('/atelier/atelier-awa');
  await expect(page.getByRole('main').getByText('12:00 AM - 11:59 PM').first()).toBeVisible();
});

test('publishes a compressed gallery image on the public workshop profile', async ({ page }) => {
  await seedLoggedIn(page);
  await seedWorkshop(page);

  await page.goto('/');
  await page.getByRole('button', { name: 'Atelier' }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'realisation.png',
    mimeType: 'image/png',
    buffer: TINY_PNG,
  });
  await page.getByPlaceholder('Légende optionnelle').fill('Robe de cérémonie');
  await page.getByRole('button', { name: 'Enregistrer' }).click();

  await page.goto('/atelier/atelier-awa');
  await expect(page.getByRole('heading', { name: 'Quelques réalisations' })).toBeVisible();
  await expect(page.getByText('Robe de cérémonie')).toBeVisible();
  await page.getByRole('button', { name: /Robe de cérémonie/ }).click();
  await expect(page.getByRole('dialog', { name: 'Robe de cérémonie' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Robe de cérémonie' })).toBeHidden();
});

test('switches calendar views and keeps personal/workshop distinction visible', async ({ page }) => {
  await seedLoggedIn(page, {
    clients: [{ id: 'client-e2e-1', name: 'Amina Kora', phone: '+229 01 90 12 34 56', address: 'Cotonou' }],
    orders: [
      { ...baseOrder, scope: 'personal' },
      {
        ...baseOrder,
        id: 'order-e2e-2',
        clientName: 'Safi Bio',
        deliveryAt: '2026-06-19',
        scope: 'workshop',
        workshopId: 'w-e2e-1',
      },
    ],
  });
  await seedWorkshop(page);

  await page.goto('/');
  await page.getByRole('button', { name: 'Calendrier' }).click();

  await expect(page.getByText('Personnel')).toBeVisible();
  await expect(page.getByRole('main').getByText('Atelier Awa')).toBeVisible();
  await page.getByRole('button', { name: 'Semaine' }).click();
  await page.getByRole('button', { name: 'Jour', exact: true }).click();
  await page.getByRole('button', { name: 'Agenda' }).click();
  await expect(page.getByText('Prochaines livraisons')).toBeVisible();
});

test('deleting a workshop moves its orders back to personal', async ({ page }) => {
  await seedLoggedIn(page, {
    clients: [{ id: 'client-e2e-1', name: 'Amina Kora', phone: '+229 01 90 12 34 56', address: 'Cotonou' }],
    orders: [{ ...baseOrder, scope: 'workshop', workshopId: 'w-e2e-1' }],
  });
  await seedWorkshop(page);
  page.on('dialog', (dialog) => dialog.accept());

  await page.goto('/');
  await page.getByRole('button', { name: 'Atelier' }).click();
  await page.getByRole('button', { name: "Supprimer l'atelier" }).click();
  await page.getByRole('button', { name: 'Commandes 1' }).click();

  await expect(page.getByText('Perso')).toBeVisible();
});
