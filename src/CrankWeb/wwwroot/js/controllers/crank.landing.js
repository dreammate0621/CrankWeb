/**
* Crank Landing page app
*
* Makes people register
* Choose beetweern artist / radio
* Choose beetween signin / register
* */

app.controller('signinFormCtrl', function ($scope, $http, $cookieStore, $location, $rootScope, crankService) {
    $scope.messages = [];
    $scope.current_view = 'signin';
    $scope.current_form = 'partials/landing_signin.html';

    /**
    * Submit the login form
    * */
    $scope.submitLogin = function (formValid) {
        if (!formValid) {
            //$scope.messages.push({ type: 'danger', msg: 'Failed to load user <strong>' + login.$error + '</strong> profile data. ' + error.errorMessage });
            return false;
        }
        // Call $parent because ng-include creates a new inner scope
        $scope.login_progress = true;
        crankService.users.loginUser($scope.login_username, $scope.login_password)
        .then(function (data) {
            //$cookieStore.put('current_user', data);
            $rootScope.current_user = data;
            $http.get(crankServiceApi + '/users/getById/' + $rootScope.current_user.id)
             .success(function (loginuserdata) {
                 $scope.login_progress = false;
                 //$cookieStore.put('current_login_user', loginuserdata);
                 $rootScope.current_login_user = loginuserdata;
                 if (loginuserdata.companyId) {
                     // Getting user comapny info
                     crankService.companies.getById(loginuserdata.companyId).then(function (result) {
                         if (result) {
                             var isCurrentUserCompanyAdmin = false
                             if (result.admins.length > 0) {
                                 // Checking current user is company admin or not 
                                 var isAdmin = _.findIndex(result.admins, function (item) { return item == $rootScope.current_login_user.id; });
                                 isCurrentUserCompanyAdmin = isAdmin > -1;
                             }
                             //$cookieStore.put('current_login_user_company_detail', result);
                             $rootScope.current_login_user_company_detail = result;
                             $rootScope.current_login_user_company_detail.isCompanyAdmin = isCurrentUserCompanyAdmin;

                         }
                     }).catch(function (error) {
                         console.log("Error loading user data" + error);
                         $scope.messages.push({ type: 'danger', msg: 'Failed to load user <strong>' + $scope.login_username + '</strong> profile data. ' + error.errorMessage });
                         $scope.login_progress = false;
                     })
                 }
                 // Getting Current User Modlues
                 if ($rootScope.current_login_user.modules.length > 0) {
                     crankService.modules.getByIds($rootScope.current_login_user.modules).then(function (result) {
                         // Reset all user modules flag
                         $rootScope.resetUserModuleFlag();
                         //  enable user modules
                         $rootScope.refreshUserModules(result);
                     })
                    .catch(function (error) { })
                 }

                 var currentUserType = $rootScope.current_user.userType.toLowerCase();
                 switch (currentUserType) {
                     case USER_TYPE_RADIO_MANAGER:
                         $location.path('/radio');
                         break;
                     case USER_TYPE_PROMOTER_MANAGER:
                         $location.path('/promoter');
                         break;

                     case USER_TYPE_RECORDLABEL_MANAGER:
                         $location.path('/label');
                         break;
                     default:
                         $location.path('/artist');
                         break;
                 }
             })
             .catch(function (error) {
                 //log error
                 console.log("Error loading user data" + error);
                 $scope.messages.push({ type: 'danger', msg: 'Failed to load user <strong>' + $scope.login_username + '</strong> profile data. ' + error.errorMessage });
                 $scope.login_progress = false;
             });
            //Get current user information
        })
        .catch(function (error) {
            // $scope.login_error = "There was an error loggin in, are you registered?";
            $scope.messages.push({ type: 'danger', msg: 'Login failed for <strong>' + $scope.login_username + '</strong>. ' + error.errorMessage });

            console.log(error);
            $scope.login_progress = false;
        });
        return false;
    };

    $scope.closeMessage = function closeMessage(index) {
        $scope.messages.splice(index, 1);
    }
});

