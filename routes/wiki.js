var express = require('express');
var router = express.Router();

//Home page route

router.get('/', function(req, res, next) {
    res.send('Wiki home page');
    console.log('fgfgs');
});

router.get('/about', function(req, res, next) {
   res.send('Wiki about page'); 
});

module.exports = router;