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

// CORS Configuration for the fetch  credentials: 'include', which is necessary to set cookies on the client side

const corsOptions = {
  origin: ['http://localhost:3000', "https://learning-thatonejon.vercel.app/"],
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  credentials: true
}

app.use(cors(corsOptions));

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
      return res.status(403).json({message:"No Token!"})
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
  const {username, email, password}= req.body
  if(!(username && email && password)){
    res.json({err:"all input is required!"});
  }
    try{
      email.toLowerCase()
      const userDouble = await User.findOne({ email });
      if(userDouble){
        return res.status(409).json({err:"User with that mail already exists!"})
      }

    }catch(error){
      return res.json({error: error})
    }

  encryptedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    username: username,
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
    let {email, password} = req.body
    try{
      if(!(email && password)){
        return res.json({err:"Email and password required!"})
      }
      email = email.toLowerCase()
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
        //If sameSite is set to none secure hast to be true --> if samesite not set --> Lax ---> issue with api call for token 
        // ---> this is the way
        return res
        .cookie("access_token", token, {
          httpOnly: true,
          sameSite: "none",
          secure: true
        })

        .status(200)
        .json({ message: "Logged in successfully 😊 👌" });
      }else{
        res.status(400).json({err:"Invalid Credentials"});
      }

    }catch(error){
     return res.json({errCatch:error})
    }
    return next()
  })

  app.get("/api/logout", verifyToken, (req, res) => {
    return res
    .clearCookie("access_token", { 
      path:"/",
      httpOnly: true,
      sameSite: "none",
      secure: true
    })
    .status(200)
    .json({ message: "Successfully logged out!" });
  } )

// Show all listings, which doesn't require auth
  app.get("/api/listings", async (req, res) => {
    const listings = await Listing.find({});
    res.status(200).json(listings);
  });

// Add a new Listing, which is only possible, if token auth successful
  app.post("/api/addListing", verifyToken, async (req, res) => {
    const{title, squareMeters, price, city, image, description} = req.body
    if(!(title && squareMeters && price)){
      return res.json({err: "Min title, price and square meters required!"})
    }
    const listing = await Listing.create({
      title: title,
      squareMeters : squareMeters,
      price: price,
      description:description,
      city: city,
      image: image,
      created: req.user.user_id
    })
    return res.status(200).json({created: "true"});
  })

 //------------------------ removing

  app.post("/api/remove", verifyToken, async (req, res) => {
    const{_id} = req.body
    try{
    const user = await User.findOne({id:req.user.user_id})
    const listing = await Listing.findOne({_id})

    if(!(listing && user)){
      return res.json({result:"Not found!",
      data: req.body,
      users: user,
      listing: listing
    })
    }

    if(listing.created === user.id){
      const result = await Listing.deleteOne(listing)
      return res.json({result:result})
    }else{
      return res.json({result:"You can ony delete listings set by yourself!"})
    }
  }catch(error){
    return res.json({"error":error})
  }
  })


 //----------------------------

  app.get("/api/profile/:id", (req, res) => {
    res.status(200).send("Welcome 🙌 ");
  })


  app.get("/api/loginstatus", verifyToken, async (req, res) => {
    const _id = req.user.user_id
    const user = await User.findOne({_id})
    return res.json({username:user.username, email:user.email, first_name:user.first_name, last_name:user.last_name})
  })


// SERVER Listening on PORT 8000 node .
  app.listen(
    PORT,
    () => console.log("its alive! On Port: "+ PORT)
)

