import { Font } from "@react-pdf/renderer";
import path from "path";

let registered = false;

export function registerFonts() {
  if (registered) return;
  registered = true;

  const fontsDir = path.join(process.cwd(), "public", "fonts");

  Font.register({
    family: "Inter",
    fonts: [
      { src: path.join(fontsDir, "Inter-Regular.otf"), fontWeight: 400 },
      { src: path.join(fontsDir, "Inter-Bold.otf"), fontWeight: 700 },
    ],
  });

  Font.register({
    family: "NotoKannada",
    fonts: [
      { src: path.join(fontsDir, "NotoSansKannada-Regular.ttf"), fontWeight: 400 },
      { src: path.join(fontsDir, "NotoSansKannada-Bold.ttf"), fontWeight: 700 },
    ],
  });

  // Suppress hyphenation
  Font.registerHyphenationCallback(word => [word]);
}
