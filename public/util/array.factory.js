(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .factory('arrayFactory', arrayFactory);
    
    function arrayFactory(){
        return {
            removeCidOf: removeCidOf,
            removeCidsOf: removeCidsOf,
            extractCidsOf: extractCidsOf
//            bindPCLinksWithPid: bindPCLinksWithPid,
//            bindImagesWithPid: bindImagesWithPid,
//            bindProblemsWithPid: bindProblemsWithPid
        };
        
        function removeCidOf(fromItems, cid) {
            var theIndex = fromItems.indexOf(cid);
            if(theIndex != -1){
                fromItems.splice(theIndex, 1);
            }
        }
        
        function removeCidsOf(fromItems, cids) {
            for(var i=0; i<cids.length; i++){
                removeCidOf(fromItems, cids[i]);
            }
        }
        
        function extractCidsOf(fromItems, extractCids) {
            var newItems = new Array();
            for(var i=0; i<extractCids.length; i++){
                if(fromItems.indexOf(extractCids[i]) != -1){
                    newItems.push(extractCids[i]);
                }
            }
            return newItems;
        }
    }
    
})();