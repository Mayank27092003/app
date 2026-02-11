import { API_PREFIX } from "./constants";
import { HTTPMethod, RouteDefinition } from "./routes/types";

export const swaggerPaths: Record<string, any> = {};

/**
 * Adds a route's Swagger documentation to the global swaggerPaths object.
 *
 * @param route - The route definition
 * @param version - Optional version string (default = "v1")
 */
export function addSwaggerDoc(route: RouteDefinition, version = "v1") {
  const { path, docs } = route;
  if (!docs) return;

  const basePath = `${API_PREFIX}/${version}${path}`;
  if (!swaggerPaths[basePath]) swaggerPaths[basePath] = {};

  (Object.keys(docs) as HTTPMethod[]).forEach((method) => {
    swaggerPaths[basePath][method] = docs[method];
  });
}
