//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String,
  time: String,
  data: String,
  role: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

module.export = User;

var car = [];

const clientschema = new mongoose.Schema({
  doj: String,
  role: String,
  pay: Number,
  dor: String,
  sec:String,
  nop: Number,
});

var Client = mongoose.model("Client", clientschema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log(profile);

      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/update", function (req, res) {
  res.render("update");
});

app.get("/admininfo", function (req, res) {
  var d = {};
  var k = Client.find({}, function (err, docs) {
    d = docs;
    res.render("admininfo", { docs: d });
  });
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

 app.get("/hehe", function (req, res) {
   res.render("hehe");
 });

app.get("/userinfo", function (req, res) {
  res.render("userinfo");
});

app.get("/secrets", function (req, res) {
  res.render("secrets");
});

app.get("/submit", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", function (req, res) {
  const submittedSecret = req.body.secret;

  User.findById(req.user.id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(function () {
          res.redirect("/secrets");
        });
      }
    }
  });
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

app.post("/register", function (req, res) {
  var d = req.body.dateofjoin;
  var r = req.body.role;
  var pay = req.body.pay;
  var sec = req.body.sec;

  const testclient = new Client({
    doj: d,
    role: r,
    pay: pay,
    sec: sec,
  });
  var id = 0;
  testclient
    .save()
    .then((doc) => {
      id = doc._id;
      console.log(JSON.stringify(id));
    })
    .catch((err) => {
      console.log("error" + err);
    });

  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.render("reguser");
      } else {
        passport.authenticate("local")(req, res, function () {
          if (
            req.body.username == "admin@123" ||
            req.body.username == "admin@admin.com"
          )
          {
            res.redirect("/hehe");
          }
          else {
            res.render("secrets", { id: JSON.stringify(id).slice(1, -1) });
          }
        });
      }
    }
  );
});

app.post("/userinfo", function (req, res) {

  var d = {};
  var k = Client.find({}, function (err, car) {
    d = car;
    res.render("userinfo", { car: d });
});
})

app.post("/update", function (req, res) {
  Client.findById(req.body.id,function(err,p){
    if(!p)
    {console.log(err)}
  else{
    p.dor=req.body.udor;
    p.save(function(err){
      console.log(err)
    })
  }
  })

  res.redirect("admininfo");
});




app.post("/updatenop", function (req, res) {
//updating n.of projects
Client.findById(req.body.id,function(err,p){
  if(!p)
  {console.log(err)}
else{
  p.nop=req.body.nop;
  p.save(function(err){
    console.log(err)
  })
}
})
res.redirect("admininfo");
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        if (
          req.body.username == "admin@123" ||
          req.body.username == "admin@admin.com"
        ) {
          res.redirect("/hehe");
        } else {
          var k = Client.find({ _id: req.body.eid }, function (err, docs) {
            car.push(docs);
          });
          res.render("userinfo", { car: car[0] });
        }
      });
    }
  });
});

app.listen(3000, function () {
  console.log("Server started on port 3000.");
});
