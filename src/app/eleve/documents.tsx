import { Camera, CircleCheck, CircleX, FileCheck, FilePlus, Hourglass, Upload } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Badge, Button, Card, IconBox, Intro, Progress, Row, Screen, TopBar } from '@/components/ui';
import { docStatus, documents } from '@/data/mock';
import { colors, font } from '@/theme';

const icons = { accepted: CircleCheck, pending: Hourglass, refused: CircleX, missing: FilePlus };

/** Dépôt et suivi des pièces justificatives */
export default function EleveDocuments() {
  const ok = documents.filter((d) => d.status === 'accepted').length;
  return (
    <Screen>
      <TopBar title="Mon dossier" />
      <Intro title="Pièces justificatives" description="Déposez vos documents en photo ou en PDF. L’équipe les vérifie sous 48 h." />
      <Card style={{ gap: 8 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={font.h3}>
            {ok} sur {documents.length} acceptées
          </Text>
          <Text style={font.small}>{Math.round((ok / documents.length) * 100)} %</Text>
        </Row>
        <Progress value={ok / documents.length} tone="success" />
      </Card>
      <View style={{ gap: 10 }}>
        {documents.map((d) => {
          const s = docStatus[d.status];
          const Icon = icons[d.status];
          return (
            <Card key={d.id} style={{ gap: 12 }}>
              <Row>
                <IconBox icon={d.status === 'accepted' ? FileCheck : FilePlus} tone={s.tone} size={40} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={font.h3}>{d.name}</Text>
                  <Badge label={s.label} tone={s.tone} icon={Icon} />
                </View>
              </Row>
              {d.note ? (
                <View style={{ padding: 10, borderRadius: 10, backgroundColor: colors.dangerSoft }}>
                  <Text style={[font.small, { color: colors.danger }]}>Motif : {d.note}</Text>
                </View>
              ) : null}
              {d.status === 'refused' || d.status === 'missing' ? (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button small variant="secondary" icon={Camera} label="Photo" style={{ flex: 1 }} />
                  <Button small icon={Upload} label="Importer" style={{ flex: 1 }} />
                </View>
              ) : null}
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
