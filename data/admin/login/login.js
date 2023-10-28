var DB = require('../../../dbQueries')
var db = new DB();
var apiUrl = "/api"
var bcrypt = require('bcryptjs');
var bodyParser = require('body-parser');
var http = require('http')


module.exports = function(app) {

//while login it will hit live database and update expiry date to local database of branch table
app.get(apiUrl + '/branch_datas/:branch_id/:host/:path', function(req, res) {
  var branch_id = req.params.branch_id;
  //options to send query to server
  var options = {
    "method": "POST",
    "hostname": req.params.host,
    "port": 21,
    "path": req.params.path
  };
  //request to server and get back results through res
  var req = http.request(options, function(res) {
    var chunks = [];
    res.on("data", function(chunk) {
      chunks.push(chunk);
    });
    res.on("end", function() {
      var body = Buffer.concat(chunks);
      var data = body.toString();
      var output = JSON.parse(data);
      //output.message is return error meaasge from server
      //here if server returns output.records then below conditions will work 
      //if server returns output.message  then error handling function will be work
      if (!output.message) {
        var server_data = output.records.map(function(item) {
          return { 'corporate_id': item.corporate_id, 'branch_id': item.branch_id, 'expiry_date': item.expiry_date }
        })
      }
      var sql = 'SELECT * FROM branch WHERE branch_id = "' + branch_id + '"';
      db.executeQuery(sql, function(branchresults) {
        if (!output.message) {
          //get expiry date
          var GetExpiryDate = server_data.filter(function(o1) {
            return branchresults.some(function(o2) {
              return o1.corporate_id == o2.corporate_id && o1.branch_id == o2.branch_id
            })
          })
          if (GetExpiryDate.length) {
            //update expiry date
            var UpdateExpiryDate = `UPDATE branch SET expiry_date = "${GetExpiryDate[0].expiry_date}" WHERE branch_id = "${branch_id}"`;
            db.executeQuery(UpdateExpiryDate, function(err, rows) {})
            success(GetExpiryDate, branchresults);
          } else {
            success([], branchresults);
          }
        }
        if (output.message) {
          success([], branchresults);
        }
      });

    });
  });
  req.on('error', function(err) {
    // Handle error if system not have internet
    var sql = 'SELECT * FROM branch WHERE branch_id = "' + branch_id + '"';
    db.executeQuery(sql, function(branchresults) {
      success([], branchresults);
    })
  });
  req.end()

  function success(corporatedetail, branchresults) {
    return res.status(200).send([{ 'corporatedetail': corporatedetail, 'branchresult': branchresults }]);
  }

})

  //Check login credentials when staff hit login button
  app.post(apiUrl + '/login', function(req, res) {
    //password-123->$2b$10$ZdOhKGZfDS/RORCBj.kC6OX4CZiMo72rCDyvLeEh/23GIic1lGpDm
    let username = req.body[0].username;
    let password = req.body[0].password;
    //checking username from database
    db.executeQuery1('SELECT * FROM staff  WHERE username = ?', username, function(results, fields, error) {
      if (error) throw error;
      else {
        if (results.length > 0) {
          bcrypt.compare(password, results[0].password, function(err, ress) {

            if (ress) {
              res.send({
                "code": 200,
                "success": "login sucessfull",
                "data": results,
                'token': 'fake-jwt-token'
              });
            } else {
              res.send({
                "code": 204,
                "success": "Email and password does not match"
              });
            }
          });
        } else {
          res.send({
            "code": 204,
            "success": "Email does not exits"
          });
        }
      }



    });
  });


};
