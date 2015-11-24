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
    
    mainNavController.$inject = ['$modal', '$rootScope'];
    
    function mainNavController($modal, $rootScope) {
        var vm = this;
        vm.user = {};
        vm.showLogin = showLogin;
        vm.logout = logout;
        vm.showLoadProblem = showLoadProblem;
        vm.showInsertProblem = showInsertProblem;
        vm.showEditCategory = showEditCategory;
        
        function showLogin(){
            var modalInstance = $modal.open({
                animation: true,
                templateUrl: '../login/login-form.html',
                controller: 'loginController',
                controllerAs: 'vm',
                size: 'lg'
            });

            modalInstance.result.then(function () {
                console.log('login success and modal close');
                console.log($rootScope.globals);
                vm.user = $rootScope.globals.currentUser;
            }, function () {
                console.log('login canceled');
            });
        };
        
        function logout() {
              
        };
        
        function showLoadProblem() {};
        function showInsertProblem() {};
        function showEditCategory() {};
    };
})();