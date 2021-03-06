var express = require('express');
var router = express.Router();
var axios = require('axios');
const {SECRET} = require("../constants");
const {APPID} = require("../constants");
const { User } = require('../db/db');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('get /wx');
});

router.post('/login', function(req, res, next) {
  try {
    const code = req.body.code;
    if (!code) {
      return res.send('no code');
    }
    console.log('post /wx/login, code is', code);
    axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: APPID,
        secret: SECRET,
        js_code: code,
        grant_type: 'authorization_code',
      }
    }).then(resp => {
      // session_key = "F8L0trTTt/VJVSWHYzD3sg==" 访问需要用户信息的接口时需要用？
      // openid = "oxzgx5TxRHAOjHZQgxpUQXVVejBQ" 用户唯一标识
      const {session_key, openid} = resp.data;
      if (session_key && openid) {
        // 对比数据库
        (async () => {
          const result = await User.findOne({ where: { openid } });
          if (result) {
            // 有过记录，update last login
            result.last_login = new Date();
            await result.save();
          } else {
            await User.create({
              session_key,
              openid,
              last_login: new Date(),
            });
          }
          res.send({
            success: true,
            data: {
              openid,
            },
          });
        })();
      } else {
        res.send('miss session_key or openid');
      }
    }).catch(err => {
      res.send(err);
    })
  } catch (e) {
    res.send(e);
  }
});

module.exports = router;
