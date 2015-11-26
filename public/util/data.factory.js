(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .factory('dataFactory', dataFactory);
    
    dataFactory.$inject = ['$http', 'Upload'];
    
    function dataFactory($http, Upload){
        return {
            authenticate: authenticate,
            createUser: createUser,
            getUsers: getUsers,
            getCategories: getCategories,
            insertCategory: insertCategory,
            deleteCategory: deleteCategory,
            insertProblem: insertProblem,
            getProblems: getProblems,
            updateProblem: updateProblem,
            deleteProblem: deleteProblem
        };
        
        
        // login
        function authenticate(credentials){
            return $http.post('/api/authenticate', credentials);
        }
        
        
        // user
        function createUser(user){
            return $http.post('/api/users', user);
        }
        
        function getUsers(user){
            return $http.get('/api/users');
        }
        
        
        // category
        function getCategories() {
            return $http.get('/categories');
        }
        
        function insertCategory(item) {
            return $http.post('/category', {
                name: item.name, 
                path: item.path
            });
        }
        
        function deleteCategory(cid) {
            return $http.delete('/category/'+cid);
        }
        
        
        // problem
        function insertProblem(problem, images, imageNames) {
            return Upload.upload({
                url: '/problem',
                method: 'POST',
                headers: {
                    'Content-Type': undefined
                },
                data: {
                    problem: problem
                },
                file: images,
                fileFormDataName: imageNames
            });
        }
        
        function getProblems(categories, count){
            console.log(categories);
            return $http.post('/load_problems', {
                categories: categories, 
                problemNumber: count
            });
        }
        
        function updateProblem(pid, problem, images, imageNames) {
            return Upload.upload({
                url: '/problem/'+pid,
                method: 'PUT',
                headers: {
                    'Content-Type': undefined
                },
                data: {
                    problem: problem
                },
                file: images,
                fileFormDataName: imageNames
            });
        }
        
        function deleteProblem(pid) {
            return $http.delete('/problem/'+pid);
        }
    }
    
})();