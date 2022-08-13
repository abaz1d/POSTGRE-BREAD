var express = require('express');
var router = express.Router();
var moment = require('moment')

/* GET home page. */
module.exports = function (db) {
  router.get('/', function (req, res,) {
    const url = req.url == '/' ? '/?page=1' : req.url;
    const page = req.query.page || 1;
    const limit = 2;
    const offset = (page - 1) * limit;
    const wheres = []
    const values = []
    var count = 1;
    // var sortBy = req.query.sortBy || `id`
    // var sortMode = req.query.sortMode || `asc`
    const filter = `&idCheck=${req.query.idCheck}&id=${req.query.id}&stringCheck=${req.query.stringCheck}&string=${req.query.string}&integerCheck=${req.query.integerCheck}&integer=${req.query.integer}&floatCheck=${req.query.floatCheck}&float=${req.query.float}&dateCheck=${req.query.dateCheck}&startDate=${req.query.startDate}&endDate=${req.query.endDate}&booleanCheck=${req.query.booleanCheck}&boolean=${req.query.boolean}`
    //const filter = `&idCheck=&id=&stringCheck=&string=&integerCheck=&integer=&floatCheck=&float=&dateCheck=&startDate=&endDate=&booleanCheck=&boolean=`
    
    var sortBy = req.query.sortBy == undefined ? `id` : req.query.sortBy;
    var sortMode = req.query.sortMode == undefined ? `asc` : req.query.sortMode;
    console.log(url)
    // console.log(filter)
    //console.log(`/?page=${parseInt(page)}&sortBy=${sortBy}&sortMode=${sortMode}`)
    //console.log(url.concat(`&sortBy=${sortBy}&sortMode=${sortMode}`))
    console.log(sortBy)
    console.log(sortMode)


    if (req.query.id && req.query.idCheck == 'on') {
      wheres.push(`id = $${count++}`);
      values.push(req.query.id);
    }

    if (req.query.string && req.query.stringCheck == 'on') {
      wheres.push(`string ilike '%' || $${count++} || '%'`);
      values.push(req.query.string);
    }

    if (req.query.integer && req.query.integerCheck == 'on') {
      wheres.push(`integer ilike '%' || $${count++} || '%'`)
      values.push(req.query.integer);
    }

    if (req.query.float && req.query.floatCheck == 'on') {
      wheres.push(`float ilike '%' || $${count++} || '%'`)
      values.push(req.query.float);
    }

    if (req.query.dateCheck == 'on') {
      if (req.query.startDate != '' && req.query.endDate != '') {
        wheres.push(`date BETWEEN $${count++} AND $${count++}`)
        values.push(req.query.startDate);
        values.push(req.query.endDate);
      }
      else if (req.query.startDate) {
        wheres.push(`date > $${count++}`)
        values.push(req.query.startDate);
      }
      else if (req.query.endDate) {
        wheres.push(`date < $${count++}`)
        values.push(req.query.endDate);
      }
    }

    if (req.query.boolean && req.query.booleanCheck == 'on') {
      wheres.push(`boolean = $${count++}`);
      values.push(req.query.boolean);
    }


    let sql = 'SELECT COUNT(*) AS total FROM todos';
    if (wheres.length > 0) {
      sql += ` WHERE ${wheres.join(' AND ')}`
    }

    db.query(sql, values, (err, data) => {
      if (err) {
        console.error(err);
      }
      const pages = Math.ceil(data.rows[0].total / limit)
      sql = 'SELECT * FROM todos'
      if (wheres.length > 0) {
        sql += ` WHERE ${wheres.join(' AND ')}`
      }
      sql += ` ORDER BY ${sortBy} ${sortMode} LIMIT $${count++} OFFSET $${count++}`;
     
      
      db.query(sql, [...values, limit, offset], (err, data) => {
        if (err) {
          console.error(err);
        }
        res.render('list', { data: data.rows, pages, page, query: req.query, moment, url, filter, sortBy, sortMode})
      })
    })
  })

  router.get('/add', (req, res) => {
    res.render('add')
  })

  router.post('/add', (req, res) => {
    db.query('INSERT INTO todos(string,integer,float,date, boolean) VALUES ($1, $2, $3, $4, $5)', 
    [req.body.string, parseInt(req.body.integer), parseFloat(req.body.float), req.body.date, req.body.boolean], (err) => {
      if (err) {
        console.error(err);
      }
    })
    res.redirect('/');
  })

  router.get('/delete/:id', (req, res) => {
    db.query('DELETE FROM todos WHERE id = $1', [req.params.id], (err) => {
      if (err) {
        console.error(err);
      }
    })
    res.redirect('/');
  })

  router.get('/edit/:id', (req, res) => {
    db.query('SELECT * FROM todos WHERE id = $1', [req.params.id], (err, data) => {
      if (err) {
        console.error(err);
      }
      res.render('edit', { item: data.rows[0], moment })
    })
  })

  router.post('/edit/:id', (req, res) => {
    db.query('UPDATE todos SET string = $1, integer = $2, float = $3, date = $4, boolean = $5 WHERE id = $6',
      [req.body.string, parseInt(req.body.integer), parseFloat(req.body.float), req.body.date, req.body.boolean, req.params.id], (err) => {
        if (err) {
          console.error(err)
        }
        res.redirect('/');
      })
  })

  return router;
}