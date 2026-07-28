type RouteViewKeyInput = {
  path: string;
  matched: ReadonlyArray<{ path: string }>;
};

export function applicationRouteViewKey(route: RouteViewKeyInput): string {
  if (route.path.includes("/sttl-step-2")) return "send-list-review";
  if (route.path.startsWith("/app/send")) return "send-wizard";
  return route.matched[0]?.path ?? route.path;
}
