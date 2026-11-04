import { router } from 'expo-router';
import { LockKeyhole, MessageCircle, User } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';

import { AnimatedBar, ListCard, PressableScale, SectionLabel, StatStrip } from '@/components/blocks';
import { DetailList, SidePanel } from '@/components/panel';
import { Avatar, Button, Chips, Intro, Row, Screen, TopBar } from '@/components/ui';
import { plannedStudents } from '@/data/mock';
import { colors, font, toneColors } from '@/theme';

type Student = (typeof plannedStudents)[number];

const isToday = (s: Student) => s.next.startsWith('Aujourd');
const nearExam = (s: Student) => s.progress >= 0.75;

/** Accès limité : uniquement les élèves planifiés avec ce moniteur */
export default function MoniteurEleves() {
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState<Student | null>(null);

  const today = plannedStudents.filter(isToday);
  const near = plannedStudents.filter(nearExam);
  const list = filter === 'today' ? today : filter === 'near' ? near : plannedStudents;

  return (
    <Screen withTabBar>
      <TopBar title="Élèves" back={false} />
      <Intro title="Mes élèves" description="Les élèves que vous avez au planning cette semaine et la suivante." />

      <Animated.View entering={FadeInDown.duration(360)}>
        <StatStrip
          items={[
            { label: 'Élèves suivis', value: `${plannedStudents.length}`, onPress: () => setFilter('all') },
            { label: 'Vus aujourd’hui', value: `${today.length}`, tone: 'primary', onPress: () => setFilter('today') },
            { label: 'Bientôt prêts', value: `${near.length}`, tone: 'success', onPress: () => setFilter('near') },
          ]}
        />
      </Animated.View>

      <View style={{ gap: 12 }}>
        <Chips
          value={filter}
          onChange={setFilter}
          items={[
            { key: 'all', label: 'Tous', count: plannedStudents.length },
            { key: 'today', label: 'Aujourd’hui', count: today.length },
            { key: 'near', label: 'Bientôt l’examen', count: near.length },
          ]}
        />
        <SectionLabel count={list.length}>{filter === 'today' ? 'Au planning aujourd’hui' : filter === 'near' ? 'Proches de l’examen' : 'Tous les élèves'}</SectionLabel>
        <Animated.View layout={LinearTransition.duration(220)}>
          <ListCard>
            {list.map((s, i) => (
              <Animated.View key={s.id} entering={FadeIn.delay(i * 40).duration(220)}>
                {i > 0 ? <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 66 }} /> : null}
                <StudentRow s={s} onPress={() => setOpen(s)} />
              </Animated.View>
            ))}
          </ListCard>
        </Animated.View>
      </View>

      <Row gap={8} style={{ padding: 12, borderRadius: 14, backgroundColor: colors.primarySoft }}>
        <LockKeyhole size={16} color={colors.primary} />
        <Text style={[font.small, { flex: 1, color: colors.primaryStrong }]}>Accès limité aux élèves planifiés. Les données de paiement ne sont pas visibles.</Text>
      </Row>

      <SidePanel
        open={!!open}
        onClose={() => setOpen(null)}
        icon={User}
        title={open?.name ?? ''}
        subtitle={open?.licence}
        footer={
          open ? (
            <>
              <Button label="Fiche complète et livret" onPress={() => (setOpen(null), router.push(`/moniteur/eleve/${open.id}`))} />
              <Button variant="secondary" icon={MessageCircle} label="Envoyer un message" onPress={() => (setOpen(null), router.push('/moniteur/conversation/julie'))} />
            </>
          ) : null
        }>
        {open ? (
          <>
            <View style={{ gap: 8 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={font.h3}>Progression</Text>
                <Text style={[font.h3, { color: barTone(open.progress).fg }]}>{Math.round(open.progress * 100)} %</Text>
              </Row>
              <AnimatedBar value={open.progress} color={barTone(open.progress).fg} height={8} delay={150} />
            </View>
            <DetailList
              rows={[
                { label: 'Heures de conduite', value: open.hours },
                { label: 'Prochaine leçon', value: open.next, tone: isToday(open) ? 'primary' : undefined },
                { label: 'Niveau', value: nearExam(open) ? 'Prêt pour l’examen blanc' : 'En formation', tone: nearExam(open) ? 'success' : undefined },
              ]}
            />
          </>
        ) : null}
      </SidePanel>
    </Screen>
  );
}

const barTone = (p: number) => (p >= 0.75 ? toneColors.success : toneColors.primary);

function StudentRow({ s, onPress }: { s: Student; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} scale={0.98} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 12 }}>
      <Avatar name={s.name} size={42} tone={nearExam(s) ? 'success' : 'primary'} />
      <View style={{ flex: 1, gap: 6 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={font.h3} numberOfLines={1}>
            {s.name}
          </Text>
          <Text style={[font.small, { fontWeight: '700', color: colors.ink }]}>{s.hours}</Text>
        </Row>
        <AnimatedBar value={s.progress} color={barTone(s.progress).fg} height={4} delay={200} />
        <Text style={[font.tiny, isToday(s) && { color: colors.primary, fontWeight: '600' }]} numberOfLines={1}>
          {s.next}
        </Text>
      </View>
    </PressableScale>
  );
}
