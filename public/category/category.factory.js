(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .factory('categoryFactory', categoryFactory);
        
    categoryFactory.$inject = ['$q', 'dataFactory'];
    
    function categoryFactory($q, dataFactory) {
        
        var masterCategory = new Category(0, '', []);
        var rowCategories = [];
        var deferred = $q.defer();
                
        dataFactory.getCategories().then(function(response){
            rowCategories = response.data;
            makeCategoryTree(response.data);
            deferred.resolve({
                rowCategories: rowCategories,
                masterCategory: masterCategory
            });
        }, function(response){
            console.error(response);
        });
        
        return {
            addCategory: addCategory,
            getCategories: deferred.promise,
            insertCategory: insertCategory,
            deleteCategory: deleteCategory,
            getCategoryWithCid: getCategoryWithCid
        };
        
        function getCategories(onSuccess, onError) {
            dataFactory.getCategories().success(function(data){
                rowCategories = data;
                makeCategoryTree(data);
                onSuccess(masterCategory.categories);
            }).error(function(error){
                console.error(error);
                onError(error);
            });
        }
        
        function makeCategoryTree(data){
            for(var k=0; k<data.length; k++){
                var item = data[k];
                var paths = '';
                if(item.path){
                    console.log(item.path);
                    paths = JSON.parse(item.path);   
                }
                var theCategory = new Category(item.cid, item.name, paths);
                insertCategory(theCategory);
            }
        }
        
        function addCategory(name, path, successCallback, errorCallback) {
            var pathWithJSON = JSON.stringify(path);
            dataFactory.insertCategory({
                name: name, 
                path: pathWithJSON
            }).success(function(response){
                var theCategory = new Category(response.cid, name, path);
                insertCategory(theCategory);
                successCallback(response);
            }).error(function(response){
                errorCallback(response);
            });
        }
        
        function insertCategory(theCategory) {
            var parentCategory = getCategoryWithPath(theCategory.path);
            parentCategory.categories.push(theCategory);
        }
        
        function getCategoryWithPath(path) {
            if(path.length){
                var theCategory = masterCategory;
                for(var j=0; j<path.length; j++){

                    // find parent path
                    var parentId = path[j].cid;
                    for(var l=0; l<theCategory.categories.length; l++){
                        if(theCategory.categories[l].cid == parentId){
                            theCategory = theCategory.categories[l];

                            // last leaf
                            if(j == path.length -1){
                                return theCategory;
                            }
                            break;
                        }
                    }
                }   
            }else{
                return masterCategory;
            }
        }
        
        function deleteCategory(item, onSuccess, onError) {
            dataFactory.deleteCategory(item.cid).success(function(data){
                removeCategoryFromMasterCategory(item);
                onSuccess(data);
            }).error(function(error){
                onError(error);
            });
        }
        
        function removeCategoryFromMasterCategory(item) {
            var parentCategory = getCategoryWithPath(item.path);
            for(var i=0; i<parentCategory.categories.length; i++){
                if(parentCategory.categories[i].cid == item.cid){
                    parentCategory.categories.splice(i, 1);
                }
            }
        }
        
        function getCategoryWithCid(cid) {
            for(var i=0; i<rowCategories.length; i++){
                if(rowCategories[i].cid == cid){
                    return rowCategories[i];
                }
            }
            return null;
        }
    }
    
})();

function Category(cid, name, path) {
    this.cid = cid;
    this.name = name;
    this.path = path;
    this.selectedCategorySet = [];
    this.categories = [];
}