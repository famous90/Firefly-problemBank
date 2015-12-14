function Problem (data){
    this.pid = data.pid;
    this.question = data.question;
    this.answer = data.answer;
    this.explanation = data.explanation;
    this.categories = data.selections;
    this.newCategories = data.alterSelections.new;
    this.deleteCategories = data.alterSelections.delete;
    this.notAnswerExamples = JSON.stringify(data.notAnswerExamples);
    this.answerType = data.answerType;
}

module.exports = Problem;