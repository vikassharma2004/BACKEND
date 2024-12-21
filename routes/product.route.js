import express from "express";
import { createProduct, deleteProduct, getAllProducts, getFeaturedProducts,getProductsByCategory,getRecomendedProducts, toggleFeaturedProduct } from "../controllers/product.controller.js";
import { isAuthenticated,adminRoute } from "../middleware/auth.middleware.js";

const router=express.Router();

router.route("/").get(isAuthenticated,adminRoute,getAllProducts)
router.route("/featuredproducts").get(getFeaturedProducts)
router.route("/category/:category").get(getProductsByCategory)
router.route("/recomendations").get(getRecomendedProducts)
router.route("/create").post(isAuthenticated,adminRoute,createProduct)
router.route("/:id").delete(isAuthenticated,adminRoute,deleteProduct)
router.route("/:id").patch(isAuthenticated,adminRoute,toggleFeaturedProduct)

export default router