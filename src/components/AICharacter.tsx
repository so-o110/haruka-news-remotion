import { useEffect, useMemo, useState } from "react";
import {
  continueRender,
  delayRender,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type CharacterExpression = "normal" | "happy" | "serious" | "thinking";

type AICharacterProps = {
  expression: CharacterExpression;
  name?: string;
};

const expressionLabel: Record<CharacterExpression, string> = {
  normal: "通常",
  happy: "笑顔",
  serious: "真剣",
  thinking: "思考中",
};

export const AICharacter = ({ expression, name = "Haruka" }: AICharacterProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [availableImageSrcs, setAvailableImageSrcs] = useState<string[]>([]);
  const [renderHandle] = useState(() => delayRender("Checking character image"));

  const imageSrcs = useMemo(
    () => [
      staticFile(`characters/ryunosuke/${expression}-1.png`),
      staticFile(`characters/ryunosuke/${expression}-2.png`),
    ],
    [expression],
  );

  useEffect(() => {
    let isMounted = true;

    Promise.all(
      imageSrcs.map((src) =>
        fetch(src, { method: "HEAD" })
          .then((response) => (response.ok ? src : null))
          .catch(() => null),
      ),
    )
      .then((checkedSrcs) => {
        if (isMounted) {
          setAvailableImageSrcs(
            checkedSrcs.filter((src): src is string => src !== null),
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          continueRender(renderHandle);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [imageSrcs, renderHandle]);

  const enter = interpolate(frame, [0, 24], [34, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const float = Math.sin(frame / 24) * 8;
  const shadow = 0.34 + Math.sin(frame / 18) * 0.05;
  const switchDurationInFrames = fps * 4;
  const activeImageIndex =
    availableImageSrcs.length > 0
      ? Math.floor(frame / switchDurationInFrames) % availableImageSrcs.length
      : 0;
  const previousImageIndex =
    availableImageSrcs.length > 0
      ? (activeImageIndex + availableImageSrcs.length - 1) %
        availableImageSrcs.length
      : 0;
  const transitionProgress = interpolate(
    frame % switchDurationInFrames,
    [0, 12],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        bottom: 132,
        width: 450,
        height: 620,
        transform: `translateY(${enter + float}px)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 48,
          bottom: 0,
          width: 330,
          height: 46,
          borderRadius: "50%",
          backgroundColor: `rgba(0, 0, 0, ${shadow})`,
          filter: "blur(8px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        {availableImageSrcs.length > 0 ? (
          <div
            style={{
              position: "relative",
              width: 430,
              height: 590,
            }}
          >
            {availableImageSrcs.map((src, index) => (
              <Img
                key={src}
                src={src}
                onError={() =>
                  setAvailableImageSrcs((currentSrcs) =>
                    currentSrcs.filter((currentSrc) => currentSrc !== src),
                  )
                }
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  opacity:
                    availableImageSrcs.length === 1
                      ? 1
                      : index === activeImageIndex
                        ? transitionProgress
                        : index === previousImageIndex
                          ? 1 - transitionProgress
                          : 0,
                  filter: "drop-shadow(0 28px 48px rgba(0, 0, 0, 0.28))",
                }}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              width: 360,
              height: 360,
              borderRadius: "50%",
              background:
                "linear-gradient(145deg, #ffffff 0%, #d8f2ff 46%, #ffd7df 100%)",
              border: "10px solid rgba(255,255,255,0.86)",
              boxShadow: "0 22px 60px rgba(0, 0, 0, 0.26)",
              color: "#19324d",
              fontSize: 54,
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            AIキャラ
          </div>
        )}
      </div>
      <div
        style={{
          position: "absolute",
          left: 74,
          bottom: 28,
          minWidth: 292,
          padding: "12px 22px",
          borderRadius: 8,
          backgroundColor: "rgba(10, 24, 40, 0.78)",
          border: "1px solid rgba(255,255,255,0.32)",
          color: "white",
          fontSize: 26,
          fontWeight: 800,
          textAlign: "center",
          backdropFilter: "blur(8px)",
        }}
      >
        {name} / {expressionLabel[expression]}
      </div>
    </div>
  );
};
