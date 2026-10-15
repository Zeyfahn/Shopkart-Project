import "dotenv/config";
import mongoose from "mongoose";
import Product from "./models/product.model.js";

const img = (seed) => `https://picsum.photos/seed/${seed}/600/450`;

const products = [
  { name: "Mechanical Keyboard", description: "RGB mechanical keyboard with blue switches.", price: 2999, category: "Electronics", image: img("keyboard"), stock: 10 },
  { name: "Wireless Mouse", description: "Ergonomic 2.4GHz wireless mouse.", price: 1499, category: "Electronics", image: img("mouse"), stock: 25 },
  { name: "Noise Cancelling Headphones", description: "Over-ear wireless headphones with ANC.", price: 4999, category: "Electronics", image: img("headphones"), stock: 5 },
  { name: "Cotton Hoodie", description: "Midweight unisex pullover hoodie.", price: 1799, category: "Fashion", image: img("hoodie"), stock: 15 },
  { name: "Running Shoes", description: "Lightweight everyday running shoes.", price: 3499, category: "Fashion", image: img("shoes"), stock: 8 },
  { name: "Atomic Habits", description: "Paperback edition.", price: 499, category: "Books", image: img("book"), stock: 40 },
  { name: "Steel Water Bottle", description: "1 litre insulated bottle, keeps cold for 24h.", price: 899, category: "Home", image: img("bottle"), stock: 3 },
  { name: "Desk Lamp", description: "Dimmable LED lamp with USB port.", price: 1299, category: "Home", image: img("lamp"), stock: 0 },
];

await mongoose.connect(process.env.MONGO_URI);
await Product.deleteMany({});
await Product.insertMany(products);
console.log(`Seeded ${products.length} products`);
await mongoose.disconnect();
