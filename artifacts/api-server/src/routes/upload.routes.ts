import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth";
import { StorageService } from "../services/storage.service";
import { AppError } from "../utils/app-error";
import { sendCreated } from "../utils/response";

const router = Router();

// Setup multer memory storage (stores file in memory buffer before upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      "application/pdf",
      "application/msword", // .doc
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/rtf",
      "text/rtf",
      "image/jpeg",
      "image/png",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError("Unsupported file type. Allowed formats: PDF, DOC, DOCX, RTF, JPEG, PNG", 400, "UNSUPPORTED_FILE_TYPE") as any);
    }
  },
});

/**
 * Handle multipart uploads
 */
router.post(
  "/upload",
  requireAuth,
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw AppError.badRequest("No file uploaded in the 'file' field.");
      }

      const result = await StorageService.uploadFile(req.file);
      sendCreated(res, result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
