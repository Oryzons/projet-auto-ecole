import { ArrowUpRight, CalendarPlus, Car, Flag, FolderCheck, MapPin, MessageCircle, TriangleAlert, Trophy, UserPlus, UsersRound, Wallet, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

import { adminKpis, instructors, planningGrid, school } from '@virage/shared/mock';

import { CountUp } from '@/components/dashboard/count-up';
import { DocsReview } from '@/components/dashboard/docs-review';
import { OpenPanel, PageTop } from '@/components/page-top';
import { Avatar } from '@/components/ui';

import s from './dashboard.module.css';

// la date du jour est calculée à chaque visite
export const dynamic = 'force-dynamic';

const MONTH_GOAL = 60000;

/** Leçons en cours : le créneau de 10 h de chaque moniteur présent */
const onTheRoad = instructors
  .map((m) => ({ m, slot: planningGrid[m.id]?.['10'] ?? planningGrid[m.id]?.['09'] }))
  .filter((x): x is { m: (typeof instructors)[number]; slot: { student: string; type?: string } } => !!x.slot && x.slot !== 'off');

export default function Dashboard() {
  const k = adminKpis;
  const date = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
  const present = instructors.filter((m) => m.today !== 'Absent').length;

  return (
    <div className={s.page}>
      <PageTop eyebrow={date} title="Ça roule, Sophie ?" />

      {/* Carte principale, comme sur l'app : la journée de l'auto-école */}
      <section className={s.hero} style={{ ['--i' as string]: 1 }}>
        <div className={s.heroText}>
          <p className={s.heroEyebrow}>
            {school.name.toUpperCase()} · {school.city.toUpperCase()}
          </p>
          <h2 className={s.heroTitle}>
            {k.lessonsToday} leçons
            <br />
            sur la route aujourd’hui.
          </h2>
          <div className={s.heroPills}>
            <span>
              <UsersRound size={14} /> {present} moniteurs sur {instructors.length}
            </span>
            <span>
              <Car size={14} /> {onTheRoad.length} voitures en leçon
            </span>
            <span>
              <Flag size={14} /> Objectif d’octobre à {Math.round((k.revenueMonth / MONTH_GOAL) * 100)} %
            </span>
          </div>
        </div>
      </section>

      {/* Les chiffres clés */}
      <section className={s.section} style={{ ['--i' as string]: 2 }}>
        <div className={s.sectionHead}>
          <h2 className={s.sectionTitle}>Chaque chiffre compte</h2>
          <Link href="/finances" className={s.link}>
            Tout voir
          </Link>
        </div>
        <div className={s.stats}>
          <Stat icon={Wallet} label="Chiffre d’affaires" value={<CountUp value={k.revenueMonth} format="euro" />} caption={`${k.revenueDelta} · objectif ${MONTH_GOAL / 1000} k€`} progress={k.revenueMonth / MONTH_GOAL} action="Voir les finances" href="/finances" />
          <Stat icon={TriangleAlert} tone="danger" label="Impayés" value={<CountUp value={k.unpaid} format="euro" />} caption={`${k.unpaidCount} élèves à relancer`} progress={k.unpaid / k.revenueMonth} action="Relancer" href="/finances" />
          <Stat icon={UsersRound} label="Élèves actifs" value={<CountUp value={k.activeStudents} />} unit="élèves" caption={`${k.docsToReview} dossiers à vérifier`} progress={0.74} action="Voir les élèves" href="/eleves" />
          <Stat icon={Trophy} tone="success" label="Réussite" value={<CountUp value={Math.round(k.successRate * 100)} />} unit="%" caption="Moyenne nationale : 59 %" progress={k.successRate} action="Voir les examens" href="/examens" />
        </div>
      </section>

      <div className={s.columns}>
        {/* Leçons en cours */}
        <section className={s.section} style={{ ['--i' as string]: 3 }}>
          <div className={s.sectionHead}>
            <h2 className={s.sectionTitle}>En ce moment sur la route</h2>
            <Link href="/planning" className={s.link}>
              Planning
            </Link>
          </div>
          <div className={s.card}>
            {onTheRoad.map(({ m, slot }, i) => (
              <div key={m.id} className={s.lesson}>
                {i > 0 ? <span className={s.divider} /> : null}
                <div className={s.dateBox}>
                  <strong>10:00</strong>
                  <span>11:00</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={s.strong}>
                    {slot.student} · {slot.type ?? 'Conduite'}
                  </div>
                  <div className="small">
                    Avec {m.name} · {m.vehicle.split(' · ')[0]}
                  </div>
                  <div className={s.lessonTrack}>
                    <span style={{ animationDelay: `${i * 0.15}s` }} />
                  </div>
                </div>
                <span className={s.live}>EN COURS</span>
              </div>
            ))}
            <div className={s.lessonFoot}>
              <MapPin size={15} />
              <span>Agence Lyon République</span>
              <Link href="/planning" className={s.link} style={{ marginLeft: 'auto' }}>
                Gérer
              </Link>
            </div>
          </div>
        </section>

        <div style={{ ['--i' as string]: 4 }} className={s.reveal}>
          <DocsReview />
        </div>
      </div>

      {/* Raccourcis */}
      <section className={s.section} style={{ ['--i' as string]: 5 }}>
        <h2 className={s.sectionTitle}>À portée de main</h2>
        <div className={s.shortcuts}>
          <OpenPanel panel="inscription" className={`${s.shortcut} ${s.shortcutPrimary}`}>
            <UserPlus size={22} strokeWidth={1.8} />
            <span>Inscrire un élève</span>
          </OpenPanel>
          <Shortcut icon={CalendarPlus} label="Planifier" href="/planning" />
          <Shortcut icon={FolderCheck} label="Documents" href="/documents" />
          <Shortcut icon={MessageCircle} label="Messages" href="/messages" />
        </div>
      </section>

      <div className={s.team} style={{ ['--i' as string]: 6 }}>
        {instructors.map((m) => (
          <Avatar key={m.id} name={m.name} size={28} />
        ))}
        <span className="small">{present} moniteurs disponibles aujourd’hui</span>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  tone = 'primary',
  label,
  value,
  unit,
  caption,
  progress,
  action,
  href,
}: {
  icon: LucideIcon;
  tone?: 'primary' | 'danger' | 'success';
  label: string;
  value: React.ReactNode;
  unit?: string;
  caption: string;
  progress: number;
  action: string;
  href: string;
}) {
  return (
    <Link href={href} className={s.stat}>
      <div className={s.statLabel}>
        <Icon size={17} strokeWidth={1.8} />
        <span>{label}</span>
      </div>
      <div>
        <div className={s.bigValue}>
          {value} {unit ? <span className={s.unit}>{unit}</span> : null}
        </div>
        <div className="small">{caption}</div>
      </div>
      <div className={s.track}>
        <span style={{ width: `${Math.min(1, progress) * 100}%`, background: `var(--${tone})` }} />
      </div>
      <div className={s.statAction}>
        <span>{action}</span>
        <ArrowUpRight size={15} />
      </div>
    </Link>
  );
}

function Shortcut({ icon: Icon, label, href }: { icon: LucideIcon; label: string; href: string }) {
  return (
    <Link href={href} className={s.shortcut}>
      <Icon size={22} strokeWidth={1.8} />
      <span>{label}</span>
    </Link>
  );
}
