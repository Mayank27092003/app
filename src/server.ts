import express, { Request, Response } from "express";
import path from "path";
import fileUpload from "express-fileupload";
import os from "os";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import { errorHandler } from "./middlewares/errorHandler";
import routes from "./routes";
import { specs } from "./swagger";
import "./cron/cleanupLogs";
import { API_PREFIX } from "./constants";
import { i18nMiddleware } from "./middlewares/i18n";
import { User } from "./models";
import Stripe from "stripe";
import { env } from "./config/env";
import cors from 'cors'

export const createServer = () => {
  const app = express();
  
  // Apply JSON parsing, but skip routes that need raw body (handled by route loader)
  app.use((req, res, next) => {
    // Skip JSON parsing for webhook routes - they'll use raw body middleware from route definition
    if (req.path.includes('/webhooks/stripe') || req.path.includes('/webhook')) {
      return next();
    }
    express.json()(req, res, next);
  });
  app.use(cors())
  app.use(morgan("dev"));
  app.use(i18nMiddleware);
  
  // Set EJS as the view engine
  app.set("view engine", "ejs");
  app.set("views", path.resolve(process.cwd(), "src", "views"));
  
  // Enable express-fileupload with temp files
  app.use(
    fileUpload({
      useTempFiles: true,
      tempFileDir: os.tmpdir(),
      createParentPath: true,
      limits: { fileSize: 100 * 1024 * 1024 },
      abortOnLimit: true,
      responseOnLimit: "File size exceeds the 100MB limit",
    }) as any
  );
  
  // Serve static files from /public (e.g., uploads)
  app.use("/public", express.static(path.resolve(process.cwd(), "public")));

  app.get("/", (req: any, res: any) => {
    return res.status(200).json({ message: "Welcome to LoadRider API" });
  });
  app.get("/health", (req: any, res: any) =>
    res.status(200).json({ status: "OK" })
  );
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    //   apiVersion: "2024-12-18.acacia",
    });
  app.get('/api/greet', async (req, res) => {
    const account = await stripe.accounts.create({
      type: "express",
      country: "IN",
      email: "testuser@example.com",
    });
    
    const message = await res.locals.t('loginSuccess', { user: 'Abhishek' }, 'auth');
    res.json({ message,account });
  });
  

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

  app.get("/app/return", (req, res) => {
    const {
      host,
      path: pathParam,
      scheme,
      package: pkg,
      fallback = "https://www.gofrts.com/",
      reason = "done", // can be "refresh", "success", "update", etc.
    } = req.query;
  
    const fallbackUrl = (fallback || "https://www.gofrts.com/") as string;
    const appScheme = host && pathParam && scheme && pkg
      ? `intent://${host}/${pathParam}#Intent;scheme=${scheme};package=${pkg};S.browser_fallback_url=${encodeURIComponent(
          fallbackUrl
        )};end`
      : fallbackUrl;
  
    // 🔹 Customize message & title based on reason
    const reasons: any = {
      refresh: {
        title: "Account Refreshed",
        message:
          "Your account details have been refreshed successfully. You can continue in the app.",
      },
      update: {
        title: "Details Updated",
        message:
          "Your information has been updated successfully. You can now return to the app.",
      },
      success: {
        title: "Success!",
        message: "Your action was completed successfully.",
      },
      error: {
        title: "Something Went Wrong",
        message: "We couldn't complete your request. Please try again later.",
      },
      done: {
        title: "Done",
        message: "Your action has been completed successfully.",
      },
    };
  
    const { title, message } = reasons[reason as any] || reasons.done;
  
    res.render("pages/app-return", {
      title,
      message,
      appScheme,
      fallbackUrl,
    });
  });

  // Payment Success Page
  app.get("/jobs/:jobId/payment-success", (req, res) => {
    const { jobId } = req.params;
    const { session_id } = req.query;
    const {
      host,
      path: pathParam,
      scheme,
      package: pkg,
      fallback,
    } = req.query;

    const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || "http://localhost:3000";
    const fallbackUrl = (fallback || baseUrl) as string;
    
    // Build app intent scheme if provided
    const appScheme = host && pathParam && scheme && pkg
      ? `intent://${host}/${pathParam}#Intent;scheme=${scheme};package=${pkg};S.browser_fallback_url=${encodeURIComponent(
          fallbackUrl
        )};end`
      : fallbackUrl;

    res.render("pages/payment-success", {
      jobId,
      session_id: session_id as string | undefined,
      host: host as string | undefined,
      path: pathParam as string | undefined,
      scheme: scheme as string | undefined,
      package: pkg as string | undefined,
      appScheme,
      fallbackUrl,
    });
  });

  // Payment Cancel Page
  app.get("/jobs/:jobId/payment-cancel", (req, res) => {
    const { jobId } = req.params;
    const {
      host,
      path: pathParam,
      scheme,
      package: pkg,
      fallback,
    } = req.query;

    const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || "http://localhost:3000";
    const fallbackUrl = (fallback || baseUrl) as string;
    
    // Build app intent scheme if provided
    const appScheme = host && pathParam && scheme && pkg
      ? `intent://${host}/${pathParam}#Intent;scheme=${scheme};package=${pkg};S.browser_fallback_url=${encodeURIComponent(
          fallbackUrl
        )};end`
      : fallbackUrl;

    res.render("pages/payment-cancel", {
      jobId,
      host: host as string | undefined,
      path: pathParam as string | undefined,
      scheme: scheme as string | undefined,
      package: pkg as string | undefined,
      appScheme,
      fallbackUrl,
    });
  });
  
  app.use(API_PREFIX, routes);
  app.all(/(.*)/, (req: any, res: any) => {
    return res.status(404).json({ message: "route not found" });
  });
  app.use(errorHandler);
  return app;
};

