import tailwind from "@astrojs/tailwind";
import compress from "astro-compress";
import icon from "astro-icon";
import { defineConfig } from 'astro/config';

import vercel from "@astrojs/vercel";

import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), icon(), compress(), mdx()],
  output: "server",
  adapter: vercel(),
  markdown: {
    shikiConfig: {
      theme: "github-light",
    },
  }
});