import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { display, mono } from "./fonts";
import { Stage } from "./Stage";
import { Typewriter } from "./Typewriter";

export const NameScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <Stage>
        <Typewriter
          name="Wordmark"
          premountFor={fps}
          color="#f4efe4"
          fontSize={210}
          speed={12}
          style={{
            position: "absolute",
            left: 280,
            top: 340,
            fontFamily: display.fontFamily,
            fontWeight: 700,
            letterSpacing: -8,
          }}
        >
          NPaid
        </Typewriter>
        <Interactive.Div
          name="Rule"
          premountFor={fps}
          style={{
            position: "absolute",
            left: 280,
            top: 560,
            height: 8,
            borderRadius: 4,
            backgroundColor: "#d6ff3f",
            boxShadow: "0 0 18px rgba(214,255,63,0.7)",
            width: interpolate(frame, [0.35 * fps, 0.8 * fps], [0, 280], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        />
        <Typewriter
          name="Tagline"
          from={0.7 * fps}
          premountFor={fps}
          color="#d6ff3f"
          fontSize={72}
          speed={16}
          style={{
            position: "absolute",
            left: 280,
            top: 600,
            fontFamily: mono.fontFamily,
            fontWeight: 500,
          }}
        >
          Raid to earn
        </Typewriter>
      </Stage>
    </AbsoluteFill>
  );
};
