const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session')
const bcrypt = require('bcrypt');
const PORT = 8080; // default port 8080
const { getUserByEmail} = require("./helper");

const app = express();

app.set("view engine", "ejs") ;

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))
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
    password: bcrypt.hashSync("user",10)
  },
 "rT5e4W": {
    id: "rT5e4W", 
    email: "user2@example.com", 
    password: bcrypt.hashSync("1234",10)
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



//display the form for registration
app.get("/register", (req, res) => {
  if (req.session['user_id']) {
    res.redirect('/urls');
  } else {
    let templateVars = {
      user : users[req.session["user_id"]]
     };
    res.render("registration",templateVars);
  }
})

// create a new user
app.post("/register", (req, res) => {
  if(req.body.email && req.body.password && getUserByEmail(req.body.email, users) === undefined){
    const userRandomID = generateRandomString();
    users[userRandomID] = {
      id : userRandomID,
      email : req.body.email,
      password : bcrypt.hashSync(req.body.password, 10)
    };
    req.session["user_id"] = users[userRandomID].id;
    res.redirect("/urls");
  } else if (req.body.email && req.body.password && getUserByEmail(req.body.email, users)) {
    res.status(400).send("This email exists already!")
  } else {
    res.status(400).send("Email or password invalid");
  }
});

//diplay the form for log in
app.get("/login", (req, res) =>{
  if (req.session['user_id']) {
    res.redirect('/urls');
  } else {
    let templateVars = {
      user : users[req.session["user_id"]]
     };
    res.render("login",templateVars);
  }
});

//log in 
app.post("/login", (req, res) => {
  const user = getUserByEmail(req.body.email, users);
  if(user && bcrypt.compareSync(req.body.password, user.password)) {
    req.session["user_id"] = user.id;
    res.redirect("/urls");
  } else {
    res.status(403).send("Email or password invalid");
  }
});

//log out and clear the cookie
app.post("/logout", (req, res) => {
  req.session["user_id"] = null;
  res.redirect("/urls")
});


// display all the urls for a specific user
app.get("/urls", (req, res) => {
  if (req.session['user_id']) {
    const templateVars = {
      urls: urlsForUser(req.session['user_id']), 
      user : users[req.session["user_id"]]
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
  if(req.session["user_id"]){
    let templateVars = {
      user : users[req.session["user_id"]]
     };
    res.render("urls_new",templateVars)
  } else {
    res.redirect("/login");
  }
});

//Render information about a single URL
app.get("/urls/:shortURL", (req, res) => {
  let msg = "";
 if(req.session['user_id'] && urlsForUser(req.session['user_id']).hasOwnProperty(req.params.shortURL)) {
    const templateVars = { shortURL : req.params.shortURL,
      longURL : urlDatabase[req.params.shortURL].longURL,
      user : users[req.session["user_id"]]
      };
    res.render("urls_show", templateVars);
    return; 
  } else if (!req.session['user_id']) {
    msg = "You must register or log in first"
  } else if( urlDatabase[req.params.shortURL]) {
    msg = "You don't have the right to display this url";
  } else {
    msg = "The short url does not exist";
  }
  const templateVars = { 
    user : users[req.session["user_id"]],
    msg 
   };
   res.render("message",templateVars);
});

//create a new url
app.post("/urls", (req, res) => {
  if (req.session['user_id']) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
    longURL : req.body.longURL,
    userID : req.session['user_id']
    }
    res.redirect(`/urls/${shortURL}`); 
  } else {
    const templateVars = { 
      user : users[req.session["user_id"]],
      msg : "You must register or log in first"
     };
    res.render("message",templateVars);
  }        
});

// delete an url
app.post('/urls/:shortURL/delete',(req, res) => {
  if (req.session['user_id'] && urlsForUser(req.session['user_id']).hasOwnProperty(req.params.shortURL)) {
    const key = req.params.shortURL;
    delete urlDatabase[key];
    res.redirect("/urls");
    return ;
  } else if (!req.session['user_id']) {
    msg = "You must register or log in first"
  } else if(urlDatabase[req.params.shortURL]) {
    msg = "You don't have the right to delete this url";
  } else {
    msg = "The short url does not exist";
  }
  const templateVars = { 
    user : users[req.session["user_id"]],
    msg 
   };
   res.render("message",templateVars);
});

// update an url
app.post('/urls/:shortURL',(req, res) => {
  let msg = "";
  if(req.session['user_id'] && urlsForUser(req.session['user_id']).hasOwnProperty(req.params.shortURL)) {
    const key = req.params.shortURL;
    urlDatabase[key].longURL = req.body.newURL;
    res.redirect("/urls");
    return ;
  } else if (!req.session['user_id']) {
    msg = "You must register or log in first"
  } else if(urlDatabase[req.params.shortURL]) {
    msg = "You don't have the right to update this url";
  } else {
    msg = "The short url does not exist";
  }
  const templateVars = { 
    user : users[req.session["user_id"]],
    msg 
   };
   res.render("message",templateVars);
});

//Redirect any request to "/u/:shortURL" to its longURL
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]){
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    const templateVars = { 
      user : users[req.session["user_id"]],
      msg : "The URL for the given ID does not exist:"
    };
    res.render("message",templateVars);
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
