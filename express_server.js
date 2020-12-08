const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs") ;

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

// adding a route to urls using template engine
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

//add a get route to show the form
app.get("/urls/new", (req, res) => {
  res.render("urls_new")
});

//Render information about a single URL
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL : req.params.shortURL, longURL : urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

//created a route to handle the POST requests from our form
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);       
});

//Redirect any request to "/u/:shortURL" to its longURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
