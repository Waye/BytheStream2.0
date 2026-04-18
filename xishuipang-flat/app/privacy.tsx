import React from 'react';
import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useTheme, spacing, fontSize } from '../lib/theme';
import { TopNav, IconButton } from '../lib/ui';

const SECTIONS = [
  { title: 'Information we collect', body: 'When you visit www.xishuipang.com website or use our iOS app 溪水旁, we collect anonymous statistics about the location of the request.' },
  { title: 'Technical basics', body: 'We use cookies on the site and similar tokens in the app to keep your preferences about the website. Our server software may also store basic technical information, such as your IP address, in temporary memory or logs.' },
  { title: 'MongoDB', body: 'We use MongoDB as our database and it collects information about connection traffic. The data collected from MongoDB is anonymous and we only use this information for website and app improvement.' },
  { title: 'Google Services', body: 'We use the following Google services for our website: Google Tag Manager, Google Fonts, Google Analytics. We only use Google Analytics to track the amount of users that have visited our website and which region they are from, visitor\'s personal information will never be collected.' },
  { title: 'Information usage', body: 'We use the information we collect to operate and improve our website, apps, and customer support. We do not share personal information with outside parties except to the extent necessary to accomplish 溪水旁\'s functionality. We may share anonymous, aggregate statistics with outside parties, such as how many people have read a particular article.' },
  { title: 'Security', body: 'We do not require any personal data, information, account or password to visit our website or use our app.' },
  { title: 'Third-party links and content', body: '溪水旁 website and app do not display any third-party links or contents.' },
  { title: 'California Online Privacy Protection Act Compliance', body: 'We comply with the California Online Privacy Protection Act. We therefore will not distribute your personal information to outside parties without your consent.' },
  { title: 'Children\'s Online Privacy Protection Act Compliance', body: 'We never collect or maintain information at our website from those we actually know are under 13, and no part of our website is structured to attract anyone under 13.' },
  { title: 'Information for European Union Customers', body: 'By using 溪水旁 and providing your information, you authorize us to collect, use, and store your information outside of the European Union. International Transfers of Information: Information may be processed, stored, and used outside of the country in which you are located. Data privacy laws vary across jurisdictions, and different laws may be applicable to your data depending on where it is processed, stored, or used.' },
  { title: 'Your Consent', body: 'By using our site or apps, you consent to our privacy policy.' },
  { title: 'Contacting Us', body: 'If you have questions regarding this privacy policy, you may email privacy@xishuipang.com.' },
  { title: 'Changes to this policy', body: 'If we decide to change our privacy policy, we will post those changes on this page.\n\n• March 9th, 2018: First published.\n• March 24th, 2023: Added Google Services section.' },
];

export default function PrivacyPage() {
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
        }}>Privacy Policy</Text>
        <Text style={{ fontSize: fontSize.body, color: theme.textSecondary, marginBottom: spacing.xxl, lineHeight: fontSize.body * 1.6 }}>
          This policy applies to all information collected or submitted on Xishuipang.com website and our app 溪水旁 for iPhone and any other devices and platforms.
        </Text>

        {SECTIONS.map((s, i) => (
          <View key={i} style={{ marginBottom: spacing.xl }}>
            <Text style={{
              fontSize: isMobile ? 16 : 18, fontWeight: '700',
              color: theme.textPrimary, marginBottom: spacing.sm,
            }}>{s.title}</Text>
            <Text style={{
              fontSize: fontSize.body, lineHeight: fontSize.body * 1.7,
              color: theme.textSecondary,
            }}>{s.body}</Text>
          </View>
        ))}

        <View style={{
          marginTop: spacing.xl, paddingTop: spacing.xl,
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
