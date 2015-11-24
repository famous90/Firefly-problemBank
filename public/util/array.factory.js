(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .factory('arrayFactory', arrayFactory);
    
    function arrayFactory(){
        return {
            removeCidOf: removeCidOf,
            removeCidsOf: removeCidsOf,
            extractCidsOf: extractCidsOf,
            bindPCLinksWithPid: bindPCLinksWithPid,
            bindImagesWithPid: bindImagesWithPid,
            bindProblemsWithPid: bindProblemsWithPid
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
        
        function bindPCLinksWithPid(pcdata) {
            var pcLinkArray = new Array();
            var thePcSet = new PcSet();
            for(var i=0; i<pcdata.length; i++){
                var theData = pcdata[i];
                if(i == 0){
                    thePcSet.pid = theData.pid;
                }else if(theData.pid != thePcSet.pid){
                    pcLinkArray.push(thePcSet);
                    thePcSet = new PcSet();
                    thePcSet.pid = theData.pid;
                }
                thePcSet.cids.push(theData.cid);
                if(i == pcdata.length-1){
                    pcLinkArray.push(thePcSet);
                }
            }
            
            return pcLinkArray;
        }
        
        function bindImagesWithPid(imagedata) {
            var problemImageArray = new Array();
            var theImageSet = new ImageSet();
            if(imagedata.length){
                for(var i=0; i<imagedata.length; i++){
                    var theData = imagedata[i];
                    if(i == 0){
                        theImageSet.pid = theData.pid;
                    }else if(theData.pid != theImageSet.pid){
                        problemImageArray.push(theImageSet);
                        theImageSet = new ImageSet();
                        theImageSet.pid = theData.pid;
                    }
                    var theImageFile = new ImageFile(theData);
                    theImageSet.addImage(theImageFile);
                    if(i == imagedata.length-1){
                        problemImageArray.push(theImageSet);
                    }
                }
            }

            return problemImageArray;
        }
        
        function bindProblemsWithPid(problemData, pclinks, pImages) {
            var problems = new Array();
            for(var j=0; j<problemData.length; j++){
                var theProblem = new Problem(problemData[j]);
                theProblem.type = 'load';
                
                for(var i=0; i<pclinks.length; i++){
                    var theSet = pclinks[i];
                    if(theSet.pid == theProblem.pid){
                        theProblem.selections = theSet.cids;
                    }
                }

                if(pImages.length){
                    for(var i=0; i<pImages.length; i++){
                        var theSet = pImages[i];
                        if(theSet.pid == theProblem.pid){
                            theProblem.images = theSet;
                        }
                    }
                }

                problems.push(theProblem);
            }

            return problems;
        }
    }
    
})();

function PcSet (){
    this.pid;
    this.cids = new Array();
}

function ImageSet () {
    this.pid = {};
    this.questions = new Array();
    this.explanations = new Array();
}

ImageSet.prototype.addImage = addImage;

function addImage(data){
    if(data.imageType == 'question'){
        this.questions.push(data);
    }else if(data.imageType == 'explanation'){
        this.explanations.push(data);
    }
};

function Problem (){
        
    this.pid = '', this.question = '', this.answer = '', this.explanation = '', this.answerType = 'single', this.answerPlaceholder = '정답을 입력해 주세요', this.examples = [], this.notAnswerExamples = [];
    this.type = 'new';
    this.selections = new Array();
    this.alterSelections = {
        new: [],
        delete: [],
        exist: []
    };
    this.images = {
        questions: [],
        explanations: []
    };
    this.answerOfMultiple = 0;

    if(arguments.length){
        var data = arguments[0];
        this.pid = data.pid;
        this.question = data.question;
        this.answer = data.answer;
        this.explanation = data.explanation;
        this.answerType = data.answerType;
        this.setNotAnswerExamples(data.notAnswerExamples);
        if(data.type){
            this.type = data.type;
        }
        if(data.selections){
            this.selections = data.selections;
            for(var i=0; i<data.selections.length; i++){
                this.alterSelections.exist.push(data.selections[i]);
            }
        }
        if(data.images){
            this.images = data.images;
        }
    }else {
        this.setNotAnswerExamples('');
    }
}

Problem.prototype.setNotAnswerExamples = setNotAnswerExamples;
Problem.prototype.setExamples = setExamples;
Problem.prototype.insertAnswerToExamples = insertAnswerToExamples;

function setNotAnswerExamples(jsonExamples) {
    if(this.answerType == 'multiple'){
        this.answerPlaceholder = '정답인 보기를 입력해 주세요';
        this.notAnswerExamples = angular.fromJson(jsonExamples);
        this.setExamples();
    }else{
        this.notAnswerExamples = [{content:''}, {content:''}, {content:''}, {content:''}];
    }
};

function setExamples() {
    for(var i=0; i<this.notAnswerExamples.length; i++){
        this.examples.push(this.notAnswerExamples[i]);
    }
    this.insertAnswerToExamples();
};

function insertAnswerToExamples() {
    var countOfExamples = this.notAnswerExamples.length + 1;
    var answerIndex = Math.floor(Math.random() * countOfExamples);

    this.answerOfMultiple = answerIndex + 1;
    var answerExample = {
        content: this.answer,
        type: 'answer'
    };
    this.examples.splice(answerIndex, 0, answerExample);
}
