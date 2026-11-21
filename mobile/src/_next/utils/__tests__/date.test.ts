// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { Seconds } from "../date";

describe("Seconds.toReadableTime", () => {
  test("returns `hh:mms:ss` format", () => {
    expect(Seconds.toReadableTime(3801)).toBe("1:03:21");
  });

  test("returns zero as `0:00`", () => {
    expect(Seconds.toReadableTime(0)).toBe("0:00");
  });

  test("floors fractional seconds", () => {
    expect(Seconds.toReadableTime(59.99)).toBe("0:59");
    expect(Seconds.toReadableTime(3801.99)).toBe("1:03:21");
  });

  test("pads ISO-format segments", () => {
    expect(Seconds.toReadableTime(3600)).toBe("1:00:00");
    expect(Seconds.toReadableTime(86399)).toBe("23:59:59");
  });

  test("returns `d hr min` format", () => {
    expect(Seconds.toReadableTime(90180)).toBe("1d 01hr 03min");
  });

  test("includes zero duration segments in day format", () => {
    expect(Seconds.toReadableTime(86400)).toBe("1d 00hr 00min");
  });

  test("force `d hr min` format", () => {
    expect(Seconds.toReadableTime(3801, true)).toBe("1hr 03min");
    expect(Seconds.toReadableTime(90180, true)).toBe("1d 01hr 03min");
    expect(Seconds.toReadableTime(0, true)).toBe("0min");
  });
});
