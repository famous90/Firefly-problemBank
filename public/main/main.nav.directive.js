(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .directive('mainNav', mainNav);
    
    function mainNav(){
       return {
           restrict: 'EA',
           templateUrl: 'main/main.nav.html',
           controller: MainNavController,
           controllerAs: 'vm'
       };
    };
    
    MainNavController.$inject = ['$rootScope', 'authenticationFactory'];
    
    function MainNavController($rootScope, authenticationFactory) {
        var vm = this;
        
        vm.user = {};
        vm.logout = logout;
        
        initUser();
        
        $rootScope.$watch('globals', function(newValue, oldValue){
            vm.user = $rootScope.globals.currentUser;
        });
        
        function initUser(){
            if($rootScope.globals.currentUser){
                vm.user = $rootScope.globals.currentUser;
            }
        };
        
        function logout() {
            authenticationFactory.clearCredentials();
            vm.user = {};
            alert('로그아웃 되었습니다.');
        };
    };
})();