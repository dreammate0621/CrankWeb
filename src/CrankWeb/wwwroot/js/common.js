$(document).ready(function () {
    var mainContainer = $('.source-panel__content--main');

    mainContainer.find($('.source-panel__member-link')).click(function () {
        if (!$(this).data().sourcePanel) return false;
        var container = $(document.getElementById($(this).data().sourcePanel));

        fadeOut(mainContainer, 300);
        fadeIn(mainContainer, container, 300, 350);
        return false;
    });

    $('.source-panel__label--main').click(function () {
        if ($(this).closest('.source-panel__content').hasClass('source-panel__content--main')) return false;

        var container = getContainer(this);

        fadeOut(container, 300);
        fadeIn(container, mainContainer, 300, 350);
        return false;
    });

    mainContainer.find($('.source-panel__label--data')).click(function () {
        var container = getContainer(this);

        fadeOut(container, 300);
        fadeIn(container, $('.source-panel__content--digital'), 300, 350);
        return false;
    });

    $('.source-panel__member-link').click(function () {
        if ($(this).closest('.source-panel__content').hasClass('source-panel__content--main') ||
            !$(this).html()) return false;

        $(this).parent().toggleClass('source-panel__member-item--active');
        return false;
    });

    function fadeOut(container, duration) {
        container.animate({
            opacity: 0
        }, duration, 'jswing');
    }

    function fadeIn(containerToHide, containerToShow, duration, delay) {
        setTimeout(function () {
            containerToHide.css({'display': 'none'});
            containerToShow.css({'display': 'flex', 'opacity': '0'});

            containerToShow.animate({
                opacity: 1
            }, duration, 'jswing');
        }, delay);
    }

    function getContainer(el) {
        var container = $(el).closest('.source-panel__content');
        return container;
    }
});