/** Shared Clerk component appearance (Catppuccin Mocha + brand sky). */
export const clerkAppearance = {
  variables: {
    colorPrimary: "#89dceb",
    colorBackground: "#1e1e2e",
    colorText: "#cdd6f4",
    colorTextSecondary: "#a6adc8",
    colorInputBackground: "#181825",
    colorInputText: "#cdd6f4",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "mx-auto w-full",
    cardBox: "mx-auto w-full shadow-none",
    card: "mx-auto w-full",
    // Logo upload control — keep slot centered; thumbnail preview is Clerk-hosted
    // and may not render a live preview in development mode (Clerk limitation).
    formFieldRow__organizationLogo: "items-center",
    formFieldInputShowPasswordButton: "text-[var(--color-mocha-subtext0)]",
    footer: "bg-transparent",
    footerActionLink: "text-[#89dceb]",
  },
} as const;
