const express = require("express");
const bodyParser = require("body-parser");
const  cookieParser = require('cookie-parser');
const PORT = 8080; // default port 8080

const app = express();

app.set("view engine", "ejs") ;
app.use(cookieParser());
//using the body-parser library to make the POST request body human readable
app.use(bodyParser.urlencoded({extended: true}));

// our database
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

// generating a "unique" shortURL by returning a string of 6 random alphanumeric characters
const generateRandomString = ()=> {
  return Math.random().toString(36).substring(2,8);
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

//lookup for an email and return the user that has this email
const emailExists = (email) => {
  for (let key in users) {
    if (users[key].email === email) {
      return users[key];
    }
  }
  return null;
} 

//display the form for registration
app.get("/register", (req, res) => {
  let templateVars = {
    user : users[req.cookies["user_id"]]
   };
  res.render("registration",templateVars);
})

// create a new user
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
  } else if (req.body.email && req.body.password && emailExists(req.body.email)) {
    res.status(400).send("This email exists already!")
  } else {
    res.status(400).send("Email or password invalid");
  }
});

//diplay the form for log in
app.get("/login", (req, res) =>{
  let templateVars = {
    user : users[req.cookies["user_id"]]
   };
  res.render("login",templateVars);
});

//log in 
app.post("/login", (req, res) => {
  const user = emailExists(req.body.email);
  if(user && user.password === req.body.password) {
    res.cookie("user_id",user.id);
    res.redirect("/urls");
  } else {
    res.status(403).send("Email or password invalid");
  }
});

//log out and clear the cookie
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls")
});


// display all the urls for a specific user
app.get("/urls", (req, res) => {
  if (req.cookies['user_id']) {
    const templateVars = {
      urls: urlsForUser(req.cookies['user_id']), 
      user : users[req.cookies["user_id"]]
     };
   res.render("urls_index", templateVars);
  } else {
    const templateVars = { 
      user : null,
      msg : "you must register or log in first"
     };
    res.render("message",templateVars);
  }
  
});

//display th form to add a new url
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
      user : null,
      msg : "you must register or log in first or you don't have the right to display this url"
     };
    res.render("message",templateVars);
  }
});

//create a new url
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL : req.body.longURL,
    userID : req.cookies['user_id']
  }
  res.redirect(`/urls/${shortURL}`);       
});

// delete an url
app.post('/urls/:shortURL',(req, res) => {
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

// update an url
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
