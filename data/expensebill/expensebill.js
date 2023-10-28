var DB = require('../../dbQueries')
var db = new DB();
var multer = require('multer');
var fs = require('fs');
var apiUrl = "/api"

/*-------------------------------------------

LIST

- NEW EXPENSES
- BALANCE EXPENSES
- PAID EXPENSES

 -----------------------------------------*/

module.exports = function(app) {

   /*-------------------------------------------
   =============================================

    NEW EXPENSES

  ===============================================
    -------------------------------------------*/

  // Get expene_category for expense 
  app.get(apiUrl + '/newexpense', function(req, res) {
    db.executeQuery('SELECT * FROM expense_catergorys', function(results) {
      return res.status(200).send(results);
    });
  });
  /*-------------------------
  Upload file for all module for post
  -------------------------*/
  var storage = multer.diskStorage({ //multers disk storage settings
    destination: function(req, file, cb) {
      cb(null, '../assets/uploads/exp-bill/');
    },
    filename: function(req, file, cb) {
      var datetimestamp = Date.now();
      cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1]);
    }

  });

  var upload = multer({ //multer settings
    storage: storage
  }).single('file');

  /* /** API path that will upload the files for expense bill */
  app.post('/upload', function(req, res) {
    upload(req, res, function(err) {
      var data = req.file == undefined ? { 'billname': null } : { 'billname': req.file.filename }
      var sql = "INSERT INTO expense_bill SET ?";
      db.executeQuery1(sql, data, function(results) {
        return res.status(200).send(results);
      });

    });
  });


  /* /** API path that will upload the files  for Raw Material*/
  app.post('/uploadpurchase', function(req, res, body) {
    upload(req, res, function(err) {
      var data = req.file == undefined ? { 'billname': null } : { 'billname': req.file.filename }
      var sql = "INSERT INTO purchase_order SET ?";
      db.executeQuery1(sql, data, function(results) {
        return res.status(200).send(results);
      });

    });
  });

  /* /** API path that will upload the files for Sale material */
  app.post('/uploadsales', function(req, res) {
    upload(req, res, function(err) {
      var data = req.file == undefined ? { 'billname': null } : { 'billname': req.file.filename }
      var sql = "INSERT INTO inventory_sales_order SET ?";
      db.executeQuery1(sql, data, function(results) {
        return res.status(200).send(results);
      });

    });
  });
  /*-------------------------
Upload file for all module for update
-------------------------*/

  /* /** API path that will upload the files for raw material*/
  app.post('/update_purchasebill', function(req, res) {
    upload(req, res, function(err) {
      var data = req.file == undefined ? '' : req.file.filename
      var sql = `UPDATE purchase_order SET  billname =  "${data}" WHERE purchase_order_id = "${req.body.purchase_order_id}"`;
      db.executeQuery(sql, function(err, rows) {
        res.sendStatus(200);
      });

    });
  });

  /* /** API path that will upload the files  for sale material*/
  app.post('/update_salesbill', function(req, res) {
    upload(req, res, function(err) {
      var data = req.file == undefined ? '' : req.file.filename
      var sql = `UPDATE inventory_sales_order SET  billname =  "${data}" WHERE inventory_salesOrder_id = "${req.body.inventory_salesOrder_id}"`;
      db.executeQuery(sql, function(err, rows) {
        res.sendStatus(200);
      });

    });
  });

  /* /** API path that will upload the files  for expense*/
  app.post('/update_expenssebill', function(req, res) {
    upload(req, res, function(err) {
      var data = req.file == undefined ? '' : req.file.filename
      var sql = `UPDATE expense_bill SET  billname =  "${data}" WHERE expense_bill_id = "${req.body.expense_bill_id}"`;
      db.executeQuery(sql, function(err, rows) {
        res.sendStatus(200);
      });

    });
  });

  /*-------------------------
Upload file for all module for delete
-------------------------*/

  // delete inventory sales order receipt
  app.post(apiUrl + '/salesbill_folder', function(req, res) {
    var file = req.body.file;
    var filepath = "../assets/uploads/exp-bill/";
    var filedelete = filepath + file;
    var tempFile = fs.openSync(filedelete, 'r');
    // try commenting out the following line to see the different behavior
    fs.closeSync(tempFile);
    fs.unlinkSync(filedelete);

    var sql = 'UPDATE inventory_sales_order SET  billname = NULL WHERE inventory_salesOrder_id = "' + req.body.expense_bill_id + '"';
    db.executeQuery(sql, function(err, rows, fields) {
      res.sendStatus(200);
    });

  });

  // delete inventory raw order receipt
  app.post(apiUrl + '/purchasebill_folder', function(req, res) {
    var file = req.body.file;
    var filepath = "../assets/uploads/exp-bill/";
    var filedelete = filepath + file;
    var tempFile = fs.openSync(filedelete, 'r');
    // try commenting out the following line to see the different behavior
    fs.closeSync(tempFile);
    fs.unlinkSync(filedelete);

    var sql = 'UPDATE purchase_order SET  billname = NULL WHERE purchase_order_id = "' + req.body.expense_bill_id + '"';
    db.executeQuery(sql, function(err, rows, fields) {
      res.sendStatus(200);
    });

  });

  // delete receipt to folder and db
  app.post(apiUrl + '/expense_folder', function(req, res) {
    var file = req.body.file;
    var filepath = "../assets/uploads/exp-bill/";
    var filedelete = filepath + file;
    var tempFile = fs.openSync(filedelete, 'r');
    // try commenting out the following line to see the different behavior
    fs.closeSync(tempFile);
    fs.unlinkSync(filedelete);

    var sql = 'UPDATE expense_bill SET  billname = NULL WHERE expense_bill_id = "' + req.body.expense_bill_id + '"';
    db.executeQuery(sql, function(err, rows, fields) {
      res.sendStatus(200);
    });

  });


  // Get staffRole for manageby in newbill
  app.get(apiUrl + '/expense_bill_data', function(req, res) {
    db.executeQuery('SELECT * FROM expense_bill', function(results) {
      return res.status(200).send(results);
    });
  });

  // update expense_data  with help of inserted image of insertID
  app.put(apiUrl + '/updatexpense_data/:expense_bill_id', function(req, res) {
    let expense_bill_id = req.params.expense_bill_id;
    var sql = `UPDATE expense_bill SET  vendor_name = "${req.body[0].vendor_name}",exCatergoryID="${req.body[0].exCatergoryID}",vendor_id = "${req.body[0].vendor_id}", category_name = "${req.body[0].category_name}",created_on = "${req.body[0].created_on}",staffID = "${req.body[0].staffID}",modifiedID = "${req.body[0].modifiedID}",last_modified = "${req.body[0].last_modified}",branch_id = "${req.body[0].branch_id}" WHERE expense_bill_id = "${expense_bill_id}"`;
    db.executeQuery(sql, function(err, rows) {
      res.sendStatus(200);
    });

  });

  //post new expenseitem datas
  app.post(apiUrl + '/newexpenseitem', function(req, res) {
    var data = req.body;
    var expense_bill_id = req.body.expense_bill_id; //get expense_bill_id
    var expenseitemfulldata = data.expenseitemdata.map(function(expenseItem) {
      return [expenseItem.item_name, expenseItem.item_amount, expense_bill_id]
    });
    var sql = "INSERT INTO expense_item (item_name,item_amount,expense_bill_id)  VALUES ? ";
    db.executeQuery1(sql, [expenseitemfulldata], function(results) {
      return res.status(200).send(results);

    });

  });

