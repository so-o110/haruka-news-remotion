import {spawn} from "node:child_process";
import {access, mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";

type ShortNewsData = {
  slides?: Array<{
    audio?: string;
    caption?: string;
    slides?: Array<{src?: string}>;
  }>;
};

type ShortAsset = {
  path?: string;
  prompt?: string;
  negative_prompt?: string;
  size?: string | {width?: number; height?: number};
  width?: number;
  height?: number;
};

type ShortAssetsData = {
  baseDirectory?: string;
  assets?: ShortAsset[];
};

type CommandOptions = {
  topic?: string;
  slug?: string;
  fill: boolean;
  init: boolean;
  render: boolean;
};

const stripWrappingQuotes = (value: string) => {
  const first = value[0];
  const last = value[value.length - 1];
  return value.length >= 2 && first === last && (first === '"' || first === "'")
    ? value.slice(1, -1)
    : value;
};

const REQUIRED_AUDIO_PATHS = [
  "public/audio/shorts/scene-1.wav",
  "public/audio/shorts/scene-2.wav",
  "public/audio/shorts/scene-3.wav",
];
const SCENE_DURATION_FRAMES = 300;
const SCENE_COUNT = 3;

const parseArguments = (args: string[]): CommandOptions => {
  const values = new Map<string, string>();
  let fill = false;
  let init = false;
  let render = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (!argument.startsWith("--")) {
      continue;
    }

    if (argument === "--fill") {
      fill = true;
      continue;
    }

    if (argument === "--init") {
      init = true;
      continue;
    }

    if (argument === "--render") {
      render = true;
      continue;
    }

    const equalIndex = argument.indexOf("=");
    if (equalIndex >= 0) {
      const key = argument.slice(2, equalIndex);
      const value = argument.slice(equalIndex + 1);

      if (key === "fill") {
        fill = value !== "false";
      } else if (key === "init") {
        init = value !== "false";
      } else if (key === "render") {
        render = value !== "false";
      } else {
        values.set(key, value);
      }
      continue;
    }

    const value = args[index + 1];
    if (value && !value.startsWith("--")) {
      values.set(argument.slice(2), value);
      index += 1;
    }
  }

  const topicValue = values.get("topic");
  const slugValue = values.get("slug");

  if (Boolean(topicValue) !== Boolean(slugValue)) {
    throw new Error(
      "--topicと--slugは両方指定するか、両方省略してください",
    );
  }

  const topic = topicValue ? stripWrappingQuotes(topicValue) : undefined;
  const slug = slugValue ? stripWrappingQuotes(slugValue) : undefined;

  if (init && (!topic || !slug)) {
    throw new Error(
      '--initには--topicと--slugが必要です。例: npm run make:short -- --init --topic "生成AIとは" --slug generative-ai',
    );
  }

  if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(
      "slugは英小文字・数字・ハイフンのみで指定してください。例: generative-ai",
    );
  }

  return {topic, slug, fill, init, render};
};

const fileExists = async (filePath: string) => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

