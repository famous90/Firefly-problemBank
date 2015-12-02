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
                templateUrl : 'category/edit.category.html'
            })

        // route for the problem inserting page
            .when('/problem/insert', {
                templateUrl : 'problem/insert.problem.html',
                controller: 'insertProblemController'
            })

        // route for the problem loading page
            .when('/problem/load', {
                templateUrl : 'problem/load.problem.html',
                controller: 'loadProblemController'
            })

        // route for the user management page
            .when('/user/manage', {
                templateUrl : 'user/manage.user.html',
                controller: 'UserManageController',
                controllerAs: 'vm'
            })

        // route for the register page
            .when('/register', {
                templateUrl : 'register/form.register.html',
                controller: 'RegisterController',
                controllerAs: 'vm'
            })

        // route for the login page
            .when('/login', {
                templateUrl : 'login/form.login.html',
                controller: 'LoginController',
                controllerAs: 'vm'
            })
        
            .otherwise({ redirectTo: '/home' });
        
    }
})();