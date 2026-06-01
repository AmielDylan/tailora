import { useState } from 'react';
import { Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAccountContext } from '@/context/AccountContext';

export function WelcomeProfileScreen() {
  const { saveProfile, createWorkshop } = useAccountContext();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [workshopName, setWorkshopName] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const trimFirstName = firstName.trim();
    const trimLastName = lastName.trim();
    if (!trimFirstName || !trimLastName) {
      setError('Renseignez votre prénom et votre nom pour continuer.');
      return;
    }

    saveProfile({ firstName: trimFirstName, lastName: trimLastName });
    if (workshopName.trim()) {
      createWorkshop({ name: workshopName });
    }
  }

  return (
    <main className="min-h-screen bg-background lg:grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <section className="flex min-h-screen flex-col justify-center px-5 py-8 sm:px-8 lg:px-14">
        <div className="mx-auto flex w-full max-w-md flex-col gap-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Scissors className="size-4" strokeWidth={1.25} />
            </div>
            <div>
              <p className="font-heading text-xl font-medium text-foreground">Tailora</p>
              <p className="text-sm text-muted-foreground">Votre carnet couture</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.2px] text-muted-foreground">
              Bienvenue
            </p>
            <h1 className="font-heading text-4xl font-medium leading-none tracking-[-1px] text-foreground">
              Personnalisons votre espace.
            </h1>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              Votre carnet peut rester personnel ou devenir l'espace de votre atelier.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-foreground">Prénom</span>
                <Input
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); setError(''); }}
                  autoComplete="given-name"
                  className="h-11 bg-background"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-foreground">Nom</span>
                <Input
                  value={lastName}
                  onChange={(e) => { setLastName(e.target.value); setError(''); }}
                  autoComplete="family-name"
                  className="h-11 bg-background"
                />
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">Nom de l'atelier</span>
              <Input
                value={workshopName}
                onChange={(e) => setWorkshopName(e.target.value)}
                placeholder="Facultatif"
                className="h-11 bg-background"
              />
              <span className="block text-xs leading-5 text-muted-foreground">
                Vous pourrez créer ou compléter votre atelier plus tard.
              </span>
            </label>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" size="lg" className="h-12 w-full rounded-full">
              Commencer
            </Button>
          </form>
        </div>
      </section>

      <section className="relative hidden min-h-screen overflow-hidden lg:block">
        <img
          src="/images/tailor_women.webp"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
      </section>
    </main>
  );
}
