 var DB = require('../../../dbQueries')
 var db = new DB();
 var apiUrl = "/api"
 var bcrypt = require('bcryptjs');

 module.exports = function(app) {

//get branch name from branch table
app.get(apiUrl + '/branchname_service/:branchID', function(req, res) {
    db.executeQuery('SELECT * FROM branch  WHERE branch_id = "' + req.params.branchID + '"', function(results) {
    return res.status(200).send(results);
  });

});

   //post admin to staff table
   app.post(apiUrl + '/addAdmin', function(req, res) {
     let branch_id = req.body[0].branch_id;
     let name = req.body[0].name;
     let username = req.body[0].username;
     let password = req.body[0].password;
     let position=req.body[0].position;
     let status = req.body[0].status;
     let mobile = req.body[0].mobile;
     let address = req.body[0].address;
     let city = req.body[0].city;
     let state = req.body[0].state;
     let permissions = req.body[0].permissions;
     //checking username in staff table
     db.executeQuery1('SELECT * FROM staff  WHERE username = ?', '', function(results, fields, error) {
       if (results.length != 0) {
         return res.send({
           "code": 204,
           "success": "Email already exists try another one!"
         });
       } else if (results.length == 0) {

         bcrypt.hash(password, 10, function(err, hash) {
           db.executeQuery1("INSERT INTO staff SET ? ", {
             branch_id: branch_id,
             name: name,
             permissions: permissions,
             position:position,
             status:status,
             username: username,
             mobile: mobile,
             address: address,
             city: city,
             state: state,
             password: hash

           }, function(results) {

             return res.status(200).send(results);

           });
         })
       }
     });
   });


/*
  ----------------------------------------------
  Super Admin
  ----------------------------------------------
  */
  //update staff to staff table
  app.put(apiUrl + '/updateuser/:staffID', function(req, res) {
    db.executeQuery('SELECT * FROM staff', function(results, fields, error) {
      var update;

      for (var i = 0; i < results.length; i++) {
        // Checking  username if username has changed
        if (results[i].username == req.body[0].username && req.body[0].old_username) {
          // Cheking branch id after username condition matched with db data
          if (results[i].branch_id == req.body[0].branch_id) {
            // if branch id matched username is not updated
            update = 'failure'
            break;
          } else {
            // if Branch id is not matched username will update
            update = 'success'
            break;
          }
        }
        // After check username is not available in db, will update
        else {
          update = 'success'
        }
      }
      // Branch id and username is not available in db can update
      if (update == 'success') {
        let name = req.body[0].name;
        let mobile = req.body[0].mobile;
        let email = req.body[0].email;
        let address = req.body[0].address;
        let city = req.body[0].city;
        let state = req.body[0].state;
        let permission = req.body[0].permission.toString()
        let username = req.body[0].username;
        if (req.body[0].password == 'old_password') {
          // password is not changed
          var password = 'update_oldOne';
        } else {
          // password is changed
          var password = req.body[0].password;
        }
        bcrypt.hash(password, 10, function(err, hash) {
          db.executeQuery('SELECT * FROM staff WHERE staffID = "' + req.params.staffID + '"', function(results) {
            db.executeQuery1('UPDATE staff SET ? WHERE staffID = "' + req.params.staffID + '"', {
              name: name,
              email: email,
              mobile: mobile,
              address: address,
              city: city,
              state: state,
              permissions: permission,
              username: username,
              password: password == 'update_oldOne' ? results[0].password : hash
            }, function(results) {
              return res.status(200).send(results);

            });
          })
        });
      }
      // Branch id and username is already available in db
      else if (update == 'failure') {
        return res.send({
          "code": 204,
          "data": "userexit",
          "success": "Email already exists try another one!"
        });
      }
    })
  })

   //save function to branch table
   //post salesorder_id
   app.post(apiUrl + '/addBranch', function(req, res) {

     let data = req.body;
     var sql = "INSERT INTO branch SET ?";
     db.executeQuery1(sql, data, function(results) {
       return res.status(200).send(results);
     });

   });



   
   // Get all branch data in branch table
   app.get(apiUrl + '/branch_data', function(req, res) {
     db.executeQuery('SELECT * FROM branch', function(results) {
       return res.status(200).send(results);
     });
   });


  //get branch data with particular branch id
   app.get(apiUrl + '/branch_data/:branch_id', function(req, res) {
     var sql = 'SELECT * FROM branch WHERE branch_id = "' + req.params.branch_id + '"';
     db.executeQuery(sql, function(results) {
       return res.status(200).send(results);
     });

   });

   //update branch data to branch table
   app.put(apiUrl + '/update_branch_data/:branch_id', function(req, res) { 
     var branch_id = req.params.branch_id;
   
     //this if condition for update staffID in branch table
     if(req.body.length==2){
     var sql = `UPDATE branch SET staffID = "${req.body[0].staffID}" WHERE branch_id = "${branch_id}"`;
     db.executeQuery(sql, function(err, rows) {
       res.sendStatus(200);
     });
     } else if(req.body.length==1 && req.body[0].uploadDBTime) { // upload db timing update
      var sql = `UPDATE branch SET uploadDBTime = "${req.body[0].uploadDBTime}" WHERE branch_id = "${branch_id}"`;
     db.executeQuery(sql, function(err, rows) {
       res.sendStatus(200);
     });
      //res.sendStatus(200);
     }
     //this else condition for update Branch datas in branch table
     else{
     var sql = `UPDATE branch SET corporate_name = "${req.body[0].corporate_name}",corporate_id = "${req.body[0].corporate_id}",expiry_date = "${req.body[0].expiry_date==null ? '' : req.body[0].expiry_date}",branch_name = "${req.body[0].branch_name}",staffID = "${req.body[0].staffID}",domain_category = "${req.body[0].domain_category}",permissions = "${req.body[0].permissions}",print_footer = "${req.body[0].print_footer}",printsize = "${req.body[0].printsize}",authKey = "${req.body[0].authKey}",sender_id = "${req.body[0].sender_id}",user_id = "${req.body[0].user_id}",address = "${req.body[0].address}",GstNo = "${req.body[0].GstNo}",city = "${req.body[0].city}",pincode = "${req.body[0].pincode}",state = "${req.body[0].state}",contact_number = "${req.body[0].contact_number}", barcode_enable = "${req.body[0].barcode_enable}" WHERE branch_id = "${branch_id}"`;
     db.executeQuery(sql, function(err, rows) {
       res.sendStatus(200);
     });
   } 
   });

 }
