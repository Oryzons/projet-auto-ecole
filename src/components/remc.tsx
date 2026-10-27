import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Badge, Card, Divider, Progress } from '@/components/ui';
import { remc, skillLevels, type SkillLevel } from '@/data/mock';
import { colors, font, toneColors } from '@/theme';

/** Grille de progression REMC (4 compétences, sous-compétences évaluées) */
export function RemcGrid({ editable = false }: { editable?: boolean }) {
  const [open, setOpen] = useState<string | null>('c1');
  const [levels, setLevels] = useState(() => remc.map((c) => c.items.map((i) => i.level)));

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {skillLevels.map((l) => (
          <Badge key={l.label} label={l.label} tone={l.tone} />
        ))}
      </View>
      {remc.map((c, ci) => {
        const score = levels[ci].reduce<number>((a, l) => a + l, 0) / (levels[ci].length * 3);
        const isOpen = open === c.id;
        return (
          <Card key={c.id} style={{ padding: 0, overflow: 'hidden' }}>
            <Pressable onPress={() => setOpen(isOpen ? null : c.id)} style={{ padding: 16, gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.ink }}>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>{c.code}</Text>
                </View>
                <Text style={[font.h3, { flex: 1, fontSize: 14 }]} numberOfLines={isOpen ? undefined : 2}>
                  {c.title}
                </Text>
                {isOpen ? <ChevronUp size={18} color={colors.faint} /> : <ChevronDown size={18} color={colors.faint} />}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Progress value={score} tone={score > 0.75 ? 'success' : 'primary'} />
                </View>
                <Text style={[font.tiny, { fontWeight: '700' }]}>{Math.round(score * 100)} %</Text>
              </View>
            </Pressable>
            {isOpen ? (
              <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                {c.items.map((item, ii) => {
                  const lvl = levels[ci][ii];
                  return (
                    <View key={item.label}>
                      <Divider />
                      <View style={{ paddingVertical: 12, gap: 8 }}>
                        <Text style={[font.body, { fontSize: 14 }]}>{item.label}</Text>
                        {editable ? (
                          <View style={{ flexDirection: 'row', gap: 6 }}>
                            {skillLevels.map((l, li) => {
                              const on = lvl === li;
                              const t = toneColors[l.tone];
                              return (
                                <Pressable
                                  key={l.label}
                                  onPress={() =>
                                    setLevels((prev) => prev.map((row, r) => (r === ci ? row.map((v, k) => (k === ii ? (li as SkillLevel) : v)) : row)))
                                  }
                                  style={{
                                    flex: 1,
                                    paddingVertical: 7,
                                    borderRadius: 8,
                                    alignItems: 'center',
                                    backgroundColor: on ? t.fg : colors.subtle,
                                    borderWidth: 1,
                                    borderColor: on ? t.fg : colors.border,
                                  }}>
                                  <Text style={{ fontSize: 10.5, fontWeight: '700', color: on ? '#fff' : colors.muted }}>{l.label}</Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        ) : (
                          <Badge label={skillLevels[lvl].label} tone={skillLevels[lvl].tone} />
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </Card>
        );
      })}
    </View>
  );
}
