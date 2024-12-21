import express from "express"
import { signup,login,logout,refreshtoken,getProfile } from "../controllers/auth.controller.js";
import {isAuthenticated} from "../middleware/auth.middleware.js";
const router=express.Router();

router.route("/signup").post(signup);
router.route("/login").post(login);

router.route("/logout").post(logout);
router.route("/refresh-token").post(refreshtoken)
router.route("/profile").get(isAuthenticated,getProfile)


export default router

