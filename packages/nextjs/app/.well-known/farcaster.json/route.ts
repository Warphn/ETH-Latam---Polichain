/// <reference types="node" />

// Este handler retorna o manifesto do mini‑app. Preencha os valores conforme seu projeto.
export async function GET() {
  return Response.json({
    accountAssociation: {
      header: "",   // preencha após gerar a assinatura
      payload: "",
      signature: "",
    },
    baseBuilder: {
      ownerAddress: "0x80c0d879B8f8ad08fa6A5fc89D56c4d1B641d929", // endereço da sua Base Account
    },
    miniapp: {
      version: "1",
      name: "Easy Tip",
      homeUrl: "https://eth-latam-polichain-nextjs-8h1h6j8tr-victor-bertellis-projects.vercel.app",
      iconUrl: "https://ex.co/i.png",
      splashImageUrl: "https://ex.co/l.png",
      splashBackgroundColor: "#000000",
      webhookUrl: "https://ex.co/api/webhook",
      subtitle: "Fast, fun, social",
      description: "A fast, fun way to challenge friends in real time.",
      screenshotUrls: [
        "https://ex.co/s1.png",
        "https://ex.co/s2.png",
        "https://ex.co/s3.png",
      ],
      primaryCategory: "social",
      tags: ["example", "miniapp", "baseapp"],
      heroImageUrl: "https://ex.co/og.png",
      tagline: "Play instantly",
      ogTitle: "Example Mini App",
      ogDescription: "Challenge friends in real time.",
      ogImageUrl: "https://ex.co/og.png",
      noindex: true,
    },
  });
}
