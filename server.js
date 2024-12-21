import express, { urlencoded } from "express"
import dotenv from "dotenv"
import authRoutes from "./routes/auth.route.js"
import productsRoutes from "./routes/product.route.js"
import cartRoutes from "./routes/cart.route.js"
import couponRoute from "./routes/coupon.route.js"
import analyticsRoute from "./routes/analytics.route.js"
import paymentRoutes from "./routes/payment.route.js"
import { connectdb } from "./lib/db.js";
import cookieParser from "cookie-parser";
import cors from "cors"

dotenv.config();
const app=express();

const port =process.env.PORT;

const corsoption = {
    credentials: true,
    origin: "http://localhost:5173",
    methods: "GET,PUT,PATCH,DELETE,POST,HEAD",
  };
  app.use(cors(corsoption));

app.use(cookieParser())
app.use(express.json({limit:"50mb"}))
app.use(urlencoded({extended:true}))
app.use("/api/auth",authRoutes)
app.use("/api/products",productsRoutes)
app.use("/api/cart",cartRoutes)
app.use("/api/coupons",couponRoute)
app.use("/api/analytics",analyticsRoute)
app.use("/api/payments", paymentRoutes);

// authentication
app.listen(port,()=>{
    console.log("server stated http://localhost"+port);
    connectdb()
    
})
