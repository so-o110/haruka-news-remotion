export const defaultCharacterImage = "normal-1.png";
export const defaultCharacterPath = `characters/${defaultCharacterImage}`;
export const defaultCharacterFallbackPath = "characters/default.png";

const expressionImageNames: Record<string, string> = {
  normal: "normal-1.png",
  happy: "happy-1.png",
  serious: "serious-1.png",
  thinking: "thinking-1.png",
};

export const getFileName = (path: string) => path.split("/").pop() ?? path;

const hasFileExtension = (fileName: string) => /\.[a-z0-9]+$/i.test(fileName);

export const normalizePublicPath = (path: string) => path.replace(/^\/+/, "");

export const normalizeCharacterImageName = (imageName: string | undefined) => {
  if (!imageName) {
    return defaultCharacterImage;
  }

  const fileName = getFileName(normalizePublicPath(imageName));
  const expressionFileName = expressionImageNames[fileName];

  if (expressionFileName) {
    return expressionFileName;
  }

  return hasFileExtension(fileName) ? fileName : `${fileName}.png`;
};

export const getCharacterImagePath = (imageName: string | undefined) =>
  `characters/${normalizeCharacterImageName(imageName)}`;
