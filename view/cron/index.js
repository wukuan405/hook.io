var psr = require('parse-service-request');
var checkRoleAccess = require('../../lib/server/routeHandlers/checkRoleAccess');
var config = require('../../config');
var mschema = require('mschema');
var cron = require('../../lib/resources/cron/cron');
  
module['exports'] = function allCronPresenter (opts, callback) {

  var $ = this.$, 
    req = opts.request,
    res = opts.response,
    params = req.resource.params;

  $ = req.white($);

  var self = this;

  if (!req.isAuthenticated()) {
    $('.crons').remove();
    return callback(null, $.html());
  } else {
    $('.loginLink').remove();
  }

  psr(req, res, function(req, res, fields){
    for (var p in fields) {
      params[p] = fields[p];
    }
    finish();
  });

  function rowToString (row) {
    var str = '<tr>';
    for (var col in row) {
      var val = row[col];
      if (!val) {
        val = '&nbsp;';
      }
      str += '<td>' + val + '</td>';
    }
    //str += '<tr><td>' + r.name + '</td><td>' + r.cronPattern + '</td><td></td><td></td><td></td></tr>';
    str += '</tr>';
    return str;
  }

  function makeLink (url, text) {
    var str = '<a href="' + url + '">' + text + '</a>';
    return str;
  }

  function finish () {
    checkRoleAccess({ req: req, res: res, role: 'cron::read' }, function (err, hasPermission) {
      if (!hasPermission) {
        return res.end(config.messages.unauthorizedRoleAccess(req, 'cron::read'));
      } else {
        var validate = mschema.validate(req.resource.params, self.schema);
        if (!validate.valid) {
          validate.status = 'error';
          return res.json(validate);
        } else {
          return cron.find({ owner: req.resource.owner }, function (err, result) {
            if (err) {
              return res.end(err.message);
            }
            result.forEach(function(r){
              $('.crons').append(rowToString([
                makeLink(config.app.url + '/cron/' + r.owner + '/' + r.name, r.name),
                r.cronExpression,
                undefined,
                undefined,
                undefined
              ]));
            });
            return callback(null, $.html());
          });
        }
      }
    });

  }

};