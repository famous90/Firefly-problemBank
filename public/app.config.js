(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .config(config);
    
    function config($routeProvider) {
        $routeProvider
        // route for the home page
            .when('/home', {
                templateUrl : 'main/home.html'
            })
            
        // route for the category edit page
            .when('/category/edit', {
                templateUrl : 'category/edit.category.html',
                controller: 'EditCategoryController',
                controllerAs: 'EditCateVm'
            })

        // route for the problem inserting page
            .when('/problem/insert', {
                templateUrl : 'problem/insert.problem.html',
                controller: 'insertProblemController',
                controllerAs: 'InsertProblemVm'
            })

        // route for the problem loading page
            .when('/problem/load', {
                templateUrl : 'problem/load.problem.html',
                controller: 'LoadProblemController',
                controllerAs: 'LoadProblemVm'
            })

        // route for the user management page
            .when('/user/manage', {
                templateUrl : 'user/manage.user.html',
                controller: 'UserManageController',
                controllerAs: 'UserManageVm'
            })

        // route for the my info page
            .when('/user/myinfo', {
                templateUrl : 'user/myinfo.user.html',
                controller: 'MyinfoController',
                controllerAs: 'MyInfoVm'
            })
        
        // route for the register page
            .when('/register', {
                templateUrl : 'register/form.register.html',
                controller: 'RegisterController',
                controllerAs: 'RegisterVm'
            })

        // route for the login page
            .when('/login', {
                templateUrl : 'login/form.login.html',
                controller: 'LoginController',
                controllerAs: 'LoginVm'
            })
        
        // route for the login page
            .when('/recharge', {
                templateUrl : 'pay/form.recharge.html',
                controller: 'RechargeController',
                controllerAs: 'RechargeVm'
            })
        
            .otherwise({ redirectTo: '/home' });
        
    }
})();