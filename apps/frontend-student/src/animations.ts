/**
 * Global Animated values shared across screens.
 * Import directly — no context/hooks overhead.
 */
import { Animated } from 'react-native';

/** Tab bar vertical translate: 0 = visible, >0 = hidden below screen */
export const tabBarScrollAnim = new Animated.Value(0);