const readJson = async (filePath: string, rootDirectory: string) => {
  const contents = await readFile(filePath, "utf8");

  try {
    return JSON.parse(contents) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const lineColumnMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
    const positionMatch = message.match(/position\s+(\d+)/i);
    let location = "位置不明";

    if (lineColumnMatch) {
      location = `${lineColumnMatch[1]}行 ${lineColumnMatch[2]}列`;
    } else if (positionMatch) {
      const position = Number(positionMatch[1]);
      const beforeError = contents.slice(0, position);
      const lines = beforeError.split(/\r?\n/);
      location = `${lines.length}行 ${lines[lines.length - 1].length + 1}列`;
    }

    throw new Error(
      `${toDisplayPath(rootDirectory, filePath)} のJSON構文エラー（${location}）: ${message}`,
    );
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const validateShortNews = (
  value: unknown,
  fileName: string,
): ShortNewsData => {
  if (!isRecord(value)) {
    throw new Error(`${fileName}: ルートはオブジェクトである必要があります`);
  }

  if (!Array.isArray(value.slides)) {
    throw new Error(`${fileName}: slides は配列である必要があります`);
  }

  value.slides.forEach((scene, sceneIndex) => {
    if (!isRecord(scene)) {
      throw new Error(
        `${fileName}: slides[${sceneIndex}] はオブジェクトである必要があります`,
      );
    }

    if (scene.slides !== undefined && !Array.isArray(scene.slides)) {
      throw new Error(
        `${fileName}: slides[${sceneIndex}].slides は配列である必要があります`,
      );
    }

    (scene.slides ?? []).forEach((slide, slideIndex) => {
      if (!isRecord(slide) || typeof slide.src !== "string") {
        throw new Error(
          `${fileName}: slides[${sceneIndex}].slides[${slideIndex}].src は文字列である必要があります`,
        );
      }
    });

    if (scene.audio !== undefined && typeof scene.audio !== "string") {
      throw new Error(
        `${fileName}: slides[${sceneIndex}].audio は文字列である必要があります`,
      );
    }

    if (scene.caption !== undefined && typeof scene.caption !== "string") {
      throw new Error(
        `${fileName}: slides[${sceneIndex}].caption は文字列である必要があります`,
      );
    }
  });

  return value as ShortNewsData;
};

const validateShortAssets = (
  value: unknown,
  fileName: string,
): ShortAssetsData => {
  if (!isRecord(value)) {
    throw new Error(`${fileName}: ルートはオブジェクトである必要があります`);
  }

  if (!Array.isArray(value.assets)) {
    throw new Error(`${fileName}: assets は配列である必要があります`);
  }

  value.assets.forEach((asset, assetIndex) => {
    if (!isRecord(asset) || typeof asset.path !== "string") {
      throw new Error(
        `${fileName}: assets[${assetIndex}].path は文字列である必要があります`,
      );
    }
  });

  if (
    value.baseDirectory !== undefined &&
    typeof value.baseDirectory !== "string"
  ) {
    throw new Error(`${fileName}: baseDirectory は文字列である必要があります`);
  }

  return value as ShortAssetsData;
};

const uniquePaths = (paths: Array<string | undefined>) =>
  [...new Set(paths.filter((item): item is string => Boolean(item)))];

const toDisplayPath = (rootDirectory: string, filePath: string) =>
  path.relative(rootDirectory, filePath).split(path.sep).join("/");

const resolveImagePath = ({
  rootDirectory,
  baseDirectory,
  imagePath,
}: {
  rootDirectory: string;
  baseDirectory: string;
  imagePath: string;
}) => {
  const normalized = imagePath.replace(/\\/g, "/").replace(/^\/+/, "");
  let relativePath: string;

  if (normalized.startsWith("public/slides/")) {
    relativePath = normalized;
  } else if (normalized.startsWith("slides/")) {
    relativePath = `public/${normalized}`;
  } else if (normalized.startsWith("shorts/")) {
    relativePath = `public/slides/${normalized}`;
  } else {
    relativePath = `${baseDirectory}/${normalized}`;
  }

  const resolved = path.resolve(rootDirectory, relativePath);
  const publicSlidesDirectory = path.resolve(rootDirectory, "public", "slides");
  const isInsideSlides =
    resolved === publicSlidesDirectory ||
    resolved.startsWith(`${publicSlidesDirectory}${path.sep}`);

  if (!isInsideSlides) {
    throw new Error(`画像パスが public/slides/ の外を指しています: ${imagePath}`);
  }

  return resolved;
};

const resolveAudioPath = (rootDirectory: string, audioPath: string) => {
  const normalized = audioPath.replace(/\\/g, "/").replace(/^\/+/, "");
  let relativePath: string;

  if (normalized.startsWith("public/audio/")) {
    relativePath = normalized;
  } else if (normalized.startsWith("audio/")) {
    relativePath = `public/${normalized}`;
  } else if (normalized.startsWith("shorts/")) {
    relativePath = `public/audio/${normalized}`;
  } else if (!normalized.includes("/")) {
    relativePath = `public/audio/shorts/${normalized}`;
  } else {
    throw new Error(`未対応の音声パスです: ${audioPath}`);
  }

  const resolved = path.resolve(rootDirectory, relativePath);
  const publicAudioDirectory = path.resolve(rootDirectory, "public", "audio");
  const isInsideAudio =
    resolved === publicAudioDirectory ||
    resolved.startsWith(`${publicAudioDirectory}${path.sep}`);

  if (!isInsideAudio) {
    throw new Error(`音声パスが public/audio/ の外を指しています: ${audioPath}`);
  }

  return resolved;
};

const getAssetSize = (asset: ShortAsset | undefined) => {
  if (!asset) {
    return "未指定";
  }

  if (typeof asset.size === "string") {
    return asset.size;
  }

  if (asset.size?.width && asset.size.height) {
    return `${asset.size.width}x${asset.size.height}`;
  }

  if (asset.width && asset.height) {
    return `${asset.width}x${asset.height}`;
  }

  return "未指定";
};

const printMissingFiles = (label: string, files: string[]) => {
  if (files.length === 0) {
    console.log(`✅ ${label} OK`);
    return;
  }

  console.log(`⚠️ 足りない${label}：`);
  files.forEach((file) => console.log(`- ${file}`));
};

const printNextSteps = () => {
  console.log("\n次にやること：");
  console.log("1. 上のpromptで画像を生成して、指定pathに保存");
  console.log("2. 上のcaptionをVOICEVOXで音声化して、指定pathに保存");
  console.log("3. npm run make:short で再チェック");
  console.log("4. npm run dev で確認");
  console.log("5. npx remotion render ShortNewsVideo out/short.mp4");
};

const printRenderReady = () => {
  console.log("\n✅ すべての素材が揃っています");
  console.log("✅ Remotionでレンダリング可能です");
  console.log("\n次に実行：");
  console.log("npm run dev");
  console.log("\nまたは\n");
  console.log("npx remotion render ShortNewsVideo out/short.mp4");
};

const runRemotionRender = (rootDirectory: string) =>
  new Promise<number>((resolve, reject) => {
    const child = spawn(
      "npx",
      ["remotion", "render", "ShortNewsVideo", "out/short.mp4"],
      {
        cwd: rootDirectory,
        stdio: "inherit",
        shell: process.platform === "win32",
      },
    );

    child.once("error", reject);
    child.once("close", (code) => resolve(code ?? 1));
  });

const initializeShortData = async (
  rootDirectory: string,
  topic: string,
  slug: string,
) => {
  const imagePaths = Array.from(
    {length: SCENE_COUNT},
    (_, index) => `/slides/${slug}-slide-${index + 1}.png`,
  );
  const characterNames = ["hn1", "rt1", "hsu1"];
  const shortNews = {
    title: topic,
    topic,
    ending: {enabled: false},
    slides: imagePaths.map((imagePath, index) => {
      const sceneNumber = index + 1;
      const startFrame = index * SCENE_DURATION_FRAMES;
      const caption = `シーン${sceneNumber}の字幕を入力してください。`;

      return {
        text: `${topic}：ポイント${sceneNumber}`,
        caption,
        character: characterNames[index],
        startFrame,
        durationFrames: SCENE_DURATION_FRAMES,
        audioStartFrame: startFrame,
        audioDurationFrames: SCENE_DURATION_FRAMES,
        audio: `/audio/shorts/scene-${sceneNumber}.wav`,
        captions: [{text: caption, durationFrames: SCENE_DURATION_FRAMES}],
        textStyle: {
          x: 58,
          y: 1150,
          width: 964,
          fontSize: 52,
          lineHeight: 1.2,
          textAlign: "center",
          color: "#123b63",
          zIndex: 30,
        },
        captionStyle: {
          x: 65,
          y: 1200,
          width: 950,
          height: 240,
          padding: 32,
          fontSize: 50,
          lineHeight: 1.2,
          textAlign: "center",
          color: "#123b63",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          borderColor: "#7a3f17",
          borderWidth: 5,
          borderRadius: 0,
          zIndex: 30,
        },
        slideFrameStyle: {
          x: 40,
          y: 320,
          width: 1000,
          height: 800,
          borderRadius: 0,
          overflow: "hidden",
          zIndex: 10,
        },
        slides: [
          {
            src: imagePath,
            start: 0,
            duration: SCENE_DURATION_FRAMES / 30,
            objectFit: "contain",
            objectPosition: "center",
          },
        ],
      };
    }),
  };
  const shortAssets = {
    version: 1,
    videoTitle: topic,
    slug,
    baseDirectory: "public/slides",
    generationNotes: [
      "YouTubeショート向けに、一目で内容が伝わる画像にする",
      "画像内に文章、ロゴ、透かしを入れない",
      "重要な被写体を中央に置き、上下左右に余白を残す",
    ],
    assets: imagePaths.map((imagePath, index) => ({
      path: imagePath,
      scene: `${topic}を説明するシーン${index + 1}`,
      prompt: `${topic}を説明する第${index + 1}シーンの画像生成指示を入力してください。`,
      negative_prompt: "text, logo, watermark",
      size: "1000x800",
    })),
  };
  const dataDirectory = path.resolve(rootDirectory, "public", "data");
  const serialize = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

  await mkdir(dataDirectory, {recursive: true});
  await Promise.all([
    writeFile(
      path.join(dataDirectory, "short-news.json"),
      serialize(shortNews),
      "utf8",
    ),
    writeFile(
      path.join(dataDirectory, "short-assets.json"),
      serialize(shortAssets),
      "utf8",
    ),
  ]);

  console.log("✅ public/data/short-news.json を初期化しました");
  console.log("✅ public/data/short-assets.json を初期化しました\n");
};

const printFillInstructions = async (rootDirectory: string) => {
  const promptRelativePath = "prompts/short-news-fill-prompt.txt";
  const promptPath = path.resolve(rootDirectory, promptRelativePath);

  if (!(await fileExists(promptPath))) {
    throw new Error(`${promptRelativePath} が見つかりません`);
  }

  console.log("AI生成はまだ手動です。");
  console.log("以下のプロンプトをChatGPTに貼ってください。\n");
  console.log(promptRelativePath);
  console.log("\nその後、出力された");
  console.log("public/data/short-news.json");
  console.log("public/data/short-assets.json");
  console.log("を差し替えてください。\n");
};

const main = async () => {
  const options = parseArguments(process.argv.slice(2));
  const rootDirectory = process.cwd();

  if (options.init) {
    if (!options.topic || !options.slug) {
      throw new Error("--initには--topicと--slugが必要です");
    }

    await initializeShortData(rootDirectory, options.topic, options.slug);
  }

  if (options.fill) {
    await printFillInstructions(rootDirectory);
  }

  const shortNewsPath = path.resolve(
    rootDirectory,
    "public",
    "data",
    "short-news.json",
  );
  const shortAssetsPath = path.resolve(
    rootDirectory,
    "public",
    "data",
    "short-assets.json",
  );

  console.log("ショート動画制作チェック");
  const modeParts = [
    options.init ? "初期化" : undefined,
    options.fill ? "AI入力案内" : undefined,
    "チェック",
    options.render ? "レンダリング" : undefined,
  ].filter((part): part is string => Boolean(part));
  const mode = modeParts.join(" + ");
  console.log(`モード: ${mode}`);
  if (options.topic) {
    console.log(`テーマ: ${options.topic}`);
  }
  if (options.slug) {
    console.log(`slug: ${options.slug}`);
  }
  console.log("");

  const [newsExists, assetsExists] = await Promise.all([
    fileExists(shortNewsPath),
    fileExists(shortAssetsPath),
  ]);

  console.log(
    newsExists ? "✅ short-news.json OK" : "❌ short-news.json がありません",
  );
  console.log(
    assetsExists
      ? "✅ short-assets.json OK"
      : "❌ short-assets.json がありません",
  );

  let shortNews: ShortNewsData | undefined;
  let shortAssets: ShortAssetsData | undefined;
  let jsonFormatValid = newsExists && assetsExists;

  if (newsExists) {
    try {
      const value = await readJson(shortNewsPath, rootDirectory);
      shortNews = validateShortNews(value, "public/data/short-news.json");
    } catch (error) {
      jsonFormatValid = false;
      console.error(`❌ ${error instanceof Error ? error.message : error}`);
    }
  }

  if (assetsExists) {
    try {
      const value = await readJson(shortAssetsPath, rootDirectory);
      shortAssets = validateShortAssets(
        value,
        "public/data/short-assets.json",
      );
    } catch (error) {
      jsonFormatValid = false;
      console.error(`❌ ${error instanceof Error ? error.message : error}`);
    }
  }

  const newsImagePaths = uniquePaths(
    shortNews?.slides?.flatMap((scene) =>
      (scene.slides ?? []).map((slide) => slide.src),
    ) ?? [],
  );
  const assetImagePaths = uniquePaths(
    shortAssets?.assets?.map((asset) => asset.path) ?? [],
  );

  let imagePathsMatch = false;

  if (shortNews && shortAssets) {
    const missingFromAssets = newsImagePaths.filter(
      (imagePath) => !assetImagePaths.includes(imagePath),
    );
    const missingFromNews = assetImagePaths.filter(
      (imagePath) => !newsImagePaths.includes(imagePath),
    );

    if (missingFromAssets.length === 0 && missingFromNews.length === 0) {
      imagePathsMatch = true;
      console.log("✅ 画像パス一致 OK");
    } else {
      console.log("❌ 画像パスが一致していません");
      missingFromAssets.forEach((imagePath) =>
        console.log(`- short-assets.json に不足: ${imagePath}`),
      );
      missingFromNews.forEach((imagePath) =>
        console.log(`- short-news.json に不足: ${imagePath}`),
      );
    }
  } else {
    console.log("⚠️ JSON不足のため画像パスを比較できません");
  }

  const configuredBaseDirectory =
    shortAssets?.baseDirectory ?? "public/slides/shorts";
  const baseDirectory = configuredBaseDirectory
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "");
  const requiredImagePaths = uniquePaths([
    ...newsImagePaths,
    ...assetImagePaths,
  ]);
  const assetsByPath = new Map(
    (shortAssets?.assets ?? [])
      .filter((asset): asset is ShortAsset & {path: string} =>
        Boolean(asset.path),
      )
      .map((asset) => [asset.path, asset]),
  );
  const requiredImages = requiredImagePaths.map((imagePath) => ({
    imagePath,
    filePath: resolveImagePath({rootDirectory, baseDirectory, imagePath}),
    asset: assetsByPath.get(imagePath),
  }));
  const imageExistence = await Promise.all(
    requiredImages.map((image) => fileExists(image.filePath)),
  );
  const missingImages = requiredImages.filter(
    (_, index) => !imageExistence[index],
  );

  if (shortNews || shortAssets) {
    printMissingFiles(
      "画像",
      missingImages.map((image) =>
        toDisplayPath(rootDirectory, image.filePath),
      ),
    );
  } else {
    console.log("⚠️ JSON不足のため必要画像を確認できません");
  }

  const audioTasks = new Map<
    string,
    {filePath: string; caption?: string}
  >();

  REQUIRED_AUDIO_PATHS.forEach((audioPath) => {
    const filePath = resolveAudioPath(rootDirectory, audioPath);
    audioTasks.set(filePath, {filePath});
  });

  (shortNews?.slides ?? []).forEach((slide) => {
    if (!slide.audio) {
      return;
    }

    const filePath = resolveAudioPath(rootDirectory, slide.audio);
    audioTasks.set(filePath, {filePath, caption: slide.caption});
  });

  const requiredAudio = [...audioTasks.values()];
  const audioExistence = await Promise.all(
    requiredAudio.map((audio) => fileExists(audio.filePath)),
  );
  const missingAudio = requiredAudio.filter(
    (_, index) => !audioExistence[index],
  );

  printMissingFiles(
    "音声",
    missingAudio.map((audio) => toDisplayPath(rootDirectory, audio.filePath)),
  );

  missingImages.forEach((image) => {
    console.log("\n【不足画像】");
    console.log("path:");
    console.log(toDisplayPath(rootDirectory, image.filePath));
    console.log("\nprompt:");
    console.log(image.asset?.prompt ?? "未指定");
    console.log("\nnegative_prompt:");
    console.log(image.asset?.negative_prompt ?? "未指定");
    console.log("\nsize:");
    console.log(getAssetSize(image.asset));
  });

  missingAudio.forEach((audio) => {
    console.log("\n【不足音声】");
    console.log("path:");
    console.log(toDisplayPath(rootDirectory, audio.filePath));
    console.log("\ncaption:");
    console.log(audio.caption ?? "未指定");
  });

  const isRenderReady =
    jsonFormatValid &&
    imagePathsMatch &&
    missingImages.length === 0 &&
    missingAudio.length === 0;

  if (isRenderReady) {
    if (options.render) {
      console.log("\n✅ すべての素材が揃っています");
      console.log("✅ Remotionでレンダリング可能です");
      console.log(
        "\nレンダリングを開始します: npx remotion render ShortNewsVideo out/short.mp4\n",
      );
      const renderExitCode = await runRemotionRender(rootDirectory);

      if (renderExitCode === 0) {
        console.log("\n✅ レンダリングが完了しました: out/short.mp4");
      } else {
        console.error(
          `\n❌ Remotionのレンダリングに失敗しました（終了コード: ${renderExitCode}）`,
        );
        process.exitCode = renderExitCode;
      }
    } else {
      printRenderReady();
    }
  } else {
    if (options.render) {
      console.log("\n⚠️ 必要な素材またはJSONに問題があるためレンダリングしません");
    }
    printNextSteps();
  }

  if (!jsonFormatValid) {
    process.exitCode = 1;
  }
};

void main().catch((error: unknown) => {
  console.error(`❌ ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
