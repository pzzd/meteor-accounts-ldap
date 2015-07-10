Package.describe({
  name: 'pzzd:accounts-ldap',
  version: '0.0.1',
  summary: 'Accounts login handler for University of Chicago LDAP using ldapjs from npm',
  git: 'https://github.com/pzzd/meteor-accounts-ldap-uchicago',
  documentation: 'README.md'
});


Package.onUse(function(api) {
  api.versionsFrom('1.0.3.1');

  api.use(['templating'], 'client');
  api.use(['typ:ldapjs@0.7.3'], 'server');
  api.use(['accounts-base', 'accounts-password'], 'server');

  api.addFiles([
    'client/templates.html',
    'client/events.js',
    'client/ldap.js',
    'client/styles.css',
  ], 'client');

  api.addFiles([
    'server/ldap.js',
    'server/meteor-methods.js'], 'server');

  api.export('LDAP','server');
});

