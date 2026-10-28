'use client';

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CarFront,
  Check,
  HeartHandshake,
  Mail,
  Motorbike,
  ShieldCheck,
  Sparkles,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import { euro } from '@virage/shared/format';
import { instructors, offers } from '@virage/shared/mock';

import { RoundButton, SidePanel } from '@/components/side-panel';
import { Avatar } from '@/components/ui';
import { closePanel, usePanel } from '@/lib/panels';

import s from './inscription.module.css';

type Vehicle = 'voiture' | 'moto';

const vehicles: { key: Vehicle; title: string; subtitle: string; tags: string; icon: LucideIcon }[] = [
  { key: 'voiture', title: 'Voiture', subtitle: 'Pour la route, la ville et les week-ends.', tags: 'Permis B · Conduite accompagnée · Boîte auto', icon: CarFront },
  { key: 'moto', title: 'Moto', subtitle: 'Pour la liberté sur deux roues.', tags: 'Permis A2 · Formation 125 cm³', icon: Motorbike },
];

const motoOffers = [
  { id: 'm1', name: 'Permis A2 · 20 h', price: 1290, detail: 'Plateau + circulation, moto et équipement fournis', students: 14 },
  { id: 'm2', name: 'Formation 125 cm³', price: 350, detail: '7 h de formation, sans examen', students: 9 },
];

const months = ['Décembre 2026', 'Janvier 2027', 'Février 2027', 'Mars 2027', 'Avril 2027', 'Mai 2027'];
const payments = [
  { key: 1, label: 'En une fois' },
  { key: 3, label: 'En 3 fois' },
  { key: 4, label: 'En 4 fois' },
];

const steps = ['Identité', 'Véhicule', 'Formule', 'Rythme'];

type Form = { first: string; last: string; birth: string; email: string; phone: string; vehicle: Vehicle; offer: string; instructor: string; goal: string; pay: number };
const empty: Form = { first: '', last: '', birth: '', email: '', phone: '', vehicle: 'voiture', offer: 'o1', instructor: 'julie', goal: months[0], pay: 3 };

