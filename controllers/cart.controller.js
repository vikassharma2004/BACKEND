

import Product from "../model/product.model.js";




export const addtocart = async (req, res) => {
    
    try {
      const {productId}=req.body;
      const user=req.user;
      const existingitem=user.cartitems.find(item=>item.productId==productId);
      if(existingitem){
        existingitem.quantiy+=1;
       
      
      }else{
       user.cartitems.push(productId);
    }
    await user.save();
    res.json(user.cartitems);    
  } catch (error) {
    console.log("Error in addtocart controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
    
  }
};

export const removefromcart = async (req, res) => {
    try {
        
        const {productid}=req.body;
        const user=req.user;
        if(!productid){
            user.cartitems=[];
        }   else{
            user.cartitems=user.cartitems.filter(item=>item!=productid);
        }
        await user.save();
        res.json(user.cartitems);
    } catch (error) {
        console.log("Error in removefromcart controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
        
    }
};

export const updatequantity = async (req, res) => {
    try {
		const { id: productId } = req.params;
		const { quantity } = req.body;
		const user = req.user;
		const existingItem = user.cartitems.find((item) => item.id === productId);

		if (existingItem) {
			if (quantity === 0) {
				user.cartitems = user.cartitems.filter((item) => item.id !== productId);
				await user.save();
				return res.json(user.cartitems);
			}

			existingItem.quantity = quantity;
			await user.save();
			res.json(user.cartitems);
		} else {
			res.status(404).json({ message: "Product not found" });
		}
	} catch (error) {
		console.log("Error in updateQuantity controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
}

export const getcart = async (req, res) => {
    try {
		const products = await Product.find({ _id: { $in: req.user.cartitems } });
   
    

		// add quantity for each product
		const cartItems = products.map((product) => {
			const item = req.user.cartitems.find((cartItem) => cartItem.id === product.id);
			return { ...product.toJSON(), quantity: item.quantity };
		});

		res.json(cartItems);
	} catch (error) {
		console.log("Error in getCartProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
}