module.exports = (req, res, next) => {
  req.body.listing = req.body.listing || {};

  // CASE 1: File upload
  if (req.file) {
    req.body.listing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
  }
  // CASE 2: Empty string
  else if (
    !req.body.listing.image ||
    (typeof req.body.listing.image === "string" &&
      req.body.listing.image.trim() === "")
  ) {
    req.body.listing.image = null;
  }
  // CASE 3: URL string
  else if (typeof req.body.listing.image === "string") {
    req.body.listing.image = {
      url: req.body.listing.image.trim(),
      filename: "",
    };
  }

  next();
};
