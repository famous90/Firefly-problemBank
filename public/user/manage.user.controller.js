(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .controller('UserManageController', UserManageController);
    
    UserManageController.$inject = ['dataFactory', '$log'];
    
    function UserManageController(dataFactory, $log) {
        var vm = this;
        
        vm.users = {};
        
        dataFactory.getUsers().then(function(response){
            vm.users = response.data;
            $log.info(vm.users);
        }, function(error){
            $log.error(error.data);
        });
    }
})();