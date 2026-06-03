import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent } from '@/components/layout/PageContent';
import { useAccountContext } from '@/context/AccountContext';

export function WorkshopPage() {
  const { activeWorkshop, saveActiveWorkshop } = useAccountContext();
  const [name, setName] = useState(activeWorkshop?.name ?? '');
  const [address, setAddress] = useState(activeWorkshop?.address ?? '');
  const [professionalPhone, setProfessionalPhone] = useState(activeWorkshop?.professionalPhone ?? '');
  const [openingDays, setOpeningDays] = useState(activeWorkshop?.openingDays ?? '');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setName(activeWorkshop?.name ?? '');
    setAddress(activeWorkshop?.address ?? '');
    setProfessionalPhone(activeWorkshop?.professionalPhone ?? '');
    setOpeningDays(activeWorkshop?.openingDays ?? '');
    setMessage('');
  }, [activeWorkshop]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    const workshop = saveActiveWorkshop({ name, address, professionalPhone, openingDays });
    if (!workshop) {
      setMessage('Le nom de l’atelier est requis.');
      return;
    }

    setMessage(activeWorkshop ? 'Atelier mis à jour.' : 'Atelier créé.');
  }

  return (
    <>
      <PageHeader
        title="Atelier"
        subtitle={activeWorkshop ? activeWorkshop.name : 'Créez un espace atelier quand vous en avez besoin'}
      />
      <PageContent variant="narrow" className="max-w-2xl gap-6">
        <section className="space-y-2 border-b border-border pb-5">
          <h2 className="font-heading text-2xl font-medium tracking-[-0.6px] text-foreground">
            {activeWorkshop ? 'Informations de l’atelier' : 'Créer un atelier'}
          </h2>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            L’atelier est séparé de votre profil personnel. Vous pourrez y rattacher d’autres personnes plus tard.
          </p>
        </section>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Nom de l’atelier</span>
            <Input
              value={name}
              onChange={(e) => { setName(e.target.value); setMessage(''); }}
              placeholder="Ex. Atelier Awa"
              className="h-11 bg-background"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Adresse</span>
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Quartier, rue, repère..."
              className="min-h-20 bg-background"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Téléphone professionnel</span>
            <Input
              type="tel"
              inputMode="tel"
              value={professionalPhone}
              onChange={(e) => setProfessionalPhone(e.target.value)}
              placeholder="Facultatif"
              className="h-11 bg-background"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Jours et horaires d’ouverture</span>
            <Textarea
              value={openingDays}
              onChange={(e) => setOpeningDays(e.target.value)}
              placeholder="Ex. Lundi au samedi, 9h - 18h"
              className="min-h-24 bg-background"
            />
          </label>

          {message && (
            <p className={`text-sm ${message.includes('requis') ? 'text-destructive' : 'text-muted-foreground'}`}>
              {message}
            </p>
          )}

          <Button type="submit" size="lg" className="h-11 rounded-full">
            {activeWorkshop ? 'Enregistrer' : 'Créer l’atelier'}
          </Button>
        </form>
      </PageContent>
    </>
  );
}
