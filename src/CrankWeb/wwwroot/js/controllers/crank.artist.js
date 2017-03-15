/**
* Crank Artist app
* */

// TODO implement this to exchange data beetween states ??
app.factory('$artistScope', function ($rootScope) {

    // This should alias artist scope on init
    // This gets init each time the artistCtrl gets loaded
    var state = {};

    // Map

    // Analytics
    state.selected_action;
    state.selected_station;
    state.shown_station_info_panel;
    state.selected_format_node;
    state.stations;

    // Artistf
    return state;
});

app.controller('artistCtrl', function ($rootScope, $scope, $http, $uibModal, $timeout, $filter, crankService, $q) {

    $scope.initVariables = function() {
        $rootScope.checkUser();
        $scope.userType = ($rootScope.current_user) ? $rootScope.current_user.userType.toLowerCase() : '';

        // the map auto navigate on or of
        $scope.isAutoZoomOnMap = true;
        $scope.toggleAutoMapZoom = function () {
            $scope.isAutoZoomOnMap = !$scope.isAutoZoomOnMap;
        }
        //$scope.current_view = 'artist'; // artist or analytics
        $scope.current_view = 'artist'; // artist or analytics
        $scope.current_view_template = 'partials/artist_map.html';
        $scope.sourcePanelVisibleTab = 'main';
        $scope.current_promotion_template = $scope.userType == 'radio_manager' ? 'partials/promotion_panel_noneditable.html' : 'partials/promotion_panel_editable.html';
        $scope.dates_scroller_opt = {
            scrollX: true,
            scrollY: false,
            //mouseWheel: true, 
            click: true,
            disableMouse: false,
            disablePointer: true,
            disableTouch: true,
            eventPassthrough: false,
            bounce: false
        };

        $scope.totalCharts = [];
        for (var i = 10; i <= 150; i++) {
            $scope.totalCharts.push(i);
        }

        $scope.isShowAllConnectedUsersOnMessenger = false;
        $scope.nav_Bar_Search_Text = '';
        $scope.usersInChat = [];

        $scope.mainsourcepanel = { 'display': 'flex', 'opacity': '1' };

        //TODO: Verify wheteher this is required

        // #region Dates

        $scope.dates = [];
        $scope.n = 720;

        // Actually binding to $parent.map because ng-include creates new scope
        $scope.map = null;
        $scope.mediabase_layer = null;
        $scope.artists = [];
        $scope.markets = [];
        $scope.stations = [];
        $scope.venues = [];
        $scope.showsFilter = "";
        $scope.shows = [];
        $scope.artistEvents = [];
        $scope.userShows = [];
        $scope.selectedEvent = null;
        $scope.showTiles = true;
        $scope.showTourDateScroller = false;
        $scope.showEventsScroller = true;
        $scope.showSourcePanel = false;
        $scope.showModule = false;
        $scope.isPromotionModuleMaximized = false;
        $scope.isChartingModuleMaximized = false;
        $scope.isEventsPanelMaximized = true;
        $scope.isTreemapModuleMaximized = false;
        $scope.stationsSelected = [];
        $scope.subMarketSearch = "";
        $scope.hoveredStation = null;
        $scope.stationPanelInfoVisible = false;
        $scope.stationCoverageMaps = [];
        $scope.displayedCoverageMaps = [];
        $scope.coverageMapColors = ['#F8AD90', '#D4A4CC', '#FFE286', '#7FD5D6', '#F79F57', '#7EC5A5', '#9F98BA', '#E27E7E'];

        //Hash storing users object
        $scope.userList = [];

        $scope.twoDigits = /[0-9]{2}/;

        if ($rootScope.current_user) {
            $scope.userList[$rootScope.current_user.id] = $rootScope.current_user;
        }

        $scope.current_market = null;
        $scope.current_market_data;
        $scope.current_artist = null;
        $scope.artist_carousel;
        $scope.datapanel_open = false;
        $scope.generateDates();

        $scope.hoverStationInfo = {
            stationSeq: '',
            stationName: '',
            stationType: '',
            stationFormat: ''
        };


        $scope.artist_scroller_opt = {
            scrollX: true,
            scrollY: false,
            mouseWheel: true,
            click: true,
            disableMouse: false,
            disablePointer: true,
            disableTouch: true,
            eventPassthrough: false,
            bounce: false,
            probeType: 2
        };

        $scope.artist_tile_scroller_opt = {
            scrollX: true,
            scrollY: true,
            mouseWheel: true,
            click: true,
            disableMouse: false,
            disablePointer: true,
            disableTouch: true,
            eventPassthrough: true,
            probeType: 2,
            hScrollbar: false,
            vScrollbar: true,
            bounce: false,
            hideScrollbar: true

        };

        $scope.myScrollOptions = {
            'promotion_stations_wrapper':
                {
                    scrollX: true,
                    scrollY: false,
                    mouseWheel: true,
                    click: true,
                    disableMouse: false,
                    disablePointer: true,
                    disableTouch: true,
                    eventPassthrough: true,
                    probeType: 2,
                    momentum: true,
                    scrollbars: true,
                    fadeScrollbars: true,
                    shrinkScrollbars: 'clip',
                    resizeScrollbars: true,
                    bounce: false,
                },
            'events_wrapper':
                {

                    mouseWheel: true,
                    mouseWheelSpeed: 1,
                    click: false,
                    tap: false,
                    disableMouse: false,
                    disablePointer: true,
                    disableTouch: true,
                    momentum: true,
                    bounce: false,
                    scrollbars: true,
                    fadeScrollbars: true,
                    resizeScrollbars: true,

                    // bounceTime: 2000,
                },
            'charts_scroller_wrapper':
                {
                    scrollX: false,
                    scrollY: true,
                    mouseWheel: true,
                    mouseWheelSpeed: 1,
                    click: false,
                    tap: false,
                    disableMouse: false,
                    disablePointer: true,
                    disableTouch: true,
                    momentum: true,
                    bounce: false,
                    scrollbars: true,
                    fadeScrollbars: true,
                    resizeScrollbars: true
                },
            'messenger_users_wrapper':
           {
               scrollX: true,
               scrollY: false,
               mouseWheel: true,
               mouseWheelSpeed: 1,
               click: false,
               tap: false,
               disableMouse: false,
               disablePointer: true,
               disableTouch: true,
               momentum: true,
               bounce: false,
               scrollbars: true,
               fadeScrollbars: true,
               resizeScrollbars: true,

               // bounceTime: 2000,
           },

            'roster_artist_scroller': {

                scrollX: true,
                scrollY: false,
                mouseWheel: true,
                click: true,
                disableMouse: false,
                disablePointer: true,
                disableTouch: true,
                eventPassthrough: false,
                bounce: false,
                momentum: true,
                probeType: 2

            },
            'roster_veunes_scroller': {

                scrollX: true,
                scrollY: false,
                mouseWheel: true,
                mouseWheelSpeed: 1,
                click: true,
                disableMouse: false,
                disablePointer: true,
                disableTouch: true,
                momentum: true,
                bounce: false,

            },
            'roster_stations_scroller': {

                scrollX: true,
                scrollY: false,
                mouseWheel: true,
                mouseWheelSpeed: 1,
                click: true,
                disableMouse: false,
                disablePointer: true,
                disableTouch: true,
                momentum: true,
                bounce: false,

            },
            'source_panel_digitals_scroller': {

                scrollX: true,
                scrollY: false,
                mouseWheel: true,
                click: true,
                disableMouse: false,
                disablePointer: true,
                disableTouch: true,
                eventPassthrough: false,
                bounce: false,
                momentum: true,
                probeType: 2

            },

        };
    }

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
        var days = $scope.getDays(720);
        for (var i = 0; i < 720; i++) {
            var date = {};
            date.day = days[i].toDateString().replace(" " + days[i].getFullYear(), "").substring(4);
            date.index = i;
            $scope.dates.push(date);
        }
    };

    $scope.initVariables();

    $scope.$on('crankRefresh', function () {
        console.log('refreshing artist');
        $scope.refreshData();
        $scope.init();
    });

    //scrollX: true,
    //scrollY: true,
    //mouseWheel: true,
    //click: true,
    //disableMouse: false,
    //disablePointer: true,
    //disableTouch: true,
    //eventPassthrough: false,
    //bounce: false,
    //probeType: 2,

    //$scope.initPromoterIscroller = function ()
    //{
    //    debugger;
    //    $scope.myScrollOptions = {
    //'source_panel_promoter_scroller':
    //    {
    //        scrollX: true, scrollY: false, mouseWheel: true, snap: false
    //    }
    //   };

    // }

    //$scope.source_panel_promoter_scroller=
    //{
    //    scrollX: true, scrollY: false, mouseWheel: true, snap: false
    //}

    // Map initialization
    $scope.tile_layer = new L.TileLayer(
       'http://a.tiles.mapbox.com/v3/bgriffi.map-64e87391/{z}/{x}/{y}.png', {
           attribution: "",
           maxZoom: 18,
           minZoom: 2
       }
   );

    $scope.markers_layer = new L.FeatureGroup();
    $scope.country_layer = new L.FeatureGroup();
    $scope.map_options = {
        center: new L.LatLng(30, -15),
        zoom: 2,
        base_layer: $scope.tile_layer
    };

    $scope.createCoverageMapLayer = function (station, index) {
        if (!$scope.stationCoverageMaps[station.id]) {
            //Create coverage map
            if (station.coverageMap) {
                var sColor = $scope.coverageMapColors[index % $scope.coverageMapColors.length]
                var sCoverageMap = omnivore.kml.parse(station.coverageMap);
                sCoverageMap.setStyle({
                    color: sColor,
                    opacity: .8,
                    weight: 3,
                    fill: true,
                    fillColor: sColor,
                    fillOpacity: 0.3
                });


                if (sCoverageMap) {
                    $scope.stationCoverageMaps[station.id] = sCoverageMap;
                }
            }
        }
    };

    $scope.showCoverageMap = function showCoverageMap(station, index) {


        //Check wehther we have coverage map
        $scope.createCoverageMapLayer(station, index);

        if ($scope.stationCoverageMaps[station.id]) {
            //Display the map
            $scope.map.addLayer($scope.stationCoverageMaps[station.id]);
            $scope.displayedCoverageMaps.push(station.id);
        }

    };

    $scope.hideCoverageMap = function hideCoverageMap(station) {
        //Check wehther we have coverage map
        if ($scope.stationCoverageMaps[station.id]) {
            //Display the map
            $scope.map.removeLayer($scope.stationCoverageMaps[station.id]);

            _.remove($scope.displayedCoverageMaps, function (sId) {
                return sId == station.id;
            });
        }

    };

    $scope.removeSelectedStationMaps = function removeSelectedStationMaps() {
        _.each($scope.displayedCoverageMaps, function (sId) {
            if ($scope.stationCoverageMaps[sId]) {
                //Display the map
                $scope.map.removeLayer($scope.stationCoverageMaps[sId]);
            }
        });

        //Reset displayedCoverageMaps
        $scope.displayedCoverageMaps = [];
    }

    //$scope.toggleView = function ()
    //{
    //    switch ($scope.current_view)
    //    {
    //        case ('analytics'):
    //            $scope.current_view = 'artist';
    //            break;
    //        case ('artist'):
    //            $scope.current_view = 'analytics';
    //            break;
    //    }
    //};


    ///*
    //* Watch for current view changes and init the view
    //*/
    //$scope.$watch('current_view', function (val)
    //{
    //    switch (val)
    //    {
    //        case ('artist'):
    //            $scope.current_view_template = 'partials/artist_map.html';

    //            $scope.init();
    //            $scope.initMap();
    //            break;
    //        case ('analytics'):
    //            $scope.current_view_template = 'partials/artist_analytics.html';
    //            break;
    //    }

    //});

    $scope.selectArtist = function selectArtist(artist, loadExtraEvent, selectedEvent) {

        if (artist === $scope.current_artist) {

            $scope.showTourDateScroller = true;
            $scope.showSourcePanel = true;
            //Artists has been selected
            return;
        }


        //Reset previous artist if selected
        if ($scope.current_artist != null) {
            //Previously selected aritst exist
            $scope.current_artist.selected = false;
            $scope.resetEventDates();
        }

        $scope.current_artist = artist;
        $scope.current_artist.selected = true;


        // When user promoter no need to reset event
        if (!selectedEvent)
            $scope.resetSelectedEvent();

        // Reset event connections
        $scope.resetEventConnections();
        //NO events selected, then select first event

        // When user promoter no need to select event again
        if (!selectedEvent)
            $scope.selectedEvent = _.find($scope.artistEvents, function (o) {
                return o.artistId == $scope.current_artist.id;
            });

        if ($scope.selectedEvent) {
            $scope.selectedEvent.isSelected = true;
            $scope.validateUserForEvent($scope.selectedEvent);
            $scope.setMapToSelectedEvent();
            // TODO: Please  check this code hope it will not effect any other logic  please confirm this 
            // This if is for resolve issue CPO-215
            if (loadExtraEvent == null || loadExtraEvent == undefined) {
                $scope.loadEventExtras();
            }
            $scope.isEventsPanelMaximized = false;
            $scope.isPromotionModuleMaximized = true;
            $scope.scrollToActiveEvent();
        }
        else {

            //  Refresh users on messenger panel
            $scope.setVisiablefalseAllConnectedUsers();
            $scope.resetMap();
        }

        // console.log(artist);
        $scope.showTourDateScroller = true;
        $scope.showSourcePanel = true;
        // Load heatmap data
        if ($scope.map) {
            //uncomment this later..09/24/2016
            //  $scope.updateHeatmap(artist);
        }


        //Filter the events to the selected artists
        var filteredEvents = _.filter($scope.artistEvents, function (o) {
            return o.artistId == $scope.current_artist.id;
        });

        //Set filter
        if ($scope.current_venue == undefined || $scope.current_venue == null) {

            $scope.showsFilter = $scope.current_artist.id;
        }
        else if ($scope.current_venue.selected == true) {
            filteredEvents = _.filter($scope.artistEvents, function (o) {
                return o.venueId == $scope.current_venue.id;
            });
        }
        else if ($scope.current_venue.selected == false) {
            $scope.showsFilter = $scope.current_artist.id;
        }


        $scope.addEventDates(filteredEvents);
        //Make call to events scroller notify the wrapper size change
        $scope.delayedRefreshiScroll('events_wrapper', 200);

        // minimize  all module  panel
        $scope.hideAllModulePanel();
    };




    $scope.setMapToSelectedEvent = function setMapToSelectedEvent() {

        if ($scope.selectedEvent.lngLat && $scope.isAutoZoomOnMap) {
            $scope.setMapToLocation($scope.selectedEvent.lngLat);
        }
    }

    $scope.setMapToLocation = function setMapToLocation(lngLat) {
        if (lngLat) {
            var lat = (lngLat.y || lngLat.latitude) - .25;
            var lng = (lngLat.x || lngLat.longitude) + 3;

            $scope.map.flyTo(new L.LatLng(lat, lng), 8,
                {
                    animate: true,
                    duration: 2,
                    easeLinearity: 0.25
                });
        }
    };

    $scope.resetMap = function resetMap() {
        $scope.map.flyTo(new L.LatLng(30, -15), 2,
                {
                    animate: true,
                    duration: 1,
                    easeLinearity: 0.25
                });
    }

    $scope.selectVenue = function selectVenue(venue) {
        if (venue === $scope.current_venue) {
            $scope.showTourDateScroller = true;
            $scope.showSourcePanel = false;
            //Artists has been selected
            return;
        }
        // reset selected event 
        $scope.resetSelectedEvent();

        // Reset tour  date scroller
        $scope.resetEventDates();
        //Reset previous artist if selected
        if ($scope.current_venue != null) {
            //Previously selected aritst exist
            $scope.current_venue.selected = false;

        }

        $scope.current_venue = venue;
        $scope.current_venue.selected = true;

        // console.log(artist);
        $scope.showTourDateScroller = true;
        $scope.showSourcePanel = false;
        // Load heatmap data
        if ($scope.map) {
            //  $scope.updateHeatmap(venue);
        }

        var filteredEvents = _.filter($scope.artistEvents, function (o) {
            return (o.venueId == $scope.current_venue.id);
        });


        //Set filter
        $scope.showsFilter = $scope.current_venue.id;

        $scope.addEventDates(filteredEvents);

        //Make call to events scroller notify the wrapper size change
        $scope.delayedRefreshiScroll('events_wrapper', 500);


        // Minimze all module  panel
        $scope.hideAllModulePanel();

    };

    $scope.selectStation = function selectStation(station) {

        if (station === $scope.current_station) {
            $scope.showTourDateScroller = true;
            $scope.showSourcePanel = false;
            return;
        }
        // Reset event date scroller
        $scope.resetEventDates();
        //Reset previous artist if selected
        if ($scope.current_station != null) {
            //Previously selected aritst exist
            $scope.current_station.selected = false;
        }

        $scope.current_station = station;
        $scope.current_station.selected = true;

        $scope.showTourDateScroller = true;
        $scope.showSourcePanel = false;

        // Load heatmap data
        if ($scope.map) {
            // $scope.updateHeatmap(artist);
        }

        //Filter the events to the selected artists
        var filteredEvents = _.filter($scope.artistEvents, function (o) {
            return (o.marketId == $scope.current_station.metroAreaId);
        });


        //Set filter
        $scope.showsFilter = $scope.current_station.metroAreaId;
        $scope.addEventDates(filteredEvents);

        //Make call to events scroller notify the wrapper size change
        $scope.delayedRefreshiScroll('events_wrapper', 500);
    };

    $scope.getActiveSourcePanelAssociations = function getActiveSourcePanelAssociations(assignedAs) {

        var associationList = [];
        var associationArr = [];

        switch (assignedAs) {
            case ASSIGNED_AS_DIGITAL:
                associationArr = $scope.sourcePanelDigitals;
                break;
            case ASSIGNED_AS_AGENCY:
                associationArr = $scope.sourcePanelAgents;
                break;
            case ASSIGNED_AS_PROMOTER:
                associationArr = $scope.sourcePanelPromoters;
                break;
            case ASSIGNED_AS_ARTIST_MANAGER:
                associationArr = $scope.sourcePanelArtistManagers;
                break;
            case ASSIGNED_AS_LABEL:
                associationArr = $scope.sourcePanelLabels;
                break;
            case ASSIGNED_AS_SPONSOR:
                associationArr = $scope.sourcePanelSponsors;
                break;
        }

        for (var iCount = 0; iCount < associationArr.length; iCount++) {
            if (associationArr[iCount].isActive) {
                var association = {

                    "assignedBy": $rootScope.current_login_user.id,
                    "assignedTo": associationArr[iCount].id,
                    "assignedAs": assignedAs
                };
                associationList.push(association);
            }
        }

        return associationList;
    }


    $scope.updateEventExtrasAssociation = function updateEventExtrasAssociation(objArray, eventExtra, assignedAs) {
        _.each(objArray, function (uObj) {
            if (uObj.isConnected || uObj.isDigital) {
                var aObj = _.find(eventExtra.associations, function (obj) {
                    return obj.assignedTo == uObj.id;
                });

                if (uObj.isSelected && !aObj) {
                    //Association doens't exist, create one
                    //Create new association
                    eventExtra.associations.push(
                        {
                            'assignedBy': $scope.current_login_user.id,
                            'assignedTo': uObj.id,
                            'assignedAs': assignedAs
                        });
                }
                if (!uObj.isSelected && aObj) {
                    //Remove association
                    _.remove(eventExtra.associations, function (obj) {
                        return obj.assignedTo == uObj.id;
                    });
                }
            }
        });
    };

    $scope.newEventExtras = function newEventExtras() {
        if ($scope.selectedEvent && !$scope.selectedEvent.eventExtras) {
            //Create new eventextract object
            $scope.selectedEvent.eventExtras = {
                "eventId": $scope.selectedEvent.id,
                'isEditable': true,
                'associations': [],
                'marketPromotions': []
            };

            //New eventExtra has to be created
            $scope.selectedEvent.createNewEventExtra = true;
        }
    }


    $scope.saveEventExtras = function saveEventExtras(assignedAs, inputObj) {
        //Reset tab to main
        //  $scope.sourcePanelVisibleTab = 'main';
        var createNewEventExtra = false;
        if ($scope.selectedEvent && $scope.saveConnectionChanges) {
            $scope.newEventExtras();

            switch (assignedAs) {
                case USER_TYPE_ARTIST_MANAGER:
                    $scope.updateEventExtrasAssociation($scope.sourcePanelArtistManagers, $scope.selectedEvent.eventExtras, USER_TYPE_ARTIST_MANAGER);
                    break;
                case USER_TYPE_AGENT_MANAGER:
                    $scope.updateEventExtrasAssociation($scope.sourcePanelAgents, $scope.selectedEvent.eventExtras, USER_TYPE_AGENT_MANAGER);
                    break;
                case USER_TYPE_PROMOTER_MANAGER:
                    $scope.updateEventExtrasAssociation($scope.sourcePanelPromoters, $scope.selectedEvent.eventExtras, USER_TYPE_PROMOTER_MANAGER);
                    break;
                case USER_TYPE_RECORDLABEL_MANAGER:
                    $scope.updateEventExtrasAssociation($scope.sourcePanelLabels, $scope.selectedEvent.eventExtras, USER_TYPE_RECORDLABEL_MANAGER);
                    break;
                case USER_TYPE_SPONSOR_MANAGER:
                    $scope.updateEventExtrasAssociation($scope.sourcePanelSponsors, $scope.selectedEvent.eventExtras, USER_TYPE_SPONSOR_MANAGER);
                    break;
                case USER_TYPE_DIGITAL_MANAGER:
                    $scope.updateEventExtrasAssociation($scope.sourcePanelDigitals, $scope.selectedEvent.eventExtras, USER_TYPE_DIGITAL_MANAGER);
                    break;
            }

            //Save Event extras object

            $scope.saveEventExtrasInDb(assignedAs, inputObj);
            $scope.saveConnectionChanges = false;
        }
    }

    $scope.saveEventExtrasInDb = function saveEventExtrasInDb(assignedAs, inputObj) {
        if ($scope.selectedEvent && $scope.selectedEvent.eventExtras) {
            if ($scope.selectedEvent.createNewEventExtra && $scope.selectedEvent.createNewEventExtra == true) {
                crankService.events.postEventExtras($scope.selectedEvent.eventExtras)
                    .then(function (data) {
                        console.log("Successfully added extra event associations data");
                        $scope.selectedEvent.createNewEventExtra = false;
                        $scope.selectedEvent.eventExtras.id = data.id;

                        //  Refresh users on messenger panel
                        $scope.setVisiablefalseAllConnectedUsers();

                        _.each($scope.selectedEvent.eventExtras.associations, function (aObj) {
                            $scope.refreshMessengnerPanelUsers(aObj.assignedTo);
                        });

                        // Refresh market stations 

                        if (inputObj) {
                            $scope.refreshPanelAfterToggleSourcePanelItem(assignedAs, inputObj.id);
                        }
                    },
                   function (error) {
                       console.log("Error ocurred during extra event associations creation:" + error);
                   });
            }
            else {
                crankService.events.putEventExtras($scope.selectedEvent.eventExtras)
                  .then(function (data) {
                      console.log("Successfully updated extra event associations data");
                      $scope.selectedEvent.createNewEventExtra = false;

                      //  Refresh users on messenger panel
                      $scope.setVisiablefalseAllConnectedUsers();

                      _.each($scope.selectedEvent.eventExtras.associations, function (aObj) {
                          $scope.refreshMessengnerPanelUsers(aObj.assignedTo);
                      });
                      // Refresh market stations 
                      if (inputObj) {
                          $scope.refreshPanelAfterToggleSourcePanelItem(assignedAs, inputObj.id);
                      }
                  },
                 function (error) {
                     console.log("Error ocurred during extra event associations update:" + error);
                 });
            }
        }
    }


    $scope.refreshPanelAfterToggleSourcePanelItem = function (assignedAs, param) {
        switch (assignedAs) {
            case USER_TYPE_ARTIST_MANAGER:

                break;
            case USER_TYPE_AGENT_MANAGER:

                break;
            case USER_TYPE_PROMOTER_MANAGER:

                break;
            case USER_TYPE_RECORDLABEL_MANAGER:

                break;
            case USER_TYPE_SPONSOR_MANAGER:

                break;
            case USER_TYPE_DIGITAL_MANAGER:
                // Refresh market stations 
                if (param) {
                    $scope.addAndRemoveRadioStationsFromPromotionPanel(param);
                }
                break;
        }
    }


    $scope.addAndRemoveRadioStationsFromPromotionPanel = function (id) {
        //TODO:NEED to Discuss with raju which object is needed for stations on radio panel
        var stationIndex = _.findIndex($scope.selectedEvent.activeStationsList, ['id', id]);

        if (stationIndex > -1) {
            $scope.selectedEvent.activeStationsList.splice(stationIndex, 1);
            $scope.delayedRefreshiScroll('promotion_stations_wrapper', 100);
        }

        else {
            crankService.stations.getById(id).then(function (stationObj) {
                if (stationObj) {
                    var retStationObj = {
                        "id": stationObj.id,
                        "name": stationObj.name,
                        "callcode": stationObj.callcode,
                        "sType": stationObj.Type,
                        "format": stationObj.format,
                        "owner": stationObj.owner,
                        "market": stationObj.market,
                        "city": stationObj.city,
                        "frequency": stationObj.frequency,
                        "imageUrl": crankServiceApi + '/stations/' + stationObj.id + '/images/normal/' + stationObj.owner,
                        "isSelected": false,
                        "coverageMap": stationObj.coverageMap,
                        "lngLat": stationObj.lngLat,
                        "selectedBy": [],
                        "promotions": [],
                        "hasImage": true,
                    }
                    $scope.selectedEvent.activeStationsList.unshift(retStationObj);
                    // $scope.selectedEvent.activeStationsList.push(retStationObj);
                    $scope.delayedRefreshiScroll('promotion_stations_wrapper', 100);
                }
            }).catch(function () { });

        }
    }

    // validate user can add/romove promotion for event 
    $scope.validateUserForEvent = function (event) {
        $scope.isEventForUser = event.isDisplay;

    }
    $scope.selectEventArtist = function selectEventArtist($event, artistEvent, index) {

        if ($event) {
            $event.stopPropagation();
        }

        //This happens when tour date scroller is clicked with an empty slot
        if (!artistEvent) {
            return;
        }

        if ($scope.selectedEvent === artistEvent) {
            //Selecting same event
            return;
        }

        $scope.resetSelectedEvent();

        artistEvent.isSelected = true;

        //validate  user for event user can perform any action on event or not
        $scope.validateUserForEvent(artistEvent);

        // if current user is PROMOTER
        // TODO: CPO 153 will discuss about this code with raju
        if ($scope.userType == USER_TYPE_PROMOTER_MANAGER) {
            //hight event venue
            //Reset previous artist if selected
            //TODO: Discuss with Raju about this code
            //if ($scope.current_venue != null) {
            //    //Previously selected aritst exist
            //    $scope.current_venue.selected = false;
            //}
            //else {
            //    //adding all events of artist
            //    //$scope.addEventDates($scope.artistEvents);
            //    ////Make call to events scroller notify the wrapper size change
            //    //$scope.delayedRefreshiScroll('events_wrapper', 200);
            //    //$scope.showTourDateScroller = true;
            //}

            // off default selection on venue 

            //var eventVenue = _.find($scope.venues, function (v) { return v.id == artistEvent.venueId; });
            //if (eventVenue) {
            //    $scope.current_venue = eventVenue;
            //    $scope.current_venue.selected = true;
            //}
        }
        // if current user is radio
        if ($scope.userType == USER_TYPE_RADIO_MANAGER) {

            if ($scope.current_station == null) {
                //adding all events of artist
                $scope.addEventDates($scope.artistEvents);
                //Make call to events scroller notify the wrapper size change
                $scope.delayedRefreshiScroll('events_wrapper', 200);
                $scope.showTourDateScroller = true;
            }

            if ($scope.current_station != null) {
                if (index) {
                    // exchange object
                    $scope.exchangeEvents(index);
                }
                $scope.current_station.selected = false;
            }

            $scope.current_station = null;
        }

        var eventArtist = _.find($scope.artists, function (a) { return a.id == artistEvent.artistId; });
        if (eventArtist == null) {
            //Build artist object from the aritist info in the event
            eventArtist =
                {
                    "id": artistEvent.artistId,
                    "title": artistEvent.artistName,
                    "artistName": artistEvent.artistName,
                    "artistImg": crankServiceApi + '/artists/' + artistEvent.artistId + '/images/large',
                    "artistImgHuge": crankServiceApi + '/artists/' + artistEvent.artistId + '/images/huge'
                };
        }
        if ($scope.userType == 'artist_manager' || $scope.userType == 'label' || $scope.userType == USER_TYPE_PROMOTER_MANAGER) {
            if ($scope.current_artist && $scope.current_artist !== eventArtist) {
                $scope.current_artist.selected = false;
                $scope.current_artist = null;
            }
        }

        if (eventArtist != null) {
            $scope.selectedEvent = artistEvent;
            $scope.isEventsPanelMaximized = false;
            // $scope.isPromotionModuleMaximized = true;
            $scope.setMapToSelectedEvent();
            $scope.showSourcePanel = true;
            //fill the sourcepanel stattions for the selected event
            $scope.loadEventExtras();

            //  pass selected event to artist to prevent  select event twice 
            if ($scope.userType == 'artist_manager' || $scope.userType == 'label' || $scope.userType == USER_TYPE_PROMOTER_MANAGER) {
                $scope.selectArtist(eventArtist, false, $scope.selectedEvent);
            }
            else {
                $scope.current_artist = eventArtist;
                $scope.current_artist.selected = true;
            }
            $scope.scrollToActiveEvent();
        }
        //// Minimze all module  panel
        //$scope.hideAllModulePanel();
    };

    // exchange event to selected
    $scope.exchangeEvents = function (index) {
        var extractedEvent = $scope.dates[index];
        var copyOfextractedEvent = angular.copy(extractedEvent);
        var selectedEvent = _.find(extractedEvent.moreEvents, ['event.isSelected', true]);
        if (selectedEvent) {

            // display selected event
            extractedEvent.city = selectedEvent.city;
            extractedEvent.artistName = selectedEvent.artistName;
            extractedEvent.venue = selectedEvent.venue;
            extractedEvent.eventId = selectedEvent.eventId;
            extractedEvent.event = selectedEvent.event;

            // add to more events
            selectedEvent.city = copyOfextractedEvent.city;
            selectedEvent.artistName = copyOfextractedEvent.artistName;
            selectedEvent.venue = copyOfextractedEvent.venue;
            selectedEvent.eventId = copyOfextractedEvent.eventId;
            selectedEvent.event = copyOfextractedEvent.event;

        }
    }

    $scope.setSelected = function setSelected(objArray, asObj) {
        var userObj = _.find(objArray, function (obj) {
            return obj.id == asObj.assignedTo;
        });

        if (userObj) {
            userObj.isSelected = true;
        }
    };

    //  user can add those digital stations to event that are in event country 
    $scope.refreshInEvenCountryDigitals = function () {

        try {
            // getting event cluntry
            var eventCountry = $scope.selectedEvent.city.substr(($scope.selectedEvent.city.lastIndexOf(',') + 1)).replace(" ", "");

            //there is difference between event country and digital country when it is USA. it is USA for station and US for event thats why adding 'A' with 'US'
            eventCountry = eventCountry.replace(/ /g, '');;
            if (eventCountry == 'US') {
                eventCountry = 'USA';
            }

            if ($scope.sourcePanelDigitals) {
                _.each($scope.sourcePanelDigitals, function (digitalStation) {
                    // if station has countries and enable/disable for event
                    if (digitalStation.countries.length > 0) {
                        var hasCountryIndex = _.findIndex(digitalStation.countries, function (country) { return country.toLowerCase() === eventCountry.toLowerCase() });
                        if (hasCountryIndex > -1) {
                            digitalStation.isAvailableForEvent = true;
                        }
                        else {
                            digitalStation.isAvailableForEvent = false;
                        }

                    }
                        // if station has not any country then it would be disable for event 
                    else {
                        digitalStation.isAvailableForEvent = false;

                    }
                });


            }
        }
        catch (e) {

        }

    }

    $scope.resetSelected = function setSelected(objArray) {
        _.each(objArray, function (obj) {
            if (obj.isConnected || obj.isDigital) {
                obj.isSelected = false;
            }

            if (obj.isDigital) {
                obj.isAvailableForEvent = false;
            }
        });
    };

    $scope.resetEventConnections = function resetEventConnections() {
        $scope.resetSelected($scope.sourcePanelArtistManagers);
        $scope.resetSelected($scope.sourcePanelAgents);
        $scope.resetSelected($scope.sourcePanelPromoters);
        $scope.resetSelected($scope.sourcePanelLabels);
        $scope.resetSelected($scope.sourcePanelSponsors);
        $scope.resetSelected($scope.sourcePanelDigitals);
    };

    $scope.updateEventConnections = function updateEventConnections() {

        // set all messenger user visible false to filter only users attached with current selected event 
        $scope.setVisiablefalseAllConnectedUsers();

        // refresh digitals in event country
        if ($scope.selectedEvent) {
            $scope.refreshInEvenCountryDigitals();
        }

        if ($scope.selectedEvent && $scope.selectedEvent.eventExtras) {

            _.each($scope.selectedEvent.eventExtras.associations, function (aObj) {
                // refresh messenger user panel  for chat. only users can do chat those are related with selected event
                $scope.refreshMessengnerPanelUsers(aObj.assignedTo);
                switch (aObj.assignedAs) {
                    case USER_TYPE_ARTIST_MANAGER:
                        $scope.setSelected($scope.sourcePanelArtistManagers, aObj);
                        break;
                    case USER_TYPE_AGENT_MANAGER:
                        $scope.setSelected($scope.sourcePanelAgents, aObj);
                        break;
                    case USER_TYPE_PROMOTER_MANAGER:
                        $scope.setSelected($scope.sourcePanelPromoters, aObj);
                        break;
                    case USER_TYPE_RECORDLABEL_MANAGER:
                        $scope.setSelected($scope.sourcePanelLabels, aObj);
                        break;
                    case USER_TYPE_SPONSOR_MANAGER:
                        $scope.setSelected($scope.sourcePanelSponsors, aObj);
                        break;
                    case USER_TYPE_DIGITAL_MANAGER:
                        $scope.setSelected($scope.sourcePanelDigitals, aObj);

                        break;
                }
            });

        }
    };

    //TODO : Raju this function to reset user event conections please check this CPO-339
    $scope.resetEventConnections = function () {
        _.each($scope.sourcePanelArtistManagers, function (manager) { if (!manager.isTeam) { manager.isSelected = false; } });

        _.each($scope.sourcePanelAgents, function (agent) { if (!agent.isTeam) { agent.isSelected = false; } });

        _.each($scope.sourcePanelPromoters, function (promoter) { if (!promoter.isTeam) { promoter.isSelected = false; } });

        _.each($scope.sourcePanelLabels, function (label) { if (!label.isTeam) { label.isSelected = false; } });

        _.each($scope.sourcePanelSponsors, function (sponsor) { if (!sponsor.isTeam) { sponsor.isSelected = false; } });

        _.each($scope.sourcePanelDigitals, function (digital) { digital.isSelected = false; });




    }


    $scope.setVisiablefalseAllConnectedUsers = function () {

        $scope.isShowAllConnectedUsersOnMessenger = true;
        _.each($scope.connectedUsers, function (user) { if (!user.isTeamMember) { user.isShow = false; } });
    }
    // refresh  messenger panel users 
    $scope.refreshMessengnerPanelUsers = function (associatedid) {
        var index = _.findIndex($scope.connectedUsers, ['id', associatedid]);
        if (index > -1) {
            $scope.connectedUsers[index].isShow = true;
        }
    }

    $scope.loadEventExtras = function loadEventExtras() {
        $scope.saveConnectionChanges = false;
        $scope.resetEventConnections();
        if ($scope.selectedEvent) {
            //Reset EventExtra object
            $scope.selectedEvent.eventExtras = null;
            $scope.selectedEvent.activePromotion = null;
            $scope.selectedEvent.hasTicket = false;
            $scope.selectedEvent.hasMeetNGreet = false;
            $scope.selectedEvent.hasInterview = false;
            $scope.selectedEvent.hasAppearnce = false;

            crankService.events.getEventExtras($scope.selectedEvent.id)
           .then(function (data) {
               console.log("Received additional info for event:" + data);
               $scope.selectedEvent.eventExtras = data;
               $scope.loadUserDetails(function () {
                   $scope.updateEventConnections();
                   $scope.loadSelectedEventSubMarkets();
                   $scope.loadSelectedEventStations();
               });

           },
           function (error) {
               console.log("Error ocurred during event additional information retrieval:" + error);
           });
        }
    };

    $scope.loadUserDetails = function loadUserDetails(callback) {
        var missingUsers = [];
        if ($scope.selectedEvent.eventExtras && $scope.selectedEvent.eventExtras.marketPromotions) {
            _.each($scope.selectedEvent.eventExtras.marketPromotions, function (marketPromotion) {
                _.each(marketPromotion.promoStations, function (promoStation) {
                    _.each(promoStation.promotions, function (promotion) {
                        _.each(promotion.promoInstances, function (promoInstance) {
                            //Check whehter we have promoter information
                            if (!$scope.userList[promoInstance.assignedBy]) {
                                missingUsers.push(promoInstance.assignedBy);
                            }
                        })
                    })

                });
            });

            if (missingUsers.length > 0) {
                //Load missing users and later call back
                crankService.users.getUserByIds(missingUsers)
                  .then(function (data) {
                      console.log("Received users information:" + data);

                      _.each(data,
                           function (userObj, key) {
                               if (!$scope.userList[userObj.id]) {
                                   $scope.userList[userObj.id] = userObj;
                               }
                           });
                      if (callback) {
                          callback();
                      }
                  },
                  function (error) {
                      console.log("Error ocurred during InNetwork user information retrieval:" + error);
                      if (callback) {
                          callback();
                      }
                  });
            }
            else {
                if (callback) {
                    callback();
                }
            }
        }
        else {
            if (callback) {
                callback();
            }
        }
    };

    $scope.loadSelectedEventSubMarkets = function loadSelectedEventSubMarkets() {
        if ($scope.selectedEvent) {

            $scope.selectedEvent.subMarkets.loaded = false;
            $scope.selectedEvent.subMarkets.subMarketList = [];
            //Time to load subMarkets for selected event
            if ($scope.selectedEvent.eventExtras.marketPromotions && $scope.selectedEvent.eventExtras.marketPromotions.length > 0) {
                var subMarkets = [];
                //Build sub market informaation
                _.each($scope.selectedEvent.eventExtras.marketPromotions, function (marketPromotionObj) {
                    if (marketPromotionObj.metroAreaId != $scope.selectedEvent.marketId) {
                        subMarkets.push(marketPromotionObj.metroAreaId);
                    }
                });


                if (subMarkets.length > 0) {
                    //Load submarket information
                    crankService.metroAreas.getByIds(subMarkets)
                     .then(function (data) {
                         console.log("Received sub markets list for for event:" + data);
                         //Parse stations list and add to selectedEvent stations
                         $scope.selectedEvent.subMarkets.subMarketList = _.map(data, function (marketObj) {
                             return {
                                 "id": marketObj.id,
                                 "name": marketObj.name,
                                 "state": marketObj.state,
                                 "country": marketObj.country
                             }
                         });
                         $scope.selectedEvent.subMarkets.loaded = true;

                     },
                     function (error) {
                         console.log("Error ocurred during SubMarket data load:" + error);
                     });
                }
            }
        }
    };

    $scope.addSelectedDigitalStations = function addSelectedDigitalStations(marketId) {
        if ($scope.selectedEvent) {
            var marketPromotion = null;
            if ($scope.selectedEvent.eventExtras && $scope.selectedEvent.eventExtras.marketPromotions) {
                marketPromotion = _.find($scope.selectedEvent.eventExtras.marketPromotions, function (marketPromotionObj) {
                    return marketPromotionObj.metroAreaId == marketId;
                });
            }

            //Parse stations list and add to selectedEvent stations
            var marketStationObj = {};
            $scope.selectedEvent.stations[marketId] = marketStationObj;
            marketStationObj.id = marketId;
            marketStationObj.stationsList = [];
            _.each($scope.sourcePanelDigitals, function (stationObj) {
                if (stationObj.isSelected) {
                    var retStationObj = {
                        "id": stationObj.id,
                        "name": stationObj.name,
                        "callcode": stationObj.callcode,
                        "sType": stationObj.sType,
                        "format": stationObj.format,
                        "owner": stationObj.owner,
                        "imageUrl": crankServiceApi + '/stations/' + stationObj.id + '/images/normal/' + stationObj.owner,
                        "isSelected": false,
                        "selectedBy": [],
                        "promotions": [],
                        'hasImage': true
                    };

                    if (marketPromotion) {
                        var stationPromotion = _.find(marketPromotion.promoStations, function (promoStation) {
                            return promoStation.stationId == stationObj.id;
                        });

                        if (stationPromotion) {
                            //Station promotion exist, read it
                            if (stationPromotion.selectedBy.length > 0) {
                                retStationObj.selectedBy = stationPromotion.selectedBy;

                                if (_.findIndex(stationPromotion.selectedBy, function (selectedByUserId) {
                                    return selectedByUserId == $rootScope.current_login_user.id;
                                }) >= 0) {
                                    retStationObj.isSelected = true;
                                }
                            }
                            if (stationPromotion.promotions.length > 0) {
                                retStationObj.promotions = stationPromotion.promotions;
                                _.each(retStationObj.promotions, function (promotion) {
                                    //Assign type anc css class
                                    switch (promotion.type) {
                                        case 'ticket':
                                            promotion.name = 'Tickets';
                                            promotion.promoClass = 'fa-ticket';
                                            $scope.selectedEvent.hasTicket = true;
                                            break;
                                        case 'meetngreet':
                                            promotion.name = 'Meet-n-Greet';
                                            promotion.promoClass = 'fa-camera';
                                            $scope.selectedEvent.hasMeetNGreet = true;
                                            break;
                                        case 'interview':
                                            promotion.name = 'Interview(s)';
                                            promotion.promoClass = 'fa-microphone';
                                            $scope.selectedEvent.hasInterview = true;
                                            break;
                                        case 'appearance':
                                            promotion.name = 'Appearance(s)';
                                            promotion.promoClass = 'fa-eye';
                                            $scope.selectedEvent.hasAppearnce = true;
                                            break;
                                    }

                                    //Assing promotion user information
                                    _.each(promotion.promoInstances, function (promoInstance) {
                                        if ($scope.userList[promoInstance.assignedBy]) {
                                            var userObj = $scope.userList[promoInstance.assignedBy];
                                            //User informaation exist, extract company and user full name
                                            promoInstance.companyName = userObj.companyName;
                                            promoInstance.userFullName = userObj.firstName + ' ' + userObj.lastName;
                                        }
                                    });
                                });
                            }
                        }
                    }

                    marketStationObj.stationsList.push(retStationObj);
                }

            });
        }
    };

    $scope.loadMarketStations = function loadMarketStations(marketId, assignToActiveStationList) {
        if ($scope.selectedEvent) {

            $scope.addSelectedDigitalStations(marketId);
            //Time to load stations for selected event
            crankService.stations.getByMetroId(marketId)
           .then(function (data) {

               var marketPromotion = null;
               if ($scope.selectedEvent.eventExtras && $scope.selectedEvent.eventExtras.marketPromotions) {
                   marketPromotion = _.find($scope.selectedEvent.eventExtras.marketPromotions, function (marketPromotionObj) {
                       return marketPromotionObj.metroAreaId == marketId;
                   });
               }

               console.log("Received station list for for event:" + data.length);
               //Parse stations list and add to selectedEvent stations
               var marketStationObj = {};
               if ($scope.selectedEvent.stations[marketId]) {
                   marketStationObj = $scope.selectedEvent.stations[marketId];
               }
               else {
                   $scope.selectedEvent.stations[marketId] = marketStationObj;
                   marketStationObj.id = marketId;

               }

               marketStationObj.loaded = true;
               var marketStations = _.map(data, function (stationObj, index) {
                   var retStationObj = {
                       "id": stationObj.id,
                       "name": stationObj.name,
                       "callcode": stationObj.callcode,
                       "sType": stationObj.sType,
                       "format": stationObj.format,
                       "owner": stationObj.owner,
                       "market": stationObj.market,
                       "city": stationObj.city,
                       "frequency": stationObj.frequency,
                       "imageUrl": crankServiceApi + '/stations/' + stationObj.id + '/images/normal/' + stationObj.owner,
                       "isSelected": false,
                       "coverageMap": stationObj.coverageMap,
                       "lngLat": stationObj.lngLat,
                       "selectedBy": [],
                       "promotions": []
                   };

                   if (marketPromotion) {
                       var stationPromotion = _.find(marketPromotion.promoStations, function (promoStation) {
                           return promoStation.stationId == stationObj.id;
                       });

                       if (stationPromotion) {
                           //Station promotion exist, read it
                           if (stationPromotion.selectedBy.length > 0) {
                               retStationObj.selectedBy = stationPromotion.selectedBy;

                               if (_.findIndex(stationPromotion.selectedBy, function (selectedByUserId) {
                                   return selectedByUserId == $rootScope.current_login_user.id;
                               }) >= 0) {
                                   retStationObj.isSelected = true;
                               }
                           }

                           if (stationPromotion.promotions.length > 0) {
                               retStationObj.promotions = stationPromotion.promotions;
                               _.each(retStationObj.promotions, function (promotion) {
                                   //Assign type anc css class
                                   switch (promotion.type) {
                                       case 'ticket':
                                           promotion.name = 'Tickets';
                                           promotion.promoClass = 'fa-ticket';
                                           $scope.selectedEvent.hasTicket = true;
                                           break;
                                       case 'meetngreet':
                                           promotion.name = 'Meet-n-Greet';
                                           promotion.promoClass = 'fa-camera';
                                           $scope.selectedEvent.hasMeetNGreet = true;
                                           break;
                                       case 'interview':
                                           promotion.name = 'Interview(s)';
                                           promotion.promoClass = 'fa-microphone';
                                           $scope.selectedEvent.hasInterview = true;
                                           break;
                                       case 'appearance':
                                           promotion.name = 'Appearance(s)';
                                           promotion.promoClass = 'fa-eye';
                                           $scope.selectedEvent.hasAppearnce = true;
                                           break;
                                   }

                                   //Assing promotion user information
                                   _.each(promotion.promoInstances, function (promoInstance) {
                                       if ($scope.userList[promoInstance.assignedBy]) {
                                           var userObj = $scope.userList[promoInstance.assignedBy];
                                           //User informaation exist, extract company and user full name
                                           promoInstance.companyName = userObj.companyName;
                                           promoInstance.userFullName = userObj.firstName + ' ' + userObj.lastName;
                                       }
                                   });
                               });
                           }
                       }
                   }

                   return retStationObj;
               });

               if (marketStations) {
                   if (marketStationObj.stationsList) {
                       marketStationObj.stationsList = marketStationObj.stationsList.concat(marketStations);
                   }
                   else {
                       marketStationObj.stationsList = marketStations;
                   }

               }


               //TODO:Raju Please check this is right place to draw coverage area for sub markets 

               var marketStations = $scope.selectedEvent.stations[marketId].stationsList;
               if (marketStations) {
                   _.each(marketStations, function (station, index) {

                       if (station.isSelected) {
                           $scope.showCoverageMap(station, index);
                       }
                   });
               }


               if (assignToActiveStationList) {


                   $scope.setSelectedEventActiveStation(marketStationObj.stationsList);

               }
           },
           function (error) {
               console.log("Error ocurred during additional information retrieval:" + error);
           });
        }
    };

    $scope.searchMarkets = function searchMarkets(marketFilter) {

        //if event is not for user then user can't update its promotions
        if (!$scope.isEventForUser) {
            return [];
        }

        return crankService.metroAreas.searchByName(marketFilter)
               .then(function (data) {
                   return data;
               },
               function (error) {
                   console.log("Error ocurred during SubMarket search:" + error);
                   return [];
               });
    }

    $scope.addSubMarketsToEvent = function addSubMarketsToEvent($item, $model, $label) {

        //if event is not for user then user can't update its promotions
        if (!$scope.isEventForUser) {
            return [];
        }

        if ($scope.selectedEvent) {
            //Add market to subMarket list and load radio stations
            //Make sure selected subMarket doens't exist
            if ($scope.selectedEvent.marketId == $item.id) {
                return;
            }

            if (_.findIndex($scope.selectedEvent.subMarkets.subMarketList, function (marketObj) {
                    return marketObj.id == $item.id;
            }) == -1) {
                //Market doesn't exist, add to list and load stations
                $scope.selectedEvent.subMarkets.subMarketList.push($item);
                $scope.updateEventPromotion();
                $scope.loadMarketStations($item.id, false);
                //Save Submarkets to EventExtra

                //TODO save event extras to db
            }
            $scope.subMarketSearch = "";
        }
    }

    $scope.resetSelectedSubMarket = function resetSelectedSubMarket() {
        _.each($scope.selectedEvent.subMarkets.subMarketList, function (marketObj, key) {
            marketObj.selected = false;
        });
    };

    $scope.setSelectedEventActiveStation = function setSelectedEventActiveStation(stationList) {

        if ($scope.selectedEvent) {
            // $scope.removeSelectedStationMaps();
            if ($scope.selectedEvent.activeStationsList) {
                //Remove selected station active station maps
                $scope.selectedEvent.activeStationsList = null;
            }

            // if user is radio manger then filter stations
            if ($rootScope.current_login_user.userType == "radio_manager") {
                // will radio manager  stations and assign them promotions 
                $scope.filterStations = [];
                angular.copy($scope.stations, $scope.filterStations);
                _.each($scope.filterStations, function (item, i) {
                    var result = _.filter(stationList, ['id', item.id]);
                    if (result.length > 0) {
                        $scope.filterStations[i] = result[0];
                    }
                });
                $scope.selectedEvent.activeStationsList = $scope.filterStations;
            }
            else {

                $scope.selectedEvent.activeStationsList = stationList;
            }
            _.each($scope.selectedEvent.activeStationsList, function (station, index) {
                if (station.isSelected) {
                    $scope.showCoverageMap(station, index);
                }
            });

            //sort stations as per promotions 
            $scope.sortActiveStationListByPromotions();

            $scope.delayedRefreshiScroll('promotion_stations_wrapper', 200);
        }
    }

    $scope.selectMainMarket = function selectMainMarket() {
        if ($scope.selectedEvent) {
            //Reset currently selected market
            $scope.resetSelectedSubMarket();
            //Select this sub market
            $scope.setSelectedEventActiveStation($scope.selectedEvent.stations[$scope.selectedEvent.marketId].stationsList);
            $scope.setMapToSelectedEvent();
        }
    }
    $scope.selectSubMarket = function selectSubMarket(market) {
        if ($scope.selectedEvent) {
            //Reset currently selected market
            $scope.resetSelectedSubMarket();
            //Select this sub market
            market.selected = true;

            $scope.setSelectedEventActiveStation($scope.selectedEvent.stations[market.id].stationsList);

            //Get first FM Station
            var sFM = _.find($scope.selectedEvent.stations[market.id].stationsList, function (stationObj) {
                return stationObj.sType == 'FM';
            });

            if (sFM && sFM.lngLat) {
                $scope.setMapToLocation(sFM.lngLat);
            }
        }
    }

    $scope.removeSubMarket = function removeSubMarket(market, index) {
        if ($scope.selectedEvent) {
            if (market.selected) {
                $scope.selectMainMarket();
            }
            $scope.selectedEvent.subMarkets.subMarketList.splice(index, 1);
            $scope.selectedEvent.stations[market.id] = null;
            delete $scope.selectedEvent.stations[market.id];
            $scope.updateEventPromotion();
        }
    }

    $scope.updateEventPromotion = function updateEventPromotion() {
        if ($scope.selectedEvent) {
            $scope.newEventExtras();
            //Make copy of currentEventExtra
            //Save each metro Area promotion information
            var updatedPromotions = [];
            updatedPromotions.push($scope.getStationPromotionByMarketId($scope.selectedEvent.marketId));

            //Loop through each promo stations and copy currently assigned promotions
            _.each($scope.selectedEvent.subMarkets.subMarketList, function (subMarketObj) {
                updatedPromotions.push($scope.getStationPromotionByMarketId(subMarketObj.id));
            });

            //Update promotion information
            $scope.selectedEvent.eventExtras.marketPromotions = updatedPromotions;

            //Save Event Extras in the database
            $scope.saveEventExtrasInDb();

            $scope.updateSelectedEventHasPromotionFlag();
        }
    };

    $scope.getStationPromotionByMarketId = function getStationPromotionByMarketId(marketId) {
        var marketPromotion = {
            "metroAreaId": marketId,
            "promoStations": []
        };


        if ($scope.selectedEvent.stations[marketId] && $scope.selectedEvent.stations[marketId].loaded) {
            //Loop through each promo stations and copy currently assigned promotions
            _.each($scope.selectedEvent.stations[marketId].stationsList, function (stationObj) {
                if (stationObj.promotions.length > 0 || stationObj.selectedBy.length > 0) {
                    //copy promotions
                    var stationPromoObj = {
                        "stationId": stationObj.id,
                        "selectedBy": [],
                        "promotions": []
                    };

                    if (stationObj.selectedBy.length > 0) {
                        stationPromoObj.selectedBy = _.clone(stationObj.selectedBy);
                    }

                    stationPromoObj.promotions = _.map(stationObj.promotions, function (promotionObj) {
                        return {
                            "type": promotionObj.type,
                            "promoInstances": promotionObj.promoInstances
                        };
                    });
                    marketPromotion.promoStations.push(stationPromoObj);
                }
            });
        }

        return marketPromotion;
    };

    $scope.loadSelectedEventStations = function loadSelectedEventStations() {
        if ($scope.selectedEvent) {

            $scope.selectedEvent.stations = [];
            //First load event metro stations
            $scope.loadMarketStations($scope.selectedEvent.marketId, true);
            var subMarkets = [];
            //Build sub market informaation
            _.each($scope.selectedEvent.eventExtras.marketPromotions, function (marketPromotionObj) {
                if (marketPromotionObj.metroAreaId != $scope.selectedEvent.marketId) {
                    subMarkets.push(marketPromotionObj.metroAreaId);
                }
            });

            if (subMarkets.length > 0) {
                _.each(subMarkets, function (subMarketId, key) {
                    $scope.loadMarketStations(subMarketId, false);
                });
            }
        }
    };

    $scope.checkEventAssociation = function checkEventAssociation(associationList, assignedTo, assignedAs) {
        for (var iCount = 0; iCount < associationList.length; iCount++) {

            if (associationList[iCount].assignedTo == assignedTo && associationList[iCount].assignedAs == assignedAs && associationList[iCount].assignedBy == $rootScope.current_login_user.id) {
                return true;
            }
        }
        return false;
    }

    $scope.resetSelectedEvent = function resetSelectedEvent() {
        if ($scope.selectedEvent) {
            $scope.selectedEvent.isSelected = false;
            $scope.selectedEvent.activePromotion = null;
            $scope.removeSelectedStationMaps();
        }

        $scope.selectedEvent = null;
    }

    $scope.resetSelection = function resetSelection() {
        if ($scope.current_artist != null) {
            $scope.current_artist.selected = false;
        }
        $scope.current_artist = null;


        if ($scope.current_venue != null) {
            $scope.current_venue.selected = false;
        }
        $scope.current_venue = null;


        if ($scope.current_station != null) {
            $scope.current_station.selected = false;
        }
        $scope.current_station = null;

        $scope.resetEventDates();
        $scope.resetSelectedEvent();
        $scope.isEventsPanelMaximized = true;
        $scope.minimizePromotion();

        $scope.showTourDateScroller = false;
        $scope.showSourcePanel = false;
        $scope.showsFilter = "";
        $scope.resetMap();
        $scope.hideAllModulePanel();
        // reset users on messenger panel 
        _.each($scope.connectedUsers, function (user) { user.isShow = true; });
        $scope.isShowAllConnectedUsersOnMessenger = false;
        $scope.delayedRefreshiScroll('events_wrapper', 200);
    };

    $scope.resetEventDates = function resetEventDates() {
        for (i = 0; i < $scope.n; i++) {
            var eventDate = $scope.dates[i];
            eventDate.booked = false;
            eventDate.venue = '';
            eventDate.market = '';
            eventDate.event = null;

        }
    };
    //Add tour dates
    $scope.addEventDates = function addEventDates(artistEvents) {

        // TODO : Raju please check this new logic for add events to date 
        //Reset dates


        var days = $scope.getDays($scope.n);

        for (var i = 0; i < $scope.n; i++) {

            var eventsForDate = _.filter(artistEvents, function (event) {
                return ((event.eventDate.getUTCMonth() == days[i].getMonth()) &&
                                  (event.eventDate.getUTCDate() == days[i].getDate()) &&
                                  (event.eventDate.getUTCFullYear() == days[i].getFullYear()));
            });
            // default more events would be false for all dates 
            $scope.dates[i].moreEventsOnSameDate = false;
            $scope.dates[i].moreEvents = [];
            if (eventsForDate.length > 0) {

                $scope.replaceEventOnDate(i, eventsForDate);

            }
        }

        //_.forEach(artistEvents, function (artistEvent) {
        //    var show_date = new Date(artistEvent.eventDate);
        //    for (var i = 0; i < $scope.n; i++) {

        //  var eventsForDate=      _.filter(artistEvents, function (event) {
        //      return ((event.eventDate.getUTCMonth() == days[i].getMonth()) &&
        //                        (event.eventDate.getUTCDate() == days[i].getDate()) &&
        //                        (event.eventDate.getUTCFullYear() == days[i].getFullYear()));
        //        });

        //  debugger;
        //        if ((show_date.getUTCMonth() == days[i].getMonth()) &&
        //                    (show_date.getUTCDate() == days[i].getDate()) &&
        //                    (show_date.getUTCFullYear() == days[i].getFullYear())) {
        //            $scope.dates[i].booked = true;
        //            $scope.dates[i].city = artistEvent.city;
        //            $scope.dates[i].artistName = artistEvent.artistName;
        //            $scope.dates[i].venue = artistEvent.venue;
        //            $scope.dates[i].eventId = artistEvent.id;
        //            $scope.dates[i].event = artistEvent;
        //        }
        //    }
        //});
    };

    $scope.replaceEventOnDate = function (index, events) {
        var startIndex = 0;
        var selectedEvent = _.find(events, ['isSelected', true]);
        if (!selectedEvent) {
            startIndex = 1;
            selectedEvent = events[0];
        }
        // getting first event to display
        $scope.dates[index].booked = true;
        $scope.dates[index].city = selectedEvent.city;
        $scope.dates[index].artistName = selectedEvent.artistName;
        $scope.dates[index].venue = selectedEvent.venue;
        $scope.dates[index].eventId = selectedEvent.id;
        $scope.dates[index].event = selectedEvent;
        $scope.dates[index].moreEventsOnSameDate = events.length > 1;
        $scope.dates[index].moreEvents = [];

        // add another events to array
        var anotherEvents = _.filter(events, ['isSelected', false]);

        for (var e = startIndex; e < anotherEvents.length; e++) {
            var event = {
                booked: true,
                city: anotherEvents[e].city,
                artistName: anotherEvents[e].artistName,
                venue: anotherEvents[e].venue,
                eventId: anotherEvents[0].id,
                event: anotherEvents[e]
            }

            $scope.dates[index].moreEvents.push(event);
        }
    }

    //Maximize promotion panel
    $scope.maximizePromotion = function ($event) {
        $scope.isPromotionModuleMaximized = true;

        //Minimize events
        $scope.isEventsPanelMaximized = false;
    };

    //Minimize promotion panel
    $scope.minimizePromotion = function ($event) {
        $scope.isPromotionModuleMaximized = false;
        //Prevent event propagation -- Required to prevent click event again
        var promotion__tiles = angular.element('.promotion__tiles');
        promotion__tiles.removeClass('promotion__tiles--expanded');
        if ($event) {
            $event.stopPropagation();
        }
    };


    //Maximize charting panel
    $scope.maximizeCharting = function () {
        $scope.isChartingModuleMaximized = true;
        //Minimize events
        $scope.isEventsPanelMaximized = false;
    };

    //Minimize charting panel
    $scope.minimizeCharting = function ($event) {
        $scope.isChartingModuleMaximized = false;
        //Prevent event propagation -- Required to prevent click event again
        $event.stopPropagation();
    };


    $scope.maximizeMessenger = function maximizeMessenger() {
        $scope.isMessengerModuleMaximized = true;
        //Minimize events
        $scope.isEventsPanelMaximized = false;
    };

    //Minimize Messenger panel
    $scope.minimizeMessenger = function minimizeMessenger($event) {
        $scope.isMessengerModuleMaximized = false;
        //Prevent event propagation -- Required to prevent click event again
        $event.stopPropagation();
    };

    //Maximize events panel
    $scope.maximizeEvents = function ($event) {
        if ($event.currentTarget === $event.target) {
            if ($scope.isEventsPanelMaximized == false) {
                $scope.isEventsPanelMaximized = true;
            }
        }
    };

    //Minimize events panel
    $scope.minimizeEvents = function () {
        $scope.isChartingModuleMaximized = false;
        //Prevent event propagation -- Required to prevent click event again
        //  $event.stopPropagation();
    };

    //Maximize Treemap panel
    $scope.maximizeTreemap = function () {
        $scope.isTreemapModuleMaximized = true;

        //Minimize events
        $scope.isEventsPanelMaximized = false;
    };

    //Minimize Treemap panel
    $scope.minimizeTreemap = function ($event) {
        $scope.isTreemapModuleMaximized = false;
        //Prevent event propagation -- Required to prevent click event again
        $event.stopPropagation();
    };


    // set active panel visible and others

    $scope.activePanel = function (panel) {

        if (!$scope.isPromotionModuleMaximized && !$scope.isTreemapModuleMaximized && !$scope.isChartingModuleMaximized && !$scope.isMessengerModuleMaximized) {
            return true;
        }

        if ($scope.isPromotionModuleMaximized && panel == 'promotion') {
            return true;
        }

        if ($scope.isTreemapModuleMaximized && panel == 'treemap') {
            return true;
        }

        if ($scope.isChartingModuleMaximized && panel == 'charting') {
            return true;
        }
        if ($scope.isMessengerModuleMaximized && panel == 'messenger') {
            return true;
        }
        return false;
    }
    //minimize all the module panels 

    $scope.hideAllModulePanel = function () {
        // Minimize promotion panel 
        $scope.isPromotionModuleMaximized = false;
        //Prevent event propagation -- Required to prevent click event again
        var promotion__tiles = angular.element('.promotion__tiles');
        promotion__tiles.removeClass('promotion__tiles--expanded');

        // Charting Module minimized
        $scope.isChartingModuleMaximized = false;

        //Minimize Messenger panel
        $scope.isMessengerModuleMaximized = false;

        //Minimize Treemap panel
        $scope.isTreemapModuleMaximized = false;

    }


    $scope.updateHeatmap = function (artist) {
        var name = artist.artistName.toLowerCase();
        uri_name = name.replace(/ /g, '_');
        $http.get('data/airplay/' + uri_name + '_global.json')
        .success(function (res) {
            //console.log(res);
            $scope.mediabase_layer.fadeOutData();
            $scope.mediabase_layer.fadeInData(res.data);
        })
        .error(function (res) {
            console.log(res);
        });
    };

    //$scope.preferencesModalOpen = function ()
    //{
    //    var modalInstance = $uibModal.open({
    //        templateUrl: 'preferencesModal.html',
    //        controller: 'preferencesModalArtistCtrl',
    //        windowClass: 'preferences-modal',
    //        scope: $scope,
    //    });
    //};

    $scope.workpageModalOpen = function workpageModalOpen() {
        $scope.refreshDataOnPage = false;

        var modalInstance = $uibModal.open({
            templateUrl: 'partials/workerpage_home.html',
            controller: 'workpageCtrl',
            windowClass: 'preferences-modal crank-animate',
            backdrop: 'static',
            scope: $scope,
            animation: true
        });

        modalInstance.result.then(function (data) {

        }, function () {
            // console.log('Modal dismissed at: ' + new Date());
            if ($scope.refreshDataOnPage == true) {
                //Time to refresh modal data
                $scope.refreshData();
            }

        });
    };

    $scope.openDataPanel = function () {
        $scope.datapanel_open = true;
    };

    $scope.closeDataPanel = function () {
        $scope.datapanel_open = false;
    };



    $scope.delayedRefreshiScroll = function delayedRefreshiScroll(iScrollId, delay) {
        var delay = (typeof delay !== 'undefined') ? delay : 400;
        $timeout(function () {
            $scope.refreshiScroll(iScrollId);
            //Call refersh again after a second, just to make sure the scroll has adjusted its size
            $timeout(function () {
                $scope.refreshiScroll(iScrollId)
            }, 3000);
        }, delay);
    };

    // Refresh events scroller
    $scope.refreshiScroll = function refreshiScroll(iScrollId) {
        if ($scope.myScroll !== undefined && $scope.myScroll[iScrollId] !== undefined) {
            console.log('docus: ');
            console.log(iScrollId);
            $scope.myScroll[iScrollId].refresh();
        }
    };

    //Hide all panels
    $scope.hideAllPanels = function () {
        // $scope.showTourDateScroller = false;
        $scope.isEventsPanelMaximized = false;
    };
    /**
    * Init
    * */


    /**
    * Init Map // TODO detach it from the scope
    * */

    $scope.initMap = function () {
        //console.log($artistScope.map);

        $scope.mediabase_layer = new L.DivHeatmapLayer({
            color: '#C15A26'
        });

        if ($scope.map && !$scope.map.hasLayer($scope.tile_layer))
            $scope.map.addLayer($scope.tile_layer);

        //display
        //setTimeout(function ()
        //{
        if ($scope.map && !$scope.map.hasLayer($scope.mediabase_layer))
            $scope.map.addLayer($scope.mediabase_layer);

        if ($scope.map && !$scope.map.hasLayer($scope.country_layer))
            $scope.map.addLayer($scope.country_layer);

        // If an artist is already selected, update the airplay
        if ($scope.current_artist) {
            //  $scope.updateHeatmap($scope.current_artist);
        }
        //}, 1000);


        // Init the states layer
        $http.get('data/countries_fixed.geo.json')
        .success(function (res) {
            /*
            // Add the country_layer to the map
            setTimeout(function() {
            $scope.map.addLayer($scope.country_layer);
            },500);
            */

            var countryJSON = res;

            var countryStyle = function (feature) {
                return {
                    fillColor: '#FFF',
                    weight: 1,
                    opacity: 1,
                    color: '#000',
                    dashArray: '3',
                    fillOpacity: 0
                };
            };

            var highlightFeature = function (e) {
                var layer = e.target;

                layer.setStyle({
                    weight: 2,
                    color: '#666',
                    dashArray: '',
                    fillColor: '#FFF',
                    fillOpacity: 0.3
                });

                layer.bringToBack();

                if (!L.Browser.ie && !L.Browser.opera) {
                    //layer.bringToFront();
                }
            };

            var resetHighlight = function (e) {
                geojson.resetStyle(e.target);
                e.target.bringToBack();
            };

            var clickToFeature = function (e) {
                geojson.resetStyle(e.target);

                if (e.target.country_id != 'USA') {
                    // if target is not USA
                    $scope.map.fitBounds(e.target.getBounds());
                } else {
                    // If target is USA
                    $scope.map.setView(new L.LatLng(40.7, -86.3), 5);
                }

                $scope.loadMarkers(e.target.country_id);
                $scope.map.on('zoomend', function setupMarkersOnZoomEnd() {
                    $scope.map.addLayer($scope.markers_layer);
                });

                // Turn off countries
                $scope.map.removeLayer($scope.country_layer);
            };

            var onEachFeature = function (feature, layer) {
                // Assign each layer the id of the GEOJSON 3 digit ISO
                layer.country_id = feature.id;

                // Event handlers for country layers
                layer.on({
                    mouseover: highlightFeature,
                    mouseout: resetHighlight,
                    click: clickToFeature
                });

            };

            var geojson = L.geoJson(countryJSON, {
                style: countryStyle,
                onEachFeature: onEachFeature
            });

            $scope.country_layer.addLayer(geojson);

        })
        .error(function (res) {
            console.log(res);
        });

        /*
        * Load markers
        */

    }

    $scope.loadMarkers = function (country_id) {

        /**
        * Build markers from XML
        * */
        var loadMarketsUSA = function (xml_string) {
            var oParser = new DOMParser();
            var xmlDoc = oParser.parseFromString(xml_string, "text/xml");

            var markets_json = [];
            var marketsNodes = xmlDoc.querySelectorAll('entry');

            for (var i = 0; i < marketsNodes.length; i++) {
                var marketNode = marketsNodes[i];
                var city = marketNode.getElementsByTagName('city')[0].textContent;
                var country = marketNode.getElementsByTagName('country')[0].textContent;
                var state = marketNode.getElementsByTagName('state')[0].textContent;
                var point = marketNode.getElementsByTagName('point')[0].textContent;
                var lat = point.split(" ")[0];
                var lng = point.split(" ")[1];

                var stationNodes = marketNode.getElementsByTagName("stations")[0];
                var stations = [];
                for (var j = 0; j < stationNodes.children.length; j++) {
                    var stationNode = stationNodes.children[j];
                    var station = stationNode.textContent;
                    stations.push(station);
                }

                var market = {
                    "country": country,
                    "state": state,
                    "city": city,
                    "point": {
                        "lat": lat,
                        "lng": lng
                    },
                    "stations": stations
                };
                $scope.markets.push(market);
            }
            return $scope.markets;
        };

        /**
        * Build map markers
        * */
        var buildMarkers = function (markets) {
            var markets_marker = [];
            for (var i = 0; i < markets.length; i++) {

                // Return the appropriate class for the size
                var size = function (market) {
                    var token = '';
                    if (market.stations) {
                        if (market.stations.length > 4) token = 'big';
                        if (market.stations.length > 8) token = 'bigger';
                        if (market.stations.length > 10) token = 'biggest';
                        return token;
                    } else {
                        return token;
                    }
                };

                // Create marker 
                markets_marker[i] = new L.Marker(markets[i].point, {
                    icon: L.divIcon({
                        className: 'market-marker',
                        html: '<span class="dot ' + size(markets[i]) + '"></span>'
                    }),
                    iconSize: [15, 15]
                });

                // Extend the object with markets data to make it persistent
                markets_marker[i].market = markets[i];
                markets_marker[i].market.actions = {
                    'tickets': Math.floor(99 * Math.random()),
                    'meetngreet': Math.floor(99 * Math.random()),
                    'interview': Math.floor(99 * Math.random()),
                    'appearance': Math.floor(99 * Math.random())
                };

                // Bind click action on market marker
                markets_marker[i].on('click', function (e) {
                    if (!!document.querySelector('.market-marker-selected')) {
                        document.querySelector('.market-marker-selected').className = document.querySelector('.market-marker-selected').className.replace(' market-marker-selected', '');
                    };
                    this._icon.className += ' market-marker-selected'
                    $scope.map.setView(this.getLatLng(), 8);
                    $scope.current_market = this.market;
                    $scope.openDataPanel();
                    $scope.$digest();
                    //console.log($scope);
                });

                // Attach to the markers layer
                $scope.markers_layer.addLayer(markets_marker[i]);
            }
        };

        var buildGeoPointMarker = function (province) {
            var marker = new L.Marker([province.lat, province.lng], {
                icon: L.divIcon({
                    className: 'market-marker',
                    html: '<span class="dot"></span>'
                }),
                iconSize: [15, 15]
            });

            marker.market_name = province.name;

            if (province.name == "Barcelona") {
                //console.log('Adding barcelona markets');
            }

            marker.on('click', function (e) {
                if (!!document.querySelector('.market-marker-selected')) {
                    document.querySelector('.market-marker-selected').className = document.querySelector('.market-marker-selected').className.replace(' market-marker-selected', '');
                };

                this._icon.className += ' market-marker-selected';
                $scope.map.setView(this.getLatLng(), 8);
                $scope.current_market = {
                    "city": this.market_name,
                    "id": this.market_name
                }
                $scope.openDataPanel();
                $scope.$digest();
            });
            return marker;
        };


        var xhr = new XMLHttpRequest();
        var loaded_markets;

        // if USA
        if (country_id == 'USA') {
            xhr.open("GET", "data/markets_data.xml", false);
            xhr.setRequestHeader('Content-Type', 'text/xml');
            xhr.onload = function () {
                loaded_markets = loadMarketsUSA(this.responseText);
                buildMarkers(loaded_markets);
            };
            xhr.send();
        } else {
            // Load country geonames
            var countryInfo = JSON.parse($.ajax({
                dataType: "json",
                url: 'data/geonames_countries.json',
                async: false
            }).responseText);

            //console.log(countryInfo);
            var geo_markers;
            countryInfo.geonames.forEach(function (country) {
                if (country.isoAlpha3 == country_id) {
                    $.ajax({
                        url: 'http://api.geonames.org/childrenJSON?geonameId=' + country.geonameId + '&username=mildtaste',
                    }).success(function (data) {
                        var regions = data.geonames;
                        regions.forEach(function (region) {
                            //console.log(region);
                            $.ajax({
                                url: 'http://api.geonames.org/childrenJSON?geonameId=' + region.geonameId + '&username=mildtaste',
                            }).success(function (data) {
                                var province = data.geonames;
                                province.forEach(function (province) {
                                    if (province.population > 250000) {
                                        //console.log(province);
                                        $scope.markers_layer.addLayer(buildGeoPointMarker(province));
                                    }
                                });
                            });
                        });
                    });
                }
            });
            //loaded_markets = loadMarkets(this.responseText);
        }
    };

    // set map on Radio user market on login for Radio Manager

    $scope.setDefaultMapForRadioManager = function () {

        if ($rootScope.current_login_user) {

            if ($rootScope.current_login_user.userType == USER_TYPE_RADIO_MANAGER) {

                if ($rootScope.current_login_user.stations && $rootScope.current_login_user.stations.length > 0) {
                    var stationId = $rootScope.current_login_user.stations[0];

                    if (stationId) {
                        crankService.stations.getById(stationId)
                        .then(function (data) {
                            if (data && data.lngLat) {
                                if ($scope.map)
                                    $scope.setMapToLocation(data.lngLat);
                            }

                        }).catch(function (e) { console.log('error occcured while fetching station data') });

                    }

                }
            }

        }
    }


    //Roster - 9/17/2016
    $scope.init = function () {
        $scope.fetchArtistEvents();
        $scope.fetchRosterArtists();
        $scope.fetchVenues();
        $scope.fetchStations();
        $scope.fetchSourcePanelUsers();
        $scope.fetchSourcePanelDigitals();
        $scope.fetchShows();
    }

    $scope.refreshData = function refreshData() {

        $scope.fetchRosterArtists();
        $scope.fetchVenues();
        $scope.fetchStations();
        $scope.fetchArtistEvents();
        $scope.fetchSourcePanelUsers();
        $scope.fetchSourcePanelDigitals();
        $scope.resetSelection();
    }

    // getting events with out promotion history
    $scope.fetchArtistEvents = function fetchArtistEvents() {
        console.log('Getting artists events for the logged in user');
        crankService.users.getMyProfileEvents(false)
            .then(function (data) {
                console.log("Received events for user:" + data.length);
                $scope.artistEvents = _.map(data,
                    function (eventObj) {
                        return $scope.addingEventsToList(eventObj);
                    });

              
                // Getting all the event dates to mark in calendar
                $scope.userShowsDates = _.map(_.filter($scope.artistEvents, function (event) { return event.isDisplay == true; }), function (show) {  return { day: show.eventDate.getDate(), month: show.eventDate.getMonth(), year: show.eventDate.getFullYear() } });

                //Update the event scroller
                $scope.delayedRefreshiScroll('events_wrapper', 500);
            },
            function (error) {
                console.log("Error ocurred during Artist information retrieval:" + error);
            });
    };

    // getting shows for worker page with promotion history 
    $scope.fetchShows = function fetchShows() {
        console.log('Getting shows for the logged in user');
        crankService.users.getMyProfileEvents(true)
            .then(function (data) {
                console.log("Received shows for user:" + data.length);

                $scope.userShows = _.map(data,
                    function (eventObj) {
                        return $scope.addingEventsToList(eventObj);
                    });
              
            },
            function (error) {
                console.log("Error ocurred during shows information retrieval:" + error);
            });
    };

    $scope.addingEventsToList = function (eventObj) {

        var artistName = eventObj.performance[0].artistName;
        var artistId = eventObj.performance[0].artistId;
        var startDate = eventObj.startDate;
        var utcDate = new Date(eventObj.startDate);

      
        return {
            "id": eventObj.id,
            "artistName": artistName,
            "artistImage": crankServiceApi + '/artists/' + artistId + '/images/normal',
            "artistId": artistId,
            "associations": eventObj.associations != null && eventObj.associations != undefined ? (parseInt(eventObj.associations) + parseInt($rootScope.current_login_user ? $rootScope.current_login_user.team.length : 0)) : $rootScope.current_login_user ? $rootScope.current_login_user.team.length : 0,
            "date": startDate,
            "venue": eventObj.eventVenue.name,
            "venueId": eventObj.eventVenue.id,
            "city": eventObj.city,
            "market": eventObj.eventVenue.metroArea.name,
            "marketId": eventObj.eventVenue.metroArea.id,
            "lngLat": eventObj.lngLat,
            "hasTicket": eventObj.hasTicket,
            "hasMeetNGreet": eventObj.hasMeetNGreet,
            "hasInterview": eventObj.hasInterview,
            "hasAppearnce": eventObj.hasAppearnce,
            "eventVenueLngLat": eventObj.eventVenue.lngLat,
            "isDisplay": eventObj.isDisplay,
            "eventDate": new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate(),
                 utcDate.getUTCHours(), utcDate.getUTCMinutes(), utcDate.getUTCSeconds(), utcDate.getUTCMilliseconds()),
            "subMarkets": {
                loaded: false,
                subMarketList: []
            },
            "stations": [],
            "weeklyPromotionHistory": eventObj.weeklyPromoHistory,
            "isSelected": false
        }

    }

    $scope.fetchRosterArtists = function fetchRosterArtists() {
        if ($rootScope.current_login_user) {
            if ($rootScope.current_login_user.artists.length > 0) {
                crankService.artists.getByIds($rootScope.current_login_user.artists)
                .then(function (data) {
                    console.log("Received Artist information:" + data.length);

                    $scope.artists = _.map(data,
                        function (artistObj) {
                            return {
                                "id": artistObj.id,
                                "title": artistObj.title,
                                "artistName": artistObj.title,
                                "artistImg": crankServiceApi + '/artists/' + artistObj.id + '/images/large',
                                "artistImgHuge": crankServiceApi + '/artists/' + artistObj.id + '/images/huge',
                                "isDummy": false
                            }
                        });
                    // adding Dummy artist as place holder
                    if ($scope.artists.length < 4) {
                        $scope.addDummyArtist($scope.artists);

                    }

                    //Make call to Roster scroller notify the wrapper size change
                    $scope.delayedRefreshiScroll('roster_artist_scroller', 200);

                    //$scope.delayedRefreshiScroll('charts_scroller_wrapper', 500);
                },
                    function (error) {
                        console.log("Error ocurred during Artist information retrieval:" + error);
                    });
            }
        }
    }

    // Dummy artists for placeholder
    $scope.addDummyArtist = function (artists) {
        var startIndex = artists.length;

        for (var i = startIndex; i < 4; i++) {
            artists.push({
                "id": i,
                "title": '',
                "artistName": '',
                "artistImg": '',
                "artistImgHuge": '',
                "isDummy": true
            });

        }

    }

    $scope.fetchVenues = function fetchVenues() {
        if ($rootScope.current_login_user) {
            if ($rootScope.current_login_user.venues.length > 0) {
                crankService.venues.getByIds($rootScope.current_login_user.venues)
                .then(function (data) {
                    console.log("Received venue information:" + data.length);

                    $scope.venues = _.map(data,
                        function (venueObj) {
                            return {
                                "id": venueObj.id,
                                "name": venueObj.name,
                                "info": '<div>' + venueObj.name + '<br/>' + venueObj.metroArea.name + "<br/>" + venueObj.metroArea.state + '</div>',
                                "imageUrl": crankServiceApi + '/venues/' + venueObj.id + '/images/normal',
                                "selected": false,
                                "isDefaultImage": true,
                                "isOccupied": false,
                                "isDummy": false

                            }
                        });

                    if ($scope.venues.length < 4) {
                        $scope.addDummyVenues($scope.venues);
                    }
                },
                function (error) {
                    console.log("Error ocurred during Artist information retrieval:" + error);
                });
            }
        }
    }

    // creating dummy venues 
    $scope.addDummyVenues = function (venues) {
        var startIndex = venues.length;

        for (var i = startIndex; i < 4; i++) {

            venues.push({
                "id": i,
                "name": '',
                "info": '',
                "imageUrl": '',
                "selected": false,
                "isDefaultImage": false,
                "isOccupied": false,
                "isDummy": true

            });

        }

    }

    $scope.fetchStations = function fetchStations() {
        if ($rootScope.current_login_user) {
            if ($rootScope.current_login_user.stations.length > 0) {
                crankService.stations.getByIds($rootScope.current_login_user.stations)
                .then(function (data) {
                    console.log("Received stations information:" + data.length);

                    $scope.stations = _.map(data, function (stationObj) {
                        return {
                            "id": stationObj.id,
                            "name": stationObj.name,
                            "callcode": stationObj.name,
                            "sType": stationObj.sType,
                            "format": stationObj.format,
                            "market": stationObj.market,
                            "metroAreaId": stationObj.metroAreaId,
                            "city": stationObj.city,
                            "state": stationObj.state,
                            "country": stationObj.country,
                            "owner": stationObj.owner,
                            "imageUrl": crankServiceApi + '/stations/' + stationObj.id + '/images/normal',
                            'isDigital': false,
                            "isSelected": false,
                            "hasImage": true,
                            "isDummy": false
                        }
                    });

                    if ($scope.stations.length < 4) {
                        // adding Dummy stations
                        $scope.addDummyStations($scope.stations);
                    }

                },
                function (error) {
                    console.log("Error ocurred during station information retrieval:" + error);
                });
            }
        }
    }
    // Dummy stations for placeholder
    $scope.addDummyStations = function (stations) {
        var startingIndex = stations.length;

        for (var i = startingIndex; i < 4; i++) {

            stations.push({
                "id": i,
                "name": '',
                "callcode": '',
                "sType": '',
                "format": '',
                "market": '',
                "metroAreaId": '',
                "city": '',
                "state": '',
                "country": '',
                "owner": '',
                "imageUrl": '',
                'isDigital': false,
                "isSelected": false,
                "hasImage": false,
                "isDummy": true
            });
        }

    }


    $scope.fetchSourcePanelDigitals = function fetchSourcePanelDigitals() {
        $scope.sourcePanelDigitals = [];
        if ($rootScope.current_login_user) {
            if ($rootScope.current_login_user.digitals.length > 0) {
                crankService.stations.getByIds($rootScope.current_login_user.digitals)
                 .then(function (data) {
                     console.log("Received digital stations information:" + data.length);
                     $scope.sourcePanelDigitals = _.map(data,
                       function (stationObj) {
                           return {
                               "id": stationObj.id,
                               "name": stationObj.name,
                               "callcode": stationObj.name,
                               "sType": stationObj.sType,
                               "format": stationObj.format,
                               "owner": stationObj.owner,
                               "countries": stationObj.countries,
                               "imageUrl": crankServiceApi + '/stations/' + stationObj.id + '/images/normal/' + stationObj.owner,
                               'isDigital': true,
                               "isSelected": false,
                               'hasImage': true,
                               'isAvailableForEvent': true
                           }
                       });


                     $scope.fillInDummyDigitalPanelTiles($scope.sourcePanelDigitals);
                 },
                 function (error) {
                     console.log("Error ocurred during digital stations information retrieval:" + error);
                 });
            }
            else {
                $scope.fillInDummyDigitalPanelTiles($scope.sourcePanelDigitals);
            }
        }
    };

    $scope.addUserToMessengerPanelBucket = function addUserToMessengerPanelBucket(userObj, isInTeam) {

        var userInfoObj =
                          {
                              "id": userObj.id,
                              "firstName": userObj.firstName,
                              "lastName": userObj.lastName,
                              "company": userObj.company,
                              "isActive": userObj.isActive,
                              "email": userObj.email,
                              "imageUrl": crankServiceApi + '/users/' + userObj.id + '/getImage',
                              "isConnected": true,
                              'userType': userObj.userType,
                              'isShow': true,
                              'hasImage': true,
                              'isTeamMember': isInTeam

                          };

        $scope.connectedUsers.push(userInfoObj);

    };

    $scope.removeUserFromMessengerPanelBucket = function removeUserFromMessengerPanelBucket(id) {

        _.remove($scope.connectedUsers, function (user) { return user.id == id; })


    };

    $scope.addUserToSourcePanelBucket = function addUserToSourcePanelBucket(userObj, teamMember, connectedMember) {

        var userInfoObj =
                          {
                              "id": userObj.id,
                              "firstName": userObj.firstName,
                              "lastName": userObj.lastName,
                              "company": userObj.company,
                              "isActive": userObj.isActive,
                              "email": userObj.email,
                              "imageUrl": crankServiceApi + '/users/' + userObj.id + '/getImage',
                              "isConnected": connectedMember,
                              "isTeam": teamMember,
                              'userType': userObj.userType,
                              'isSelected': teamMember,
                              'isDummy': false,
                              'hasImage': true
                          };
        var indexOfDummyTile = -1;

        var userIfexistedIndex = -1;
        switch (userObj.userType) {
            case USER_TYPE_AGENT_MANAGER:
                userIfexistedIndex = _.findIndex($scope.sourcePanelAgents, ['id', userInfoObj.id]);
                if (userIfexistedIndex == -1) {
                    indexOfDummyTile = _.findIndex($scope.sourcePanelAgents, ['firstName', '']);
                    if (indexOfDummyTile > -1) {
                        $scope.sourcePanelAgents[indexOfDummyTile] = userInfoObj;
                    }
                    else {
                        $scope.sourcePanelAgents.push(userInfoObj);
                    }
                }
                break;

            case USER_TYPE_PROMOTER_MANAGER:
                userIfexistedIndex = _.findIndex($scope.sourcePanelPromoters, ['id', userInfoObj.id]);
                if (userIfexistedIndex == -1) {
                    indexOfDummyTile = _.findIndex($scope.sourcePanelPromoters, ['firstName', '']);
                    if (indexOfDummyTile > -1) {
                        $scope.sourcePanelPromoters[indexOfDummyTile] = userInfoObj;
                    }
                    else {
                        $scope.sourcePanelPromoters.push(userInfoObj);
                    }
                }
                break;

            case USER_TYPE_RECORDLABEL_MANAGER:
                userIfexistedIndex = _.findIndex($scope.sourcePanelLabels, ['id', userInfoObj.id]);
                if (userIfexistedIndex == -1) {
                    indexOfDummyTile = _.findIndex($scope.sourcePanelLabels, ['firstName', '']);
                    if (indexOfDummyTile > -1) {
                        $scope.sourcePanelLabels[indexOfDummyTile] = userInfoObj;
                    }
                    else {
                        $scope.sourcePanelLabels.push(userInfoObj);
                    }
                }
                break;

            case USER_TYPE_ARTIST_MANAGER:
                userIfexistedIndex = _.findIndex($scope.sourcePanelArtistManagers, ['id', userInfoObj.id]);
                if (userIfexistedIndex == -1) {
                    indexOfDummyTile = _.findIndex($scope.sourcePanelArtistManagers, ['firstName', '']);
                    if (indexOfDummyTile > -1) {
                        $scope.sourcePanelArtistManagers[indexOfDummyTile] = userInfoObj;
                    }
                    else {
                        $scope.sourcePanelArtistManagers.push(userInfoObj);
                    }
                }

                break;

            case USER_TYPE_SPONSOR_MANAGER:
                userIfexistedIndex = _.findIndex($scope.sourcePanelSponsors, ['id', userInfoObj.id]);
                if (userIfexistedIndex == -1) {
                    indexOfDummyTile = _.findIndex($scope.sourcePanelSponsors, ['firstName', '']);
                    if (indexOfDummyTile > -1) {
                        $scope.sourcePanelSponsors[indexOfDummyTile] = userInfoObj;
                    }
                    else {
                        $scope.sourcePanelSponsors.push(userInfoObj);
                    }
                }
                break;
        }
    };


    $scope.removeUserformSourcePanelBucket = function removeUserformSourcePanelBucket(userObj) {

        var itemIndex = -1;
        switch (userObj.userType) {
            case USER_TYPE_AGENT_MANAGER:

                itemIndex = _.findIndex($scope.sourcePanelAgents, ['id', userObj.id]);
                if (itemIndex > -1) {
                    //  if user's status updated
                    if ((userObj.isTeamMember || userObj.isConnected) && $rootScope.current_login_user.userType != USER_TYPE_RADIO_MANAGER) {
                        $scope.sourcePanelAgents[itemIndex].isSelected = userObj.isTeamMember ? true : false;

                    }
                        // else user removed
                    else {
                        $scope.sourcePanelAgents.splice(itemIndex, 1);
                    }

                    if ($scope.sourcePanelAgents.length < 10) {
                        $scope.fillInDummyPanelTiles($scope.sourcePanelAgents);
                    }
                }
                break;

            case USER_TYPE_PROMOTER_MANAGER:

                itemIndex = _.findIndex($scope.sourcePanelPromoters, ['id', userObj.id]);
                if (itemIndex > -1) {
                    //  if user's status updated
                    if ((userObj.isTeamMember || userObj.isConnected) && $rootScope.current_login_user.userType != USER_TYPE_RADIO_MANAGER) {
                        $scope.sourcePanelPromoters[itemIndex].isSelected = userObj.isTeamMember ? true : false;

                    }
                        // else user removed
                    else {
                        $scope.sourcePanelPromoters.splice(itemIndex, 1);
                    }

                    if ($scope.sourcePanelPromoters.length < 10) {
                        $scope.fillInDummyPanelTiles($scope.sourcePanelPromoters);
                    }
                }
                break;

            case USER_TYPE_RECORDLABEL_MANAGER:

                itemIndex = _.findIndex($scope.sourcePanelLabels, ['id', userObj.id]);
                if (itemIndex > -1) {
                    //  if user's status updated
                    if ((userObj.isTeamMember || userObj.isConnected) && $rootScope.current_login_user.userType != USER_TYPE_RADIO_MANAGER) {
                        $scope.sourcePanelLabels[itemIndex].isSelected = userObj.isTeamMember ? true : false;

                    }
                        // else user removed
                    else {
                        $scope.sourcePanelLabels.splice(itemIndex, 1);
                    }
                    if ($scope.sourcePanelLabels.length < 10) {
                        $scope.fillInDummyPanelTiles($scope.sourcePanelLabels);
                    }

                }

                break;

            case USER_TYPE_ARTIST_MANAGER:


                itemIndex = _.findIndex($scope.sourcePanelArtistManagers, ['id', userObj.id]);
                if (itemIndex > -1) {
                    //  if user's status updated
                    if ((userObj.isTeamMember || userObj.isConnected) && $rootScope.current_login_user.userType != USER_TYPE_RADIO_MANAGER) {
                        $scope.sourcePanelArtistManagers[itemIndex].isSelected = userObj.isTeamMember ? true : false;

                    }
                        // else user removed
                    else {
                        $scope.sourcePanelArtistManagers.splice(itemIndex, 1);
                    }

                    if ($scope.sourcePanelArtistManagers.length < 10) {
                        $scope.fillInDummyPanelTiles($scope.sourcePanelArtistManagers);
                    }
                }

                break;

            case USER_TYPE_SPONSOR_MANAGER:
                itemIndex = _.findIndex($scope.sourcePanelSponsors, ['id', userObj.id]);
                if (itemIndex > -1) {
                    //  if user's status updated
                    if ((userObj.isTeamMember || userObj.isConnected) && $rootScope.current_login_user.userType != USER_TYPE_RADIO_MANAGER) {
                        $scope.sourcePanelSponsors[itemIndex].isSelected = userObj.isTeamMember ? true : false;
                    }
                        // else user removed
                    else {
                        $scope.sourcePanelSponsors.splice(itemIndex, 1);
                    }
                    if ($scope.sourcePanelSponsors.length < 10) {
                        $scope.fillInDummyPanelTiles($scope.sourcePanelSponsors);
                    }
                }
                break;
        }
    };


    $scope.addDigitalToSourcePanelBucket = function addDigitalToSourcePanelBucket(stationObj) {

        var newStattion = {
            "id": stationObj.id,
            "name": stationObj.name,
            "callcode": stationObj.name,
            "sType": stationObj.sType,
            "format": stationObj.format,
            "owner": stationObj.owner,
            "imageUrl": crankServiceApi + '/stations/' + stationObj.id + '/images/normal/' + stationObj.owner,
            'isDigital': true,
            "isSelected": false
        }
        var indexOfEmptyObj = _.findIndex($scope.sourcePanelDigitals, ['name', '']);
        if (indexOfEmptyObj > -1) {
            $scope.sourcePanelDigitals[indexOfEmptyObj] = newStattion;
        }
        else { $scope.sourcePanelDigitals.push(newStattion); }

    };


    $scope.removeDigitalformSourcePanelBucket = function removeDigitalformSourcePanelBucket(id) {

        var stationIndex = _.findIndex($scope.sourcePanelDigitals, ['id', id]);

        if (stationIndex > -1) {
            $scope.sourcePanelDigitals.splice(stationIndex, 1);
        }

        if ($scope.sourcePanelDigitals.length < 10) {
            $scope.fillInDummyDigitalPanelTiles($scope.sourcePanelDigitals);

        }


    };

    $scope.fetchSourcePanelUsers = function fetchSourcePanelUsers() {
        $scope.sourcePanelAgents = [];
        $scope.sourcePanelPromoters = [];
        $scope.sourcePanelLabels = [];
        $scope.sourcePanelArtistManagers = [];
        $scope.sourcePanelSponsors = [];
        $scope.connectedUsers = [];
        if ($rootScope.current_login_user) {
            //Fetch team members first
            crankService.users.getUserByIds($rootScope.current_login_user.team)
               .then(function (data) {
                   console.log("Received team members user information:" + data.length);

                   _.each(data,
                        function (userObj, key) {
                            $scope.addUserToSourcePanelBucket(userObj, true, false);
                            $scope.addUserToMessengerPanelBucket(userObj, true);
                            if (!$scope.userList[userObj.id]) {
                                $scope.userList[userObj.id] = userObj;
                            }
                        });
                   //Get connected users
                   if ($rootScope.current_login_user.connectedUsers.length > 0) {
                       crankService.users.getUserByIds($rootScope.current_login_user.connectedUsers)
                      .then(function (data) {
                          console.log("Received team members user information:" + data.length);
                          _.each(data,
                               function (userObj, key) {

                                   if ($rootScope.current_login_user.userType != USER_TYPE_RADIO_MANAGER) {
                                       $scope.addUserToSourcePanelBucket(userObj, false, true);
                                   }
                                   $scope.addUserToMessengerPanelBucket(userObj, false);
                                   if (!$scope.userList[userObj.id]) {
                                       $scope.userList[userObj.id] = userObj;
                                   }
                               });

                          //Fill in source panel dummy users
                          $scope.fillInSourcePanelTiles();
                      },
                          function (error) {
                              console.log("Error ocurred during InNetwork user information retrieval:" + error);
                          });
                   }
                   else {
                       //Fill in source panel dummy users
                       $scope.fillInSourcePanelTiles();
                   }
               },
               function (error) {
                   console.log("Error ocurred during InNetwork user information retrieval:" + error);
               });
        }
    };

    $scope.fillInSourcePanelTiles = function fillInSourcePanelTiles() {
        $scope.fillInDummyPanelTiles($scope.sourcePanelAgents);
        $scope.fillInDummyPanelTiles($scope.sourcePanelPromoters);
        $scope.fillInDummyPanelTiles($scope.sourcePanelLabels);
        $scope.fillInDummyPanelTiles($scope.sourcePanelArtistManagers);
        $scope.fillInDummyPanelTiles($scope.sourcePanelSponsors);
    };

    $scope.fillInDummyPanelTiles = function fillInDummyPanelTiles(panelArrayObj) {

        var dummyUserTemplate = {
            "id": 0,
            "firstName": '',
            "lastName": '',
            "company": '',
            "isActive": false,
            "email": '',
            "imageUrl": '',
            "isConnected": false,
            "isTeam": false,
            'userType': 'dummy',
            'isSelected': false,
            'isDummy': true
        };
        var arrayLength = panelArrayObj.length;
        if (arrayLength < 10) {
            //Fill upto to 10 dummy objects
            for (var i = arrayLength; i < 10; i++) {
                var dummyUser = _.clone(dummyUserTemplate);
                dummyUser.id = i;
                panelArrayObj.push(dummyUser);
            }
        }
    };

    $scope.fillInDummyDigitalPanelTiles = function fillInDummyDigitalPanelTiles(panelArrayObj) {
        var dummyStationTemplate = {
            "id": 0,
            "name": '',
            "owner": '',
            "isDigital": false,
            "imageUrl": '',
            'isSelected': false,
            'isDummy': true,
            'hasImage': true,
            'isAvailableForEvent': true
        };

        var arrayLength = panelArrayObj.length;
        if (arrayLength < 10) {
            //Fill upto to 10 dummy objects
            for (var i = arrayLength; i < 10; i++) {
                var dummyStation = _.clone(dummyStationTemplate);
                dummyStation.id = i;
                panelArrayObj.push(dummyStation);
            }
        }
    };

    $scope.toggleSourcePanelItem = function (input, assignAs) {
        // if current user is radio user
        if ($rootScope.current_login_user.userType == USER_TYPE_RADIO_MANAGER || !$scope.isEventForUser) {
            return;
        }

        //Don't select if the input is dummy filler object
        if (input.isTeam || input.isDummy) {
            return;
        }
        //find out the selected item
        input.isSelected = !input.isSelected;
        //Something has changed, save the connections in database
        $scope.saveConnectionChanges = true;
        // Add to database

        if (assignAs) {
            $scope.saveEventExtras(assignAs, input);
        }

    }
    $scope.updatePromotionCount = function updatePromotionCount(value) {

        //if event is not for user then user can't update its promotions
        if (!$scope.isEventForUser) {
            return;
        }

        if ($scope.selectedEvent && $scope.selectedEvent.activePromotion && $scope.selectedEvent.activePromotion.selectedInstance) {
            switch (value) {
                case 0:
                    $scope.selectedEvent.activePromotion.selectedInstance.typeCount = 0;
                    //clear
                    break;
                case 1:
                    $scope.selectedEvent.activePromotion.selectedInstance.typeCount++;
                    if ($scope.selectedEvent.activePromotion.selectedInstance.typeCount > 99) {
                        $scope.selectedEvent.activePromotion.selectedInstance.typeCount = 99;
                    }
                    //increment by 1
                    break;
                case -1:
                    //decrement by 1
                    $scope.selectedEvent.activePromotion.selectedInstance.typeCount--;
                    if ($scope.selectedEvent.activePromotion.selectedInstance.typeCount < 0) {
                        $scope.selectedEvent.activePromotion.selectedInstance.typeCount = 0;
                    }
                    break;
                default:
                    //set value to given value
                    $scope.selectedEvent.activePromotion.selectedInstance.typeCount = value;
                    break;
            }
            $scope.updateEventPromotion();
        }
    };


    $scope.selectPromoStation = function selectPromoStation(station, $index) {
        var selectedByIndex = _.findIndex(station.selectedBy, function (selectedByUser) {
            return selectedByUser == $rootScope.current_login_user.id;
        });

        if (station.isSelected) {
            station.isSelected = false;
            //Remove selected user 
            if (selectedByIndex >= 0) {
                station.selectedBy.splice(selectedByIndex, 1);
            }
            $scope.hideCoverageMap(station);
        }
        else {
            station.isSelected = true;
            if (selectedByIndex == -1) {
                station.selectedBy.push($rootScope.current_login_user.id);
            }
            $scope.showCoverageMap(station, $index);
        }

        $scope.updateEventPromotion();
    };

    //Set ActivePromotion for user to work

    $scope.setActivePromotion = function setActivePromotion(selectPromotion) {

        if ($scope.selectedEvent) {
            if ($scope.selectedEvent.activePromotion) {
                $scope.selectedEvent.activePromotion.selected = false;
                $scope.selectedEvent.activePromotion.selectedInstance = null;
            }
            //Set action promotion


            var currUserPromo = _.find(selectPromotion.promoInstances, function (promo) {
                return promo.assignedBy == $rootScope.current_login_user.id;
            });

            if (currUserPromo) {
                selectPromotion.selectedInstance = currUserPromo;
            }
            else {
                selectPromotion.selectedInstance = selectPromotion.promoInstances[0];
                //TODO: Need to discuss with raju . how many promotion instances will be for selected promotion 
                //  selectPromotion.selectedInstance =null;

            }

            selectPromotion.selected = true;
            $scope.selectedEvent.activePromotion = selectPromotion;
        }
    }

    // sort  station list by promotions on promotion panel
    $scope.sortActiveStationListByPromotions = function () {
        $scope.selectedEvent.activeStationsList = _.reverse(_.sortBy($scope.selectedEvent.activeStationsList, [function (stations) { if (stations.promotions) { return stations.promotions.length; } else return; }]));
    }

    $scope.onPromotionDrop = function onPromotionDrop(event, ui, station, $index) {

        //if event is not for user then user can't update its promotions
        if (!$scope.isEventForUser) {
            return;
        }

        //Add promotion to the station
        var promotionType = ui.draggable.data('promotion');
        if (promotionType) {
            if (!station.promotions) {
                //No stations promotion, initalize the array
                station.promotions = [];
            }

            //Check whether station has promotion
            var promotion = _.find(station.promotions, function (promoObj) {
                return promoObj.type == promotionType;
            });

            //Promotion object don't exist
            if (!promotion) {
                //Create promotion object array

                promotion = {
                    type: promotionType,
                    promoInstances: [],

                };

                switch (promotionType) {
                    case 'ticket':
                        promotion.name = 'Tickets';
                        promotion.promoClass = 'fa-ticket';
                        station.promotions.splice(0, 0, promotion);
                        $scope.selectedEvent.hasTicket = true;
                        break;
                    case 'meetngreet':
                        promotion.name = 'Meet-n-Greet';
                        promotion.promoClass = 'fa-camera';
                        if (station.promotions.length > 0 &&
                            station.promotions[0].type == 'ticket') {
                            station.promotions.splice(1, 0, promotion);
                        }
                        else {
                            station.promotions.splice(0, 0, promotion);
                        }
                        $scope.selectedEvent.hasMeetNGreet = true;
                        break;
                    case 'interview':
                        promotion.name = 'Interview(s)';
                        promotion.promoClass = 'fa-microphone';
                        if (station.promotions.length > 0 &&
                            station.promotions[station.promotions.length - 1].type == 'appearance') {
                            station.promotions.splice(station.promotions.length - 1, 0, promotion);
                        }
                        else {
                            station.promotions.push(promotion);
                        }
                        $scope.selectedEvent.hasInterview = true;
                        break;
                    case 'appearance':
                        promotion.name = 'Appearance(s)';
                        promotion.promoClass = 'fa-eye';
                        station.promotions.push(promotion);
                        $scope.selectedEvent.hasAppearnce = true;
                        break;
                }
            }


            // check whether current user promotion exist
            var currUserPromo = _.find(promotion.promoInstances, function (promo) {
                return promo.assignedBy == $rootScope.current_login_user.id;
            });

            if (currUserPromo) {
                $scope.setActivePromotion(promotion);
                return;
            }

            //promotion doesn't exist for user
            //Add promotion
            var promotionInstance = {
                typeCount: 0,
                assignedBy: $rootScope.current_login_user.id,
                companyName: $rootScope.current_user.companyName,
                userFullName: $rootScope.current_user.firstName + ' ' + $rootScope.current_user.lastName,
                createdDate: new Date(),
                lastUpdatedDate: new Date()
            };
            promotion.promoInstances.push(promotionInstance);
            $scope.setActivePromotion(promotion);
            $scope.updateEventPromotion();
        }
    };

    $scope.showStationInfoPanel = function showStationInfoPanel(station, $index) {
        if ($scope.hidePanelTimer) {
            $timeout.cancel($scope.hidePanelTimer);
            if ($scope.hoveredStation && !$scope.hoveredStation.isSelected) {
                $scope.hideCoverageMap($scope.hoveredStation);
            }
            $scope.hidePanelTimer = null

        }
        $scope.hoveredStation = station;
        $scope.stationPanelInfoVisible = true;
        if (!station.isSelected) {
            $scope.showCoverageMap(station, $index);
        }
        //Apply class
    };

    $scope.hideStationInfoPanel = function hideStationInfoPanel(station, $index) {
        $scope.hidePanelTimer = $timeout(function () {
            $scope.stationPanelInfoVisible = false;
            if (!station.isSelected) {
                $scope.hideCoverageMap(station);
            }

        }, 800);
        //remove class
    };


    //TODO: Raju please confirm this code can we remove this i have added   mwl-confirm directive for the same purpose
    //$scope.confirmRemovePromotion = function confirmRemovePromotion(promotion, station) {
    //    var promoToRemove = promotion;
    //    var promoStation = station;
    //    var modalInstance = $uibModal.open({
    //        templateUrl: 'removePromo.html',
    //        controller: 'removePromoCtrl',
    //        windowClass: 'crank-modal',
    //        backdrop: 'static',
    //        scope: $scope,
    //    });

    //    modalInstance.result.then(function (data) {

    //        if (data == 'remove') {
    //            //Remove the user promotion
    //            if ($scope.selectedEvent) {
    //                var bUpdateEvent = false;
    //                //Remove promotion
    //                promoToRemove.selectedInstance = null;
    //                promoToRemove.selected = false;

    //                //Find the index 

    //                var currUserPromoIndex = _.findIndex(promoToRemove.promoInstances, function (promo) {
    //                    return promo.assignedBy == $rootScope.current_login_user.id;
    //                });

    //                if (currUserPromoIndex >= 0) {
    //                    promoToRemove.promoInstances.splice(currUserPromoIndex, 1);
    //                    bUpdateEvent = true;
    //                }

    //                //If there are no promotions remove the object
    //                if (promoToRemove.promoInstances.length <= 0) {
    //                    //Remove promotion type from the station
    //                    var currPromoIndex = _.findIndex(station.promotions, function (promo) {
    //                        return promo.type == promoToRemove.type;
    //                    });

    //                    if (currPromoIndex >= 0) {
    //                        station.promotions.splice(currPromoIndex, 1);
    //                        bUpdateEvent = true;
    //                    }
    //                }

    //                if ($scope.selectedEvent.activePromotion) {
    //                    $scope.selectedEvent.activePromotion.selected = false;

    //                    if ($scope.selectedEvent.activePromotion.selectedInstance) {
    //                        $scope.selectedEvent.activePromotion.selectedInstance = null;
    //                    }

    //                    $scope.selectedEvent.activePromotion = null;
    //                }

    //                if (bUpdateEvent) {
    //                    $scope.updateEventPromotion();
    //                }
    //            }
    //        }

    //    }, function () {

    //    });
    //};

    // Remove promotions from radio station
    $scope.removePromotionFromStation = function removePromotionFromStation(promotion, station) {

        var promoToRemove = promotion;
        var promoStation = station;

        //Remove the user promotion
        if ($scope.selectedEvent) {
            var bUpdateEvent = false;
            //Remove promotion
            promoToRemove.selectedInstance = null;
            promoToRemove.selected = false;
            //Find the index 
            var currUserPromoIndex = _.findIndex(promoToRemove.promoInstances, function (promo) {
                return promo.assignedBy == $rootScope.current_login_user.id;
            });

            if (currUserPromoIndex >= 0) {
                promoToRemove.promoInstances.splice(currUserPromoIndex, 1);
                bUpdateEvent = true;
            }

            //If there are no promotions remove the object
            if (promoToRemove.promoInstances.length <= 0) {
                //Remove promotion type from the station
                var currPromoIndex = _.findIndex(station.promotions, function (promo) {
                    return promo.type == promoToRemove.type;
                });

                if (currPromoIndex >= 0) {
                    station.promotions.splice(currPromoIndex, 1);
                    bUpdateEvent = true;
                }
            }

            if ($scope.selectedEvent.activePromotion) {
                $scope.selectedEvent.activePromotion.selected = false;

                if ($scope.selectedEvent.activePromotion.selectedInstance) {
                    $scope.selectedEvent.activePromotion.selectedInstance = null;
                }

                $scope.selectedEvent.activePromotion = null;
            }

            if (bUpdateEvent) {
                $scope.updateEventPromotion();
            }
        }
    }


    $scope.scrollToActiveEvent = function scrollToActiveEvent() {
        $timeout(function () {
            //Scroll the tour date scroller to the active event
            if ($scope.dates_scroller) {
                $scope.dates_scroller.scrollElementIntoView('.date.event__active', 2000, 72);
            }

            if ($scope.myScroll !== undefined && $scope.myScroll['events_wrapper'] !== undefined) {
                $scope.myScroll['events_wrapper'].scrollElementIntoView('.event.event__active', 2000);
            }

        }, 600);
    }

    //initialize the controller
    $scope.init();

    //Initialize map layers
    $scope.$watch('map', function () {
        if ($scope.map) {

            $scope.initMap();

            //TODO: Raj please confirm  this can we call this method anywhere else
            // set map to radio user market 
            $scope.setDefaultMapForRadioManager();
        }
    });

    $scope.processTypeCountChange = function processTypeCountChange() {
        console.log($scope.selectedEvent.activePromotion.selectedInstance.typeCount);

        if ($scope.selectedEvent.activePromotion.selectedInstance) {
            if ($scope.selectedEvent.activePromotion.selectedInstance.typeCount < 0) {
                $scope.selectedEvent.activePromotion.selectedInstance.typeCount = 0;
            }
            else if ($scope.selectedEvent.activePromotion.selectedInstance.typeCount > 99) {
                $scope.selectedEvent.activePromotion.selectedInstance.typeCount = 99;
            }
            else if ($scope.selectedEvent.activePromotion.selectedInstance.typeCount == null) {
                $scope.selectedEvent.activePromotion.selectedInstance.typeCount = 0;
            }
            $scope.updateEventPromotion();
        }
    };

    $scope.updateSelectedEventHasPromotionFlag = function updateSelectedEventHasPromotionFlag() {
        var marketPromotion = null;
        if ($scope.selectedEvent.eventExtras && $scope.selectedEvent.eventExtras.marketPromotions) {
            $scope.selectedEvent.hasTicket = false;
            $scope.selectedEvent.hasMeetNGreet = false;
            $scope.selectedEvent.hasInterview = false;
            $scope.selectedEvent.hasAppearnce = false;

            _.forEach($scope.selectedEvent.eventExtras.marketPromotions, function (marketPromotion) {
                _.forEach(marketPromotion.promoStations, function (promoStation) {
                    _.forEach(promoStation.promotions, function (promotion) {
                        switch (promotion.type) {
                            case 'ticket':
                                $scope.selectedEvent.hasTicket = true;
                                break;
                            case 'meetngreet':
                                $scope.selectedEvent.hasMeetNGreet = true;
                                break;
                            case 'interview':
                                $scope.selectedEvent.hasInterview = true;
                                break;
                            case 'appearance':
                                $scope.selectedEvent.hasAppearnce = true;
                                break;
                        }
                    });
                });
            });
        }
    };


    // Messenger Panel functions 

    $scope.showAllConnectedUsersOnMessenger = function () {
        $scope.isShowAllConnectedUsersOnMessenger = true;
    }

    $scope.onUserDropForChat = function (event, ui) {
        var userId = ui.draggable.data('user-id');
        if (_.findIndex($scope.usersInChat, ['id', userId]) > -1)
            return;

        if (userId) {
            var userObj = _.find($scope.connectedUsers, function (user) { return user.id == userId; })
            if (userObj) {
                var userInfoObj =
                              {
                                  "id": userObj.id,
                                  "firstName": userObj.firstName,
                                  "lastName": userObj.lastName,
                                  "company": userObj.company,
                                  "isActive": userObj.isActive,
                                  "email": userObj.email,
                                  "imageUrl": crankServiceApi + '/users/' + userObj.id + '/getImage',
                                  'userType': userObj.userType,
                                  'message': { text: userObj.firstName + ' ' + userObj.lastName + ' has joined chat', time: new Date().toLocaleTimeString() },
                                  'joinedTime': new Date(),
                                  'hasImage': true
                              };
                $scope.usersInChat.push(userInfoObj);
            }
        }

    }

    $scope.removeUserFromChat = function (userId) {
        _.remove($scope.usersInChat, function (user) { return user.id == userId; })
    }

    //Nav bar search

    $scope.searchInRosterAndSourcePanel = function (val) {
        var result = [];


        // search in roster panel 
        //(($scope.current_artist == undefined || $scope.current_artist == null) && ($scope.current_station == undefined || $scope.current_station == null) && ($scope.current_venue == null || $scope.current_venue == undefined)) &&
        if (($scope.selectedEvent == null || $scope.selectedEvent == undefined)) {
            switch ($rootScope.current_login_user.userType) {

                case USER_TYPE_PROMOTER_MANAGER:
                    {
                        result = _.map(_.take(_.filter($scope.venues, function (venue) { return _.startsWith(venue.name.toLowerCase(), val.toLowerCase()); }), 10),
                            function (data) {
                                return {
                                    "display": data.name,
                                    'entity': data,
                                    'type': 'venue'
                                }
                            });

                        break;
                    }

                case USER_TYPE_RECORDLABEL_MANAGER: case USER_TYPE_ARTIST_MANAGER:
                    {
                        result = _.map(_.take(_.filter($scope.artists, function (artist) { return _.startsWith(artist.artistName.toLowerCase(), val.toLowerCase()); }), 10),
                            function (data) {
                                return {
                                    "display": data.artistName,
                                    'entity': data,
                                    'type': 'artist'
                                }
                            });

                        break;
                    }

                case USER_TYPE_RADIO_MANAGER:
                    {

                        result = _.map(_.take(_.filter($scope.stations, function (station) { return _.startsWith(station.name.toLowerCase(), val.toLowerCase()); }), 10),
                            function (data) {
                                return {
                                    "display": data.name,
                                    'entity': data,
                                    'type': 'station'
                                }
                            });

                        break;
                    }

            }
        }

            // search in source panel
        else {

            // union all the users 

            var allMembers = _.union(_.union(_.union(_.union($scope.sourcePanelAgents, $scope.sourcePanelLabels), $scope.sourcePanelSponsors), $scope.sourcePanelPromoters), $scope.sourcePanelArtistManagers);

            result = _.map(_.take(_.filter(allMembers, function (member) { return _.startsWith(member.firstName.toLowerCase(), val.toLowerCase()); }), 10),
                             function (data) {
                                 return {
                                     "display": data.firstName + ' ' + data.lastName,
                                     'entity': data,
                                     'type': data.userType
                                 }
                             })


            //switch ($scope.sourcePanelVisibleTab) {
            //    case 'agent':
            //        result = _.map(_.take(_.filter($scope.sourcePanelAgents, function (agent) { return _.startsWith(agent.firstName.toLowerCase(), val.toLowerCase()); }), 10),
            //               function (data) {
            //                   return {
            //                       "display": data.firstName + ' ' + data.lastName,
            //                       'entity': data,
            //                       'type': 'agent'
            //                   }
            //               });
            //        break;
            //    case 'label':
            //        result = _.map(_.take(_.filter($scope.sourcePanelLabels, function (label) { return _.startsWith(label.firstName.toLowerCase(), val.toLowerCase()); }), 10),
            //              function (data) {
            //                  return {
            //                      "display": data.firstName + ' ' + data.lastName,
            //                      'entity': data,
            //                      'type': 'label'
            //                  }
            //              });
            //        break;
            //    case 'sponsor':
            //        result = _.map(_.take(_.filter($scope.sourcePanelSponsors, function (sponsor) { return _.startsWith(sponsor.firstName.toLowerCase(), val.toLowerCase()); }), 10),
            //              function (data) {
            //                  return {
            //                      "display": data.firstName + ' ' + data.lastName,
            //                      'entity': data,
            //                      'type': 'sponsor'
            //                  }
            //              });
            //        break;
            //    case 'promoter':

            //        result = _.map(_.take(_.filter($scope.sourcePanelPromoters, function (promoter) { return _.startsWith(promoter.firstName.toLowerCase(), val.toLowerCase()); }), 10),
            //             function (data) {
            //                 return {
            //                     "display": data.firstName + ' ' + data.lastName,
            //                     'entity': data,
            //                     'type': 'promoter'
            //                 }
            //             });

            //        break;

            //    case 'artist_manager':

            //        result = _.map(_.take(_.filter($scope.sourcePanelArtistManagers, function (artistmanager) { return _.startsWith(artistmanager.firstName.toLowerCase(), val.toLowerCase()); }), 10),
            //             function (data) {
            //                 return {
            //                     "display": data.firstName + ' ' + data.lastName,
            //                     'entity': data,
            //                     'type': 'artistmanager'
            //                 }
            //             });
            //        break;

            //    case 'digital':

            //        result = _.map(_.take(_.filter($scope.sourcePanelDigitals, function (digital) { return _.startsWith(digital.name.toLowerCase(), val.toLowerCase()); }), 10),
            //             function (data) {
            //                 return {
            //                     "display": data.name,
            //                     'entity': data,
            //                     'type': 'digital'
            //                 }
            //             });
            //        break;
            //}



        }
        return result;
    }

    //  apply selected item
    $scope.selectSearchedEntity = function ($item, $model, $label) {


        if ($model) {

            switch ($model.type) {

                case 'venue':
                    {
                        $scope.selectVenue($model.entity);
                        $scope.scorllToActiveVenueOnRosterPanel();
                        break;
                    }
                case 'station':
                    {
                        $scope.selectStation($model.entity);
                        $scope.scorllToActiveVenueOnRosterPanel();
                        break;
                    }
                case 'artist':
                    {
                        $scope.selectArtist($model.entity);
                        $scope.scorllToActiveAritist();
                        break;
                    }
                case 'label':
                    {

                        $scope.sourcePanelVisibleTab = 'label'
                        break;
                    }

                case 'promoter':
                    {

                        $scope.sourcePanelVisibleTab = 'promoter'
                        break;
                    }

                case 'sponsor':
                    {

                        $scope.sourcePanelVisibleTab = 'sponsor'
                        break;
                    }

                case 'agent':
                    {

                        $scope.sourcePanelVisibleTab = 'agent'
                        break;
                    }

                case 'artist_manager':
                    {

                        $scope.sourcePanelVisibleTab = 'artist_manager'
                        break;
                    }


            }
            $scope.nav_Bar_Search_Text = '';

        }
    }

    $scope.scorllToActiveAritist = function () {
        $timeout(function () {

            if ($scope.myScroll) {
                $scope.myScroll['roster_artist_scroller'].scrollElementIntoView('.artists__tiles .artists__tile-item--active');
            }
        }, 600);

    }


    $scope.scorllToActiveVenueOnRosterPanel = function () {
        $timeout(function () {

            if ($scope.myScroll) {
                $scope.myScroll['roster_veunes_scroller'].scrollElementIntoView('.artists__tiles .artists__tile-item--active');
            }
        }, 600);

    }

    $scope.scorllToActiveStationOnRosterPanel = function () {
        $timeout(function () {

            if ($scope.myScroll) {
                $scope.myScroll['roster_stations_scroller'].scrollElementIntoView('.artists__tiles .artists__tile-item--active');
            }
        }, 600);
    }

});







