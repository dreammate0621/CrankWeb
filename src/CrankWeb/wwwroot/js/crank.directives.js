/*
* Angular directive for iScroll
*/

angular.module('ng-iscroll', []).directive('ngIscroll', function ($rootScope, $window) {
    return {
        replace: false,
        restrict: 'A',
        link: function (scope, element, attr) {
            // default timeout
            var ngiScroll_timeout = 5;
            // default options
            var ngiScroll_opts = {
                //snap: true,
                //momentum: true,
                //hScrollbar: false,
                //mouseWheel: true,
                //click: false,
                //tap: true
            };
            // scroll key /id
            var scroll_key = attr.ngIscroll;

            if (scroll_key === '') {
                scroll_key = attr.id;
            }

            if (scope.$parent.myScrollOptions) {
                for (var i in scope.$parent.myScrollOptions) {
                    if (typeof (scope.$parent.myScrollOptions[i]) !== "object") {
                        ngiScroll_opts[i] = scope.$parent.myScrollOptions[i];
                    } else if (i === scroll_key) {
                        for (var k in scope.$parent.myScrollOptions[i]) {
                            ngiScroll_opts[k] = scope.$parent.myScrollOptions[i][k];
                        }
                    }
                }
            }



            // iScroll initialize function
            function setScroll() {
                if (scope.$parent) {
                    if (scope.$parent.myScroll === undefined) {
                        scope.$parent.myScroll = [];
                    }
                    scope.$parent.myScroll[scroll_key] = new IScroll(element[0], ngiScroll_opts);

                    // iscroll scroll event watcher
                    if (scroll_key === 'events_wrapper') {
                        $rootScope.setEvent = false;
                        var startY = 0;
                        
                        scope.$parent.myScroll[scroll_key].on('scrollStart', function () {
                            startY = this.y;
                        });

                        scope.$parent.myScroll[scroll_key].on('scrollEnd', function () {
                            if (this.y > 0) {
                                return;
                            }

                            var currentY = this.y;
                            var itemH = 0 - $rootScope.eventItemHeight;
                            if ($rootScope.eventItemHeight > 0 && currentY % itemH !== 0) {
                                var count = parseInt(currentY / itemH);
                                if (currentY < startY) { //if scrolling narrow is down
                                    count++;
                                } else {
                                    count--;
                                }
                                
                                currentY = count * itemH;
                            }
                            scope.$parent.myScroll[scroll_key].scrollTo(0, currentY);
                        });
                    }
                }
            }

            // new specific setting for setting timeout using: ng-iscroll-timeout='{val}'
            if (attr.ngIscrollDelay !== undefined) {
                ngiScroll_timeout = attr.ngIscrollDelay;
            }

            // watch for 'ng-iscroll' directive in html code
            scope.$watch(attr.ngIscroll, function () {
                setTimeout(setScroll, ngiScroll_timeout);
            });

            // add ng-iscroll-refresher for watching dynamic content inside iscroll
            if (attr.ngIscrollRefresher !== undefined) {
                scope.$watch(attr.ngIscrollRefresher, function () {
                    console.log(1);
                    if (scope.$parent.myScroll[scroll_key] !== undefined) scope.$parent.myScroll[scroll_key].refresh();
                });
            }

            // destroy the iscroll instance if we are moving away from a state to another
            // the DOM has changed and he only instance is not necessary any more
            scope.$on('$destroy', function () {
                if (scope.$parent.myScroll) {
                    scope.$parent.myScroll[scroll_key].destroy();
                }
            });
        }
    };
});


angular.module('ngIscroll', [])
.directive('iscroll', function ($parse) {
    return {
        restrict: 'A',
        require: '?ngModel',
        scope: {
            "iscroll": "=iscroll",
            "opt": "=iscrollOpt"
        },
        link: function (scope, element, attrs, controller) {

            var opt = scope.opt || {};
            scope.iscroll = new IScroll(element[0], opt);

            // Refresh automatically
            setInterval(function () {
                scope.iscroll.refresh();
            }, 500);

        }
    };

});


