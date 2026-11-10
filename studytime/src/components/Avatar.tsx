import { Image, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { avatarUri } from '@/utils/avatars';

type Props = { name: string; avatar: string | null; size?: number };

export function Avatar({ name, avatar, size = 40 }: Props) {
  const box = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: colors.secondary,
  };

  if (avatar) {
    return <Image source={{ uri: avatarUri(avatar) }} style={box} />;
  }

  return (
    <View style={[box, { alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ fontSize: size * 0.42, fontWeight: '800', color: colors.primary }}>
        {name.charAt(0).toUpperCase() || '?'}
      </Text>
    </View>
  );
}