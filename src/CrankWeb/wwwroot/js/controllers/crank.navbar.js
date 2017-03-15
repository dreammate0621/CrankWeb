/**
* This is the controller of the navbar
* */
app.controller('navBarCtrl',function($rootScope, $scope, $cookieStore, $timeout) {
    $scope.doRefresh = function () {
        $timeout(function () {
            $rootScope.$broadcast('crankRefresh');
        });
    };

    $scope.clickCrank = function() {
        $rootScope.$broadcast('clickCrank',{});
    };


    /**
    * Main
    * */

   // $scope.current_user = $cookieStore.get('current_user');

});