/** Inscription d'un élève depuis le site : le même parcours que dans l'app, dans un panneau à droite */
export function InscriptionPanel() {
  const open = usePanel() === 'inscription';
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<'next' | 'back'>('next');
  const [f, setF] = useState<Form>(empty);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const done = step === steps.length;

  // une fois l'élève inscrit, le panneau repart à zéro après sa fermeture
  useEffect(() => {
    if (open || !done) return;
    const t = setTimeout(() => {
      setStep(0);
      setF(empty);
    }, 400);
    return () => clearTimeout(t);
  }, [open, done]);

  const offerList = f.vehicle === 'moto' ? motoOffers : offers;
  const offer = offerList.find((o) => o.id === f.offer) ?? offerList[0];
  const team = instructors.filter((m) => (f.vehicle === 'moto') === m.role.includes('A2'));
  const coach = team.find((m) => m.id === f.instructor) ?? team[0];

  const valid = [f.first.trim() && f.last.trim() && /\S+@\S+\.\S+/.test(f.email), true, true, true][step] ?? true;

  const go = (to: number) => {
    setDir(to > step ? 'next' : 'back');
    setStep(to);
  };

  const chooseVehicle = (v: Vehicle) => {
    const list = v === 'moto' ? motoOffers : offers;
    const crew = instructors.filter((m) => (v === 'moto') === m.role.includes('A2'));
    setF((x) => ({ ...x, vehicle: v, offer: list[0].id, instructor: crew[0].id }));
  };

  const header = (
    <>
      {step > 0 && !done ? (
        <RoundButton label="Étape précédente" onClick={() => go(step - 1)}>
          <ArrowLeft size={19} />
        </RoundButton>
      ) : (
        <span style={{ width: 44 }} />
      )}
      <strong className={s.topTitle}>{done ? 'C’est fait !' : 'Inscription'}</strong>
      <RoundButton label="Fermer" onClick={closePanel}>
        <X size={18} />
      </RoundButton>
    </>
  );

  const footer = done ? (
    <div className={s.footRow}>
      <button
        className={s.secondary}
        onClick={() => {
          setF(empty);
          go(0);
        }}>
        Inscrire un autre élève
      </button>
      <button className={s.cta} onClick={closePanel}>
        <span>Terminer</span>
        <Check size={20} />
      </button>
    </div>
  ) : (
    <>
      <button className={s.cta} disabled={!valid} onClick={() => go(step + 1)}>
        <span>{step === steps.length - 1 ? `Inscrire ${f.first.trim() || 'l’élève'}` : 'Continuer'}</span>
        {step === steps.length - 1 ? <Check size={20} /> : <ArrowRight size={20} />}
      </button>
      <p className={s.reassure}>
        {step === 0 ? <ShieldCheck size={14} /> : <HeartHandshake size={14} />}
        {step === 0 && !valid ? 'Prénom, nom et e-mail suffisent pour continuer.' : 'Tout reste modifiable depuis la fiche de l’élève.'}
      </p>
    </>
  );

  return (
    <SidePanel open={open} onClose={closePanel} label="Inscrire un élève" width={500} header={header} footer={footer}>
      {!done ? (
        <div className={s.steps}>
          <div className={s.bars}>
            {steps.map((label, i) => (
              <span key={label} className={s.bar}>
                <span style={{ transform: `scaleX(${i <= step ? 1 : 0})` }} />
              </span>
            ))}
          </div>
          <div className={s.stepsText}>
            <strong>
              ÉTAPE {step + 1} SUR {steps.length}
            </strong>
            <span>{steps[step]}</span>
          </div>
        </div>
      ) : null}

      <div key={step} className={`${s.stage} ${dir === 'back' ? s.stageBack : ''}`}>
        {step === 0 ? (
          <>
            <Title title="Faisons connaissance" text="Ces informations servent au dossier ANTS et au contrat de formation." />
            <div className={s.fields}>
              <div className={s.pair}>
                <Field label="Prénom" value={f.first} onChange={(v) => set('first', v)} placeholder="Lucas" autoFocus />
                <Field label="Nom" value={f.last} onChange={(v) => set('last', v)} placeholder="Martin" />
              </div>
              <Field label="Date de naissance" value={f.birth} onChange={(v) => set('birth', v)} placeholder="JJ/MM/AAAA" inputMode="numeric" />
              <Field label="Adresse e-mail" value={f.email} onChange={(v) => set('email', v)} placeholder="lucas.martin@email.fr" type="email" />
              <Field label="Téléphone" value={f.phone} onChange={(v) => set('phone', v)} placeholder="06 12 34 56 78" type="tel" hint="Pour recevoir les rappels de leçon par SMS." />
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Title title="Deux roues ou quatre ?" text="Le permis que l’élève veut passer." />
            <div className={s.list}>
              {vehicles.map((v) => (
                <SelectCard key={v.key} on={f.vehicle === v.key} onClick={() => chooseVehicle(v.key)} className={s.vehicle}>
                  <div className={s.vehicleTop}>
                    <span className={s.bubble}>
                      <v.icon size={30} strokeWidth={1.8} />
                    </span>
                    <Radio on={f.vehicle === v.key} />
                  </div>
                  <div>
                    <strong className={s.cardTitle}>{v.title}</strong>
                    <span className={s.cardText}>{v.subtitle}</span>
                  </div>
                  <span className={s.tags}>{v.tags}</span>
                </SelectCard>
              ))}
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Title title="À chacun sa route." text="La formule de départ, ajustable à tout moment." />
            <div className={s.list}>
              {offerList.map((o, i) => (
                <SelectCard key={o.id} on={offer.id === o.id} onClick={() => set('offer', o.id)} className={s.offer}>
                  <div className={s.offerHead}>
                    <strong className={s.offerName}>{o.name}</strong>
                    {i === 0 ? <span className={s.pick}>LE PLUS CHOISI</span> : <Radio on={offer.id === o.id} />}
                  </div>
                  <span className={s.cardText}>{o.detail}</span>
                  <div className={s.offerFoot}>
                    <strong className={s.price}>{euro(o.price)}</strong>
                    <span className={s.cardText}>{o.students} élèves cette année</span>
                  </div>
                </SelectCard>
              ))}
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Title title={`Le bon rythme,\nc’est le sien.`} text="Moniteur, objectif et paiement." />
            <Group label="Moniteur référent">
              <div className={s.coaches}>
                {team.map((m) => (
                  <SelectCard key={m.id} on={coach.id === m.id} onClick={() => set('instructor', m.id)} className={s.coach}>
                    <Avatar name={m.name} size={44} />
                    <span className={s.coachText}>
                      <strong>{m.name}</strong>
                      <span>{m.load > 0.8 ? 'Agenda bien rempli' : 'Des créneaux libres'}</span>
                    </span>
                    {coach.id === m.id ? <Check size={17} className={s.check} /> : null}
                  </SelectCard>
                ))}
              </div>
            </Group>
            <Group label="Objectif permis">
              <div className={s.chips}>
                {months.map((m) => (
                  <button key={m} className={`${s.chip} ${f.goal === m ? s.chipOn : ''}`} onClick={() => set('goal', m)}>
                    {f.goal === m ? <CalendarDays size={15} /> : null}
                    {m}
                  </button>
                ))}
              </div>
            </Group>
            <Group label="Paiement">
              <div className={s.segment}>
                {payments.map((p) => (
                  <button key={p.key} className={f.pay === p.key ? s.segmentOn : ''} onClick={() => set('pay', p.key)}>
                    {p.label}
                  </button>
                ))}
              </div>
            </Group>
            <div className={s.advice}>
              <Sparkles size={20} />
              <div>
                <strong>
                  {offer.name} · {euro(offer.price)}
                </strong>
                <span>
                  {f.pay === 1 ? 'Réglé en une fois à la signature du contrat.' : `${f.pay} échéances de ${euro(Math.round((offer.price / f.pay) * 100) / 100)}, la première à la signature.`}
                </span>
              </div>
            </div>
          </>
        ) : null}

        {done ? (
          <div className={s.done}>
            <span className={s.success}>
              <Check size={38} strokeWidth={2.6} />
            </span>
            <h2 className={s.title}>Bienvenue, {f.first.trim()} !</h2>
            <p className={s.lead}>Son espace Virage est prêt, ses accès partent par e-mail.</p>
            <div className={s.summary}>
              <Row label="Formule" value={offer.name} />
              <Row label="Moniteur" value={coach.name} />
              <Row label="Objectif" value={f.goal} />
              <Row label="Paiement" value={f.pay === 1 ? euro(offer.price) : `${f.pay} × ${euro(Math.round((offer.price / f.pay) * 100) / 100)}`} />
            </div>
            <div className={s.mail}>
              <span className="tone-success">
                <Mail size={17} />
              </span>
              <span>
                Invitation envoyée à <strong>{f.email}</strong>
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </SidePanel>
  );
}

function Title({ title, text }: { title: string; text: string }) {
  return (
    <div className={s.head}>
      <h2 className={s.title}>{title}</h2>
      <p className={s.lead}>{text}</p>
    </div>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={s.group}>
      <span className={s.label}>{label}</span>
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  ...props
}: { label: string; hint?: string; value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <label className={s.field}>
      <span className={s.label}>{label}</span>
      <input className={s.input} value={value} onChange={(e) => onChange(e.target.value)} {...props} />
      {hint ? <span className={s.hint}>{hint}</span> : null}
    </label>
  );
}

function SelectCard({ on, onClick, className, children }: { on: boolean; onClick: () => void; className?: string; children: ReactNode }) {
  return (
    <button type="button" className={`${s.select} ${on ? s.selectOn : ''} ${className ?? ''}`} onClick={onClick} aria-pressed={on}>
      {children}
    </button>
  );
}

function Radio({ on }: { on: boolean }) {
  return <span className={`${s.radio} ${on ? s.radioOn : ''}`} />;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className={s.row}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
