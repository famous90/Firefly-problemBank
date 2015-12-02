(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .controller('LoginController', LoginController);
        
    LoginController.$inject = ['$location', 'authenticationFactory'];
    
    function LoginController($location, authenticationFactory) {
        
        var vm = this;
        
        vm.login = login;
        vm.cancel = cancel;

        (function initController(){
            //reset login status
            authenticationFactory.clearCredentials();
        })();
        
        function login() {
            vm.dataLoading = true;
            authenticationFactory.login(vm.username, vm.password, function(response){
                console.log(response);
                $location.path('/home');
            }, function(response){
                console.error(response);
                vm.error = '로그인 중 오류가 발생했습니다. 다시 시도해주세요.';
                vm.dataLoading = false;
            });
        };
                
        function cancel() {
            $location.path('/home');
        }   
    }
})();