import { SubtitleParameter } from "./SubtitleParameter";

const base = () =>
  new SubtitleParameter("hello", "#fff", "#000", 10, 20, 30, 2, 50);

describe("SubtitleParameter", () => {
  it("stores all constructor fields", () => {
    const p = base();
    expect(p).toMatchObject({
      text: "hello",
      fillColor: "#fff",
      strokeColor: "#000",
      x: 10,
      y: 20,
      r: 30,
      s: 2,
      spaceSize: 50,
    });
  });

  describe("update()", () => {
    it("returns a new instance and leaves the original unchanged", () => {
      const original = base();
      const updated = original.update({ text: "world" });

      expect(updated).toBeInstanceOf(SubtitleParameter);
      expect(updated).not.toBe(original);
      expect(updated.text).toBe("world");
      // original is untouched
      expect(original.text).toBe("hello");
    });

    it("overrides each field independently while keeping the rest", () => {
      const cases: Array<[Partial<SubtitleParameter>, keyof SubtitleParameter, unknown]> = [
        [{ text: "world" }, "text", "world"],
        [{ fillColor: "#111" }, "fillColor", "#111"],
        [{ strokeColor: "#222" }, "strokeColor", "#222"],
        [{ x: 99 }, "x", 99],
        [{ y: 88 }, "y", 88],
        [{ r: 77 }, "r", 77],
        [{ s: 3 }, "s", 3],
        [{ spaceSize: 66 }, "spaceSize", 66],
      ];

      for (const [patch, field, expected] of cases) {
        const updated = base().update(patch);
        expect(updated[field]).toBe(expected);
        // every other field retains the base value
        const untouched = { ...base() } as Record<string, unknown>;
        delete untouched[field as string];
        for (const [k, v] of Object.entries(untouched)) {
          expect((updated as unknown as Record<string, unknown>)[k]).toBe(v);
        }
      }
    });

    it("respects falsy-but-not-nullish values (0 and empty string are not overwritten by the fallback)", () => {
      const updated = base().update({ text: "", x: 0, s: 0, spaceSize: 0 });
      expect(updated.text).toBe("");
      expect(updated.x).toBe(0);
      expect(updated.s).toBe(0);
      expect(updated.spaceSize).toBe(0);
    });

    it("falls back to the existing value when a field is undefined", () => {
      const updated = base().update({ text: undefined, x: undefined });
      expect(updated.text).toBe("hello");
      expect(updated.x).toBe(10);
    });

    it("is a no-op copy when given an empty patch", () => {
      const original = base();
      const updated = original.update({});
      expect(updated).not.toBe(original);
      expect({ ...updated }).toEqual({ ...original });
    });
  });
});
