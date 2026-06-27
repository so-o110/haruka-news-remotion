import {mkdir, writeFile} from "node:fs/promises";
import path from "node:path";

const SCENE_COUNT = 3;
const SCENE_DURATION_FRAMES = 300;
const FPS = 30;

const [theme, slug] = process.argv.slice(2);

if (!theme || !slug) {
  throw new Error(
    '使い方: npm run generate:short -- "テーマ名" slug\n' +
      '例: npm run generate:short -- "生成AIとは？" generative-ai',
  );
}

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  throw new Error(
    "slugは英小文字・数字・ハイフンのみで指定してください。例: generative-ai",
  );
}

const characterNames = ["hn1", "rt1", "hsu1"];

const slideFrameStyle = {
  x: 40,
  y: 320,
  width: 1000,
  height: 800,
  borderRadius: 0,
  overflow: "hidden",
  zIndex: 10,
};

const textStyle = {
  x: 58,
  y: 1150,
  width: 964,
  fontSize: 52,
  lineHeight: 1.2,
  textAlign: "center",
  color: "#123b63",
  zIndex: 30,
};

const captionStyle = {
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
};

const imagePaths = Array.from(
  {length: SCENE_COUNT},
  (_, index) => `${slug}-scene-${index + 1}.png`,
);

const shortNews = {
  title: theme,
  topic: theme,
  ending: {enabled: false},
  slides: imagePaths.map((imagePath, index) => {
    const sceneNumber = index + 1;
    const caption = `シーン${sceneNumber}の字幕を入力してください。`;

    return {
      text: `${theme}：ポイント${sceneNumber}`,
      caption,
      character: characterNames[index],
      audio: `/audio/shorts/scene-${sceneNumber}.wav`,
      startFrame: index * SCENE_DURATION_FRAMES,
      durationFrames: SCENE_DURATION_FRAMES,
      audioDurationFrames: SCENE_DURATION_FRAMES,
      captions: [{text: caption, durationFrames: SCENE_DURATION_FRAMES}],
      textStyle,
      captionStyle,
      slideFrameStyle,
      slides: [
        {
          src: imagePath,
          start: 0,
          duration: SCENE_DURATION_FRAMES / FPS,
          objectFit: "contain",
          objectPosition: "center",
        },
      ],
    };
  }),
};

const shortAssets = {
  version: 1,
  videoTitle: theme,
  slug,
  baseDirectory: "public/slides/shorts",
  generationNotes: [
    "YouTubeショート向けに、シンプルで一目で伝わる画像にする",
    "画像内に文章、ロゴ、透かしを入れない",
    "重要な被写体を中央に置き、上下左右に余白を残す",
  ],
  assets: imagePaths.map((imagePath, index) => ({
    path: imagePath,
    scene: `${theme}を説明するシーン${index + 1}`,
    prompt: `${theme}を説明する第${index + 1}シーンの画像生成指示を入力してください。文字、ロゴ、透かしは入れない。`,
    width: 1000,
    height: 800,
  })),
};

const dataDirectory = path.resolve(process.cwd(), "public", "data");
const shortNewsPath = path.join(dataDirectory, "short-news.json");
const shortAssetsPath = path.join(dataDirectory, "short-assets.json");
const serialize = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

const main = async () => {
  await mkdir(dataDirectory, {recursive: true});
  await Promise.all([
    writeFile(shortNewsPath, serialize(shortNews), "utf8"),
    writeFile(shortAssetsPath, serialize(shortAssets), "utf8"),
  ]);

  console.log(`生成しました: ${shortNewsPath}`);
  console.log(`生成しました: ${shortAssetsPath}`);
};

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
