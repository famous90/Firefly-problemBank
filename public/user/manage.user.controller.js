(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .controller('UserManageController', UserManageController);
    
    UserManageController.$inject = ['dataFactory'];
    
    function UserManageController(dataFactory) {
        var vm = this;
        
        vm.users = {};
        
        dataFactory.getUsers().then(function(response){
            vm.users = response.data;
        }, function(error){
            console.error(error.data);
        });
    }
})();