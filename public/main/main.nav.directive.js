(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .directive('mainNav', mainNav);
    
    function mainNav(){
       return {
           restrict: 'EA',
           templateUrl: 'main/main.nav.html',
           controller: mainNavController,
           controllerAs: 'vm'
       };
    };
    
    mainNavController.$inject = ['$modal', '$rootScope', 'authenticationFactory', '$log'];
    
    function mainNavController($modal, $rootScope, authenticationFactory, $log) {
        var vm = this;
        
        vm.user = {};
        vm.showLogin = showLogin;
        vm.logout = logout;
        
        initUser();
        
        function initUser(){
            if($rootScope.globals.currentUser){
                vm.user = $rootScope.globals.currentUser;
            }
        };
                
        function showLogin(){
            var modalInstance = $modal.open({
                animation: true,
                templateUrl: '../login/form.login.html',
                controller: 'loginController',
                controllerAs: 'vm',
                size: 'lg'
            });

            modalInstance.result.then(function () {
                $log.info('login success and modal close');
                vm.user = $rootScope.globals.currentUser;
            }, function () {
                $log.info('login canceled');
            });
        };
        
        function logout() {
            authenticationFactory.clearCredentials();
            vm.user = {};
            alert('로그아웃 되었습니다.');
        };
    };
})();