import type { APIRoute } from "astro";
import { renderCard } from "card.ooo";

export const GET: APIRoute = async () => {
  const html = await renderCard({
    name: "Zachary Davison",
    jobTitle: "Engineering Manager",
    org: "zac.ooo",
    email: "thingsdoer@gmail.com",
    phone: "+353 83 484 0209",
    url: "https://zac.ooo",
    logo: "/favicon.svg",
  });

  return new Response(html, {
    headers: { "content-type": "text/html" },
  });
};
