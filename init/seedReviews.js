const mongoose = require("mongoose");
const Listing = require("../Models/listing");
const Review = require("../Models/review");
const User = require("../Models/user");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

const sampleUsers = [
  { username: "reviewer_alex", name: "Alex Carter", email: "alex@example.com" },
  { username: "reviewer_sam", name: "Samantha Lee", email: "sam@example.com" },
  { username: "reviewer_raj", name: "Raj Verma", email: "raj@example.com" },
];

const sampleReviews = [
  {
    comment: "Wonderful stay, very clean and cozy. Host was responsive!",
    rating: 5,
  },
  {
    comment: "Great location and comfortable bed. Would book again.",
    rating: 4,
  },
  {
    comment: "Nice place with all basic amenities. Good value.",
    rating: 4,
  },
];

async function ensureUsers() {
  const createdUsers = [];
  for (const u of sampleUsers) {
    let user = await User.findOne({ username: u.username });
    if (!user) {
      user = new User({ username: u.username, email: u.email, name: u.name });
      // set a default password; change as needed
      await User.register(user, "password123");
      console.log(`Created user ${u.username}`);
    }
    createdUsers.push(user);
  }
  return createdUsers;
}

async function addReviews() {
  await mongoose.connect(MONGO_URL);
  console.log("Connected to DB");

  const users = await ensureUsers();
  const listings = await Listing.find({});
  console.log(`Found ${listings.length} listings`);

  for (const listing of listings) {
    // skip if listing already has reviews
    if (listing.reviews && listing.reviews.length > 0) {
      continue;
    }

    const reviewsToAdd = sampleReviews.slice(0, 2); // add first two sample reviews

    for (let i = 0; i < reviewsToAdd.length; i++) {
      const author = users[i % users.length];
      const r = reviewsToAdd[i];
      const review = new Review({
        comment: r.comment,
        rating: r.rating,
        author: author._id,
      });
      await review.save();
      listing.reviews.push(review._id);
    }

    await listing.save();
    console.log(`Added ${reviewsToAdd.length} reviews to listing ${listing.title}`);
  }

  await mongoose.connection.close();
  console.log("Done");
}

addReviews().catch((err) => {
  console.error(err);
  mongoose.connection.close();
});


