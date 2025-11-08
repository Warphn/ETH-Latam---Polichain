// lib/youtube.ts
const YT_API = "https://www.googleapis.com/youtube/v3";

export function parseChannelInput(input: string): { id?: string; handle?: string } {
  const s = input.trim();

  // 1) ID direto (UCxxxx)
  if (/^UC[0-9A-Za-z_-]{22}$/.test(s)) return { id: s };

  // 2) Handle @algo
  if (s.startsWith("@")) return { handle: s.substring(1) };

  // 3) URL
  try {
    const u = new URL(s);
    // https://www.youtube.com/@Handle
    if (u.pathname.startsWith("/@")) return { handle: u.pathname.slice(2) };
    // https://www.youtube.com/channel/UC...
    if (u.pathname.startsWith("/channel/")) {
      const id = u.pathname.split("/")[2];
      if (id && /^UC[0-9A-Za-z_-]{22}$/.test(id)) return { id };
    }
  } catch {}

  // fallback: trate como handle sem @
  return { handle: s.replace(/^@/, "") };
}

export async function resolveChannelId({
  input,
  apiKey,
}: {
  input: string;
  apiKey: string;
}): Promise<{ channelId: string; title?: string; description?: string } | null> {
  const { id, handle } = parseChannelInput(input);

  const qs = id
    ? new URLSearchParams({
        part: "id,snippet,brandingSettings",
        id,
        key: apiKey,
      })
    : new URLSearchParams({
        part: "id,snippet,brandingSettings",
        forHandle: handle!, // aceita com ou sem '@'
        key: apiKey,
      });

  const url = `${YT_API}/channels?${qs.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data: any = await res.json();
  const item = data.items?.[0];
  if (!item?.id) return null;

  return {
    channelId: item.id,
    title: item.snippet?.title,
    description: item.brandingSettings?.channel?.description ?? "",
  };
}

export async function fetchChannelBranding({
  channelId,
  apiKey,
}: {
  channelId: string;
  apiKey: string;
}): Promise<{ title?: string; description?: string } | null> {
  const qs = new URLSearchParams({
    part: "snippet,brandingSettings",
    id: channelId,
    key: apiKey,
  });
  const url = `${YT_API}/channels?${qs.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data: any = await res.json();
  const item = data.items?.[0];
  if (!item) return null;
  return {
    title: item.snippet?.title,
    description: item.brandingSettings?.channel?.description ?? "",
  };
}