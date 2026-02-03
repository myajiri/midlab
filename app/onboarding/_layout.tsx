import { Stack } from 'expo-router';
import { COLORS } from '../../src/constants';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        contentStyle: { backgroundColor: COLORS.background.dark },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="result"
        options={{ gestureEnabled: true }}
      />
    </Stack>
  );
}
