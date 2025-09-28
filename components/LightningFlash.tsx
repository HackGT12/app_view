import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface LightningPath {
  id: number;
  opacity: Animated.Value;
  x: number;
  rotation: number;
}

interface LightningFlashProps {
  visible: boolean;
}

const LightningFlash: React.FC<LightningFlashProps> = ({ visible }) => {
  const flashAnim = useRef(new Animated.Value(0)).current;
  const lightningPaths = useRef<LightningPath[]>([]);

  useEffect(() => {
    if (visible) {
      // Create lightning paths
      lightningPaths.current = Array.from({ length: 5 }, (_, i) => ({
        id: i,
        opacity: new Animated.Value(0),
        x: Math.random() * width,
        rotation: Math.random() * 360,
      }));

      // Flash sequence
      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim, {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Lightning bolt animations
      lightningPaths.current.forEach((path, index) => {
        Animated.sequence([
          Animated.delay(index * 50),
          Animated.timing(path.opacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(path.opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Screen flash */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: '#FFD700',
            opacity: flashAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.3],
            }),
          },
        ]}
      />
      {/* Lightning bolts */}
      {lightningPaths.current.map((path) => (
        <Animated.View
          key={path.id}
          style={[
            styles.lightning,
            {
              left: path.x,
              opacity: path.opacity,
              transform: [{ rotate: `${path.rotation}deg` }],
            },
          ]}
        >
          <Text style={styles.lightningBolt}>⚡</Text>
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  lightning: {
    position: 'absolute',
    top: '20%',
  },
  lightningBolt: {
    fontSize: 50,
    color: '#FFD700',
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
});

export default LightningFlash;