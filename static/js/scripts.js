document.addEventListener('DOMContentLoaded', (event) => {
    const deleteForms = document.querySelectorAll('.delete-form');

    deleteForms.forEach(form => {
        form.addEventListener('submit', function(event) {
            const confirmed = confirm('Esta seguro de querer eliminar esta parte!?');
            if (!confirmed) {
                event.preventDefault();
            }
        });
    });

    function startScanner(callback) {
        document.getElementById('scanner-modal').style.display = 'flex';
        Quagga.init({
            inputStream : {
                name : "Live",
                type : "LiveStream",
                target: document.querySelector('#scanner')
            },
            decoder : {
                readers : ["code_128_reader"]
            }
        }, function(err) {
            if (err) {
                console.log(err);
                return;
            }
            console.log("Initialization finished. Ready to start");
            Quagga.start();
        });

        Quagga.onDetected(function(data) {
            callback(data.codeResult.code);
            Quagga.stop();
            document.getElementById('scanner-modal').style.display = 'none';
        });
    }

    document.getElementById('start-scan').addEventListener('click', function() {
        startScanner(function(code) {
            document.getElementById('part_number').value = code;
        });
    });

    document.getElementById('start-scan-search').addEventListener('click', function() {
        startScanner(function(code) {
            document.getElementById('search_query').value = code;
        });
    });
});
