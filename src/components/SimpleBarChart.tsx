import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BarData {
    label: string;
    value: number;
    color?: string;
}

interface SimpleBarChartProps {
    data: BarData[];
    height?: number;
    barColor?: string;
    showValues?: boolean;
    textColor?: string;
}

export const SimpleBarChart = ({
    data,
    height = 150,
    barColor = '#A3B18A',
    showValues = false,
    textColor = '#000'
}: SimpleBarChartProps) => {
    const maxValue = Math.max(...data.map(d => d.value), 1); // Avoid div by 0

    return (
        <View style={[styles.container, { height }]}>
            <View style={styles.barsContainer}>
                {data.map((item, index) => {
                    const barHeight = (item.value / maxValue) * (height - 20); // -20 for labels
                    return (
                        <View key={index} style={styles.barWrapper}>
                            {showValues && (
                                <Text style={[styles.valueText, { color: textColor }]}>
                                    {item.value > 0 ? item.value : ''}
                                </Text>
                            )}
                            <View
                                style={[
                                    styles.bar,
                                    {
                                        height: Math.max(barHeight, 4), // Min height for visibility
                                        backgroundColor: item.color || barColor
                                    }
                                ]}
                            />
                            <Text style={[styles.labelText, { color: textColor }]} numberOfLines={1}>
                                {item.label}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        justifyContent: 'flex-end',
    },
    barsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: '100%',
        gap: 8,
    },
    barWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: '100%',
    },
    bar: {
        width: '100%',
        minWidth: 8,
        maxWidth: 32,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        opacity: 0.8,
    },
    valueText: {
        fontSize: 10,
        marginBottom: 2,
        fontWeight: '500',
    },
    labelText: {
        fontSize: 10,
        marginTop: 4,
        opacity: 0.7,
        textAlign: 'center',
    },
});
