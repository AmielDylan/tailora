import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent } from '@/components/layout/PageContent';
import { Button } from '@/components/ui/button';
import { useAccountContext } from '@/context/AccountContext';
import { loadSettings, saveSettings } from '@/lib/settings';
import { publishPublicWorkshop } from '@/lib/workshop';
import type { TimeFormat } from '@/types';

const TIME_FORMATS: { value: TimeFormat; label: string; example: string }[] = [
  { value: '24h', label: 'Format 24h', example: '14:00 - 18:00' },
  { value: '12h', label: 'Format 12h', example: '2:00 PM - 6:00 PM' },
];

export function SettingsPage() {
  const { activeWorkshop } = useAccountContext();
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(() => loadSettings().timeFormat);
  const [message, setMessage] = useState('');

  async function updateTimeFormat(nextFormat: TimeFormat) {
    setTimeFormat(nextFormat);
    saveSettings({ timeFormat: nextFormat });
    setMessage('Paramètres enregistrés.');

    if (activeWorkshop?.publicProfileEnabled) {
      await publishPublicWorkshop(activeWorkshop).catch(() => {
        setMessage("Paramètres enregistrés. Le profil public sera mis à jour au prochain enregistrement de l'atelier.");
      });
    }
  }

  return (
    <>
      <PageHeader title="Paramètres" subtitle="Préférences d'affichage" />
      <PageContent variant="narrow" className="max-w-2xl gap-5">
        <section className="rounded-lg border border-border/70 bg-card p-4">
          <div className="space-y-1">
            <h2 className="text-sm font-medium text-foreground">Horaires</h2>
            <p className="text-sm text-muted-foreground">
              Choisissez comment Tailora affiche les heures dans l'app et sur votre profil atelier public.
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {TIME_FORMATS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateTimeFormat(option.value)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  timeFormat === option.value
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background text-foreground hover:bg-muted'
                }`}
              >
                <span className="block text-sm font-medium">{option.label}</span>
                <span className={`mt-1 block text-sm ${timeFormat === option.value ? 'text-background/75' : 'text-muted-foreground'}`}>
                  {option.example}
                </span>
              </button>
            ))}
          </div>

          {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
        </section>

        <Button type="button" variant="outline" onClick={() => updateTimeFormat('24h')} className="w-fit">
          Réinitialiser en 24h
        </Button>
      </PageContent>
    </>
  );
}
