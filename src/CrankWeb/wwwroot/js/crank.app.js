/**
* Crank Beta
* Application definition
*/

var crankServiceApi = 'api/v1';

//constants for source panel event associations
var ASSIGNED_AS_ARTIST_MANAGER = 'artist_manager';
var ASSIGNED_AS_AGENCY = 'agent';
var ASSIGNED_AS_PROMOTER = 'promoter';
var ASSIGNED_AS_LABEL = 'label';
var ASSIGNED_AS_DIGITAL = 'digital';
var ASSIGNED_AS_SPONSOR = 'sponsor';

//Constants for User type
var USER_TYPE_ARTIST_MANAGER = 'artist_manager';
var USER_TYPE_RADIO_MANAGER = 'radio_manager';
var USER_TYPE_AGENT_MANAGER = 'agent';
var USER_TYPE_PROMOTER_MANAGER = 'promoter';
var USER_TYPE_RECORDLABEL_MANAGER = 'label';
var USER_TYPE_DIGITAL_MANAGER = 'digital';
var USER_TYPE_SPONSOR_MANAGER = 'sponsor';

var USER_TYPE_SUPERUSER = 'superuser';

var MODULE_TYPES = ['Promotion Module', 'Charting Module', 'Analytics Module', 'Messaging Module', 'Treemap Module', 'Street Team Module'];

// Token for activating the ajax calls, disable for testing
var IS_LIVE = true;
//,'colorpicker-dr'k
// Removed ng-animate for incompatibility
// https://github.com/angular/angular.js/issues/3613
var app = angular.module('crank_app', ['ngRoute', 'ngCookies', 'ui.bootstrap', 'ngIscroll', 'ngDragDrop', 'ngLeaflet', 'ng-sortable', 'ng-iscroll', 'ngSanitize', 'ngAnimate', 'ngImgCrop', 'mwl.confirm', 'ngImage', 'ngMaterial', 'colorpicker-dr']);

app.config(['$animateProvider', function ($animateProvider) {
    $animateProvider.classNameFilter(/crank-animate/);

}]);

