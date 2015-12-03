var client = require('../mysql-client');

function AuthController (){
}

AuthController.prototype.isAuthorizatedWithRoles = isAuthorizatedWithRoles;

function isAuthorizatedWithRoles(uid, authkey, roles, onSuccess, onError){
    
    var query = "SELECT * FROM Users WHERE (uid = ? AND role in ";
    var roleQuery = "(";
    for(var i=0; i<roles.length; i++){
        if(i>0){
            roleQuery += ", ";
        }
        roleQuery += "'";
        roleQuery += roles[i];
        roleQuery += "'";
    }
    roleQuery += ")";
    query += roleQuery;
    query += " AND authkey = ?)";
    
    client.query(query, [uid, authkey], function(err, result){
        if(err){
            onError(err);
            throw err;
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