// post payment for expense, raw material and sale material

  app.post(apiUrl + '/expensepayment', function(req, res) {
    var data = req.body;
    var sql = "INSERT INTO expense_payment SET ?";
    db.executeQuery1(sql, data, function(results) {
      return res.status(200).send(results);
    });
  });

  // update primary table with id
  app.put(apiUrl + '/update_expense_data/:expense_bill_id', function(req, res) {
    let expense_bill_id = req.params.expense_bill_id;
    var sql = `UPDATE expense_bill SET  vendor_name = "${req.body[0].vendor_name}",exCatergoryID="${req.body[0].exCatergoryID}",vendor_id = "${req.body[0].vendor_id}", category_name = "${req.body[0].category_name}",created_on = "${req.body[0].created_on}",last_modified = "${req.body[0].last_modified}",modifiedID = "${req.body[0].modifiedID}" WHERE expense_bill_id = "${expense_bill_id}"`;
    db.executeQuery(sql, function(err, rows) {
      res.sendStatus(200);
    });
  });

  // update expense item table with id
  app.put(apiUrl + '/update_newexpenseitem/:expense_bill_id', function(req, res) {
    let expense_bill_id = req.params.expense_bill_id;
    var editadditem = req.body.filter(function(addnewitem) {
      if (!addnewitem.expense_item_id) {
        return addnewitem
      }
    })
    var editdbitem = req.body.filter(function(editexistitem) {
      if (editexistitem.expense_item_id) {
        return editexistitem
      }
    })

    // update item with have expense_bill_id during edit
    for (var i = 0; i < editdbitem.length; i++) {
      var sql = `UPDATE  expense_item SET item_name  = "${editdbitem[i].item_name}",item_amount = "${editdbitem[i].item_amount}" WHERE expense_item_id = "${editdbitem[i].expense_item_id}"`;
      db.executeQuery(sql, function(err, rows) {});
    }

    // add item without have expense_bill_id during edit
    if (editadditem.length > 0) {
      var items = editadditem.map(function(item) {
        return [item.item_name, item.item_amount, expense_bill_id]
      });
      var sql = "INSERT INTO expense_item (item_name,item_amount,expense_bill_id)  VALUES ? ";
      db.executeQuery1(sql, [items], function(results) {

      });
    }

    res.sendStatus(200);

  });

  //update payment for expense
  app.put(apiUrl + '/update_expensepayment/:expense_bill_id', function(req, res) {
    let expense_bill_id = req.params.expense_bill_id;
    var sql = `UPDATE expense_payment SET note = "${req.body[0].note}",status = "${req.body[0].status}",paid_date = "${req.body[0].paid_date}",received_amount = "${req.body[0].received_amount}",payment_status = "${req.body[0].payment_status}",payment_type = "${req.body[0].payment_type}",tax_cgst = "${req.body[0].tax_cgst}",tax_sgst = "${req.body[0].tax_sgst}",tax_cgstPercent = "${req.body[0].tax_cgstPercent}",tax_sgstPercent = "${req.body[0].tax_sgstPercent}",tax_type = "${req.body[0].tax_type}",tax_status = "${req.body[0].tax_status}",transcation_no = "${req.body[0].transcation_no}",cheque_no = "${req.body[0].cheque_no}",discount = "${req.body[0].discount}",subtotal = "${req.body[0].subtotal}",total_amount = "${req.body[0].total_amount}" WHERE status="general" && expense_bill_id = "${expense_bill_id}"`;
    db.executeQuery(sql, function(err, rows) {
      res.sendStatus(200);
    });
  });

 //update payment for raw material
  app.put(apiUrl + '/update_expensepayment_purchase/:expense_bill_id', function(req, res) {
    let expense_bill_id = req.params.expense_bill_id;
    var sql = `UPDATE expense_payment SET note = "${req.body[0].note}",status = "${req.body[0].status}",paid_date = "${req.body[0].paid_date}",received_amount = "${req.body[0].received_amount}",payment_status = "${req.body[0].payment_status}",payment_type = "${req.body[0].payment_type}",tax_cgst = "${req.body[0].tax_cgst}",tax_sgst = "${req.body[0].tax_sgst}",tax_cgstPercent = "${req.body[0].tax_cgstPercent}",tax_sgstPercent = "${req.body[0].tax_sgstPercent}",tax_type = "${req.body[0].tax_type}",tax_status = "${req.body[0].tax_status}",transcation_no = "${req.body[0].transcation_no}",cheque_no = "${req.body[0].cheque_no}",discount = "${req.body[0].discount}",subtotal = "${req.body[0].subtotal}",total_amount = "${req.body[0].total_amount}" WHERE status="purchase" && purchase_order_id = "${expense_bill_id}"`;
    db.executeQuery(sql, function(err, rows) {
      res.sendStatus(200);
    });
  });

