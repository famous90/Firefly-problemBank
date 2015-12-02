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
            dataFactory.setHeaderAuthorization('');
        }
        
        $rootScope.$on('$locationChangeStart', function(event, next, current){
            // redirect to login page if not logged in and trying to access a restricted page
            var restrictedPage = $.inArray($location.path(), ['/login', '/register', '/home', '', '/']) === -1;
            var restrictedPageForUser = $.inArray($location.path(), ['/login', '/register', '/home', '/problem/load']) === -1;
            var restrictedPageForEditor = $.inArray($location.path(), ['/login', '/register', '/home', '/problem/load', '/problem/insert']) === -1;
            var loggedIn = $rootScope.globals.currentUser;
            if(restrictedPage && !loggedIn) {
                alert('로그인 후 이용해 주시기 바랍니다.');
                $location.path('/login');
            }
            
            // redirect from register to home after logged in
            if((current == '/register') && loggedIn) {
                $location.path('/home');
            }
            
            // redirect to home if trying to access not authorized page
            if(loggedIn){
                if(((loggedIn.role == 'user')&&(restrictedPageForUser))||((loggedIn.role == 'editor')&&(restrictedPageForEditor))){
                    alert('접근이 제한된 페이지입니다. 권한을 승인받은 뒤 다시 시도해 주십시오.');
                    $location.path('/home');
                }   
            }
        });
    }
})();