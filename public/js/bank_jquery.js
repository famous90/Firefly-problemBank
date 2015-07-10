$(document).ready(function() {
    $('.text').keydown(function() {
        var message = $("textarea").val();
        if (event.keyCode == 13) {
            $("textarea").val('');
            return false;
        }
    });
    
    $('.mathstring').text(function(){
        var string = this;
        string.replace(/['"]+/g, '');
        this = string;
    });
});

