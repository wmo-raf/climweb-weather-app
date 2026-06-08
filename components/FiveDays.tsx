import React, { JSX } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { DateTime } from "luxon";

import DayRow from './DayRow';
import { WeatherData } from '@/lib/forecast/weatherData';
import { useTranslation } from 'react-i18next';

type FiveDaysProps = {
    startDate: DateTime;
    preparedForecast?: WeatherData;
    name: string;
    onClick: (day: DateTime) => void;
}
function FiveDays(props: FiveDaysProps): JSX.Element {
    const { t } = useTranslation();
    const { startDate, preparedForecast } = props

    if (preparedForecast) {
        const allDays = preparedForecast.days()
        const startIndex = allDays.findIndex(day => startDate.hasSame(day, "day"))

        if (startIndex == -1) {
            return (
                <View style={styles.noForecast}>
                    <Text>
                        {t('Forecast not available at the moment. Please try again later.')}
                    </Text>
                </View>
            );
        }

        const fiveDays = allDays.slice(startIndex, startIndex + 5)
        return <View style={styles.fiveDaysWrapper}>
            {fiveDays.map(day =>
                <TouchableOpacity key={day.toLocaleString()} onPress={() => props.onClick(day)}>
                    <DayRow summary={preparedForecast.atDay(day)} />
                </TouchableOpacity>
            )}
        </View>
    }

    return (
        <View style={styles.loading}>
            <Text>{t('Loading')}...</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    noForecast: {
        fontFamily: 'NotoSans-Regular',
        paddingLeft: 12,
        paddingRight: 12,
        marginTop: 40,
    },
    loading: {
        fontFamily: 'NotoSans-Regular',
        paddingLeft: 12,
        paddingRight: 12,
        marginTop: 40,
    },
    fiveDaysWrapper: {
        paddingLeft: 27,
        paddingRight: 26,
        marginTop: 60,
        paddingBottom: 50,
    },
});

export default FiveDays;
