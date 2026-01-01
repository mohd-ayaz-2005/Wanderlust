const express = require("express");
const router = express.Router();

// const path = require("path");
// const multer = require("multer");
// const upload = multer({ dest: path.join(__dirname, "..", "uploads/") });

const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../Models/listing.js");
const isLoggedIn = require("../middleware/isLoggedIn.js");
const { isListingOwner } = require("../middleware/permissions.js");
// const ExpressError = require("../utils/ExpressError.js");

//Index Route with pagination (6 per page) and sorting
router.get(
  "/",
  wrapAsync(async (req, res) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = 6;
    const skip = (page - 1) * limit;
    const sortParam = (req.query.sort || "new").toLowerCase();

    let sortStage;
    switch (sortParam) {
      case "cost-asc":
        sortStage = { price: 1, createdAt: -1 };
        break;
      case "cost-desc":
        sortStage = { price: -1, createdAt: -1 };
        break;
      case "rating-asc":
        sortStage = { avgRating: 1, createdAt: -1 };
        break;
      case "rating-desc":
        sortStage = { avgRating: -1, createdAt: -1 };
        break;
      case "old":
        sortStage = { createdAt: 1 };
        break;
      case "new":
      default:
        sortStage = { createdAt: -1 };
        break;
    }

    const [totalCount, listings] = await Promise.all([
      Listing.countDocuments({}),
      Listing.aggregate([
        {
          $lookup: {
            from: "reviews",
            localField: "reviews",
            foreignField: "_id",
            as: "reviews",
          },
        },
        {
          $addFields: {
            reviewCount: { $size: "$reviews" },
            avgRating: {
              $cond: [
                { $gt: [{ $size: "$reviews" }, 0] },
                { $avg: "$reviews.rating" },
                null,
              ],
            },
          },
        },
        { $sort: sortStage },
        { $skip: skip },
        { $limit: limit },
        { $project: { reviews: 0 } },
      ]),
    ]);

    const totalPages = Math.max(Math.ceil(totalCount / limit), 1);

    res.render("listings/index", {
      allListings: listings,
      currentPage: page,
      totalPages,
      sort: sortParam,
    });
  })
);

//New Route
router.get("/new", isLoggedIn, (req, res) => {
  res.render("listings/new.ejs");
});

//Show Route
router.get(
  "/:id",
  // listings,
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
      .populate({ path: "owner", select: "username name" })
      .populate({
        path: "reviews",
        populate: { path: "author", select: "username name" },
      });

    // compute overall rating
    let avgRating = null;
    let reviewCount = 0;
    if (listing && listing.reviews && listing.reviews.length > 0) {
      reviewCount = listing.reviews.length;
      avgRating =
        listing.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
        reviewCount;
    }

    res.render("listings/show.ejs", { listing, avgRating, reviewCount });
  })
);

//Create Route
router.post(
  "/",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    if (!req.body.listing) {
      throw new Error("Listing data missing");
    }

    const listing = new Listing(req.body.listing);
    listing.owner = req.user._id;

    await listing.save();
    res.redirect("/listings");
  })
);

//Edit Route
router.get(
  "/:id/edit",
  isLoggedIn,
  isListingOwner,
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing });
  })
);

//Update Route
router.put(
  "/:id",
  isLoggedIn,
  isListingOwner,
  wrapAsync(async (req, res) => {
    if (!req.body.listing) {
      throw new Error("Listing data missing");
    }

    const listing = await Listing.findById(req.params.id);

    // update fields manually (SAFE)
    listing.title = req.body.listing.title;
    listing.description = req.body.listing.description;
    listing.price = req.body.listing.price;
    listing.country = req.body.listing.country;
    listing.location = req.body.listing.location;

    // 🔥 MOST IMPORTANT FIX
    if (req.body.listing.image?.url) {
      listing.image.url = req.body.listing.image.url;
    }

    await listing.save();
    res.redirect(`/listings/${listing._id}`);
  })
);

//Delete Route
router.delete(
  "/:id",
  isLoggedIn,
  isListingOwner,
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    res.redirect("/listings");
  })
);

module.exports = router;
