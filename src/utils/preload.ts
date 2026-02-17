import { SubtitleParameter } from "../models/SubtitleParameter";
import { Category } from "../models/Category";
import { Character } from "../models/Character";
import characters from "../characters.json";

// JSON shape definitions for stronger typing when importing characters.json
interface DefaultTextJSON {
  text?: string;
  x?: number;
  y?: number;
  r?: number;
  s?: number;
}

interface CharacterJSON {
  id: string;
  name: string;
  character?: string;
  img?: string;
  fillColor?: string;
  strokeColor?: string;
  defaultText?: DefaultTextJSON;
}

interface CategoryJSON {
  category: string;
  characters?: CharacterJSON[];
}

/**
 * Preload a font by fetching its binary and constructing a FontFace.
 * Keeps an optional AbortSignal to cancel the request.
 */
async function preloadFont(fontFamily: string, url: string | URL, signal?: AbortSignal): Promise<void> {
  try {
    const response = await fetch(String(url), {
      headers: { "Cache-Control": "max-age=31536000" },
      signal,
    });

    if (!response.ok) {
      console.warn(`Failed to preload font ${fontFamily}: ${response.status} ${response.statusText}`);
      return;
    }

    const data: ArrayBuffer = await response.arrayBuffer();
  // FontFace accepts a BufferSource (ArrayBuffer) as the source in modern browsers
  const font = await new FontFace(fontFamily, data as unknown as ArrayBuffer).load();
  // cast to any because some TS lib versions don't expose `add` on FontFaceSet
  (document as any).fonts.add(font);
    console.info(`Font ${fontFamily} preload done.`);
  } catch (err) {
    // keep error minimal but visible for debugging
    console.error(`preloadFont(${fontFamily}) failed:`, err);
  }
}

/**
 * Convert raw JSON data into application model instances.
 * Accepts the shape exported from `characters.json`.
 */
function preloadCharacters(rawData: CategoryJSON[]): Category[] {
  return rawData.map((cat) => {
    const charactersList: Character[] = (cat.characters || []).map((ch) => {
      const dt = ch.defaultText ?? {};
      const subtitle = new SubtitleParameter(
        dt.text ?? "",
        dt.x ?? 0,
        dt.y ?? 0,
        dt.r ?? 0,
        dt.s ?? 1,
        (dt as any).spaceSize ?? 50
      );
      return new Character(
        ch.id,
        ch.name,
        ch.character ?? "",
        ch.img ?? "",
        ch.fillColor ?? "",
        ch.strokeColor ?? "",
        subtitle
      );
    });
    return new Category(cat.category, charactersList);
  });
}

export const categories: Category[] = preloadCharacters(characters as unknown as CategoryJSON[]);

// Re-export types for convenience so callers can import typed models from this module
export type { Category } from "../models/Category";
export type { Character } from "../models/Character";

export { preloadFont };