import Buffer from "../Buffer";

// Text Representation: "Good Morning ☀️"
const textBase64 = "R29vZCBNb3JuaW5nIOKYgO+4jw==";
const textBuffer = Uint8Array.from([
  71, 111, 111, 100, 32, 77, 111, 114, 110, 105, 110, 103, 32, 226, 152, 128,
  239, 184, 143,
]);

/* Tests for the static methods of `Buffer` class. */
describe("`Buffer` Class Static Methods", () => {
  it("Buffer.base64ToBuffer()", () => {
    expect(Buffer.base64ToBuffer(textBase64)).toEqual(textBuffer);
  });

  it("Buffer.bytesToBase64()", () => {
    expect(Buffer.bytesToBase64([...textBuffer])).toBe(textBase64);
  });

  it("Buffer.bytesToInt()", () => {
    expect(Buffer.bytesToInt([208, 111, 152])).toBe(13660056);
  });

  describe("Buffer.bytesToString()", () => {
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

/* Tests for instance properties of `Buffer` class. */
describe("`Buffer` Class Instance Properties", () => {
  let buffer: Buffer;

  beforeEach(() => {
    buffer = new Buffer();
    buffer.setBuffer(textBuffer);
  });

  it("Buffer.prototype.buffer", () => {
    expect(buffer.buffer).toEqual(textBuffer);
  });

  it("Buffer.prototype.eof", () => {
    expect(buffer.eof).toBe(false);
    buffer.move(100);
    expect(buffer.eof).toBe(true);
  });

  it("Buffer.prototype.length", () => {
    expect(buffer.length).toBe(19);
  });

  it("Buffer.prototype.position", () => {
    expect(buffer.position).toBe(0);
    buffer.move(10);
    expect(buffer.position).toBe(10);
    buffer.move(100);
    expect(buffer.position).toBe(19);
  });
});

/* Tests for instance methods of `Buffer` class. */
describe("`Buffer` Class Instance Methods", () => {
  let buffer: Buffer;

  beforeEach(() => {
    buffer = new Buffer();
    buffer.setBuffer(textBuffer);
  });

  it("Buffer.prototype.setBuffer()", () => {
    buffer.setBuffer(Uint8Array.from([71, 111, 111]));
    expect(buffer.buffer).toEqual(Uint8Array.from([71, 111, 111]));
  });

  it("Buffer.prototype.move()", () => {
    expect(buffer.move(1)).toBe(1);
    expect(buffer.move(10)).toBe(10);
    expect(buffer.move(100)).toBe(8);
  });

  it("Buffer.prototype.readUInt8()", () => {
    expect(buffer.readUInt8()).toBe(71);
    expect(buffer.readUInt8()).toBe(111);
  });

  it("Buffer.prototype.readBytes()", () => {
    expect(buffer.readBytes(1)).toEqual([71]);
    expect(buffer.readBytes(10)).toEqual([
      111, 111, 100, 32, 77, 111, 114, 110, 105, 110,
    ]);
    expect(buffer.readBytes(100)).toEqual([
      103, 32, 226, 152, 128, 239, 184, 143,
    ]);
  });
});
