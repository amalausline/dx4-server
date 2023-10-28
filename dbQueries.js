var mysql = require('mysql')

function DB() {
	var db = mysql.createConnection({
	  host: "127.0.0.1",
	  user: "root",
	  password: "",
	  database : "r27bangalore",
	  dateStrings : true

	}); 



	db.connect(function(err){
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
