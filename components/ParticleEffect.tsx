import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Particle {
  id: number;
  animation: Animated.Value;
  x: number;
  y: number;
  scale: Animated.Value;
}

interface ParticleEffectProps {
  visible: boolean;
}

const ParticleEffect: React.FC<ParticleEffectProps> = ({ visible }) => {
  const particles = useRef<Particle[]>([]);
  
  useEffect(() => {
    if (visible) {
      // Create multiple particles
      particles.current = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        animation: new Animated.Value(0),
        x: Math.random() * width,
        y: height / 2,
        scale: new Animated.Value(0),
      }));

      // Animate particles
      particles.current.forEach((particle, index) => {
        Animated.parallel([
          Animated.timing(particle.animation, {
            toValue: 1,
            duration: 2000 + index * 100,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(particle.scale, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: 0,
              duration: 1800,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {particles.current.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              left: particle.x,
              top: particle.y,
              transform: [
                {
                  translateY: particle.animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -height],
                  }),
                },
                {
                  scale: particle.scale,
                },
              ],
              opacity: particle.animation.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1, 1, 0],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
});

export default ParticleEffect;