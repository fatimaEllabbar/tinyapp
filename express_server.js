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
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" },
  b2xVn2: { longURL: "http://www.lighthouselabs.ca", userID: "rT5e4W"}
};


const users = { 
  "aJ48lW": {
    id: "aJ48lW", 
    email: "user@example.com", 
    password: "user"
  },
 "rT5e4W": {
    id: "rT5e4W", 
    email: "user2@example.com", 
    password: "1234"
  }
}
// return urls for user that has the id
const urlsForUser = (id)=> {
  const urls = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      urls[key] = urlDatabase[key];
    }
  }
  return urls;
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
  if (req.cookies['user_id']) {
    const templateVars = {
      urls: urlsForUser(req.cookies['user_id']), 
      user : users[req.cookies["user_id"]]
     };
   res.render("urls_index", templateVars);
  } else {
    const templateVars = { 
      user : users[req.cookies["user_id"]],
      msg : "you must register or log in first"
     };
    res.render("message",templateVars);
  }
  
});

//add a get route to show the form
app.get("/urls/new", (req, res) => {
  if(req.cookies["user_id"]){
    let templateVars = {
      user : users[req.cookies["user_id"]]
     };
    res.render("urls_new",templateVars)
  } else {
    res.redirect("/login");
  }
});

//Render information about a single URL
app.get("/urls/:shortURL", (req, res) => {
 if(req.cookies['user_id'] && urlsForUser(req.cookies['user_id']).hasOwnProperty(req.params.shortURL)) {
    const templateVars = { shortURL : req.params.shortURL,
      longURL : urlDatabase[req.params.shortURL].longURL,
      user : users[req.cookies["user_id"]]
      };
    res.render("urls_show", templateVars);
  } else {
    const templateVars = { 
      user : users[req.cookies["user_id"]],
      msg : "you must register or log in first or you don't have the right to display this url"
     };
    res.render("message",templateVars);
  }
});

//created a route to handle the POST requests from our form
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL : req.body.longURL,
    userID : req.cookies['user_id']
  }
  res.redirect(`/urls/${shortURL}`);       
});

// delete a url
app.post('/urls/:shortURL/delete',(req, res) => {
  if(req.cookies['user_id'] && urlsForUser(req.cookies['user_id']).hasOwnProperty(req.params.shortURL)) {
    const key = req.params.shortURL;
    delete urlDatabase[key];
    res.redirect("/urls");
  } else {
    const templateVars = { 
      user : users[req.cookies["user_id"]],
      msg : "you must register or log in first or you don't have the right to delete this url"
     };
    res.render("message",templateVars);
  }
});

// update a url
app.post('/urls/:shortURL/update',(req, res) => {
  if(req.cookies['user_id'] && urlsForUser(req.cookies['user_id']).hasOwnProperty(req.params.shortURL)) {
  const key = req.params.shortURL;
  urlDatabase[key].longURL = req.body.newURL;
  res.redirect("/urls");
} else {
  const templateVars = { 
    user : users[req.cookies["user_id"]],
    msg : "you must register or log in first or you don't have the right to update this url"
   };
  res.render("message",templateVars);
}
});

//Redirect any request to "/u/:shortURL" to its longURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
