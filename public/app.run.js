(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .run(run);
    
    run.$inject = ['$rootScope', '$location', '$cookieStore', 'dataFactory'];
    
    // register listener to watch route changes
    function run($rootScope, $location, $cookieStore, dataFactory){
        // keep user logged in after page refresh
        $rootScope.globals = $cookieStore.get('globals') || {};
        if($rootScope.globals.currentUser){
            dataFactory.setHeaderAuthorization($rootScope.globals.currentUser.authdata);
        }
        
        $rootScope.$on('$locationChangeStart', function(event, next, current){
            // redirect to login page if not logged in and trying to access a restricted page
            var restrictedPage = $.inArray($location.path(), ['/login', '/register']) === -1;
            var loggedIn = $rootScope.globals.currentUser;
            if(restrictedPage && !loggedIn) {
                $location.path('/home');
            }
            
            // redirect from register to home after logged in
//            console.log(current);
            if((current == '/register') && loggedIn) {
                $location.path('/home');
            }
        });
        
//        if(!$rootScope.globals.currentUser){
//            // no logged user, we should be going to #login
//            if(next.templateUrl == 'login/login-form.html'){
//                // already going to #login, no redirect needed
//            }else{
//                // not going to #login, we should redirect now
//                $location.path('/login');
//            }
//        }
    }
})();