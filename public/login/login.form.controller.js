(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .controller('loginController', loginController);
        
    loginController.$inject = ['$location', 'authenticationFactory', '$modalInstance'];
    
    function loginController($location, authenticationFactory, $modalInstance) {
        
        var vm = this;
        vm.login = login;
        vm.register = register;
        vm.cancel = cancel;

        (function initController(){
            //reset login status
            authenticationFactory.clearCredentials();
        })();
        
        function login() {
            vm.dataLoading = true;
            authenticationFactory.login(vm.username, vm.password, function(response){
                console.log(response);
                authenticationFactory.setCredentials(vm.password, response);
                $location.path('/home');
                $modalInstance.close();
            }, function(response){
                console.error('login error');
                console.error(response);
                vm.error = response;
                vm.dataLoading = false;
            });
        };
        
        function register() {
            $modalInstance.dismiss('cancel');
        }
        
        function cancel() {
            $modalInstance.dismiss('cancel');
        }   
    }
})();