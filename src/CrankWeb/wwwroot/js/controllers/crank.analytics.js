/**
 * Crank analytics
 *
 * @param current_view
 * @param current_artist
 * */

/**
 * Dates controller
 * deals with the dates basket area
 * */
app.controller("datesCtrl", function ($scope, $http) {
    $scope.n = 720;
    $scope.dates = [];
    $scope.dates_scroller_opt = { 
        scrollX: true,
        scrollY: false,
        //mouseWheel: true, 
        click:true,
        disableMouse: false,
        disablePointer: true,
        disableTouch: true,
        eventPassthrough: false,
        bounce:false
    }

    /**
     * From a day generate further n days dates
     * @param n int days
     * @return array(Date)
     * */
    $scope.getDays = function (days) {
        var today = new Date(),
            dates = [],
            day_length = 1000 * 60 * 60 * 24; // day in milliseconds
        
        for (var i = 0; i < days; i++) {
            dates.push(new Date(today.getTime() + day_length * i));
        }
        //console.log(dates);
        return dates;
    }

    /**
     * Generate the data for the calendar area
     * */
    $scope.generateDates = function (n) {
        var days = $scope.getDays(n);
        for (var i = 0; i < n; i++) {
            var date = {};
            date.day = days[i].toDateString().replace(" " + days[i].getFullYear(), "").substring(4);
            date.index = i;
            $scope.dates.push(date);
        }
    }

    /**
     * This toggles the status of the dates open/closed
     * @param Object date
     * */
    $scope.toggleOpen = function (date) {
        date.booked = !date.booked;
        window.dateScroll.initiated = 0;
        //console.log($event);
    }

    /**
     * Fetch the shows from the server for an artist
     * @param artist_id
    * */
    $scope.fetchShows = function(artist_id) {
        var n = $scope.n;

        var fetchVenue = function(venue_id) {
            return $http.get(api + '/venue/'+venue_id);
        };

        if (IS_LIVE) {
            $http.get(api + '/artist/'+artist_id+'/shows').then(function (res) {
                //console.log(res.data.results);

                // clear dates
                for (var i = 0; i < n; i++) {
                    $scope.dates[i].booked = false;
                }

                // add the show to the correct date
                var addShow = function(show) {
                    var show_date = new Date(show.date);
                    var days = $scope.getDays(n);
                    for (var i = 0; i < n; i++) {
                        var date = {};
                        if ( (show_date.getMonth() == days[i].getMonth()) &&
                        (show_date.getDate() == days[i].getDate()) &&
                        (show_date.getYear() == days[i].getYear()) ) {
                            //console.log(days[i]);
                            //console.log(show_date);
                            $scope.dates[i].booked = true;
                        }
                    }
                }
                
                // add the venue to the correct date
                var addVenue = function(show) {
                    var venue_id = show.venue;
                    var show_date = new Date(show.date);
                    var days = $scope.getDays(n);
                    $http.get(api + '/venue/'+venue_id).then(function(res) {
                        //console.log(res);
                        // Start the cycle after the callback 
                        for (var i = 0; i < n; i++) {
                            var date = {};
                            // Find the correct date
                            if ( (show_date.getMonth() == days[i].getMonth()) &&
                            (show_date.getDate() == days[i].getDate()) &&
                            (show_date.getYear() == days[i].getYear()) ) {
                                $scope.dates[i].venue = res.data.name;
                                $scope.dates[i].market = res.data.city;
                                $scope.dates[i].booked = true;
                            }
                        }
                    });

                }

                res.data.results.forEach(function(e,i) {
                    addShow(e);
                    addVenue(e);
                });

            });
        };
    }


    /*
    * Main
    */

    // Generate dates 
    $scope.generateDates($scope.n);

    // Populate the dates 
    $scope.fetchShows($scope.current_artist.id);

    $scope.$watch('current_artist', function() {
        $scope.fetchShows($scope.current_artist.id);
    });

});


