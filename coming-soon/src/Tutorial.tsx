import { Audio } from "@remotion/media";
import { springTiming, TransitionSeries } from "@remotion/transitions";
import { wipe } from "@remotion/transitions/wipe";
import { AbsoluteFill, interpolate, staticFile, useVideoConfig } from "remotion";
import { display } from "./fonts";
import { Stage } from "./Stage";
import { Step } from "./Step";
import { Typewriter } from "./Typewriter";

const EndName: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <Stage>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typewriter
            name="Name"
            premountFor={fps}
            color="#f4efe4"
            fontSize={168}
            speed={8}
            holdWidth
            style={{
              fontFamily: display.fontFamily,
              fontWeight: 700,
              letterSpacing: -6,
            }}
          >
            NPaid
          </Typewriter>
        </AbsoluteFill>
      </Stage>
    </AbsoluteFill>
  );
};

export const Tutorial: React.FC = () => {
  const { fps } = useVideoConfig();
  const wipeFrames = Math.round(0.25 * fps);

  return (
    <>
      <Audio
        name="Music"
        src={staticFile("bed.wav")}
        premountFor={fps}
        volume={(mediaFrame) =>
          interpolate(
            mediaFrame,
            [0, 0.35 * fps, 21.3 * fps, 22.25 * fps],
            [0, 0.62, 0.62, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )
        }
      />
      <Audio
        name="Click 1"
        src={staticFile("click.wav")}
        from={Math.round(0.12 * fps)}
        premountFor={fps}
        volume={0.55}
      />
      <Audio
        name="Wipe 1"
        src={staticFile("switch.wav")}
        from={Math.round(4.75 * fps)}
        premountFor={fps}
        volume={0.7}
      />
      <Audio
        name="Click 2"
        src={staticFile("click.wav")}
        from={Math.round(4.87 * fps)}
        premountFor={fps}
        volume={0.5}
      />
      <Audio
        name="Wipe 2"
        src={staticFile("switch.wav")}
        from={Math.round(9.75 * fps)}
        premountFor={fps}
        volume={0.7}
      />
      <Audio
        name="Click 3"
        src={staticFile("click.wav")}
        from={Math.round(9.87 * fps)}
        premountFor={fps}
        volume={0.5}
      />
      <Audio
        name="Wipe 3"
        src={staticFile("switch.wav")}
        from={Math.round(14.75 * fps)}
        premountFor={fps}
        volume={0.7}
      />
      <Audio
        name="Click 4"
        src={staticFile("click.wav")}
        from={Math.round(14.87 * fps)}
        premountFor={fps}
        volume={0.5}
      />
      <Audio
        name="Confirm"
        src={staticFile("confirm.wav")}
        from={Math.round(15.45 * fps)}
        premountFor={fps}
        volume={0.65}
      />
      <Audio
        name="Wipe 4"
        src={staticFile("switch.wav")}
        from={Math.round(19.75 * fps)}
        premountFor={fps}
        volume={0.7}
      />
    <TransitionSeries>
      <TransitionSeries.Sequence
        name="What it is"
        durationInFrames={Math.round(5 * fps)}
        premountFor={fps}
      >
        <Step
          eyebrow="NPaid"
          step=""
          index={1}
          total={4}
          seconds={5}
          title="Raid to earn"
          detail="One click replies with encouragement. The link records it."
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={wipe({ direction: "from-right" })}
        timing={springTiming({
          config: { damping: 200 },
          durationInFrames: wipeFrames,
        })}
      />
      <TransitionSeries.Sequence
        name="Sign in"
        durationInFrames={Math.round(5.25 * fps)}
        premountFor={fps}
      >
        <Step
          eyebrow="How it works"
          step="01"
          index={2}
          total={4}
          seconds={5.25}
          title="Sign in and link Phantom"
          detail="One X account binds to one wallet."
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={wipe({ direction: "from-right" })}
        timing={springTiming({
          config: { damping: 200 },
          durationInFrames: wipeFrames,
        })}
      />
      <TransitionSeries.Sequence
        name="Reply"
        durationInFrames={Math.round(5.25 * fps)}
        premountFor={fps}
      >
        <Step
          eyebrow="How it works"
          step="02"
          index={3}
          total={4}
          seconds={5.25}
          title="Pick a line and reply"
          detail="One click opens that line on X."
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={wipe({ direction: "from-right" })}
        timing={springTiming({
          config: { damping: 200 },
          durationInFrames: wipeFrames,
        })}
      />
      <TransitionSeries.Sequence
        name="Record"
        durationInFrames={Math.round(5.25 * fps)}
        premountFor={fps}
      >
        <Step
          eyebrow="How it works"
          step="03"
          index={4}
          total={4}
          seconds={5.25}
          title="Paste your reply link"
          detail="Each account and wallet is recorded once."
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={wipe({ direction: "from-right" })}
        timing={springTiming({
          config: { damping: 200 },
          durationInFrames: wipeFrames,
        })}
      />
      <TransitionSeries.Sequence
        name="Name"
        durationInFrames={Math.round(2.5 * fps)}
        premountFor={fps}
      >
        <EndName />
      </TransitionSeries.Sequence>
    </TransitionSeries>
    </>
  );
};
