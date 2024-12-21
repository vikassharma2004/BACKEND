import express from "express";
const router = express.Router();
import {isAuthenticated} from "../middleware/auth.middleware.js";
import { getcoupons ,ValidateCoupon} from "../controllers/coupon.controller.js";

router.route("/").get(isAuthenticated,getcoupons);
router.route("/validate").post(isAuthenticated,ValidateCoupon);

export default router;
