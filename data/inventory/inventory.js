var DB = require('../../dbQueries')
var db = new DB();
var apiUrl = "/api"
var mysql = require('mysql');
var bodyParser = require('body-parser');

/*-------------------------------------------
LIST

- SALES ORDER
- PURCHASE ORDER
- DELIVERY TO KITCHEN
- STOCK RAW MATERIAL
- STOCK SALE MATERIAL
 -----------------------------------------*/

module.exports = function(app) {

   /*-------------------------------------------
   =============================================

    SALES ORDER

  ===============================================
    -------------------------------------------*/

  //get purchase sales material data from inventory sales order table
  app.get(apiUrl + '/inventory_salesdata/:purchase_order_id', function(req, res) {
    var sql = 'SELECT * FROM inventory_sales_order WHERE inventory_salesOrder_id = "' + req.params.purchase_order_id + '"';
    db.executeQuery(sql, function(results) {
      return res.status(200).send(results);
    });

  });

  //get all purchase sale material data from inventory sales order table
  app.get(apiUrl + '/salematerial_bill_data', function(req, res) {
    db.executeQuery('SELECT * FROM inventory_sales_order', function(results) {
      return res.status(200).send(results);
    });
  });


  //get purchase sale material items data from inventory sales order table
  app.get(apiUrl + '/inventory_salesItems/:purchase_order_id', function(req, res) {
    var sql = 'SELECT * FROM inventory_sales_items WHERE inventory_salesOrder_id = "' + req.params.purchase_order_id + '"';
    db.executeQuery(sql, function(results) {
      return res.status(200).send(results);
    });

  });


  // post purchase order (primary table) for inventory sale material
  app.post(apiUrl + '/inventory_sales_order', function(req, res) {
    console.log(req.body)
    let data = req.body;
    var sql = `UPDATE inventory_sales_order SET  vendor_name = "${req.body[0].vendor_name}",vendor_id = "${req.body[0].vendor_id}",branch_id = "${req.body[0].branch_id}",due_date = "${req.body[0].due_date}",DeliveryDate = "${req.body[0].DeliveryDate}",Description = "${req.body[0].Description}",status = "${req.body[0].status}",staffID = "${req.body[0].staffID}",modifiedID = "${req.body[0].modifiedID}",order_bill_type = "${req.body[0].order_bill_type}" WHERE inventory_salesOrder_id = "${req.body[0].inventory_salesOrder_id}"`;
    db.executeQuery(sql, function(err, rows) {
      return res.sendStatus(200);
    });
  });


  //post purchase sale material items to database
  app.post(apiUrl + '/inventory_sale_items', function(req, res) {
    var data = req.body;
    var inventory_salesOrder_id = req.body.inventory_salesOrder_id;
    var items = data.itemdata.map(function(item) {
      return [item.smCatergoryID, item.smItemID, item.smname, item.containQty, item.expiry_date, item.quantity, item.smrate, item.item_subtotal, inventory_salesOrder_id]
    });
    var sql = "INSERT INTO inventory_sales_items( smCatergoryID,smItemID,smname,containQty,expiry_date,quantity,smrate,item_subtotal,inventory_salesOrder_id)  VALUES ? ";
    db.executeQuery1(sql, [items], function(results) {
      return res.status(200).send(results);
    });
  });


  // Getting each bill item count
  app.get(apiUrl + '/getsales', function(req, res) {
    db.executeQuery('SELECT  inventory_sales_items.inventory_salesOrder_id,inventory_sales_items.smname,inventory_sales_order.vendor_name,inventory_sales_order.staffID,inventory_sales_order.created_on,inventory_sales_order.DeliveryDate,inventory_sales_order.status  FROM inventory_sales_order INNER JOIN inventory_sales_items ON inventory_sales_order.inventory_salesOrder_id = inventory_sales_items.inventory_salesOrder_id', function(results) {
      return res.status(200).send(results);
    });
  });


  // Get purchase order sale material data from database
  app.get(apiUrl + '/getsales_service', function(req, res, next) {
    var data = req.query;
    var filter = req.query.filter;
    var order_bill_type = req.query.order_bill_type;
    if (req.query.staffID == "admin") {
      var staffID = ''
    } else {
      var staffID = req.query.staffID;
    }
    if (req.query.amount_type == 'All') {
      var payment_status = ''
      var payment_statuss = ''
      var fullypayment_status = ''
    } else if (req.query.amount_type == 'balance') {
      var payment_status = 'unpaid'
      var payment_statuss = 'advance paid'
      var fullypayment_status = ''
    } else if (req.query.amount_type == 'fully paid') {
      var fullypayment_status = req.query.amount_type
      var payment_status = '';
      var payment_statuss = ''
    }

    var numRows;
    var queryPagination;
    var numPerPage = parseInt(req.query.limit, 10) || 1;
    var page = req.query.page == undefined ? 1 : req.query.page
    var numPages;
    var doordelivery;
    var skip = page * numPerPage;
    // Here we compute the LIMIT parameter for MySQL query inventory_sales_order.inventory_salesOrder_id
    var limit = skip - numPerPage + ',' + parseInt(skip + numPerPage);

    // Inventory sales order and expense payment data receiving
    db.executeQuery("SELECT  inventory_sales_order.inventory_salesOrder_id,inventory_sales_order.modifiedID,inventory_sales_order.last_modified,expense_payment.payment_type,inventory_sales_order.due_date,inventory_sales_order.staffID,inventory_sales_order.vendor_name,inventory_sales_order.staffID,inventory_sales_order.created_on,inventory_sales_order.DeliveryDate,inventory_sales_order.status  as purchaseStatus,expense_payment.total_amount,expense_payment.received_amount,expense_payment.discount,expense_payment.tax_cgst,expense_payment.tax_sgst,expense_payment.status,expense_payment.payment_status,expense_payment.paid_date  FROM inventory_sales_order INNER JOIN expense_payment ON inventory_sales_order.inventory_salesOrder_id = expense_payment.inventory_salesOrder_id WHERE ((expense_payment.status='sales') && (order_bill_type='" + order_bill_type + "')  && staffID LIKE '%" + staffID + "%' && (YEAR(expense_payment.paid_date) LIKE '%" + req.query.year + "%' and MONTH(expense_payment.paid_date) LIKE '%" + req.query.month + "%') && inventory_sales_order.vendor_id LIKE '%" + req.query.vendor + "%'  && (expense_payment.payment_status LIKE '%" + payment_statuss + "%' || expense_payment.payment_status LIKE '%" + payment_status + "%') && expense_payment.payment_status LIKE '%" + fullypayment_status + "%' && inventory_sales_order.status LIKE '%" + req.query.status_type + "%' && branch_id LIKE '%" + req.query.branch_id + "%') AND (inventory_sales_order.inventory_salesOrder_id LIKE '%" + filter + "%' OR expense_payment.total_amount LIKE '%" + filter + "%' OR inventory_sales_order.vendor_name LIKE '%" + filter + "%' ) ORDER BY inventory_salesOrder_id DESC", function(results) {
     numRows = results.length;
      /*------------------
      Total amount for all type in dropdown
      ---------------*/
      var total_purchase = [] //In amount
      results.filter(function(item) {
        if (item.payment_status == 'fully paid') {
          total_purchase.push(parseInt(item.total_amount))
          return item
        }
      })
      //calculate sum of total amount it will work array amount data convert to total amount(sum)
      if (total_purchase.length > 0) {
        var total_purchases = total_purchase.reduce(function(a, b) {
          return a + b;
        });
      }
      /*------------------
      Cash fully paid calculation for dropdown filter
      ---------------*/
      var total_cash = []
      results.filter(function(item) {
        if ((item.payment_status == 'fully paid') && item.payment_type == 'cash') {
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

      /*------------------
      Card fully paid calculation for dropdown filter
      ---------------*/
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


      /*------------------
      Cheque full paid calculation for dropdown filter
      ---------------*/
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
      /*------------------
       Online payment mode &  full paid for dropdown filter
       ---------------*/
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


      /*------------------
       Advance payment mode &  cash for dropdown filter
       ---------------*/
      var advance_cash = []
      results.filter(function(item) {
        if ((item.payment_status == 'advance paid') && item.payment_type == 'cash') {
          advance_cash.push(parseInt(item.received_amount))
          return item
        }
      })
      //calculate sum of cashes
      if (advance_cash.length > 0) {
        var advance_cashs = advance_cash.reduce(function(a, b) {
          return a + b;
        });
      }

      /*------------------
        Advance payment mode &  card for dropdown filter
        ---------------*/
      var advance_card = []
      results.filter(function(item) {
        if (item.payment_status == 'advance paid' && item.payment_type == 'card') {
          advance_card.push(parseInt(item.received_amount))
          return item
        }
      })
      //calculate sum of cashes
      if (advance_card.length > 0) {
        var advance_cards = advance_card.reduce(function(a, b) {
          return a + b;
        });
      }

      /*------------------
      Advance payment mode &  cheque for dropdown filter
      ---------------*/
      var advance_cheque = []
      results.filter(function(item) {
        if (item.payment_status == 'advance paid' && item.payment_type == 'cheque') {
          advance_cheque.push(parseInt(item.received_amount))
          return item
        }
      })
      //calculate sum of cashes
      if (advance_cheque.length > 0) {
        var advance_cheques = advance_cheque.reduce(function(a, b) {
          return a + b;
        });
      }
      /*------------------
      Advance payment mode &  Online transcation for dropdown filter
      ---------------*/
      var advance_online = []
      results.filter(function(item) {
        if (item.payment_status == 'advance paid' && item.payment_type == 'onlineTranscation') {
          advance_online.push(parseInt(item.received_amount))
          return item
        }
      })
      //calculate sum of cashes
      if (advance_online.length > 0) {
        var advance_onlines = advance_online.reduce(function(a, b) {
          return a + b;
        });
      }

      /*------------------
       Total Received amount
       ---------------*/
      var total_advanceAmount = []
      results.filter(function(item) {
        if (item.payment_status == 'advance paid' || item.payment_status == 'unpaid') {
          total_advanceAmount.push(parseInt(item.total_amount))
          return item
        }
      })
      //calculate sum of cashes
      if (total_advanceAmount.length > 0) {
        var total_advanceAmounts = total_advanceAmount.reduce(function(a, b) {
          return a + b;
        });
      }

      /*------------------
      Advance payment mode &  fully paid for dropdown filter
      ---------------*/
      var paid_count = []
      results.filter(function(item) {
        if (item.payment_status == 'advance paid' || item.payment_status == 'fully paid') {
          paid_count.push(parseInt(item.total_amount))
          return item
        }
      })
      /*------------------
      Total Received amount
      ---------------*/
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
      var total_purchased1 = total_advanceAmounts == undefined ? 0 : total_advanceAmounts; //assign purchse total  amounts in advance or unpaid
      var total_purchased2 = total_purchases == undefined ? 0 : total_purchases; //assign fully paid total  amount
      var total = total_purchased1 + total_purchased2; //calculate total(fullypaid+advancepaid+unpaaid)
      var total_purchased3 = total_advances == undefined ? 0 : total_advances //assign purchase received amount in advance status
      var total_paid = total_purchased2 + total_purchased3; //calculate only paid amount(totalamount+receivedamount)
      var balance = total - total_paid; //here calculate balance=(fullypaid+advancepaid+unpaaid)-(totalamount+receivedamount)
      //store calculated values in to am array
      var responsePayload = [{
        results: results,
        total_purchase: total,
        total_paid: total_paid,
        balance: balance,
        balance_count: total_advance.length,
        paid_count: paid_count.length,
        total_cash: (total_cashs == undefined ? 0 : total_cashs) + (advance_cashs == undefined ? 0 : advance_cashs),
        total_card: (total_cards == undefined ? 0 : total_cards) + (advance_cards == undefined ? 0 : advance_cards),
        total_cheque: (total_cheques == undefined ? 0 : total_cheques) + (advance_cheques == undefined ? 0 : advance_cheques),
        total_online: (total_onlines == undefined ? 0 : total_onlines) + (advance_onlines == undefined ? 0 : advance_onlines),
        purchaseorder_count: numRows

      }];
      //  var responsePayload=results
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
  /*
    --------------------------------------------------
    While delete the purchase order item stock quantity will be reduce
    --------------------------------------------------
    */
  //while delete items in purchase sale material, quantity will be reduced from sale material stock table
  app.put(apiUrl + '/deleteAndupdate_salematerial_quantity/:siItemID/:inventory_salesItems_id', function(req, res) {

    let siItemID = req.params.siItemID;
    db.executeQuery('SELECT * FROM inventory_sales_items INNER JOIN inventory_sales_order ON inventory_sales_order.inventory_salesOrder_id=inventory_sales_items.inventory_salesOrder_id', function(db_inventory_sales_items) {
      // Receiving purchase sale material items
      db.executeQuery('SELECT * FROM sale_material_items', function(results) {
        // filter raw material items in stock table to know the stock difference
        var dbdata = results.filter(function(item) {
          if (siItemID == item.siItemID) {
            return item
          }
        })
        // get db stock qty
        var db_stock = dbdata.map(function(item) {
          return item.stock_quantity
        })
        //compare deleted purchase items id and all purchase item id which get from db and filter out 
        var checkdata = db_inventory_sales_items.filter(function(item) {
          if (req.params.inventory_salesItems_id == item.inventory_salesItems_id) {
            return item
          }
        })
        //while it is delivered purchase then update stock
        if (checkdata[0].status != 'ordered') {
          var stock = [parseInt(db_stock) - (parseInt(req.body.item_quantity) ? parseInt(req.body.item_quantity) : parseInt(checkdata[0].quantity * checkdata[0].containQty))];
          var sql = `UPDATE sale_material_items SET stock_quantity = "${stock<0 ? 0 : stock}" WHERE siItemID = "${siItemID}"`;
          db.executeQuery(sql, function(err, rows) {
            res.sendStatus(200);
          });
        } else {
          res.sendStatus(200);
        }
      })
    })
  })
  /*
  --------------------------------------------------
  While delete the inventory_sales_items delete in purchase order item table
  --------------------------------------------------
  */
  //delete purchase sale material items while edit
  app.delete(apiUrl + '/delete_salematerial_items/:inventory_salesItems_id', function(req, res) {
    var sql = 'DELETE FROM inventory_sales_items WHERE inventory_salesItems_id = "' + req.params.inventory_salesItems_id + '"';
    db.executeQuery(sql, function(err, rows, fields) {
      res.sendStatus(200);
    });
  });
  /*
  --------------------------------------------------
  Update the stock qty in stock table
  --------------------------------------------------
  */

  //  while edit in purchase  sale material inventory the stock will be increased in sale material items table
  app.put(apiUrl + '/update_salematerial_quantity/:siItemID', function(req, res) {
    let siItemID = req.params.siItemID;
    [req.body.editeditems].map(function(editeditems) {
      db.executeQuery('SELECT * FROM inventory_sales_items INNER JOIN inventory_sales_order ON inventory_sales_order.inventory_salesOrder_id=inventory_sales_items.inventory_salesOrder_id', function(db_inventory_sales_items) {
        // Receiving purchase sale material items
        db.executeQuery('SELECT * FROM sale_material_items', function(db_stock) {
          // filter sale material items in stock table and inventory_sales_items
          var dbdata = db_inventory_sales_items.filter(function(item) {
            if ((editeditems.inventory_salesItems_id == item.inventory_salesItems_id) && !editeditems.smname.smItemID) {
              return item
            }
          })
          //get current  stock of edited items and compare
          var db_stock_data = db_stock.filter(function(dbStockqty) {
            if (siItemID == dbStockqty.siItemID) {
              return dbStockqty
            }
          })
          //filter out only db stock quantity 
          var db_stock_dataa = db_stock_data.map(function(item) {
            return item.stock_quantity
          })
          /*------------------------------
           If purchase order item replaced
           -----------------------------*/
          //checking item cancel and replaced (via matched existing item id and newly added(items.smname.smItemID it will contain in this model) item id)
          var replaceitemdata = [req.body.editeditems].filter(function(items) {
            if (items.inventory_salesItems_id && items.smname.smItemID) {
              return items
            }
          })

          //if replacement item is available means the stock will increased for replacement item
          if (replaceitemdata.length) {
            //compare database salesorder_item data and client side edited data and return only matched 
            var getreplacementitem = db_inventory_sales_items.filter(function(item) {
              if ((editeditems.inventory_salesItems_id == item.inventory_salesItems_id) && editeditems.smname.smItemID) {
                return item
              }
            })
            //map and update replacement quantity depending on its quantity
            replaceitemdata.map(function(replacePurchaseItem) {
              var replaceitemquantity = { 'item_quantity': replacePurchaseItem.quantity * replacePurchaseItem.containQty, siItemID: item.smItemID }
              var replaceitemsiItemID = replaceitemquantity.siItemID
              var update_replacement_item = getreplacementitem.filter(function(items) {
                var stock = [parseInt(db_stock_dataa) - parseInt(items.quantity * items.containQty)];
                var sql = `UPDATE sale_material_items SET stock_quantity = "${stock<0 ? 0 : stock}" WHERE siItemID = "${replaceitemsiItemID}"`;
                db.executeQuery(sql, function(err, rows) {});
              })
            })
          }

          //check old item stock is equal to edited items
          // dbdata means inventory sales items data
          var check_exist_data = dbdata.filter(function(item) {
            if ((req.body.item_quantity == (item.quantity * item.containQty)) && item.status != 'ordered') {
              res.sendStatus(200);
            } // edited item higher  then stock will be increased depening on count
            else if ((req.body.item_quantity > (item.quantity * item.containQty)) && item.status != 'ordered') {
              var stock_difference = parseInt(req.body.item_quantity) - parseInt(item.quantity * item.containQty);
              var stock = [parseInt(db_stock_dataa) + stock_difference];
              var sql = `UPDATE sale_material_items SET stock_quantity = "${stock}" WHERE siItemID = "${siItemID}"`;
              db.executeQuery(sql, function(err, rows) {
                res.sendStatus(200);
              });
            } // edited item lowered  then stock will be reduced depening on count 
            else if (req.body.item_quantity < (item.quantity * item.containQty) && item.status != 'ordered') {
              var stock_difference = parseInt(item.quantity * item.containQty) - parseInt(req.body.item_quantity);
              var stock = [parseInt(db_stock_dataa) - stock_difference];
              var sql = `UPDATE sale_material_items SET stock_quantity = "${stock<0 ? 0 : stock}" WHERE siItemID = "${siItemID}"`;
              db.executeQuery(sql, function(err, rows) {
                res.sendStatus(200);
              });
            } //if status is orederd then it will be post stage like only increase with current stock
            else if (item.status == 'ordered') {
              db.executeQuery('SELECT * FROM sale_material_items', function(results) {
                //get all sale material items
                var dbdata = results.filter(function(item) {
                  if (siItemID == item.siItemID) {
                    return item
                  }
                })
                //get only all sm item of stocks
                var db_stock = dbdata.map(function(item) {
                  return item.stock_quantity
                })
                //this is post method only here perform just increase stock and update it
                var stock = [parseInt(db_stock) + parseInt(req.body.item_quantity)];
                var sql = `UPDATE sale_material_items SET stock_quantity = "${stock}" WHERE siItemID = "${siItemID}"`;
                db.executeQuery(sql, function(err, rows) {
                  res.sendStatus(200);
                });
              })
            }
          })
        })
      })
    })
  })
  /*
    --------------------------------------------------
    Add the stock qty in stock table
    --------------------------------------------------
    */
  //  while post in purchase  sale material inventory the stock will be increased in sale material items table
  app.put(apiUrl + '/updateInventory_salequantity/:siItemID', function(req, res) {

    let siItemID = req.params.siItemID;
    db.executeQuery('SELECT * FROM sale_material_items', function(results) {
      //get all sale material items
      var dbdata = results.filter(function(item) {
        if (siItemID == item.siItemID) {
          return item
        }

      })
      //get only all sm item of stocks
      var db_stock = dbdata.map(function(item) {
        return item.stock_quantity
      })
      //this is post method only here perform increase stock and update it
      var stock = [parseInt(db_stock) + parseInt(req.body.item_quantity)];
      var sql = `UPDATE sale_material_items SET stock_quantity = "${stock}" WHERE siItemID = "${siItemID}"`;
      db.executeQuery(sql, function(err, rows) {
        res.sendStatus(200);
      });
    })

  });

  /*------------------
   Inventory sales order data update service
   ------------------*/
  // update purchase sale material data 
  app.put(apiUrl + '/update_inventorySale_order/:purchase_order_id', function(req, res) {
    let purchase_order_id = req.params.purchase_order_id;
    var sql = `UPDATE inventory_sales_order SET  vendor_name = "${req.body[0].vendor_name}",vendor_id = "${req.body[0].vendor_id}",branch_id = "${req.body[0].branch_id}",due_date = "${req.body[0].due_date}",DeliveryDate = "${req.body[0].DeliveryDate}",Description = "${req.body[0].Description}",status = "${req.body[0].status}",modifiedID = "${req.body[0].modifiedID}" WHERE inventory_salesOrder_id = "${purchase_order_id}"`;
    db.executeQuery(sql, function(err, rows) {
      res.sendStatus(200);
    });

  });

  /*------------------
   inventory sales order items added and edited service (Edit action)
   ------------------*/
  // update purchase sale material items data 
  app.put(apiUrl + '/update_inventorySale_items/:purchase_order_id', function(req, res) {
    let inventory_salesOrder_id = req.params.purchase_order_id;
    var itemData = req.body.itemData;
    var barcode_enable = req.body.barcode_enable;
    //console.log(itemData);
    //filter out if added new data in edit scenario
    var editadditem = itemData.filter(function(addednewitem) {
      if (!addednewitem.inventory_salesItems_id) {
        return addednewitem
      }
    })
    //filter out existing db data for what changes his done
    var editdbitem = itemData.filter(function(getExistingitem) {
      if (getExistingitem.inventory_salesItems_id) {
        return getExistingitem
      }
    })
    // update item with have inventory sales items id during edit
    for (var i = 0; i < editdbitem.length; i++) {
      // if items is replaced will receive this model (editdbitem[i].smname.smname) or edited qty/rate will receive this model (editdbitem[i].smname) 
      var smCatergoryID = editdbitem[i].smname.smCatergoryID ? editdbitem[i].smname.smCatergoryID : editdbitem[i].smCatergoryID;
      var smItemID = editdbitem[i].smname.smItemID ? editdbitem[i].smname.smItemID : editdbitem[i].smItemID;
      // if barcode enable name changing
      if (barcode_enable) {
        var smname = editdbitem[i].smname.smItemID ? editdbitem[i].smname.display : editdbitem[i].smname;
      } else {
        var smname = editdbitem[i].smname.smItemID ? editdbitem[i].smname.smname : editdbitem[i].smname;
      }
      var containQty = editdbitem[i].smname.smItemID ? editdbitem[i].smname.containQty : editdbitem[i].containQty;
      var sql = `UPDATE  inventory_sales_items SET smCatergoryID  = "${smCatergoryID}",containQty="${containQty}",smname = "${smname}",smItemID = "${smItemID}",quantity = "${editdbitem[i].quantity}",expiry_date = "${editdbitem[i].expiry_date}",smrate = "${editdbitem[i].smrate}",item_subtotal = "${itemData[0].subtotal}" WHERE inventory_salesItems_id = "${editdbitem[i].inventory_salesItems_id}"`;
      db.executeQuery(sql, function(err, rows) {});
    }
    // add item without have inventory sales items id during edit
    if (editadditem.length > 0) {
      var items = editadditem.map(function(item) {
        return [item.smname.smCatergoryID, item.smname.smItemID, item.searchText, item.expiry_date, item.quantity, item.containQty, item.smrate, item.item_subtotal, inventory_salesOrder_id]
      });
      var sql = "INSERT INTO inventory_sales_items (smCatergoryID,smItemID,smname,expiry_date,quantity,containQty,smrate,item_subtotal,inventory_salesOrder_id)  VALUES ? ";
      db.executeQuery1(sql, [items], function(results) {});
    }
    res.sendStatus(200);
  });


  //delete purchase sale material items list
  app.delete(apiUrl + '/delete_salematerial_data/:inventory_salesOrder_id', function(req, res) {
    var sql = 'DELETE FROM inventory_sales_items WHERE inventory_salesOrder_id = "' + req.params.inventory_salesOrder_id + '"';
    db.executeQuery(sql, function(err, rows, fields) {
      var sql = 'DELETE FROM expense_payment WHERE inventory_salesOrder_id = "' + req.params.inventory_salesOrder_id + '"';
      db.executeQuery(sql, function(err, rows, fields) {
        var sql = 'DELETE FROM inventory_sales_order WHERE inventory_salesOrder_id = "' + req.params.inventory_salesOrder_id + '"';
        db.executeQuery(sql, function(err, rows, fields) {
          res.sendStatus(200);
        });
      })
    })
  });

   /*-------------------------------------------
   =============================================

    PURCHASE ORDER

  ===============================================
    -------------------------------------------*/


  //get purchase raw material data from purchase order table
  app.get(apiUrl + '/purchasedata/:purchase_order_id', function(req, res) {
    var sql = 'SELECT * FROM purchase_order WHERE purchase_order_id = "' + req.params.purchase_order_id + '"';
    db.executeQuery(sql, function(results) {
      return res.status(200).send(results);
    });
  });

  //get purchase raw material items data from purchase order table
  app.get(apiUrl + '/purchaseitem/:purchase_order_id', function(req, res) {
    var sql = 'SELECT * FROM purchase_items WHERE purchase_order_id = "' + req.params.purchase_order_id + '"';
    db.executeQuery(sql, function(results) {
      return res.status(200).send(results);
    });
  });

  //get all purchase raw material data from purchase order table
  app.get(apiUrl + '/rawmaterial_bill_data', function(req, res) {
    db.executeQuery('SELECT * FROM purchase_order', function(results) {
      return res.status(200).send(results);
    });
  });

  // post purchase order for inventory raw material
  //----------------
  app.post(apiUrl + '/purchase_orders', function(req, res) {
    let data = req.body;
    var sql = `UPDATE purchase_order SET  vendor_name = "${req.body[0].vendor_name}",vendor_id = "${req.body[0].vendor_id}",branch_id = "${req.body[0].branch_id}",due_date = "${req.body[0].due_date}",DeliveryDate = "${req.body[0].DeliveryDate}",Description = "${req.body[0].Description}",status = "${req.body[0].status}",staffID = "${req.body[0].staffID}",modifiedID = "${req.body[0].modifiedID}" WHERE purchase_order_id = "${req.body[0].purchase_order_id}"`;
    db.executeQuery(sql, function(err, rows) {
      return res.sendStatus(200);
    });
  });


  //delete purchase raw material data
  app.delete(apiUrl + '/delete_rawmaterial_data/:purchase_order_id', function(req, res) {
    var sql = 'DELETE FROM purchase_items WHERE purchase_order_id = "' + req.params.purchase_order_id + '"';
    db.executeQuery(sql, function(err, rows, fields) {
      var sql = 'DELETE FROM expense_payment WHERE purchase_order_id = "' + req.params.purchase_order_id + '"';
      db.executeQuery(sql, function(err, rows, fields) {
        var sql = 'DELETE FROM purchase_order WHERE purchase_order_id = "' + req.params.purchase_order_id + '"';
        db.executeQuery(sql, function(err, rows, fields) {
          res.sendStatus(200);
        });
      })
    })
  });


  //post purchase raw material items to database

  app.post(apiUrl + '/purchase_items', function(req, res) {
    var data = req.body;
    var purchase_order_id = req.body.purchase_order_id;
    var items = data.itemdata.map(function(item) {
      return [item.rmCatergoryID, item.rmItemID, item.rmname, item.containQty, item.expiry_date, item.quantity, item.rmrate, item.item_subtotal, purchase_order_id]
    });

    var sql = "INSERT INTO purchase_items (rmCatergoryID,rmItemID,rmname,containQty,expiry_date,quantity,rmrate,item_subtotal,purchase_order_id)  VALUES ? ";
    db.executeQuery1(sql, [items], function(results) {
      return res.status(200).send(results);

    });
  });



  //get purchase raw material items from database
  app.get(apiUrl + '/getpurchase', function(req, res) {
    db.executeQuery('SELECT  purchase_items.purchase_order_id,purchase_items.rmname,purchase_order.vendor_name,purchase_order.staffID,purchase_order.created_on,purchase_order.DeliveryDate,purchase_order.status  FROM purchase_order INNER JOIN purchase_items ON purchase_order.purchase_order_id = purchase_items.purchase_order_id', function(results) {
      return res.status(200).send(results);
    });
  });


  // Get purchase order  list raw material data from database (list of purchase orders page)
  app.get(apiUrl + '/getpurchase_service', function(req, res, next) {
   /*
     req.query.vendor for vendor
     req.query.amount_type for balance/fully paid
     req.query.staffID for staff
     req.query.month for month
     req.query.year for year
*/

    var data = req.query;
    var filter = req.query.filter;
    if (req.query.staffID == "admin") {
      var staffID = ''
    } else {
      var staffID = req.query.staffID;
    }
    // Amount type filter
    if (req.query.amount_type == 'All') {
      var payment_status = ''
      var payment_statuss = ''
      var fullypayment_status = ''
    } else if (req.query.amount_type == 'balance') {
      var payment_status = 'unpaid'
      var payment_statuss = 'advance paid'
      var fullypayment_status = ''
    } else if (req.query.amount_type == 'fully paid') {
      var fullypayment_status = req.query.amount_type
      var payment_status = '';
      var payment_statuss = ''
    }
    // Pagination
    var numRows;
    var queryPagination;
    var numPerPage = parseInt(req.query.limit, 10) || 1;
    var page = req.query.page == undefined ? 1 : req.query.page
    var numPages;
    var doordelivery;
    var skip = page * numPerPage
    // Here we compute the LIMIT parameter for MySQL query  && expense_payment.payment_status LIKE '%" + payment_status + "%'  && expense_payment.payment_status LIKE '%" + payment_status + "%'
    var limit = skip - numPerPage + ',' + parseInt(skip + numPerPage);
    // Get no of page and rows for pagination
    db.executeQuery("SELECT  purchase_order.purchase_order_id,expense_payment.payment_type,purchase_order.due_date,expense_payment.discount,expense_payment.tax_sgst,expense_payment.tax_cgst,purchase_order.staffID,purchase_order.vendor_name,purchase_order.staffID,purchase_order.created_on,purchase_order.DeliveryDate,purchase_order.status as purchaseStatus,expense_payment.total_amount,expense_payment.received_amount,expense_payment.status,expense_payment.payment_status,expense_payment.paid_date  FROM purchase_order INNER JOIN expense_payment ON purchase_order.purchase_order_id = expense_payment.purchase_order_id WHERE ((expense_payment.status='purchase') && staffID LIKE '%" + staffID + "%' && (YEAR(expense_payment.paid_date) LIKE '%" + req.query.year + "%' and MONTH(expense_payment.paid_date) LIKE '%" + req.query.month + "%') && (expense_payment.payment_status LIKE '%" + payment_statuss + "%' || expense_payment.payment_status LIKE '%" + payment_status + "%') && purchase_order.vendor_id LIKE '%" + req.query.vendor + "%' && expense_payment.payment_status LIKE '%" + fullypayment_status + "%' && purchase_order.status LIKE '%" + req.query.status_type + "%' && branch_id LIKE '%" + req.query.branch_id + "%') AND (purchase_order.purchase_order_id LIKE '%" + filter + "%' OR expense_payment.total_amount LIKE '%" + filter + "%' OR purchase_order.vendor_name LIKE '%" + filter + "%' )", function(results) {
      numRows = results.length;
      numPages = Math.ceil(numRows / numPerPage);
    })
    // Purchase order and expense payment data receiving
    db.executeQuery("SELECT  purchase_order.purchase_order_id,purchase_order.modifiedID,purchase_order.last_modified,expense_payment.payment_type,purchase_order.due_date,purchase_order.staffID,expense_payment.discount,expense_payment.tax_sgst,expense_payment.tax_cgst,purchase_order.vendor_name,purchase_order.staffID,purchase_order.created_on,purchase_order.DeliveryDate,purchase_order.status  as purchaseStatus,expense_payment.total_amount,expense_payment.received_amount,expense_payment.status,expense_payment.payment_status,expense_payment.paid_date  FROM purchase_order INNER JOIN expense_payment ON purchase_order.purchase_order_id = expense_payment.purchase_order_id WHERE ((expense_payment.status='purchase')  && staffID LIKE '%" + staffID + "%' && (YEAR(expense_payment.paid_date) LIKE '%" + req.query.year + "%' and MONTH(expense_payment.paid_date) LIKE '%" + req.query.month + "%') && (expense_payment.payment_status LIKE '%" + payment_statuss + "%' || expense_payment.payment_status LIKE '%" + payment_status + "%') && purchase_order.vendor_id LIKE '%" + req.query.vendor + "%' && expense_payment.payment_status LIKE '%" + fullypayment_status + "%' && purchase_order.status LIKE '%" + req.query.status_type + "%' && branch_id LIKE '%" + req.query.branch_id + "%') AND (purchase_order.purchase_order_id LIKE '%" + filter + "%' OR expense_payment.total_amount LIKE '%" + filter + "%' OR purchase_order.vendor_name LIKE '%" + filter + "%' ) GROUP BY purchase_order_id DESC", function(results) {
      /*------------------
      Total amount 
      ---------------*/
      var total_purchase = []; //In amount
      // Fully paid data filtered
      results.filter(function(fullData) {
        if (fullData.payment_status == 'fully paid') {
          total_purchase.push(parseInt(fullData.total_amount))
          return fullData
        }
      })
      //calculate sum of total amount it will work array amount data convert to total amount(sum)
      if (total_purchase.length > 0) {
        var total_purchases = total_purchase.reduce(function(a, b) {
          return a + b;
        });
      }
      /*------------------
      Cash fully paid calculation for dropdown filter
      ---------------*/
      var total_cash = []
      results.filter(function(item) {
        if ((item.payment_status == 'fully paid') && item.payment_type == 'cash') {
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
      /*------------------
      Card fully paid calculation for dropdown filter
      ---------------*/
      //filter only  card datas
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
      /*------------------
      Cheque full paid calculation for dropdown filter
      ---------------*/
      //filter only  card datas
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
      /*------------------
      Online payment mode &  full paid for dropdown filter
      ---------------*/
      //filter only  card datas
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
      /*------------------
      Advance payment mode &  cash for dropdown filter
      ---------------*/
      //filter only  card datas
      var advance_cash = []
      results.filter(function(item) {
        if ((item.payment_status == 'advance paid') && item.payment_type == 'cash') {
          advance_cash.push(parseInt(item.received_amount))
          return item
        }
      })
      //calculate sum of cashes
      if (advance_cash.length > 0) {
        var advance_cashs = advance_cash.reduce(function(a, b) {
          return a + b;
        });
      }
      /*------------------
      Advance payment mode &  card for dropdown filter
      ---------------*/
      //filter only  card datas
      var advance_card = []
      results.filter(function(item) {
        if (item.payment_status == 'advance paid' && item.payment_type == 'card') {
          advance_card.push(parseInt(item.received_amount))
          return item
        }
      })
      //calculate sum of cashes
      if (advance_card.length > 0) {
        var advance_cards = advance_card.reduce(function(a, b) {
          return a + b;
        });
      }
      /*------------------
      Advance payment mode &  cheque for dropdown filter
      ---------------*/

      //filter only  card datas
      var advance_cheque = []
      results.filter(function(item) {
        if (item.payment_status == 'advance paid' && item.payment_type == 'cheque') {
          advance_cheque.push(parseInt(item.received_amount))
          return item
        }
      })
      //calculate sum of cashes
      if (advance_cheque.length > 0) {
        var advance_cheques = advance_cheque.reduce(function(a, b) {
          return a + b;
        });
      }
      /*------------------
      Advance payment mode &  Online transcation for dropdown filter
      ---------------*/
      var advance_online = []
      results.filter(function(item) {
        if (item.payment_status == 'advance paid' && item.payment_type == 'onlineTranscation') {
          advance_online.push(parseInt(item.received_amount))
          return item
        }
      })
      //calculate sum of cashes
      if (advance_online.length > 0) {
        var advance_onlines = advance_online.reduce(function(a, b) {
          return a + b;
        });
      }
      /*------------------
      Advance payment mode &  unpaid/ Balance for dropdown filter
      ---------------*/
      //filter only  card datas
      var total_advanceAmount = []
      results.filter(function(item) {
        if (item.payment_status == 'advance paid' || item.payment_status == 'unpaid') {
          total_advanceAmount.push(parseInt(item.total_amount))
          return item
        }
      })
      //calculate sum of cashes
      if (total_advanceAmount.length > 0) {
        var total_advanceAmounts = total_advanceAmount.reduce(function(a, b) {
          return a + b;
        });
      }
      /*------------------
      Advance payment mode &  fully paid for dropdown filter
      ---------------*/

      var paid_count = []
      results.filter(function(item) {
        if (item.payment_status == 'advance paid' || item.payment_status == 'fully paid') {
          paid_count.push(parseInt(item.total_amount))
          return item
        }
      })
      /*------------------
      Total Received amount
      ---------------*/
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
      };
      //assign advance purchse total  amounts in advance or unpaid status
      var total_purchased1 = total_advanceAmounts == undefined ? 0 : total_advanceAmounts;
      //assign fully paid total  amount
      var total_purchased2 = total_purchases == undefined ? 0 : total_purchases;
      //Assign total amount of all status, calculate total((advancepaid+unpaaid) + fullypaid)
      var total = total_purchased1 + total_purchased2;
      //assign advance amount(reveiced) purchase received amount in advance status
      var total_purchased3 = total_advances == undefined ? 0 : total_advances;
      //calculate only Total paid amount(totalamount+receivedamount)
      var total_paid = total_purchased2 + total_purchased3;
      //calculate total balance=(fullypaid+advancepaid+unpaaid)-(totalamount+receivedamount)
      var balance = total - total_paid;
      //store calculated values in to an array
      var responsePayload = [{
        results: results,
        total_purchase: total,
        total_paid: total_paid,
        balance: balance,
        balance_count: total_advance.length,
        paid_count: paid_count.length,
        total_cash: (total_cashs == undefined ? 0 : total_cashs) + (advance_cashs == undefined ? 0 : advance_cashs),
        total_card: (total_cards == undefined ? 0 : total_cards) + (advance_cards == undefined ? 0 : advance_cards),
        total_cheque: (total_cheques == undefined ? 0 : total_cheques) + (advance_cheques == undefined ? 0 : advance_cheques),
        total_online: (total_onlines == undefined ? 0 : total_onlines) + (advance_onlines == undefined ? 0 : advance_onlines),
        purchaseorder_count: numRows

      }];
      //  unknown pagination
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


  // Getting each bill item count

  app.get(apiUrl + '/getpurchase/:staffID', function(req, res) {
    var rmname = db.executeQuery('SELECT purchase_order.staffID,purchase_order.purchase_order_id,purchase_items.rmname  FROM purchase_order INNER JOIN purchase_items ON purchase_order.purchase_order_id = purchase_items.purchase_order_id WHERE staffID = "' + req.params.staffID + '"', function(items) {
      db.executeQuery('SELECT DISTINCT purchase_order.purchase_order_id,purchase_items.total_amount,purchase_order.vendor_name,purchase_order.created_on,purchase_order.staffID,purchase_order.DeliveryDate,purchase_order.status  FROM purchase_order INNER JOIN purchase_items ON purchase_order.purchase_order_id = purchase_items.purchase_order_id WHERE staffID = "' + req.params.staffID + '"', function(results) {
        var purchase_serviceID = results.map(function(item) {

          //filter only items depending on purchaseorder_id for count length of items
          var food_items = []; // empty array for get np of items for count
          items.forEach(function(a) { //count&watch each items
            if (a.staffID == item.staffID && a.purchase_order_id == item.purchase_order_id)
              food_items.push(a.rmname);
          });
          return { 'rmname': food_items.length, 'created_on': item.created_on, 'status': item.status, 'purchase_order_id': item.purchase_order_id, 'vendor_name': item.vendor_name, 'total_amount': item.total_amount, 'DeliveryDate': item.DeliveryDate }
        })
        return res.status(200).send(purchase_serviceID);
      })

    });

  });



  // Get raw material items data from database
  app.get(apiUrl + '/rmstocks', function(req, res) {
    db.executeQuery('SELECT * FROM raw_material_items', function(results) {
      return res.status(200).send(results);
    });
  });
  /*
  --------------------------------------------------
  While delete the purchase order item stock quantity will be reduce
  --------------------------------------------------
  */
  //while delete items in purchase raw material, quantity will be reduced from raw material stock table
  app.put(apiUrl + '/deleteAndupdate_rawmaterial_quantity/:rmItemID/:purchase_items_id', function(req, res) {

    let rmItemID = req.params.rmItemID;
    db.executeQuery('SELECT * FROM purchase_items INNER JOIN purchase_order ON purchase_order.purchase_order_id=purchase_items.purchase_order_id', function(db_inventory_sales_items) {
      // Receiving purchase raw material items
      db.executeQuery('SELECT * FROM raw_material_items', function(results) {
        // filter raw material items in stock table to know the stock difference
        var dbdata = results.filter(function(item) {
          if (rmItemID == item.rmItemID) {
            return item
          }
        })
        // get db stock qty
        var db_stock = dbdata.map(function(dbStockqty) {
          return dbStockqty.stock_quantity
        })
        //compare deleted purchase items id and all purchase item id which get from db and filter out 
        var checkdata = db_inventory_sales_items.filter(function(fullPurchaseItem) {
          if (req.params.purchase_items_id == fullPurchaseItem.purchase_items_id) {
            return fullPurchaseItem
          }
        })
        //while it is delivered purchase then update stock
        if (checkdata[0].status != 'ordered') {
          var stock = [parseInt(db_stock) - (parseInt(req.body.item_quantity) ? parseInt(req.body.item_quantity) : parseInt(checkdata[0].quantity * checkdata[0].containQty))];
          var sql = `UPDATE raw_material_items SET stock_quantity = "${stock<0 ? 0 : stock}" WHERE rmItemID = "${rmItemID}"`;
          db.executeQuery(sql, function(err, rows) {
            res.sendStatus(200);
          });
        } else {
          res.sendStatus(200);
        }
      })
    })
  })
  /*
    --------------------------------------------------
    While delete the purchase order item delete in purchase order item table
    --------------------------------------------------
    */
  //delete purchase raw material items while edit
  app.delete(apiUrl + '/delete_purchase_items/:purchase_items_id', function(req, res) {
    var sql = 'DELETE FROM purchase_items WHERE purchase_items_id = "' + req.params.purchase_items_id + '"';
    db.executeQuery(sql, function(err, rows, fields) {
      res.sendStatus(200);
    });
  });
  /*
    --------------------------------------------------
    Update the stock qty in stock table
    --------------------------------------------------
    */

  //  while edit in purchase  raw material inventory the stock will be increased in raw material items table
  app.put(apiUrl + '/update_rawmaterial_quantity/:rmItemID', function(req, res) {
    let rmItemID = req.params.rmItemID;
    [req.body.editeditems].map(function(editeditems) {
      db.executeQuery('SELECT * FROM purchase_items INNER JOIN purchase_order ON purchase_order.purchase_order_id=purchase_items.purchase_order_id', function(db_inventory_sales_items) {
        // Receiving purchase raw material items
        db.executeQuery('SELECT * FROM raw_material_items', function(db_stock) {
          // filter raw material items in stock table and purchaser order items
          var dbdata = db_inventory_sales_items.filter(function(item) {
            if ((editeditems.purchase_items_id == item.purchase_items_id) && !editeditems.rmname.rmItemID) {
              return item
            }
          })
          //get current  stock of edited items and compare
          var db_stock_data = db_stock.filter(function(dbStockqty) {
            if (rmItemID == dbStockqty.rmItemID) {
              return dbStockqty
            }
          })
          //filter out only db stock quantity 
          var db_stock_dataa = db_stock_data.map(function(item) {
            return item.stock_quantity
          })
          /*------------------------------
          If purchase order item replaced
          -----------------------------*/

          //checking item cancel and replaced (via matched existing item id and newly added(items.rmname.rmItemID it will contain in this model) item id)
          var replaceitemdata = [req.body.editeditems].filter(function(items) {
            if (items.purchase_items_id && items.rmname.rmItemID) {
              return items
            }
          })

          //if replacement item is available means the stock will increased for replacement item
          if (replaceitemdata.length) {
            //compare database salesorder_item data and client side edited data and return only matched 
            var getreplacementitem = db_inventory_sales_items.filter(function(dbPurchaseItem) {
              if ((editeditems.purchase_items_id == dbPurchaseItem.purchase_items_id) && editeditems.rmname.rmItemID) {
                return dbPurchaseItem
              }
            })
            //map and update replacement quantity depending on its quantity
            replaceitemdata.map(function(replacePurchaseItem) {
              var replaceitemquantity = { 'item_quantity': replacePurchaseItem.quantity * replacePurchaseItem.containQty, rmItemID: replacePurchaseItem.rmItemID }
              var replaceitemsiItemID = replaceitemquantity.rmItemID
              // Compare db data (getreplacementitem) and replaced data
              var update_replacement_item = getreplacementitem.filter(function(items) {
                var stock = [parseInt(db_stock_dataa) - parseInt(items.quantity * items.containQty)];
                var sql = `UPDATE raw_material_items SET stock_quantity = "${stock<0 ? 0 : stock}" WHERE rmItemID = "${replaceitemsiItemID}"`;
                db.executeQuery(sql, function(err, rows) {});
              })
            })
          };


          //check old item stock is equal to edited items
          // dbdata means purchase items data
          var check_exist_data = dbdata.filter(function(item) {
            if ((req.body.item_quantity == (item.quantity * item.containQty)) && item.status != 'ordered') {
              res.sendStatus(200);
            }
            // edited item higher  then stock will be increased depening on count
            else if ((req.body.item_quantity > (item.quantity * item.containQty)) && item.status != 'ordered') {
              var stock_difference = parseInt(req.body.item_quantity) - parseInt(item.quantity * item.containQty);
              var stock = [parseInt(db_stock_dataa) + stock_difference];
              var sql = `UPDATE raw_material_items SET stock_quantity = "${stock}" WHERE rmItemID = "${rmItemID}"`;
              db.executeQuery(sql, function(err, rows) {
                res.sendStatus(200);
              });
            }
            // edited item lowered  then stock will be reduced depening on count 
            else if (req.body.item_quantity < (item.quantity * item.containQty) && item.status != 'ordered') {
              var stock_difference = parseInt(item.quantity * item.containQty) - parseInt(req.body.item_quantity);
              var stock = [parseInt(db_stock_dataa) - stock_difference];
              var sql = `UPDATE raw_material_items SET stock_quantity = "${stock<0 ? 0 : stock}" WHERE rmItemID = "${rmItemID}"`;
              db.executeQuery(sql, function(err, rows) {
                res.sendStatus(200);
              });
            }
            //if status change from ordered to delivery this condition will execute
            else if (item.status == 'ordered') {
              db.executeQuery('SELECT * FROM raw_material_items', function(results) {
                //get all raw material items
                var dbdata = results.filter(function(item) {
                  if (rmItemID == item.rmItemID) {
                    return item
                  }
                })
                //get only all rm item of stocks
                var db_stock = dbdata.map(function(item) {
                  return item.stock_quantity
                })
                //this is post method only here perform just increase stock and update it
                var stock = [parseInt(db_stock) + parseInt(req.body.item_quantity)];
                var sql = `UPDATE raw_material_items SET stock_quantity = "${stock}" WHERE rmItemID = "${rmItemID}"`;
                db.executeQuery(sql, function(err, rows) {
                  res.sendStatus(200);
                });
              })
            }
          })
        })
      })
    })
  })
  /*
    --------------------------------------------------
    Add the stock qty in stock table
    --------------------------------------------------
    */
  //  while post in purchase  raw material inventory the stock will be increased in raw material items table
  app.put(apiUrl + '/updatequantity/:rmItemID', function(req, res) {
    let rmItemID = req.params.rmItemID;
    db.executeQuery('SELECT * FROM raw_material_items', function(results) {
      //get all raw material items
      var rmitems = results.filter(function(item) {
        if (rmItemID == item.rmItemID) {
          return item
        }
      })
      //get only all rm item of stocks
      var db_stock = rmitems.map(function(item) {
        return item.stock_quantity
      })
      //this is post method only here perform increase stock and update it
      var stock = [parseInt(db_stock) + parseInt(req.body.item_quantity)];
      var sql = `UPDATE raw_material_items SET stock_quantity = "${stock}" WHERE rmItemID = "${rmItemID}"`;
      db.executeQuery(sql, function(err, rows) {
        res.sendStatus(200);
      });
    })
  });
  /*------------------
  Purchase order data update service
  ------------------*/
  // update purchase raw material data to purchase order table
  app.put(apiUrl + '/update_purchase_orders/:purchase_order_id', function(req, res) {
    let purchase_order_id = req.params.purchase_order_id;
    var sql = `UPDATE purchase_order SET  vendor_name = "${req.body[0].vendor_name}",vendor_id = "${req.body[0].vendor_id}",due_date = "${req.body[0].due_date}",DeliveryDate = "${req.body[0].DeliveryDate}",Description = "${req.body[0].Description}",status = "${req.body[0].status}",modifiedID = "${req.body[0].modifiedID}" WHERE purchase_order_id = "${purchase_order_id}"`;
    db.executeQuery(sql, function(err, rows) {
      res.sendStatus(200);
    });
  });
  /*------------------
  Purchase order items added and edited service (Edit action)
  ------------------*/
  // update purchase raw material data to purchase items table
  app.put(apiUrl + '/update_purchase_items/:purchase_order_id', function(req, res) {
    let purchase_order_id = req.params.purchase_order_id;

    //filter out if added new data in edit scenario
    var editadditem = req.body.filter(function(addednewitem) {
      if (!addednewitem.purchase_items_id) {
        return addednewitem
      }
    })
    //filter out existing db data for what changes his done
    var editdbitem = req.body.filter(function(getExistingitem) {
      if (getExistingitem.purchase_items_id) {
        return getExistingitem
      }
    })
    // update item with have purchase item id during edit
    for (var i = 0; i < editdbitem.length; i++) {
      // if items is replaced will receive this model (editdbitem[i].rmname.rmname) or edited qty/rate will receive this model (editdbitem[i].rmname) 
      var rmname = editdbitem[i].rmname.rmItemID ? editdbitem[i].rmname.rmname : editdbitem[i].rmname
      var rmCatergoryID = editdbitem[i].rmname.rmCatergoryID ? editdbitem[i].rmname.rmCatergoryID : editdbitem[i].rmCatergoryID
      var rmItemID = editdbitem[i].rmname.rmItemID ? editdbitem[i].rmname.rmItemID : editdbitem[i].rmItemID
      var containQty = editdbitem[i].rmname.rmItemID ? editdbitem[i].rmname.containQty : editdbitem[i].containQty

      var sql = `UPDATE  purchase_items SET rmCatergoryID  = "${rmCatergoryID}",rmname = "${rmname}",containQty="${containQty}",rmItemID = "${rmItemID}",quantity = "${editdbitem[i].quantity}",expiry_date = "${editdbitem[i].expiry_date}",rmrate = "${editdbitem[i].rmrate}",item_subtotal = "${req.body[0].item_subtotal}" WHERE purchase_items_id = "${editdbitem[i].purchase_items_id}"`;
      db.executeQuery(sql, function(err, rows) {

      });
    }

    // add item without have purchase item id during edit
    if (editadditem.length > 0) {
      var items = editadditem.map(function(item) {
        return [item.rmname.rmCatergoryID, item.rmname.rmItemID, item.searchText, item.expiry_date, item.quantity, item.containQty, item.rmrate, item.item_subtotal, purchase_order_id]
      });
      var sql = "INSERT INTO purchase_items (rmCatergoryID,rmItemID,rmname,expiry_date,quantity,containQty,rmrate,item_subtotal,purchase_order_id)  VALUES ? ";
      db.executeQuery1(sql, [items], function(results) {

      });
    }
    res.sendStatus(200);
  });



   /*-------------------------------------------
   =============================================

    DELIVERY TO KITCHEN

  ===============================================
    -------------------------------------------*/


  //post delivery kitchen data items to database
  app.post(apiUrl + '/rmitemdatas', function(req, res) {
    var data = req.body;

    var items = data.map(function(item) {
      return [item.rmname, item.unit, item.rmItemID, item.quantity, item.reason, item.staffID, item.modifiedID, item.branch_id]
    })

    var sql = "INSERT INTO deliveryto_kitchen (rmname,unit,rmItemID,quantity,reason,staffID,modifiedID,branch_id)  VALUES ? ";
    db.executeQuery1(sql, [items], function(results) {
      return res.status(200).send(results);
    });
  });

  // Get delivery kitchen data
  app.get(apiUrl + '/getkitchendata_service', function(req, res, next) {
    var data = req.query; ///get data from client side through send query
    var filter = req.query.filter;
    var numRows;
    var queryPagination;
    var numPerPage = parseInt(req.query.limit, 10) || 1;
    var page = req.query.page == undefined ? 1 : req.query.page
    var numPages;
    var doordelivery;
    var skip = page * numPerPage

    // Here we compute the LIMIT parameter for MySQL query
    var limit = skip - numPerPage + ',' + parseInt(skip + numPerPage);
    // get page no and rows count for pagination
    db.executeQuery("SELECT  rmname,quantity,reason,staffID,delivered_date FROM deliveryto_kitchen  WHERE (staffID LIKE '%" + req.query.staffID + "%' && branch_id LIKE '%" + req.query.branch_id + "%')  And (rmname LIKE '%" + filter + "%' or reason LIKE '%" + filter + "%'  or delivered_date LIKE '%" + filter + "%')", function(results) {
      numRows = results.length;
      numPages = Math.ceil(numRows / numPerPage);
    })
    //view query to update table
    db.executeQuery("SELECT deliveryto_kitchen_id,rmname,rmItemID,unit,quantity,reason,staffID,modifiedID,last_modified,delivered_date FROM deliveryto_kitchen  WHERE ( staffID LIKE '%" + req.query.staffID + "%' && branch_id LIKE '%" + req.query.branch_id + "%')  And (rmname LIKE '%" + filter + "%' or reason LIKE '%" + filter + "%'  or delivered_date LIKE '%" + filter + "%') ORDER BY deliveryto_kitchen_id DESC LIMIT  " + limit, function(results) {
      var responsePayload = [{
        results: results,
        purchaseorder_count: numRows

      }];
      //  var responsePayload=results
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


  //  Update deliveryto_kitchen with id
  app.put(apiUrl + '/editkitchendata/:deliveryto_kitchen_id', function(req, res) {
    let deliveryto_kitchen_id = req.params.deliveryto_kitchen_id;
    let rmname = req.body[0].rmname.rmname ? req.body[0].rmname.rmname : req.body[0].rmname;
    let unit = req.body[0].rmname.unit ? req.body[0].rmname.unit : req.body[0].unit;
    let rmItemID = req.body[0].rmname.rmItemID ? req.body[0].rmname.rmItemID : req.body[0].rmItemID;
    let quantity = req.body[0].quantity;
    let reason = req.body[0].reason;
    let modifiedID = req.body[0].modifiedID;
    //var sql = "UPDATE table_no SET table_nos = ? WHERE table_id = ?";
    var sql = `UPDATE deliveryto_kitchen SET  rmname = "${rmname}",unit = "${unit}", rmItemID = "${rmItemID}",quantity = "${quantity}",reason = "${reason}",modifiedID = "${modifiedID}" WHERE deliveryto_kitchen_id = "${deliveryto_kitchen_id}"`;
    db.executeQuery(sql, function(err, rows) {
      res.sendStatus(200);
    });

  });
  /*--------------------------
  While click on delete update qty in stock table
  --------------------------*/

  //delete kitchen data
  app.put(apiUrl + '/deleteAndupdate_delivery_quantity/:rmItemID/:deliveryto_kitchen_id', function(req, res) {

    let rmItemID = req.params.rmItemID;
    db.executeQuery('SELECT * FROM deliveryto_kitchen', function(db_inventory_sales_items) {

      db.executeQuery('SELECT * FROM raw_material_items', function(results) {
        //filter raw material items and database raw material items in stock table
        var dbdata = results.filter(function(item) {
          if (rmItemID == item.rmItemID) {
            return item
          }

        })
        // store stock
        var db_stock = dbdata.map(function(item) {
          return item.stock_quantity
        })
        //checking whether edited item stock is qual to old stock
        var matchedID = db_inventory_sales_items.filter(function(item) {
          if (req.params.deliveryto_kitchen_id == item.deliveryto_kitchen_id) {
            return item
          }
        })
        //while it is delivered purchase then update stock
        if (matchedID) {
          var stock = [parseInt(db_stock) + parseInt(req.body.item_quantity)];
          var sql = `UPDATE raw_material_items SET stock_quantity = "${stock}" WHERE rmItemID = "${rmItemID}"`;
          db.executeQuery(sql, function(err, rows) {
            res.sendStatus(200);
          });
        } else {
          res.sendStatus(200);
        }
      })
    })
  })

  // Delete deliver to kitchen id
  //----------------
  app.delete(apiUrl + '/editkitchendata/:deliveryto_kitchen_id', function(req, res) {
    var sql = 'DELETE FROM deliveryto_kitchen WHERE deliveryto_kitchen_id = "' + req.params.deliveryto_kitchen_id + '"';
    db.executeQuery(sql, function(err, rows, fields) {
      res.sendStatus(200);
    });
  });

  /*--------------------------
  While edit items qty will qty in stock table
  --------------------------*/
  app.put(apiUrl + '/updatedeliveryeditquantity/:rmItemID', function(req, res) {

    let rmItemID = req.params.rmItemID;
    req.body.editeditems.map(function(db_editeditems) {
      db.executeQuery('SELECT * FROM deliveryto_kitchen', function(db_inventory_sales_items) {
        // full data of delivery kitchen
        db.executeQuery('SELECT * FROM raw_material_items', function(db_stock) {
          //get delivery kitchen data and match current edited items and filter out
          var dbdata = db_inventory_sales_items.filter(function(dbDelKitItem) {
            if (db_editeditems.deliveryto_kitchen_id == dbDelKitItem.deliveryto_kitchen_id) {
              return dbDelKitItem
            }
          })
          //get current  stock of edited items and compare
          var db_stock_data = db_stock.filter(function(item) {
            if (rmItemID == item.rmItemID) {
              return item
            }
          })
          //filter out only db stock quantity 
          var db_stock_dataa = db_stock_data.map(function(item) {
            return item.stock_quantity
          })
          //check old item stock is equal to edited items
          // dbdata means purchase items data
          var check_exist_data = dbdata.filter(function(item) {
            if (req.body.item_quantity == item.quantity) {
              res.sendStatus(200);
            }
            // edited item higher  then stock will be reduced depening on count
            else if (req.body.item_quantity > item.quantity) {
              var stock_difference = parseInt(req.body.item_quantity) - parseInt(item.quantity);
              var stock = [parseInt(db_stock_dataa) - stock_difference];
              var sql = `UPDATE raw_material_items SET stock_quantity = "${stock<0 ? 0 : stock}" WHERE rmItemID = "${rmItemID}"`;
              db.executeQuery(sql, function(err, rows) {
                res.sendStatus(200);
              });
            } // edited item lowered  then stock will be increased depening on count 
            else if (req.body.item_quantity < item.quantity) {
              var stock_difference = parseInt(item.quantity) - parseInt(req.body.item_quantity);
              var stock = [parseInt(db_stock_dataa) + stock_difference];
              var sql = `UPDATE raw_material_items SET stock_quantity = "${stock}" WHERE rmItemID = "${rmItemID}"`;
              db.executeQuery(sql, function(err, rows) {
                res.sendStatus(200);
              });
            }
          })
        })
      })
    })
  })

  /*--------------------------
  While add items & qty in deliver kitchen qty will reduce in stock table
  --------------------------*/

  //  Update raw material quantity while add from delivery kitchen

  app.put(apiUrl + '/updatedeliveryquantity/:rmItemID', function(req, res) {
    let rmItemID = req.params.rmItemID;
    db.executeQuery('SELECT * FROM raw_material_items', function(results) {
      //get all raw material items
      var rmitems = results.filter(function(item) {
        if (rmItemID == item.rmItemID) {
          return item
        }

      })
      //get only all rm item of stocks
      var db_stock = rmitems.map(function(item) {
        return item.stock_quantity
      })
      //this is post method only here perform reduce stock and update it
      var stock = [db_stock - req.body.item_quantity];
      var stocks = stock < 0 ? 0 : stock
      var sql = `UPDATE raw_material_items SET stock_quantity = "${stocks}" WHERE rmItemID = "${rmItemID}"`;
      db.executeQuery(sql, function(err, rows) {
        res.sendStatus(200);
      });
    })
  });



  /*-------------------------------------------
   =============================================

    STOCK OF RAW MATERIAL

  ===============================================
    -------------------------------------------*/

  //----------------
  // Get  raw material purchase items data for inventory
  app.get(apiUrl + '/rmstock', function(req, res) {
      db.executeQuery('SELECT purchase_items.purchase_order_id,purchase_items.rmCatergoryID,purchase_items.rmrate,purchase_items.rmname,purchase_order.status,purchase_items.quantity FROM purchase_order INNER JOIN purchase_items ON purchase_order.purchase_order_id = purchase_items.purchase_order_id ', function(results) {

      return res.status(200).send(results);
    });
  });

  // Get raw material categories from database
  app.get(apiUrl + '/rmcategorydata', function(req, res) {
      db.executeQuery('SELECT * FROM raw_material_catergorys', function(results) {
      return res.status(200).send(results);
    });
  });


  /*-------------------------------------------
   =============================================

    STOCK OF SALE MATERIAL

  ===============================================
    -------------------------------------------*/

//----------------
  // Get  raw material purchase items data for inventory
  app.get(apiUrl + '/rmstock', function(req, res) {
    db.executeQuery('SELECT purchase_items.purchase_order_id,purchase_items.rmCatergoryID,purchase_items.rmrate,purchase_items.rmname,purchase_order.status,purchase_items.quantity FROM purchase_order INNER JOIN purchase_items ON purchase_order.purchase_order_id = purchase_items.purchase_order_id ', function(results) {
      return res.status(200).send(results);
    });
  });

// Get  sale material purchase items data for inventory
  app.get(apiUrl + '/smstock', function(req, res) {
    db.executeQuery('SELECT inventory_sales_items.inventory_salesOrder_id,inventory_sales_items.smCatergoryID,inventory_sales_items.smrate,inventory_sales_items.smname,inventory_sales_order.status,inventory_sales_items.quantity FROM inventory_sales_order INNER JOIN inventory_sales_items ON inventory_sales_order.inventory_salesOrder_id = inventory_sales_items.inventory_salesItems_id ', function(results) {
      return res.status(200).send(results);
    });
  });

  // Get raw material categories
  app.get(apiUrl + '/rmcategorydata', function(req, res) {
    db.executeQuery('SELECT * FROM raw_material_catergorys', function(results) {
      return res.status(200).send(results);
    });
  });

  // Get sale material categories
  app.get(apiUrl + '/smcategorydata', function(req, res) {
    db.executeQuery('SELECT * FROM sale_material_catergorys', function(results) {
      return res.status(200).send(results);
    });
  });


}
