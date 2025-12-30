module.exports = (req, res, next) => {
  console.log("isLoggedIn middleware hit for:", req.originalUrl);
  console.log("  In isLoggedIn, user:", req.user ? req.user.username : null);
  console.log(
    "  In isLoggedIn, isAuthenticated:",
    req.isAuthenticated ? req.isAuthenticated() : null
  );

  // Passport always adds req.isAuthenticated when session middleware is used
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    // remember the URL user was trying to access
    req.session.returnTo = req.originalUrl;

    req.flash("error", "You must be logged in to access this page!");
    return res.redirect("/login");
  }
  next();
};


