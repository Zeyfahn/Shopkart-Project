import mongoose from "mongoose";

// A cart row stores only a reference + quantity.
// Price, name and stock are read from Product, so they can never go stale.
const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, default: 1, min: 1 },
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // always a bcrypt hash
    phone: { type: String, required: true, trim: true },
    cart: { type: [cartItemSchema], default: [] }, // existing customers load with []
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }], // product refs only
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model("Customer", customerSchema);