app.controller('confirmFormCtrl', function ($scope, $http, $cookieStore, $location) {
    $scope.current_view = 'confirm';
    $scope.current_form = 'partials/landing_confirm.html';
});

app.controller('registerFormCtrl', function ($scope, $http, $location, $routeParams, $window, $timeout, crankService) {
    $scope.messages = [];
    $scope.current_view = 'register';
    $scope.current_form = 'partials/landing_register.html';
    $scope.companies = [];

    $scope.register_first_name = '';
    $scope.register_last_name = '';
    $scope.register_username = '';
    $scope.register_password = '';
    $scope.repeat_password = '';
    $scope.register_company_id = '';
    $scope.register_company_name = '';
    $scope.register_user_type = '' //USER_TYPE_ARTIST_MANAGER;//default
    $scope.register_selected_country = 'USA';//United states code
    $scope.register_guid = '';
    $scope.isDisableCompanyDrp = false;
    $scope.register_radio_Station_Id = '';
    $scope.searched_station_code_text = '';
    $scope.register_radio_Station = '';
    $scope.addNewCompany = false;

    $scope.userTypes = [{ value: USER_TYPE_ARTIST_MANAGER, text: ' ARTIST MANAGER' }, { value: USER_TYPE_AGENT_MANAGER, text: 'AGENT' }, { value: USER_TYPE_DIGITAL_MANAGER, text: 'DIGITAL' }, { value: USER_TYPE_RECORDLABEL_MANAGER, text: 'LABEL' }, { value: USER_TYPE_PROMOTER_MANAGER, text: 'PROMOTER' }, { value: USER_TYPE_RADIO_MANAGER, text: 'RADIO MANAGER' }];

    $scope.init = function init() {
        $scope.fetchCompanies();
        $scope.fetchCountries();
    }

    $scope.toggleAddnewCompany = function () {
        $scope.addNewCompany = !$scope.addNewCompany;
        $scope.register_company_id = '';
        $scope.register_company_name = '';
    }
    $scope.fetchCompanies = function () {

        crankService.companies.get('active')
       .then(function (data) {
           console.log("Retried companies information:" + data);
           var dbCompanies = _.map(data,
           function (companyObj) {
               return {
                   "id": companyObj.id,
                   "name": companyObj.name
               }
           });

           //Add empty company
           $scope.companies = dbCompanies;// _.concat([{ "id": '', 'name': 'Select Company' }], dbCompanies);
       },
        function (error) {
            console.log("Error ocurred during company information retrieval:" + error);
        });
    }
    $scope.getSearchedCompanies = function (val) {
        $scope.register_company_id = undefined;
        return crankService.companies.searchByName(val, 'active')
       .then(function (data) {
           console.log("Retried companies information:" + data);
           return _.map(data,
             function (companyObj) {
                 return {
                     "id": companyObj.id,
                     "name": companyObj.name
                 }
             });

       },
        function (error) {
            console.log("Error ocurred during company information retrieval:" + error);
        });
    }

    $scope.selectedCompany = function ($item, $model, $label) {
        if ($model) {
            $scope.register_company_id = $model.id;
        }

    }


    $scope.getSearchedStations = function (val) {
        // Storing callcode text when code not found in database
        $scope.searched_station_code_text = val;
        //Clear values
        $scope.isDisableCompanyDrp = false;
        $scope.register_radio_Station_Id = undefined;
        // Getting list of stations
        return crankService.stations.searchByCallcode(val, '').then(function (response) {
            console.log('Radio stations ' + response);
            return response;
        });


    };



    $scope.selectedRadioStation = function ($item, $model, $label) {

        //  Select company for station
        for (var i = 0; i < $scope.companies.length; i++) {
            if ($scope.companies[i].name == $model.owner) {
                $scope.register_company_id = $scope.companies[i].id;
                if ($scope.companies[i].name == $model.owner)
                    $scope.register_radio_Station_Id = $model.id;
                $scope.isDisableCompanyDrp = true;
            }
        }
    };
    //Get Country list
    //$http.get(crankServiceApi + '/geo/countries') for now getting the list of countries from geognos
    $scope.fetchCountries = function () {
        $http.get('/data/geonames_countries.json')
        .success(function (res) {
            $scope.register_country_list = res.geonames;
        })
        .error(function (res) {
            console.log(res);
        });
    };
    // filter countries as per search text
    $scope.filterCountries = function (val) {

        return _.take(_.filter($scope.register_country_list, function (country) { return _.startsWith(country.countryName.toLowerCase(), val.toLowerCase()); }), 10);

    };

    $scope.addCountryToUser = function ($item, $model, $label) {
        if ($model) {
            $scope.register_selected_country = $model.isoAlpha3;
        }

    }
    //Submit register form
    $scope.submitRegister = function submitRegister(valid) {
        if ($scope.register_password != $scope.repeat_password) {
            console.log("Passwords don't match.");
            $scope.messages.push({ type: 'danger', msg: 'Passwords don\'t match.' });
            return false;
        }
        var userData = {
            "userId": $scope.register_username,
            "password": $scope.register_password,
            "email": $scope.register_username,
            "firstName": $scope.register_first_name,
            "lastName": $scope.register_last_name,
            "userType": $scope.register_user_type,
            "companyName": $scope.register_company_id == undefined || $scope.register_company_id == '' ? $scope.register_company_name : '',
            "companyId": $scope.register_company_id == undefined ? '' : $scope.register_company_id,
            "stationId": $scope.register_user_type == 'radio_manager' ? $scope.register_radio_Station_Id == undefined || $scope.register_radio_Station_Id == '' ? $scope.searched_station_code_text : $scope.register_radio_Station_Id : ''
        };
      
        if (!angular.isUndefined($routeParams.guid) && !angular.isUndefined($routeParams.isdigital))
        {

            //digital invite registration
            crankService.users.registerDigitalInvite($routeParams.guid,$routeParams.isdigital, userData)
            .then(function () {
              
                console.log("User registration success, redirecting to sign in page");
                $scope.messages.push({ type: 'success', msg: 'User ' + $scope.register_username + ' registration complete. Redirecting to sign in page to continue!' });
                $timeout(function () {
                    $location.path('/signin')
                }, 5000)
            }).catch(function () {
                console.log("Error ocurred during company information retrieval:" + error);
                $scope.messages.push({ type: 'danger', msg: 'Failed to register ' + $scope.register_username + '. ' + error.data.errorMessage });
            });

        }
        else if (!angular.isUndefined($routeParams.guid)) {
            //Invite registraion
            crankService.users.registerInvite($routeParams.guid, userData)
            .then($scope.userRegistraionSuccess, $scope.userRegistraionError);
        }
        else {
            //Regular registration
          
            crankService.users.registerUser(userData)
              .then($scope.userRegistrationSuccess, $scope.userRegistrationError);
        }
    };

    $scope.userRegistrationSuccess = function userRegistrationSuccess(response) {
       
        console.log("User registration success, redirecting to sign in page");
        $scope.messages.push({ type: 'success', msg: 'User ' + $scope.register_username + ' registration complete. Redirecting to sign in page to continue!' });
        $timeout(function () {
            $location.path('/signin')
        }, 5000);
    };

    $scope.userRegistrationError = function userRegistrationError(error) {
        console.log("Error ocurred during company information retrieval:" + error);
        $scope.messages.push({ type: 'danger', msg: 'Failed to register ' + $scope.register_username + '. ' + error.data.errorMessage });

    };

    $scope.closeMessage = function closeMessage(index) {
        $scope.messages.splice(index, 1);
    }

    $scope.init();
    // Refresh company on register type change
    $scope.$watch('register_user_type', function () {
        $scope.register_company_id = '';
        $scope.register_company_name = '';
        $scope.register_radio_Station_Id = '';
        $scope.register_radio_Station = '';
        $scope.addNewCompany = false;

    });
});


