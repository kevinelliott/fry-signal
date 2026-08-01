import type { Metadata } from "next";
import "@fontsource-variable/big-shoulders/opsz.css";
import "@fontsource-variable/atkinson-hyperlegible-next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fry Signal — Midnight Merge",
  description: "Read the road, route the rush, and keep Mile 42 glowing.",
};

const directionContract = `<!--
THESIS: The route is the game; this surface refuses the restaurant dashboard and six-minigame kitchen.
OWN-WORLD: Midnight asphalt, fryer-paper enamel, galvanized rails, marquee yellow, physical switches, stamped labels, and shape-coded signals form a roadside signal desk.
STORY: Read three announced waves, commit a safe batch posture, switch a visible route, recover an exception, and watch Mile 42 answer BATCH / PACK / GO.
FIRST VIEWPORT: Forecast occupies the left edge, a continuous route board dominates the center, and one exception rail sits right; the active switch is the primary action.
FORM: Roadside signal desk, approved composition B, seed key 64a988f2.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <template
          data-direction-contract="64a988f2"
          dangerouslySetInnerHTML={{ __html: directionContract }}
        />
        {children}
      </body>
    </html>
  );
}
