(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .controller('MyinfoController', MyinfoController);
    
    MyinfoController.$inject = ['$rootScope'];
    
    function MyinfoController($rootScope) {
        var vm = this;
        
        vm.user = {};
        
        initMyInfo();
        
        function initMyInfo(){
            vm.user = $rootScope.globals.currentUser;
        }
    }
})();