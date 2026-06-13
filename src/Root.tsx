import "./index.css";
import { Composition } from "remotion";
import {
  HarukaNewsVideo,
  HARUKA_NEWS_DURATION_IN_FRAMES,
} from "./HarukaNewsVideo";
import {
  ShortNewsVideo,
  SHORT_NEWS_DURATION_IN_FRAMES,
} from "./ShortNewsVideo";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HarukaNews"
        component={HarukaNewsVideo}
        durationInFrames={HARUKA_NEWS_DURATION_IN_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ShortNewsVideo"
        component={ShortNewsVideo}
        durationInFrames={SHORT_NEWS_DURATION_IN_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
