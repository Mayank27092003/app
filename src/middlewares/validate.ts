import { Request, Response, NextFunction } from "express";
import Ajv, { ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import ajvErrors from "ajv-errors";

const ajv = new Ajv({ allErrors: true, strict: true, removeAdditional: false });
addFormats(ajv);
ajvErrors(ajv);

export function buildValidator(schema: object): ValidateFunction {
  return ajv.compile(schema);
}

export const validate =
  (validator: ValidateFunction) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const valid = validator(req.body);
      if (!valid) {
        const formattedErrors = (validator.errors || []).map((err) => {
          const field =
            err.keyword === "required"
              ? err.params.missingProperty
              : err.instancePath.replace(/^\//, "");
          return {
            ...err,
            field,
            message: `${err.params.missingProperty ? "" : field} ${
              err.message
            }`.trim(), // 🧼 add space and trim
          };
        });

        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: formattedErrors,
        });
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };

export const useValidator = (schema: object) =>
  validate(buildValidator(schema));
