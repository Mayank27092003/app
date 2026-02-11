import { UserController } from "../../controllers/user";
import { authenticateToken } from "../../middlewares/authentication";
import { useValidator } from "../../middlewares/validate";
import { updateProfileSchema } from "../../validators/user.schema";
import type { RouteDefinition } from "../types";
import { getProfileDoc, updateProfileDoc } from "./swagger/profile.swagger";

const controller = new UserController();

const profileRoutes: RouteDefinition[] = [
  {
    path: "/profile",
    controller: { get: controller.getProfile },
    middlewares: { get: authenticateToken },
    docs: getProfileDoc
  },
  {
    path: "/profile",
    controller: { put: controller.updateProfile },
    validators: { put: useValidator(updateProfileSchema) },
    middlewares: { put: authenticateToken },
    docs: updateProfileDoc,
  },
];

export default profileRoutes;
