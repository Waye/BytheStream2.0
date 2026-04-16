import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Placeholder } from '../../lib/ui';
export default function Page() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Placeholder title={`文章 #${id}`} route={`/article/${id}`} />;
}