// Event item directive
angular.module('crank_app').directive("eventItemSize", function ($timeout, $rootScope) {
    return function (scope, element, attrs) {
        $timeout(init, false);

        function init() {
            if (!$rootScope.setEvent) {
                // get map height
                var mapElement = angular.element(document.querySelector('#artistmap'));
                var mapHeight = mapElement[0].offsetHeight;


                // minus the top and bottom from map height
                var eventSectionElement = angular.element(document.querySelector('#events'));
                var eventSectionStyle = eventSectionElement[0].currentStyle || window.getComputedStyle(eventSectionElement[0]);
                var value = parseInt(eventSectionStyle.top, 10);
                mapHeight -= value;
                var value = parseInt(eventSectionStyle.bottom, 10);
                mapHeight -= value;
                
                // get one event item height
                var eventItemHeight = element[0].offsetHeight;
                var eventItemStyle = element[0].currentStyle || window.getComputedStyle(element[0]);
                var eventItemTop = parseInt(eventItemStyle.marginTop, 10);
                eventItemHeight += eventItemTop * 2;
                $rootScope.eventItemHeight = 0- eventItemHeight;


                // set event select height
                var eventCount = parseInt(mapHeight / eventItemHeight);
                var eventSectionHeight = eventItemHeight * eventCount;
                eventSectionElement[0].style.height = eventSectionHeight + 'px';
                $rootScope.eventItemHeight = eventItemHeight;
                $rootScope.setEvent = true;
            }
        }
    }
});

// Module wrappers
angular.module('crank_app').directive("moduleWrapper", function ($timeout, $rootScope) {
    return function (scope, element, attrs) {
        var module_index = $rootScope.module_wrappers.indexOf(attrs.id);
        var isPromotion = false;
        if (attrs.id === 'user_Has_Promotion_Module') {
            isPromotion = true;
        }
        var startx1 = -1250, starty1 = -150;
        var startx2 = -200, starty2 = -150;
        var step = 350;

        if (module_index % 2 === 0) {
            var c = parseInt(module_index / 2, 10);
            $rootScope.setTransform(element[0], startx1, starty1 + c * step, isPromotion);
        } else {
            var c = parseInt(module_index / 2, 10);
            $rootScope.setTransform(element[0], startx2, starty2 + c * step, isPromotion);
        }
    }
});

angular.module('crank_app').directive("chartDetail", function () {
    return {
        restrict: "A",
        link: function (scope, element, attrs) {
            element.bind('dblclick', function () {
                var expand = this.getAttribute('expand');
                var chartTrackList = angular.element(document.querySelectorAll('.charting-wrapper .track-list .track-list__row'));

                for (var i = 0; i < chartTrackList.length; i++) {

                    if (chartTrackList[i].getAttribute('expand') == 'true' && chartTrackList[i] != element[0]) {
                        console.log(1);
                        chartTrackList[i].setAttribute('expand', false);
                        chartTrackList[i].style.height = chartTrackList[i].offsetHeight / 3 + 'px';
                        chartTrackList[i].style.alignItems = 'center';
                    }
                }
                
                if (expand=='true') {
                    $(element).animate({ height: element[0].offsetHeight / 3 }, 500);
                    $(element).animate({ 'align-items': 'center' }, 500);
                    attrs.$set('expand', false);
                } else {
                    $(element).animate({ height: element[0].offsetHeight * 3 }, 500);
                    element.css('align-items', 'flex-start');
                    attrs.$set('expand', true);
                }
                
            });
        }
    }
});
/*
angular.module('crank_app').directive("workpageHeight", function ($rootScope) {
    return {
        restrict: "A",
        link: function (scope, element, attrs) {
            scope.$watch(function () {
                return element[0].offsetHeight;
            },
            function (newHeight, oldHeight) {
                if (newHeight !== oldHeight) {
                    
                    if (!$rootScope.isLenderWorkpage) {
                        console.log('start---');
                        console.log(newHeight, oldHeight);
                        //$(element).css('max-height', oldHeight);
                        $rootScope.isLenderWorkpage = true;
                        $(element).animate({
                            'height': newHeight,
                        }, 500,
                        function () {
                            //$(element).height('auto');
                            $(this).css('height', 'auto');
                            $(this).css({
                                transition: 'height 1s linear',
                                MozTransition: 'height 1s linear',
                                WebkitTransition: 'height 1s linear',
                                msTransition: 'height 1s linear'
                            });
                            $rootScope.isLenderWorkpage = false;
                        });
                    }
                    
                }
            });
        }
    }
});*/

