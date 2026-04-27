const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   MONGODB CONNECT
========================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

/* =========================
   USER SCHEMA & MODEL
========================= */
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'customer' }
});

const User = mongoose.model("User", userSchema);

/* =========================
   PURCHASE SCHEMA
========================= */
const purchaseSchema = new mongoose.Schema({
  customer: {
    fname: String,
    lname: String,
    email: String,
    phone: String,
    address1: String,
    address2: String,
    city: String,
    postcode: String
  },
  items: [
    {
      id: String,
      name: String,
      price: Number,
      qty: Number,
      img: String
    }
  ],
  delivery: {
    kind: String,
    cost: Number
  },
  total: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Purchase = mongoose.model("Purchase", purchaseSchema);

/* =========================
   PRODUCT SCHEMA
========================= */
const productSchema = new mongoose.Schema({
    name        : String,
    description : String,
    category    : String,
    price       : Number,
    unit        : String,
    quantity    : Number,
    image       : String
});

const Product = mongoose.model('Product', productSchema);

/* =========================
   PRODUCT ROUTES
========================= */
app.get('/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ category: 1 });
        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching products' });
    }
});

app.put('/products/:id', async (req, res) => {
    try {
        const { quantity, price } = req.body;
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { quantity, price },
            { new: true }
        );
        res.json({ success: true, product });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating product' });
    }
});

/* =========================
   SIGNUP
========================= */
app.post("/signup", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashed, role: role || 'customer' });
    await user.save();

    res.json({ message: "User created" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error creating user" });
  }
});

/* =========================
   LOGIN
========================= */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.json({ message: "Incorrect password" });
    }

    res.json({ 
        message: "Login successful", 
        email: user.email, 
        role: user.role 
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error logging in" });
  }
});

/* =========================
   PLACE ORDER
========================= */
app.post("/checkout", async (req, res) => {
  try {
    const data = req.body;
    console.log("RECEIVED ORDER:", data);

    const purchase = new Purchase({
      customer: {
        fname: data.fname,
        lname: data.lname,
        email: data.email,
        phone: data.phone,
        address1: data.address1,
        address2: data.address2,
        city: data.city,
        postcode: data.postcode
      },
      items: data.items,
      delivery: {
        kind: data.deliveryType,
        cost: data.deliveryCost
      },
      total: data.total
    });

    await purchase.save();

    res.json({ message: "Order saved successfully", orderId: purchase._id });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error saving order" });
  }
});

/* =========================
   GET PURCHASES BY EMAIL
========================= */
app.get("/purchases/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const purchases = await Purchase.find({ "customer.email": email }).sort({ createdAt: -1 });
    res.json(purchases);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error fetching purchases" });
  }
});

/* =========================
   GET ALL ORDERS
========================= */
app.get("/orders", async (req, res) => {
  try {
    const email = req.query.email;
    const query = email ? { "customer.email": email } : {};
    const purchases = await Purchase.find(query).sort({ createdAt: -1 });
    console.log("Orders found:", purchases);
    res.json(purchases);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching orders" });
  }
});

/* =========================
   START SERVER
========================= */
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
