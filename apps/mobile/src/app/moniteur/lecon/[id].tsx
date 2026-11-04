import { router, useLocalSearchParams } from 'expo-router';
import { Check, CircleCheck, Clock3, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

import { AnimatedBar, SectionLabel, StatStrip } from '@/components/blocks';
import { RemcGrid } from '@/components/remc';
import { Avatar, Badge, Button, Card, Chip, Row, Screen, TopBar } from '@/components/ui';
import { instructorWeek as instructorLessons } from '@/data/mock';
import { colors, font, radius } from '@/theme';

const worked = ['Démarrage en côte', 'Créneau', 'Ronds-points', 'Insertion', 'Contrôles visuels', 'Écoconduite'];
const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** Compte rendu après chaque leçon + compétences REMC travaillées */
export default function MoniteurCompteRendu() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const l = instructorLessons.find((x) => x.id === id) ?? instructorLessons[0];
  const [tags, setTags] = useState<string[]>(['Créneau', 'Ronds-points']);
  const [presence, setPresence] = useState<'present' | 'absent'>('present');
  const [comment, setComment] = useState('Bonne maîtrise du créneau. Encore un peu d’hésitation à l’entrée des ronds-points : regarder plus tôt à gauche.');
  const [sent, setSent] = useState(false);

  // avancement du compte rendu : présence, points travaillés, commentaire
  const steps = [true, tags.length > 0, comment.trim().length > 10];
  const ready = steps.every(Boolean);
  const duration = minutes(l.end) - minutes(l.start);

  if (sent) {
    return (
      <Screen>
        <TopBar title="Compte rendu" />
        <View style={styles.done}>
          <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.doneIcon}>
            <Check size={30} color="#fff" strokeWidth={2.6} />
          </Animated.View>
          <Animated.Text entering={FadeInDown.delay(120).duration(300)} style={[font.title, { textAlign: 'center' }]}>
            Compte rendu envoyé
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(180).duration(300)} style={[font.body, { color: colors.muted, textAlign: 'center' }]}>
            {l.student} le retrouve dans son application, et son livret REMC est à jour.
          </Animated.Text>
        </View>
        <Animated.View entering={FadeIn.delay(260)}>
          <Button label="Retour à ma journée" onPress={() => router.navigate('/moniteur')} />
        </Animated.View>
      </Screen>
    );
  }

  return (
    <Screen footer={<Button label={ready ? 'Valider le compte rendu' : 'Complétez le compte rendu'} icon={ready ? Check : undefined} variant={ready ? 'primary' : 'secondary'} onPress={() => ready && setSent(true)} />}>
      <TopBar title="Compte rendu" />
      <Animated.View entering={FadeInDown.duration(320)}>
        <Card style={{ gap: 12 }}>
          <Row>
            <Avatar name={l.student ?? ''} />
            <View style={{ flex: 1 }}>
              <Text style={font.h2}>{l.student}</Text>
              <Text style={font.tiny}>{l.vehicle}</Text>
            </View>
            <Badge label={l.type} tone={l.type === 'Examen blanc' ? 'violet' : 'primary'} />
          </Row>
          <Row gap={14}>
            <Row gap={6}>
              <Clock3 size={14} color={colors.muted} />
              <Text style={font.small}>
                {l.start} – {l.end}
              </Text>
            </Row>
            <Row gap={6} style={{ flexShrink: 1 }}>
              <MapPin size={14} color={colors.muted} />
              <Text style={font.small} numberOfLines={1}>
                {l.place}
              </Text>
            </Row>
          </Row>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(60).duration(320)}>
        <StatStrip
          items={[
            { label: 'Durée', value: `${duration} min` },
            { label: 'Heures réalisées', value: `${l.hoursDone} h`, tone: 'primary' },
            { label: 'Points travaillés', value: `${tags.length}`, tone: tags.length ? 'success' : 'warning' },
          ]}
        />
      </Animated.View>

      <View style={{ gap: 8 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={font.small}>Compte rendu complété</Text>
          <Text style={[font.small, { fontWeight: '700', color: ready ? colors.success : colors.ink }]}>
            {steps.filter(Boolean).length} / {steps.length}
          </Text>
        </Row>
        <AnimatedBar value={steps.filter(Boolean).length / steps.length} color={ready ? colors.success : colors.primary} />
      </View>

      <View style={{ gap: 10 }}>
        <SectionLabel>Présence</SectionLabel>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip label="Présent" active={presence === 'present'} onPress={() => setPresence('present')} />
          <Chip label="Absent / retard" active={presence === 'absent'} onPress={() => setPresence('absent')} />
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <SectionLabel count={tags.length}>Points travaillés</SectionLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {worked.map((w) => (
            <Chip key={w} label={w} active={tags.includes(w)} onPress={() => setTags((t) => (t.includes(w) ? t.filter((x) => x !== w) : [...t, w]))} />
          ))}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <SectionLabel>Commentaire pour l’élève</SectionLabel>
        <TextInput
          multiline
          placeholder="Ce qui s’est bien passé, ce qu’il faut retravailler…"
          placeholderTextColor={colors.faint}
          value={comment}
          onChangeText={setComment}
          style={styles.input}
        />
      </View>

      <View style={{ gap: 10 }}>
        <SectionLabel>Compétences REMC</SectionLabel>
        <Row gap={6}>
          <CircleCheck size={14} color={colors.muted} />
          <Text style={[font.small, { flex: 1 }]}>Touchez un niveau pour mettre à jour le livret de l’élève.</Text>
        </Row>
        <RemcGrid editable />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { minHeight: 110, borderRadius: radius.md, borderWidth: 1, borderColor: colors.input, backgroundColor: colors.card, padding: 14, fontSize: 15, color: colors.ink, textAlignVertical: 'top' },
  done: { alignItems: 'center', gap: 12, paddingTop: 60, paddingHorizontal: 12 },
  doneIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
});
