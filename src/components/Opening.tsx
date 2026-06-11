import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

type OpeningProps = {
  title: string;
  dateLabel: string;
  headline: string;
  subtitle: string;
};

export const Opening = ({ title, dateLabel, headline, subtitle }: OpeningProps) => {
  const frame = useCurrentFrame();
  const titleProgress = interpolate(frame, [12, 48], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const lineWidth = interpolate(frame, [38, 76], [0, 980], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(135deg, #08263d 0%, #0f5d8f 42%, #20a17a 100%)",
        color: "white",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "88px 88px",
          transform: `translateX(${-frame * 0.45}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 126,
          top: 122,
          fontSize: 30,
          fontWeight: 900,
          letterSpacing: 0,
          color: "#f8d66d",
        }}
      >
        {dateLabel}
      </div>
      <div
        style={{
          position: "absolute",
          left: 126,
          top: 288,
          transform: `translateY(${interpolate(titleProgress, [0, 1], [44, 0])}px)`,
          opacity: titleProgress,
        }}
      >
        <div
          style={{
            fontSize: 126,
            lineHeight: 1,
            fontWeight: 950,
            textShadow: "0 18px 60px rgba(0,0,0,0.22)",
          }}
        >
          {title}
        </div>
        <div
          style={{
            width: lineWidth,
            height: 9,
            marginTop: 34,
            backgroundColor: "#f5b84b",
          }}
        />
        <div
          style={{
            marginTop: 44,
            fontSize: 48,
            lineHeight: 1.35,
            fontWeight: 900,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 32,
            lineHeight: 1.45,
            fontWeight: 700,
            color: "rgba(255,255,255,0.86)",
          }}
        >
          {subtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
};
