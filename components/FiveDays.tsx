import React, { JSX } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { DateTime } from "luxon";

import DayRow from './DayRow';
import { ForecastRecord } from '@/lib/forecast/types';
import { useTranslation } from 'react-i18next';
import { colors, fonts, space } from '@/lib/theme';

type FiveDaysProps = {
    startDate: DateTime;
    forecast?: ForecastRecord;
    name: string;
    onClick: (day: DateTime) => void;
}
function FiveDays(props: FiveDaysProps): JSX.Element {
    const { t } = useTranslation();
    const { startDate, forecast } = props

    if (forecast) {
        const startIndex = forecast.days.findIndex(
            d => DateTime.fromISO(d.day).hasSame(startDate, "day")
        );

        if (startIndex == -1) {
            return (
                <View style={styles.noForecast}>
                    <Text>
                        {t('Forecast not available at the moment. Please try again later.')}
                    </Text>
                </View>
            );
        }

        const fiveDays = forecast.days.slice(startIndex, startIndex + 5);
        return <View style={styles.fiveDaysWrapper}>
            {fiveDays.map(d =>
                <TouchableOpacity key={d.day} onPress={() => props.onClick(DateTime.fromISO(d.day))}>
                    <DayRow summary={d} />
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
        fontFamily: fonts.regular,
        color: colors.text,
        paddingLeft: space[3],
        paddingRight: space[3],
        marginTop: space[10],
    },
    loading: {
        fontFamily: fonts.regular,
        color: colors.text,
        paddingLeft: space[3],
        paddingRight: space[3],
        marginTop: space[10],
    },
    fiveDaysWrapper: {
        paddingLeft: space[6],
        paddingRight: space[6],
        marginTop: space[10],
        paddingBottom: space[10],
    },
});

export default FiveDays;
