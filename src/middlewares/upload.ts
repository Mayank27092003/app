import multer from "multer";
import os from "os";
import path from "path";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(os.tmpdir(), "uploads")),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

export const uploadSingle = (fieldName: string) => multer({ storage }).single(fieldName);


