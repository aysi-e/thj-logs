// module containing helpful functions for formatting numbers

import { round } from 'lodash';

/**
 * Shorten a number to a maximum of 4 total digits by using 'm' or 'k' for millions or thousands, respectively.
 *
 * @param num the number to shorten
 */
export const shortenNumber = (num: number) => {
    const val = Math.abs(num);
    if (val < 1000) return num.toString();
    if (val < 1000000) return `${round(num / 1000, 1)}k`;
    return `${(num / 1000000).toPrecision(3)}m`;
};
