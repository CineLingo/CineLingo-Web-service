import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import toIco from "to-ico";

async function generateIcons() {
  const cwd = process.cwd();
  const inputSvgPath = path.join(cwd, "app", "icon.svg");
  const outputPngPath = path.join(cwd, "app", "apple-icon.png");
  const outputIconPngPath = path.join(cwd, "app", "icon.png");
  const outputFaviconPath = path.join(cwd, "app", "favicon.ico");

  try {
    await fs.access(inputSvgPath);
  } catch {
    console.error(`[icons] Missing input: ${inputSvgPath}`);
    process.exit(1);
  }

  try {
    const svgBuffer = await fs.readFile(inputSvgPath);

    // Apple touch icon 180x180
    await sharp(svgBuffer)
      .resize(180, 180, { fit: "cover" })
      .png({ compressionLevel: 9 })
      .toFile(outputPngPath);
    console.log(`[icons] Generated: ${outputPngPath}`);

    // General PNG favicon (modern browsers)
    await sharp(svgBuffer)
      .resize(512, 512, { fit: "cover" })
      .png({ compressionLevel: 9 })
      .toFile(outputIconPngPath);
    console.log(`[icons] Generated: ${outputIconPngPath}`);

    // ICO (legacy & some user agents requesting /favicon.ico)
    const png16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
    const png32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
    const icoBuffer = await toIco([png16, png32]);
    await fs.writeFile(outputFaviconPath, icoBuffer);
    console.log(`[icons] Generated: ${outputFaviconPath}`);
  } catch (error) {
    console.error("[icons] Failed to generate icons", error);
    process.exit(1);
  }
}

generateIcons();


