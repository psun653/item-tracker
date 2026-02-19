import React from 'react';
import { StyleSheet, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

interface ScreenBackgroundProps extends ViewProps {
    children: React.ReactNode;
}

export const ScreenBackground: React.FC<ScreenBackgroundProps> = ({ children, style, ...props }) => {
    const { colors } = useTheme();

    return (
        <LinearGradient
            colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
            style={[styles.container, style]}
            {...props}
        >
            {children}
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