//update payment for sale material
  app.put(apiUrl + '/update_expensepayment_sales/:expense_bill_id', function(req, res) {
    let expense_bill_id = req.params.expense_bill_id;
    var sql = `UPDATE expense_payment SET note = "${req.body[0].note}",status = "${req.body[0].status}",paid_date = "${req.body[0].paid_date}",received_amount = "${req.body[0].received_amount}",payment_status = "${req.body[0].payment_status}",payment_type = "${req.body[0].payment_type}",tax_cgst = "${req.body[0].tax_cgst}",tax_sgst = "${req.body[0].tax_sgst}",tax_cgstPercent = "${req.body[0].tax_cgstPercent}",tax_sgstPercent = "${req.body[0].tax_sgstPercent}",tax_type = "${req.body[0].tax_type}",tax_status = "${req.body[0].tax_status}",transcation_no = "${req.body[0].transcation_no}",cheque_no = "${req.body[0].cheque_no}",discount = "${req.body[0].discount}",subtotal = "${req.body[0].subtotal}",total_amount = "${req.body[0].total_amount}" WHERE status="sales" && inventory_salesOrder_id = "${expense_bill_id}"`;
    db.executeQuery(sql, function(err, rows) {
      res.sendStatus(200);
    });
  });


  //delete delete_expense_items with id
  app.delete(apiUrl + '/delete_expense_items/:expense_item_id', function(req, res) {
    var sql = 'DELETE FROM expense_item WHERE expense_item_id = "' + req.params.expense_item_id + '"';
    db.executeQuery(sql, function(err, rows, fields) {
      res.sendStatus(200);
    });
  });

  // Get vendors for expense 
  app.get(apiUrl + '/getvendors', function(req, res) {
    db.executeQuery('SELECT * FROM vendors', function(results) {
      return res.status(200).send(results);
    });
  });

   /*-------------------------------------------
   =============================================

    BALANCE EXPENSES

  ===============================================
    -------------------------------------------*/

 //delete delete_expense_items with id
  app.delete(apiUrl + '/delete_expense/:expense_bill_id', function(req, res) {
// Delete expense items
    var sql = 'DELETE FROM expense_item WHERE expense_bill_id = "' + req.params.expense_bill_id + '"';
    db.executeQuery(sql, function(err, rows, fields) {
      // Delete payment
      var sql = 'DELETE FROM expense_payment WHERE expense_bill_id = "' + req.params.expense_bill_id + '"';
      db.executeQuery(sql, function(err, rows, fields) {
        // Delete primary table
        var sql = 'DELETE FROM expense_bill WHERE expense_bill_id = "' + req.params.expense_bill_id + '"';
        db.executeQuery(sql, function(err, rows, fields) {
          res.sendStatus(200);
        });
      });
    });
  });

  /*==========================================================================
                           General_balance_expense
    ========================================================================== */


  // Get balance expense data
  app.get(apiUrl + '/balanceexpense_service', function(req, res, next) {
    var data = req.query;
    var filter = req.query.filter;
    var numRows;
    var queryPagination;
    var numPerPage = parseInt(req.query.limit, 10) || 1;
    var page = req.query.page == undefined ? 1 : req.query.page
    var numPages;
    var doordelivery;
    var skip = page * numPerPage

    //pagination
    var limit = skip - numPerPage + ',' + parseInt(skip + numPerPage);
    db.executeQuery("SELECT expense_bill.expense_bill_id,expense_bill.staffID,expense_bill.created_on,expense_payment.payment_status,expense_payment.received_amount,expense_bill.category_name,expense_bill.vendor_name,expense_payment.total_amount,expense_payment.status,expense_payment.paid_date  FROM expense_bill INNER JOIN expense_payment ON expense_bill.expense_bill_id = expense_payment.expense_bill_id WHERE ((payment_status='unpaid' OR payment_status='advance paid') && status='general' && staffID LIKE '%" + req.query.staffID + "%' &&  branch_id LIKE '%" + req.query.branch_id + "%') And (expense_bill.expense_bill_id LIKE '%" + filter + "%' or expense_payment.total_amount LIKE '%" + filter + "%' OR expense_bill.vendor_name LIKE '%" + filter + "%')", function(results) {
      // Get no of page and rows for pagination
      numRows = results.length;
      numPages = Math.ceil(numRows / numPerPage);
    })

    db.executeQuery("SELECT expense_bill.expense_bill_id,expense_bill.staffID,expense_bill.modifiedID,expense_bill.last_modified,expense_bill.created_on,expense_payment.payment_status,expense_payment.received_amount,expense_bill.category_name,expense_bill.vendor_name,expense_payment.total_amount,expense_payment.status,expense_payment.paid_date  FROM expense_bill INNER JOIN expense_payment ON expense_bill.expense_bill_id = expense_payment.expense_bill_id WHERE ((payment_status='unpaid' OR payment_status='advance paid') && status='general' && staffID LIKE '%" + req.query.staffID + "%' &&  branch_id LIKE '%" + req.query.branch_id + "%') And (expense_bill.expense_bill_id LIKE '%" + filter + "%' or expense_payment.total_amount LIKE '%" + filter + "%' OR expense_bill.vendor_name LIKE '%" + filter + "%') GROUP BY expense_bill_id DESC", function(results) {
      //map full data for our purpose
      var currentexpense = results.map(function(item) {
        var currentTime = new Date();
        var endTime = new Date(item.created_on);
        var ms = (endTime - currentTime); // ms of difference
        var days = Math.round(ms / 86400000);
        var finalCountdown = (days + "d remaining");
        var remainingtime = ms < 0 ? "EXPIRED" : finalCountdown

        return { 'expense_bill_id': item.expense_bill_id, 'staffID': item.staffID, 'modifiedID': item.modifiedID, 'last_modified': new Date(item.last_modified), 'received_amount': item.received_amount, 'category_name': item.category_name, 'vendor_name': item.vendor_name, 'total_amount': item.total_amount, 'due_date': item.created_on, 'remaining': remainingtime == 'NaNd remaining' ? '-' : remainingtime, 'paid_date': item.paid_date, 'payment_status': item.payment_status }
      });

      /*------------------
          Total amount 
          ---------------*/
      //filter only  card datas
      var total_expense = []
      results.filter(function(item) {
        if (item.payment_status == 'advance paid' || item.payment_status == 'unpaid') {
          total_expense.push(parseInt(item.total_amount))
          return item
        }
      })
      //calculate sum of cashes
      if (total_expense.length > 0) {
        var total_expenses = total_expense.reduce(function(a, b) {
          return a + b;
        });
      }

      //filter only  card datas
      var total_advance = []
      results.filter(function(item) {
        if (item.payment_status == 'advance paid' || item.payment_status == 'unpaid') {
          total_advance.push(parseInt(item.received_amount))
          return item
        }
      })
      //calculate sum of cashes
      if (total_advance.length > 0) {
        var total_advances = total_advance.reduce(function(a, b) {
          return a + b;
        });
      }
      //store calculated values in to an array
      var responsePayload = [{
        results: currentexpense,
        total_advance: total_advances == undefined ? 0 : total_advances,
        total_expense: total_expenses == undefined ? 0 : total_expenses,
        paidexpense_count: numRows

      }];
      if (page < numPages) {
        responsePayload.pagination = [{
          current: page,
          perPage: numPerPage,
          previous: page > 0 ? page - 1 : undefined,
          next: page < numPages - 1 ? page + 1 : undefined
        }]

      } else responsePayload.pagination = {
        err: 'queried page ' + page + ' is >= to maximum page number ' + numPages
      }
      return res.status(200).send(responsePayload);

    });

  })


  /*==========================================================================
                         Other manipulations in balance expense
    ========================================================================== */



  //get expense bill data from primary table
  app.get(apiUrl + '/balexpense/:expense_bill_id', function(req, res) {
    var sql = 'SELECT * FROM expense_bill WHERE expense_bill_id = "' + req.params.expense_bill_id + '"';
    db.executeQuery(sql, function(results) {
      return res.status(200).send(results);
    });
  });
  //expense_item  for newexpense  from expensebalance to newexpense controller
  app.get(apiUrl + '/expense_item/:expense_bill_id', function(req, res) {
    var sql = 'SELECT * FROM expense_item WHERE expense_bill_id = "' + req.params.expense_bill_id + '"';
    db.executeQuery(sql, function(results) {
      return res.status(200).send(results);
    });
  });

  //expense_payment  for newexpense  from expensebalance to newexpense controller
  app.get(apiUrl + '/expense_payment/:expense_bill_id', function(req, res) {
    var sql = 'SELECT * FROM expense_payment WHERE status="general" && expense_bill_id = "' + req.params.expense_bill_id + '"';
    db.executeQuery(sql, function(results) {
      return res.status(200).send(results);
    });
  });
  //expense_payment  for raw material expense 
  app.get(apiUrl + '/expense_payment_purchase/:expense_bill_id', function(req, res) {
    var sql = 'SELECT * FROM expense_payment WHERE status="purchase" && purchase_order_id = "' + req.params.expense_bill_id + '"';
    db.executeQuery(sql, function(results) {
      return res.status(200).send(results);
    });
  });
  //expense_payment  sale material expense
  app.get(apiUrl + '/expense_payment_sales/:expense_bill_id', function(req, res) {
    var sql = 'SELECT * FROM expense_payment WHERE status="sales" &&  inventory_salesOrder_id = "' + req.params.expense_bill_id + '"';
    db.executeQuery(sql, function(results) {
      return res.status(200).send(results);
    });
  });


    /*-------------------------------------------
   =============================================

    PAID EXPENSES

  ===============================================
    -------------------------------------------*/



  /*==========================================================================
                           General_paid_expense
    ========================================================================== */


  // Get paid expense data from expense bill data
  app.get(apiUrl + '/paidexpense_service', function(req, res, next) {
    var data = req.query;
    var filter = req.query.filter;
    var numRows;
    var queryPagination;
    var numPerPage = parseInt(req.query.limit, 10) || 1;
    var page = req.query.page == undefined ? 1 : req.query.page
    var numPages;
    var doordelivery;
    var skip = page * numPerPage
    if (req.query.staffID == "admin") {
      var staffID = ''
    } else {
      var staffID = req.query.staffID;
    }
    // Pagination
    var limit = skip - numPerPage + ',' + parseInt(skip + numPerPage);
    db.executeQuery("SELECT expense_bill.expense_bill_id,expense_bill.staffID,expense_bill.modifiedID,expense_bill.last_modified,expense_payment.subtotal,expense_payment.received_amount,expense_payment.tax_cgst,expense_payment.tax_sgst,expense_payment.discount,expense_payment.payment_status,expense_bill.category_name,expense_bill.vendor_name,expense_bill.vendor_id,expense_payment.total_amount,expense_payment.payment_type,expense_payment.status,expense_payment.paid_date  FROM expense_bill INNER JOIN expense_payment ON expense_bill.expense_bill_id = expense_payment.expense_bill_id WHERE (payment_status='fully paid' &&  status='general' && staffID LIKE '%" + staffID + "%'  && expense_payment.payment_type LIKE '%" + req.query.PaidType + "%' && DATE(paid_date)  LIKE '%" + req.query.date + "%' &&  (YEAR(paid_date) LIKE '%" + req.query.year + "%' and MONTH(paid_date) LIKE '%" + req.query.month + "%')  && expense_bill.exCatergoryID LIKE '%" + req.query.categoryid + "%' && expense_bill.vendor_id LIKE '%" + req.query.vendor + "%' && branch_id LIKE '%" + req.query.branch_id + "%') And (expense_bill.expense_bill_id LIKE '%" + filter + "%' or expense_payment.total_amount LIKE '%" + filter + "%' OR expense_bill.vendor_name LIKE '%" + filter + "%')", function(results) {
      // Get no of page and rows for pagination
      numRows = results.length;
      numPages = Math.ceil(numRows / numPerPage);
    })
    db.executeQuery("SELECT expense_bill.expense_bill_id,expense_bill.staffID,expense_bill.modifiedID,expense_bill.last_modified,expense_payment.subtotal,expense_payment.tax_cgst,expense_payment.tax_sgst,expense_payment.discount,expense_payment.received_amount,expense_payment.payment_status,expense_bill.category_name,expense_bill.vendor_name,expense_bill.vendor_id,expense_payment.total_amount,expense_payment.payment_type,expense_payment.status,expense_payment.paid_date  FROM expense_bill INNER JOIN expense_payment ON expense_bill.expense_bill_id = expense_payment.expense_bill_id WHERE (payment_status='fully paid' && status='general' &&  staffID LIKE '%" + staffID + "%'  && expense_payment.payment_type LIKE '%" + req.query.PaidType + "%' && DATE(paid_date)  LIKE '%" + req.query.date + "%' && (YEAR(paid_date) LIKE '%" + req.query.year + "%' and MONTH(paid_date) LIKE '%" + req.query.month + "%') && expense_bill.exCatergoryID LIKE '%" + req.query.categoryid + "%' && expense_bill.vendor_id LIKE '%" + req.query.vendor + "%' && branch_id LIKE '%" + req.query.branch_id + "%') AND (expense_bill.expense_bill_id LIKE '%" + filter + "%' OR expense_payment.total_amount LIKE '%" + filter + "%' OR expense_bill.vendor_name LIKE '%" + filter + "%' )  GROUP BY expense_bill_id DESC", function(results) {
      /*------------------
      Total amount 
      ---------------*/
      //filter only fully paid & total amount
      var total_expense = []
      results.filter(function(item) {
        if (item.payment_status == 'fully paid') {
          total_expense.push(parseInt(item.total_amount))
          return item
        }
      })
      //calculate sum of total amount it will work array amount data convert to total amount(sum)
      if (total_expense.length > 0) {
        var total_expenses = total_expense.reduce(function(a, b) {
          return a + b;
        });
      }
      //filter only  fully paid & cash
      var total_cash = []
      results.filter(function(item) {
        if (item.payment_status == 'fully paid' && item.payment_type == 'cash') {
          total_cash.push(parseInt(item.total_amount))
          return item
        }
      })
      //calculate sum of cashes
      if (total_cash.length > 0) {
        var total_cashs = total_cash.reduce(function(a, b) {
          return a + b;
        });
      }

      //filter only  fully paid & card
      var total_card = []
      results.filter(function(item) {
        if (item.payment_status == 'fully paid' && item.payment_type == 'card') {
          total_card.push(parseInt(item.total_amount))
          return item
        }
      })
      //calculate sum of cashes
      if (total_card.length > 0) {
        var total_cards = total_card.reduce(function(a, b) {
          return a + b;
        });
      }

      //filter only  fully paid & cheque
      var total_cheque = []
      results.filter(function(item) {
        if (item.payment_status == 'fully paid' && item.payment_type == 'cheque') {
          total_cheque.push(parseInt(item.total_amount))
          return item
        }
      })
      //calculate sum of cashes
      if (total_cheque.length > 0) {
        var total_cheques = total_cheque.reduce(function(a, b) {
          return a + b;
        });
      }
      //filter only  fully paid & online
      var total_online = []
      results.filter(function(item) {
        if (item.payment_status == 'fully paid' && item.payment_type == 'onlineTranscation') {
          total_online.push(parseInt(item.total_amount))
          return item
        }
      })
      //calculate sum of cashes
      if (total_online.length > 0) {
        var total_onlines = total_online.reduce(function(a, b) {
          return a + b;
        });
      }
      //store calculated values in to an array
      var responsePayload = [{
        results: results,
        total_expense: total_expenses == undefined ? 0 : total_expenses,
        total_cash: total_cashs == undefined ? 0 : total_cashs,
        total_card: total_cards == undefined ? 0 : total_cards,
        total_cheque: total_cheques == undefined ? 0 : total_cheques,
        total_online: total_onlines == undefined ? 0 : total_onlines,
        paidexpense_count: numRows

      }];

      if (page < numPages) {
        responsePayload.pagination = [{
          current: page,
          perPage: numPerPage,
          previous: page > 0 ? page - 1 : undefined,
          next: page < numPages - 1 ? page + 1 : undefined
        }]

      } else responsePayload.pagination = {
        err: 'queried page ' + page + ' is >= to maximum page number ' + numPages
      }
      return res.status(200).send(responsePayload);

    });

  })


    /*-------------------------------------------
   =============================================

    EXPENSES RECURRING

  ===============================================
    -------------------------------------------*/

  //post saleitems data to database

  app.post(apiUrl + '/recurring', function(req, res) {
    var data = req.body;

   console.log(data)

    var sql = "INSERT INTO expense_recurring SET ?";
    db.executeQuery1(sql, data, function(results) {
      return res.status(200).send(results);
    });
  });


}
