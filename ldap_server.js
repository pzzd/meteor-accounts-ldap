Future = Npm.require('fibers/future');

LDAP_DEFAULTS = {
	createNewUser: true,
	searchResultsProfileMap: false
};

URL = 'ldaps://ldap.uchicago.edu';
PORT = '636';
DN_BASE = 'uid=[uid],ou=People,dc=uchicago,dc=edu';
DOMAIN = 'uchicago.edu';
LDAP_ATTRIBUTES = [
	'ucStudentID',
	'uid',
	'cn',
	'chicagoID',
	'eduPersonAffiliation',
	'eduPersonPrimaryAffiliation',
	'givenName',
	'ucMiddleName',
	'sn',
	'gecos',
	'ucNameSuffix',
	'telephoneNumber',
	'homePhone',
	'ucPermanentTelephoneNumber',
	'ucOfficeTelephoneNumber',
	'postalAddress',
	'homePostalAddress',
	'ucPermanentPostalAddress',
	'ucOfficePostalAddress',
	'labeledURI',
	'mail',
	'mailRoutingAddress',
	'mobile',
	'ou',
	'pager',
	'title',
	'ucAppointment',
	'ucCurriculum',
	'ucDepartment',
	'eduPersonNickname'];

/**
 @class LDAP
 @constructor
 */
 LDAP = function(options) {
	options = options || {};

	// set default profile fields
	LDAP_DEFAULTS.searchResultsProfileMap = [];
	for (var i = 0; i < LDAP_ATTRIBUTES.length; i++) {
		var map = {resultKey: LDAP_ATTRIBUTES[i], profileProperty: LDAP_ATTRIBUTES[i]};
		LDAP_DEFAULTS.searchResultsProfileMap.push(map);
	}
	LDAP_DEFAULTS.searchResultsProfileMap.push({resultKey:'givenName', profileProperty: 'firstname'});
	LDAP_DEFAULTS.searchResultsProfileMap.push({resultKey:'sn', profileProperty: 'lastname'});

	// Set options
	this.options = _.defaults(options, LDAP_DEFAULTS);

	// Because NPM ldapjs module has some binary builds,
	// We had to create a wraper package for it and build for
	// certain architectures. The package typ:ldap-js exports
	// "MeteorWrapperLdapjs" which is a wrapper for the npm module
	this.ldapjs = MeteorWrapperLdapjs;

	return this;
};


/**
 * Make a valid dn
 *
 * @method makeDn
 *
 * @param {Object} options  Object with uid
 */
LDAP.prototype.makeDn = function(options) {
	options = options || {};

	if (!options.hasOwnProperty('uid') ) {
		throw new Meteor.Error(403, "Missing uid for making LDAP dn");
	}

	return DN_BASE.replace('[uid]',options.uid);
};

LDAP.prototype.makeClient = function(){
	var client = this.ldapjs.createClient({
		url: URL + ':' + PORT
	});
	return client;
};

/**
 * Attempt to bind (authenticate) ldap
 * and perform a dn search if specified
 *
 * @method bind
 *
 * @param {Object} options  Object with username, ldapPass and overrides for LDAP_DEFAULTS object
 */
LDAP.prototype.bind = function(options) {
	var self = this;

	options = options || {};

	if (options.hasOwnProperty('username') && options.hasOwnProperty('ldapPass')) {

		var ldapAsyncFut = new Future();

		var fullUrl = URL + ':' + PORT;
		var client = self.ldapjs.createClient({
			url: fullUrl
		});

		var username = options.username;
		var dn = self.makeDn({'uid':username});

		client.bind(dn, options.ldapPass, function(err, res) {
			if (err) {
				throw new Meteor.Error(err.code, err.message);
			} 

			try {
				var retObject = {
					username: username,
					searchResults: null
				};

				retObject.email = DOMAIN ? username + '@' + DOMAIN : false;
				ldapAsyncFut.return(retObject);
				
			} catch (e) {
				ldapAsyncFut.return({
					error: e
				});
			}
		});

		return ldapAsyncFut.wait();

	} else {
		throw new Meteor.Error(403, "Missing LDAP Auth Parameter");
	}

};

/**
 * Attempt to bind (authenticate) ldap
 * and perform a dn search if specified
 *
 * @method search
 *
 * @param {Object} options  Object with username
 */
LDAP.prototype.search = function(options, callback) {
	var self = this;

	options = options || {};

	if (!options.hasOwnProperty('username')) {
		callback('Missing LDAP Search Parameter',null);
	}

	var client = self.makeClient();

	var dn = self.makeDn({'uid':options.username});

	client.search(dn, {}, function(error, result, next) {

		var entryObject = {};

		result.on('searchEntry', function(entry) {
			entryObject = entry.object;
		});

		result.on('error', function(e){
			callback (e, null);
		});

		result.on('end', function(result){
			if (result.status){
				callback(result.errorMessage, null);
			} else {
				callback(null, entryObject);
			}
		});

	});
};



// Register login handler with Meteor
// Here we create a new LDAP instance with options passed from
// Meteor.loginWithLDAP on client side
// @param {Object} loginRequest will consist of username, ldapPass, ldap, and ldapOptions
Accounts.registerLoginHandler("ldap", function(loginRequest) {
	// If "ldap" isn't set in loginRequest object,
	// then this isn't the proper handler (return undefined)
	if (!loginRequest.ldap) {
		return undefined;
	}

	// Instantiate LDAP with options
	var userOptions = loginRequest.ldapOptions || {};
	var ldapObj = new LDAP(userOptions);

	// Call bind and get response
	var ldapBind = ldapObj.bind(loginRequest);

	if (ldapBind.error) {
		return {
			userId: null,
			error: ldapBind.error
		}
	} else {
		// Set initial userId and token vals
		var userId = null;
		var stampedToken = {
			token: null
		};

		// Look to see if user already exists
		var user = Meteor.users.findOne({
			username: ldapBind.username
		});

		// Login user if they exist
		if (user) {
			userId = user._id;

			// Create hashed token so user stays logged in
			stampedToken = Accounts._generateStampedLoginToken();
			var hashStampedToken = Accounts._hashStampedToken(stampedToken);
			// Update the user's token in mongo
			Meteor.users.update(userId, {
				$push: {
					'services.resume.loginTokens': hashStampedToken
				}
			});
		}
		// Otherwise create user if option is set
		else if (ldapObj.options.createNewUser) {
			var userObject = {
				username: ldapBind.username
			};
			// Set email
			if (ldapBind.email) userObject.email = ldapBind.email;

			// Set profile values if specified in searchResultsProfileMap
			if (ldapObj.options.searchResultsProfileMap.length > 0) {
				var ldapSearch = ldapObj.search(loginRequest);

				var profileMap = ldapObj.options.searchResultsProfileMap;
				var profileObject = {};

				// Loop through profileMap and set values on profile object
				for (var i = 0; i < profileMap.length; i++) {
					var resultKey = profileMap[i].resultKey;

					// If our search results have the specified property, set the profile property to its value
					if (ldapSearch.searchResults.hasOwnProperty(resultKey)) {
						profileObject[profileMap[i].profileProperty] = ldapSearch.searchResults[resultKey];
					}

				}
				// Set userObject profile
				userObject.profile = profileObject;
			}


			userId = Accounts.createUser(userObject);
		} else {
			// Ldap success, but no user created
			return {
				userId: null,
				error: "LDAP Authentication succeded, but no user exists in Mongo. Either create a user for this email or set LDAP_DEFAULTS.createNewUser to true"
			};
		}

		return {
			userId: userId,
			token: stampedToken.token
		};
	}

	return undefined;
});