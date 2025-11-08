import "@rainbow-me/rainbowkit/styles.css";
import "@scaffold-ui/components/styles.css";
import { Metadata } from "next";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import "~~/styles/globals.css";

//import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "EasyTip",
    description: "De gorjetas para seus influencers favoritos com facilidade!",
    other: {
      "fc:miniapp": JSON.stringify({
        version: "next",
        imageUrl: "/logo.jpeg",
        button: {
          title: `EasyTip`,
          action: {
            type: "launch_miniapp",
            name: "EasyTip",
            url: "https://easytip.com",
            splashImageUrl: "/logo.jpeg",
            splashBackgroundColor: "#000000",
          },
        },
      }),
    },
  };
}


const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning className={``}>
      <body>
        <ThemeProvider enableSystem>
          <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
