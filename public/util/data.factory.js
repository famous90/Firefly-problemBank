(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .factory('dataFactory', dataFactory);
    
    dataFactory.$inject = ['$http', 'Upload', '$rootScope'];
    
    function dataFactory($http, Upload, $rootScope){
        return {
            setHeaderAuthorization: setHeaderAuthorization,
            authenticate: authenticate,
            deleteAuthorization: deleteAuthorization,
            createUser: createUser,
            getUsers: getUsers,
            alterUsers: alterUsers,
            getCategories: getCategories,
            insertCategory: insertCategory,
            deleteCategory: deleteCategory,
            insertProblem: insertProblem,
            insertProblemsWithExcel: insertProblemsWithExcel,
            getProblems: getProblems,
            updateProblem: updateProblem,
            deleteProblem: deleteProblem,
            getStartProblemToSolve: getStartProblemToSolve,
            getProblemToSolveWithLastIsCorrect: getProblemToSolveWithLastIsCorrect,
            recharge: recharge
        };
        
        // http header
        function setHeaderAuthorization(authdata){
            $http.defaults.headers.common['Authorization'] = 'Basic';   // jshint ignore:line  
        };
        
        
        // login
        function authenticate(credentials){
            return $http.post('/api/authenticate', credentials);
        }
        
        function deleteAuthorization(uid){
            return $http.delete('/api/authorization/' + uid);
        }
        
        
        // user
        function createUser(user){
            return $http.post('/api/user/create', user);
        }
        
        function updateUser(uid, newUser){
            return $http.put('/api/user/'+uid, newUser);
        }
        
        function getUsers(){
            return $http.post('/api/users', {
                uid: $rootScope.globals.currentUser.uid, 
                authkey: $rootScope.globals.currentUser.authkey
            });
        }
        
        function alterUsers(users){
            return $http.post('/api/users/alter', {
                users: users,
                authUser: $rootScope.globals.currentUser
            });
        }
        
        // category
        function getCategories() {
            return $http.get('/categories');
        }
        
        function insertCategory(item) {
            return $http.post('/api/category/create', {
                name: item.name, 
                path: item.path,
                uid: $rootScope.globals.currentUser.uid,
                authkey: $rootScope.globals.currentUser.authkey
            });
        }
        
        function deleteCategory(cid) {
            return $http.post('/api/category/delete', {
                cid: cid,
                uid: $rootScope.globals.currentUser.uid,
                authkey: $rootScope.globals.currentUser.authkey
            });
        }
        
        
        // problem
        function insertProblem(problem, images, imageNames) {
            return Upload.upload({
                url: '/api/problem/create',
                method: 'POST',
                data: {
                    problem: problem,
                    user: $rootScope.globals.currentUser
                },
                file: images,
                fileFormDataName: imageNames
            });
        }
        
        function insertProblemsWithExcel(file, categories){
            return Upload.upload({
                url: '/api/problem/create/excel',
                method: 'POST',
                data: { 
                    categories: categories,
                    user: $rootScope.globals.currentUser 
                },
                file: file
            });
        }
        
        function getProblems(categories, numberOfProblems){
            console.log(categories);
            return $http.post('/load_problems', {
                categories: categories, 
                numberOfProblems: numberOfProblems
            });
        }
        
        function updateProblem(pid, problem, images, imageNames) {
            return Upload.upload({
                url: '/problem/'+pid,
                method: 'PUT',
                data: {
                    problem: problem,
                    user: $rootScope.globals.currentUser
                },
                file: images,
                fileFormDataName: imageNames
            });
        }
        
        function deleteProblem(pid) {
            return $http.post('/api/problem/delete', {
                pid: pid,
                user: $rootScope.globals.currentUser
            });
        }
        
        
        // solve problem
        function getStartProblemToSolve(cid){
            return $http.post('/api/problem/solve/start', {
                cid: cid,
                user: $rootScope.globals.currentUser
            });
        }
        
        function getProblemToSolveWithLastIsCorrect(isCorrect, pid, tdiff){
            return $http.post('/api/problem/solve', {
                solveInfo: {
                    pid: pid,
                    isCorrect: isCorrect,
                    timeDifference: tdiff
                },
                user: $rootScope.globals.currentUser
            });
        }
        
        
        // payment
        function recharge(amount){
            return $http.post('/api/recharge', {
                user: $rootScope.globals.currentUser,
                amount: amount
            });
        }
    }
    
})();