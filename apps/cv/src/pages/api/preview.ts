import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url }) => {
  const target = url.searchParams.get("url");
  if (!target) {
    return new Response(JSON.stringify({ error: "Missing url param" }), {
      status: 400,
    });
  }

  try {
    const res = await fetch(target, {
      headers: { "User-Agent": "bot" },
      signal: AbortSignal.timeout(5000),
    });
    const html = await res.text();

    const get = (property: string): string | undefined => {
      // Try og: tags first, then generic meta name tags
      const ogMatch = html.match(
        new RegExp(
          `<meta[^>]+property=["']og:${property}["'][^>]+content=["']([^"']+)["']`,
          "i"
        )
      ) ??
        html.match(
          new RegExp(
            `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${property}["']`,
            "i"
          )
        );
      if (ogMatch) return ogMatch[1];

      if (property === "description") {
        const metaMatch = html.match(
          /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
        ) ??
          html.match(
            /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i
          );
        return metaMatch?.[1];
      }

      if (property === "title") {
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        return titleMatch?.[1];
      }

      return undefined;
    };

    const data = {
      title: get("title"),
      description: get("description"),
      image: get("image"),
    };

    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to fetch" }), {
      status: 502,
    });
  }
};
