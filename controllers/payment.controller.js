import Coupon from "../model/coupon.model.js";
import {stripe} from "../lib/stripe.js";
import Order from "../model/order.model.js";
export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponcode } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res
        .status(400)
        .json({ message: "Please provide an array of products" });
    }

    let totalamount = 0;
    const lineItems = products.map((product) => {
      const amount = Math.round(product.price * 100); // Stripe expects amounts in cents
      totalamount += amount * product.quantity;

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            images: [product.image],
          },
          unit_amount: amount,
        },
        quantity: product.quantity,
      };
    });

    let coupon = null;
    if (couponcode) {
      coupon = await Coupon.findOneAndUpdate(
        { code: couponcode, userId: req.user._id },
        { isActive: false },
        { new: true }
      );

      if (coupon) {
        totalamount -= Math.round(
          (totalamount * coupon.discountPercentage) / 100
        );
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `http://localhost:5173/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:5173/purchase-cancel`,
      discounts: coupon
				? [
						{
							coupon: await createStripeCoupon(coupon.discountPercentage),
						},
				  ]
				: [],
      customer_email: req.user.email,
      metadata: {
        userId: req.user._id.toString(),
        couponCode: couponcode || "",
        products: JSON.stringify(
          products.map((p) => ({
            id: p._id,
            quantity: p.quantity,
            price: p.price,
          }))
        ),
      },
    });

    if (totalamount >= 20000) {
      await createnewcoupon(req.user._id);
    }

    res.status(200).json({ id: session.id, totalamount: totalamount / 100 });
  } catch (error) {
    console.error("Error creating checkout session:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

  

  export const checkoutSuccess = async (req, res) => {
	try {
		const { sessionId } = req.body;
		const session = await stripe.checkout.sessions.retrieve(sessionId);

		if (session.payment_status === "paid") {
			if (session.metadata.couponCode) {
				await Coupon.findOneAndUpdate(
					{
						code: session.metadata.couponCode,
						userId: session.metadata.userId,
					},
					{
						isActive: false,
					}
				);
			}

			// create a new Order
			const products = JSON.parse(session.metadata.products);
			const newOrder = new Order({
				user: session.metadata.userId,
				products: products.map((product) => ({
					product: product.id,
					quantity: product.quantity,
					price: product.price,
				})),
				totalAmount: session.amount_total / 100, // convert from cents to dollars,
				stripeSessionId: sessionId,
			});

			await newOrder.save();

			res.status(200).json({
				success: true,
				message: "Payment successful, order created, and coupon deactivated if used.",
				orderId: newOrder._id,
			});
		}
	} catch (error) {
		console.error("Error processing successful checkout:", error);
		res.status(500).json({ message: "Error processing successful checkout", error: error.message });
	}
}

  async function createStripeCoupon(discountPercentage) {
    const coupon = await stripe.coupons.create({
      percent_off: discountPercentage,
      duration: "once",
    });
    return coupon.id;
  }
  
  const createnewcoupon = async (userId) => {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 7); // Example: 7 days from now

  const newCoupon = new Coupon({
    code: `SAVE${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    discountPercentage: 10, // Example discount
    userId: userId,
    expirationDate: expirationDate,
  });

  return await newCoupon.save(); // Save the coupon to the database
};
