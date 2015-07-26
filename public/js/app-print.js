(function(){
    
    var app = angular.module('print', []);
    
    app.constant('printConstant', {
        a4width: 210,
        a4height: 297
    });
    
    app.factory('printFactory', ['printConstant', function(printConstant){
        
        var string = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus id eros turpis. Vivamus tempor urna vitae sapien mollis molestie. Vestibulum in lectus non enim bibendum laoreet at at libero. Etiam malesuada erat sed sem blandit in varius orci porttitor. Sed at sapien urna. Fusce augue ipsum, molestie et adipiscing at, varius quisenim. Morbi sed magna est, vel vestibulum urna. Sed tempor ipsum vel mi pretium at elementum urna tempor. Nulla faucibus consectetur felis, elementum venenatis mi mollis gravida. Aliquam mi ante, accumsan eu tempus vitae, viverra quis justo. Proin feugiat augue in augue rhoncus eu cursus tellus laoreet. Pellentesque eu sapien at diam porttitor venenatis nec vitae velit. Donec ultrices volutpat lectus eget vehicula. Nam eu erat mi, in pulvinar eros. Mauris viverra porta orci, et vehicula lectus sagittis id. Nullam at magna vitae nunc fringilla posuere. Duis volutpat malesuada ornare. Nulla in eros metus. Vivamus a posuere libero';
        
        function printProblem(data){
            var doc = new jsPDF();
            var verticalOffset = 25;
            var horizontalOffset = 20;
            var textSplitOffset = 20;
            
            // top horizontal line
            doc.setLineWidth(0.3);
            doc.line(horizontalOffset, verticalOffset, printConstant.a4width-horizontalOffset, verticalOffset); 
            
            // center vertical line
            doc.setLineWidth(0.1);
            doc.line(printConstant.a4width/2, verticalOffset, printConstant.a4width/2, printConstant.a4height-verticalOffset); 
            
            // bottom horizontal line
            doc.setLineWidth(0.3);
            doc.line(horizontalOffset, printConstant.a4height-verticalOffset, printConstant.a4width-horizontalOffset, printConstant.a4height-verticalOffset); 
            
//            var lines = doc.setFontSize(10).splitTextToSize(string, (printConstant.a4width-textSplitOffset)/2-horizontalOffset);
//            doc.text(horizontalOffset, verticalOffset, lines);
            
            var specialElementHandlers = {
                '#bypassme': function(element, renderer){
                    return true
                }
            }
            
            margins = { top: 0, bottom: 0, left: 20, width: (printConstant.a4width/2-horizontalOffset) };
            doc.fromHTML(
                data[0] // HTML string or DOM elem ref.
                , verticalOffset // x coord
                , horizontalOffset // y coord
                , {
                    'width': ((printConstant.a4width)/2-horizontalOffset) // max width of content on PDF
                    , 'elementHandlers': specialElementHandlers
                },
                function (dispose) {
                    doc.save('Test.pdf');
                },
                margins
            )
            
//            doc.save('Test.pdf');
        };
        
        return{
            printProblem: printProblem    
        };
        
    }]);
    
})();