import { Composition, Folder } from "remotion";
import { ComingSoon } from "./ComingSoon";
import { MarkScene } from "./MarkScene";
import { NameScene } from "./NameScene";
import { SoonScene } from "./SoonScene";
import { Tutorial } from "./Tutorial";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Scenes">
        <Composition
          id="Mark"
          component={MarkScene}
          durationInFrames={200}
          fps={60}
          width={1920}
          height={1080}
          defaultProps={{ children: "NP" }}
        />
        <Composition
          id="Name"
          component={NameScene}
          durationInFrames={240}
          fps={60}
          width={1920}
          height={1080}
        />
        <Composition
          id="Soon"
          component={SoonScene}
          durationInFrames={240}
          fps={60}
          width={1920}
          height={1080}
        />
      </Folder>
      <Composition
        id="ComingSoon"
        component={ComingSoon}
        durationInFrames={600}
        fps={60}
        width={1920}
        height={1080}
      />
      <Composition
        id="Tutorial"
        component={Tutorial}
          durationInFrames={1335}
        fps={60}
        width={1920}
        height={1080}
      />
    </>
  );
};
