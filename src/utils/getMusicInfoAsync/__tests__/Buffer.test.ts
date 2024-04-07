import Buffer from "../Buffer";

/* Tests for the static methods of the `Buffer` class. */
describe("Buffer Static Methods", () => {
  const textRepresentation = "Good Morning ☀️";
  const base64Representation = "R29vZCBNb3JuaW5nIOKYgO+4jw==";
  const bufferRepresentation = [
    71, 111, 111, 100, 32, 77, 111, 114, 110, 105, 110, 103, 32, 226, 152, 128,
    239, 184, 143,
  ];

  it("base64ToBuffer", () => {
    expect(Buffer.base64ToBuffer(base64Representation)).toStrictEqual(
      Uint8Array.from(bufferRepresentation),
    );
  });

  it("bytesToBase64", () => {
    expect(Buffer.bytesToBase64(bufferRepresentation)).toBe(
      base64Representation,
    );
  });

  it("bytesToInt", () => {
    expect(Buffer.bytesToInt([208, 111, 152])).toBe(13660056);
  });

  describe("bytesToString", () => {
    it("UTF-16 w/ BOM [Little Endian]", () => {
      const bytes = [255, 254, 74, 48, 111, 48, 136, 48, 70, 48, 0, 0];
      expect(Buffer.bytesToString(bytes, 1)).toBe("おはよう");
    });

    it("UTF-16 w/ BOM [Big Endian]", () => {
      const bytes = [254, 255, 48, 74, 48, 111, 48, 136, 48, 70, 0, 0];
      expect(Buffer.bytesToString(bytes, 1)).toBe("おはよう");
    });

    it("UTF-16BE w/o BOM", () => {
      const bytes = [48, 74, 48, 111, 48, 136, 48, 70, 0, 0];
      expect(Buffer.bytesToString(bytes, 2)).toBe("おはよう");
    });

    it("UTF-8", () => {
      const bytes = [
        227, 129, 138, 227, 129, 175, 227, 130, 136, 227, 129, 134,
      ];
      expect(Buffer.bytesToString(bytes, 3)).toBe("おはよう");
    });

    it("ISO-8859-1", () => {
      const bytes = [50, 48, 50, 49, 0];
      expect(Buffer.bytesToString(bytes, 0)).toBe("2021");
    });
  });
});
