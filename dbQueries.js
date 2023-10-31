var mysql = require('mysql')

function DB() {
	var db = mysql.createPool({
		connectionLimit: 10,
	  host: "82.180.142.99",
	  port: 3306,
	  user: "u548424989_tf_app_dm_us",
	  password: "RdAf;&Zu3~l",
	  database : "u548424989_tf_app_demo",
	  dateStrings : true

	}); 



	db.getConnection(function(err){
	  if(err){
		console.log('Error connecting to Db');
		return;
	  }
	  console.log('Database connected');
	});
	
	this.select = function(query, callback) {		
		db.query(query, function(err, rows, fields){
			if(err) throw err;
			callback(rows);
		});
	}
	
	this.executeQuery = function(query, callback){
		db.query(query, function(err, rows, fields){
			//if(err) throw err;
			//callback(rows);
			if(err) {
				return callback(err);
			}

			callback(rows); 
		});
	}
	
	this.executeQuery1 = function(query, values, callback){
		db.query(query, values, function(err, rows, fields){
			if(err) throw err;
			callback(rows);
		});
	} 

/*this.select = function(query, callback) {		
		db.query(query, function(err, rows, fields){
			if(err) throw err;
			callback(rows);
		});
	}
	
	this.executeQuery = function(query, callback){
		db.query(query, function(err, rows, fields){
			if(err) throw err;
			callback(rows);
		});
	} */


}

module.exports = DB;
