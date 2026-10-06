import { AbsoluteFill, useVideoConfig } from "remotion";
import { display, mono } from "./fonts";
import { Stage } from "./Stage";
import { Typewriter } from "./Typewriter";

export const SoonScene: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <Stage>
        <Typewriter
          name="Headline"
          premountFor={fps}
          color="#f4efe4"
          fontSize={156}
          speed={14}
          style={{
            position: "absolute",
            left: 180,
            top: 370,
            fontFamily: display.fontFamily,
            fontWeight: 700,
            letterSpacing: -5,
          }}
        >
          Coming soon
        </Typewriter>
        <Typewriter
          name="Detail"
          from={1.15 * fps}
          premountFor={fps}
          color="#a39c8c"
          fontSize={64}
          speed={22}
          style={{
            position: "absolute",
            left: 180,
            top: 580,
            fontFamily: mono.fontFamily,
            fontWeight: 500,
          }}
        >
          One click to send encouragement.
        </Typewriter>
      </Stage>
    </AbsoluteFill>
  );
};
