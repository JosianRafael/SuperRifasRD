//index.js

// Botón toggle
$('#buttfixed').on('click', function () {
    $('#linksfixed').toggle();
});

// Scroll navbar
$(window).scroll(function () {
    if ($(this).scrollTop() > 20) {
        $('#navbar').addClass('header-scrolled');
    } else {
        $('#navbar').removeClass('header-scrolled');
    }
});

// Cerrar menú al hacer click
$("#navbarNav").on("click", "a", function () {
    $(".navbar-toggle").click();
});

$(".nav-item").on("click", "a", function () {
    $("#navbarNav").removeClass('show');
});

// Función copiar / abrir enlace
function actionButtonAccounts(action_type, elemnt, text) {
    if (action_type == 'copy') {
        $(elemnt).addClass("copied");

        setTimeout(function () {
            $(elemnt).removeClass("copied");
        }, 1200);

        var sampleTextarea = document.createElement("textarea");
        document.body.appendChild(sampleTextarea);

        sampleTextarea.value = text;
        sampleTextarea.select();

        document.execCommand("copy");

        document.body.removeChild(sampleTextarea);
    } else if (action_type == 'link') {
        window.open(text, '_blank').focus();
    }
}

// Paginación AJAX
$(document).on('click', '.pagination a', function (e) {
    e.preventDefault();
    var url = $(this).attr('href');

    $.ajax({
        url: url,
        type: 'GET',
        dataType: 'script'
    });
});

// Navegación con botón atrás
window.addEventListener('popstate', function () {
    $.ajax({
        url: location.href,
        type: 'GET',
        dataType: 'script'
    });
});

// DOM cargado
document.addEventListener('DOMContentLoaded', function () {

    // Actualizar progreso (cards)
    function updateProgress() {
        const progressData = [
            { total: 10000, actual: 2155, percentId: 'percent-1', fillId: 'fill-1' },
            { total: 10000, actual: 4500, percentId: 'percent-2', fillId: 'fill-2' },
            { total: 10000, actual: 9417, percentId: 'percent-3', fillId: 'fill-3' }
        ];

        progressData.forEach(item => {
            if (item.total > 0) {
                const percent = Number((item.actual * 100 / item.total).toFixed(1));

                const percentSpan = document.getElementById(item.percentId);
                const fillDiv = document.getElementById(item.fillId);

                if (percentSpan) percentSpan.textContent = percent + '%';
                if (fillDiv) fillDiv.style.width = percent + '%';
            }
        });
    }

    updateProgress();

    // Progress dinámico
    document.querySelectorAll('.progress-contain').forEach(function (progress) {
        const total = parseFloat(progress.dataset.total);
        const actual = parseFloat(progress.dataset.actual);

        if (total > 0) {
            const percent = Number((actual * 100 / total).toFixed(1));

            const bar = progress.querySelector('.progress-actual');
            const label = progress.querySelector('.progress-percent');

            if (bar) bar.style.width = percent + '%';

            if (label) {
                label.style.left = percent + '%';
                label.textContent = percent + '%';

                if (parseFloat(percent) < 12) {
                    label.style.marginLeft = '4px';
                    label.classList.remove('inner');
                    label.classList.add('outer');
                }
            }
        }
    });
});
