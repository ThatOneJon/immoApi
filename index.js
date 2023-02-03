const express = require("express");
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const bcrypt = require('bcryptjs');
const User = require("./src/users/users.model");
const Listing = require("./src/users/listings");

const jwt = require('jsonwebtoken');
const cookieParser = require("cookie-parser");

const app = express()
//app.use(express.json());

//----Import and enable Cross Origin Ressource Sharing
const cors = require("cors")
// ----------- creating custom .env vars--------------
require('dotenv').config()
// ---------------------------------------------------
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// ----------------------GET REQ and AUTH with token --------------------
const verifyToken = function(req, res, next,){
  const token = req.cookies.access_token;
    if(!token){
      return res.status(403).send("Auth Token missing ! ")
    }
    try{
      const decode = jwt.verify(token, process.env.TOKEN_KEY)
      req.user = decode
      return next()

    }catch(error){
     return res.json({error : error })
    } 
  }

// ------------------------ API Endpoints below--------------------------
app.get("/api", (req, res) => {
    res.json({generalInfos: {
      Hello:"This will be an overview!",
      Login:"/api/login",
      Register: "/api/register",
      GetListings:"/api/listings",
      GetListing:"/api/listings/:id",
      GetProfile:"/api/profile/:id",
      POSTListing:"/api/addListing"
  }
})

})
//_____________REGISTER___________________________________
app.post("/api/register", async (req, res) => {
  const {email, last_name, first_name, password}= req.body
  if(!(email && last_name && first_name && password)){
    res.send("All input is required");
  }
    try{
      email.toLowerCase()
      const userDouble = await User.findOne({ email });
      if(userDouble){
        return res.status(409).send("User with that mail already exists!")
      }

    }catch(error){
      return res.json({error: error})
    }

  encryptedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    first_name,
    last_name,
    email: email.toLowerCase(),
    password: encryptedPassword
  })

  const token = jwt.sign(
    { user_id: user._id, email },
    process.env.TOKEN_KEY,
    {
      expiresIn: "2h",
    }
  );

  user.token = token;
  return res.json(req.body)
})
// ____________LOGIN_____________________________
app.post("/api/login", async (req, res, next) => {
    const {email, password} = req.body
    try{
      if(!(email && password)){
        return res.send("Email and password required!")
      }

      const user = await User.findOne({ email });
      if(user && bcrypt.compare(password, user.password)){
        const token = jwt.sign(
          { user_id: user._id, email },
          process.env.TOKEN_KEY,
          {
            expiresIn: "2h",
          }
        );
        user.token = token;
        // set token as cookie 
        return res
        .cookie("access_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        })
        .status(200)
        .json({ message: "Logged in successfully 😊 👌" });

      }else{
        res.status(400).send("Invalid Credentials");
      }

    }catch(error){
      res.json({error:error})
    }
    return next()
  })

  app.get("/api/logout", verifyToken, (req, res) => {
    return res
    .clearCookie("access_token")
    .status(200)
    .json({ message: "Successfully logged out!" });
  } )


  app.get("/api/listings", (req, res) => {
    res.status(200).send("Welcome 🙌 ");
  });


  app.post("/api/addListing", verifyToken, (req, res) => {
    const{title, squareMeters, price} = req.body
    if(!(title && squareMeters && price)){
      return res.json({error: "Min title, price and square meters required!"})
    }

    res.status(200).send(req.body);
  })


  app.get("/api/profile/:id", (req, res) => {
    res.status(200).send("Welcome 🙌 ");
  })



// SERVER Listening on PORT 8000 node .
  app.listen(
    PORT,
    () => console.log("its alive! On Port: "+ PORT)
)

