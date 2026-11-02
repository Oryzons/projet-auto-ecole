import { CalendarOff, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';

import { DayTimeline, ListCard, SectionLabel, StatStrip } from '@/components/blocks';
import { SidePanel } from '@/components/panel';
import { Badge, Button, Chips, Field, Intro, Row, Screen, Toggle, TopBar } from '@/components/ui';
import { absences as initialAbsences, weekAvailability } from '@/data/mock';
import { colors, font, type Tone } from '@/theme';

/** « 08:00 – 12:00 · 14:00 – 19:00 » → blocs pour la frise */
const blocksOf = (slots: string) =>
  slots
    .split(' · ')
    .map((s) => s.split(' – '))
    .filter((p) => p.length === 2)
    .map(([start, end]) => ({ start, end }));

const hoursOf = (slots: string) =>
  blocksOf(slots).reduce((n, b) => n + (Number(b.end.slice(0, 2)) * 60 + Number(b.end.slice(3)) - Number(b.start.slice(0, 2)) * 60 - Number(b.start.slice(3))) / 60, 0);

const kinds = [
  { key: 'conges', label: 'Congés' },
  { key: 'maladie', label: 'Maladie' },
  { key: 'formation', label: 'Formation' },
  { key: 'autre', label: 'Autre' },
];

/** Gestion des disponibilités et des absences */
export default function MoniteurDisponibilites() {
  const [week, setWeek] = useState(() => weekAvailability.map((d) => !d.off));
  const [absences, setAbsences] = useState<{ id: string; label: string; range: string; status: string; tone: Tone }[]>(initialAbsences);
  const [declare, setDeclare] = useState(false);
  const [kind, setKind] = useState('conges');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const openDays = week.filter(Boolean).length;
  const openHours = weekAvailability.reduce((n, d, i) => n + (week[i] ? hoursOf(d.slots) : 0), 0);
  const pending = absences.filter((a) => a.tone === 'warning').length;

  const submit = () => {
    const label = kinds.find((k) => k.key === kind)!.label;
    setAbsences((a) => [...a, { id: `n${a.length}`, label, range: from && to ? `${from} → ${to}` : from || 'Date à préciser', status: 'En attente', tone: 'warning' }]);
    setDeclare(false);
    setFrom('');
    setTo('');
  };

  return (
    <Screen withTabBar>
      <TopBar title="Disponibilités" back={false} />
      <Intro title="Mes disponibilités" description="Vos créneaux sont proposés aux élèves pour la réservation." />

      <Animated.View entering={FadeInDown.duration(360)}>
        <StatStrip
          items={[
            { label: 'Heures ouvertes', value: `${openHours} h`, tone: 'primary' },
            { label: 'Jours travaillés', value: `${openDays}` },
            { label: 'Absences à valider', value: `${pending}`, tone: pending ? 'warning' : 'neutral' },
          ]}
        />
      </Animated.View>

      <View style={{ gap: 10 }}>
        <SectionLabel>Semaine type</SectionLabel>
        <ListCard style={{ paddingHorizontal: 14, paddingVertical: 6 }}>
          {weekAvailability.map((d, i) => (
            <View key={d.day} style={[{ paddingVertical: 12, gap: 10 }, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <Row>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={font.h3}>{d.day}</Text>
                  <Text style={[font.tiny, !week[i] && { color: colors.faint }]}>{week[i] ? `${d.slots} · ${hoursOf(d.slots)} h` : 'Indisponible'}</Text>
                </View>
                <Toggle value={week[i]} onChange={(v) => setWeek((w) => w.map((x, k) => (k === i ? v : x)))} />
              </Row>
              {week[i] && !d.off ? (
                <Animated.View entering={FadeIn.duration(220)}>
                  <DayTimeline blocks={blocksOf(d.slots).map((b) => ({ ...b, color: colors.success }))} start={8} end={20} />
                </Animated.View>
              ) : null}
            </View>
          ))}
        </ListCard>
      </View>

      <View style={{ gap: 10 }}>
        <SectionLabel count={absences.length}>Absences et congés</SectionLabel>
        <Animated.View layout={LinearTransition.duration(220)}>
          <ListCard style={{ paddingHorizontal: 14, paddingVertical: 4 }}>
            {absences.map((a, i) => (
              <Animated.View key={a.id} entering={FadeInDown.duration(260)}>
                <Row style={[{ paddingVertical: 12 }, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <View style={{ width: 3, height: 32, borderRadius: 2, backgroundColor: a.tone === 'success' ? colors.success : colors.warning }} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={font.h3}>{a.label}</Text>
                    <Text style={font.tiny}>{a.range}</Text>
                  </View>
                  <Badge label={a.status} tone={a.tone} />
                </Row>
              </Animated.View>
            ))}
          </ListCard>
        </Animated.View>
        <Button variant="secondary" icon={Plus} label="Déclarer une absence" onPress={() => setDeclare(true)} />
      </View>

      <SidePanel
        open={declare}
        onClose={() => setDeclare(false)}
        icon={CalendarOff}
        tone="warning"
        title="Déclarer une absence"
        subtitle="L’administration la valide, puis vos créneaux sont retirés du planning."
        footer={<Button label="Envoyer la demande" onPress={submit} />}>
        <View style={{ gap: 10 }}>
          <SectionLabel>Motif</SectionLabel>
          <Chips items={kinds} value={kind} onChange={setKind} />
        </View>
        <Field label="Du" placeholder="ex. 13 nov. 2026" value={from} onChangeText={setFrom} />
        <Field label="Au" placeholder="ex. 15 nov. 2026" value={to} onChangeText={setTo} hint="Laissez vide pour une seule journée." />
      </SidePanel>
    </Screen>
  );
}
