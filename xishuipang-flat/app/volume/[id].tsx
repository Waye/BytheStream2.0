import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Placeholder } from '../../lib/ui';
export default function Page() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Placeholder title={`第 ${id} 期`} route={`/volume/${id}`} />;
}
