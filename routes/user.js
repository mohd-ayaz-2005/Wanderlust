const express = require("express");
const router = express.Router();
const User = require("../Models/user");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const isLoggedIn = require("../middleware/isLoggedIn");

// Signup form
router.get("/signup", (req, res) => {
  res.render("users/signup.ejs");
});

// Signup handler
router.post(
  "/signup",
  wrapAsync(async (req, res) => {
    const { username, email, password, name } = req.body;
    const newUser = new User({ email, username, name });
    await User.register(newUser, password);
    req.flash("success", "Welcome to Wanderlust");
    res.redirect("/listings");
  })
);

// Login form
router.get("/login", (req, res) => {
  res.render("users/login.ejs");
});

// Login handler
router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    const redirectUrl = req.session.returnTo || "/listings";
    delete req.session.returnTo;
    req.flash("success", "Logged in!");
    res.redirect(redirectUrl);
  }
);

// Logout
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "Logged out!");
    res.redirect("/listings");
  });
});

// Account settings
router.get("/account", isLoggedIn, (req, res) => {
  res.render("users/account.ejs", { user: req.user });
});

// Update profile (name, username, email)
router.post(
  "/account/profile",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const { name, username, email } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/account");
    }
    user.name = name;
    user.username = username;
    user.email = email;
    await user.save();
    req.flash("success", "Profile updated");
    res.redirect("/account");
  })
);

// Change password
router.post("/account/password", isLoggedIn, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      req.flash("error", "Please provide current and new password");
      return res.redirect("/account");
    }
    await req.user.changePassword(currentPassword, newPassword);
    req.flash("success", "Password updated");
    res.redirect("/account");
  } catch (err) {
    console.error(err);
    req.flash("error", err.message || "Could not change password");
    res.redirect("/account");
  }
});

module.exports = router;
