import { Outlet, createRootRoute } from "@tanstack/react-router";
import { CommandPaletteHost } from "@/components/layout/command-palette";
import "@/styles/app.css";

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <CommandPaletteHost />
    </>
  ),
});
