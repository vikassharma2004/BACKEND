import express from "express";
const router = express.Router();
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { getAnalyticsData, getDailySalesData } from "../controllers/analytics.controller.js";


router.route("/").get(isAuthenticated, async(req, res) => {
   try {
    const analyticsdata=await getAnalyticsData();
    const endDate = new Date();
		const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

		const dailySalesData = await getDailySalesData(startDate, endDate);

		res.json({
			analyticsdata,
			dailySalesData,
		});
   } catch (error) {
    console.log("Error in analytics route", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
   }
});

export default router;