import mongoose from "mongoose";
import bcrypt from "bcryptjs"
const userSchema = new mongoose.Schema({
  name: {
    required: [true, "Please enter your name"],
    type: String,
  },

  email: {
    unique: true,
    required: [true, "Please enter your email"],
    type: String,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    minlength: [6, "Password must be at least 6 characters long"],
  },
  cartitems: [
    {
      quantity: {
        type: Number,
        default: 1,
      },
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    },
  ],
  role:{
    enum:["customer","admin"],
    type:String,
    default:"customer"
  }
},{timestamps:true})

// using mongo pre funtionto hash pass word
userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next();

	try {
		const salt = await bcrypt.genSalt(10);
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (error) {
		next(error);
	}
});

userSchema.methods.comparePassword = async function (password) {
	return bcrypt.compare(password, this.password);
};



export const User = mongoose.model("User", userSchema);
