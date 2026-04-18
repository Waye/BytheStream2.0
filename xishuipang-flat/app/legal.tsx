import React from 'react';
import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useTheme, spacing, fontSize, radius } from '../lib/theme';
import { TopNav, IconButton } from '../lib/ui';

const LEGAL_CN = [
  '1. 本刊（网站）宗旨是透过这份教会性的杂志来分享神在弟兄姊妹中的作为，并通过互联网络让更多的能读中文的人们阅读到本刊，包括中国大陆亿万的同胞们，把神在弟兄姐妹们身上的信望爱分享开来，以期吸引众人归向耶稣基督。',
  '2. 本刊（网站）有权根据中国、加拿大及其他国家相关法律、法规要求和基督教的立场，对部分文章所涉及的敏感文字进行删改。',
  '3. 本刊（网站）刊登文章均为可确认作者的文章。文章责任作者自负，文中观点不一定代表本刊（本网站）。',
  '4. 本着广传福音的宗旨，欢迎转载，但严禁把转载内容以任何形式用于商业用途。请事先电邮至 cgc_pen@yahoo.com 所欲转载的文章标题和文章所在期号，我们将代为征得作者书面同意，然后同意转载。转载时请注明文章源于《溪水旁》www.xishuipang.com 并注明文章作者。若本刊转载其他出版物（网站）的文章，也需征得对方书面同意。',
];

const LEGAL_EN = [
  '1. The goal of church supported magazine By the Streams, as well as its corresponding website, is to share God\'s works among brothers and sisters. This magazine intends to reach Chinese readers, including billions of fellow Chinese in China, via the Internet. It then shares God\'s faith, hope, and love that brothers and sisters experience. In doing so, it brings people to Jesus Christ.',
  '2. This magazine and website reserve the right to amend and omit sensitive words and phrases in articles, according to relevant Christian doctrines, as well as laws and regulations in China, Canada, and other countries.',
  '3. All articles published in this magazine must contain identifiable authors. Authors are responsible for their own words and actions. The views of the articles do not necessarily represent those of this magazine and website.',
  '4. For the sake of spreading the Gospel of Christ, this magazine welcomes reproductions of its articles. However, the editorial board strictly prohibits their commercial use in any manner. Please request permission by sending e-mails to cgc_pen@yahoo.com and indicate the volume number, issue number, and the article\'s title. The editorial board will permit reproductions when it receives the author\'s written permission. Please cite By the Streams or its corresponding website, www.xishuipang.com, as the source in the reproduced article. Furthermore, reproduced articles must cite the name of the original author. If this magazine reproduces articles from other publications and websites, it must seek the other party\'s written permission.',
];

export default function LegalPage() {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const pad = isMobile ? spacing.lg : spacing.xl;

  const goBack = () => { if (router.canGoBack?.()) router.back(); else router.replace('/'); };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bgCanvas }}>
      <TopNav onLogoPress={() => router.push('/')} onLoginPress={() => router.push('/login')}
        onSearchSubmit={(q) => router.push(`/search?q=${encodeURIComponent(q)}`)} />
      <ScrollView style={{ flex: 1 }}
        contentContainerStyle={{
          maxWidth: 780, width: '100%', alignSelf: 'center',
          paddingHorizontal: pad, paddingTop: pad,
          paddingBottom: isMobile ? 100 : spacing.xl * 3,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
          <IconButton icon="←" onPress={goBack} />
          <Text style={{ fontSize: fontSize.small, color: theme.textSecondary, fontWeight: '600' }}>返回</Text>
        </View>

        <Text style={{
          fontSize: isMobile ? 26 : 36, fontWeight: '700',
          letterSpacing: -1, color: theme.textPrimary, marginBottom: spacing.md,
        }}>《溪水旁》法律声明</Text>
        <Text style={{ fontSize: fontSize.caption, color: theme.textMuted, marginBottom: spacing.xxl }}>
          二〇〇六年十二月六日
        </Text>

        {LEGAL_CN.map((p, i) => (
          <Text key={`cn-${i}`} style={{
            fontSize: fontSize.body, lineHeight: fontSize.body * 1.8,
            color: theme.textPrimary, marginBottom: spacing.lg,
          }}>{p}</Text>
        ))}

        <View style={{ height: 1, backgroundColor: theme.borderSoft, marginVertical: spacing.xxl }} />

        <Text style={{
          fontSize: isMobile ? 20 : 26, fontWeight: '700',
          color: theme.textPrimary, marginBottom: spacing.lg,
        }}>By the Streams Policy</Text>
        <Text style={{ fontSize: fontSize.caption, color: theme.textMuted, marginBottom: spacing.xxl }}>
          December 27, 2006
        </Text>

        {LEGAL_EN.map((p, i) => (
          <Text key={`en-${i}`} style={{
            fontSize: fontSize.body, lineHeight: fontSize.body * 1.7,
            color: theme.textPrimary, marginBottom: spacing.lg,
          }}>{p}</Text>
        ))}

        <View style={{
          marginTop: spacing.xxl, paddingTop: spacing.xl,
          borderTopWidth: 1, borderTopColor: theme.borderSoft,
        }}>
          <Text style={{ fontSize: fontSize.caption, color: theme.textMuted }}>
            多伦多华人福音堂{'\n'}© 2005–2026 Chinese Gospel Church of Toronto
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
