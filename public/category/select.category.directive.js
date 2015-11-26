(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .directive('selectCategory', selectCategory);
    
    function selectCategory(){
        return {
            restrict: 'E',
            templateUrl: 'category/select.category.html',
            scope: {
                type: '=',
                selections: '=',
                alters: '='
            },
            controller: selectCategoryController,
            controllerAs: 'selCateCtrl'
        };
    }
    
    selectCategoryController.$inject = ['$scope', 'categoryFactory', '$modal', 'arrayFactory'];
    
    function selectCategoryController($scope, categoryFactory, $modal, arrayFactory){
        $scope.categories = [];
        $scope.selections = [];
        categoryFactory.getCategories.then(function(data){
            $scope.categories = data.masterCategory.categories;
        }, function(data){
            alert('카테고리를 불러오지 못했습니다. 다시 시도해 주세요.');
        });

        $scope.addBroCategory = addBroCategory;
        $scope.addChildCategory = addChildCategory;
        $scope.deleteCategory = deleteCategory;
        $scope.selectCategory = selectCategory;
        $scope.isSelected = isSelected;
        $scope.clickedAddChildCategory = clickedAddChildCategory;
        $scope.clickedAddBroCategory = clickedAddBroCategory;
        
        function addBroCategory(item){
            var name = item.newBroCategoryName;

            categoryFactory.addCategory(name, item.path, function(response){
                item.newBroCategoryName = '';
                item.isCollapsed = !item.isCollapsed;
                alert('카테고리를 성공적으로 추가하였습니다.');
            }, function(error){
                alert('오류가 발생하였습니다. 다시 입력해 주세요.');
                throw error;
            });
        }
        
        function addChildCategory(item){
            var name = item.newChildCategoryName;
            var newPath = new Array();
            var pathSet = {
                cid: item.cid
            };
            angular.copy(item.path, newPath);
            newPath.push(pathSet);
            
            categoryFactory.addCategory(name, newPath, function(response){
                item.newChildCategoryName = '';
                item.isChildCollapsed = !item.isChildCollapsed;
                alert('카테고리를 성공적으로 추가하였습니다.');
            }, function(error){
                alert('오류가 발생하였습니다. 다시 입력해 주세요.');
                throw error;
            });
        }
        
        function deleteCategory(item){

            var checkModal = $modal.open({
                animation: true,
                templateUrl: 'category/modal.category.html',
                controller: 'CheckModalController',
                size: 'sm',
                resolve: {
                    item: function () {
                        return item;
                    }
                }
            });

            checkModal.result.then(function (selectedItem) {
                console.log('Check Modal Success');
            }, function () {
                console.log('Modal dismissed at: ' + new Date());
            });
        }
        
        function selectCategory(cid){
            var theIndex = $scope.selections.indexOf(cid);
             
            if(theIndex != -1){
                // already has category
                $scope.selections.splice(theIndex, 1);
                if($scope.alters){
                    arrayFactory.removeCidOf($scope.alters.new, cid);
                    arrayFactory.removeCidOf($scope.alters.delete, cid);
                    $scope.alters.delete.push(cid);    
                }

            }else{
                // not have category
                $scope.selections.push(cid);
                if($scope.alters){
                    arrayFactory.removeCidOf($scope.alters.delete, cid);
                    $scope.alters.new.push(cid);   
                }
            }
        }
        
        function isSelected(cid){
            return $scope.selections.indexOf(cid);
        }
        
        function clickedAddChildCategory(item){
            if(!item.nodeCollapsed){
                item.nodeCollapsed = !item.nodeCollapsed;
            }
            if(item.isCollapsed){
                item.isCollapsed = !item.isCollapsed;
            }
            item.isChildCollapsed = !item.isChildCollapsed; 
        }
        
        function clickedAddBroCategory(item){
            item.isCollapsed = !item.isCollapsed;
            if(item.isChildCollapsed){
                item.isChildCollapsed = !item.isChildCollapsed; 
            }
        } 
    }
    
})();