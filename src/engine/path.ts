const isRemotePath = (path: string) => /^https?:\/\//i.test(path);

const trimSlashes = (path: string) => path.replace(/^\/+|\/+$/g, "");

export const normalizePublicPath = (path: string) => {
  if (isRemotePath(path)) {
    return path;
  }

  const withoutPublic = path.replace(/^\/?public\//, "");
  return `/${trimSlashes(withoutPublic)}`;
};

export const toStaticFilePath = (path: string) => {
  const normalized = normalizePublicPath(path);
  return isRemotePath(normalized) ? normalized : normalized.replace(/^\/+/, "");
};

const resolvePublicAssetPath = (path: string, basePath: string) => {
  const normalized = normalizePublicPath(path);

  if (isRemotePath(normalized)) {
    return normalized;
  }

  const normalizedBase = trimSlashes(basePath);
  const assetPath = normalized.replace(/^\/+/, "");
  const [rootDirectory, ...baseDirectories] = normalizedBase.split("/");
  const baseWithoutRoot = baseDirectories.join("/");

  if (assetPath === rootDirectory || assetPath.startsWith(`${rootDirectory}/`)) {
    return `/${assetPath}`;
  }

  if (
    baseWithoutRoot &&
    (assetPath === baseWithoutRoot ||
      assetPath.startsWith(`${baseWithoutRoot}/`))
  ) {
    return `/${rootDirectory}/${assetPath}`;
  }

  return `/${normalizedBase}/${assetPath}`;
};

export const resolveCharacterPath = (path: string) =>
  resolvePublicAssetPath(path, "characters");

export const resolveAudioPath = (path: string, basePath = "audio") =>
  resolvePublicAssetPath(path, basePath);

export const resolveSlidePath = (path: string, basePath = "slides") =>
  resolvePublicAssetPath(path, basePath);