// Datepicker
angular.module('crank_app').directive("crankDatepicker", function () {
    return {
        restrict: "A",
        scope: { callOnSelectedDate: '&onSelectedDate', eventdates: '=eventDates' },
        link: function (scope, elem, attrs) {
            var openOnClick = attrs.openonclick;
            elem.datepicker({
                inline: true,
                showOtherMonths: true,
                showOn: "button",
                eventDates: scope.eventdates,
                selectOtherMonths: true,
                dayNamesMin: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                onSelect: function (selected, evnt) {
                    scope.callOnSelectedDate({ date: { day: evnt.currentDay, monthDigit: ((evnt.currentMonth) + 1), year: evnt.currentYear } });
                    $(openOnClick).click();
                },

            });
            $(openOnClick).on('click', function () {

                elem.toggleClass('date-picker--active');
            });
        }
    }
});


// minimize and maximize tiles
angular.module('crank_app').directive("minimizeMaximizeTiles", function () {
    return {
        restrict: "A",
        scope: { onMaximize :"&", onMinimize :"&"},
        link: function (scope, elem, attrs) {
            var frameclass = '.' + attrs.frameclass;
            var frameContainerClass = '.' + attrs.framecontainerclass;
            var ContainerClass = '.' + attrs.containerclass;

            // expanded frames


            function minimizeFrame(e) {
                var frames = $(elem).find(frameclass);
                e.preventDefault();
                e.stopPropagation();

                // call function  on minimize
                if (scope.onMinimize) {
                    scope.onMinimize();
                }
                var frame = $(e.target).closest(frameclass);
                if (!frame.hasClass('frame--expanded') || !frame.hasClass('frame--anim')) return;
                // frame.perfectScrollbar('destroy');
                frame.removeClass('frame--expanded');

                var frameTop = frame.data('top');
                var frameLeft = frame.data('left');
                var offsetTop = frame.data('offsetTop');
                var offsetLeft = frame.data('offsetLeft');
                var framesContainer = frame.closest(frameContainerClass);
                var scrollTop = frame.data('scrollTop');

                function fixFrame() {
                    frame.removeClass('frame--anim').css({
                        position: '',
                        top: '',
                        left: ''
                    });
                    frames.fadeIn(300);
                    framesContainer.scrollTop(scrollTop);
                }

                function frameMinimizeAnim(frame, fn) {
                    frame.animate({
                        height: frame.data('height'),
                        width: frame.data('width')
                    }, 300, function () {
                        if (fn) fn();
                    });
                }

                if ((frameTop === offsetTop) && (frameLeft === offsetLeft)) {
                    frameMinimizeAnim(frame, fixFrame);
                } else {
                    frameMinimizeAnim(frame, function () {
                        frame.animate({
                            top: frameTop,
                            left: frameLeft
                        }, 300, fixFrame);
                    });
                }

                $(elem).find('.showonexpended').hide();
                $(elem).find('.hideonexpended').show();
            }

            function expandFrame(e) {
                var frames;
                var frame = $(e.target).closest(frameclass);
            
                if (frame.hasClass('frame--expanded') || frame.hasClass('frame--anim')) return;
               
               //  getting data object with element
                var attachedObject = frame.data('item');
              
                if (attachedObject)
                {
                    // call function  on maximize
                    if (scope.onMaximize)
                    {
                        scope.onMaximize({item: attachedObject });
                    }

                }

                var container = frame.closest(ContainerClass);
                var framesContainer = frame.closest(frameContainerClass);
                var scrollTop = framesContainer.scrollTop();
                var frames;

                if ($(window).width() > 655) {
                    frames = container.find(frameclass);
                } else {
                    frames = framesContainer.find(frameclass);
                }

                var offsetTop = framesContainer.find(frameclass).first().position().top + scrollTop;
                var offsetLeft = frames.first().position().left;
                var frameTop = frame.position().top;
                var frameLeft = frame.position().left;

                function frameExpandAnim(frame) {
                    frame.addClass('frame--anim');
                    frame.animate({
                        height: framesContainer.height() + 'px',
                        width: (container.width() - 60) + 'px' //ja nemashe - 60, ova e hack
                    }, 300, function () {
                        frame.addClass('frame--expanded');
                        //frame.perfectScrollbar({
                        //    wheelSpeed: 0.3
                        //});
                    });
                }

                $(elem).find('.showonexpended').show();
                $(elem).find('.hideonexpended').hide();


                frame.data({
                    left: frameLeft,
                    top: frameTop,
                    width: frame.outerWidth(),
                    height: frame.outerHeight(),
                    offsetTop: offsetTop,
                    offsetLeft: offsetLeft,
                    scrollTop: scrollTop
                });

                frames.hide();

                frame.show().css({
                    position: 'absolute',
                    top: frameTop,
                    left: frameLeft
                });

                if ((frameTop === offsetTop) && (frameLeft === offsetLeft)) {
                    frameExpandAnim(frame);
                } else {
                    frame.animate({
                        top: offsetTop,
                        left: offsetLeft
                    }, 300, function () {
                        frameExpandAnim(frame);
                    });
                }
            }


            $(elem).on('click', frameclass, expandFrame);
            $(elem).on('click', frameclass + ' .frame__control-btn--underscore', minimizeFrame);
            $(elem).on('click', frameclass + ' .frame__control-btn--out', function (e) {
                var frames = $(elem).find(frameclass);
                e.stopPropagation();
                e.preventDefault();
                $(this).closest('.frame--expanded').remove();
                frames.show(300);
            });

            $(elem).on('click', frameclass + ' .frame__control-btn--remove', function (e) {
                minimizeFrame(e);
                e.stopPropagation();
                e.preventDefault();
            })

            $(elem).on('click', frameclass + ' .color-picker-wrapper', function (e) {
                e.stopPropagation();
                e.preventDefault();
            });

            $(elem).on('click', frameclass + ' .digital-invite-link-icon', function (e) {
                e.stopPropagation();
                e.preventDefault();
            });
           
            $(elem).on('click', frameclass + ' .frame__icon', function (e) {
                e.stopPropagation();
                e.preventDefault();
            })
            $(elem).on('click', frameclass + ' .frame__control-btn--invite', function (e) {
                e.stopPropagation();
                e.preventDefault();
            })



        }
    }
});

