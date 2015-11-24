describe('making a category', function() {
    it('logs in and creates a new category', function() {
        browser.get('http://127.0.0.1:3001/')
        
        var category = 'new Category'
        element(by.model('item.newBroCategoryName')).sendKeys(category)
        element(by.css('form .btn')).click()
    })
})