
function Problem (){
        
    this.pid = '', this.question = '', this.answer = '', this.explanation = '', this.answerType = 'single', this.answerPlaceholder = '정답을 입력해 주세요', this.examples = [], this.notAnswerExamples = [];
    this.type = 'new';
    this.selections = [];
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
        if(data.selections && data.selections.length){
            this.selections = angular.copy(data.selections);
            this.alterSelections.exist = angular.copy(data.selections);
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
Problem.prototype.changeAnswerType = changeAnswerType;
Problem.prototype.addImage = addImage;

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

function changeAnswerType(){
    if(this.answerType == 'single'){
        this.answerType == 'multiple';
        this.answerPlaceholder = '정답인 보기를 입력해 주세요';        
    }else {
        this.answerType == 'single';
        this.answerPlaceholder = '정답을 입력해 주세요';        
    }  
};

function addImage(data){
    if(data.imageType == 'question'){
        this.images.questions.push(data);
    }else if(data.imageType == 'explanation'){
        this.images.explanations.push(data);
    }   
}
