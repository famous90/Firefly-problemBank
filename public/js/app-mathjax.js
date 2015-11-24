(function(){
    'use strict';
    
    var app = angular.module('math', []);
    
    app.directive('mathjaxBind',function(){
        return {
            restrict: 'EA',
            controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
                $scope.$watch($attrs.mathjaxBind, function (expression) {
                    $element.html(expression);
                    MathJax.Hub.Queue(['Typeset', MathJax.Hub, $element[0]]);
                });
            }]
        };
    });
})();