app.controller('analyticsCtrl',function($scope, $http, $sce, $animate, $modal) {

    // Fix for ng-repeat and animate issue
    $animate.enabled(false, $('.station-column'));

    /**
    * Init the mock stations
    * */
    $http.get('data/viz_stations.json').then(function (res) {
        $scope.stations = res.data;
        //console.log($rootScope.stations);
    });

    $scope.activated_actions = {
        "tickets": false,
        "meetngreet": true,
        "interview": true,
        "appearance": false
    };

    $scope.watermarks = {
        "tickets": 0,
        "meetngreet": 0,
        "interview": 0,
        "appearance": 0
    };

    $scope.tour_starting_date = 'Thu Feb 13 2014 00:00:00 GMT+0100 (CET)';
    $scope.tour_ending_date = 'Thu Feb 20 2014 00:00:00 GMT+0100 (CET)';
    $scope.tour_venue_date = 'Thu Feb 27 2014 00:00:00 GMT+0100 (CET)';
    $scope.datepicker_date;
    $scope.datepicker_editing = false;
    $scope.datepicker_editing_caption;
    $scope.station_column_size = 48;
    $scope.selected_market_node = null;
    $scope.search_market = null;
    $scope.selected_format_node = null;
    $scope.selected_station = null;
    $scope._stations;



    /**
    * Render the human readable type
    * */
    $scope.sayType = function (type) {
        switch (type) {
            case 'meetngreet':
                return 'Meet n Greets';
            case 'tickets':
                return 'Tickets';
            case 'interview':
                return 'Interviews';
            case 'appearance':
                return 'Appearances';
            default:
                return '';
        }
    };

    /**
    * Show the datepicker and picks a date on click
    * @param arg String - starting or ending
    * */
    $scope.setDate = function (arg) {
        $scope.datepicker_editing = true;
        if (arg == 'starting') $scope.datepicker_editing_caption = 'Starting date';
        if (arg == 'ending') $scope.datepicker_editing_caption = 'Ending date'
        if (arg == 'venue') $scope.datepicker_editing_caption = 'Venue date'
        //console.log($scope.tour_starting_date);
        // Listen to mouseclick and close
        $scope.$watch('selected_market_node', function (a, b) {
            if (a != b) $scope.datepicker_editing = false;
        });
    }

    /**
    * Check if a date is set
    * */
    $scope.isSetDate = function () {
        // pick the value and bind to the actual editing
        //console.log($scope.datepicker_date);
        if ($scope.datepicker_editing_caption == 'Starting date') {
            $scope.tour_starting_date = $scope.datepicker_date;
        }
        if ($scope.datepicker_editing_caption == 'Ending date') {
            $scope.tour_ending_date = $scope.datepicker_date;
        }
        if ($scope.datepicker_editing_caption == 'Venue date') {
            $scope.tour_venue_date = $scope.datepicker_date;
        }

        // close the datepicker
        $scope.datepicker_editing = false;
    }

    /**
    * Renders a date
    * */
    $scope.renderDate = function (date_str) {
        if ( !! date_str) {
            var d = new Date(Date.parse(date_str));
            var html = '';
            var month = function (m) {
                var months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DIC'];
                return months[m];
            }
            html += d.getDate() + '<br/>';
            html += month(d.getMonth()) + '<br/><br/>';
            html += d.getFullYear() + '<br/>';
            return $sce.trustAsHtml(html);
        } else {
            return;
        }
    }

    /**
    * Check if a station has actions
    * */
    $scope.hasAction = function (station, action) {
        //console.log(station,action)
        return !!station[action];
    };

    $scope.editAction = function (station, action) {
        //console.log(station[action]);

        // select station
        $scope.selected_station = station;

        // set the current action
        $scope.selected_action = action;

        // change the value
        // use the panel
    };

    /**
    * Drop handler for actions on station
    * */
    $scope.onDropAction = function (data, ev, station) {
        // Add and empty bucket to the station
        console.log('adding ' + data + ' to station ' + station.call_code);
        if (!station[data]) station[data] = 1;
        else station[data].push(1);
        //$scope._stations = $scope.getStations();

        // Sort Stations
    }

    /**
    * Select an action
    * */
    $scope.selectAction = function (action, event) {
        $(".action-selector .active").removeClass('active');
        $(event.currentTarget).addClass('active');
        $scope.selected_action = action;
        $scope.selected_station = null;
    }

    /**
    * Shows and hide the station hovering tooltip
    * which is a panel overlapping the graph
    * */
    $scope.showStationInfoPanel = function (station) {
        //console.log(station);
        $scope.shown_station_info_panel = true;
        $scope.hovered_station = station;
        $('#station-pie-chart').empty();
        //initPieChart('#station-pie-chart');
        initStationPieChart('#station-pie-chart');

    }

    $scope.hideStationInfoPanel = function (station) {
        $scope.shown_station_info_panel = false;
    }

    /**
    * Get the stations filtering by format
    * */
    $scope.getStations = function (market) {
        // TODO put together this function and the other for the data panel
        if (IS_LIVE) {
            if (market && market.name) {
                $http.get(api + '/market/search?query='+market.name.split(",")[0])
                .success(function(res){
                    //console.log(res);
                    var market_id = res.results[0].id;
                    // Load market data
                    $http.get(api + '/market/' + market_id)
                    .success(function(res){
                        console.log(res.stations);
                        var stations = res.stations;

                        var spotify = {
                            call_code: "SPOTIFY",
                            id: 123456789,
                            logo: "images/mock/spotify.png",
                            market: "Spotify"
                        }

                        stations.unshift(spotify);

                        // add spotify

                        // fake some pcap for sacramento
                        for (i in stations) {
                            switch (stations[i].id) {
                                case(1026):
                                    stations[i].meetngreet = 1;
                                    stations[i].tickets = 1;
                                    stations[i].appearance = 1;
                                    break;
                                case(1128):
                                    stations[i].tickets = 1;
                                    stations[i].interview = 1;
                                    break;
                                default:
                                    break;
                            }
                        };

                        $scope._stations = stations;
                    })
                    .error(function(res){
                        console.log(res);
                    });
                })
                .error(function(res){
                    console.log(res);
                });
            }

        } else {
            var formatFilter = function(station) {
                if ($scope.selected_format_node) {
                    var format = $scope.selected_format_node.name;
                    if (station.station_data.format == format)
                        return true;
                    else
                        return false;
                } else {
                    return true;
                }
            }

            var calcPCAP = function(a) {
                var pcap_a = 0;
                if (a.meetngreet) pcap_a += a.meetngreet.length;
                if (a.tickets) pcap_a += a.tickets.length;
                if (a.interview) pcap_a += a.interview.length;
                if (a.appearance) pcap_a += a.appearance.length;
                return pcap_a;
            };

            var comparePCAP = function(a,b) {
                if (calcPCAP(a) == calcPCAP(b)) {
                    return a.name < b.name ? 1 : -1;
                }
                return calcPCAP(a) < calcPCAP(b) ? 1 : -1;
            };

            if ($scope.stations)
                return $scope.stations.filter(formatFilter).sort(comparePCAP);
            else
                return null
        }
    }
    
    /**
     * Get markets from api and deliver to typeahead
     * */
    $scope.getMarkets = function(val) {
        return $http.get(api + '/market/search?query=' + val).then(function(res){
            //console.log(res);
            var markets = [];
            angular.forEach(res.data.results, function(item){
                markets.push(item.name);
            });
            return markets;
        });
    };
    
    /**
     * Load the selected market
     */
    $scope.confirmMarket = function(market_name) {
        $http.get(api + '/market/search?query=' + market_name.split(",")[0])
        .then(function(res){
        var market = res.data.results[0];
            console.log(market);
            $scope.selected_market_node = market;
        });
    }

    /**
    * Listeners
    * */
    $scope.$on('crankRefresh',function() {
        console.log('refreshing analytics');
        $scope.init();
    });

    $scope.$on('clickCrank',function() {
        console.log('showing linear regression');

        var modalInstance = $modal.open({
            templateUrl: 'linearModal.html',
            controller: 'linearModalCtrl',
            windowClass: 'preferences-modal linear-modal',
            scope: $scope, 
        });

        modalInstance.result.then(function (e) {
            //
        }, function () {
            // console.log('Modal dismissed at: ' + new Date());
        });

    });


    /**
    * Watchers
    * */
    $scope.$watch('selected_market_node',function(x) {
        //console.log(x);
        if (IS_LIVE){
            $scope._stations = null;
            $scope.getStations(x);
        }else {
            $scope._stations = $scope.getStations();
        }
        
        if ($scope.selected_market_node)
            $scope.search_market = $scope.selected_market_node.name;
    })

    $scope.$watch('selected_format_node',function(x) {
        $scope._stations = $scope.getStations();
    })

    /**
    * Initialize Tour Smart Panels
    * */

    $scope.initTourSmart = function () {
        initTourPieChart('#format-pie-chart');
        initTourBarChart('#songs-bar-chart');
        initTourLineChart('#historical-chart');
    }

    /**
    * Return a pointer to the current object depending
    * if we are editing watermarks or station-specific
    * */
    $scope.editContextPointer = function () {
        if ($scope.selected_station) {
            console.log($scope.selected_station);
            return $scope.selected_station
        }
        else return $scope.watermarks;
    };

    /**
    * Validate the input in the ngModel
    * */
    $scope.validateQuantity = function () {};

    /**
    * Set the selected action value to be what is in the ngModel
    * */
    $scope.tourSetAction = function (q) {
        if (typeof q === "number")
            $scope.editContextPointer()[$scope.selected_action] = q;
        else
        switch(q){
            case('plus'):
                $scope.editContextPointer()[$scope.selected_action]++;
                break;
            case('minus'):
                $scope.editContextPointer()[$scope.selected_action]--;
                break;
        }

        if ($scope.editContextPointer()[$scope.selected_action] < 0)
            $scope.editContextPointer()[$scope.selected_action] = 0;
    };

    /**
    * Init
    * */
    $scope.init = function() {
        $http.get('data/viz_stations.json').then(function (res) {
            $scope.stations = res.data;
            //console.log($scope.stations);
        });

        $scope.activated_actions = {
            "tickets": false,
            "meetngreet": true,
            "interview": true,
            "appearance": false
        };
        $scope.watermarks = {
            "tickets": 0,
            "meetngreet": 0,
            "interview": 0,
            "appearance": 0
        };
        $scope.tour_starting_date = 'Thu Feb 13 2014 00:00:00 GMT+0100 (CET)';
        $scope.tour_ending_date = 'Thu Feb 20 2014 00:00:00 GMT+0100 (CET)';
        $scope.tour_venue_date = 'Thu Feb 27 2014 00:00:00 GMT+0100 (CET)';
        $scope.datepicker_date;
        $scope.datepicker_editing = false;
        $scope.datepicker_editing_caption;
        $scope.station_column_size = 32;
        $scope.selected_market_node = null;
        $scope.selected_format_node = null;
        $scope._stations = [];

        // it should reset the graph too
        initVisualization(); 
    }

    initVisualization();   

});

/**
* This controller is controller of the modal set when calling it
* The modal controllers should have this ugly definition
* */
var linearModalCtrl = function($scope,$http,$modalInstance) {
    $scope.ok = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

};



