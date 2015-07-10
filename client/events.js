Meteor.subscribe("userData");

Template.ucLdapLogout.events({
  'click .ucLdap .logoutButton': function () {
    Meteor.logout();
  }
});

Template.ucLdapSearch.events({
  'submit .ucLdap .searchForm': function(event){

    var username = $(event.target).find('[name=username]').val(); 

    Meteor.call('ldapSearch', {username: username}, function (error, result){
      var searchResultsContainer = $('.ucLdap .searchResults');
      searchResultsContainer.empty();
      if (error) {
        searchResultsContainer.append('There is no user with username '+username+'.');
      }
      if (result) {
        $.each(result, function(index, value){
          searchResultsContainer.append(index+': '+value+'<br />');
        });
      }
    });
    return false;    
  }
});

Template.ucLdapLogin.events({
  'submit .ucLdap .loginForm': function(event){

    var username = $(event.target).find('[name=username]').val();
    var password = $(event.target).find('[name=password]').val();

    Meteor.loginWithLDAP(username, password, {
      searchResultsProfileMap: [
        {resultKey: 'givenName', profileProperty: 'firstname'}, 
        {resultKey: 'sn', profileProperty: 'lastname'}, 
        {resultKey: 'ucStudentID', profileProperty: 'ucid'},
        {resultKey: 'mail', profileProperty: 'email'},
        {resultKey: 'chicagoID', profileProperty: 'chicagoid'}
      ]        
    }, function(error) {
      if (error){
        $('.ucLdap .loginResults').empty().append('Login failed; try again.');
      } 
    }); 

    return false;    
  }
});