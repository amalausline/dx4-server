var DB = require('../../../dbQueries')
var db = new DB();
var apiUrl = "/api"
var bcrypt = require('bcryptjs');


module.exports = function(app) {


  // Get profile_service with id in profile

  app.get(apiUrl + '/profile_service/:staffID', function(req, res) {

    db.executeQuery('SELECT * FROM staff  WHERE staffID = "' + req.params.staffID + '"', function(results) {

      return res.status(200).send(results);
    });

  });
 //update staff profile data
  app.put(apiUrl + '/update_profile/:staffID', function(req, res) {
    let name = req.body[0].name;
    let mobile = req.body[0].mobile;
    let email = req.body[0].email;
    if (req.body[0].password == 'old_password') {
      var password = 'update_oldOne';
    } else {
      var password = req.body[0].password;
    }


    bcrypt.hash(password, 10, function(err, hash) {

      db.executeQuery('SELECT * FROM staff WHERE staffID = "' + req.params.staffID + '"', function(results) {
        db.executeQuery1('UPDATE staff SET ? WHERE staffID = "' + req.params.staffID + '"', {

          name: name,
          email: email,
          mobile: mobile,
          password: password == 'update_oldOne' ? results[0].password : hash

        }, function(results) {
          return res.status(200).send(results);

        });
      })

    });
  })


}