app.run(['$rootScope', '$http', '$cookieStore', '$location', function ($rootScope, $httpProvider, $cookieStore, $location) {
    // Init
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';

    $rootScope.init = function () {
        $httpProvider.defaults.useXDomain = true;
        $rootScope.user_type_desc = '';
        $rootScope.module_wrappers = [];
    }

    $rootScope.init();

    //Reset  User Modules flag
    $rootScope.resetUserModuleFlag = function () {
        $rootScope.user_Has_Promotion_Module = false;
        $rootScope.user_Has_Charting_Module = false;
        $rootScope.user_Has_Analytics_Module = false;
        $rootScope.user_Has_Messaging_Module = false;
        $rootScope.user_Has_Treemap_Module = false;
        $rootScope.user_Has_Street_Team_Module = false;
    }

    // set transform css attribute
    $rootScope.setTransform = function (el, x, y, isPromotion) {
        var transformString;
        transformString = 'scale(.3) translateX(';
        transformString += x;
        transformString += 'px) translateY(';
        transformString += y;
        transformString += 'px) translateZ(0)';

        if (isPromotion) {
            el = el.querySelector('.promotion-wrapper');
        }

        el.style.webkitTransform = transformString;
        el.style.MozTransform = transformString;
        el.style.wmstTransform = transformString;
        el.style.OTransform = transformString;
        el.style.transform = transformString;
    }

    // Refresh  user modules from worker pages and while user loginin 
    $rootScope.refreshUserModules = function (modles) {
        $rootScope.module_wrappers = [];

        var indexOfPromotionModule = _.findIndex(modles, ['name', MODULE_TYPES[0]]);
        if (indexOfPromotionModule > -1) {
            $rootScope.user_Has_Promotion_Module = true;
            $rootScope.module_wrappers[indexOfPromotionModule] = 'user_Has_Promotion_Module';
        }

        var indexOfChartingModule = _.findIndex(modles, ['name', MODULE_TYPES[1]]);
        if (indexOfChartingModule > -1) {
            $rootScope.user_Has_Charting_Module = true;
            $rootScope.module_wrappers[indexOfChartingModule] = 'user_Has_Charting_Module';
        }

        var indexOfAnalyticsModule = _.findIndex(modles, ['name', MODULE_TYPES[2]]);
        if (indexOfAnalyticsModule > -1) {
            $rootScope.user_Has_Analytics_Module = true;
            $rootScope.module_wrappers[indexOfAnalyticsModule] = 'user_Has_Analytics_Module';
        }

        var indexOfMessagingModule = _.findIndex(modles, ['name', MODULE_TYPES[3]]);
        if (indexOfMessagingModule > -1) {
            $rootScope.user_Has_Messaging_Module = true;
            $rootScope.module_wrappers[indexOfMessagingModule] = 'user_Has_Messaging_Module';
        }

        var indexOfTreemapModule = _.findIndex(modles, ['name', MODULE_TYPES[4]]);
        if (indexOfTreemapModule > -1) {
            $rootScope.user_Has_Treemap_Module = true;
            $rootScope.module_wrappers[indexOfTreemapModule] = 'user_Has_Treemap_Module';
        }

        var indexOfStreetTeamModule = _.findIndex(modles, ['name', MODULE_TYPES[5]]);
        if (indexOfStreetTeamModule > -1) {
            $rootScope.user_Has_Street_Team_Module = true;
            $rootScope.module_wrappers[indexOfStreetTeamModule] = 'user_Has_Street_Team_Module';
        }
    }

    // set module wrappers
    $rootScope.refreshModules = function () {
        var startx1 = -1250, starty1 = -150;
        var startx2 = -200, starty2 = -150;
        var step = 350;

        for (var i = 0; i < $rootScope.module_wrappers.length; i++) {
            var isPromotion = false;
            var idName = '#' +  $rootScope.module_wrappers[i];
            
            if (idName === '#user_Has_Promotion_Module') {
                isPromotion = true;
            }

            var element = angular.element(document.querySelector(idName));

            if (i % 2 === 0) {
                var c = parseInt(i / 2, 10);
                $rootScope.setTransform(element[0], startx1, starty1 + c * step, isPromotion);
            } else {
                var c = parseInt(i / 2, 10);
                $rootScope.setTransform(element[0], startx2, starty2 + c * step, isPromotion);
            }
        }
    }

    $rootScope.regex = { numberOnly: /^\d+$/ };
    // Redirect if not logged
    $rootScope.checkUser = function () {

        //$rootScope.current_user = $cookieStore.get('current_user');
        //$rootScope.current_login_user = $cookieStore.get('current_login_user');
        console.log($rootScope.current_user);
        if (!$rootScope.current_user || !$rootScope.current_user.userType) {
            $location.path('/');
        }
    };

    $rootScope.clearModuleWrapper = function () {
        $rootScope.array_moduleWrapper = [];
    }

}]);


app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
    .when('/signin', {
        templateUrl: 'partials/landing_index.html',
        controller: 'signinFormCtrl'
    })
    .when('/register', {
        templateUrl: 'partials/landing_index.html',
        controller: 'registerFormCtrl'
    })
    .when('/register/:guid', {
        templateUrl: 'partials/landing_index.html',
        controller: 'registerFormCtrl',
    })
         .when('/register/:guid/:isdigital', {
             templateUrl: 'partials/landing_index.html',
             controller: 'registerFormCtrl',
         })
    .when('/register/confirm', {
        templateUrl: 'partials/landing_index.html',
        controller: 'confirmFormCtrl'
    })
    .when('/artist', {
        templateUrl: 'partials/artist_index.html',
        controller: 'artistCtrl',
        resolve: {
        }
    })
     .when('/label', {
         templateUrl: 'partials/artist_index.html',
         controller: 'artistCtrl',
         resolve: {
         }
     })
     .when('/radio', {
         templateUrl: 'partials/artist_index.html',
         controller: 'artistCtrl',
         resolve: {
         }
     })
     .when('/promoter', {
         templateUrl: 'partials/artist_index.html',
         controller: 'artistCtrl',
         resolve: {
         }
     })
    .otherwise({ redirectTo: '/signin' });
}]);

