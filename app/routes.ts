import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
  index("routes/home.tsx"),
  route("/help", "routes/help.tsx"),
  route("/stats", "routes/stats.tsx"),
] satisfies RouteConfig
