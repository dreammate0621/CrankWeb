app.controller('workerPageCtrl', function ($rootScope, $scope, $http, $uibModal, $timeout, $window, $cookieStore, crankService) {
    $rootScope.checkUser();
    $scope.currentSelectedModule = '';

    // sortable drag and drop config for worker page tabs

    $scope.sortableOutNetworkUsers = {
        group: 'workpageteam', animation: 150, filter: '.frame__gray', draggable: ".frame__workpageteam", onAdd: function (evt) {
            if (evt.model) {
                evt.model.isTeamMember = false;
                evt.model.isConnected = false;
                $scope.SaveInNetworkUsers();
            }
        }
    };

    $scope.sortableInNetworkUsers = {
        group: 'workpageteam', animation: 150, draggable: ".frame__workpageteam", onAdd: function (evt) {
            console.log('user added to in network');
            // now user is connected
            if (evt.model) {
                evt.model.isConnected = true;
                $scope.SaveInNetworkUsers();
            }
        }
    };

    $scope.sortableStationConfig = {
        group: 'workpageStation', animation: 150, filter: '.frame__gray', draggable: ".frame__workpageteam", onAdd: function (evt) {
            if (evt.model) {
                $scope.saveInNetworkNonDigitalStations();
            }
        }
    };

    $scope.sortableDigitalConfig = {
        group: 'workpageStation', animation: 150, filter: '.frame__gray', draggable: ".frame__workpageteam", onAdd: function (evt) {
            if (evt.model) {
                $scope.saveInNetworkStation();
            }
        }
    };

    $scope.sortableRosterConfig = {
        group: 'workpageroster', animation: 150, filter: '.frame__gray', draggable: ".frame__workpageteam", onAdd: function (evt) {
            if (evt.model) {
                $scope.saveInNetworkRoster();
            }
        }
    };

    $scope.sortableVenueConfig = {
        group: 'workpageroster', animation: 150, filter: '.frame__gray', draggable: ".frame__workpageteam", allowDuplicates: false, onAdd: function (evt) {
            if (evt.model) {
                $scope.saveInNetworkVenues();
            }
        }
    };

    $scope.sortableModuleConfig = {
        group: 'workpageModule', animation: 150, filter: '.frame__gray', draggable: ".frame__workpageteam", onAdd: function (evt) {
            if (evt.model) {
                $scope.saveInNetworkModule();
            }
        }
    };

    // variables 

    $scope.loggedInUserImage = crankServiceApi + '/users/' + $rootScope.current_login_user.id + '/getImage';
    $scope.isUserHasAvatar = true;
    $scope.searchInShowsText = '';
    $scope.tab = '';
    $scope.subMenus = '';
    // Scroller dates 
    var month_names_short = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    $scope.currentMonthForScroller = month_names_short[((new Date().getMonth()) - 1)];
    $scope.dates = [];
    $scope.n = 90;
    $scope.getDays = function (days) {

        var today = new Date(),
            dates = [],
            day_length = 1000 * 60 * 60 * 24; // day in milliseconds

        for (var i = 0; i < days; i++) {
            dates.push(new Date(today.getTime() + day_length * i));
        }
        return dates;
    };

    $scope.generateDates = function (n) {
        var days = $scope.getDays($scope.n);
        for (var i = 0; i < $scope.n; i++) {
            var date = {};
            date.month = days[i].toDateString().substring(days[i].toDateString().indexOf(' '), 7);
            date.monthDigit = (days[i].getMonth() + 1);
            date.day = days[i].getDate();
            date.year = days[i].getFullYear();
            date.index = i;
            $scope.dates.push(date);
        }
    };

    //generateDates for 3 months
    $scope.generateDates();


    $scope.$parent.myScrollOptions = {
        'team-user-wrapper': {
            snap: false,
            scrollX: false,
            mouseWheel: true,
            scrollbars: true,
            //fadeScrollbars:true,
            bounce: false,
            interactiveScrollbars: true
        },
        'wp_dates_scroller':
            {
                scrollX: true, scrollY: false, mouseWheel: true, snap: false, bounce: false, click: true,
                tap: true,
            },

        'wp_shows_scroller':
   {
       scrollX: false, scrollY: true,
       mouseWheel: true,
       mouseWheelSpeed: 1,
       click: true,
       tap: true,
       disableMouse: false,
       disablePointer: true,
       disableTouch: true,
       momentum: true,
       bounce: false,
       scrollbars: true,
       fadeScrollbars: true,
       resizeScrollbars: true,
       // bounceTime: 2000,
   }
    };


    // Change avatar functions

    $scope.myCroppedAvatar = ''
    $scope.myAvatar = $scope.loggedInUserImage;
    $scope.avatarCropType = 'circle';

    $scope.InitFileEvent = function () {
        angular.element(document.querySelector('#fileInputAvatar')).on('change', handleFileSelect);
    }

    // File on change Handle
    var handleFileSelect = function (evt) {
        var file = evt.currentTarget.files[0];
        var reader = new FileReader();
        reader.onload = function (evt) {
            $scope.$apply(function (/*$scope*/) {
                if ($scope.tab == 'changeavatar') {
                    $scope.myAvatar = evt.target.result;
                }
                if ($scope.tab == 'companylogo') {
                    $scope.companyImage = evt.target.result;
                }
            });
        };
        if (file)
            reader.readAsDataURL(file);
    };

    // Save  new cropped avatar
    $scope.updateUserAvatar = function () {
        crankService.users.updateAvatar($rootScope.current_login_user.id,
    $scope.myCroppedAvatar).then(function (data) {
        console.log("Avatar updated ");
        $scope.loggedInUserImage = 'data:' + data.image.mimeType + ';base64,' + data.image.data;
        $scope.isUserHasAvatar = true;

    },
               function (error) {
                   console.log("Error ocurred  while updated avatar,Error: " + error);

               });

    }

    // delete user current avatar and set intial as a user avatar
    $scope.deleteUserAvatar = function () {
        crankService.users.updateAvatar($rootScope.current_login_user.id,
    "").then(function (data) {
        console.log("Avatar updated ");
        $scope.loggedInUserImage = 'data:' + data.image.mimeType + ';base64,' + data.image.data;
        $scope.isUserHasAvatar = false;
        $scope.myCroppedAvatar = '';
        $scope.myAvatar = '';

    },
               function (error) {
                   console.log("Error ocurred  while updated avatar,Error: " + error);

               });

    }


    //Extracting company info 
    $scope.companyInfo = {};
    //$rootScope.current_login_user_company_detail = $cookieStore.get('current_login_user_company_detail');
    var companyEmail = _.find($rootScope.current_login_user_company_detail.emails, ['type', 'primary']);
    var ifNoPrimarEmailFound = $rootScope.current_login_user_company_detail.emails.length > 0 ? $rootScope.current_login_user_company_detail.emails[0].emailId : '';

    var companyPhone = _.find($rootScope.current_login_user_company_detail.phones, ['type', 'work']);
    var ifNoWorkphoneFound = $rootScope.current_login_user_company_detail.phones.length > 0 ? $rootScope.current_login_user_company_detail.phones[0] : null;

    var companyAddress = _.find($rootScope.current_login_user_company_detail.addresses, ['type', 'primary']);
    var ifNoPrimarAddressFound = $rootScope.current_login_user_company_detail.addresses.length > 0 ? $rootScope.current_login_user_company_detail.addresses[0] : '';

    $scope.companyInfo.name = $rootScope.current_login_user_company_detail.name;
    $scope.companyInfo.email = companyEmail != null ? companyEmail.emailId : ifNoPrimarEmailFound;
    $scope.companyInfo.phone = companyPhone != null ? companyPhone : ifNoWorkphoneFound;
    $scope.companyInfo.address = companyAddress != null ? companyAddress : ifNoPrimarAddressFound;

    $scope.user_company_logo = crankServiceApi + '/companies/' + $rootScope.current_login_user_company_detail.id + '/images';

    $scope.companyCroppedImage = ''
    $scope.companyImage = $scope.user_company_logo;
    $scope.companyImgcropType = 'circle';



    $scope.InitCompanyLogoFileEvent = function () {
        angular.element(document.querySelector('#fileInputcompanylogo')).on('change', handleFileSelect);
    }

    $scope.updateCompanyLogo = function () {
        crankService.companies.changeLogo($rootScope.current_login_user_company_detail.id,
    $scope.companyCroppedImage).then(function (data) {
        console.log("Company logo updated ");

    },
               function (error) {
                   console.log("Error ocurred  while updating company,Error: " + error);

               });

    }

    $scope.fetchCountries = function () {
        $http.get('/data/geonames_countries.json')
        .success(function (res) {
            $scope.country_list = res.geonames;

            if ($scope.companyInfo.address) {
                var country = _.find($scope.country_list, function (country) { return country.isoAlpha3 == $scope.companyInfo.address.country });

                if (country) {
                    $scope.user_company_country_name = country.countryName;
                }
            }
        })
        .error(function (res) {
            console.log(res);
        });
    };

    // filter countries as per search text
    $scope.filterCountriesForCompany = function (val) {

        return _.take(_.filter($scope.country_list, function (country) { return _.startsWith(country.countryName.toLowerCase(), val.toLowerCase()); }), 3);

    };

    $scope.addCountryToCompany = function ($item, $model, $label) {
        if ($model) {
            $scope.companyInfo.address.country = $model.isoAlpha3;
        }

    }
    $scope.FetchInNetworkModules = function () {
        $scope.InNetworkModulesId = $rootScope.current_login_user.modules;

        if ($rootScope.current_login_user.modules.length > 0) {
            crankService.modules.getByIds($scope.InNetworkModulesId)
                .then(function (data) {
                    console.log("Received In Network modules information:" + data);

                    $scope.InNetworkModulesList = _.map(data,
                        function (moduleObj) {
                            return {
                                "id": moduleObj.id,
                                "name": moduleObj.name,
                                "description": moduleObj.description,
                                "isActive": moduleObj.isActive,
                                "imageUrl": crankServiceApi + '/modules/' + moduleObj.id + '/getImage',
                            }
                        });
                    //Now load out of network modules
                    $scope.FetchOutOfNetworkModules();
                    console.log($scope.InNetworkModulesList);
                },
                function (error) {
                    console.log("Error ocurred during InNetwork user information retrieval:" + error);
                });
        }
        else {
            $scope.FetchOutOfNetworkModules();
        }

    };

    $scope.FetchOutOfNetworkModules = function () {

        //Load out of network modules stations 
        crankService.modules.get()
            .then(function (data) {
                console.log("Received modules stations information:" + data);


                var moduleList = data;

                _.remove(moduleList, function (value, index, array) {
                    if (_.findIndex($scope.InNetworkModulesId, function (uObj) { return uObj == value.id }) != -1) {
                        return true;
                    }
                    else {
                        return false;
                    }
                });

                $scope.OutOfNetworkModules = _.map(moduleList,
                     function (moduleObj) {
                         return {
                             "id": moduleObj.id,
                             "name": moduleObj.name,
                             "description": moduleObj.description,
                             "isActive": moduleObj.isActive,
                             "imageUrl": crankServiceApi + '/modules/' + moduleObj.id + '/getImage',
                         }
                     });

            },
            function (error) {
                console.log("Error ocurred during InNetwork user information retrieval:" + error);
            });
    };

    $scope.InNetworkVenues = [];
    $scope.OutOfNetworkVenues = [];
    $scope.InNetworkVenuesId = [];
    $scope.OutOfNetworkVenuesId = [];

    //  fetch venues for user
    $scope.FetchInNetworkVenues = function () {
        $scope.InNetworkVenuesId = $rootScope.current_login_user.venues;
        if ($scope.InNetworkVenuesId.length > 0) {
            crankService.venues.getByIds($scope.InNetworkVenuesId)
                .then(function (data) {
                    console.log("Received In Network Venues information:" + data);
                    $scope.InNetworkVenues = _.map(data,
                        function (venue) {
                            return {
                                "id": venue.id,
                                "name": venue.name,
                                "imageUrl": crankServiceApi + '/venues/' + venue.id + '/images',
                                'hasImage': true,
                                'city': venue.city,
                                'country': venue.country,
                                'capacity': venue.capacity,
                                'state': venue.state,
                                'street': venue.street,
                                'isActive': false
                            }
                        });

                },
                function (error) {
                    console.log("Error ocurred during InNetwork venue information retrieval:" + error);
                });
        }

    };

    //  fetch out of network venues for user
    $scope.FetchOutOfNetworkVenues = function () {
        crankService.venues.getVenuesByPageNumber(1, 100)
                .then(function (data) {
                    console.log("Received out Network Venues information:" + data);
                    $scope.OutOfNetworkVenues = _.map(data,
                        function (venue) {
                            return {
                                "id": venue.id,
                                "name": venue.name,
                                "imageUrl": crankServiceApi + '/venues/' + venue.id + '/images',
                                'hasImage': true,
                                'city': venue.city,
                                'country': venue.country,
                                'capacity': venue.capacity,
                                'state': venue.state,
                                'street': venue.street,
                                'isActive': false
                            }
                        });
                    _.each($scope.InNetworkVenues, function (inVenue) {
                        var index = _.findIndex($scope.OutOfNetworkVenues, function (outVenus) {
                            return outVenus.id == inVenue.id;

                        });
                        if (index != -1) {
                            $scope.OutOfNetworkVenues.splice(index, 1)
                        }
                    });

                },
                function (error) {

                    console.log("Error ocurred during out of network venue information retrieval:" + error);
                });

    };
    // Search venus by name 
    $scope.searchVenuesByName = function (filter) {

        return crankService.venues.searchByName(filter)
                 .then(function (data) {

                     return _.filter(data, function (venue) { return ($rootScope.current_login_user.venues.indexOf(venue.id) == -1) });

                 },
                 function (error) {
                     console.log("Error ocurred during venus search:" + error);
                     return [];
                 });

    };

    // Add to out of network
    $scope.addSearchVenueToDiv = function ($item, $model, $label) {

        $scope.searchedOutOfNetworkVenues = '';
        // find searched venue detail in out network venues else go database to get detail
        var venueIndexInOutOfNetwork = _.findIndex($scope.OutOfNetworkVenues, function (venue) { return venue.id == $item.id });
        if (venueIndexInOutOfNetwork > -1) {
            var searchedVenue = angular.copy($scope.OutOfNetworkVenues[venueIndexInOutOfNetwork]);
            $scope.OutOfNetworkVenues.splice(venueIndexInOutOfNetwork, 1);
            $scope.OutOfNetworkVenues = _.union([searchedVenue], $scope.OutOfNetworkVenues);
            return;
        }


        crankService.venues.getById($item.id)
          .then(function (venueObj) {
              if (venueObj) {
                  $scope.OutOfNetworkVenues = _.union([{
                      "id": venueObj.id,
                      "name": venueObj.name,
                      "imageUrl": crankServiceApi + '/venues/' + venueObj.id + '/images',
                      "sortOrder": "0",
                      'hasImage': true,
                      'city': venueObj.city,
                      'country': venueObj.country,
                      'capacity': venueObj.capacity,
                      'state': venueObj.state,
                      'street': venueObj.street,
                      'isActive': false
                  }], $scope.OutOfNetworkVenues);

                  $scope.OutOfNetworkVenuesId.push($item.id);
              }
          },
          function (error) {
              console.log("Error ocurred during venu information retrieval:" + error);
          });

        $scope.searchedOutOfNetworkStation = "";
    };

    // Move venue out of network
    $scope.moveVenueOutOfVenues = function (id) {
        for (var i = $scope.InNetworkVenues.length - 1; i >= 0; i--) {
            if ($scope.InNetworkVenues[i].id == id) {
                $scope.OutOfNetworkVenues.push($scope.InNetworkVenues[i]);
                $scope.InNetworkVenues.splice(i, 1);
                // saving venues to database
                $scope.saveInNetworkVenues();
            }
        }
    }

    // Save Venues
    $scope.saveInNetworkVenues = function () {
        console.log("Saving Venues info");
        $rootScope.current_login_user.venues = _.map($scope.InNetworkVenues,
            function (venueObj) {
                return venueObj.id;
            });
        //Save user information
        $scope.saveUserData()
         .then(function (data) {
             console.log("Succesfully saved user information in database:" + data);
         },
        function (error) {
            console.log("Error ocurred during user information save in database:" + error);
        });;

    };

    $scope.getSearchedUser = function (val) {


        return $http.get(crankServiceApi + '/users/searchbyname/' + val, {

        }).then(function (response) {


            return _.filter(response.data, function (user) { return ($rootScope.current_login_user.id != user.id && (_.find($scope.InNetworkTeamUsers, function (inUser) { return inUser.id == user.id; }) == undefined)) });
            //var searchedList = [];s
            //console.log(response);
            //for (var i = 0; i < response.data.length; i++) {
            //    if (response.data[i].id !== $rootScope.current_login_user.id) {
            //        if ($scope.InNetworkTeamUsersId.indexOf(response.data[i].id) < 0
            //            && $scope.OutNetworkConnectedTeamUsersId.indexOf(response.data[i].id) < 0) {
            //            searchedList.push(response.data[i]);
            //        }
            //    }
            //}
            //return searchedList;
        });

    };

    function CheckIfUserConnectedToLoginUser(inputUserId) {

        var index = _.findIndex($rootScope.current_login_user.connectedUsers, function (item) { return item == inputUserId; })
        if (index > -1)
        { return true; }
        return false;
        //for (var iMemberCount = 0; iMemberCount < $rootScope.current_login_user.connectedUsers.length; iMemberCount++) {
        //    if (inputUserId.indexOf($rootScope.current_login_user.connectedUsers[iMemberCount]) < 0) {
        //        return true;
        //    }
        //}
        //return false;
    }

    function CheckIfUserIsInTeamToLoginUser(inputUserId) {

        var index = _.findIndex($rootScope.current_login_user.team, function (item) { return item == inputUserId; })
        if (index > -1)
        { return true; }
        return false;
    }


    $scope.addSearchUserToDiv = function ($item, $model, $label) {


        $scope.searchedOutOfNetworkUser = '';

        // find user detail in out network  array else go to database get user detail
        var userIndexInOutNetwork = _.findIndex($scope.OutOfNetworkTeamUsers, function (user) { return user.id == $model.id });
        if (userIndexInOutNetwork > -1) {
            var searchedUser = angular.copy($scope.OutOfNetworkTeamUsers[userIndexInOutNetwork]);
            $scope.OutOfNetworkTeamUsers.splice(userIndexInOutNetwork, 1);
            $scope.OutOfNetworkTeamUsers = _.union([searchedUser], $scope.OutOfNetworkTeamUsers);
            return;
        }

        //Get inNetworkusers
        crankService.users.getUserByIds([$model.id])
            .then(function (searchedUser) {
                console.log("Received serched user information:" + searchedUser);
                if (searchedUser.length > 0) {
                    var searchedUserData = searchedUser[0];

                    var inOrOutUsers = _.union($scope.OutOfNetworkTeamUsers, $scope.InNetworkTeamUsers);

                    var userIndex = _.findIndex(inOrOutUsers, ['id', searchedUserData.id]);
                    if (userIndex == -1) {

                        $scope.OutOfNetworkTeamUsers = _.union([{
                            "id": searchedUserData.id,
                            "firstName": searchedUserData.firstName,
                            "lastName": searchedUserData.lastName,
                            "company": searchedUserData.companyName,
                            "userType": searchedUserData.userType,
                            "isActive": searchedUserData.isActive,
                            "isTeamMember": false,
                            "email": searchedUserData.email,
                            "imageUrl": crankServiceApi + '/users/' + searchedUserData.id + '/getImage',
                            "isConnected": false,
                            "sortOrder": "1",
                            "hasImage": true
                        }], $scope.OutOfNetworkTeamUsers);
                        // "isActive": searchedUserData.isActive,
                        /// "isConnected": CheckIfUserConnectedToLoginUser(searchedUserData.id),

                        $scope.OutNetworkConnectedTeamUsersId.push(
                             searchedUserData.id
                        );
                    }
                }

            },
            function (error) {
                console.log("Error ocurred during search user information retrieval:" + error);
            });


        //TODO:Raju Please confirm this we need this method or not 

        //$http({
        //    url: crankServiceApi + '/users/getById/' + $model.id,
        //    method: "GET"
        //})
        //   .then(function (searchedUserData) {
        //       setTimeout(function () {
        //           $scope.$apply(function () {
        //               //$scope.OutOfNetworkTeamUsers.push({
        //               //    "id": searchedUserData.data.id,
        //               //    "firstName": searchedUserData.data.firstName,
        //               //    "lastName": searchedUserData.data.lastName,
        //               //    "company": searchedUserData.data.company,
        //               //    "isActive": searchedUserData.data.isActive,
        //               //    "email": searchedUserData.data.email,
        //               //    "imageUrl": crankServiceApi + '/users/' + userObj.id + '/getImage',
        //               //    "isConnected": CheckIfUserConnectedToLoginUser(searchedUserData.data.id),
        //               //    "sortOrder": "1"
        //               //});

        //               $scope.OutOfNetworkTeamUsers = _.union([{
        //                   "id": searchedUserData.data.id,
        //                   "firstName": searchedUserData.data.firstName,
        //                   "lastName": searchedUserData.data.lastName,
        //                   "company": searchedUserData.data.companyName,
        //                   "userType": searchedUserData.data.userType,
        //                   "isActive": searchedUserData.data.isActive,
        //                   "email": searchedUserData.data.email,
        //                   "imageUrl": crankServiceApi + '/users/' + searchedUserData.data.id + '/getImage',
        //                   "isConnected": CheckIfUserConnectedToLoginUser(searchedUserData.data.id),
        //                   "sortOrder": "1"
        //               }], $scope.OutOfNetworkTeamUsers);

        //               $scope.OutNetworkConnectedTeamUsersId.push(
        //                    searchedUserData.data.id
        //               );
        //           });
        //       }, 100);


        //   },
        //   function (data) {
        //       //log the error
        //   });
        $scope.searchedOutOfNetworkUser = null;
    };

    $scope.modelOptions = {
        debounce: {
            default: 500,
            blur: 250
        },
        getterSetter: true
    };

    $scope.refreshEventsiScroll = function () {
        $scope.myScroll['team-user-wrapper'].refresh();
    };

    $scope.current_view = 'workerpage'; // artist or analytics


    $scope.InNetworkTeamUsers = [];
    $scope.OutOfNetworkTeamUsers = [];
    $scope.InNetworkTeamUsersId = []
    $scope.OutNetworkConnectedTeamUsersId = [];
    $scope.companies = [];

    // set visible tab on worker page 
    $scope.preActAccount = null;
    $scope.setTab = function (newTab, parentlinkName) {
        if ($scope.isNavigation) {
            return;
        }

        if (parentlinkName)
        { $scope.subMenus = parentlinkName }
        else { $scope.subMenus = ''; }
        if (newTab == 'userSettings') {
            $scope.subMenus = 'userSettings';
            newTab = 'changepassword';
        }

        $scope.currentSelectedModule = '';
        $scope.tab = newTab;
        if (newTab == 'shows') {
            $scope.$parent.delayedRefreshiScroll('wp_dates_scroller');
        }

        var accounts = angular.element(document.querySelectorAll('.account__content_wpteam'));
        var selectedAccountNo = -1;
        
        if (accounts.length > 0) {
            for (var i = 0; i < accounts.length; i++) {
                // get selected account number
                if (accounts[i].getAttribute('selectType') === newTab) {
                    selectedAccountNo = i;
                }
            }

            if ($scope.preActAccount) {
                $scope.isNavigation = true;
                var preActAccount = $scope.preActAccount;
                var preHeight = $(accounts[preActAccount]).height();


                // hide previous element
                $(accounts[preActAccount]).css('display', 'none');
                $(accounts[preActAccount]).css('height', '');
                // show current selected element
                $(accounts[selectedAccountNo]).css('display', 'flex');
                $(accounts[selectedAccountNo]).css('opacity', 0);
                var currentHeight = $(accounts[selectedAccountNo]).height();
                $(accounts[selectedAccountNo]).height(preHeight);
                
                // delay for the animation
                $timeout(function () {
                    $(accounts[selectedAccountNo]).height(currentHeight);
                    $(accounts[selectedAccountNo]).css('opacity', 1);
                    $scope.isNavigation = false;
                }, 1000);
                
            } else {
                $(accounts[selectedAccountNo]).css('display', 'flex');
            }
            
            $scope.preActAccount = selectedAccountNo;
        }
    };

    $scope.selectedTab = function (tabNum) {
        return $scope.tab === tabNum;
    };


    $scope.isShowMenus = function (parentlinkName) {

        return $scope.subMenus === parentlinkName;
    }

    // show hide countries list for digital tiles on click of  globe  icon
    $scope.displayDigitalCountries = function (stationId, toggleOnClick) {
        if ($scope.isShowCountriesList == stationId && toggleOnClick == true) {
            $scope.isShowCountriesList = '';
            return;
        }
        $scope.isShowCountriesList = stationId;
    }

    // call on digital Tile minimize to hide all under digital tile like  countries for digital station
    $scope.onDigitalTileMinimize = function () {

        $scope.isShowCountriesList = '';
    }

    // Display  promotion history for show
    $scope.displayTicketPromotionForShow = function (showId) {
        $scope.isDisplayShowPromotionHistory = showId;
    }


    // call on show Tile minimize to hide promotion history 
    $scope.onShowTileMinimize = function () {

        $scope.isDisplayShowPromotionHistory = '';
        $scope.isShowCountriesList = '';

    }

    $scope.inviteModalOpen = function inviteModalOpen(user) {
        $scope.invited_user = user;

        var modalInstance = $uibModal.open({
            templateUrl: 'invite.html',
            controller: 'inviteCtrl',
            windowClass: 'invite-modal',
            scope: $scope,
            resolve:
                {
                    inviteUser: function () {
                        return $scope.invited_user;
                    }
                }
        });
    };

    $scope.inviteDigitalModalOpen = function inviteDigitalModalOpen(companyId, user) {
        $scope.invited_digital_user = user;
        $scope.company_id = companyId;
        var modalInstance = $uibModal.open({
            templateUrl: 'inviteDigital.html',
            controller: 'inviteDigitalCtrl',
            windowClass: 'invite-modal',
            scope: $scope,
            resolve:
                {
                    inviteUser: function () {
                        return $scope.invited_digital_user;
                    },
                    companyId: function () { return $scope.company_id; }
                }
        });
    };


    //Initialize on page load
    $scope.init = function () {
        $scope.InNetworkModulesList = [];
        $scope.OutOfNetworkModules = [];
        $scope.InNetworkModulesId = []
        $scope.OutOfNetworkModulesId = [];

        $scope.InNetworkTeamUsersId = $rootScope.current_login_user.team;
        $scope.FetchInNetworkUsers();
        $scope.FetchOutOfNetworkUsers();
        $scope.FetchInNetworkRosters();
        // $scope.FetchOutOfNetworkRosters();

        $scope.FetchInNetworkStations();
        $scope.FetchOutOfNetworkStations();

        $scope.FetchInNetworkNonDigitalStations();
        $scope.FetchInNetworkModules();

        // $scope.FetchOutOfNetworkModules();
        //$scope.loadUserImage();
        $scope.loadUserDetails();
        $scope.fetchCompanydetail($rootScope.current_login_user.companyId);
        // Getting countries list
        $scope.fetchCountries();
        $scope.FetchInNetworkVenues();
        $scope.FetchOutOfNetworkVenues();
    }

    $scope.fetchCompanydetail = function (companyId) {
        if (companyId) {
            crankService.companies.getById(companyId).then(function (result) {
                if (result) {

                    $scope.user_company_name = result.name;
                }

            }).catch(function (error) { console.log('error while getting company info ' + error); });

        }

    }

    $scope.getSearchedForUserAccountCompanies = function (str) {
        return crankService.companies.searchByName(str, 'active')
       .then(function (data) {
           console.log("Retried companies information:" + data);
           return _.take(_.map(data,
             function (companyObj) {
                 return {
                     "id": companyObj.id,
                     "name": companyObj.name
                 }
             }), 6);

       },
        function (error) {
            console.log("Error ocurred during company information retrieval:" + error);
        });
    }

    $scope.addCompanyToUser = function ($item, $model, $label) {
        if ($model) {
            $scope.accountinfo.companyId = $model.id;
        }
    }

    $scope.loadUserDetails = function () {
        $scope.accountinfo = {};
        console.log($rootScope.current_login_user.companyId);
        $scope.accountinfo.userid = $rootScope.current_login_user.userid;
        $scope.accountinfo.firstName = $rootScope.current_login_user.firstName;
        $scope.accountinfo.lastName = $rootScope.current_login_user.lastName;
        $scope.accountinfo.email = $rootScope.current_login_user.email;
        $scope.accountinfo.companyId = $rootScope.current_login_user.companyId;
    }

    $timeout($scope.init)

    $scope.ShowError = function (errorMessage) {
        if (typeof (errorMessage) == "undefined" || errorMessage === "") {
            return;
        }
        $window.alert("Following Error Occured: " + errorMessage);
    }

    $scope.showAlert = function (message) {
        if (typeof (message) == "undefined" || message == "") {
            return;
        }
        $window.alert(message);
    }

    $scope.SaveInNetworkUsers = function SaveInNetworkUsers() {

        var newConnectedUsersInTeam = [];
        var disconnectedUsersFromTeam = [];

        var newAddedUsersInTeam = [];
        var removedUsersFromTeam = [];
        // filter new added users in team and removed users from team same for connected users
        var connectedUsers = _.filter($scope.InNetworkTeamUsers, ['isConnected', true]);
        // new connected users 
        _.each(connectedUsers, function (userObj) {
            var itemIndex = _.findIndex($rootScope.current_login_user.connectedUsers, function (item) { return item == userObj.id; })
            if (itemIndex == -1) {
                newConnectedUsersInTeam.push(userObj);
            }
        });

        // disconnected users 

        _.each($rootScope.current_login_user.connectedUsers, function (item) {
            var itemIndex = _.findIndex(connectedUsers, function (userObj) { return item == userObj.id; })

            if (itemIndex == -1) {

                var disconnectedUser = _.find($scope.InNetworkTeamUsers, ['id', item]);

                if (!disconnectedUser) {
                    disconnectedUser = _.find($scope.OutOfNetworkTeamUsers, ['id', item]);
                }
                disconnectedUsersFromTeam.push(disconnectedUser);
            }

        });

        var usersInTeam = _.filter($scope.InNetworkTeamUsers, ['isTeamMember', true]);
        // New added users

        _.each(usersInTeam, function (userObj) {
            var itemIndex = _.findIndex($rootScope.current_login_user.team, function (item) { return item == userObj.id; })
            if (itemIndex == -1) {
                newAddedUsersInTeam.push(userObj);
            }
        });

        // Removed users
        _.each($rootScope.current_login_user.team, function (item) {
            var itemIndex = _.findIndex(usersInTeam, function (userObj) { return item == userObj.id; })
            if (itemIndex == -1) {
                var removedUser = _.find($scope.InNetworkTeamUsers, ['id', item]);

                if (!removedUser) {
                    removedUser = _.find($scope.OutOfNetworkTeamUsers, ['id', item]);
                }

                removedUsersFromTeam.push(removedUser);
            }

        });

        $rootScope.current_login_user.team = _.map(_.filter($scope.InNetworkTeamUsers, ['isTeamMember', true]),
            function (userObj) {
                return userObj.id;

            });

        //_.remove($rootScope.current_login_user.connectedUsers, function (cUser, index, array) {
        //    if (_.findIndex($rootScope.current_login_user.team, function (uObj) { return uObj == cUser }) != -1) {
        //        return true;
        //    }
        //    else {
        //        return false;
        //    }
        //});

        $rootScope.current_login_user.connectedUsers = _.map(_.filter($scope.InNetworkTeamUsers, ['isConnected', true]),
            function (userObj) {
                return userObj.id;

            });
        //Save user information
        $scope.saveUserData()
        .then(function (data) {
            // refresh users on source panel

            if ($scope.$parent.$parent) {

                // Refresh team users and connected users on source panel and messenger panel
                if ($rootScope.current_login_user.userType != USER_TYPE_RADIO_MANAGER) {
                    _.each(disconnectedUsersFromTeam, function (userObj) {
                        $scope.$parent.$parent.removeUserformSourcePanelBucket(userObj);
                        $scope.$parent.$parent.removeUserFromMessengerPanelBucket(userObj);
                    });

                    _.each(newConnectedUsersInTeam, function (userObj) {
                        $scope.$parent.$parent.addUserToSourcePanelBucket(userObj, false, true);
                        $scope.$parent.$parent.addUserToMessengerPanelBucket(userObj, false);
                    });
                }
                _.each(removedUsersFromTeam, function (userObj) { $scope.$parent.$parent.removeUserformSourcePanelBucket(userObj); $scope.$parent.$parent.removeUserFromMessengerPanelBucket(userObj); });

                _.each(newAddedUsersInTeam, function (userObj) { $scope.$parent.$parent.addUserToSourcePanelBucket(userObj, true, false); $scope.$parent.$parent.addUserToMessengerPanelBucket(userObj, true); });

                // sort records as team member . team members will display of top of list after that connected users 
                $scope.InNetworkTeamUsers = _.union(usersInTeam, connectedUsers);

            }
            console.log("Succesfully saved in network user in database:" + data);
        },
        function (error) {
            console.log("Error ocurred during user information save in database:" + error);
        });;
    };

    $scope.saveUserData = function saveUserData() {
        $scope.$parent.$parent.refreshDataOnPage = true;
        //Save user information
        return crankService.users.putUser($rootScope.current_login_user);

    };

    $scope.moveUserOutOfTeam = function (id) {

        for (var i = $scope.InNetworkTeamUsers.length - 1; i >= 0; i--) {
            if ($scope.InNetworkTeamUsers[i].id == id) {
                $scope.InNetworkTeamUsers[i].isTeamMember = false;
                $scope.InNetworkTeamUsers[i].isConnected = false;
                $scope.OutOfNetworkTeamUsers.push($scope.InNetworkTeamUsers[i]);
                $scope.InNetworkTeamUsers.splice(i, 1);

                $scope.SaveInNetworkUsers();
            }
        }
    };


    $scope.addUserToTeam = function (id) {

        var user = _.find($scope.InNetworkTeamUsers, function (user) { return user.id == id; });
        if (user) {
            user.isTeamMember = true;
            user.isConnected = false;
            $scope.SaveInNetworkUsers();
        }
    };

    $scope.removeUserfromTeam = function (id) {

        var user = _.find($scope.InNetworkTeamUsers, function (user) { return user.id == id; });
        if (user) {
            user.isTeamMember = false;
            user.isConnected = true;
            $scope.SaveInNetworkUsers();
        }
    };


    $scope.FetchInNetworkUsers = function FetchInNetworkUsers() {

        //Get inNetworkusers

        var mergedUsers = _.union($rootScope.current_login_user.team, $rootScope.current_login_user.connectedUsers);
        crankService.users.getUserByIds(mergedUsers)
            .then(function (data) {
                console.log("Received In Network user information:" + data);

                $scope.InNetworkTeamUsers = _.map(data,
                    function (userObj) {
                        return {
                            "id": userObj.id,
                            "hasImage": true,
                            "firstName": userObj.firstName,
                            "lastName": userObj.lastName,
                            "userType": userObj.userType,
                            "company": userObj.companyName,
                            "isActive": userObj.isActive,
                            "email": userObj.email,
                            "isTeamMember": CheckIfUserIsInTeamToLoginUser(userObj.id),
                            "imageUrl": crankServiceApi + '/users/' + userObj.id + '/getImage',
                            "isConnected": CheckIfUserConnectedToLoginUser(userObj.id)
                        }
                    });

            },
            function (error) {
                console.log("Error ocurred during InNetwork user information retrieval:" + error);
            });
    };


    $scope.SendInviteMail = function () {
        console.log($scope.invited_user);
        //Call API method to send mail invitation
        $http({
            method: 'POST',
            url: crankServiceApi + '/users/invite',
            data: angular.toJson($scope.invited_user)
        }).then(function successCallback(response) {
            $scope.showAlert('Team member invited successfully..');
        }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    };

    $scope.fetchUsersForPanel = function fetchUsersForPanel() {
        crankService.users.getUsers(1, 100)
        .then(function (data) {
            console.log("Received user information:" + data);

            $scope.addUserToOutOfNetworkArray(data);

        },
        function (error) {
            console.log("Error ocurred during user information retrieval::" + error);
        });
    };




    // addind user to out of network array 

    $scope.addUserToOutOfNetworkArray = function (data) {

        var usersList = data;
        //Remove logged in user
        var existingUserIds = [];
        existingUserIds.push($rootScope.current_login_user.id);
        existingUserIds = _.union(existingUserIds, $rootScope.current_login_user.team);
        existingUserIds = _.union(existingUserIds, $rootScope.current_login_user.connectedUsers);
        //debugger;
        //existingUserIds = _.union(existingUserIds, $scope.InNetworkTeamUsersId, $scope.OutNetworkConnectedTeamUsersId);
        // To remove team member and connected users form out of network array to eliminate duplicate records 
        _.remove(usersList, function (value, index, array) {
            if (_.findIndex(existingUserIds, function (uObj) { return uObj == value.id }) != -1) {
                return true;
            }
            else {
                return false;
            }
        });

        $scope.OutOfNetworkTeamUsers = _.union($scope.OutOfNetworkTeamUsers, _.map(usersList,
            function (userObj) {
                return {
                    "id": userObj.id,
                    "hasImage": true,
                    "firstName": userObj.firstName,
                    "lastName": userObj.lastName,
                    "company": userObj.companyName,
                    "userType": userObj.userType,
                    "isTeamMember": false,
                    "isActive": userObj.isActive,
                    "email": userObj.email,
                    "imageUrl": crankServiceApi + '/users/' + userObj.id + '/getImage',
                    "isConnected": false,// this should be false by default
                    "sortOrder": 3
                }
            }));


        $scope.OutNetworkConnectedTeamUsersId = _.union($scope.OutNetworkConnectedTeamUsersId, _.map(usersList,
            function (userObj) {
                return userObj.id;

            }));

    }


    $scope.FetchOutOfNetworkUsers = function FetchOutOfNetworkUsers() {
        //Get connected users

        //if ($rootScope.current_login_user.connectedUsers.length > 0) {

        //    crankService.users.getUserByIds($rootScope.current_login_user.connectedUsers)
        //       .then(function (data) {
        //           console.log("Received In Connected user information:" + data);

        //           $scope.OutOfNetworkTeamUsers = _.map(data,
        //               function (userObj) {
        //                   return {
        //                       "id": userObj.id,
        //                       "firstName": userObj.firstName,
        //                       "lastName": userObj.lastName,
        //                       "company": userObj.companyName,
        //                       "userType": userObj.userType,
        //                       "isActive": userObj.isActive,
        //                       "email": userObj.email,
        //                       "imageUrl": crankServiceApi + '/users/' + userObj.id + '/getImage',
        //                       "isConnected": true,
        //                       "sortOrder": 2
        //                   }
        //               });
        //           $scope.OutNetworkConnectedTeamUsersId = $rootScope.current_login_user.connectedUsers;

        //           $scope.fetchUsersForPanel();
        //       },
        //       function (error) {
        //           console.log("Error ocurred during Connected user information retrieval::" + error);
        //       });
        //}
        //else {
        $scope.fetchUsersForPanel();
        // }
    };


    $scope.newUploadImage = null;
    $scope.openFile = function (event) {
        var input = event.target;

        var reader = new FileReader();

        //fr.readAsDataURL(data);

        reader.onload = function () {
            var dataURL = reader.result;
            //var output = document.getElementById('output');
            //output.src = dataURL;

            $scope.loadedFile = reader.result;
            $scope.$apply();
        };
        reader.readAsDataURL(input.files[0]);

        var fd = new FormData();
        fd.append('file', input.files[0]);

        $scope.newUploadImage = fd;
        $scope.$apply();
    };

    $scope.toggleconnectUserToLoginUser = function connectUserToLoginUser(connectUser) {
        for (var iMemberCount = 0; iMemberCount < $scope.OutOfNetworkTeamUsers.length; iMemberCount++) {
            if ($scope.OutOfNetworkTeamUsers[iMemberCount].id == connectUser.id) {
                $scope.OutOfNetworkTeamUsers[iMemberCount].isConnected = !$scope.OutOfNetworkTeamUsers[iMemberCount].isConnected;
            }
        }
        // $scope.$apply();
    };





    $scope.updateAccountInfo = function updateAccountInfo() {

        //if ($scope.newUploadImage != null || $scope.newUploadImage != undefined)
        //{
        //    $http.post(crankServiceApi + '/users/' + $rootScope.current_login_user.id + '/uploadImage', $scope.newUploadImage, {
        //        transformRequest: angular.identity,
        //        headers: { 'Content-Type': undefined }
        //    })
        //   .success(function () {
        //       $scope.loadUserImage();
        //   })
        //   .error(function () {
        //   });
        //}

        var saveUser = $scope.current_login_user;

        saveUser.firstName = $scope.accountinfo.firstName;
        saveUser.lastName = $scope.accountinfo.lastName;
        saveUser.userid = $scope.accountinfo.userid;
        saveUser.email = $scope.accountinfo.email;
        saveUser.companyId = $scope.accountinfo.companyId;

        //Save user information
        $scope.saveUserData()
         .then(function (data) {
             console.log("Succesfully saved user account information in database:" + data);
             $rootScope.current_user.firstName = $scope.current_login_user.firstName;
             $rootScope.current_user.lastName = $scope.current_login_user.lastName;
         },
        function (error) {
            console.log("Error ocurred during user information save in database:" + error);
        });
    };

    $scope.updateAccountPassword = function updateAccountPassword() {
        var saveUser = $scope.current_login_user;
        var currentPassword = $scope.accountinfo.currentPassword;
        var newPassword = $scope.accountinfo.newPassword;
        var newPasswordVerify = $scope.accountinfo.newPasswordVerify;


        if (newPassword != newPasswordVerify) {

            var messageModalInstance = $uibModal.open({
                templateUrl: 'showMessage.html',
                controller: 'messageCtrl',
                size: 'md',
                scope: $scope,
                backdrop: 'static',
                windowClass: 'message',
                resolve:
                {
                    message: function () {
                        return {
                            messageHeader: 'Password don\'t match',
                            messageBody: 'New password and verify password don\'t match'
                        };
                    }
                }
            });

        }
        else {
            //Save user information
            //$scope.saveUserData()
            // .then(function (data)
            // {
            //     console.log("Succesfully saved user account information in database:" + data);
            //     $rootScope.current_user.firstName = $scope.current_login_user.firstName;
            //     $rootScope.current_user.lastName = $scope.current_login_user.lastName;
            // },
            //function (error)
            //{
            //    console.log("Error ocurred during user information save in database:" + error);
            //});
        }
    }
    //$scope.$on('crankRefresh', function ()
    //{
    //    console.log('TODO crank refresh ui');
    //});

    $scope.updateCompanyInfo = function updateCompanyInfo(valid) {

        if (valid) {
            var savedCompany = $rootScope.current_login_user_company_detail;
            savedCompany.name = $scope.companyInfo.name;
            // finding  index of primary email form emails and replace with new one
            var primaryEmailIndex = _.findIndex($rootScope.current_login_user_company_detail.emails, ['type', 'primary']);
            if (primaryEmailIndex > -1) {
                savedCompany.emails[primaryEmailIndex].emailId = $scope.companyInfo.email;
            }
                // if no primary email found then replace first email that found
            else {
                // if email found at 0 index
                if (savedCompany.emails[0]) {
                    savedCompany.emails[0].emailId = $scope.companyInfo.email;
                }
                    //if no email exist
                else {
                    savedCompany.emails[0] = { emailId: $scope.companyInfo.email, type: 'primary' }
                }
            }
            // finding  index of work phone form phones and replace with new one

            var workPhoneIndex = _.findIndex($rootScope.current_login_user_company_detail.phones, ['type', 'work']);

            if (workPhoneIndex > -1) {

                savedCompany.phones[workPhoneIndex] = $scope.companyInfo.phone;
            }
                // if no work phone found then replace first phone that found

            else {
                // if phone detail found at index 0
                if (savedCompany.phones[0]) {

                    savedCompany.phones[0] = $scope.companyInfo.phone;
                }
                    //  if no phone record exist
                else {
                    $scope.companyInfo.phone.type = 'work';
                    savedCompany.phones[0] = $scope.companyInfo.phone;
                }
            }
            // finding  index of primary address  form addresses and replace with new one
            var primaryAddressIndex = _.findIndex($rootScope.current_login_user_company_detail.addresses, ['type', 'primary']);

            if (primaryAddressIndex > -1) {

                savedCompany.addresses[primaryAddressIndex] = $scope.companyInfo.address;
            }
                // if no primary address found then replace first address that found

            else {
                //if address found at index 0
                if (savedCompany.addresses[0]) {
                    savedCompany.addresses[0] = $scope.companyInfo.address;
                }

                    // if no exist
                else {
                    $scope.companyInfo.address.type = 'primary';
                    $scope.companyInfo.address.streets = [];
                    savedCompany.addresses[0] = $scope.companyInfo.address;
                }
            }

            // sending updated to server 
            crankService.companies.updatecompanyInfo(savedCompany).then(function (result) { }).catch(function (error) { });

        }
    };

    //Roster
    $scope.saveInNetworkRoster = function saveInNetworkRoster() {
        $rootScope.current_login_user.artists = _.map($scope.InNetworkRosters,
          function (artistObj) {
              return artistObj.id;

          });

        //Save user information
        $scope.saveUserData()
        .then(function (data) {
            console.log("Succesfully saved in roster in database:" + data);
        },
       function (error) {
           console.log("Error ocurred during user information save in database:" + error);
       });;
    };

    $scope.moveUserOutOfRoster = function (id) {
        for (var i = $scope.InNetworkRosters.length - 1; i >= 0; i--) {
            if ($scope.InNetworkRosters[i].id == id) {
                $scope.OutOfNetworkRosters.push($scope.InNetworkRosters[i]);
                $scope.InNetworkRosters.splice(i, 1);
                // saving to data base
                $scope.saveInNetworkRoster();
            }
        }
    }

    $scope.InNetworkRosters = [];
    $scope.OutOfNetworkRosters = [];
    $scope.InNetworkRostersId = []
    $scope.OutOfNetworkRostersId = [];

    $scope.inNetworkRosters = { group: 'workpageroster', animation: 150 };
    $scope.inNetworkRosters['onAdd'] = $scope.rosterAddedToInnetwork;

    $scope.FetchInNetworkRosters = function () {
        ////Loop through and get all the roster details for user
        //for (var iMemberCount = 0; iMemberCount < $rootScope.current_login_user.artists.length; iMemberCount++)
        //{

        //    $http({
        //        url: crankServiceApi + '/artists/getById/' + $rootScope.current_login_user.artists[iMemberCount],
        //        method: "GET"
        //    })
        //        .then(function (teamData)
        //        {
        //            $scope.InNetworkRosters.push({
        //                "id": teamData.data.id,
        //                "title": teamData.data.title,
        //                "isApproved": true,
        //                "imgResult": crankServiceApi + '/artists/' + teamData.data.id + '/images/large'
        //            });

        //            $scope.InNetworkRostersId.push(teamData.data.id);
        //        },
        //        function (data)
        //        {
        //            //log the error
        //        });
        //}

        $scope.InNetworkRostersId = $rootScope.current_login_user.artists;

        //Get in network roster
        if ($rootScope.current_login_user.artists.length > 0) {
            crankService.artists.getByIds($rootScope.current_login_user.artists)
               .then(function (data) {
                   console.log("Received in network artist information user information:" + data);

                   $scope.InNetworkRosters = _.map(data,
                       function (artistObj) {
                           return {
                               "id": artistObj.id,
                               "title": artistObj.title,
                               "name": artistObj.name,
                               "isApproved": false,
                               "imageUrl": crankServiceApi + '/artists/' + artistObj.id + '/images/large',
                           }
                       });

                   //Now fetch out of network roster
                   $scope.FetchOutOfNetworkRosters();

               },
               function (error) {
                   console.log("Error ocurred during InNetwork user information retrieval:" + error);
               });
        }
        else {
            $scope.FetchOutOfNetworkRosters();
        }
    };

    $scope.FetchOutOfNetworkRosters = function () {

        ////Now get all the other users
        //$http({
        //    url: crankServiceApi + '/artists',
        //    method: "GET"
        //})
        //      .then(function (allusers)
        //      {
        //          //console.log(outofnetworkusers);
        //          //console.log('found some users with company of crank');
        //          for (var i = 0; i < allusers.data.length; i++)
        //          {
        //              if ($scope.InNetworkRostersId.indexOf(allusers.data[i].id) < 0 &&
        //                  $scope.OutOfNetworkRostersId.indexOf(allusers.data[i].id) < 0)
        //              {
        //                  $scope.OutOfNetworkRosters.push({
        //                      "id": allusers.data[i].id,
        //                      "title": allusers.data[i].title,
        //                      "isApproved": false,
        //                      "imgResult": crankServiceApi + '/artists/' + allusers.data[i].id + '/images/large'
        //                  });

        //                  $scope.OutOfNetworkRostersId.push(
        //                    allusers.data[i].id
        //                    );
        //              }
        //          }

        //          // console.log($scope.OutOfNetworkTeamUsers);
        //      },
        //      function (data)
        //      {
        //          //log the error
        //      });

        crankService.artists.getArtists(1, 100)
         .then(function (data) {
             console.log("Received artist information:" + data);
             var artistList = data;
             //Remove logged in user

             _.remove(artistList, function (value, index, array) {
                 if (_.findIndex($scope.InNetworkRostersId, function (uObj) { return uObj == value.id }) != -1) {
                     return true;
                 }
                 else {
                     return false;
                 }
             });


             $scope.OutOfNetworkRosters = _.map(artistList,
                 function (artistObj) {
                     return {
                         "id": artistObj.id,
                         "title": artistObj.title,
                         "name": artistObj.name,
                         "isApproved": false,
                         "imageUrl": crankServiceApi + '/artists/' + artistObj.id + '/images/large',
                     }
                 });

             $scope.OutOfNetworkRostersId = _.map($scope.OutOfNetworkRosters,
                 function (userObj) {
                     return userObj.id;

                 });
         },
          function (error) {
              console.log("Error ocurred during artists information retrieval::" + error);
          });
    };


    $scope.rosterAddedToInnetwork = function rosterAddedToInnetwork(evt) {
        console.log('roster added to in network');
        console.log(evt.item);
        $scope.refreshEventsiScroll();
    };


    $scope.addSearchRosterToDiv = function ($item, $model, $label) {
        $scope.searchedOutOfNetworkRoster = '';

        // if searched roster in outnetwork then get detail otherwise go to database to get detail
        var rosterIndexInOutNetwork = _.findIndex($scope.OutOfNetworkRosters, function (roster) { return roster.id == $model.id });
        if (rosterIndexInOutNetwork > -1) {
            var searchedRoster = angular.copy($scope.OutOfNetworkRosters[rosterIndexInOutNetwork]);
            $scope.OutOfNetworkRosters.splice(rosterIndexInOutNetwork, 1);
            $scope.OutOfNetworkRosters = _.union([searchedRoster], $scope.OutOfNetworkRosters);
            return;

        }

        $http({
            url: crankServiceApi + '/artists/getById/' + $model.id,
            method: "GET"
        })
           .then(function (searchedUserData) {

               $scope.OutOfNetworkRosters = _.union([{
                   "id": searchedUserData.data.id,
                   "title": searchedUserData.data.title,
                   "name": searchedUserData.data.name,
                   "imageUrl": crankServiceApi + '/artists/' + searchedUserData.data.id + '/images/large',
                   "isApproved": false
               }], $scope.OutOfNetworkRosters);

               $scope.OutOfNetworkRostersId.push(
                    searchedUserData.data.id
               );


           },
           function (data) {
               //log the error
           });
        $scope.searchedOutOfNetworkRoster = null;
    };

    $scope.getSearchedRoster = function (val) {

        return $http.get(crankServiceApi + '/artists/searchByName/' + val, {

        }).then(function (response) {
            var searchedList = [];

            for (var i = 0; i < response.data.length; i++) {

                if ($scope.InNetworkRostersId.indexOf(response.data[i].id) == -1) {
                    console.log(response);
                    searchedList.push(response.data[i]);
                }
            }

            return searchedList;
        });

    };

    //Station
    $scope.saveInNetworkStation = function saveInNetworkStation() {
        console.log("Saving digitial station info");

        var newStations = [];
        var removedStations = [];
        // find new added stations 
        _.each($scope.InNetworkStations, function (stationObj) {
            var index = _.findIndex($rootScope.current_login_user.digitals, function (item) { return item == stationObj.id; });
            if (index == -1) {
                newStations.push(stationObj);
            }
        });

        // find new removed stations 
        _.each($rootScope.current_login_user.digitals, function (item) {

            var index = _.findIndex($scope.InNetworkStations, function (stationObj) { return item == stationObj.id; });
            if (index == -1) {
                removedStations.push(item);
            }
        });

        $rootScope.current_login_user.digitals = _.map($scope.InNetworkStations,
            function (stationObj) {
                return stationObj.id;

            });

        //Save user information
        $scope.saveUserData()
         .then(function (data) {

             if ($scope.$parent) {
                 _.each(newStations, function (station) { $scope.$parent.addDigitalToSourcePanelBucket(station); });
                 _.each(removedStations, function (stationId) { $scope.$parent.removeDigitalformSourcePanelBucket(stationId); });
             }


             console.log("Succesfully saved digital station information in database:" + data);
         },
        function (error) {
            console.log("Error ocurred during user information save in database:" + error);
        });;

    };

    $scope.saveInNetworkNonDigitalStations = function saveInNetworkNonDigitalStations() {
        console.log("Saving non digitial station info");

        $rootScope.current_login_user.stations = _.map($scope.InNetworkNonDigitalStations,
            function (stationObj) {
                return stationObj.id;

            });

        //Save user information
        $scope.saveUserData()
         .then(function (data) {
             console.log("Succesfully saved digital station information in database:" + data);
         },
        function (error) {
            console.log("Error ocurred during user information save in database:" + error);
        });;

    };

    $scope.moveUserOutOfStation = function (id) {
        for (var i = $scope.InNetworkStations.length - 1; i >= 0; i--) {
            if ($scope.InNetworkStations[i].id == id) {
                $scope.OutOfNetworkStations.push($scope.InNetworkStations[i]);
                $scope.InNetworkStations.splice(i, 1);

                // saving in  to database
                $scope.saveInNetworkStation();
            }
        }
    }

    $scope.moveUserOutOfNonDigitalStation = function (id) {
        for (var i = $scope.InNetworkNonDigitalStations.length - 1; i >= 0; i--) {
            if ($scope.InNetworkNonDigitalStations[i].id == id) {
                $scope.OutOfNetworkNonDigitalStations.push($scope.InNetworkNonDigitalStations[i]);
                $scope.InNetworkNonDigitalStations.splice(i, 1);

                //  saving into database
                $scope.saveInNetworkNonDigitalStations();
            }
        }
    }


    $scope.InNetworkStations = [];
    $scope.OutOfNetworkStations = [];
    $scope.InNetworkStationsId = []
    $scope.OutOfNetworkStationsId = [];
    $scope.InNetworkNonDigitalStations = [];
    $scope.OutOfNetworkNonDigitalStations = [];
    $scope.InNetworkNonDigitalStationsId = []
    $scope.OutOfNetworkNonDigitalStationsId = [];

    //Get inNetwork Digital stations
    $scope.FetchInNetworkStations = function FetchInNetworkStations() {

        if ($rootScope.current_login_user.digitals.length > 0) {
            $scope.InNetworkStationsId = $rootScope.current_login_user.digitals;
            crankService.stations.getByIds($rootScope.current_login_user.digitals, true)
                .then(function (data) {
                    console.log("Received In Network stations information:" + data);
                    $scope.InNetworkStations = _.map(data,
                        function (stationObj) {
                            return {
                                "id": stationObj.id,
                                "name": stationObj.name,
                                "owner": stationObj.owner,
                                "market": stationObj.market != '' && stationObj.market != undefined && stationObj.market != null ? stationObj.market.replace('>', '') : stationObj.market,
                                "isActive": false,
                                "imageUrl": crankServiceApi + '/stations/' + stationObj.id + '/images/normal/' + stationObj.owner,
                                "sortOrder": 1,
                                'sType': stationObj.sType,
                                'hasImage': true,
                                'countries': stationObj.countries,
                                'format': stationObj.format,
                                'isShowInviteLink': stationObj.isShowInviteLink,
                                'companyAdmin': stationObj.companyAdmin,
                                'companyId': stationObj.companyId,
                            }
                        });
                    $scope.setTab('team');


                },
                function (error) {
                    console.log("Error ocurred during InNetwork user information retrieval:" + error);
                });
        }

    };

    //update invite link after sent invitation 
    $scope.removeinvitationLinkAfterInvitation = function (companyId) {

        //innetwork stations
        _.each($scope.InNetworkStations, function (station) {
            if (station.companyId == companyId) {
                station.isShowInviteLink = false
            }

        });

        //outnetwork stations
        _.each($scope.OutOfNetworkStations, function (station) {
            if (station.companyId == companyId) {
                station.isShowInviteLink = false
            }

        });

    }

    //Get inNetwork non Digital stations
    $scope.FetchInNetworkNonDigitalStations = function () {

        //Get inNetwork non Digital stations

        if ($rootScope.current_login_user.stations.length > 0) {
            $scope.OutOfNetworkStationsId = $rootScope.current_login_user.stations;
            crankService.stations.getByIds($rootScope.current_login_user.stations)
                .then(function (data) {
                    console.log("Received In Network stations information:" + data);

                    $scope.InNetworkNonDigitalStations = _.map(data, function (stationObj) {
                        return {
                            "id": stationObj.id,
                            "name": stationObj.name,
                            "owner": stationObj.owner,
                            "market": stationObj.market != '' && stationObj.market != undefined && stationObj.market != null ? stationObj.market.replace('>', '') : stationObj.market,
                            "isActive": false,
                            "imageUrl": crankServiceApi + '/stations/' + stationObj.id + '/images',
                            "sortOrder": 1,
                            'format': stationObj.format,
                            'hasImage': true
                        }
                    }
                       );
                    $scope.FetchOutOfNetworkNonDigitalStations();

                },
                function (error) {
                    console.log("Error ocurred during InNetwork stations information retrieval:" + error);
                });
        }

    };

    //Get out of network non Digital stations
    $scope.FetchOutOfNetworkNonDigitalStations = function () {


        crankService.stations.getFM(1, 100)
                .then(function (data) {
                    console.log("Received out ofNetwork stations information:" + data);
                    $scope.OutOfNetworkNonDigitalStations = _.map(data, function (stationObj) {
                        return {
                            "id": stationObj.id,
                            "name": stationObj.name,
                            "owner": stationObj.owner,
                            "market": stationObj.market != '' && stationObj.market != undefined && stationObj.market != null ? stationObj.market.replace('>', '') : stationObj.market,
                            "isActive": false,
                            "imageUrl": crankServiceApi + '/stations/' + stationObj.id + '/images',
                            "sortOrder": 1,
                            'format': stationObj.format,
                            'hasImage': true
                        }
                    })

                    _.each($scope.InNetworkNonDigitalStations, function (inStation) {
                        var index = _.findIndex($scope.OutOfNetworkNonDigitalStations, function (outStation) { return outStation.id == inStation.id });

                        if (index != -1) {
                            $scope.OutOfNetworkNonDigitalStations.splice(index, 1);
                        }

                    });

                },
                function (error) {

                    console.log("Error ocurred during out of network stations information retrieval:" + error);
                });

    }

    //fetch out of network stations 
    $scope.FetchOutOfNetworkStations = function () {

        crankService.stations.getDigital(1, 100, true)
            .then(function (data) {
                console.log("Received digital stations information:" + data);
                var stationList = data;
                _.remove(stationList, function (value, index, array) {
                    if (_.findIndex($scope.InNetworkStationsId, function (uObj) { return uObj == value.id }) != -1) {
                        return true;
                    }
                    else {
                        return false;
                    }
                });

                $scope.OutOfNetworkStations = _.map(stationList,
                    function (stationObj) {
                        return {
                            "id": stationObj.id,
                            "name": stationObj.name,
                            "owner": stationObj.owner,
                            "market": stationObj.market != '' && stationObj.market != undefined && stationObj.market != null ? stationObj.market.replace('>', '') : stationObj.market,
                            "isActive": false,
                            "imageUrl": crankServiceApi + '/stations/' + stationObj.id + '/images/normal/' + stationObj.owner,
                            "sortOrder": 2,
                            'sType': stationObj.sType,
                            'hasImage': true,
                            'countries': stationObj.countries,
                            'isShowInviteLink': stationObj.isShowInviteLink,
                            'companyAdmin': stationObj.CompanyAdmin,
                            'format': stationObj.format,
                            'companyId': stationObj.companyId,
                        }
                    });
            },
            function (error) {
                console.log("Error ocurred during InNetwork user information retrieval:" + error);
            });

    };

    // Add  digital station

    $scope.addSearchStationToDiv = function ($item, $model, $label) {
        //$http({
        //    url: crankServiceApi + '/stations/getById/' + $model.id,
        //    method: "GET"
        //})
        //   .then(function (searchedUserData)
        //   {
        //       setTimeout(function ()
        //       {
        //           $scope.$apply(function ()
        //           {
        //               $scope.OutOfNetworkStations.push({
        //                   "id": searchedUserData.data.id,
        //                   "name": searchedUserData.data.name,
        //                   "owner": searchedUserData.data.owner,
        //                   "isActive": true,
        //                   "sortOrder": 0

        //               });
        //               $scope.OutOfNetworkStationsId.push(
        //                    searchedUserData.data.id
        //               );
        //           });
        //       }, 2000);


        //   },
        //   function (data)
        //   {
        //       //log the error
        //   });
        $scope.searchedOutOfNetworkStation = '';

        // if searched digital in outnetwork array then get detail otherwise go to database to get detail
        var digitalIndexInOutNetwork = _.findIndex($scope.OutOfNetworkStations, function (digital) { return digital.id == $item.id });

        if (digitalIndexInOutNetwork > -1) {
            var searchedDigital = angular.copy($scope.OutOfNetworkStations[digitalIndexInOutNetwork]);
            $scope.OutOfNetworkStations.splice(digitalIndexInOutNetwork, 1);
            $scope.OutOfNetworkStations = _.union([searchedDigital], $scope.OutOfNetworkStations);
            return;
        }

        crankService.stations.getById($item.id)
             .then(function (stationObj) {

                 if (stationObj) {
                     $scope.OutOfNetworkStations = _.union([{
                         "id": stationObj.id,
                         "name": stationObj.name,
                         "owner": stationObj.owner,
                         "market": stationObj.market != '' && stationObj.market != undefined && stationObj.market != null ? stationObj.market.replace('>', '') : stationObj.market,
                         "isActive": false,
                         "imageUrl": crankServiceApi + '/stations/' + stationObj.id + '/images',
                         "sortOrder": "0",
                         'sType': stationObj.sType,
                         'countries': stationObj.countries,
                         "hasImage": true
                     }], $scope.OutOfNetworkStations);

                     $scope.OutOfNetworkStationsId.push($item.id);
                 }
             },
             function (error) {
                 console.log("Error ocurred during digital stations information retrieval:" + error);
             });

        $scope.searchedOutOfNetworkStation = "";
    };
    // Add non digital station
    $scope.addSearchNonDigitalStationToDiv = function ($item, $model, $label) {

        $scope.searchedOutOfNetworkNonDigitalStation = '';

        // if radio in out network then get detail otherwise go to database
        var radioIndexInOutNetworkRadios = _.findIndex($scope.OutOfNetworkNonDigitalStations, function (radio) { return radio.id == $item.id });
        if (radioIndexInOutNetworkRadios > -1) {
            var searchedRadio = angular.copy($scope.OutOfNetworkNonDigitalStations[radioIndexInOutNetworkRadios]);
            $scope.OutOfNetworkNonDigitalStations.splice($scope.OutOfNetworkNonDigitalStations, 1);
            $scope.OutOfNetworkNonDigitalStations = _.union([searchedRadio], $scope.OutOfNetworkNonDigitalStations);
            return;
        }
        crankService.stations.getById($item.id)
             .then(function (stationObj) {
                 if (stationObj) {
                     $scope.OutOfNetworkNonDigitalStations = _.union([{
                         "id": stationObj.id,
                         "name": stationObj.name,
                         "owner": stationObj.owner,
                         "market": stationObj.market != '' && stationObj.market != undefined && stationObj.market != null ? stationObj.market.replace('>', '') : stationObj.market,
                         "isActive": false,
                         "imageUrl": crankServiceApi + '/stations/' + stationObj.id + '/images',
                         "sortOrder": "0",
                         'format': stationObj.format

                     }], $scope.OutOfNetworkNonDigitalStations);

                     $scope.OutOfNetworkNonDigitalStationsId.push($item.id);
                 }
             },
             function (error) {
                 console.log("Error ocurred during digital stations information retrieval:" + error);
             });


    };

    $scope.searchDigitalStaions = function (stationFilter) {
        //if ((typeof (val) !== 'undefined') && (val !== null))
        //{

        //    var searchStation = { Name: val };
        //    return $http({
        //        method: 'POST',
        //        url: crankServiceApi + '/stations/search',
        //        data: JSON.stringify(searchStation)
        //    }).then(function successCallback(response)
        //    {
        //        // $scope.showAlert('station searched..');
        //        var searchedList = [];

        //        for (var i = 0; i < response.data.length; i++)
        //        {

        //            if ($scope.InNetworkStationsId.indexOf(response.data[i].id) < 0
        //                && $scope.OutOfNetworkStationsId.indexOf(response.data[i].id) < 0)
        //            {
        //                searchedList.push(response.data[i]);
        //            }

        //        }
        //        return searchedList;

        //    }, function errorCallback(response)
        //    {
        //        // called asynchronously if an error occurs
        //        // or server returns response with an error status.
        //    });
        //}


        return crankService.stations.searchByName(stationFilter, 'digital')
                 .then(function (data) {

                     return _.filter(data, function (digital) { return (_.find($scope.InNetworkStations, function (inDigital) { return inDigital.id == digital.id; }) == undefined) });
                     // return data;

                 },
                 function (error) {
                     console.log("Error ocurred during SubMarket search:" + error);
                     return [];
                 });

    };

    $scope.searchNonDigitalStaions = function (stationFilter) {

        return crankService.stations.searchByName(stationFilter, 'FM')
                 .then(function (data) {

                     return _.filter(data, function (station) { return ($rootScope.current_login_user.stations.indexOf(station.id) == -1) });


                 },
                 function (error) {
                     console.log("Error ocurred during station search:" + error);
                     return [];
                 });




    };

    //Module
    $scope.saveInNetworkModule = function () {
        $rootScope.current_login_user.modules = _.map($scope.InNetworkModulesList,
            function (moduleObj) {
                return moduleObj.id;

            });

        //Save user information
        $scope.saveUserData()
        .then(function (data) {

            // Reset all user modules flag

            $rootScope.resetUserModuleFlag();
            //refresh  modules on dashboard

            $rootScope.refreshUserModules($scope.InNetworkModulesList);
            $rootScope.refreshModules();

            console.log("Succesfully saved modules information in database:" + data);
        },
       function (error) {
           console.log("Error ocurred during user information save in database:" + error);
       });
    };

    $scope.getSelectModule = function (name) {
        $scope.currentSelectedModule = name;

    }

    $scope.moveModuleOutFormUserNetwork = function (id) {
        for (var i = $scope.InNetworkModulesList.length - 1; i >= 0; i--) {
            if ($scope.InNetworkModulesList[i].id == id) {
                $scope.OutOfNetworkModules.push($scope.InNetworkModulesList[i]);
                $scope.InNetworkModulesList.splice(i, 1);
                $scope.saveInNetworkModule();
            }
        }
    }

    // Shows tab functions
    $scope.filterShowsByDate = function (date) {

        var month = parseInt(date.monthDigit) < 9 ? "0" + date.monthDigit : date.monthDigit;
        var day = parseInt(date.day) < 9 ? "0" + date.day : date.day;
        $scope.searchInShowsText = date.year + '-' + month + '-' + day;
    }

    // set Expened promotion history row
    $scope.expenedRow = '';
    $scope.setexpenedRow = '';

    $scope.setExpenedPromotionRow = function (row) {

        $scope.expenedRow = row;
    }

    $scope.setPromotionRowExpened = function (row) {
        if ($scope.setexpenedRow === row) {
            $scope.setexpenedRow = '';
            return;
        }
        $scope.setexpenedRow = row;
    }

    // to set width for country div on digitals
    $scope.setLastCountryDivWidth = function (index, totalItems) {

        if ((index + 1) < totalItems) {
            return { 'width': '25%' }
        }

        var reminder = ((index + 1) % 4);
        if (reminder != 0) {
            var neededWidth = (4 - reminder);
            var width = ((25 * neededWidth) + 25) + '%';
            return { 'width': width }
        }
        return { 'width': '25%' }


    }

});


var workpageCtrl = function ($scope, $http, $modalInstance, $animate) {
    $scope.is_loading = false;


    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

};

//Inivte controller
app.controller('inviteCtrl', function ($scope, $uibModalInstance, $animate, inviteUser, crankService) {
    $scope.user = inviteUser;

    $scope.cancel = function cancel() {
        $uibModalInstance.close();
    };

    $scope.SendInviteMail = function SendInviteMail(isValid) {

        if (isValid) {
            crankService.users.invite($scope.user)
               .then(function (data) {
                   console.log("Sent invite email successsfully to user " + $scope.user.email);
               },
               function (error) {
                   console.log("Error ocurred white sending email to user " + $scope.user.email + ', Error: ' + +error);
               });
            $uibModalInstance.close();
        };
    }

});

// Invite digital user controller
app.controller('inviteDigitalCtrl', function ($scope, $uibModalInstance, $animate, inviteUser, companyId, crankService) {
    $scope.name = '';
    $scope.email = '';
    $scope.companyId = companyId;
    $scope.invite_in_progress = false;

    if (inviteUser)
    {
        $scope.email = inviteUser.userid;
    }
    $scope.cancel = function cancel() {
        $uibModalInstance.close();
    };

    $scope.SendDigitalInviteMail = function SendDigitalInviteMail(isValid) {

        if (isValid) {
            $scope.invite_in_progress = true;
            var invitedUser = { companyId: $scope.companyId,  userEmail: $scope.email };
            crankService.users.inviteDigital(invitedUser)
               .then(function (data)
               {
                   $scope.invite_in_progress = false;
                   // update company invite link after sent invite 
                   $scope.$parent.removeinvitationLinkAfterInvitation($scope.companyId);
                   console.log("Sent invite email successsfully to user " + $scope.email);
                   $uibModalInstance.close();
               },
               function (error) {
                   console.log("Error ocurred white sending email to user " + $scope.email + ', Error: ' + +error);
               });
          
        };
    }

});



app.controller('messageCtrl', function ($scope, $uibModalInstance, message) {
    $scope.message = message;
    $scope.ok = function ok() {
        $uibModalInstance.close();
    };
    $scope.cancel = function cancel() {
        $uibModalInstance.close();
    };

});