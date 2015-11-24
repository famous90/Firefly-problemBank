(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .factory('authenticationFactory', authenticationFactory);
    
    authenticationFactory.$inject = ['encryptFactory', '$http', '$cookieStore', '$rootScope', '$timeout', 'dataFactory'];
    
    function authenticationFactory(encryptFactory, $http, $cookieStore, $rootScope, $timeout, dataFactory){
        return {
            login: login,
            setCredentials: setCredentials,
            clearCredentials: clearCredentials
        };
        
        function login(username, password, onSuccess, onError) {
            // Use this for real authentication
            dataFactory.authenticate({ 
                username: username, 
                password: password 
            }).success(function(response){
                console.log(response);
                onSuccess(response);
            }).error(function(response){
                onError(response);
            });
        }
        
        function setCredentials(username, password) {
            var authdata = encryptFactory.encode(username + ':' + password);
            
            $rootScope.globals = {
                currentUser: {
                    username: username,
                    authdata: authdata
                }
            };
            
            $http.defaults.headers.common['Authorization'] = 'Basic ' + authdata // jshint ignore:line
            $cookieStore.put('globals', $rootScope.globals);
        }
        
        function clearCredentials() {
            $rootScope.globals = {};
            $cookieStore.remove('globals');
            $http.defaults.headers.common.Authorization = 'Basic';
        }
    }
//    authenticationFactory.$inject = ['Session', 'dataFactory'];
//    
//    function authenticationFactory(Session, dataFactory){
//        return {
//            login: login, 
//            isAuthenticated: isAuthenticated,
//            isAuthorized: isAuthorized
//        };        
//        
//        function login(credentials) {
//            return dataFactory.login(credentials).then(function(res){
//                Session.create(res.data.id, res.data.user.uid, res.data.user.role);
//                return res.data.user;
//            }, function(res){
//                return null;
//            });
//        };
//        
//        function isAuthenticated() {
//            return !!Session.userId;
//        };
//        
//        function isAuthorized(authorizedRoles) {
//            if(!angular.isArray(authorizedRoles)){
//                authorizedRoles = [authorizedRoles];
//            }
//            return (authService.isAuthenticated() && authorizedRoles.indexOf(Session.userRole) !== -1);
//        };
//    }
})();