(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .factory('encryptFactory', encryptFactory);
    
    function encryptFactory(){
        
        return {
            encodeWithBCrypt: encodeWithBCrypt
        };
        
        function encodeWithBCrypt(input, callback){
            var bcrypt = new bCrypt();
            var salt = '$2a$10$KJR9oKB8s8cDPCSbYtz1Ye';

            bcrypt.hashpw(input, salt, function(newhash){
                callback(newhash);
            }, function() {});
        };
        
    }
    
})();