// drag drop file upload
angular.module('crank_app').directive('fileDropzone', function () {
    return {
        restrict: 'A',
        scope: {
            file: '=',
            fileName: '='
        },
        link: function (scope, element, attrs) {

            var checkSize, isTypeValid, processDragOverOrEnter, validMimeTypes, processDragleave;
            processDragOverOrEnter = function (event) {

                if (event != null) {
                    event.preventDefault();
                }
                addDropClassAndText();

               
                (event.originalEvent || event).dataTransfer.effectAllowed = 'copy';

                return false;
            };

            function addDropClassAndText() {
                $(element).addClass('drop-image-area');

              

            }

            function removeDropClassAndText() {
                $(element).removeClass('drop-image-area');
                //$(element).find('.drop-image-text').remove();
            }

            processDragleave = function (event) {
                removeDropClassAndText();
            
            }
            validMimeTypes = attrs.fileDropzone;
            checkSize = function (size) {
                var _ref;
                if (attrs.maxFileSize) {
                    if ((_ref = attrs.maxFileSize) === void 0 || _ref === '' || size / 1024 / 1024 < attrs.maxFileSize) {
                        return true;
                    } else {
                        alert('File must be smaller than ' + attrs.maxFileSize + ' MB');
                        return false;
                    }
                }
                return true;
            };
            isTypeValid = function (type) {
                if (validMimeTypes) {
                    if (validMimeTypes === void 0 || validMimeTypes === '' || validMimeTypes.indexOf(type) > -1) {
                        return true;
                    } else {
                        alert('Invalid file type.  File must be one of following types ' + validMimeTypes);
                        return false;
                    }
                }

                return true;
            };
            element.bind('dragover', processDragOverOrEnter);
            element.bind('dragleave', processDragleave);

            element.bind('dragenter', processDragOverOrEnter);
            return element.bind('drop', function (event) {

                removeDropClassAndText();
               
                var file, name, reader, size, type;
                if (event != null) {
                    event.preventDefault();
                }
                reader = new FileReader();
                reader.onload = function (evt) {

                    if (checkSize(size) && isTypeValid(type)) {
                        return scope.$apply(function () {
                            scope.file = evt.target.result;
                            if (angular.isString(scope.fileName)) {
                                return scope.fileName = name;
                            }
                        });
                    }
                };

                file = (event.originalEvent || event).dataTransfer.files[0];
                name = file.name;
                type = file.type;
                size = file.size;
                reader.readAsDataURL(file);
                return false;
            });
        }
    };
})


