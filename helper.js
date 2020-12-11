//lookup for an email in a database and return the user that has this email
const getUserByEmail = function(email, database) {
  for (let key in database) {
    if (database[key].email === email) {
      return database[key];
    }
  }
  return undefined;
};
module.exports = { getUserByEmail}