import Product from "../model/product.model.js";
import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
export const getAllProducts = async (req, res) => {
  try {
    // If not found in Redis, fetch from the database
    const products = await Product.find({});

    return res.status(200).json( products );
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    // lean method is going to return plain js object instead of mongo object
    let featuredproducts = await redis.get("featured_products")
    if (featuredproducts) {
      // If data exists in Redis, parse and return it
      return res.json(JSON.parse(featuredproducts));
    }

    /// if not in redis then fetch from db
    featuredproducts = await Product.find({ isFeatured: true });

    if (!featuredproducts) {
      res.status(404).json([], { message: "No featured products found" });
    }
    // store in redis for fututre qick access
    await redis.set("featured_products", JSON.stringify(featuredproducts));
    res.json(featuredproducts);
  } catch (error) {
    console.log("error in getting featured products", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, image, category } = req.body;

    let cloudinaryresponse = null;

    if (image) {
      await cloudinary.uploader.upload(image, (error, result) => {
        if (error) {
          console.log("error in uploading image", error);
          return res.status(500).json({ message: "Internal server error" });
        }
        cloudinaryresponse = result;
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      image: cloudinaryresponse.secure_url,
      category,
    });

    res.status(201).json({ product });
  } catch (error) {
    console.log("error in creating product", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    await redis.del("featured_products");
    await redis.del("products");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.image) {
      const publicId = product.image.split("/").pop().split(".")[0]; /// get the id of image
      try {
        await cloudinary.uploader.destroy(`products/${publicId}`);
        console.log("deleted image from cloduinary");
      } catch (error) {
        console.log("error deleting image from cloduinary", error);
      }
    }
    const updatedFeaturedProducts = await Product.find({ isFeatured: true });
    console.log(updatedFeaturedProducts);

    await redis.set(
      "featured_products",
      JSON.stringify(updatedFeaturedProducts)
    );
    await Product.findByIdAndDelete(req.params.id);

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.log("Error in deleteProduct controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const getRecomendedProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $sample: { size: 4 },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          image: 1,
          price: 1,
        },
      },
    ]);

    res.json(products);
  } catch (error) {
    console.log("Error in getRecommendedProducts controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  const { category } = req.params;
  try {
    const products = await Product.find({ category });
    res.json({ products });
  } catch (error) {
    console.log("Error in getProductsByCategory controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const toggleFeaturedProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      product.isFeatured = !product.isFeatured;
      const updatedProduct = await product.save();
      await updateFeaturedProductsCache();

      res.status(200).json(updatedProduct);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.log("Error in toggleFeaturedProduct controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

async function updateFeaturedProductsCache() {
  try {
    // The lean() method  is used to return plain JavaScript objects instead of full Mongoose documents. This can significantly improve performance

    const featuredProducts = await Product.find({ isFeatured: true }).lean();
    await redis.set("featured_products", JSON.stringify(featuredProducts));
  } catch (error) {
    console.log("error in update cache function");
  }
}
