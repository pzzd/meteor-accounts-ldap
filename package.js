Package.describe({
  name: 'pzzd:accounts-ldap',
  version: '0.0.1',
  summary: 'Accounts login handler for LDAP using ldapjs from npm',
  git: 'https://github.com/pzzd/meteor-accounts-ldap',
  documentation: 'README.md'
});


Package.onUse(function(api) {
  api.versionsFrom('1.0.3.1');

  api.use(['templating'], 'client');
  api.use(['typ:ldapjs@0.7.3'], 'server');

  api.use(['accounts-base', 'accounts-password'], 'server');

  api.addFiles(['ldap_client.js'], 'client');
  api.addFiles(['ldap_server.js'], 'server');

  api.export('LDAP','server');
//  api.export('LDAP_DEFAULTS', 'server');
});

