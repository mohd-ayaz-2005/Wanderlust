const express = require("express");
const router = express.Router({ mergeParams: true });

const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const Review = require("../Models/review.js");
const Listing = require("../Models/listing.js");
const isLoggedIn = require("../middleware/isLoggedIn.js");
const { isReviewAuthor } = require("../middleware/permissions.js");

// Post Route - wrapped in wrapAsync
router.post(
  "/",
  isLoggedIn,
  wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      // better to forward to error middleware
      return next(new ExpressError("Listing not found", 404));
    }

    // create review
    const newReview = new Review(req.body.review || {});
    newReview.author = req.user ? req.user._id : null;

    // if your Review schema has a reference to the listing, set it:
    if (!newReview.listing) newReview.listing = listing._id;

    // save once
    await newReview.save();

    // push review id to listing and save listing
    listing.reviews.push(newReview._id);
    await listing.save();

    res.redirect(`/listings/${id}`);
  })
);

// Delete Review Route
router.delete(
  "/:reviewId",
  isLoggedIn,
  isReviewAuthor,
  wrapAsync(async (req, res, next) => {
    const { id, reviewId } = req.params;

    // remove reference from listing
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });

    // remove review doc
    await Review.findByIdAndDelete(reviewId);

    res.redirect(`/listings/${id}`);
  })
);

// Edit Review form
router.get(
  "/:reviewId/edit",
  isLoggedIn,
  isReviewAuthor,
  wrapAsync(async (req, res, next) => {
    const { id, reviewId } = req.params;
    const listing = await Listing.findById(id);
    const review = await Review.findById(reviewId);
    if (!listing || !review) {
      req.flash("error", "Review not found");
      return res.redirect(`/listings/${id}`);
    }
    res.render("reviews/edit.ejs", { listing, review });
  })
);

// Update Review
router.put(
  "/:reviewId",
  isLoggedIn,
  isReviewAuthor,
  wrapAsync(async (req, res, next) => {
    const { id, reviewId } = req.params;
    const { comment, rating } = req.body.review || {};
    await Review.findByIdAndUpdate(
      reviewId,
      { comment, rating },
      { runValidators: true }
    );
    req.flash("success", "Review updated");
    res.redirect(`/listings/${id}`);
  })
);

module.exports = router;
