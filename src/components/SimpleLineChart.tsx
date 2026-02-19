import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface LineData {
    label: string;
    value: number;
    startDate?: Date;
    endDate?: Date;
    event?: string;
}

interface SimpleLineChartProps {
    data: LineData[];
    height?: number;
    color?: string;
    showValues?: boolean;
    textColor?: string;
    onPointPress?: (point: LineData) => void;
}

export const SimpleLineChart = ({
    data,
    height = 200,
    color = '#A3B18A',
    showValues = false,
    textColor = '#000',
    onPointPress
}: SimpleLineChartProps) => {
    const [width, setWidth] = React.useState(0);

    // Safety check for data
    if (!data || data.length < 2) return null;

    const values = data.map(d => d.value);
    const rawMax = Math.max(...values);
    const rawMin = Math.min(...values);
    const range = rawMax - rawMin;

    // Shrink logic: if the range is small relative to the height, 
    // center the view around the data.
    let minValue = 0;
    let maxValue = rawMax * 1.2;

    if (rawMin > maxValue / 2 || rawMax < maxValue / 2) {
        // Apply "shrink" - zoom in on the range
        const padding = range === 0 ? rawMax * 0.1 : range * 0.2;
        minValue = Math.max(0, rawMin - padding);
        maxValue = rawMax + padding;
    }

    const valueRange = maxValue - minValue;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - (((d.value - minValue) / valueRange) * height);
        return { x, y, ...d };
    });

    // --- Smooth Curve Logic (Catmull-Rom) ---
    const getCatmullRomPoint = (p0: any, p1: any, p2: any, p3: any, t: number) => {
        const t2 = t * t;
        const t3 = t2 * t;
        const x = 0.5 * (
            (2 * p1.x) +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
        );
        const y = 0.5 * (
            (2 * p1.y) +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
        );
        return { x, y };
    };

    const segments: { x1: number; y1: number; x2: number; y2: number }[] = [];
    if (width > 0) {
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i === 0 ? 0 : i - 1];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[i + 2 >= points.length ? points.length - 1 : i + 2];

            const steps = 10; // Number of tiny segments between each data point
            for (let j = 0; j < steps; j++) {
                const t1 = j / steps;
                const t2 = (j + 1) / steps;
                const pt1 = getCatmullRomPoint(p0, p1, p2, p3, t1);
                const pt2 = getCatmullRomPoint(p0, p1, p2, p3, t2);
                segments.push({ x1: pt1.x, y1: pt1.y, x2: pt2.x, y2: pt2.y });
            }
        }
    }

    return (
        <View
            style={[styles.container, { height }]}
            onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        >
            {width > 0 && (
                <>
                    {/* Grid Lines */}
                    <View style={[styles.gridLine, { top: 0, opacity: 0.1 }]} />
                    <View style={[styles.gridLine, { top: height / 2, opacity: 0.1 }]} />
                    <View style={[styles.gridLine, { top: height, opacity: 0.1 }]} />

                    {/* --- Gradient Fill Under Line --- */}
                    {(() => {
                        // Collect all interpolated curve points (x, y)
                        const curvePoints: { x: number; y: number }[] = [];
                        if (segments.length > 0) {
                            curvePoints.push({ x: segments[0].x1, y: segments[0].y1 });
                            segments.forEach(seg => curvePoints.push({ x: seg.x2, y: seg.y2 }));
                        }

                        // Split the total fill area into 4 bands for opacity gradient
                        const bands = [
                            { relStart: 0, relEnd: 0.25, opacity: 0.30 },
                            { relStart: 0.25, relEnd: 0.50, opacity: 0.18 },
                            { relStart: 0.50, relEnd: 0.75, opacity: 0.09 },
                            { relStart: 0.75, relEnd: 1.00, opacity: 0.03 },
                        ];

                        return bands.map((band, bi) =>
                            curvePoints.slice(0, -1).map((pt, pi) => {
                                const nextPt = curvePoints[pi + 1];
                                const segWidth = Math.max(1, nextPt.x - pt.x);
                                const fillHeight = height - pt.y; // total fill height at this x
                                const bandTop = pt.y + fillHeight * band.relStart;
                                const bandH = fillHeight * (band.relEnd - band.relStart);
                                if (bandH <= 0) return null;
                                return (
                                    <View
                                        key={`fill-${bi}-${pi}`}
                                        style={{
                                            position: 'absolute',
                                            left: pt.x,
                                            top: bandTop,
                                            width: segWidth + 0.5,
                                            height: bandH,
                                            backgroundColor: color,
                                            opacity: band.opacity,
                                        }}
                                    />
                                );
                            })
                        );
                    })()}

                    {/* Smooth Lines */}
                    {segments.map((seg, i) => {
                        const dx = seg.x2 - seg.x1;
                        const dy = seg.y2 - seg.y1;
                        const length = Math.sqrt(dx * dx + dy * dy);
                        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                        return (
                            <View
                                key={`seg-${i}`}
                                style={[
                                    styles.lineSegment,
                                    {
                                        left: seg.x1,
                                        top: seg.y1,
                                        width: length + 0.5, // Tiny overlap to prevent gaps
                                        backgroundColor: color,
                                        transform: [{ rotate: `${angle}deg` }],
                                        // @ts-ignore
                                        transformOrigin: 'left center',
                                    }
                                ]}
                            />
                        );
                    })}

                    {/* Points & Labels */}
                    {points.map((point, i) => {
                        // Logic to show only ~4 labels to avoid crowding
                        let showLabel = true;
                        if (points.length > 6) {
                            const interval = Math.floor(points.length / 3);
                            showLabel = i === 0 || i === points.length - 1 || i % interval === 0;
                            // Ensure we don't show too many if interval is small
                            if (showLabel && i > 0 && i < points.length - 1) {
                                // Simple check to avoid cluster at end
                                if (points.length - i < interval / 2) showLabel = false;
                            }
                        }

                        return (
                            <TouchableOpacity
                                key={`point-${i}`}
                                style={{ position: 'absolute', left: point.x - 20, top: 0, bottom: 0, width: 40, alignItems: 'center', justifyContent: 'center' }}
                                onPress={() => onPointPress?.(point)}
                                activeOpacity={0.6}
                            >
                                <View style={{ position: 'absolute', top: point.y - 3, left: 17 }}>
                                    <View style={[styles.point, { backgroundColor: color }]} />

                                    {showValues && (
                                        <Text style={[styles.valueText, { color: textColor, top: -20, left: -14, width: 40, textAlign: 'center' }]}>
                                            {point.value.toFixed(1)}
                                        </Text>
                                    )}
                                </View>

                                {showLabel && (
                                    <View style={{ position: 'absolute', top: height + 8, width: 60, alignItems: 'center' }}>
                                        <Text style={[styles.labelText, { color: textColor }]} numberOfLines={1}>
                                            {point.label}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </>
            )}
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        width: '100%',
        position: 'relative',
    },
    lineSegment: {
        position: 'absolute',
        height: 2,
        borderRadius: 1,
    },
    point: {
        width: 6,
        height: 6,
        borderRadius: 3,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    gridLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: '#000',
    },
    valueText: {
        position: 'absolute',
        fontSize: 10,
    },
    labelText: {
        fontSize: 10,
        textAlign: 'center',
        opacity: 0.6,
    },
});
