(function () {
    var crankService = function crankService($http, apiService, $q) {
        var crankServiceApi = 'api/v1';
        var crankServiceUserApi = crankServiceApi + '/users';
        var crankServiceArtistsApi = crankServiceApi + '/artists';
        var crankServiceStationsApi = crankServiceApi + '/stations';
        var crankServiceMetroAreasApi = crankServiceApi + '/metroareas';
        var crankServiceModulesApi = crankServiceApi + '/modules';
        var crankServiceVenueApi = crankServiceApi + '/venues';
        var crankServiceEventApi = crankServiceApi + '/events';
        var crankServiceCompanyApi = crankServiceApi + '/companies';
        var users =
        {
            loginUser: function loginUser(userId, password) {
                var postData = {
                    "userid": userId,
                    "password": password
                };
                var deferred = $q.defer();
                apiService.post(crankServiceUserApi + '/login', JSON.stringify(postData))
                           .then(function (response) {
                               deferred.resolve(response);
                           }).catch(function (error) {
                               deferred.reject(error);
                           });

                return deferred.promise;
            },

            getUserById: function getUserById(userId) {
                var idParam = { "id": userId };
                var deferred = $q.defer();
                apiService.get(crankServiceUserApi + '/getById', idParam)
                       .then(function (response) {
                           deferred.resolve(response);
                       }).catch(function (error) {
                           deferred.reject(error);
                       });

                return deferred.promise;
            },

            getUserByIds: function getUserByIds(userIds) {
                var idParams = { "ids": userIds };
                var deferred = $q.defer();
                apiService.post(crankServiceUserApi + '/getByIds', JSON.stringify(idParams))
                       .then(function (response) {
                           deferred.resolve(response);
                       }).catch(function (error) {
                           deferred.reject(error);
                       });
                return deferred.promise;
            },
            getUsers: function getUsers(pageNumber, pagesize) {
                var deferred = $q.defer();

                var inpageNumber = (typeof pageNumber !== 'undefined') ? pageNumber : 1;
                var inpagesize = (typeof pagesize !== 'undefined') ? pagesize : 20;
                apiService.get(crankServiceUserApi + '?pageNumber=' + inpageNumber + '&pageSize=' + inpagesize)
                      .then(function (response) {
                          deferred.resolve(response);
                      }).catch(function (error) {
                          deferred.reject(error);
                      });
                return deferred.promise;

            },
            putUser: function putUser(user) {
                var deferred = $q.defer();
                apiService.put(crankServiceUserApi, JSON.stringify(user))
                     .then(function (response) {
                         deferred.resolve(response);
                     }).catch(function (error) {
                         deferred.reject(error);
                     });
                return deferred.promise;
            },

            getMyProfileEvents: function getMyProfileEvents(isIncludeWeeklyPromoHistory) {

                var includeWeeklyPromoHistory = (typeof isIncludeWeeklyPromoHistory !== 'undefined') ? isIncludeWeeklyPromoHistory : false;

                var deferred = $q.defer();
                apiService.get(crankServiceUserApi + '/getMyProfileEvents/' + includeWeeklyPromoHistory)
                       .then(function (response) {
                           deferred.resolve(response);
                       }).catch(function (error) {
                           deferred.reject(error);
                       });
                return deferred.promise;
            },
            postPassword: function postPassword(id, userId, password) {
                var idParams = {
                    "id": id,
                    "userId": userId,
                    "password": password
                };
                var deferred = $q.defer();
                apiService.post(crankServiceUserApi + '/pwds', JSON.stringify(idParams))
                        .then(function (response) {
                            deferred.resolve(response);
                        }).catch(function (error) {
                            deferred.reject(error);
                        });
                return deferred.promise;
            },
            putPassword: function putPassword(id, userId, password) {
                var idParams = {
                    "id": id,
                    "userId": userId,
                    "password": password
                };
                var deferred = $q.defer();
                apiService.put(crankServiceUserApi + '/pwds', JSON.stringify(idParams))
                      .then(function (response) {
                          deferred.resolve(response);
                      }).catch(function (error) {
                          deferred.reject(error);
                      });
                return deferred.promise;
            },
            invite: function invite(user) {
                var deferred = $q.defer();
                return apiService.post(crankServiceUserApi + '/invite', JSON.stringify(user))
                        .then(function (response) {
                            deferred.resolve(response);
                        }).catch(function (error) {
                            deferred.reject(error);
                        });
                return deferred.promise;
            },
            inviteDigital: function (user)
            {
               
                var deferred = $q.defer();
                return apiService.post(crankServiceUserApi + '/invite/digital', JSON.stringify(user))
                        .then(function (response) {
                            deferred.resolve(response);
                        }).catch(function (error) {
                            deferred.reject(error);
                        });
                return deferred.promise;
            },
            registerUser: function registerUser(user) {
                var deferred = $q.defer();
                apiService.post(crankServiceUserApi + '/register', JSON.stringify(user))
                       .then(function (response) {
                           deferred.resolve(response);
                       }).catch(function (error) {
                           deferred.reject(error);
                       });
                return deferred.promise;
            },
            registerInvite: function registerInvite(userId, user) {
                var deferred = $q.defer();
                apiService.post(crankServiceUserApi + '/register/' + userId, JSON.stringify(user))
                        .then(function (response) {
                            deferred.resolve(response);
                        }).catch(function (error) {
                            deferred.reject(error);
                        });
                return deferred.promise;
            },
            registerDigitalInvite: function registerDigitalInvite(userId,isdigital, user) {
                var deferred = $q.defer();
                apiService.post(crankServiceUserApi + '/register/' + userId+'/'+isdigital, JSON.stringify(user))
                        .then(function (response) {
                           
                            deferred.resolve(response);
                        }).catch(function (error) {
                            deferred.reject(error);
                        });
                return deferred.promise;
            },

            updateAvatar: function updateAvatar(userId, fileString) {
                var deferred = $q.defer();
                var fd = new FormData();
                fileString = fileString.substring((fileString.indexOf(',') + 1));
                fd.append("imagebase64", fileString);
                apiService.post(crankServiceUserApi + '/' + userId + '/uploadImageBase64/', fd, { 'Content-Type': undefined })
                       .then(function (response) {
                           deferred.resolve(response);
                       }).catch(function (error) {
                           deferred.reject(error);
                       });
                return deferred.promise;
            },

            };

    var artists =
    {
        getByIds: function getByIds(ids) {
            var deferred = $q.defer();
            var idParams = { "ids": ids };
            apiService.post(crankServiceArtistsApi + '/getByIds', JSON.stringify(idParams))
              .then(function (response) {
                  deferred.resolve(response);
              }).catch(function (error) {
                  deferred.reject(error);
              });
            return deferred.promise;
        },
        getArtists: function getAritsts(pageNumber,pageSize) {
            var deferred = $q.defer();
            var inpageNumber = (typeof pageNumber !== 'undefined') ? pageNumber : 1;
            var inpageSize = (typeof pageSize !== 'undefined') ? pageSize : 20;

            apiService.get(crankServiceArtistsApi + '?pageNumber=' + inpageNumber + '&pageNumber=' + inpageSize)
              .then(function (response) {
                  deferred.resolve(response);
              }).catch(function (error) {
                  deferred.reject(error);
              });
            return deferred.promise;
        }
    };

    var stations =
    {
        getByIds: function getByIds(ids,includeInviteDetail) {
            var deferred = $q.defer();
            var idParams = { "ids": ids };
            var invite = (typeof includeInviteDetail === 'undefined') ? false : includeInviteDetail;

            apiService.post(crankServiceStationsApi + '/getByIds/' + invite, JSON.stringify(idParams))
               .then(function (response) {
                   deferred.resolve(response);
               }).catch(function (error) {
                   deferred.reject(error);
               });
            return deferred.promise;
        },
        getById: function getById(id) {
            var deferred = $q.defer();
            apiService.get(crankServiceStationsApi + '/getById/' + id)
               .then(function (response) {
                   deferred.resolve(response);
               }).catch(function (error) {
                   deferred.reject(error);
               });
            return deferred.promise;
        },
        searchByName: function searchByName(name, type) {
            var deferred = $q.defer();
            apiService.get(crankServiceStationsApi + '/searchByName/' + name + '/' + type)
                .then(function (response) {
                    deferred.resolve(response);
                }).catch(function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        },
        searchByCallcode: function searchByCallcode(callcode, type) {
            var deferred = $q.defer();
            apiService.get(crankServiceApi + '/stations/searchbycallcode/' + callcode).then(function (response) {
                deferred.resolve(response);
            }).catch(function (error) {
                deferred.reject(error);
            });
            return deferred.promise;
        },
        getDigital: function getDigital(pageNumber, pageSize,includeInviteDetail) {
            var inpageNumber = (typeof pageNumber !== 'undefined') ? pageNumber : 1;
            var inpageSize = (typeof pageSize !== 'undefined') ? pageSize : 20;
            var invite = (typeof includeInviteDetail === 'undefined') ? false : includeInviteDetail;
            var deferred = $q.defer();
            apiService.get(crankServiceStationsApi + '/digitals/' + invite + '?pageNumber=' + inpageNumber + '&pageSize=' + inpageSize)
                    .then(function (response) {
                        deferred.resolve(response);
                    }).catch(function (error) {
                        deferred.reject(error);
                    });
            return deferred.promise;
        },
        getFM: function getFM(pageNumber, pageSize) {
            var inpageNumber = (typeof pageNumber !== 'undefined') ? pageNumber : 1;
            var inpageSize = (typeof pageSize !== 'undefined') ? pageSize : 20;
            var deferred = $q.defer();
            apiService.get(crankServiceStationsApi + '/fms?pageNumber=' + inpageNumber + '&pageSize=' + inpageSize)
                   .then(function (response) {
                       deferred.resolve(response);
                   }).catch(function (error) {
                       deferred.reject(error);
                   });
            return deferred.promise;
        },
        getByMetroIds: function getByMetroIds(ids) {
            var idParams = { "ids": ids };
            var deferred = $q.defer();
            apiService.post(crankServiceStationsApi + '/getByMetroIds', JSON.stringify(idParams))
                .then(function (response) {
                    deferred.resolve(response);
                }).catch(function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        },
        getByMetroId: function getByMetroIds(id) {
            var idParams = { "ids": [id] };
            var deferred = $q.defer();
            apiService.post(crankServiceStationsApi + '/getByMetroIds', JSON.stringify(idParams))
                .then(function (response) {
                    deferred.resolve(response);
                }).catch(function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        },

        getStationsAroundEventVenue: function getStationsAroundEventVenue(eventId) {
            var idParams = { "eventId": eventId };
            var deferred = $q.defer();
            apiService.get(crankServiceStationsApi + '/getStationsAroundEventVenue', idParams)
                .then(function (response) {
                    deferred.resolve(response);
                }).catch(function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        },
        getAllMarkets: function getAllMarkets() {
            var deferred = $q.defer();
            apiService.get(crankServiceStationsApi + '/getAllMarkets')
                .then(function (response) {
                    deferred.resolve(response);
                }).catch(function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        },
        getMarketByIds: function getMarketByIds() {
            var idParams = { "ids": ids };
            var deferred = $q.defer();
            apiService.post(crankServiceStationsApi + '/getByMetroIds', JSON.stringify(idParams))
                .then(function (response) {
                    deferred.resolve(response);
                }).catch(function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        },
        searchStationByMarketAndOwner: function (marketName, owner) {
            var deferred = $q.defer();
            apiService.get(crankServiceStationsApi + '/searchByMarketAndOwner/' + marketName + '/' + owner)
               .then(function (response) {
                   deferred.resolve(response);
               }).catch(function (error) {
                   deferred.reject(error);
               });
            return deferred.promise;
        },
        getStationsByPageNumber: function (pagenumber, pagesize) {
            if (!pagenumber) {
                pagenumber = 1;
            }

            if (!pagesize) {
                pagesize = 20;
            }
            var deferred = $q.defer();
            apiService.get(crankServiceStationsApi + '?pageNumber=' + pagenumber + '&pageSize=' + pagesize)
                             .then(function (response) {
                                 deferred.resolve(response);
                             }).catch(function (error) {
                                 deferred.reject(error);
                             });
            return deferred.promise;
        }
    };

    var metroAreas =
    {
        getByIds: function getByIds(ids) {
            var deferred = $q.defer();
            var idParams = { "ids": ids };
            apiService.post(crankServiceMetroAreasApi + '/getByIds', JSON.stringify(idParams))
              .then(function (response) {
                  deferred.resolve(response);
              }).catch(function (error) {
                  deferred.reject(error);
              });
            return deferred.promise;
        },
        getById: function getById(id) {
            var idParams = { "id": id };
            var deferred = $q.defer();
            apiService.get(crankServiceMetroAreasApi + '/getById', idParams)
                .then(function (response) {
                    deferred.resolve(response);
                }).catch(function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        },
        searchByName: function searchByName(name) {
            var deferred = $q.defer();
            apiService.get(crankServiceMetroAreasApi + '/searchByName/' + name)
                .then(function (response) {
                    deferred.resolve(response);
                }).catch(function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }
    };

    var modules =
     {
         getByIds: function getByIds(ids) {
             var idParams = { "ids": ids };
             var deferred = $q.defer();
             apiService.post(crankServiceModulesApi + '/getByIds', JSON.stringify(idParams))
                 .then(function (response) {
                     deferred.resolve(response);
                 }).catch(function (error) {
                     deferred.reject(error);
                 });
             return deferred.promise;
         },
         getById: function getById(id) {
             var idParams = { "id": id };
             var deferred = $q.defer();
             apiService.get(crankServiceModulesApi + '/getById', idParams)
                .then(function (response) {
                    deferred.resolve(response);
                }).catch(function (error) {
                    deferred.reject(error);
                });
             return deferred.promise;
         },
         get: function getModules(pageNumber) {
             var deferred = $q.defer();
             var inpageNumber = (typeof pageNumber !== 'undefined') ? pageNumber : 1;
             apiService.get(crankServiceModulesApi + '/' + inpageNumber)
                    .then(function (response) {
                        deferred.resolve(response);
                    }).catch(function (error) {
                        deferred.reject(error);
                    });
             return deferred.promise;
         }
     };

    var venues =
    {
        getByIds: function getByIds(ids) {
            var idParams = { "ids": ids };
            var deferred = $q.defer();
            apiService.post(crankServiceVenueApi + '/getByIds', JSON.stringify(idParams))
               .then(function (response) {
                   deferred.resolve(response);
               }).catch(function (error) {
                   deferred.reject(error);
               });
            return deferred.promise;
        },
        getById: function getById(id) {
            var deferred = $q.defer();
            apiService.get(crankServiceVenueApi + '/getById/' + id)
              .then(function (response) {
                  deferred.resolve(response);
              }).catch(function (error) {
                  deferred.reject(error);
              });
            return deferred.promise;
        },
        get: function getModules(pageNumber) {
            var deferred = $q.defer();
            var inpageNumber = (typeof pageNumber !== 'undefined') ? pageNumber : 1;
            apiService.get(crankServiceVenueApi + '/' + inpageNumber)
                   .then(function (response) {
                       deferred.resolve(response);
                   }).catch(function (error) {
                       deferred.reject(error);
                   });
            return deferred.promise;
        },
        searchByName: function (filter) {
            var deferred = $q.defer();
            apiService.get(crankServiceVenueApi + '/searchByName/' + filter)
                                 .then(function (response) {
                                     deferred.resolve(response);
                                 }).catch(function (error) {
                                     deferred.reject(error);
                                 });
            return deferred.promise;
        },
        getVenuesByPageNumber: function (pagenumber, pagesize) {
            if (!pagenumber) {
                pagenumber = 1;
            }

            if (!pagesize) {
                pagesize = 20;
            }
            var deferred = $q.defer();
            apiService.get(crankServiceVenueApi + '?pageNumber=' + pagenumber + '&pageSize=' + pagesize)
                               .then(function (response) {
                                   deferred.resolve(response);
                               }).catch(function (error) {
                                   deferred.reject(error);
                               });
            return deferred.promise;
        }
    };

    var events =
    {
        getByIds: function getByIds(ids) {
            var idParams = { "ids": ids };
            var deferred = $q.defer();
            apiService.post(crankServiceEventApi + '/getByIds', JSON.stringify(idParams))
                .then(function (response) {
                    deferred.resolve(response);
                }).catch(function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        },
        getById: function getById(id) {
            var idParams = { "id": id };
            var deferred = $q.defer();
            apiService.get(crankServiceEventApi + '/getById', idParams)
               .then(function (response) {
                   deferred.resolve(response);
               }).catch(function (error) {
                   deferred.reject(error);
               });
            return deferred.promise;
        },
        get: function getEvents(pageNumber) {
            var inpageNumber = (typeof pageNumber !== 'undefined') ? pageNumber : 1;
            var deferred = $q.defer();
            apiService.get(crankServiceEventApi + '/' + inpageNumber)
                   .then(function (response) {
                       deferred.resolve(response);
                   }).catch(function (error) {
                       deferred.reject(error);
                   });
            return deferred.promise;
        },
        getEventExtras: function getEventExtras(id, pageNumber) {
            var inpageNumber = (typeof pageNumber !== 'undefined') ? pageNumber : 1;
            var deferred = $q.defer();
            apiService.get(crankServiceEventApi + '/' + id + '/extras/' + inpageNumber)
                   .then(function (response) {
                       deferred.resolve(response);
                   }).catch(function (error) {
                       deferred.reject(error);
                   });
            return deferred.promise;
        },
        postEventExtras: function postEventExtras(eventExtras) {

            var deferred = $q.defer();

            apiService.post(crankServiceEventApi + '/extras', JSON.stringify(eventExtras))
                    .then(function (response) {
                        deferred.resolve(response);
                    }).catch(function (error) {
                        deferred.reject(error);
                    });
            return deferred.promise;
        },
        putEventExtras: function putEventExtras(eventExtras) {
            var deferred = $q.defer();
            apiService.put(crankServiceEventApi + '/extras', JSON.stringify(eventExtras))
                   .then(function (response) {
                       deferred.resolve(response);
                   }).catch(function (error) {
                       deferred.reject(error);
                   });
            return deferred.promise;
        }
    };

    var companies =
    {
        getByIds: function getByIds(ids) {
            var idParams = { "ids": ids };
            var deferred = $q.defer();
            apiService.post(crankServiceCompanyApi + '/getByIds', JSON.stringify(idParams))
                .then(function (response) {
                    deferred.resolve(response);
                }).catch(function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        },
        getById: function getById(id) {
            var idParams = { "id": id };
            var deferred = $q.defer();
            apiService.get(crankServiceCompanyApi + '/getById/' + id)
               .then(function (response) {
                   deferred.resolve(response);
               }).catch(function (error) {
                   deferred.reject(error);
               });
            return deferred.promise;

        },
        searchByName: function searchByName(name, status) {
            var deferred = $q.defer();
            apiService.get(crankServiceCompanyApi + '/searchByName/' + name + '/active')
                .then(function (response) {
                    deferred.resolve(response);
                }).catch(function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        },
        get: function getCompanies(status, pageNumber) {
            var inpageNumber = (typeof pageNumber !== 'undefined') ? pageNumber : 1;
            var deferred = $q.defer();
            apiService.get(crankServiceCompanyApi + '/' + status + '/' + inpageNumber + '/' + 300)
                   .then(function (response) {
                       deferred.resolve(response);
                   }).catch(function (error) {
                       deferred.reject(error);
                   });
            return deferred.promise;
        },
        updatecompanyInfo: function (company) {
            var deferred = $q.defer();
            apiService.put(crankServiceCompanyApi, JSON.stringify(company))
                     .then(function (response) {
                         deferred.resolve(response);
                     }).catch(function (error) {
                         deferred.reject(error);
                     });
            return deferred.promise;
        },

        changeLogo: function (id, fileString) {
            var fd = new FormData();
            fileString = fileString.substring((fileString.indexOf(',') + 1));
            fd.append("imagebase64", fileString);
            var deferred = $q.defer();
            apiService.post(crankServiceCompanyApi + '/' + id + '/uploadImageBase64/', fd, { 'Content-Type': undefined })
                    .then(function (response) {
                        deferred.resolve(response);
                    }).catch(function (error) {
                        deferred.reject(error);
                    });
            return deferred.promise;
        }

    };

    return {
        artists: artists,
        users: users,
        modules: modules,
        stations: stations,
        metroAreas: metroAreas,
        venues: venues,
        events: events,
        companies: companies
    }
};

var crank_app = angular.module('crank_app');
crank_app.factory('crankService', crankService);
}());
