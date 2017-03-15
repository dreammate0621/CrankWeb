/**
* Crank Landing page app
*
* Makes people register
* Choose beetweern artist / radio
* Choose beetween signin / register
* */

app.controller('signinFormCtrl', function ($scope, $http, $cookieStore, $location) {
    
    $scope.current_view = 'signin';
    $scope.current_form = 'partials/landing_signin.html';
    $scope.login_username;
    $scope.login_password;

    
    /**
    * Submit the login form
    * */
    $scope.submitLogin = function login() {
        // Call $parent because ng-include creates a new inner scope
        var postData = {
            "userid": $scope.login_username,
            "password": $scope.login_password
        };
        $http.post(crankServiceApi + '/users/login', JSON.stringify(postData))
        .success(function (data) {

           
            //$cookieStore.put('current_user', data);
            if (data.user_type == USER_TYPE_RADIO_MANAGER)
            {
                $location.path('/radio');
            }
            else
            {
                $location.path('/artist');
            }
            
        })
        .error(function(data){
            $scope.login_error = "There was an error loggin in, are you registered?";
            console.log(data);
        });
    }

});

app.controller('confirmFormCtrl',function($scope,$http,$cookieStore,$location) {
    $scope.current_view  = 'confirm';
    $scope.current_form = 'partials/landing_confirm.html';
});


