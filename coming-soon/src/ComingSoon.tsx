import { springTiming, TransitionSeries } from "@remotion/transitions";
import { wipe } from "@remotion/transitions/wipe";
import { useVideoConfig } from "remotion";
import { MarkScene } from "./MarkScene";
import { NameScene } from "./NameScene";
import { SoonScene } from "./SoonScene";

export const ComingSoon: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <TransitionSeries>
      <TransitionSeries.Sequence
        name="Mark"
        durationInFrames={Math.round((10 / 3) * fps)}
        premountFor={fps}
      >
        <MarkScene>NP</MarkScene>
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={wipe({ direction: "from-right" })}
        timing={springTiming({
          config: { damping: 200 },
          durationInFrames: Math.round((2 / 3) * fps),
        })}
      />
      <TransitionSeries.Sequence
        name="Name"
        durationInFrames={4 * fps}
        premountFor={fps}
      >
        <NameScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={wipe({ direction: "from-bottom" })}
        timing={springTiming({
          config: { damping: 200 },
          durationInFrames: Math.round((2 / 3) * fps),
        })}
      />
      <TransitionSeries.Sequence
        name="Coming soon"
        durationInFrames={4 * fps}
        premountFor={fps}
      >
        <SoonScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