///File style 
angular
       .module('crank_app')
       .directive('filestyle', filestyle);

function filestyle() {
    var directive = {
        link: link,
        restrict: 'A'
    };
    return directive;

    function link(scope, element) {
        var options = element.data();

        // old usage support
        options.classInput = element.data('classinput') || options.classInput;

        element.filestyle(options);
    }
}

//colorPicker
//angular
//       .module('crank_app')
//       .directive('colorPicker', colorPicker);

//function colorPicker() {
//    var directive = {
//        link: link,
//        restrict: 'A'
//    };
//    return directive;

//    function link(scope, element, attrs) {
//        var colors = ['#f00', '#ff0', '#f0f', '#0ff', '#00f', '#000'];

//        var colorPicker = $('<div class="color-picker"><h2 class="color-picker__title">Pick Color</h2></div>');


//        var colorsBlock = $('<div class="color-picker__colors"></div>');

//        for (var i = 0; i < colors.length; i++) {
//            var colorItem = $('<div class="color-picker__color">&nbsp;</div>').css('background-color', colors[i]);
//            colorsBlock.append(colorItem);
//        }
//        colorPicker.append(colorsBlock);
//        $(element).append(colorPicker);

//        var toggleColorPicker = function (event) {
//            event.stopPropagation();
//            $(element).find('.color-picker').toggle();
//        };

//        // Set color
//        var setColorPickerColor = function (event) {
//            event.stopPropagation();
//            var color = event.target;
//            if (!$(color).hasClass('color-picker__color')) return;
//            $(color).closest('.color-picker').hide();
//            $(element).css('color', $(color).css('background-color'));
//        };

//        $(element).on('click', toggleColorPicker);

       
//        $('body').on('click', function (e) { $(element).find('.color-picker').hide(); })

//        $('.frame__icon').on('click', function (e) {
//            e.stopPropagation();
//            e.preventDefault();
//        })
//        //Set color 
//        $(element).find(colorPicker).on('click', setColorPickerColor);

//    }
//}







//angular.module('ng-sortable', [''])
//		.constant('ngSortableConfig', {
//		    onEnd: function () {
//		        console.log('default onEnd()');
//		    }
//		})


/*
* Angular directive for carouFredSel
*/

