import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

async function ensureAppleIcon() {
  const cwd = process.cwd();
  const inputSvgPath = path.join(cwd, "app", "icon.svg");
  const outputPngPath = path.join(cwd, "app", "apple-icon.png");

  try {
    await fs.access(inputSvgPath);
  } catch {
    console.error(`[icons] Missing input: ${inputSvgPath}`);
    process.exit(1);
  }

  try {
    const svgBuffer = await fs.readFile(inputSvgPath);
    await sharp(svgBuffer)
      .resize(180, 180, { fit: "cover" })
      .png({ compressionLevel: 9 })
      .toFile(outputPngPath);
    console.log(`[icons] Generated: ${outputPngPath}`);
  } catch (error) {
    console.error("[icons] Failed to generate apple-icon.png", error);
    process.exit(1);
  }
}

ensureAppleIcon();


