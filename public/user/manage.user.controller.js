(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .controller('UserManageController', UserManageController);
    
    UserManageController.$inject = ['dataFactory'];
    
    function UserManageController(dataFactory) {
        var vm = this;
        vm.users = {};
        vm.userRoles = ['admin', 'editor', 'user'];
        vm.alterUsers = new Array();
        
        vm.updateUserInfo = updateUserInfo;
        vm.changeUserRole = changeUserRole;
        
        initUsersInfo();
        
        function initUsersInfo(){
            dataFactory.getUsers().then(function(response){
                vm.users = response.data;
            }, function(error){
                console.error(error.data);
            });
        };
        
        function updateUserInfo(){
            if(!vm.alterUsers.length){
                return;
            }
            dataFactory.alterUsers(vm.alterUsers).then(function(response){
                console.log('hello');
            }, function(response){
                
            });
        };
        
        function changeUserRole(user){
            if(user.role == user.newRole){
                // delete user from list
                for(var i=0; i<vm.alterUsers.length; i++){
                    if(vm.alterUsers[i].uid == user.uid){
                        vm.alterUsers.splice(i, 1);
                    }
                }
            }else {
                // inser user to list
                vm.alterUsers.push(user);
            }
        }
    }
})();