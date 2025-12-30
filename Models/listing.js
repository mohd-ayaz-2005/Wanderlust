const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const imageSchema = new Schema({
  filename: { type: String, default: "listingimage" },
  url: {
    type: String,
    default: null,
  },
});

const listingSchema = new Schema(
  {
    title: { type: String, required: true },
    description: String,
    // main/legacy image
    image: imageSchema,
    // gallery images (max 5 used in views)
    images: [imageSchema],
    price: Number,
    location: String,
    country: String,
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
  },
  { timestamps: true }
);

// DELETE HOOK – FIXED
listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

module.exports = mongoose.model("Listing", listingSchema);
