const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define User and DrainageBlock Schemas
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
});

const drainageBlockSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  location: String,
  description: String,
  reportedAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const DrainageBlock = mongoose.model("DrainageBlock", drainageBlockSchema);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
app.get("/profile/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Fetch user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Fetch drainage blocks reported by the user (sorted by date)
    const drainageBlocks = await DrainageBlock.find({ userId })
      .sort({ reportedAt: -1 }) // Sort by latest first
      .exec();

    res.render("profile", { user, drainageBlocks });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});