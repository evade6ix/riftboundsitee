// server/routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // you will create this model next

// JWT secret – MUST exist in .env
const JWT_SECRET = process.env.JWT_SECRET || "changemepls";

// ----------------------------
// POST /register
// ----------------------------
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password)
      return res.status(400).json({ msg: "Missing email or password" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ msg: "Email already used" });

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hash,
      name: name || "User"
    });

    return res.json({
      msg: "Account created successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      }
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: "Server error" });
  }
});

// ----------------------------
// POST /login
// ----------------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ msg: "Missing fields" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ msg: "Invalid login" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ msg: "Invalid login" });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      msg: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      }
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
