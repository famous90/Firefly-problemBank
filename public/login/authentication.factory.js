(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .factory('authenticationFactory', authenticationFactory);
    
    authenticationFactory.$inject = ['encryptFactory', '$cookieStore', '$rootScope', 'dataFactory'];
    
    function authenticationFactory(encryptFactory, $cookieStore, $rootScope, dataFactory){
        return {
            login: login,
            setCredentials: setCredentials,
            clearCredentials: clearCredentials
        };
        
        function login(username, password, onSuccess, onError) {
            // Use this for real authentication
            encryptFactory.encodeWithBCrypt(password, encryptResult);
                                            
            function encryptResult(result){
                dataFactory.authenticate({ 
                    username: username, 
                    password: result 
                }).success(function(response){
                    console.log(response);
                    onSuccess(response);
                }).error(function(response){
                    onError(response);
                });

            };
        }
        
        function setCredentials(password, data) {
            var authdata = encryptFactory.encodeWithBCrypt(data.user.username + ':' + password);
            
            $rootScope.globals = {
                currentUser: {
                    username: data.user.username,
                    authdata: authdata,
                    uid: data.user.uid,
                    role: data.user.role
                }
            };
            
            dataFactory.setHeaderAuthorization(authdata);
            $cookieStore.put('globals', $rootScope.globals);
        }
        
        function clearCredentials() {
            $rootScope.globals = {};
            $cookieStore.remove('globals');
            dataFactory.setHeaderAuthorization('');
        }
    }
    
    
})();