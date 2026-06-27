import "./index.css";
import { Composition } from "remotion";
import {
  calculateHarukaNewsMetadata,
  HarukaNewsVideo,
  HARUKA_NEWS_DURATION_IN_FRAMES,
  HARUKA_NEWS_FPS,
} from "./HarukaNewsVideo";
import {
  calculateShortNewsMetadata,
  ShortNewsVideo,
  SHORT_NEWS_DURATION_IN_FRAMES,
} from "./ShortNewsVideo";
import {
  calculateStudyShortMetadata,
  STUDY_SHORT_DURATION_IN_FRAMES,
  StudyShortVideo,
} from "./StudyShortVideo";
import {
  calculateStudyVideoMetadata,
  STUDY_VIDEO_DURATION_IN_FRAMES,
  StudyVideo,
} from "./StudyVideo";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HarukaNews"
        component={HarukaNewsVideo}
        durationInFrames={HARUKA_NEWS_DURATION_IN_FRAMES}
        fps={HARUKA_NEWS_FPS}
        width={1920}
        height={1080}
        calculateMetadata={calculateHarukaNewsMetadata}
      />
      <Composition
        id="ShortNewsVideo"
        component={ShortNewsVideo}
        durationInFrames={SHORT_NEWS_DURATION_IN_FRAMES}
        fps={30}
        width={1080}
        height={1920}
        calculateMetadata={calculateShortNewsMetadata}
      />
      <Composition
        id="StudyShortVideo"
        component={StudyShortVideo}
        durationInFrames={STUDY_SHORT_DURATION_IN_FRAMES}
        fps={30}
        width={1080}
        height={1920}
        calculateMetadata={calculateStudyShortMetadata}
      />
      <Composition
        id="StudyVideo"
        component={StudyVideo}
        durationInFrames={STUDY_VIDEO_DURATION_IN_FRAMES}
        fps={30}
        width={1920}
        height={1080}
        calculateMetadata={calculateStudyVideoMetadata}
      />
    </>
  );
};
