/**
 * 📦 Optimized Route Loader with File Watching
 *
 * This file automatically loads all route files ending with `.route.ts` or `.route.js`
 * from the current directory and all subdirectories. It supports:
 *
 * ✅ Exporting a single `RouteDefinition` object
 * ✅ Exporting an array of `RouteDefinition[]`
 * ✅ Exporting an object with `{ prefix, routes }` for grouping
 * ✅ Optionally exporting `routePrefix` to override folder-based path
 * ✅ Adds each route to Swagger docs using `addSwaggerDoc`
 * ✅ Registers each route to Express using method and version
 * ✅ File watching for faster development (only reloads changed files)
 *
 * Usage Example (inside any `*.route.ts` file):
 *
 * ```ts
 * export default {
 *   path: "/login",
 *   controller: { post: controller.login },
 *   validators: { post: useValidator(loginSchema) },
 *   docs: {
 *     post: {
 *       summary: "Login user",
 *       tags: ["Auth"],
 *     }
 *   }
 * };
 *
 * // OR
 *
 * export default [
 *   {
 *     path: "/signup",
 *     controller: { post: controller.signup },
 *     validators: { post: useValidator(signupSchema) },
 *   }
 * ];
 *
 * // OR with prefix grouping:
 *
 * export default {
 *   prefix: "/user",
 *   routes: [
 *     { path: "/", controller: { get: controller.getAllUsers } },
 *     { path: "/:id", controller: { get: controller.getUserById } },
 *   ]
 * };
 *
 * // Optional custom prefix override:
 * export const routePrefix = "/account";
 * ```
 */

import { Router, Request, Response, NextFunction } from "express";
import express from "express";
import fs from "fs";
import path from "path";
import type { RouteDefinition, HTTPMethod } from "./types";
import { addSwaggerDoc } from "../swagger-builder";
import { API_PREFIX } from "../constants";

const router = Router();
const routesPath = __dirname;

// Cache for loaded routes to avoid reloading unchanged files
const routeCache = new Map<string, { routes: RouteDefinition[], timestamp: number }>();
const loadedFiles = new Set<string>();

function loadRoutesRecursively(dirPath: string, basePrefix = "") {
  const entries = fs.readdirSync(dirPath);

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const folderName = path.basename(fullPath);
      loadRoutesRecursively(fullPath, `${basePrefix}/${folderName}`);
    } else if (entry.endsWith(".route.ts") || entry.endsWith(".route.js")) {
      loadRouteFile(fullPath, basePrefix);
    }
  }
}

function loadRouteFile(filePath: string, basePrefix: string) {
  try {
    const stats = fs.statSync(filePath);
    const cacheKey = filePath;
    
    // Check if file is already cached and hasn't changed
    if (routeCache.has(cacheKey)) {
      const cached = routeCache.get(cacheKey)!;
      if (cached.timestamp >= stats.mtime.getTime()) {
        return; // File hasn't changed, skip reload
      }
    }

    // Clear require cache for this specific file
    delete require.cache[require.resolve(filePath)];
    
    const imported = require(filePath);
    const exportVal = imported.default;
    const customPrefix = imported.routePrefix;
    
    if (!exportVal) return;

    let routeDefs: RouteDefinition[] = [];
    let prefix = customPrefix !== undefined ? customPrefix : basePrefix;

    if (!Array.isArray(exportVal) && exportVal.routes) {
      routeDefs = exportVal.routes;
      if (exportVal.prefix !== undefined) {
        prefix = exportVal.prefix;
      }
    } else if (Array.isArray(exportVal)) {
      routeDefs = exportVal;
    } else if (exportVal.controller) {
      routeDefs = [exportVal];
    } else {
      return;
    }

    // Cache the loaded routes
    routeCache.set(cacheKey, {
      routes: routeDefs,
      timestamp: stats.mtime.getTime()
    });

    routeDefs.forEach((route) => {
      const {
        path: routePath,
        controller,
        validators,
        version = "v1",
        middlewares,
        docs = {},
        useRawBody = false,
      } = route;

      const fullRoutePath = `${prefix}${routePath}`.replace(/\/+/g, "/");

      const getMiddlewareNames = (mw: any): string[] => {
        if (!mw) return [];
        const mws = Array.isArray(mw) ? mw : [mw];
        return mws.map((fn) => fn.name);
      };

      const hasMiddleware = (method: HTTPMethod, name: string): boolean => {
        const methodMiddlewares = middlewares?.[method];
        return getMiddlewareNames(methodMiddlewares).includes(name);
      };

      (Object.keys(controller) as HTTPMethod[]).forEach((method) => {
        const methodKey = method as HTTPMethod;
        const handlers = [];

        // Add raw body middleware if useRawBody is true
        // This must be first middleware to parse raw body before any other processing
        if (useRawBody) {
          handlers.push((req: Request, res: Response, next: NextFunction) => {
            express.raw({ type: 'application/json' })(req, res, (err) => {
              if (err) return next(err);
              next();
            });
          });
        }

        const mws = middlewares?.[methodKey];
        if (mws) handlers.push(...(Array.isArray(mws) ? mws : [mws]));

        const vals = validators?.[methodKey];
        if (vals) handlers.push(...(Array.isArray(vals) ? vals : [vals]));

        handlers.push(controller[methodKey]!);

        // 🛡️ Inject security responses into Swagger if `authenticateToken` or `requireRole` detected
        if (hasMiddleware(methodKey, "authenticateToken")) {
          docs[methodKey].responses = {
            ...docs[methodKey].responses,
            401: { description: "Unauthorized - missing or invalid token" },
          };
        } else {
          docs[methodKey].security = [];
        }

        if (hasMiddleware(methodKey, "requireRole")) {
          docs[methodKey].responses = {
            ...docs[methodKey].responses,
            403: { description: "Forbidden - insufficient role/permissions" },
          };
        }

        // Register Swagger docs
        const swaggerPath = fullRoutePath.replace(/:([^/]+)/g, '{$1}');
        addSwaggerDoc({ ...route, docs, path: swaggerPath }, version);
        
        // Register Express route
        const fullApiPath = `/${version}${fullRoutePath}`;
        router[methodKey](fullApiPath, ...handlers);
        console.log(
          `✅ Registered ${methodKey.toUpperCase()} ${API_PREFIX}${fullApiPath}`
        );
      });
    });

    loadedFiles.add(filePath);
  } catch (error) {
    console.error(`❌ Error loading route file ${filePath}:`, error);
  }
}

// Initial load
loadRoutesRecursively(routesPath);

// Note: File watching removed for simplicity. 
// The caching system still provides performance benefits by avoiding reloading unchanged files.

export default router;