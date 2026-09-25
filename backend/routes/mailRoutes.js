import { Router } from "express";
import requireAuth from "../middleware/auth.js";
import { sendBulkMail, getHistory } from "../controllers/mailController.js";

const router = Router();

router.post("/send", requireAuth, sendBulkMail);
router.get("/history", requireAuth, getHistory);

export default router;
