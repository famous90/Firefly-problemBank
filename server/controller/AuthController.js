var client = require('../mysql-client');
var StringController = require('./StringController');

function AuthController (){
}

AuthController.prototype.isAuthorizatedWithRoles = isAuthorizatedWithRoles;

function isAuthorizatedWithRoles(uid, authkey, roles, onSuccess, onError){
    
    var stringController = new StringController();
    
    var query = "SELECT * FROM Users WHERE (uid = ? AND role in ";
    query += stringController.getQueryForMultiCondition(roles, 'string');
    query += " AND authkey = ?)";
    
    client.query(query, [uid, authkey], function(err, result){
        if(err){
            onError(err);
        } else {
            if(result.length){
                onSuccess(true);
            }else {
                onSuccess(false);
            }
        }
        return;
    });
};

module.exports = AuthController;