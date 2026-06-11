import { AbsoluteFill, Sequence } from "remotion";
import newsData from "./data/news.json";
import { Opening } from "./components/Opening";
import { NewsTopic, TopicSection } from "./components/TopicSection";

type NewsData = {
  programTitle: string;
  dateLabel: string;
  anchorName: string;
  opening: {
    headline: string;
    subtitle: string;
  };
  topics: NewsTopic[];
};

const news = newsData as NewsData;
const fps = 30;
const openingFrames = 12 * fps;

export const HARUKA_NEWS_DURATION_IN_FRAMES =
  openingFrames +
  news.topics.reduce(
    (total, topic) => total + Math.round(topic.durationSeconds * fps),
    0,
  );

export const HarukaNewsVideo = () => {
  let cursor = openingFrames;

  return (
    <AbsoluteFill style={{ backgroundColor: "#071727" }}>
      <Sequence durationInFrames={openingFrames}>
        <Opening
          title={news.programTitle}
          dateLabel={news.dateLabel}
          headline={news.opening.headline}
          subtitle={news.opening.subtitle}
        />
      </Sequence>
      {news.topics.map((topic, index) => {
        const durationInFrames = Math.round(topic.durationSeconds * fps);
        const from = cursor;
        cursor += durationInFrames;

        return (
          <Sequence
            key={`${topic.category}-${topic.title}`}
            from={from}
            durationInFrames={durationInFrames}
          >
            <TopicSection
              anchorName={news.anchorName}
              topic={topic}
              topicIndex={index}
              totalTopics={news.topics.length}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
