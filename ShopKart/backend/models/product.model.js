import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: {
      type: Number,
      required: true,
      validate: { validator: (v) => v > 0, message: "Price must be greater than 0" },
    },
    category: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    stock: {
      type: Number,
      required: true,
      min: [0, "Stock cannot be negative"],
      validate: { validator: Number.isInteger, message: "Stock must be a whole number" },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model("Product", productSchema);
