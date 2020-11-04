var express = require('express');
var router = express.Router();
var mysql = require('mysql');
const { route } = require('.');

var connection = mysql.createConnection(
  {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'myday',
    charset: 'utf8'
  }
);

connection.connect();

/* GET: tasks/ */
router.get('/', function(req, res, next) {
  console.log('redirect to tasks/1');
  res.redirect('/tasks/1/list');
});

/* GET: tasks/:id/lists */
router.get('/:id/list', function(req, res, next) {
        if (req.session.login == null){
            console.log('not login');
            res.redirect('/users');
        }else{
            console.log('login-redirect to list');
            var user_id = req.session.login.id;
            var result_data =[];
            connection.query('SELECT * FROM assignments WHERE user_id = ?',[user_id],
            function(error,results,fields){
              if (results.length > 0) {
                //console.log(results);
                Object.keys(results).forEach(function(key) {
                  row = results[key];
                  console.log(row.title)
                  result_data.push(row);
                });
                console.log(result_data);
                var data = {
                  title:'Task List', 
                  content:'Welcome to Task List, '+req.session.login.name,
                  tasks: result_data
                };
                res.render('tasks/list',data);
              } else {
                console.log('No assignment');
                var data = {
                  title:'Task List', 
                  content:'Welcome to Task List, '+req.session.login.name,
                  tasks: result_data
                };
                res.render('tasks/list',data);
              }			
            }
          )
        }
});   

/* GET: tasks/:id/create */
router.get('/:id/create', function(req, res, next) {
  if (req.session.login == null){
    console.log('not login');
    res.redirect('/users');
  }else{
    var data = {
      title: 'Create Task',
      content: 'School Task',
      form: {user_id: req.session.login.id ,title:'',course:'',deadline:''}
    }
    res.render('tasks/create',data);
  }
});

/* POST tasks/:id/create */
router.post('/:id/create', function(req, res, next) {
  if (req.session.login == null){
    console.log('not login');
    res.redirect('/users');
  }else{
    var request = req;
    var response = res;
    req.check('title','TITLE is required.').notEmpty();
    req.check('course','COURSE is require.').notEmpty();
    req.check('deadline','DEADLINE is require.').notEmpty();
    req.check('priority','PRIORITY is require.').notEmpty();

    req.getValidationResult().then((result) => {
      if (!result.isEmpty()) {
        var re = '<ul class="error">';
        var result_arr = result.array();
        for (var n in result_arr) {
          re += '<li>' + result_arr[n].msg + '</li>'
        }
        re += '</ul>';
        var data = {
          title: 'Create Task',
          content: re,
          form: req.body
        };
        res.render('tasks/create',data);
      }else{
        console.log(req.body);
        connection.query('insert into assignments set ?',{
          'user_id': req.body.user_id,
          'title': req.body.title,
          'course': req.body.course,
          'deadline': req.body.deadline,
          'priority': req.body.priority,
          'comment': req.body.comment }, 
        function(error, results, fields) {
          if (error){
            console.log('error'+error.message);
            res.render('tasks/create',{title: 'Create Task',
            content: 'Input data',
            form: req.body});
          }else{
            console.log('redirect to list');
            response.redirect('/tasks/'+req.params.id+'/list');
          }
        });
      }
    });
  }
});

/* GET: tasks/:id/edit */
router.get('/:id/edit', function(req, res, next) {
  if (req.session.login == null){
    console.log('not login');
    res.redirect('/users');
  }else{
      console.log('login-redirect to edit');
      var task_id = req.params.id;
      var result_data =[];
      connection.query('SELECT * FROM assignments WHERE id = ?',[task_id],
      function(error,results,fields){
        if (results.length > 0) {
          //console.log(results);
          Object.keys(results).forEach(function(key) {
            row = results[key];
            console.log(row.title)
            result_data.push(row);
          });
          console.log('editing:'+result_data);
          var data = {
            title:'Task EDIT', 
            content:'Welcome to Task List, '+req.session.login.name,
            form: result_data[0]
          };
          res.render('tasks/edit',data);
        } else {
          console.log('No assignment');
          var data = {
            title:'Task List', 
            content:'Welcome to Task List, '+req.session.login.name,
            tasks: result_data
          };
          res.render('tasks/list',data);
        }			
      }
    );
  }
});

/* POST tasks/:id/edit */
router.post('/:id/edit', function(req, res, next) {
  var task_id = req.params.id;
  if (req.session.login == null){
    console.log('not login');
    res.redirect('/users');
  }else{
    var request = req;
    var response = res;
    req.check('title','TITLE is required.').notEmpty();
    req.check('course','COURSE is require.').notEmpty();
    req.check('deadline','DEADLINE is require.').notEmpty();
    req.check('priority','PRIORITY is require.').notEmpty();

    req.getValidationResult().then((result) => {
      if (!result.isEmpty()) {
        var re = '<ul class="error">';
        var result_arr = result.array();
        for (var n in result_arr) {
          re += '<li>' + result_arr[n].msg + '</li>'
        }
        re += '</ul>';
        var data = {
          title: 'Task EDIT',
          content: re,
          form: req.body
        };
        res.render('tasks/edit',data);
      }else{
        console.log('edit-'+req.params.id);
        connection.query('update assignments set ? where id= ?',[{
          'title': req.body.title,
          'course': req.body.course,
          'deadline': req.body.deadline,
          'priority': req.body.priority,
          'comment': req.body.comment },
          task_id], 
        function(error, results, fields) {
          if (error){
            console.log('error'+error.message);
            res.render('tasks/edit',{title: 'Task EDIT',
            content: 'Input data',
            form: req.body});
          }else{
            console.log('edited , redirect to list');
            response.redirect('/tasks/'+task_id+'/list');
          }
        });
      }
    });
  }
});

/* POST tasks/:id/delete */
router.post('/:id/delete', function(req, res, next){
  var task_id = req.params.id;
  connection.query('DELETE FROM assignments WHERE id=?', task_id, function (error, results, fields) {
    if (error) throw error;
    res.redirect('/tasks/1/list');
  });
})

module.exports = router;