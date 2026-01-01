const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const imageSchema = new Schema({
  url: {
    type: String,
    required: true,
  },
});

const listingSchema = new Schema(
  {
    title: { type: String, required: true },
    description: String,

    image: {
      url: {
        type: String,
        required: true,
      },
    },

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
