import express from "express"
import { addtocart, getcart, removefromcart, updatequantity } from "../controllers/cart.controller.js"
import {isAuthenticated} from "../middleware/auth.middleware.js"
const router=express.Router()


router.route("/").get(isAuthenticated,getcart)
router.route("/").post(isAuthenticated,addtocart)
router.route("/").delete(isAuthenticated,removefromcart)
router.route("/:id").put(isAuthenticated,updatequantity)

export default router