/**
* Data Panel Controller
* Extends artistCtrl
* */
app.controller('dataPanelCtrl', function ($scope) {
    $scope.station_carousel;

    $scope.station_carousel_options = {
        items: 4,
        width: '100%',
        height: 64,
        auto: false,
        scroll: {
            duration: 750
        },
        prev: {
            button: '#station-carousel-prev',
            items: 1,
        },
        next: {
            button: '#station-carousel-next',
            items: 1,
        }
    };

    $scope.$on('ajaxStationsLoaded', function () {
        $scope.station_carousel.update();
    });

});

/**
* This controller is controller of the modal set when calling it
* The modal controllers should have this ugly definition
* */
var preferencesModalArtistCtrl = function ($scope, $http, $modalInstance, $animate) {
    $scope.is_loading = false;
    $scope.found_artist = [];

    $scope.ok = function () {
        // TODO password change

        // check two fields if they are not empty

        // if the password is the same change it

        if (!$scope.selected_artist) {
            $modalInstance.close();
            return;
        }
        $modalInstance.close($scope.selected_artist);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    $scope.selectArtist = function (artist) {
        artist.artist_name = artist.title.charAt(0).toUpperCase() + artist.title.slice(1).toLowerCase();
        artist.imgResult = artist.imgResult;
        $scope.selected_artist = artist;
    };



    $scope.fetchArtist = function () {
        $scope.is_loading = true;

        $scope.found_artists = [];
        $http.get(api + '/artist/search?query=' + $scope.artist_name)
        .success(function (data, status) {
            $scope.found_artists = data.results;

            // Foreach artist
            // $scope.found_artists.forEach(function(artist) {
            //     var id = artist.id;
            //     $http.get(api +'/artist/'+id+'/extra').success(function(data) {
            //         console.log(data);
            //         artist.image = data.info.photo_thumbnails[0].url;
            //     });
            // })
        })
    }

};

app.controller('workpageCtrl', function ($scope, $http, $uibModalInstance, $animate) {
    $scope.is_loading = false;

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

});

//app.controller('removePromoCtrl', function ($scope, $uibModalInstance) {
//    $scope.remove = false;
//    $scope.removePromotion = function removePromotion() {
//        $scope.remove = true;
//        $uibModalInstance.close('remove');
//    };
//    $scope.cancel = function cancel() {
//        $uibModalInstance.dismiss('cancel');
//    };

//});