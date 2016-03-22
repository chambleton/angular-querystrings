// Fork from https://github.com/bennadel/JavaScript-Demos/blob/master/demos/ng-query-string-zone/index.htm

'use strict';
(function(){

    var angularQueryStrings = angular.module('angularQueryStrings',[]);   
    
        // I work in conjunction with the ngQueryStringZone directive to define the merge
		// algorithm used to integrate the zone-oriented query string params.
		angularQueryStrings.directive(
			"bnDemoZone",
			function bnDemoZoneDirective() {
				// Return the directive configuration object. 
				// --
				// NOTE: We require the ngQueryStringZone directive controller. 
				return({
					link: link,
					require: "ngQueryStringZone",
					restrict: "A"
				});
				// I bind the JavaScript events to the view-model.
				function link( scope, element, attributes, zoneController ) {
					// The whole point of this directive is manage the way the zone-based
					// query string params are integrated into the existing URL. Just 
					// like the normal $location.search() method, we can set params to 
					// [null] in order to remove them URL.
					zoneController.merge = function( search, params, originalMerge ) {
						// To demonstrate how this differs from the default zone behavior,
						// we'll set the values to "default" rather than "null.
						search.A = "default";
						search.B = "default";
						search.C = "default";
						// Hand-off to the original merge algorithm.
						originalMerge( search, params );
					};
				}
			}
		);
		// --------------------------------------------------------------------------- //
		// --------------------------------------------------------------------------- //
		// I define a "zone" within the application that will help manage the integration
		// of query string parameters into the existing URL for the generation of HREFs.
		// If the directive is provided with an array of keys, it will "nullify" those 
		// keys before it performs the integration.
		angularQueryStrings.directive(
			"ngQueryStringZone",
			function ngQueryStringZoneDirective() {
				// Return the directive configuration object. 
				return({
					controller: ZoneController,
					link: link,
					require: "ngQueryStringZone",
					restrict: "A"
				});
				// I provide an API that can be overridden by a sibling directive that
				// wants to supply a custom merge() method.
				function ZoneController() {
					return({
						merge: null
					});
					
				}
				// I bind the JavaScript events to the view-model.
				function link( scope, element, attributes, zoneController ) {
					// If we were not provided with an expression to watch, there's no 
					// way for us to provide a merge algorithm.
					if ( ! attributes.ngQueryStringZone ) {
						
						return;
					}
					// Watch the collection of keys. If it changes, we need to redefine 
					// the merge algorithm to use.
					scope.$watchCollection( 
						attributes.ngQueryStringZone,
						function defineCustomMerge( keys ) {
							zoneController.merge = function( search, params, originalMerge ) {
								// Set all the given keys to null before we pass control
								// back to the original merge algorithm. This will prevent
								// not-explicitly-provided params from showing up in the 
								// generated URL.
								for ( var i = 0, length = keys.length ; i < length ; i++ ) {
									search[ keys[ i ] ] = null;
								}
								originalMerge( search, params );
							};
						}
					);
				}
			}
		);
		// I observe the given query string subset and generate a full HREF attribute
		// that merges the given subset into the existing location.
		angularQueryStrings.directive(
			"ngQueryString",
			function ngQueryStringDirective( $location ) {
				// Return the directive configuration object. 
				return({
					link: link,
					require: "^?ngQueryStringZone",
					restrict: "A"
				});
				// I bind the JavaScript events to the view-model.
				function link( scope, element, attributes, zoneController ) {
					// Whenever the attribute or the location changes, we need to 
					// recalculate the HREF for this element.
					attributes.$observe( "ngQueryString", updateHref );
					scope.$on( "$locationChangeStart", updateHref );
					// I update the HREF attribute, integrating the current query string
					// substring into the existing location.
					function updateHref() {
						var search = angular.copy( $location.search() );
						var params = parseQueryString( attributes.ngQueryString );
						// If we have a zoneController, use the merge-override.
						if ( zoneController && zoneController.merge ) {
							zoneController.merge( search, params, merge );
						} else {
							merge( search, params );
						}
						// Update the element HREF to use the integrated URL.
						attributes.$set( 
							"href",
							buildUrl( $location.path(), search, $location.hash() )
						);
					}
				}
				// ---
				// STATIC METHODS.
				// ---
				// I build a valid URL using the given components.
				function buildUrl( path, search, hash ) {
					var url = ( "#" + path );
					var newQueryString = [];
					for ( var key in search ) {
						// In order to given the "zone" an opportunity to delete query
						// params, we're going to skip over any value that is explicitly
						// set to [null].
						if ( search[ key ] === null ) {
							continue;
						}
						newQueryString.push( key + "=" + search[ key ] );
					}
					if ( newQueryString.length ) {
						url += ( "?" + newQueryString.join( "&" ) );
					}
					if ( hash ) {
						url += ( "#" + hash );
					}
					return( url );
				}
				// I merge the given query params into the given search params.
				function merge( search, params ) {
					for ( var key in params ) {
						search[ key ] = params[ key ];
					}
				}
				// I parse the given query string into a set of key-value pairs.
				function parseQueryString( queryString ) {
					var parsed = {};
					var pairs = queryString.split( "&" );
					for ( var i = 0, length = pairs.length ; i < length ; i++ ) {
						var parts = pairs[ i ].split( "=" );
						if ( parts.length === 1 ) {
							parts[ 1 ] = true;
						}
						parsed[ parts[ 0 ] ] = parts[ 1 ];
					}
					return( parsed );
				}
			}
		);
    module.exports = angularQueryStrings;
})();
