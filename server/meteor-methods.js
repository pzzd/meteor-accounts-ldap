Meteor.methods({
  ldapSearch: function(options){
    this.unblock();
    var ldap = new LDAP;

    result = ldap.search(options);
    if (result.error){
      throw new Meteor.Error('1',result.error);
      return false;
    }
        
    return result;
  }

});