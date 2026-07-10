export const BUTTON_COLOR_TOKENS = {
  light: {
    foreground: "#F8F9FF",
    background: "#4051E8",
    hover: "#3142C9",
  },
  dark: {
    foreground: "#0A1533",
    background: "#95A1FF",
    hover: "#AEB7FF",
  },
} as const;

export const SEMANTIC_TEXT_COLOR_TOKENS = {
  light: {
    orange: "#9C431D",
    green: "#226F53",
    backgrounds: ["#FFFFFF", "#F8F9FA", "#EFF3FF"],
  },
  dark: {
    orange: "#EF9B63",
    green: "#65C99B",
    backgrounds: ["#111831", "#141B34", "#0B1021"],
  },
} as const;

function channelToLinear(value: number): number {
  const channel = value / 255;
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const value = hex.replace("#", "");
  const [red, green, blue] = [0, 2, 4].map((offset) =>
    Number.parseInt(value.slice(offset, offset + 2), 16),
  );
  return (
    0.2126 * channelToLinear(red) +
    0.7152 * channelToLinear(green) +
    0.0722 * channelToLinear(blue)
  );
}

export function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const light = Math.max(foregroundLuminance, backgroundLuminance);
  const dark = Math.min(foregroundLuminance, backgroundLuminance);
  return (light + 0.05) / (dark + 0.05);
}
