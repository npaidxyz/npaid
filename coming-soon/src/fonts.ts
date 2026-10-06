import { loadFont as loadDisplay } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";

export const display = loadDisplay("normal", {
  weights: ["700"],
  subsets: ["latin"],
});

export const mono = loadMono("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
