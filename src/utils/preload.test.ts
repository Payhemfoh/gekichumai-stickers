import { preloadCharacters } from "./preload";

describe("preloadCharacters", () => {
  it("maps a fully-specified fixture into nested Category/Character/SubtitleParameter models", () => {
    const raw = [
      {
        category: "Ongeki",
        characters: [
          {
            id: "c1",
            name: "Char One",
            character: "One",
            img: "ongeki/one.png",
            fillColor: "#fff",
            strokeColor: "#000",
            defaultText: { text: "hi", x: 5, y: 6, r: 7, s: 2 },
          },
        ],
      },
    ];

    const result = preloadCharacters(raw);

    expect(result).toHaveLength(1);
    const category = result[0];
    expect(category.name).toBe("Ongeki");
    expect(category.characters).toHaveLength(1);

    const character = category.characters[0];
    expect(character).toMatchObject({
      id: "c1",
      name: "Char One",
      character: "One",
      imgPath: "ongeki/one.png",
    });

    expect(character.defaultParam).toMatchObject({
      text: "hi",
      fillColor: "#fff",
      strokeColor: "#000",
      x: 5,
      y: 6,
      r: 7,
      s: 2,
    });
  });

  it("applies default fallbacks for every optional field", () => {
    const raw = [
      {
        category: "Minimal",
        characters: [{ id: "c2", name: "Bare" }],
      },
    ];

    const character = preloadCharacters(raw)[0].characters[0];

    // Character-level string fallbacks
    expect(character.character).toBe("");
    expect(character.imgPath).toBe("");

    // SubtitleParameter defaults
    expect(character.defaultParam).toMatchObject({
      text: "",
      fillColor: "",
      strokeColor: "",
      x: 0,
      y: 0,
      r: 0,
      s: 1,
      spaceSize: 50,
    });
  });

  it("preserves falsy-but-valid numeric defaults (0) rather than substituting the fallback", () => {
    const raw = [
      {
        category: "Zeros",
        characters: [
          { id: "c3", name: "Z", defaultText: { x: 0, y: 0, r: 0 } },
        ],
      },
    ];

    const p = preloadCharacters(raw)[0].characters[0].defaultParam;
    expect(p.x).toBe(0);
    expect(p.y).toBe(0);
    expect(p.r).toBe(0);
    // s has no value here, so it defaults to 1
    expect(p.s).toBe(1);
  });

  it("handles a category with no characters array", () => {
    const raw = [{ category: "Empty" }];
    const result = preloadCharacters(raw);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Empty");
    expect(result[0].characters).toEqual([]);
  });

  it("returns an empty array for empty input", () => {
    expect(preloadCharacters([])).toEqual([]);
  });
});
