(function () {
    'use strict';

    angular.module('crank_app')
           .factory('apiService', apiService);

    apiService.$inject = ['$rootScope', '$http', '$q', '$location'];

    function apiService($rootScope, $http, $q,$location) {
        return {
            post: post,
            get: get,
            put: put,
            "delete": function (url) {
                var req = {
                    method: 'DELETE',
                    url: url,
                }
                var deferred = $q.defer();
                $http(req)
                    .success(function (data, status, headers, config) {
                        if (status == '401') {
                            gotologin();
                        }

                        deferred.resolve(data);
                    })
                   .error(onError)
                    .catch(onError);


                return deferred.promise;

                function onError(data, status, headers, config) {
                    if (status == '401') {
                        gotologin();
                    }

                    deferred.reject(data);
                }
            }
        };

        // IN error case we have ErrorMessage and Title property and SuccessMessage for success response.

        function post(url, data,headers) {
            var req = {
                method: 'POST',
                url: url,
                data: data
            }
            var deferred = $q.defer();
           
            if(headers)
            {
                req.headers=headers;
            }
            
            $http(req)
                .success(function (data, status, headers, config) {

                    if (status == '401') {
                        gotologin();
                    }
                    deferred.resolve(data);
                })
              .error(onError)
                .catch(onError);

            return deferred.promise;

            function onError(data, status, headers, config) {
                if (status == '401') {
                    gotologin();
                }

                deferred.reject(data);
            }
        }
        function put(url, data) {
            var req = {
                method: 'PUT',
                url: url,
                data: data
            }
            var deferred = $q.defer();
            $http(req)
                .success(function (data, status, headers, config) {
                    if (status == '401') {
                        gotologin();
                    }
                    deferred.resolve(data);
                })
               .error(onError)
                .catch(onError);

            return deferred.promise;

            function onError(data, status, headers, config) {
                if (status == '401') {
                    gotologin();
                }

                deferred.reject(data);
            }
        }
        function get(url) {
            var req = {
                method: 'GET',
                url: url
            }
            var deferred = $q.defer();
            $http(req)
                .success(function (data, status, headers, config) {
                    
                    if (status == '401') {
                        gotologin()
                    }
                    deferred.resolve(data);
                })
               .error(onError)
                .catch(onError);
            return deferred.promise;
            function onError(data, status, headers, config) {
                
                if (status == '401') {
                    gotologin();
                }

                deferred.reject(data);
            }
        }

        function gotologin()
        {
            $location.path('/signin');
        }
    }

})();