import { ArrowRight, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  onLogin: () => void;
  onRegister: () => void;
};

export function LandingPage({ onLogin, onRegister }: Props) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-foreground text-background">
      <img
        src="/images/tailor_women.webp"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/45" />
      <div className="relative flex min-h-screen flex-col justify-between px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between gap-4">
          <p className="font-heading text-2xl font-semibold tracking-normal">Tailora</p>
          <Button
            type="button"
            variant="secondary"
            onClick={onLogin}
            className="rounded-full bg-background/95 text-foreground hover:bg-background"
          >
            <LogIn data-icon="inline-start" strokeWidth={1.5} />
            Se connecter
          </Button>
        </header>

        <section className="max-w-2xl pb-10 sm:pb-14 lg:pb-16">
          <h1 className="font-heading text-5xl font-semibold leading-[0.96] tracking-normal sm:text-6xl lg:text-7xl">
            Le carnet d'atelier des couturiers.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-background/85 sm:text-lg">
            Clients, mensurations, tissus, commandes et livraisons dans un espace simple, mobile et fait pour le terrain.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              size="lg"
              onClick={onRegister}
              className="rounded-full bg-background text-foreground hover:bg-background/90"
            >
              Créer un compte
              <ArrowRight data-icon="inline-end" strokeWidth={1.5} />
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={onLogin}
              className="rounded-full border-background/60 bg-transparent text-background hover:bg-background/10 hover:text-background"
            >
              J'ai déjà un compte
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
