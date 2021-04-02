const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const { body, validationResult } = require("express-validator");
const { route } = require("./auth");

// @route    GET api/profile/me
// @desc     Mendapatkan route profile pengguna
// @access   Private

router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res.status(400).json({ msg: "There is no profile for this user" });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route    POST api/profile
// @desc     Menambahkan dan mengupdate profile pengguna
// @access   Private

router.post(
  "/",
  [
    auth,
    [
      body("status", "Status is required").not().isEmpty(),
      body("skills", "Skills is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    //Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;

    const { skills } = req.body;

    const standardFields = [
        "company",
        "website",
        "location",
        "bio",
        "status",
        "githubusername",
      ],
      socialFields = [
        "youtube",
        "facebook",
        "twitter",
        "instagram",
        "linkedin",
      ];

    standardFields.forEach((field) => {
      if (req.body[field]) profileFields[field] = req.body[field];
    });

    // Ubah ke array dengan memisahkan , (koma) split() dan mengolah data di map()
    if (skills) {
      profileFields.skills = skills.split(",").map((skill) => skill.trim());
    }

    // Build social object.

    profileFields.social = {};

    socialFields.forEach((field) => {
      if (req.body[field]) profileFields.social[field] = req.body[field];
    });

    try {
      let profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

module.exports = router;