//angular.module('ngCaroufredsel',[])
//.directive('caroufredsel', function($parse) {
//    var ddo = {
//        restrict: 'E,A',
//        scope: {
//            "handler": "=caroufredsel",
//            "opt": "=caroufredselOpt"
//        },
//        link: function (scope,element,attrs,controller) {
//            var $el = $(element);
//            scope.handler = $el.carouFredSel(scope.opt);

//            /**
//             * Update the carousel
//             * */
//            scope.handler.update = function() {
//               setTimeout(function(){
//                   $el.carouFredSel(scope.opt);
//               },50);
//            };
//        }
//    };
//    return ddo;
//});

/*
 * Angular directive for jQuery drag
 */
//angular.module('ngDragndrop',[])
//.directive('ngDrag', function() {
//    var ddo = {
//        restrict:'A',
//        link: function(scope, element, attrs) {
//            element.draggable({
//                revert: 'invalid',
//                helper: 'clone',
//                cursor: 'move',
//                //appendTo: 'body'
//            });
//        }
//    };
//    return ddo;
//})
//.directive('ngDrop', function() {
//    var ddo = {
//        restrict: 'A',
//        scope: {
//            "ondrop": "&onDrop"
//        },
//        link: function(scope,element,attrs){
//            element.droppable({
//                //hoverClass: "drop-hover",
//                drop: function(event,ui) {
//                    console.log('drop');
//                    var dropCallback = scope.ondrop();
//                    // Pass all the variables relative to the dragged element and the scope
//                    dropCallback(event,ui,element,attrs,scope)
//                }
//            });
//        }
//    };
//    return ddo;
//});

/*
 * Directive wrapper for leaflet
 */

angular.module('ngLeaflet', [])
.directive('ngLeaflet', function () {
    var ddo = {
        restrict: 'AE',
        scope: {
            "ngLeaflet": "=",
            "mapOptions": "="
        },
        link: function (scope, element, attrs) {

            // Config 
            var map_defaults = scope.mapOptions;

            // Init
            scope.ngLeaflet = new L.Map(element.get(0).id, {
                center: map_defaults.center,
                zoom: map_defaults.zoom,
                layers: [map_defaults.base_layer],
                scrollWheelZoom: true,
                zoomControl: false,
            });

            if (L.Control.Zoomslider)
                scope.ngLeaflet.addControl(new L.Control.Zoomslider({
                    position: 'topright'
                }));
        }
    };
    return ddo;
});


/**
 * App specific
 * */
app.directive('selectOnClick', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.on('click', function () {
                this.select();
            });
        }
    };
});

app.directive('a', function () {
    return {
        restrict: 'E',
        link: function (scope, elem, attrs) {
            if ('disabled' in attrs) {
                elem.on('click', function (e) {
                    e.preventDefault(); // prevent link click
                });
            }
        }
    };
});
app.directive('iscrollAnimated', function ($parse) {
    return {
        restrict: 'A',
        require: '?ngModel',
        scope: {
            "iscroll": "=iscrollAnimated",
            "opt": "=iscrollOpt"
        },
        link: function (scope, element, attrs, controller) {
            var opt = scope.opt || {};
            scope.iscroll = new IScroll(element[0], opt);

            var wrapper = element[0].children[0]

            // Refresh automatically
            setInterval(function () {

                // Count children
                var children_w = 140;
                var w = wrapper.children.length * children_w;

                // Resize wrapper
                wrapper.style.width = w + 'px';

                scope.iscroll.refresh();
            }, 500);

            scope.iscroll.on('scroll', function () {
                var pos = Math.abs(this.x) - 10;
                var tile = 110
                var cursor = Math.floor(pos / tile);
                cursor < 0 ? cursor = 0 : cursor; // add one
                //console.log(cursor);
                var n = 2;
                var l_el = wrapper.children[cursor];
                var r_el = wrapper.children[cursor + n];
            });


        }
    };

});

