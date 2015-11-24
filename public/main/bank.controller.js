(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .controller('BankController', BankController);
        
    BankController.$inject = ['USER_ROLES', 'authenticationFactory', '$rootScope'];
    
    function BankController(USER_ROLES, authenticationFactory, $rootScope){
        
        this.currentUser = null;
        this.userRoles = USER_ROLES;
        this.isAuthorized = authenticationFactory.isAuthorized;
        
        this.setCurrentUser = setCurrentUser;
        
        function setCurrentUser(user){
            this.currentUser = user;
        }
    }
})();