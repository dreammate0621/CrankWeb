var frames = $('.frame__workpageteam');

//frames.on('click', expandFrame); for now disable the frame expand on + button

function expandFrame(e) {
    alert('in expanframe');
    var frame = $(e.target).closest('.frame__workpageteam');

    var container = $('.account__frames_wpteam--side');
    var closestContainer = getContainer(frame);
    var closestContainerHeight = closestContainer.height();
    var scrollTop = container.scrollTop();
    var offsetTop = container.position().top;
    var top = frame.position().top;
    var left = frame.position().left;

    if (frame.hasClass('frame__workpageteam--expanded')) {
        frame.removeClass('frame__workpageteam--expanded');
        frame.css('height', '');

        setTimeout(function () {
            $(frame).animate({
                left: frame.data('left'),
                top: frame.data('top')
            }, 300);
        }, 700);

        if (frame.data('top')) {
            setTimeout(function () {
                fixFrame(frame);
            }, 1100);
        } else {
            setTimeout(function () {
                fixFrame(frame);
            }, 800);
        }
    } else {
        closestContainer.css('height', closestContainerHeight + 'px');
        hideFrames(true, frame);
        expandedFrame(frame, top, left, '400px');

        if (left == 0 && top == offsetTop) {
            frame.css('transition-delay', '0s');
        } else {
            frame.data('scrollTop', scrollTop);
            frame.data('left', left);
            frame.data('top', top);
        }

        $(frame).animate({
            left: '0',
            top: offsetTop
        }, 300);

        frame.addClass('frame__workpageteam--expanded');
        frame.css('height', '400px');
    }
}

function getContainer(frame) {
    alert('in get container');
    var container = frame.closest('.account__frames');
    return container;
}

function expandedFrame(frame, top, left) {
    alert('in expanded frame');
    frame.css({ 'left': left, 'top': top, 'position': 'absolute', 'z-index': 1 });
}

function fixFrame(frame) {
    alert('in fix frame');
    var container = getContainer(frame);
    hideFrames(false, frame);
    frame.css({ 'left': '', 'top': '', 'position': 'relative', 'z-index': '', 'transition-delay:': '' });
    container.css('height', '');
    container.scrollTop(frame.data('scrollTop'));
}

function hideFrames(hide, frame) {
    alert('in hideframes');
    var container = getContainer(frame);
    var frames = $(container).find('.frame__workpageteam');

    if (hide) {
        frames.css('display', 'none');
        frame.css('display', '');
    } else {
        frames.fadeIn(300);
    }
}

var framesContainer = document.querySelectorAll('.account__frames');

for (var i = 0; i < framesContainer.length; i++) {
    new Sortable(framesContainer[i], {
        sort: true,
        group: '.account__frames',
        draggable: '.frame__workpageteam',
        animation: 400
    });
}

// show flayout block
var tiles = document.querySelectorAll('.tile');
var tileContent = document.querySelector('.tile-content');

for (var i = 0; i < tiles.length; i++) {
    tiles[i].addEventListener('mouseenter', function (e) {
        alert('in mouseenter');
        var tileItem = document.getElementById(this.getAttribute('data-tile-content'));

        if (tileItem) {
            tileContent.classList.add('tile-content--visible');
            tileItem.classList.add('tile-content__item--visible');

            this.addEventListener('mouseleave', function () {
                tileContent.classList.remove('tile-content--visible');
                tileItem.classList.remove('tile-content__item--visible');
            });
        }
    });

    tiles[i].addEventListener('click', function () {
        alert('click event fired');
        this.classList.toggle('tile--active');
    });
}

// iScroll
//var sortable = new IScroll('.date-bar__scroll', { scrollX: true, scrollY: false, mouseWheel: true });

// datepicker
var datePicker = $('.date-picker');

datePicker.datepicker({
    inline: true,
    showOtherMonths: true,
    showOn: "button",
    dayNamesMin: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
});

$('.date-bar__icon').on('click', function () {
    datePicker.toggleClass('date-picker--active');
});