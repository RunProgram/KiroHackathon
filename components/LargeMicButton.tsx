/**
 * LargeMicButton — oversized microphone button with animated recording state.
 *
 * Requirements: 2.1, 2.2, 8.8
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

const BUTTON_SIZE = 120;

interface LargeMicButtonProps {
  isRecording: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

export function LargeMicButton({
  isRecording,
  onPress,
  accessibilityLabel,
}: LargeMicButtonProps): React.JSX.Element {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isRecording) {
      animationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      animationRef.current.start();
    } else {
      animationRef.current?.stop();
      pulseAnim.setValue(1);
    }

    return () => {
      animationRef.current?.stop();
    };
  }, [isRecording, pulseAnim]);

  const backgroundColor = isRecording ? Colors.red : Colors.deepNavy;
  const label = accessibilityLabel ?? (isRecording ? 'Stop recording' : 'Start recording');

  return (
    <Animated.View style={[styles.animatedWrapper, { opacity: pulseAnim }]}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor }]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: isRecording }}
      >
        <Text style={styles.icon}>🎤</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedWrapper: {
    alignSelf: 'center',
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Typography.minTouchTarget,
  },
  icon: {
    fontSize: 48,
  },
});
