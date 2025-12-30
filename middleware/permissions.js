const Listing = require("../Models/listing");
const Review = require("../Models/review");

// Ensure the current user owns the listing
const isListingOwner = async (req, res, next) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing || !listing.owner) {
    req.flash("error", "You do not have permission to do that.");
    return res.redirect(`/listings/${id}`);
  }
  if (!req.user || listing.owner.toString() !== req.user._id.toString()) {
    req.flash("error", "You do not have permission to do that.");
    return res.redirect(`/listings/${id}`);
  }
  next();
};

// Ensure the current user owns the review
const isReviewAuthor = async (req, res, next) => {
  const { reviewId, id } = req.params;
  const review = await Review.findById(reviewId);
  if (!review || !review.author) {
    req.flash("error", "You do not have permission to do that.");
    return res.redirect(`/listings/${id}`);
  }
  if (!req.user || review.author.toString() !== req.user._id.toString()) {
    req.flash("error", "You do not have permission to do that.");
    return res.redirect(`/listings/${id}`);
  }
  next();
};

module.exports = { isListingOwner, isReviewAuthor };


