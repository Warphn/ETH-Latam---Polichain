/// <reference types="node" />

// Este handler retorna o manifesto do mini‑app. Preencha os valores conforme seu projeto.
export async function GET() {
  return Response.json({
    accountAssociation: {
      header: "eyJmaWQiOjE0NTI2NjUsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHg2QjdjMUZGMTFhQjIxZUJFODg5MjU2RTEwNDM3OWYzZjRmNGRFQzg4In0",   // preencha após gerar a assinatura
      payload: "eyJkb21haW4iOiJldGgtbGF0YW0tcG9saWNoYWluLW5leHRqcy1sYWMudmVyY2VsLmFwcCJ9",
      signature: "1GKKtqfld+2Djx23Ndpr8f33cyoHPCRve9TpJmIBYNJs/nvdxKrq0FxVW3ULc9eucvpV7YXSWWRBJx5+C7z7Ehw=",
    },
    baseBuilder: {
      ownerAddress: "0x80c0d879B8f8ad08fa6A5fc89D56c4d1B641d929", // endereço da sua Base Account
    },
    miniapp: {
      version: "1",
      name: "Easy Tip",
      homeUrl: "https://eth-latam-polichain-nextjs-lac.vercel.app",
      iconUrl: "https://eth-latam-polichain-nextjs-lac.vercel.app/logo.jpeg",
      splashImageUrl: "https://eth-latam-polichain-nextjs-lac.vercel.app/logo.jpeg",
      splashBackgroundColor: "#8115A7",
      webhookUrl: "https://ex.co/api/webhook",
      subtitle: "Easy way to tip",
      description: "An easy way to contribute with your favorites creators",
      screenshotUrls: [
        "https://eth-latam-polichain-nextjs-lac.vercel.app/Print1.png",
        "https://eth-latam-polichain-nextjs-lac.vercel.app/Print2.png",
      ],
      primaryCategory: "social",
      tags: ["tip", "easy", "youtube","support"],
      heroImageUrl: "https://ex.co/og.png",
      tagline: "Tip instantly",
      ogTitle: "Easy Tip",
      ogDescription: "Easy way to tip",
      ogImageUrl: "https://eth-latam-polichain-nextjs-lac.vercel.app/logo.jpeg",
      noindex: true,
    },
  });
}

