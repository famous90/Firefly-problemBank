//(function() {
//    'use strict';
//    
//    angular
//        .module('problemBank')
//        .directive('loginForm', loginForm);
//    
//    function loginForm(){
//       return {
//           restrict: 'EA',
//           templateUrl: 'login/login-form.html',
//           controller: loginController,
//           controllerAs: 'vm'
//       };
//    }
//    
//    loginController.$inject = ['$location', 'authenticationFactory'];
//    
//    function loginController($location, authenticationFactory) {
//        
//        var vm = this;
//        vm.login = login;
//
//        (function initController(){
//            //reset login status
//            authenticationFactory.clearCredentials();
//        })();
//        
//        function login() {
//            console.log('login tapped');
//            vm.dataLoading = true;
//            authenticationFactory.login(vm.username, vm.password, function(response){
//                console.log('login success');
//                authenticationFactory.setCredentials(vm.username, vm.password);
//                $location.path('/');
//            }, function(response){
//                console.error('login error');
//                console.error(response);
//                vm.error = response;
//                vm.dataLoading = false;
//            });
//        };
//    }
////    loginController.$inject = ['$scope', '$rootScope', '$location', 'authenticationFactory'];
////    
////    function loginController($scope, $rootScope, $location, authenticationFactory) {
////        // reset login status        
////        authenticationFactory.clearCredentials();
////        
////        $scope.login = login;
////        
////        function login() {
////            $scope.dataLoading = true;
////            authenticationFactory.login($scope.username, $scope.password, function(response){
////                authenticationFactory.setCredentials($scope.username, $scope.password);
////                $location.path('/');
////            }, function(response){
////                $scope.error = response.message;
////                $scope.dataLoading = false;
////            });
////        }
////    }
//
////    loginController.$inject = ['$scope', '$rootScope', 'AUTH_EVENTS', 'AuthService', 'dataFactory'];
////    
////    function loginController($scope, $rootScope, AUTH_EVENTS, AuthService, dataFactory){
////        $scope.credentials = {
////           username: '',
////           password: ''
////        };
////        
////        $scope.userLogin = userLogin;
////        
////        function userLogin(credentials) {
////           dataFactory.login(credentials).then(function (user) {
////               $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
//////               $scope.setCurrentUser(user);
////           }, function () {
////               $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
////           });
////        };
////    }
//})();