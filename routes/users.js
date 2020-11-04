var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var mysql = require('mysql');

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

/* GET users listing. */
router.get('/', (req,res,next)=>{
  var data ={
    title:'Login',
    form:{name:'',passowrd:''},
    content:'Input your email and password'
  };
  res.render('users/login',data);
});

/* Sign-up */
router.get('/signup', function(req, res, next) {
  var data = {
    title: 'Sign-up',
    form: {name: '', email: '', password: ''},
    content: 'Input your name, email and password'
  };
  res.render('users/signup', data);
});

router.post('/signup', function(req, res, next) {
  var request = req;
  var response = res;
  req.check('name','NAME is required.').notEmpty();
  req.check('email','EMAIL is require.').isEmail();
  req.check('password','PASSWORD is require.').notEmpty();

  req.getValidationResult().then((result) => {
    if (!result.isEmpty()) {
      var re = '<ul class="error">';
      var result_arr = result.array();
      for (var n in result_arr) {
        re += '<li>' + result_arr[n].msg + '</li>'
      }
      re += '</ul>';
      var data = {
        title: 'Sign-up',
        content: re,
        form: req.body
      };
      response.render('users/signup',data);
    }else{
      request.session.login = null;
      console.log(req.body.password);
    
      var hash = bcrypt.hashSync(req.body.password, 10);
      console.log("Hash ex:",hash); //Store this in the db.
      
      connection.query('insert into users set ?',{
        'name': req.body.name,
        'email': req.body.email,
        'password': hash }, 
      function(error, results, fields) {
        if (error){
          console.log(error.message);
          var data = {
            title: 'Sign-up',
            content: 'This email is already used.',
            form: req.body
          };
          response.render('users/signup',data);
        }else{
          response.redirect('/users/login');
        }
      });
    }
  });
});

/* Login */
router.get('/login', function(req, res, next) {
  var data = {
    title: 'Login',
    form: {email: '', password: ''},
    content: 'Input your email and password'
  };
  res.render('users/login', data);
});

router.post('/login', function(req, res, next) {
  var request = req;
  var response = res;
  req.check('email','EMAIL is required.').isEmail();
  req.check('password','PASSWORd is required').notEmpty();

  req.getValidationResult().then((result) => {
    if (!result.isEmpty()) {
      var re = '<ul class="error">';
      var result_arr = result.array();
      for (var n in result_arr) {
        re += '<li>' + result_arr[n].msg + '</li>'
      }
      re += '</ul>';
      var data = {
        title: 'Login',
        content: re,
        form: req.body
      };
      response.render('users/login',data);
    }else{
      var mail = req.body.email;
      var pwd = req.body.password;
      console.log(mail+pwd);
      connection.query('SELECT * FROM users WHERE email = ? ',[mail],
        function(error,results,fields){
          console.log(results[0]);
          if (results.length <= 0 || !bcrypt.compareSync(pwd,results[0].password)) {
            var data = {
              title: 'Login',
              content: 'Incorrect email/password',
              form: req.body
            };
            response.render('users/login',data);
          } else {
            console.log(results[0]);
            console.log(results[0].name);
            request.session.loggedin = true;
            request.session.login = results[0];
            response.redirect('../');
          }			
          //response.end();
        }
      )
    }
  });
});

/* Logout */
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
 });

module.exports = router;