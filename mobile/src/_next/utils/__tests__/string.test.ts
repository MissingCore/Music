// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { removeFileExtension } from "../string";

describe("removeFileExtension", () => {
  it("return file name without extension", () => {
    expect(removeFileExtension("README.md")).toBe("README");
  });

  it("correctly handle if no extension is present", () => {
    expect(removeFileExtension("README")).toBe("README");
  });
});
