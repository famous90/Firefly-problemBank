(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .constant('USER_ROLES', {
        all: '*',
        admin: 'admin',
        editor: 'editor',
        user: 'user',
        guest: 'guest'
    });
})();