const express = require("express");
const router = new express.Router();
const UserModel = require("./../model/User");
const protectAdminRoute = require("./../middlewares/protectAdminRoute");
const uploader = require("./../config/cloudinary");
const bcrypt = require("bcrypt"); // lib to encrypt data

router.get("/signin", (req, res, next) => {
    res.render("auth/signin.hbs")
});

router.get("/signup", (req, res, next) => {
    res.render("auth/signup.hbs")
})


router.get("/signout", (req, res, next) => {
    req.session.destroy(function (err) {
        console.log("LOGOUT")
        res.redirect("/");
    });
});


router.post("/signin", async (req, res, next) => {

    const { email, password } = req.body;
    const foundUser = await UserModel.findOne({ email: email });
    if (!foundUser) {
      req.flash("error", "Invalid credentials");
      res.redirect("/auth/signin");
    } else {
      const isSamePassword = bcrypt.compareSync(password, foundUser.password);
      if (!isSamePassword) {
        req.flash("error", "Invalid credentials");
        res.redirect("/auth/signin");
      } else {
        const userObject = foundUser.toObject();
        delete userObject.password; // remove password before saving user in session
        // console.log(req.session, "before defining current user");
        req.session.currentUser = userObject; // Stores the user in the session (data server side + a cookie is sent client side)
        req.flash("success", "Successfully logged in...");
        res.redirect("/");
      }
    }
  });
 //avatar: req.file.path,
  router.post("/signup", uploader.single("avatar"), async (req, res, next) => {
    
    try {
      const newUser = { ...req.body }; // clone req.body with spread operator
      const foundUser = await UserModel.findOne({email: newUser.email });

      if (foundUser) {
        req.flash("warning", "Email already registered");
        res.redirect("/auth/signup");
      } else {

        const hashedPassword = bcrypt.hashSync(newUser.password, 10);
        newUser.password = hashedPassword;
        if (!req.file) UserModel.avatar = undefined;
        else UserModel.avatar = req.file.path;
        await UserModel.create(newUser);
        req.flash("success", "Congrats ! You are now registered !");
        res.redirect("/auth/signin");
      }
    } catch (err) {
      let errorMessage = "";
      for (field in err.errors) {
        errorMessage += err.errors[field].message + "\n";
      }
      req.flash("error", errorMessage);
      res.redirect("/auth/signup");
    }
  });


  module.exports = router;