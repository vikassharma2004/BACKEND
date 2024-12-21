import express from "express";
const router = express.Router();
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { checkoutSuccess, createCheckoutSession } from "../controllers/payment.controller.js";

// router.route("/create-checkout-session").post(isAuthenticated,createCheckoutSession)
router.post("/create-checkout-session", isAuthenticated,createCheckoutSession );
router.post("/checkout-success", isAuthenticated,checkoutSuccess );

export default router;
