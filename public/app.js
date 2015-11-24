(function(){
    
    angular
        .module('problemBank', [
        'ui.tree', 
        'ui.bootstrap', 
        'ngFileUpload', 
        'math', 
        'ngRoute',
        'ngCookies'
    ]);
        
//        .config(['$routeProvider', function($routeProvider){
//        $routeProvider
//            .when('/login', {
//                templateUrl: 'login/login-form.html',
//                controller: 'loginController'
//            })
//        
//            .when('/', {
//                templateUrl: 'index.html',
//                controller: 'BankController'
//            })
//        
//            .otherwise({ redirectTo: '/' });
//    }])
        
//        .run(['$rootScope', '$location', '$cookieStore', '$http'], function($rootScope, $location, $cookieStore, $http){
//        // keep user logged in after page refresh
//        $rootScope.globals = $cookieStore.get('globals') || {};
//        if($rootScope.globals.currentUser) {
//            $http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.globals;
//        }
//        
//        $rootScope.$on('$locationChangeStart', function(event, next, current){
//            //redirect to login page if not logged in
//            if($location.path() !== '/login' && !$rootScope.globals.currentUser){
//                $location.path('/login');
//            }
//        });
//    });
    
//    app.config(function($routeProvider) {
//        $routeProvider
//
//            // route for the home page
//            .when('/', {
//                templateUrl : 'view/home.html',
//                controller  : 'mainController'
//            })
//
//            // route for the about page
//            .when('/about', {
//                templateUrl : 'view/about.html',
//                controller  : 'aboutController'
//            })
//
//            // route for the contact page
//            .when('/contact', {
//                templateUrl : 'view/contact.html',
//                controller  : 'contactController'
//            });
//    });
//    
//    app.controller('mainController', function($scope) {
//        // create a message to display in our view
//        $scope.message = 'Everyone come and see how good I look!';
//    });
//
//    app.controller('aboutController', function($scope) {
//        $scope.message = 'Look! I am an about page.';
//    });
//
//    app.controller('contactController', function($scope) {
////        $scope.message = 'Contact us! JK. This is just a demo.';
////    });
//        
})();