import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../src/stories/**/*.stories.tsx"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  refs: {
    "game-of-life": {
      title: "Game of Life",
      url: "https://wintermuted.github.io/game-of-life/storybook/",
    },
    "icon-builder": {
      title: "Icon Builder",
      url: "https://wintermuted.github.io/icon-builder/storybook/",
    },
    overworld: {
      title: "Overworld",
      url: "https://wintermuted.github.io/overworld/storybook/",
    },
  },
  typescript: { reactDocgen: "react-docgen" },
  core: { disableTelemetry: true },
  viteFinal(config) {
    config.base = "./";
    return config;
  },
};

export default config;
