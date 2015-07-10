Meteor Package accounts-ldap-uchicago
============================

This is a fork of typ90/meteor-accounts-ldap, and modified to work specifically with the University of Chicago LDAP service.


Installation
------------

Clone this repo and copy it to `/packages` in your Meteor project.


Usage
-----

#### Server Side Configuration
The package exposes a global variable called `LDAP_DEFAULTS` on the server side. Most defaults are already set in order to work with UChicago's LDAP.

##### Defaults

`LDAP_DEFAULTS.createNewUser`: Boolean value with a default of `true`. This will create a new Meteor.user if the user has not yet been created with the entered ldap email/username.

`LDAP_DEFAULTS.searchResultsProfileMap`: This can be used if there are attributes at your specified dn that you'd like to use to set properties when creating a new user's profile. 

For example, if the results had a 'cn' value of the user's name and a 'tn' value of their phone number, you'd set the `searchResultsProfileMap` to this:

```
LDAP_DEFAULTS.searchResultsProfileMap = [{
  resultKey: 'cn',
  profileProperty: 'name'
}, {
  resultKey: 'tn',
  profileProperty: 'phoneNumber'
}],

// This would create a user profile object that looks like this:
user.profile = {
    name: 'Whatever the cn value was',
    phoneNumber: 'Whatever the tn value was'
}
```


#### Client Side Configuration

The package exposes a new Meteor login method `Meteor.loginWithLDAP()` which can be called from the client. The package also includes templates and events to handling login, logout and LDAP search. For default behavior, you will only have to use the default templates.

```
<head>
  <title>ldap-login</title>
</head>

<body>
  <h1>Welcome to Meteor!</h1>

  {{#with currentUser}}
    {{> ucLdapLogout}}
    {{> ucLdapSearch}}
  {{else}}
    {{> ucLdapLogin}}
  {{/with}}

</body>
```

To override the default template/event behavior, make your own template and call your own events. See client/events.js for example code. 


Issues + Notes
-----

From typ90/meteor-accounts-ldap:

* ***Because the package binds/authenticates with LDAP server-side, the user/password are sent to the server unencrypted. I still need to figure out a solution for this.***

* Right now Node throws a warning on meteor startup: `{ [Error: Cannot find module './build/Debug/DTraceProviderBindings'] code: 'MODULE_NOT_FOUND' }` because optional dependencies are missing. It doesn't seem to affect the ldapjs functionality, but I'm still trying to figure out how to squelch it. See [this thread](https://github.com/mcavage/node-ldapjs/issues/64).


