var DB = require('../../dbQueries')
var db = new DB();
var apiUrl = "/api"
var bodyParser = require('body-parser');

/*-------------------------------------------

LIST

- NEW BILL
- CURRENT BILL
- PAID BILL
- CURRENT ODC
- PAID ODC

 -----------------------------------------*/

module.exports = function(app) {

   /*-------------------------------------------
   =============================================

    NEW BILL

  ===============================================
    -------------------------------------------*/

  //post salesorder data
  app.post(apiUrl + '/salesorder', function(req, res) {
    let data = req.body;
    var sql = "INSERT INTO sales_order SET ?";
    db.executeQuery1(sql, data, function(results) {
      return res.status(200).send(results);
    });

  });


  //post new customer data to customr table
  app.post(apiUrl + '/save_customer', function(req, res) {
    let data = req.body[0];
    // customer_mobile checking
    db.executeQuery1('SELECT * FROM customer_info  WHERE customer_mobile = ? And branch_id = ?', [req.body[0].customer_mobile,req.body[0].branch_id], function(results, fields, error) {
      // Results length is there customer_mobile already exists
      if (results.length != 0) {
        return res.send({
          "code": 204,
          "success": "Email already exists try another one!"
        });
      }
      // Results length =0 is there username already
      else if (results.length == 0) {
        var sql = "INSERT INTO customer_info SET ?";
        db.executeQuery1(sql, data, function(results) {
          return res.status(200).send(results);
        });
      }
    })

  });

  //post saleitems data to database
  app.post(apiUrl + '/saleitems', function(req, res) {
    var data = req.body;
    console.log(data);
    var salesorder_id = req.body.salesorder_id;
    var items = data.itemdata.map(function(item) {
      return [item.item, item.qty, item.itemprice, item.itemsubtotal, item.offerprice, item.tax_cgst, item.tax_sgst, item.tax_status, item.actualprice, item.profit_difference, item.fmItemType, item.fmItemID, item.fmCatergoryID, salesorder_id]
    });


    var sql = "INSERT INTO salesorder_item (sales_items,sales_quantity,salesitem_rate,item_subrate,offerprice,tax_cgst,tax_sgst,tax_status,actualprice,profit_difference,fmItemType,fmItemID,fmCatergoryID,salesorder_id)  VALUES ? ";
    db.executeQuery1(sql, [items], function(results) {
      return res.status(200).send(results);

    });
  });


  //post salespayment to database
  app.post(apiUrl + '/salespayment', function(req, res) {
    let data = req.body;
    var sql = "INSERT INTO sales_payment SET ?";
    db.executeQuery1(sql, data, function(results) {
      return res.status(200).send(results);
    });
  });

  //post salesfeedback to database
  app.post(apiUrl + '/salesfeedback', function(req, res) {
    let data = req.body;
    var sql = "INSERT INTO sales_feedback SET ?";
    db.executeQuery1(sql, data, function(results) {
      return res.status(200).send(results);
    });
  });


  // Get staffRole for manageby in newbill
  app.get(apiUrl + '/staffRole', function(req, res) {
    db.executeQuery('SELECT * FROM staff', function(results) {
      return res.status(200).send(results);
    });
  });

  // Get staffRole for manageby in newbill
  app.get(apiUrl + '/sales_order_data', function(req, res) {
    db.executeQuery('SELECT * FROM sales_order', function(results) {
      return res.status(200).send(results);
    });
  });

  // Get staffRole for manageby in newbill
  app.get(apiUrl + '/fmitem_sale', function(req, res) {
    db.executeQuery('SELECT * FROM food_menu_items WHERE status_flag=1', function(food) {
      db.executeQuery('SELECT * FROM sale_material_items WHERE status_flag=1', function(sale) {
        var sale_items = sale.map(function(food) {
          return { 'fmItemName': food.siname, 'type': 'sales', 'fmItemPrice': food.sirate, 'offerprice': food.offerprice,'dealer_price': food.dealer_price, 'tax_sgst': food.tax_sgst, 'tax_cgst': food.tax_cgst, 'tax_status': food.tax_status, 'fmItemID': food.siItemID, 'fmCatergoryID': food.siCatergoryID, 'fmItemQty': food.stock_quantity, 'branch_id': food.branch_id, 'barcode': food.barcode, 'PurchasePrice' : food.PurchasePrice,  'containQty' : food.containQty}
        })
        var food_items = food.map(function(food) {
          return { 'fmItemName': food.fmItemName, 'fmItemType': food.fmItemType, 'offerprice': food.offerprice,'dealer_price': food.dealer_price,'type': 'food', 'fmItemPrice': food.fmItemPrice, 'tax_sgst': food.tax_sgst, 'tax_cgst': food.tax_cgst, 'tax_status': food.tax_status, 'fmItemID': food.fmItemID, 'fmCatergoryID': food.fmCatergoryID, 'fmItemQty': food.fmItemQty, 'branch_id': food.branch_id}
        })
        var food_data = sale_items.concat(food_items);
        return res.status(200).send(food_data);
      });
    })
  });

  // Get staffRole for manageby in newbill
  app.get(apiUrl + '/fmitem_sale/:branch_id', function(req, res) {
    db.executeQuery('SELECT * FROM food_menu_items WHERE (status_flag=1) AND (branch_id="' + req.params.branch_id + '")', function(food) {
      db.executeQuery('SELECT * FROM sale_material_items WHERE (status_flag=1) AND (branch_id="' + req.params.branch_id + '")', function(sale) {
        var sale_items = sale.map(function(food) {
          return { 'fmItemName': food.siname, 'type': 'sales', 'fmItemPrice': food.sirate, 'offerprice': food.offerprice,'dealer_price': food.dealer_price, 'tax_sgst': food.tax_sgst, 'tax_cgst': food.tax_cgst, 'tax_status': food.tax_status, 'fmItemID': food.siItemID, 'fmCatergoryID': food.siCatergoryID, 'fmItemQty': food.stock_quantity, 'branch_id': food.branch_id, 'barcode': food.barcode }
        })
        var food_items = food.map(function(food) {
          return { 'fmItemName': food.fmItemName, 'fmItemType': food.fmItemType, 'offerprice': food.offerprice,'dealer_price': food.dealer_price,'type': 'food', 'fmItemPrice': food.fmItemPrice, 'tax_sgst': food.tax_sgst, 'tax_cgst': food.tax_cgst, 'tax_status': food.tax_status, 'fmItemID': food.fmItemID, 'fmCatergoryID': food.fmCatergoryID, 'fmItemQty': food.fmItemQty, 'branch_id': food.branch_id }
        })
        var food_data = sale_items.concat(food_items);
        return res.status(200).send(food_data);
        console.log(food_data);
      });
    })
  });

  //while delete items in new bill the quantity will be raised in sale material table
  app.put(apiUrl + '/deleteAndupdate_newbill_quantity/:siItemID/:salesitem_id', function(req, res) {
    let siItemID = req.params.siItemID;
    // Multi delete condition checking. In paid bills have option to delete multi items.
    if (req.params.salesitem_id != 'multidelete') {
      // Single delete via edit bill
        db.executeQuery('SELECT * FROM salesorder_item INNER JOIN sales_order ON sales_order.salesorder_id=salesorder_item.salesorder_id', function(db_inventory_sales_items) {
            db.executeQuery('SELECT * FROM sale_material_items', function(results) {

                var dbdata = results.filter(function(item) {
                    if (siItemID == item.siItemID) {
                        return item
                    }
                })
                var db_stock = dbdata.map(function(item) {
                    return item.stock_quantity
                })

                var checkquantity = db_inventory_sales_items.filter(function(item) {
                    if (req.params.salesitem_id == item.salesitem_id) {
                        return item
                    }
                })
                var stock = [parseInt(db_stock) + (parseInt(req.body.item_quantity) ? parseInt(req.body.item_quantity) : parseInt(checkquantity[0].sales_quantity))];
                var sql = `UPDATE sale_material_items SET stock_quantity = "${stock}" WHERE siItemID = "${siItemID}"`;
                db.executeQuery(sql, function(err, rows) {
                    res.sendStatus(200);
                });
            })
        })
    } else {
      // Multi stock update via paid bills
        req.body.map(function(localitem) {
            db.executeQuery('SELECT * FROM sale_material_items', function(results) {
                var dbdata = results.filter(function(item) {
                    if (localitem.fmItemID == item.siItemID) {
                        return item
                    }
                })
                var db_stock = dbdata.map(function(item) {
                    return item.stock_quantity
                })
                var stock = [parseInt(db_stock) + (parseInt(localitem.item_quantity))];
                var sql = `UPDATE sale_material_items SET stock_quantity = "${stock}" WHERE siItemID = "${localitem.fmItemID}"`;
                db.executeQuery(sql, function(err, rows) {});
            });


        });


    }
})


  //while edit items in new bill the quantity will be raised or reduced depending on old quantity in sale material table

  app.put(apiUrl + '/update_newbill_quantity/:siItemID', function(req, res) {
    let siItemID = req.params.siItemID;
    req.body.editeditems.map(function(editeditems) {
      db.executeQuery('SELECT * FROM salesorder_item INNER JOIN sales_order ON sales_order.salesorder_id=salesorder_item.salesorder_id', function(db_inventory_sales_items) { // console.log(results)
        db.executeQuery('SELECT * FROM sale_material_items', function(db_stock) {

          //compare database salesorder_item data and client side edited data and return only matched 
          var dbdata = db_inventory_sales_items.filter(function(item) {
            if ((editeditems.salesitem_id == item.salesitem_id) && !editeditems.sales_items.fmItemID) {
              return item
            }
          })

          var replaceitemdata = req.body.editeditems.filter(function(items) {
            if (items.salesitem_id && items.sales_items.fmItemID) {
              return items
            }
          })

          //compare database sale_material_items data and client side edited data and return only matched 
          var db_stock_data = db_stock.filter(function(item) {
            if (siItemID == item.siItemID) {
              return item
            }
          })

          //filter only matched items of stock datas for update purpuse
          var db_stock_dataa = db_stock_data.map(function(item) {
            return item.stock_quantity
          })

          //if replacement item is available means the stock will increased for replacement item
          if (replaceitemdata.length) {
            //compare database salesorder_item data and client side edited data and return only matched 
            var getreplacementitem = db_inventory_sales_items.filter(function(item) {
              if ((editeditems.salesitem_id == item.salesitem_id) && editeditems.sales_items.fmItemID) {
                return item
              }
            })
            replaceitemdata.map(function(item) {
              var replaceitemquantity = { 'item_quantity': item.sales_quantity, siItemID: item.fmItemID }
              var replaceitemsiItemID = replaceitemquantity.siItemID
              var update_replacement_item = getreplacementitem.filter(function(items) {
                var stock = [parseInt(db_stock_dataa) + parseInt(items.sales_quantity)];
                var sql = `UPDATE sale_material_items SET stock_quantity = "${stock}" WHERE siItemID = "${replaceitemsiItemID}"`;
                db.executeQuery(sql, function(err, rows) {});
              })
            })
          }

          var check_exist_data = dbdata.filter(function(item) {
            if (req.body.item_quantity == item.sales_quantity) {
              res.sendStatus(200);
            } else if (req.body.item_quantity > item.sales_quantity) {
              var stock_difference = parseInt(req.body.item_quantity) - parseInt(item.sales_quantity);
              var stock = [parseInt(db_stock_dataa) - stock_difference];
              var sql = `UPDATE sale_material_items SET stock_quantity = "${stock<0 ? 0 : stock}" WHERE siItemID = "${siItemID}"`;
              db.executeQuery(sql, function(err, rows) {
                res.sendStatus(200);
              });
            } else if (req.body.item_quantity < item.sales_quantity) {
              var stock_difference = parseInt(item.sales_quantity) - parseInt(req.body.item_quantity);
              var stock = [parseInt(db_stock_dataa) + stock_difference];
              var sql = `UPDATE sale_material_items SET stock_quantity = "${stock}" WHERE siItemID = "${siItemID}"`;
              db.executeQuery(sql, function(err, rows) {
                res.sendStatus(200);
              });
            }
          })
        })
      })
    })
  })


  //while post items in new bill the quantity will be  reduced  in sale material table
  app.put(apiUrl + '/update_billquantity/:fmItemID', function(req, res) {

    let fmItemID = req.params.fmItemID;
    db.executeQuery('SELECT * FROM sale_material_items', function(sales) {
      var sales_data = []
      sales.filter(function(item) {
        [req.body].filter(function(food) {
          if (food.fmItemID == item.siItemID && food.type == 'sales') {
            sales_data.push({ 'siItemID': item.siItemID, 'sale_quantity': item.stock_quantity - food.item_quantity < 0 ? 0 : item.stock_quantity - food.item_quantity })
          }
        })
        return item
      })

      for (i = 0; i < sales_data.length; i++) {
        var sql = `UPDATE sale_material_items SET stock_quantity = "${sales_data[i].sale_quantity}" WHERE siItemID = "${sales_data[i].siItemID}"`;
        db.executeQuery(sql, function(err, rows) {});
      }

    })
    res.sendStatus(200);
  });


  //update sales order data 
  app.put(apiUrl + '/updatesalesorder/:salesorder_id', function(req, res) {
    let salesorder_id = req.params.salesorder_id;
    var sql = `UPDATE sales_order SET tableitem = "${req.body[0].tableitem}",thirdparty_orderno = "${req.body[0].thirdparty_orderno}",thirdparty_id = "${req.body[0].thirdparty_id}",thirdparty_name = "${req.body[0].thirdparty_name}",status = "${req.body[0].status}",customer_id = "${req.body[0].customer_id}",sales_dietType = "${req.body[0].sales_dietType}",sales_deliveryStatus = "${req.body[0].sales_deliveryStatus}",sales_deliveryTime = "${req.body[0].sales_deliveryTime}",sales_deliveryDate = "${req.body[0].sales_deliveryDate}",manageBy = "${req.body[0].manageBy}",orderTakenID = "${req.body[0].orderTakenID}",modifiedID = "${req.body[0].modifiedID}" WHERE salesorder_id = "${salesorder_id}"`;
    db.executeQuery(sql, function(err, rows) {
      res.sendStatus(200);
    });
  });


  // update sales_payment data
  app.put(apiUrl + '/editsalespayment/:salesorder_id', function(req, res) {
    let salesorder_id = req.params.salesorder_id;
    var sql = `UPDATE sales_payment SET payment_mode = "${req.body[0].payment_mode}",online_type = "${req.body[0].online_type}",tax_rate = "${req.body[0].tax_rate}",pointdiscount = "${req.body[0].pointdiscount}",paid_date = "${req.body[0].paid_date}",tax_sgst = "${req.body[0].tax_sgst}",discount = "${req.body[0].discount}",additional_charge = "${req.body[0].additional_charge}",discount_type = "${req.body[0].discount_type}",payment_status = "${req.body[0].payment_status}",payment_received = "${req.body[0].payment_received}",payment_transferred = "${req.body[0].payment_transferred}",transcation_no = "${req.body[0].transcation_no}",cheque_no = "${req.body[0].cheque_no}",payment_total = "${req.body[0].payment_total}",unpaid_reason = "${req.body[0].unpaid_reason}",unpaid_description = "${req.body[0].unpaid_description}" WHERE salesorder_id = "${salesorder_id}"`;
    db.executeQuery(sql, function(err, rows) {
      res.sendStatus(200);
    });

  });

  // update sales_customer data
  app.put(apiUrl + '/update_customer/:customer_id', function(req, res) {
    // customer_mobile checking
    db.executeQuery1('SELECT * FROM customer_info  WHERE customer_mobile = ? And branch_id = ?', [req.body.customer_mobile,req.body.branch_id], function(results, fields, error) {
      db.executeQuery('SELECT * FROM customer_info WHERE customer_id = "' + req.params.customer_id + '"', function(fullcustomer) {

        // Results length is there customer_mobile already exists
        if (results.length != 0 && fullcustomer[0].customer_mobile != req.body.customer_mobile) {
          return res.send({
            "code": 204,
            "data": "customer_mobile already exists try another one!"
          });
        }
        // Results length =0 is there username already
        else if (results.length == 0 || fullcustomer[0].customer_mobile == req.body.customer_mobile) {
          let customer_id = req.params.customer_id;
          var sql = `UPDATE customer_info  SET customer_name = "${req.body.customer_name}",localityID = "${req.body.localityID}",customer_email = "${req.body.customer_email==undefined ? '' : req.body.customer_email}",customer_mobile = "${req.body.customer_mobile}",customer_address = "${req.body.customer_address==undefined ? '' : req.body.customer_address}",customer_locality = "${req.body.customer_locality}", whatsapp = "${req.body.whatsapp}",customer_city = "${req.body.customer_city==undefined ? '' : req.body.customer_city}" WHERE customer_id = "${customer_id}"`;
          db.executeQuery(sql, function(err, rows) {
            res.sendStatus(200);
          });
        }
      })
    })
  });
  // update customer_feedback data
  app.put(apiUrl + '/editcustomer_feedback/:salesorder_id', function(req, res) {
    let salesorder_id = req.params.salesorder_id;
    var sql = `UPDATE sales_feedback  SET feedback_service = "${req.body.feedback_service}",feedback_staff = "${req.body.feedback_staff}",feedback_food = "${req.body.feedback_food}",feedback_money = "${req.body.feedback_money}",feedback_reason = "${req.body.feedback_reason}" WHERE salesorder_id = "${salesorder_id}"`;
    db.executeQuery(sql, function(err, rows) {
      res.sendStatus(200);
    });

  });


  //update sales item data
  app.put(apiUrl + '/dietitems/:salesorder_id', function(req, res) {
    let salesorder_id = req.params.salesorder_id;
    var editadditem = req.body.filter(function(o) {
      if (!o.salesitem_id) {
        return o
      }
    })

    var editdbitem = req.body.filter(function(a) {
      if (a.salesitem_id) {
        return a
      }
    })

    //update sales_items 
    for (var i = 0; i < editdbitem.length; i++) {
      var fmItemID = editdbitem[i].sales_items.fmItemID ? editdbitem[i].sales_items.fmItemID : editdbitem[i].fmItemID
      var fmItemType = editdbitem[i].sales_items.fmItemType ? editdbitem[i].sales_items.fmItemType : editdbitem[i].fmItemType
      var fmCatergoryID = editdbitem[i].sales_items.fmCatergoryID ? editdbitem[i].sales_items.fmCatergoryID : editdbitem[i].fmCatergoryID
      var tax_status = editdbitem[i].sales_items.tax_status ? editdbitem[i].sales_items.tax_status : editdbitem[i].tax_status
      var sql = `UPDATE salesorder_item SET sales_items = "${editdbitem[i].searchText}",sales_quantity = "${editdbitem[i].sales_quantity}",tax_cgst = "${editdbitem[i].tax_cgst}",tax_sgst = "${editdbitem[i].tax_sgst}",tax_status = "${tax_status}",salesitem_rate = "${editdbitem[i].salesitem_rate}",offerprice = "${editdbitem[i].offerprice}",actualprice = "${editdbitem[i].actualprice}",item_subrate = "${editdbitem[i].subitemtotal}",fmItemType = "${fmItemType}",fmItemID = "${fmItemID}",fmCatergoryID = "${fmCatergoryID}"  WHERE salesitem_id = "${editdbitem[i].salesitem_id}"`;
      db.executeQuery(sql, function(err, rows) {});
    }

    if (editadditem.length > 0) {
      //post newly added item
      var items = editadditem.map(function(item) {
        return [item.searchText, item.sales_quantity, item.tax_cgst, item.tax_sgst, item.sales_items.tax_status, item.salesitem_rate, item.offerprice, item.actualprice, item.subitemtotal, item.sales_items.fmItemType, item.sales_items.fmItemID, item.sales_items.fmCatergoryID, salesorder_id]
      });
      var sql = "INSERT INTO salesorder_item (sales_items,sales_quantity,tax_cgst,tax_sgst,tax_status,salesitem_rate,offerprice,actualprice,item_subrate,fmItemType,fmItemID,fmCatergoryID,salesorder_id)  VALUES ? ";
      db.executeQuery1(sql, [items], function(results) {

      });
    }
    return res.sendStatus(200);

  });


  //delete sales_items with id
  app.delete(apiUrl + '/deleteodcsales_items/:salesitem_id', function(req, res) {
    var sql = 'DELETE FROM odc_salesorderitem WHERE odc_salesorderitem_id = "' + req.params.salesitem_id + '"';
    db.executeQuery(sql, function(err, rows, fields) {
      res.sendStatus(200);
    });
  });

  //delete sales_items with id
  app.delete(apiUrl + '/deletesales_items/:salesitem_id', function(req, res) {
    var sql = 'DELETE FROM salesorder_item WHERE salesitem_id = "' + req.params.salesitem_id + '"';
    db.executeQuery(sql, function(err, rows, fields) {
      res.sendStatus(200);
    });
  });

  //get customer info from db
  app.get(apiUrl + '/customer_details', function(req, res, next) {
    db.executeQuery("SELECT * FROM customer_info", function(results) {
      return res.status(200).send(results);
    })

  });

  /*----------------------------------------
  ODC SERVICE
  -----------------------------------*/
  //post odc sale items
  app.post(apiUrl + '/odc_saleitems', function(req, res) {
    var data = req.body;
    var salesorder_id = req.body.salesorder_id;
    var items = data.itemdata.map(function(item) {
      return [item.item, item.qty, item.itemprice, item.item_subrate, item.itemsubtotal, item.fmItemID, item.fmCatergoryID, salesorder_id]
    });


    var sql = "INSERT INTO odc_salesorderitem (sales_items,sales_quantity,salesitem_rate,item_subrate,subitemtotal,fmItemID,fmCatergoryID,salesorder_id)  VALUES ? ";
    db.executeQuery1(sql, [items], function(results) {
      return res.status(200).send(results);

    });
  });

   /*-------------------------------------------
   =============================================

    CURRENT BILL

  ===============================================
    -------------------------------------------*/

 // Get sales_order in currentbills
  //----------------
  app.get(apiUrl + '/getsales_order', function(req, res) {
    db.executeQuery('SELECT * FROM sales_order', function(results) {
      return res.status(200).send(results);
    });
  });


  // Get currentbill_service in currentbills
  //----------------

  app.get(apiUrl + '/currentbill_service', function(req, res) {
    db.executeQuery('SELECT DISTINCT sales_order.salesorder_id,sales_order.status,sales_order.sales_dietType,salesorder_item.ordertime,salesorder_item.sales_items,sales_order.staffID,sales_order.sales_deliveryStatus,sales_order.tableitem,sales_payment.payment_total,sales_order.manageBy,sales_order.sales_deliveryStatus,sales_order.sales_deliveryTime,sales_payment.payment_status  FROM sales_order INNER JOIN salesorder_item ON (sales_order.salesorder_id = salesorder_item.salesorder_id)  INNER JOIN sales_payment ON (sales_payment.salesorder_id = sales_order.salesorder_id)', function(results) {
      return res.status(200).send(results);
    });
  });

  // Get currentbill_service for merge bill
  app.get(apiUrl + '/current_mergebill_service/:staffID', function(req, res) {
    db.executeQuery('SELECT *  FROM sales_order INNER JOIN  salesorder_item ON (sales_order.salesorder_id = salesorder_item.salesorder_id)  INNER JOIN sales_payment ON (sales_payment.salesorder_id = sales_order.salesorder_id) WHERE staffID = "' + req.params.staffID + '"', function(results) {
      return res.status(200).send(results);
    });
  });


  // Get full data of sales order table for merge bill
  app.get(apiUrl + '/current_mergebill', function(req, res) {
    db.executeQuery('SELECT DISTINCT  sales_order.salesorder_id,sales_order.status,sales_order.staffID,sales_order.sales_dietType,sales_payment.payment_total  FROM sales_order INNER JOIN salesorder_item ON (sales_order.salesorder_id = salesorder_item.salesorder_id)  INNER JOIN sales_payment ON (sales_payment.salesorder_id = sales_order.salesorder_id)', function(results) {
      return res.status(200).send(results);
    });
  });


  // Get dinein datas from sales order table
  app.get(apiUrl + '/dinein', function(req, res, next) {
    var data = req.query;
    var filter = req.query.filter;
    var staffID = req.query.staffID
    var numRows;
    var queryPagination;
    var numPerPage = parseInt(req.query.limit, 10) || 1;
    var page = req.query.page == undefined ? 1 : req.query.page
    var numPages;
    var dinein;
    var skip = page * numPerPage


    // Here we compute the LIMIT parameter for MySQL query
    var limit = skip - numPerPage + ',' + parseInt(skip + numPerPage);
    db.executeQuery("SELECT DISTINCT sales_order.salesorder_id,sales_order.customer_id,sales_order.staffID,sales_order.sales_deliveryDate,sales_order.status,sales_order.sales_dietType,salesorder_item.ordertime,sales_order.staffID,sales_order.sales_deliveryStatus,sales_order.tableitem,sales_payment.payment_total,sales_payment.payment_received,sales_order.manageBy,sales_order.sales_deliveryStatus,sales_order.sales_deliveryTime,sales_payment.payment_status,sales_payment.payment_mode  FROM sales_order INNER JOIN salesorder_item ON (sales_order.salesorder_id = salesorder_item.salesorder_id)  INNER JOIN sales_payment ON (sales_payment.salesorder_id = sales_order.salesorder_id) WHERE sales_dietType = 'dinein' && staffID LIKE '%" + req.query.staffID + "%' && branch_id LIKE '%" + req.query.branch_id + "%' && status='ordered'  And (sales_order.salesorder_id LIKE '%" + filter + "%' or sales_payment.payment_total LIKE '%" + filter + "%' or sales_order.tableitem LIKE '%" + filter + "%' or sales_order.manageBy LIKE '%" + filter + "%')", function(results) {
      numRows = results.length;
      numPages = Math.ceil(numRows / numPerPage);
    })
    db.executeQuery("SELECT DISTINCT sales_order.salesorder_id,sales_order.customer_id,sales_order.status,sales_order.sales_deliveryDate,sales_order.staffID,sales_order.modifiedID,sales_order.last_modified,sales_order.sales_dietType,salesorder_item.ordertime,sales_order.staffID,sales_order.sales_deliveryStatus,sales_order.tableitem,sales_payment.payment_total,sales_payment.payment_received,sales_order.manageBy,sales_order.sales_deliveryStatus,sales_order.sales_deliveryTime,sales_payment.payment_status,sales_payment.payment_mode  FROM sales_order INNER JOIN salesorder_item ON (sales_order.salesorder_id = salesorder_item.salesorder_id)  INNER JOIN sales_payment ON (sales_payment.salesorder_id = sales_order.salesorder_id) WHERE sales_dietType = 'dinein' && staffID LIKE '%" + req.query.staffID + "%' && branch_id LIKE '%" + req.query.branch_id + "%' && status='ordered'  And (sales_order.salesorder_id LIKE '%" + filter + "%' or sales_payment.payment_total LIKE '%" + filter + "%' or sales_order.tableitem LIKE '%" + filter + "%' or sales_order.manageBy LIKE '%" + filter + "%') GROUP BY salesorder_id DESC LIMIT  " + limit, function(results) {

      var responsePayload = [{
        results: results,
        dinein_count: numRows
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
  // Get takeaway datas from sales order table
  app.get(apiUrl + '/takeaway', function(req, res, next) {
    var data = req.query;
    var filter = req.query.filter;
    var numRows;
    var queryPagination;
    var numPerPage = parseInt(req.query.limit, 10) || 1;
    var page = req.query.page == undefined ? 1 : req.query.page
    var numPages;
    var takeaway;
    var skip = page * numPerPage


    // Here we compute the LIMIT parameter for MySQL query
    var limit = skip - numPerPage + ',' + parseInt(skip + numPerPage);
    db.executeQuery("SELECT DISTINCT sales_order.salesorder_id,sales_order.customer_id,sales_order.staffID,sales_order.status,sales_order.sales_deliveryDate,sales_order.sales_dietType,salesorder_item.ordertime,sales_order.staffID,sales_order.sales_deliveryStatus,sales_order.tableitem,sales_payment.payment_total,sales_order.manageBy,sales_payment.payment_received,sales_order.sales_deliveryStatus,sales_order.sales_deliveryTime,sales_payment.payment_status,sales_payment.payment_mode  FROM sales_order INNER JOIN salesorder_item ON (sales_order.salesorder_id = salesorder_item.salesorder_id)  INNER JOIN sales_payment ON (sales_payment.salesorder_id = sales_order.salesorder_id) WHERE (sales_dietType = 'takeaway' && staffID LIKE '%" + req.query.staffID + "%' && branch_id LIKE '%" + req.query.branch_id + "%')  And (sales_order.salesorder_id LIKE '%" + filter + "%' or sales_payment.payment_total LIKE '%" + filter + "%' or sales_order.manageBy LIKE '%" + filter + "%')", function(results) {
      numRows = results.length;
      numPages = Math.ceil(numRows / numPerPage);
    })
    db.executeQuery("SELECT DISTINCT sales_order.salesorder_id,sales_order.customer_id,sales_order.status,sales_order.staffID,sales_order.sales_deliveryDate,sales_order.sales_dietType,salesorder_item.ordertime,sales_order.staffID,sales_order.modifiedID,sales_order.last_modified,sales_order.sales_deliveryStatus,sales_order.tableitem,sales_payment.payment_total,sales_order.manageBy,sales_payment.payment_received,sales_order.sales_deliveryStatus,sales_order.sales_deliveryTime,sales_payment.payment_status,sales_payment.payment_mode  FROM sales_order INNER JOIN salesorder_item ON (sales_order.salesorder_id = salesorder_item.salesorder_id)  INNER JOIN sales_payment ON (sales_payment.salesorder_id = sales_order.salesorder_id) WHERE (sales_dietType = 'takeaway' && staffID LIKE '%" + req.query.staffID + "%' && branch_id LIKE '%" + req.query.branch_id + "%') And (sales_order.salesorder_id LIKE '%" + filter + "%' or sales_payment.payment_total LIKE '%" + filter + "%'  or sales_order.manageBy LIKE '%" + filter + "%') GROUP BY salesorder_id DESC LIMIT  " + limit, function(results) {
      var responsePayload = [{
        results: results,
        takeaway_count: numRows
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
  // Get door delivery datas from sales order table
  app.get(apiUrl + '/doordelivery', function(req, res, next) {
    var data = req.query;
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
    db.executeQuery("SELECT DISTINCT sales_order.salesorder_id,sales_order.customer_id,sales_payment.payment_received,sales_order.staffID,sales_order.sales_deliveryDate,sales_order.status,sales_order.sales_dietType,salesorder_item.ordertime,sales_order.staffID,sales_order.sales_deliveryStatus,sales_order.tableitem,sales_payment.payment_total,sales_order.manageBy,sales_order.sales_deliveryStatus,sales_order.sales_deliveryTime,sales_payment.payment_status,sales_payment.payment_mode  FROM sales_order INNER JOIN salesorder_item ON (sales_order.salesorder_id = salesorder_item.salesorder_id)  INNER JOIN sales_payment ON (sales_payment.salesorder_id = sales_order.salesorder_id) WHERE (sales_dietType = 'doordelivery' && staffID LIKE '%" + req.query.staffID + "%' && branch_id LIKE '%" + req.query.branch_id + "%')  And (sales_order.salesorder_id LIKE '%" + filter + "%' or sales_payment.payment_total LIKE '%" + filter + "%'  or sales_order.manageBy LIKE '%" + filter + "%')", function(results) {
      numRows = results.length;
      numPages = Math.ceil(numRows / numPerPage);
    })
    db.executeQuery("SELECT DISTINCT sales_order.salesorder_id,sales_order.customer_id,sales_payment.payment_received,sales_order.status,sales_order.sales_deliveryDate,sales_order.staffID,sales_order.sales_dietType,salesorder_item.ordertime,sales_order.staffID,sales_order.modifiedID,sales_order.last_modified,sales_order.sales_deliveryStatus,sales_order.tableitem,sales_payment.payment_total,sales_order.manageBy,sales_order.sales_deliveryStatus,sales_order.sales_deliveryTime,sales_payment.payment_status,sales_payment.payment_mode  FROM sales_order INNER JOIN salesorder_item ON (sales_order.salesorder_id = salesorder_item.salesorder_id)  INNER JOIN sales_payment ON (sales_payment.salesorder_id = sales_order.salesorder_id) WHERE (sales_dietType = 'doordelivery' && staffID LIKE '%" + req.query.staffID + "%' && branch_id LIKE '%" + req.query.branch_id + "%')  And (sales_order.salesorder_id LIKE '%" + filter + "%' or sales_payment.payment_total LIKE '%" + filter + "%'  or sales_order.manageBy LIKE '%" + filter + "%') GROUP BY salesorder_id DESC LIMIT  " + limit, function(results) {
      var responsePayload = [{
        results: results,
        doordelivery_count: numRows
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


  // Get last updated bill id for new bill row box
  app.get(apiUrl + '/currentrow_service/:staffID', function(req, res) {

    db.executeQuery('SELECT  DISTINCT sales_order.salesorder_id,sales_order.customer_id,sales_order.staffID,salesorder_item.sales_items FROM salesorder_item  INNER JOIN   sales_order ON (sales_order.salesorder_id = salesorder_item.salesorder_id)  INNER JOIN sales_payment ON (sales_payment.salesorder_id = sales_order.salesorder_id) WHERE (staffID = "' + req.params.staffID + '"  && status="ordered")', function(items) {
      db.executeQuery('SELECT DISTINCT sales_order.salesorder_id,sales_order.customer_id,salesorder_item.salesitem_id,sales_order.staffID,sales_order.status,sales_order.sales_dietType,sales_order.tableitem,sales_payment.payment_total,sales_order.manageBy,sales_order.sales_deliveryStatus,salesorder_item.ordertime,sales_order.sales_deliveryTime,sales_payment.payment_status  FROM salesorder_item INNER JOIN   sales_order  ON (sales_order.salesorder_id = salesorder_item.salesorder_id)  INNER JOIN sales_payment ON (sales_payment.salesorder_id = sales_order.salesorder_id)  WHERE (staffID = "' + req.params.staffID + '" && status="ordered") GROUP BY salesorder_id', function(results) {
        var current_serviceID = results.map(function(item) {
          //filter only items depending on salesorder_id for count length of items
          var food_items = [];
          items.forEach(function(a) {
            if (a.staffID == item.staffID && a.salesorder_id == item.salesorder_id)
              food_items.push(a.sales_items);
          });
          return { 'sales_items': food_items.length, 'status': item.status, 'customer_id': item.customer_id, 'ordertime': item.ordertime, 'salesorder_id': item.salesorder_id, 'sales_dietType': item.sales_dietType, 'manageBy': item.manageBy, 'payment_total': item.payment_total, 'tableitem': item.tableitem, 'payment_status': item.payment_status, 'sales_deliveryStatus': item.sales_deliveryStatus, 'sales_deliveryTime': item.sales_deliveryTime }
        })
        return res.status(200).send(current_serviceID);
      });
    })

  });



  // Get sales order data with id in currentbills
  app.get(apiUrl + '/currentbill_service/:staffID', function(req, res) {

    db.executeQuery('SELECT  DISTINCT sales_order.salesorder_id,sales_order.customer_id,sales_order.staffID,salesorder_item.sales_items FROM salesorder_item  INNER JOIN   sales_order ON (sales_order.salesorder_id = salesorder_item.salesorder_id)  INNER JOIN sales_payment ON (sales_payment.salesorder_id = sales_order.salesorder_id) WHERE staffID = "' + req.params.staffID + '"', function(items) {
      db.executeQuery('SELECT DISTINCT sales_order.salesorder_id,sales_order.customer_id,salesorder_item.salesitem_id,sales_order.staffID,sales_order.status,sales_order.sales_dietType,sales_order.tableitem,sales_payment.payment_total,sales_order.manageBy,sales_order.sales_deliveryStatus,salesorder_item.ordertime,sales_order.sales_deliveryTime,sales_payment.payment_status  FROM salesorder_item INNER JOIN   sales_order  ON (sales_order.salesorder_id = salesorder_item.salesorder_id)  INNER JOIN sales_payment ON (sales_payment.salesorder_id = sales_order.salesorder_id)  WHERE staffID = "' + req.params.staffID + '" GROUP BY salesorder_id', function(results) {
        var current_serviceID = results.map(function(item) {
          //filter only items depending on salesorder_id for count length of items
          var food_items = [];
          items.forEach(function(a) {
            if (a.staffID == item.staffID && a.salesorder_id == item.salesorder_id)
              food_items.push(a.sales_items);
          });
          return { 'sales_items': food_items.length, 'status': item.status, 'customer_id': item.customer_id, 'ordertime': item.ordertime, 'salesorder_id': item.salesorder_id, 'sales_dietType': item.sales_dietType, 'manageBy': item.manageBy, 'payment_total': item.payment_total, 'tableitem': item.tableitem, 'payment_status': item.payment_status, 'sales_deliveryStatus': item.sales_deliveryStatus, 'sales_deliveryTime': item.sales_deliveryTime }
        })
        return res.status(200).send(current_serviceID);
      });
    })

  });




  //get sales order data for edit purpose  from currentbill to newbill controller
  app.get(apiUrl + '/dietitems/:salesorder_id', function(req, res) {
    var sql = 'SELECT * FROM salesorder_item WHERE salesorder_id = "' + req.params.salesorder_id + '"';
    db.executeQuery(sql, function(results) {
      console.log(results);
      var dietitems_services = results.map(function(item) {
        var date_time = new Date(item.ordertime).toString(); //get like wed apr with time
        return { 'shortOrdertime': new Date(item.ordertime), 'profit_difference': item.profit_difference, 'ordertime': new Date(item.ordertime), 'salesitem_id': item.salesitem_id, 'fmItemID': item.fmItemID, 'tax_sgst': item.tax_sgst, 'tax_cgst': item.tax_cgst, 'tax_status': item.tax_status, 'fmItemType': item.fmItemType, 'fmCatergoryID': item.fmCatergoryID, 'sales_items': item.sales_items, 'sales_quantity': item.sales_quantity, 'salesitem_rate': item.salesitem_rate, 'offerprice': item.offerprice, 'actualprice': item.actualprice, 'item_subrate': item.item_subrate,  'salesorder_id': item.salesorder_id }
      })
      //console.log(dietitems_services);
      return res.status(200).send(dietitems_services);
    });
  });

  //getdiet  for odc salesorder_item  from currentbill to newbill controller
  app.get(apiUrl + '/odcitems/:salesorder_id', function(req, res) {
    var sql = 'SELECT * FROM odc_salesorderitem WHERE salesorder_id = "' + req.params.salesorder_id + '"';
    db.executeQuery(sql, function(results) {
      return res.status(200).send(results);
    });
  });

  // Get primary table data for particular id for POS & ODC
  app.get(apiUrl + '/salesorder_diet/:salesorder_id', function(req, res) {
    var sql = 'SELECT * FROM sales_order WHERE salesorder_id = "' + req.params.salesorder_id + '"';
    db.executeQuery(sql, function(results) {
      return res.status(200).send(results);
    });
  });

  // Get payment data for particular id for POS & ODC
  app.get(apiUrl + '/payment_diet/:salesorder_id', function(req, res) {
    var sql = 'SELECT * FROM sales_payment WHERE salesorder_id = "' + req.params.salesorder_id + '"';
    db.executeQuery(sql, function(results) {
  // console.log(results)
      return res.status(200).send(results);
    });
  });


  // Get customer data for particular id for POS & ODC
  app.get(apiUrl + '/customer_infodiet/:salesorder_id', function(req, res) {
    var sql = 'SELECT * FROM customer_info WHERE customer_id = "' + req.params.salesorder_id + '"';
    db.executeQuery(sql, function(results) {
      return res.status(200).send(results);
    });
  });



  //get customer_feedback  from currentbill to newbill controller
  app.get(apiUrl + '/customer_feedbackdiet/:salesorder_id', function(req, res) {
    var sql = 'SELECT * FROM sales_feedback WHERE salesorder_id = "' + req.params.salesorder_id + '"';
    db.executeQuery(sql, function(results) {
      return res.status(200).send(results);
    });
  });

  /*---mergebill service --*/

  //post saleitems data to database
  app.post(apiUrl + '/post_salesorder_item', function(req, res) {
    var data = req.body;
    var items = data.map(function(item) {
      return [item.sales_items, item.sales_quantity, item.salesitem_rate, item.item_subrate, item.fmItemID, item.salesorder_id]
    });


    if (data.length > 0) {
      var edit_delete_id = data[0].to_merge_salesorder_id;
      var sql = "INSERT INTO salesorder_item (sales_items,sales_quantity,salesitem_rate,item_subrate,fmItemID,salesorder_id)  VALUES ? ";
      db.executeQuery1(sql, [items], function(results) {

        //delete merged data of id
        var sql = 'DELETE FROM salesorder_item WHERE salesorder_id = "' + edit_delete_id + '"';
        db.executeQuery(sql, function(err, rows, fields) {

          //put  merged status of deleted id in sales_order
          var update_salesorder = "merged";
          var sql = `UPDATE sales_order  SET status = "${update_salesorder}" WHERE salesorder_id = "${edit_delete_id}"`;
          db.executeQuery(sql, function(err, rows) {});

        });
        return res.status(200).send(results);
      });
    }
  });


  // update sales order item data
  app.put(apiUrl + '/update_salesorder_item/:salesorder_id', function(req, res) {
    let salesorder_id = req.params.salesorder_id;
    var data = req.body;
    if (data.length > 0) {
      for (var i = 0; i < data.length; i++) {
        var sql = `UPDATE salesorder_item SET sales_items = "${data[i].sales_items}", sales_quantity = "${data[i].sales_quantity}",salesitem_rate = "${data[i].salesitem_rate}",item_subrate = "${data[i].item_subrate}",ordertime = "${data[i].ordertime}",fmItemID = "${data[i].fmItemID}",salesorder_id = "${salesorder_id}" WHERE salesitem_id = "${data[i].salesitem_id}"`;
        db.executeQuery(sql, function(err, rows) {

          //delete merged data of id
          var edit_delete_id = req.body[0].salesorder_id;
          var sql = 'DELETE FROM salesorder_item WHERE salesorder_id = "' + edit_delete_id + '"';
          db.executeQuery(sql, function(err, rows, fields) {

            //put  merged status of deleted id in sales_order
            var update_salesorder = "merged";
            var sql = `UPDATE sales_order  SET status = "${update_salesorder}" WHERE salesorder_id = "${edit_delete_id}"`;

            db.executeQuery(sql, function(err, rows) {});
          });
        });
      }
    }
  });

  // update sales payment data
  app.put(apiUrl + '/update_sales_payment/:salesorder_id', function(req, res) {

    let salesorder_id = req.params.salesorder_id;
    var data = req.body;
    if (data.length > 0) {
      var sql = `UPDATE sales_payment  SET tax_rate = "${req.body[0].tax}",tax_sgst = "${req.body[0].tax_sgst}",discount = "${req.body[0].discount}",payment_total = "${req.body[0].payment_total}" WHERE salesorder_id = "${salesorder_id}"`;
      db.executeQuery(sql, function(err, rows) {

        var edit_delete_id = req.body[0].salesorder_id;
        var sql = 'DELETE FROM sales_payment WHERE salesorder_id = "' + edit_delete_id + '"';
        db.executeQuery(sql, function(err, rows, fields) {});
        res.sendStatus(200);
      });
    }
  });

  // update sales payment data while edit
  app.put(apiUrl + '/update_postPayment/:salesorder_id', function(req, res) {

    let salesorder_id = req.params.salesorder_id;
    var data = req.body;
    if (data.length > 0) {
      var sql = `UPDATE sales_payment  SET tax_rate = "${req.body[0].tax}",tax_sgst = "${req.body[0].tax_sgst}",discount = "${req.body[0].discount}",payment_total = "${req.body[0].payment_total}" WHERE salesorder_id = "${salesorder_id}"`;
      db.executeQuery(sql, function(err, rows) {
        res.sendStatus(200);
      });
    }
  });

  //delete odc sale items
  app.delete(apiUrl + '/delete_pos_ordered/:salesorder_id', function(req, res) {
    let salesorder_id = req.params.salesorder_id;
    var sql = 'DELETE FROM sales_feedback WHERE salesorder_id = "' + req.params.salesorder_id + '"';
    db.executeQuery(sql, function(err, rows, fields) {
    var sql = 'DELETE FROM salesorder_item WHERE salesorder_id = "' + req.params.salesorder_id + '"';
    db.executeQuery(sql, function(err, rows, fields) {
      var sql = 'DELETE FROM sales_payment WHERE salesorder_id = "' + req.params.salesorder_id + '"';
      db.executeQuery(sql, function(err, rows, fields) {
        var sql = 'DELETE FROM sales_order WHERE salesorder_id = "' + req.params.salesorder_id + '"';
        db.executeQuery(sql, function(err, rows, fields) {
          res.sendStatus(200);
        });
      })
    })
     })
  });



    /*-------------------------------------------
   =============================================

    PAID BILL

  ===============================================
    -------------------------------------------*/

 // Get paidbills
  //----------------
  app.get(apiUrl + '/paidbills', function(req, res) {
    db.executeQuery('SELECT sales_order.salesorder_id,sales_order.status,sales_order.sales_deliveryStatus,sales_order.sales_deliveryTime,sales_order.sales_dietType,sales_payment.payment_total,sales_order.manageBy,salesorder_item.ordertime  FROM salesorder_item INNER JOIN sales_order ON (sales_order.salesorder_id = salesorder_item.salesorder_id)  INNER JOIN sales_payment ON (sales_payment.salesorder_id = sales_order.salesorder_id)', function(results) {
      return res.status(200).send(results);
    });
  });

  // Get finished bill datas from sales order table
  app.get(apiUrl + '/paidbill_service', function(req, res, next) {
    var data = req.query;
    if(!req.query.month) {
      var monthData = '%' + req.query.month + '%'; // date
    } else {
      var monthData = req.query.month; // month
    }
    var filter = req.query.filter;

    if (req.query.staffID == "admin") {
      var staffID = ''
    } else {
      var staffID = req.query.staffID;
    }

    var request_data = req.params.date;

    var numRows;
    var queryPagination;
    var numPerPage = parseInt(req.query.limit, 10) || 1;
    var page = req.query.page == undefined ? 1 : req.query.page
    var numPages;
    var doordelivery;
    var skip = page * numPerPage

    // Here we compute the LIMIT parameter for MySQL query
    var limit = skip - numPerPage + ',' + parseInt(skip + numPerPage);

    db.executeQuery("SELECT DISTINCT sales_order.salesorder_id,sales_order.staffID,sales_order.status,sales_order.sales_deliveryDate,sales_order.sales_dietType,salesorder_item.ordertime,sales_order.staffID,sales_order.sales_deliveryStatus,sales_order.tableitem,sales_payment.payment_total,sales_payment.payment_received,sales_payment.payment_transferred,sales_order.manageBy,sales_order.sales_deliveryStatus,sales_payment.tax_rate,sales_payment.tax_sgst,sales_payment.additional_charge,sales_payment.discount,sales_payment.payment_mode,sales_order.sales_deliveryTime,sales_payment.payment_status,sales_payment.payment_mode  FROM sales_order INNER JOIN salesorder_item ON (sales_order.salesorder_id = salesorder_item.salesorder_id)  INNER JOIN sales_payment ON (sales_payment.salesorder_id = sales_order.salesorder_id) WHERE (status='finished' && DATE(ordertime)  LIKE '%" + req.query.date + "%' && (YEAR(ordertime) LIKE '%" + req.query.year + "%' and MONTH(ordertime) LIKE '"+monthData+"') && payment_mode LIKE '%" + req.query.PaidType + "%' && sales_dietType LIKE '%" + req.query.DietType + "%' && dealer_status LIKE '%" + req.query.customerType + "%' && staffID LIKE '%" + staffID + "%' && branch_id LIKE '%" + req.query.branch_id + "%') And (sales_order.salesorder_id LIKE '%" + filter + "%' or sales_payment.payment_total LIKE '%" + filter + "%')", function(results) {
      numRows = results.length;
      numPages = Math.ceil(numRows / numPerPage);
      // getting no of page count for pagination
    })
    db.executeQuery("SELECT DISTINCT sales_order.salesorder_id,sales_order.customer_id,sales_order.status,sales_order.sales_deliveryDate,sales_order.staffID,sales_order.thirdparty_name,sales_order.thirdparty_id,sales_order.sales_dietType,sales_order.dealer_status,salesorder_item.ordertime,sales_order.staffID,sales_order.modifiedID,sales_order.last_modified,sales_order.sales_deliveryStatus,sales_order.tableitem,sales_payment.payment_total,sales_payment.payment_received,sales_payment.payment_transferred,sales_order.manageBy,sales_order.sales_deliveryStatus,sales_payment.tax_rate,sales_payment.additional_charge,sales_payment.tax_sgst,sales_payment.discount,sales_payment.payment_mode,sales_order.sales_deliveryTime,sales_payment.payment_status,sales_payment.payment_mode  FROM sales_order INNER JOIN salesorder_item ON (sales_order.salesorder_id = salesorder_item.salesorder_id)  INNER JOIN sales_payment ON (sales_payment.salesorder_id = sales_order.salesorder_id) WHERE (status='finished' && DATE(ordertime)  LIKE '%" + req.query.date + "%' && (YEAR(ordertime) LIKE '%" + req.query.year + "%' and MONTH(ordertime) LIKE '"+monthData+"') && payment_mode LIKE '%" + req.query.PaidType + "%' && sales_dietType LIKE '%" + req.query.DietType + "%' && dealer_status LIKE '%" + req.query.customerType + "%' &&  staffID LIKE '%" + staffID + "%' && branch_id LIKE '%" + req.query.branch_id + "%') AND (sales_order.salesorder_id LIKE '%" + filter + "%' OR sales_payment.payment_total LIKE '%" + filter + "%')  GROUP BY salesorder_id DESC", function(results) {
      //console.log(results);
      var dinein_amount = [];
      var takeaway_amount = [];
      var doordelivery_amount = [];
      //filter tax cgst
      var tax_cgst = [];
      results.filter(function(item) {
        if (item.status == 'finished') {
          tax_cgst.push(parseFloat(item.tax_rate))
          return item
        }
      })
      //calculate sum of cashes
      if (tax_cgst.length > 0) {
        var tax_info_cgst = tax_cgst.reduce(function(a, b) {
          return a + b;
        });
      }
      //filter tax sgst
      var tax_sgst = []
      results.filter(function(item) {
        if (item.status == 'finished') {
          tax_sgst.push(parseFloat(item.tax_sgst))
          return item
        }
      })
      //calculate sum of cashes
      if (tax_sgst.length > 0) {
        var tax_info_sgst = tax_sgst.reduce(function(a, b) {
          return a + b;
        });
      }
      //calculate sum of received cashes
      var payment_received = []
      results.filter(function(item) {
        if (item.status == 'finished' && item.payment_mode == 'cash & card') {
          payment_received.push(parseFloat(item.payment_received))
          return item
        }
      })
      //calculate sum of received cashes
      if (payment_received.length > 0) {
        var payment_received = payment_received.reduce(function(a, b) {
          return a + b;
        });
      };
      //calculate sum of received cashes
      var payment_transferred = []
      results.filter(function(item) {
        if (item.status == 'finished' && item.payment_mode == 'cash & card') {
          payment_transferred.push(parseFloat(item.payment_transferred))
          return item
        }
      })
      //calculate sum of received cashes
      if (payment_transferred.length > 0) {
        var payment_transferred = payment_transferred.reduce(function(a, b) {
          return a + b;
        });
      };

      //filter only sales_diet type datas for dinein,takeaway,doordlivery
      var dinein = results.filter(function(item) {
        if (item.sales_dietType == "dinein")
          dinein_amount.push(parseInt(item.payment_total))
        return item
      })

      var takeaway = results.filter(function(item) {
        if (item.sales_dietType == "takeaway")
          takeaway_amount.push(parseInt(item.payment_total))
        return item
      })

      var doordelivery = results.filter(function(item) {
        if (item.sales_dietType == "doordelivery")
          doordelivery_amount.push(parseInt(item.payment_total))
        return item
      })



      if (dinein_amount.length > 0) {
        var dinein_amounts = dinein_amount.reduce(function(a, b) {
          return a + b;
        });
      }
      //  console.log(dinein_amount);
      if (takeaway_amount.length > 0) {
        var takeaway_amounts = takeaway_amount.reduce(function(a, b) {
          return a + b;
        });
      }
      if (doordelivery_amount.length > 0) {
        var doordelivery_amounts = doordelivery_amount.reduce(function(a, b) {
          return a + b;
        });
      }
      var dinein_amountss = dinein_amounts == undefined ? 0 : dinein_amounts;
      var takeaway_amountss = takeaway_amounts == undefined ? 0 : takeaway_amounts;
      var doordelivery_amountss = doordelivery_amounts == undefined ? 0 : doordelivery_amounts;
      var dinein_total = dinein_amount.length;
      var takeaway_total = takeaway_amount.length;
      var doordelivery_total = doordelivery_amount.length;
      var responsePayload = [{
        tax_cgst: tax_info_cgst == undefined ? 0 : tax_info_cgst,
        tax_sgst: tax_info_sgst == undefined ? 0 : tax_info_sgst,
        dinein_amount: dinein_amountss,
        dinein_total: dinein_total,
        takeaway_total: takeaway_total,
        doordelivery_total: doordelivery_total,
        takeaway_amount: takeaway_amountss,
        doordelivery_amount: doordelivery_amounts,
        payment_transferred_total: payment_transferred,
        payment_received_total: payment_received, 
        results: results,
        paidbill_count: numRows
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
   /*-------------------------------------------
   =============================================

    CURRENT ODC

  ===============================================
    -------------------------------------------*/


  //update odc primary table
  app.put(apiUrl + '/updateOdcorder/:salesorder_id', function(req, res) {
    let salesorder_id = req.params.salesorder_id;
    var sql = `UPDATE sales_order SET odc_deliveryDate = "${req.body[0].odc_deliveryDate}",sales_dietType = "${req.body[0].sales_dietType}",hall_no = "${req.body[0].hall_no}",odc_type = "${req.body[0].odc_type}",status = "${req.body[0].status}",customer_id = "${req.body[0].customer_id}",sales_deliveryTime = "${req.body[0].sales_deliveryTime}",odc_categoryID = "${req.body[0].odc_categoryID}",modifiedID = "${req.body[0].modifiedID}" WHERE salesorder_id = "${salesorder_id}"`;
    db.executeQuery(sql, function(err, rows) {
      res.sendStatus(200);
    });
  });

  //update odc sales item data
  app.put(apiUrl + '/odcitems/:salesorder_id', function(req, res) {
    let salesorder_id = req.params.salesorder_id;
    var editadditem = req.body.filter(function(addnewitem) {
      if (!addnewitem.odc_salesorderitem_id) {
        return addnewitem
      }
    })

    var editdbitem = req.body.filter(function(editexistitem) {
      if (editexistitem.odc_salesorderitem_id) {
        return editexistitem
      }
    })

    //update sales_items
    for (var i = 0; i < editdbitem.length; i++) {
      var fmItemID = editdbitem[i].sales_items.fmItemID ? editdbitem[i].sales_items.fmItemID : editdbitem[i].fmItemID
      var fmCatergoryID = editdbitem[i].sales_items.fmCatergoryID ? editdbitem[i].sales_items.fmCatergoryID : editdbitem[i].fmCatergoryID
      var sql = `UPDATE odc_salesorderitem SET sales_items = "${editdbitem[i].searchText}", sales_quantity = "${editdbitem[i].sales_quantity}",salesitem_rate = "${editdbitem[i].salesitem_rate}",item_subrate= "${editdbitem[i].item_subrate}",subitemtotal = "${editdbitem[i].subitemtotal}",fmItemID = "${fmItemID}",fmCatergoryID = "${fmCatergoryID}"  WHERE odc_salesorderitem_id = "${editdbitem[i].odc_salesorderitem_id}"`;
      db.executeQuery(sql, function(err, rows) {});
    }

    if (editadditem.length > 0) {
      //post newly added item
      var items = editadditem.map(function(item) {
        return [item.searchText, item.sales_quantity, item.salesitem_rate, item.subitemtotal, item.sales_items.fmItemID, item.sales_items.fmCatergoryID, salesorder_id]
      });
      var sql = "INSERT INTO odc_salesorderitem (sales_items,sales_quantity,salesitem_rate,subitemtotal,fmItemID,fmCatergoryID,salesorder_id)  VALUES ? ";
      db.executeQuery1(sql, [items], function(results) {

      });
    }
    return res.sendStatus(200);

  });


  // Get upcoming odc events data from database
  app.get(apiUrl + '/currentodc_service', function(req, res, next) {

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

    var limit = skip - numPerPage + ',' + parseInt(skip + numPerPage);
    // Get no of page and rows for pagination
    db.executeQuery("SELECT sales_order.salesorder_id,sales_order.status,sales_payment.paid_date,sales_payment.payment_mode,sales_order.odc_categoryID,sales_payment.tax_rate,sales_payment.tax_sgst,sales_payment.discount,sales_payment.additional_charge,sales_order.customer_id,sales_order.odc_deliveryDate,sales_order.sales_deliveryTime,sales_order.staffID,sales_payment.payment_status,sales_payment.tax_rate,sales_payment.tax_sgst,sales_payment.payment_received,sales_payment.payment_total  FROM sales_order INNER JOIN sales_payment ON sales_order.salesorder_id = sales_payment.salesorder_id WHERE ((sales_dietType='ODC' OR sales_dietType='Banquet') && (YEAR(sales_payment.paid_date) LIKE '%" + req.query.year + "%' and MONTH(sales_payment.paid_date) LIKE '%" + req.query.month + "%') && (sales_payment.payment_status LIKE '%" + payment_statuss + "%' || sales_payment.payment_status LIKE '%" + payment_status + "%') && sales_payment.payment_status LIKE '%" + fullypayment_status + "%' && staffID LIKE '%" + staffID + "%' && branch_id LIKE '%" + req.query.branch_id + "%') And (sales_order.salesorder_id LIKE '%" + filter + "%' or sales_payment.payment_total LIKE '%" + filter + "%' OR sales_order.staffID LIKE '%" + filter + "%')", function(results) {
      var current = results.filter(function(item) {
        if (new Date(item.odc_deliveryDate) > new Date() || new Date(item.odc_deliveryDate).toDateString() == new Date().toDateString())
          return item
      })
      // store no of page and rows for pagination
      numRows = current.length;
      numPages = Math.ceil(numRows / numPerPage);
    })

    db.executeQuery("SELECT sales_order.salesorder_id,sales_order.status,sales_payment.paid_date,sales_payment.tax_rate,sales_payment.tax_sgst,sales_payment.discount,sales_payment.additional_charge,sales_payment.payment_mode,sales_order.odc_categoryID,sales_order.customer_id,sales_order.odc_deliveryDate,sales_order.sales_deliveryTime,sales_order.staffID,sales_order.modifiedID,sales_order.last_modified,sales_payment.payment_status,sales_payment.tax_rate,sales_payment.tax_sgst,sales_payment.payment_received,sales_payment.payment_total  FROM sales_order INNER JOIN sales_payment ON sales_order.salesorder_id = sales_payment.salesorder_id WHERE ((sales_dietType='ODC' OR sales_dietType='Banquet') && (YEAR(sales_payment.paid_date) LIKE '%" + req.query.year + "%' and MONTH(sales_payment.paid_date) LIKE '%" + req.query.month + "%') && (sales_payment.payment_status LIKE '%" + payment_statuss + "%' || sales_payment.payment_status LIKE '%" + payment_status + "%') && sales_payment.payment_status LIKE '%" + fullypayment_status + "%' && staffID LIKE '%" + staffID + "%' && branch_id LIKE '%" + req.query.branch_id + "%') And (sales_order.salesorder_id LIKE '%" + filter + "%' or sales_payment.payment_total LIKE '%" + filter + "%' OR sales_order.staffID LIKE '%" + filter + "%')  GROUP BY salesorder_id DESC", function(results) {
      //filter only upcoming events by date wise
      var currentodcs = results.filter(function(odcFullData) {
        if (new Date(odcFullData.odc_deliveryDate) > new Date() || new Date(odcFullData.odc_deliveryDate).toDateString() == new Date().toDateString())
          return odcFullData
      })
      //map upcoming events data for our convenient
      var currentodc = currentodcs.map(function(item) {
        if (new Date(item.odc_deliveryDate).toDateString() == new Date().toDateString()) {
          var status = 'Today'
        } else if (new Date(item.odc_deliveryDate) > new Date()) {
          var status = 'Upcoming Event'
        }

        var date_time = new Date(item.sales_deliveryTime).toString(); //get like wed apr with time
        var ordertiming = (date_time.split(' ')[4]).split(':'); //only get time and split it as array
        var hours = (ordertiming[0] % 12) || 12; // convert to 12-hour style
        var time = hours + ":" + ordertiming[1] + " " + (ordertiming[0] < 12 ? 'AM' : 'PM') //find whether the hour is AM or PM
        return { 'salesorder_id': item.salesorder_id, 'paid_date': new Date(item.paid_date), 'modifiedID': item.modifiedID, 'last_modified': new Date(item.last_modified), 'staffID': item.staffID, 'payment_total': item.payment_total, 'payment_mode': item.payment_mode, 'payment_status': item.payment_status, 'additional_charge': item.additional_charge, 'tax_rate': item.tax_rate, 'tax_sgst': item.tax_sgst, 'discount': item.discount, 'customer_id': item.customer_id, 'odc_categoryID': item.odc_categoryID, 'odc_deliveryDate': item.odc_deliveryDate, 'payment_received': item.payment_received, 'sales_deliveryTime': time, 'status': status }
      });
      /*------------------
      Total amount for all type in dropdown
      ---------------*/
      //filter only  total amount & fully paid
      var total_purchase = []
      currentodcs.filter(function(item) {
        if (item.payment_status == 'fully paid') {
          total_purchase.push(parseInt(item.payment_total))
          return item
        }
      })
      //calculate sum of cashes
      if (total_purchase.length > 0) {
        var total_purchases = total_purchase.reduce(function(a, b) {
          return a + b;
        });
      }

      //filter only  full total amount
      var full_total = []
      currentodcs.filter(function(item) {
        full_total.push(parseInt(item.payment_total))
        return item
      })
      //calculate sum of cashes
      if (full_total.length > 0) {
        var full_totals = full_total.reduce(function(a, b) {
          return a + b;
        });
      }

      //filter only  tax cgst
      var tax_cgst = []
      currentodcs.filter(function(item) {
        if (item.payment_status == "fully paid" || item.payment_status == "advance paid" || item.payment_status == "unpaid") {
          tax_cgst.push(parseInt(item.tax_rate))
          return item
        }
      })
      //calculate sum of cashes
      if (tax_cgst.length > 0) {
        var tax_info_cgst = tax_cgst.reduce(function(a, b) {
          return a + b;
        });
      }
      //filter only  tax sgst
      var tax_sgst = []
      currentodcs.filter(function(item) {
        if (item.payment_status == "fully paid" || item.payment_status == "advance paid" || item.payment_status == "unpaid") {
          tax_sgst.push(parseInt(item.tax_sgst))
          return item
        }
      })
      //calculate sum of cashes
      if (tax_sgst.length > 0) {
        var tax_info_sgst = tax_sgst.reduce(function(a, b) {
          return a + b;
        });
      }


      //filter only cash & fully paid
      var total_cash = [];
      currentodcs.filter(function(item) {
        if ((item.payment_status == 'fully paid') && item.payment_mode == 'cash') {
          total_cash.push(parseInt(item.payment_total))
          return item
        }
      })
      //calculate sum of cashes
      if (total_cash.length > 0) {
        var total_cashs = total_cash.reduce(function(a, b) {
          return a + b;
        });
      }

      //filter only card & fully paid
      var total_card = []
      currentodcs.filter(function(item) {
        if (item.payment_status == 'fully paid' && item.payment_mode == 'card') {
          total_card.push(parseInt(item.payment_total))
          return item
        }
      })
      //calculate sum of cashes
      if (total_card.length > 0) {
        var total_cards = total_card.reduce(function(a, b) {
          return a + b;
        });
      }


      //filter only  cheque & fully paid
      var total_cheque = []
      currentodcs.filter(function(item) {
        if (item.payment_status == 'fully paid' && item.payment_mode == 'cheque') {
          total_cheque.push(parseInt(item.payment_total))
          return item
        }
      })
      //calculate sum of cashes
      if (total_cheque.length > 0) {
        var total_cheques = total_cheque.reduce(function(a, b) {
          return a + b;
        });
      }
      //filter only  online & fully paid
      var total_online = []
      currentodcs.filter(function(item) {
        if (item.payment_status == 'fully paid' && item.payment_mode == 'onlineTranscation') {
          total_online.push(parseInt(item.payment_total))
          return item
        }
      })
      //calculate sum of cashes
      if (total_online.length > 0) {
        var total_onlines = total_online.reduce(function(a, b) {
          return a + b;
        });
      }


      //filter only  advance paid & cash
      var advance_cash = []
      currentodcs.filter(function(item) {
        if ((item.payment_status == 'advance paid') && item.payment_mode == 'cash') {
          advance_cash.push(parseInt(item.payment_received))
          return item
        }
      })
      //calculate sum of cashes
      if (advance_cash.length > 0) {
        var advance_cashs = advance_cash.reduce(function(a, b) {
          return a + b;
        });
      }

      //filter only   advance paid & card
      var advance_card = []
      currentodcs.filter(function(item) {
        if (item.payment_status == 'advance paid' && item.payment_mode == 'card') {
          advance_card.push(parseInt(item.payment_received))
          return item
        }
      })
      //calculate sum of cashes
      if (advance_card.length > 0) {
        var advance_cards = advance_card.reduce(function(a, b) {
          return a + b;
        });
      }


      //filter only   advance paid & cheque
      var advance_cheque = []
      currentodcs.filter(function(item) {
        if (item.payment_status == 'advance paid' && item.payment_mode == 'cheque') {
          advance_cheque.push(parseInt(item.payment_received))
          return item
        }
      })
      //calculate sum of cashes
      if (advance_cheque.length > 0) {
        var advance_cheques = advance_cheque.reduce(function(a, b) {
          return a + b;
        });
      }
      //filter only  advance paid & online
      var advance_online = []
      currentodcs.filter(function(item) {
        if (item.payment_status == 'advance paid' && item.payment_mode == 'onlineTranscation') {
          advance_online.push(parseInt(item.payment_received))
          return item
        }
      })
      //calculate sum of cashes
      if (advance_online.length > 0) {
        var advance_onlines = advance_online.reduce(function(a, b) {
          return a + b;
        });
      }

      //filter only   advance paid & unpaid
      var total_advanceAmount = []
      currentodcs.filter(function(item) {
        if (item.payment_status == 'advance paid' || item.payment_status == 'unpaid') {
          total_advanceAmount.push(parseInt(item.payment_total))
          return item
        }
      })
      //calculate sum of cashes
      if (total_advanceAmount.length > 0) {
        var total_advanceAmounts = total_advanceAmount.reduce(function(a, b) {
          return a + b;
        });
      }

      //filter only  get paid count length
      var paid_count = []
      currentodcs.filter(function(item) {
        if (item.payment_status == 'advance paid' || item.payment_status == 'fully paid') {
          paid_count.push(parseInt(item.payment_total))
          return item
        }
      })

      //filter only  get advance count length
      var total_advance = []
      currentodcs.filter(function(item) {
        if (item.payment_status == 'advance paid' || item.payment_status == 'unpaid') {
          total_advance.push(parseInt(item.payment_received))
          return item
        }
      })
      //calculate sum of cashes
      if (total_advance.length > 0) {
        var total_advances = total_advance.reduce(function(a, b) {
          return a + b;
        });
      }
      //assign advance purchse total  amounts in advance or unpaid status
      var total_purchased1 = total_advanceAmounts == undefined ? 0 : total_advanceAmounts;
      //assign fully paid total  amount
      var total_purchased2 = total_purchases == undefined ? 0 : total_purchases;
      //Assign total amount of all status, calculate total((advancepaid+unpaaid) + fullypaid)
      var total = total_purchased1 + total_purchased2;
      //assign advance amount(reveiced) purchase received amount in advance status
      var total_purchased3 = total_advances == undefined ? 0 : total_advances
      //calculate only Total paid amount(totalamount+receivedamount)
      var total_paid = total_purchased2 + total_purchased3;
      //calculate total balance=(fullypaid+advancepaid+unpaaid)-(totalamount+receivedamount)
      var balance = total - total_paid;
      //store calculated values in to an array
      var responsePayload = [{
        results: currentodc,
        total_purchase: total,
        full_total: full_totals == undefined ? 0 : full_totals,
        total_paid: total_paid,
        balance: balance,
        tax_info_sgst: tax_info_sgst,
        tax_info_cgst: tax_info_cgst,
        balance_count: total_advance.length,
        paid_count: paid_count.length,
        total_cash: (total_cashs == undefined ? 0 : total_cashs) + (advance_cashs == undefined ? 0 : advance_cashs),
        total_card: (total_cards == undefined ? 0 : total_cards) + (advance_cards == undefined ? 0 : advance_cards),
        total_cheque: (total_cheques == undefined ? 0 : total_cheques) + (advance_cheques == undefined ? 0 : advance_cheques),
        total_online: (total_onlines == undefined ? 0 : total_onlines) + (advance_onlines == undefined ? 0 : advance_onlines),
        paidexpense_count: numRows

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

  });

  //delete odc sale items
  app.delete(apiUrl + '/currentodc_service/:salesorder_id', function(req, res) {
    let salesorder_id = req.params.salesorder_id;
    var sql = 'DELETE FROM odc_salesorderitem WHERE salesorder_id = "' + req.params.salesorder_id + '"';
    db.executeQuery(sql, function(err, rows, fields) {
      var sql = 'DELETE FROM sales_payment WHERE salesorder_id = "' + req.params.salesorder_id + '"';
      db.executeQuery(sql, function(err, rows, fields) {
        var sql = 'DELETE FROM sales_order WHERE salesorder_id = "' + req.params.salesorder_id + '"';
        db.executeQuery(sql, function(err, rows, fields) {
          res.sendStatus(200);
        });
      })
    })
  });



    /*-------------------------------------------
   =============================================

    PAID ODC

  ===============================================
    -------------------------------------------*/


  // Get finished events data from sales order table
  app.get(apiUrl + '/paidodc_service', function(req, res, next) {
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


     // Get no of page and rows for pagination
    var limit = skip - numPerPage + ',' + parseInt(skip + numPerPage);
    db.executeQuery("SELECT sales_order.salesorder_id,sales_order.status,sales_payment.paid_date,sales_payment.payment_mode,sales_payment.tax_rate,sales_payment.tax_sgst,sales_payment.discount,sales_payment.additional_charge,sales_order.odc_categoryID,sales_order.customer_id,sales_order.odc_deliveryDate,sales_order.sales_deliveryTime,sales_order.staffID,sales_payment.payment_status,sales_payment.tax_rate,sales_payment.tax_sgst,sales_payment.payment_received,sales_payment.payment_total  FROM sales_order INNER JOIN sales_payment ON sales_order.salesorder_id = sales_payment.salesorder_id WHERE ((sales_dietType='ODC' OR sales_dietType='Banquet') && (YEAR(sales_payment.paid_date) LIKE '%" + req.query.year + "%' and MONTH(sales_payment.paid_date) LIKE '%" + req.query.month + "%') && (sales_payment.payment_status LIKE '%" + payment_statuss + "%' || sales_payment.payment_status LIKE '%" + payment_status + "%') && sales_payment.payment_status LIKE '%" + fullypayment_status + "%' && staffID LIKE '%" + staffID + "%' && branch_id LIKE '%" + req.query.branch_id + "%') And (sales_order.salesorder_id LIKE '%" + filter + "%' or sales_payment.payment_total LIKE '%" + filter + "%' OR sales_order.staffID LIKE '%" + filter + "%')", function(results) {

      var paid = results.filter(function(item) {
        if (new Date(item.odc_deliveryDate) < new Date() && new Date(item.odc_deliveryDate).toDateString() != new Date().toDateString())
          return item
      })
      // store no of page and rows for pagination
      numRows = paid.length;
      numPages = Math.ceil(numRows / numPerPage);
    })

    db.executeQuery("SELECT sales_order.salesorder_id,sales_order.status,sales_payment.paid_date,sales_payment.tax_rate,sales_payment.tax_sgst,sales_payment.discount,sales_order.modifiedID,sales_order.last_modified,sales_payment.additional_charge,sales_payment.payment_mode,sales_order.odc_categoryID,sales_order.customer_id,sales_order.odc_deliveryDate,sales_order.sales_deliveryTime,sales_order.staffID,sales_payment.payment_status,sales_payment.tax_rate,sales_payment.tax_sgst,sales_payment.payment_received,sales_payment.payment_total  FROM sales_order INNER JOIN sales_payment ON sales_order.salesorder_id = sales_payment.salesorder_id WHERE ((sales_dietType='ODC' OR sales_dietType='Banquet') && (YEAR(sales_payment.paid_date) LIKE '%" + req.query.year + "%' and MONTH(sales_payment.paid_date) LIKE '%" + req.query.month + "%') && (sales_payment.payment_status LIKE '%" + payment_statuss + "%' || sales_payment.payment_status LIKE '%" + payment_status + "%') && sales_payment.payment_status LIKE '%" + fullypayment_status + "%' && staffID LIKE '%" + staffID + "%' && branch_id LIKE '%" + req.query.branch_id + "%') And (sales_order.salesorder_id LIKE '%" + filter + "%' or sales_payment.payment_total LIKE '%" + filter + "%' OR sales_order.staffID LIKE '%" + filter + "%')  GROUP BY salesorder_id DESC ", function(results) {
      //filter only finished events by date wise
      var paidodcs = results.filter(function(item) {
        if (new Date(item.odc_deliveryDate) < new Date() && new Date(item.odc_deliveryDate).toDateString() != new Date().toDateString())
          return item
      })
      //map upcoming events data for our convenient
      var paidodc = paidodcs.map(function(item) {
        var date_time = new Date(item.sales_deliveryTime).toString(); //get like wed apr with time
        var ordertiming = (date_time.split(' ')[4]).split(':'); //only get time and split it as array
        var hours = (ordertiming[0] % 12) || 12; // convert to 12-hour style
        var time = hours + ":" + ordertiming[1] + " " + (ordertiming[0] < 12 ? 'AM' : 'PM') //find whether the hour is AM or PM
        return { 'salesorder_id': item.salesorder_id, 'paid_date': new Date(item.paid_date), 'modifiedID': item.modifiedID, 'last_modified': new Date(item.last_modified), 'additional_charge': item.additional_charge, 'tax_rate': item.tax_rate, 'tax_sgst': item.tax_sgst, 'discount': item.discount, 'payment_total': item.payment_total, 'payment_received': item.payment_received, 'customer_id': item.customer_id, 'payment_status': item.payment_status, 'odc_categoryID': item.odc_categoryID, 'odc_deliveryDate': item.odc_deliveryDate, 'payment_mode': item.payment_mode, 'sales_deliveryTime': time, 'staffID': item.staffID }
      });
      /*------------------
      Total amount
      ---------------*/
        //filter only  total amount & fully paid
      var total_purchase = []
      paidodcs.filter(function(item) {
        if (item.payment_status == 'fully paid') {
          total_purchase.push(parseInt(item.payment_total))
          return item
        }
      })
      //calculate sum of cashes
      if (total_purchase.length > 0) {
        var total_purchases = total_purchase.reduce(function(a, b) {
          return a + b;
        });
      }

      //filter only  full total amount
      var full_total = []
      paidodcs.filter(function(item) {
        full_total.push(parseInt(item.payment_total))
        return item
      })
      //calculate sum of cashes
      if (full_total.length > 0) {
        var full_totals = full_total.reduce(function(a, b) {
          return a + b;
        });
      }

      //filter only  tax cgst
      var tax_cgst = []
      paidodcs.filter(function(item) {
        if (item.payment_status == "fully paid" || item.payment_status == "advance paid" || item.payment_status == "unpaid") {
          tax_cgst.push(parseInt(item.tax_rate))
          return item
        }
      })
      //calculate sum of cashes
      if (tax_cgst.length > 0) {
        var tax_info_cgst = tax_cgst.reduce(function(a, b) {
          return a + b;
        });
      }
      //filter only  tax sgst
      var tax_sgst = []
      paidodcs.filter(function(item) {
        if (item.payment_status == "fully paid" || item.payment_status == "advance paid" || item.payment_status == "unpaid") {
          tax_sgst.push(parseInt(item.tax_sgst))
          return item
        }
      })
      //calculate sum of cashes
      if (tax_sgst.length > 0) {
        var tax_info_sgst = tax_sgst.reduce(function(a, b) {
          return a + b;
        });
      }


      //filter only cash & fully paid
      var total_cash = []
      paidodcs.filter(function(item) {
        if ((item.payment_status == 'fully paid') && item.payment_mode == 'cash') {
          total_cash.push(parseInt(item.payment_total))
          return item
        }
      })
      //calculate sum of cashes
      if (total_cash.length > 0) {
        var total_cashs = total_cash.reduce(function(a, b) {
          return a + b;
        });
      }

       //filter only card & fully paid
      var total_card = []
      paidodcs.filter(function(item) {
        if (item.payment_status == 'fully paid' && item.payment_mode == 'card') {
          total_card.push(parseInt(item.payment_total))
          return item
        }
      })
      //calculate sum of cashes
      if (total_card.length > 0) {
        var total_cards = total_card.reduce(function(a, b) {
          return a + b;
        });
      }


      //filter only  cheque & fully paid
      var total_cheque = []
      paidodcs.filter(function(item) {
        if (item.payment_status == 'fully paid' && item.payment_mode == 'cheque') {
          total_cheque.push(parseInt(item.payment_total))
          return item
        }
      })
      //calculate sum of cashes
      if (total_cheque.length > 0) {
        var total_cheques = total_cheque.reduce(function(a, b) {
          return a + b;
        });
      }
      //filter only  online & fully paid
      var total_online = []
      paidodcs.filter(function(item) {
        if (item.payment_status == 'fully paid' && item.payment_mode == 'onlineTranscation') {
          total_online.push(parseInt(item.payment_total))
          return item
        }
      })
      //calculate sum of cashes
      if (total_online.length > 0) {
        var total_onlines = total_online.reduce(function(a, b) {
          return a + b;
        });
      }


      //filter only  advance paid & cash
      var advance_cash = []
      paidodcs.filter(function(item) {
        if ((item.payment_status == 'advance paid') && item.payment_mode == 'cash') {
          advance_cash.push(parseInt(item.payment_received))
          return item
        }
      })
      //calculate sum of cashes
      if (advance_cash.length > 0) {
        var advance_cashs = advance_cash.reduce(function(a, b) {
          return a + b;
        });
      }

     //filter only   advance paid & card
      var advance_card = []
      paidodcs.filter(function(item) {
        if (item.payment_status == 'advance paid' && item.payment_mode == 'card') {
          advance_card.push(parseInt(item.payment_received))
          return item
        }
      })
      //calculate sum of cashes
      if (advance_card.length > 0) {
        var advance_cards = advance_card.reduce(function(a, b) {
          return a + b;
        });
      }


      //filter only   advance paid & cheque
      var advance_cheque = []
      paidodcs.filter(function(item) {
        if (item.payment_status == 'advance paid' && item.payment_mode == 'cheque') {
          advance_cheque.push(parseInt(item.payment_received))
          return item
        }
      })
      //calculate sum of cashes
      if (advance_cheque.length > 0) {
        var advance_cheques = advance_cheque.reduce(function(a, b) {
          return a + b;
        });
      }
      //filter only  advance paid & online
      var advance_online = []
      paidodcs.filter(function(item) {
        if (item.payment_status == 'advance paid' && item.payment_mode == 'onlineTranscation') {
          advance_online.push(parseInt(item.payment_received))
          return item
        }
      })
      //calculate sum of cashes
      if (advance_online.length > 0) {
        var advance_onlines = advance_online.reduce(function(a, b) {
          return a + b;
        });
      }



      //filter only   advance paid & unpaid
      var total_advanceAmount = []
      paidodcs.filter(function(item) {
        if (item.payment_status == 'advance paid' || item.payment_status == 'unpaid') {
          total_advanceAmount.push(parseInt(item.payment_total))
          return item
        }
      })
      //calculate sum of cashes
      if (total_advanceAmount.length > 0) {
        var total_advanceAmounts = total_advanceAmount.reduce(function(a, b) {
          return a + b;
        });
      }

      //filter only  get paid count length
      var paid_count = []
      paidodcs.filter(function(item) {
        if (item.payment_status == 'advance paid' || item.payment_status == 'fully paid') {
          paid_count.push(parseInt(item.payment_total))
          return item
        }
      })

      //filter only  get advance count length
      var total_advance = []
      paidodcs.filter(function(item) {
        if (item.payment_status == 'advance paid' || item.payment_status == 'unpaid') {
          total_advance.push(parseInt(item.payment_received))
          return item
        }
      })
      //calculate sum of cashes
      if (total_advance.length > 0) {
        var total_advances = total_advance.reduce(function(a, b) {
          return a + b;
        });
      }
      //assign advance purchse total  amounts in advance or unpaid status
      var total_purchased1 = total_advanceAmounts == undefined ? 0 : total_advanceAmounts;
      //assign fully paid total  amount
      var total_purchased2 = total_purchases == undefined ? 0 : total_purchases;
      //Assign total amount of all status, calculate total((advancepaid+unpaaid) + fullypaid)
      var total = total_purchased1 + total_purchased2;
      //assign advance amount(reveiced) purchase received amount in advance status
      var total_purchased3 = total_advances == undefined ? 0 : total_advances
      //calculate only Total paid amount(totalamount+receivedamount)
      var total_paid = total_purchased2 + total_purchased3;
      //calculate total balance=(fullypaid+advancepaid+unpaaid)-(totalamount+receivedamount)
      var balance = total - total_paid;
      //store calculated values in to an array
      var responsePayload = [{
        results: paidodc,
        total_purchase: total,
        full_total: full_totals == undefined ? 0 : full_totals,
        total_paid: total_paid,
        balance: balance,
        tax_info_sgst: tax_info_sgst,
        tax_info_cgst: tax_info_cgst,
        balance_count: total_advance.length,
        paid_count: paid_count.length,
        total_cash: (total_cashs == undefined ? 0 : total_cashs) + (advance_cashs == undefined ? 0 : advance_cashs),
        total_card: (total_cards == undefined ? 0 : total_cards) + (advance_cards == undefined ? 0 : advance_cards),
        total_cheque: (total_cheques == undefined ? 0 : total_cheques) + (advance_cheques == undefined ? 0 : advance_cheques),
        total_online: (total_onlines == undefined ? 0 : total_onlines) + (advance_onlines == undefined ? 0 : advance_onlines),
        paidexpense_count: numRows

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


}
