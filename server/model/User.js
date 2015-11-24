function User (data){
    this.uid = data.uid;
    this.username = data.name;
    this.role = data.role;
}

module.exports = User;