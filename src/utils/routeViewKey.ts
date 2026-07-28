type RouteViewKeyInput = {
  path: string;
  matched: ReadonlyArray<{ path: string }>;
};

export function topLevelRouteViewKey(route: RouteViewKeyInput): string {
  return route.matched[0]?.path ?? route.path;
}
