var DB = require('../../dbQueries')
var db = new DB();
var apiUrl = "/api"

module.exports = function(app) {

app.get(apiUrl + '/getCompanyDet', function(req, res) {
  db.executeQuery('SELECT * FROM company_details', function(results) {
    return res.status(200).send(results);
  });
});

app.get(apiUrl + '/getLevels', function(req, res) {
  db.executeQuery('SELECT * FROM company_level', function(results) {
    return res.status(200).send(results);
  });
});

app.get(apiUrl + '/getCompanyById', function(req, res) {
  var comp_id = req.query.comp_id;
  var queryString = 'SELECT * FROM company_details WHERE company_id=' + comp_id;
  //console.log(queryString)
  db.executeQuery(queryString, function(results) {
    return res.status(200).send(results);
  });
});

app.get(apiUrl + '/getUserByCompanyId', function(req, res) {
  var comp_id = req.query.comp_id;
  var queryString = 'SELECT personal_name, email_id, user_type FROM company_credentials WHERE company_id = ' + comp_id;
  //console.log(queryString)
  db.executeQuery(queryString, function(results) {
    return res.status(200).send(results);
  });
});



app.post(apiUrl + '/write', function(req, res) {
  var data = req.body.data;
  var cols = "(",
    vals = "(",
    tableName;
  for (var key in data) {
    if (key == "type") {
      tableName = data[key];
    } else {
      cols += key + ",";
      if (key == "password") {
        vals += "'" + crypto.createHash('md5').update(data[key]).digest("hex") + "',";
      } else {
        vals += "'" + data[key] + "',";
      }
    }
  }

  cols = cols.substring(0, cols.length - 1);
  vals = vals.substring(0, vals.length - 1);
  cols += ")";
  vals += ")";

  var queryString = "INSERT INTO " + tableName + " " + cols + " VALUES " + vals + ";"

  db.executeQuery(queryString, function(results) {
    //  console.log(results.insertId);
    var sendRes = { status: "success", insertId: results.insertId }
    return res.status(200).send(sendRes);
  });
});


app.post(apiUrl + '/update', function(req, res) {
  var data = req.body.data;
  //console.log(data)
  var params = "",
    whereClause,
    tableName;
  for (var key in data) {
    //console.log(data["whereclause"], key)
    if (key == "type") {
      tableName = data[key];
    } else if (key == data["whereclause"]) {
      whereClause = key + "=" + data[key];
    } else if (key == "whereclause") {
      //do nothing
    } else {
      if (key == "password") {
        params += key + "='" + crypto.createHash('md5').update(data[key]).digest("hex") + "',";
      } else {
        params += key + "='" + data[key] + "',"
      }


    }
  }

  params = params.substring(0, params.length - 1);
  //  console.log(params)

  var queryString = "UPDATE " + tableName + " SET " + params + " WHERE " + whereClause;
  console.log(queryString);
  //return res.status(200).send("success");
  db.executeQuery(queryString, function(results) {
    //console.log(results.insertId);
    var sendRes = { status: "success" }
    return res.status(200).send(sendRes);
  });
});
}