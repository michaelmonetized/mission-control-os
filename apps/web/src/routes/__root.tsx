import { Outlet, createRootRoute } from "@tanstack/react-router";
import "@/styles/app.css";

export const Route = createRootRoute({
  component: () => <Outlet />,
});
