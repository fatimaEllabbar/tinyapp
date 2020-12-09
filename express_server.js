const express = require("express");
const PORT = 8080; // default port 8080

const app = express();

app.set("view engine", "ejs") ;

const  cookieParser = require('cookie-parser');
app.use(cookieParser());

//using the body-parser library to make the POST request body human readable
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

// generating a "unique" shortURL by returning a string of 6 random alphanumeric characters
function generateRandomString() {
  return Math.random().toString(36).substring(2,8);
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

//adding registration 
app.get("/register", (req, res) => {
  let templateVars = {
    user : users[req.cookies["user_id"]]
   };
  res.render("registration",templateVars);
})
// lookup for an email
const emailExists = (email) => {
  for (let key in users) {
    if (users[key].email === email) {
      return users[key];
    }
  }
  return null;
} 
app.post("/register", (req, res) => {
  if(req.body.email && req.body.password && emailExists(req.body.email) === null){
    const userRandomID = generateRandomString();
    users[userRandomID] = {
      id : userRandomID,
      email : req.body.email,
      password : req.body.password
    };
    res.cookie("user_id", users[userRandomID].id);
    res.redirect("/urls");
  } else {
    res.statusCode = 400;
    res.sendStatus(res.statusCode);
  }
});

//log in 
app.get("/login", (req, res) =>{
  let templateVars = {
    user : users[req.cookies["user_id"]]
   };
  res.render("login",templateVars);
});
app.post("/login", (req, res) => {
  const user = emailExists(req.body.email);
  if(user && user.password === req.body.password) {
    res.cookie("user_id",user.id);
    res.redirect("/urls");
  } else {
    res.sendStatus(403);
  }
});

//log out and clear the cookie
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls")
});


// adding a route to urls using template engine
app.get("/urls", (req, res) => {
  let templateVars = {
     urls: urlDatabase, 
     user : users[req.cookies["user_id"]]
    };

 

  res.render("urls_index", templateVars);
});

//add a get route to show the form
app.get("/urls/new", (req, res) => {
  let templateVars = {
    user : users[req.cookies["user_id"]]
   };
  res.render("urls_new",templateVars)
});

//Render information about a single URL
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL : req.params.shortURL,
     longURL : urlDatabase[req.params.shortURL],
     user : users[req.cookies["user_id"]]
     };
  res.render("urls_show", templateVars);
});

//created a route to handle the POST requests from our form
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);       
});

// delete a url
app.post('/urls/:shortURL/delete',(req, res) => {
  const key = req.params.shortURL;
  delete urlDatabase[key];
  res.redirect("/urls");
});

// update a url
app.post('/urls/:shortURL/update',(req, res) => {
  const key = req.params.shortURL;
  urlDatabase[key] = req.body.newURL;
  res.redirect("/urls");
});

//Redirect any request to "/u/:shortURL" to its longURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
