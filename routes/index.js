var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  const { token_set: tokenSet, user_info: userInfo } = req.cookies;

  if (tokenSet && userInfo) {
    return res.render('index', { title: 'Express', tokenSet, userInfo });
  }
  return res.render('index', { title: 'Express', tokenSet: false, userInfo: false });
});

module.exports = router;
