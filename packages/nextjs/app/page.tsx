"use client";

import { useEffect } from "react";
import { Profile } from "../components/Profile";
import { sdk } from "@farcaster/miniapp-sdk";

export default function Page() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <Profile />
    </main>
  );
}
