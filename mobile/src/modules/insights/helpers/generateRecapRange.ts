// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { Months } from "~/utils/date";

type RangeUnit = "month" | "year";

interface RangePeriod<TRangeType extends RangeUnit = RangeUnit> {
  type: TRangeType;
  label: string;
  date: Date;
}

/**
 * Generates the range of dates representing the first day of the month
 * until the current month in descending order. Optionally also include
 * an "breakpoint" entry for the year.
 */
export function generateRecapRange<TIncludeYear extends boolean = false>(
  fromEpoch: number,
  includeYear?: TIncludeYear,
): Array<true extends TIncludeYear ? RangePeriod : RangePeriod<"month">> {
  const startDate = new Date(fromEpoch);
  const endDate = new Date();

  let startMonth = startDate.getMonth();
  let startYear = startDate.getFullYear();
  const endMonth = endDate.getMonth();
  const endYear = endDate.getFullYear();

  const rangeOptions: RangePeriod[] = [];

  do {
    while (startMonth < 12) {
      rangeOptions.unshift({
        type: "month",
        label: `${Months[startMonth]} ${startYear}`,
        date: new Date(startYear, startMonth, 1),
      });
      if (startYear === endYear && startMonth === endMonth) break;
      startMonth += 1;
    }

    if (includeYear) {
      rangeOptions.unshift({
        type: "year",
        label: `${startYear}`,
        date: new Date(startYear, 0, 1),
      });
    }

    startMonth = 0;
    startYear += 1;
  } while (startYear <= endYear);

  return rangeOptions as Array<
    true extends TIncludeYear ? RangePeriod : RangePeriod<"month">
  >;
}
