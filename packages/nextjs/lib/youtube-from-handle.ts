// lib/youtube-from-handle.ts
const YT_API = "https://www.googleapis.com/youtube/v3";

export async function getChannelIdFromHandle(handle: string, apiKey: string) {
  const clean = handle.startsWith("@") ? handle : `@${handle}`;
  const qs = new URLSearchParams({
    part: "id",
    forHandle: clean,     // aceita @Lorenzo... ou Lorenzo...
    key: apiKey,
  });

  const res = await fetch(`${YT_API}/channels?${qs.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
  const data = await res.json();

  const item = data.items?.[0];
  return item?.id ?? null; // ex.: "UCnC26J21mxe4Oqr6HnbNBZA"
}