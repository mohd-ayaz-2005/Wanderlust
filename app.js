require("dotenv").config();

const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./Models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
//const { listingSchema } = require("./schema.js");
const { resourceLimits } = require("worker_threads");
const Review = require("./Models/review.js");
const multer = require("multer");
const upload = multer({ dest: path.join(__dirname, "uploads/") });

//Authentication
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./Models/user.js");

//Routers
const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const { func } = require("joi");

const MONGO_URL = process.env.MONGO_URL;

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });
async function main() {
  await mongoose.connect(MONGO_URL);
}

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Simple logger to see auth state on each request
app.use((req, res, next) => {
  console.log("REQ:", req.method, req.originalUrl);
  console.log("  User:", req.user ? req.user.username : null);
  console.log(
    "  isAuthenticated:",
    req.isAuthenticated ? req.isAuthenticated() : null
  );
  next();
});

// function validateListing(req, res, next) {
// const { error } = listingSchema.validate(req.body);
// if (error) {
// const msg = error.details.map((el) => el.message).join(", ");
// return next(new ExpressError(msg, 400)); // }
// next();
// }

// app.get("/", (req, res) => {
//   res.send("Hi, I am root");
// });

app.get("/", (req, res) => {
  res.redirect("/signup");
});

app.get("/demouser", async (req, res) => {
  let fakeUser = new User({
    email: "student@gmail.com",
    username: "delta-student",
  });
  let registerdUser = await User.register(fakeUser, "helloworld");
  console.log("DEMO USER:", registerdUser.username);
  res.send("demo user created");
});

// session store (recommended for production; works fine in dev too)
const sessionStore = MongoStore.create({
  mongoUrl: MONGO_URL,
  touchAfter: 24 * 3600,
});

const sessionOptions = {
  store: sessionStore,
  name: "session",
  secret: process.env.SESSION_SECRET || "renderfallbacksecret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username });
      if (!user) return done(null, false, { message: "Invalid username" });

      const result = await user.authenticate(password);
      if (!result.user)
        return done(null, false, { message: "Invalid password" });

      return done(null, result.user);
    } catch (err) {
      return done(err);
    }
  })
);

//passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Make flash + currentUser available in all templates
app.use((req, res, next) => {
  res.locals.currentUser = req.user || null;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);

// app.get("/demouser", async (req, res) => {
//   let fakeUser = new User({
//     email: "student@gmail.com",
//     username: "delta-student",
//   });

//   let registerdUser = await User.register(fakeUser, "helloworld");
//   res.send(registerdUser);
// });

//All Page Error 404
app.use((req, res, next) => {
  next(new ExpressError("Page Not Found!!", 404));
});

//Error Handler — safer
app.use((err, req, res, next) => {
  console.error("ERROR:", err); // helpful for debugging
  const statusCode = Number(err.statusCode) || 500;
  const message = err.message || "Something went wrong";
  res.status(statusCode).render("listings/error.ejs", { message });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
