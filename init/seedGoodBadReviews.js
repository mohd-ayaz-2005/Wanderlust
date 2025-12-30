const mongoose = require("mongoose");
const Listing = require("../Models/listing");
const Review = require("../Models/review");
const User = require("../Models/user");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

const reviewers = [
  { username: "happy_traveler", name: "Happy Traveler", email: "happy@example.com" },
  { username: "picky_guest", name: "Picky Guest", email: "picky@example.com" },
  { username: "city_explorer", name: "City Explorer", email: "city@example.com" },
  { username: "budget_backpacker", name: "Budget Backpacker", email: "budget@example.com" },
  { username: "family_trip", name: "Family Trip", email: "family@example.com" },
];

const reviewTemplates = [
  {
    comment: "Fantastic stay! Super clean, great host, and amazing location.",
    rating: 5,
    user: "happy_traveler",
  },
  {
    comment: "Could be better. Noise at night and the bedding wasn't very comfy.",
    rating: 2,
    user: "picky_guest",
  },
  {
    comment: "Loved walking everywhere; cafes and transit right outside.",
    rating: 5,
    user: "city_explorer",
  },
  {
    comment: "Great value for the price. Basic but had everything I needed.",
    rating: 4,
    user: "budget_backpacker",
  },
  {
    comment: "Spacious for the kids, kitchen was helpful, host was kind.",
    rating: 5,
    user: "family_trip",
  },
  {
    comment: "Place was fine overall, but cleaning could be more thorough.",
    rating: 3,
    user: "picky_guest",
  },
];

async function ensureReviewer(username, name, email) {
  let user = await User.findOne({ username });
  if (!user) {
    user = new User({ username, name, email });
    await User.register(user, "password123");
    console.log(`Created reviewer ${username}`);
  }
  return user;
}

async function seed() {
  await mongoose.connect(MONGO_URL);
  console.log("Connected to DB");

  const userMap = {};
  for (const r of reviewers) {
    userMap[r.username] = await ensureReviewer(r.username, r.name, r.email);
  }

  const listings = await Listing.find({});
  console.log(`Found ${listings.length} listings`);

  for (const listing of listings) {
    // Add a handful of varied reviews regardless of existing ones
    for (const tpl of reviewTemplates) {
      const author = userMap[tpl.user];
      const review = new Review({
        comment: tpl.comment,
        rating: tpl.rating,
        author: author._id,
      });
      await review.save();
      listing.reviews.push(review._id);
    }
    await listing.save();
    console.log(`Added good/bad reviews to ${listing.title}`);
  }

  await mongoose.connection.close();
  console.log("Done seeding good/bad reviews.");
}

seed().catch((err) => {
  console.error(err);
  mongoose.connection.close();
});


