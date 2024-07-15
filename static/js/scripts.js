document.addEventListener('DOMContentLoaded', (event) => {
    const deleteForms = document.querySelectorAll('.delete-form');
    const scannerModal = document.getElementById('scanner-modal');
    const scannerContainer = document.querySelector('.scanner-container');
    const closeScannerButton = document.getElementById('close-scanner');

    deleteForms.forEach(form => {
        form.addEventListener('submit', function(event) {
            const confirmed = confirm('¿Está seguro de querer borrar esta parte?');
            if (!confirmed) {
                event.preventDefault();
            }
        });
    });

    function startScanner(callback) {
        scannerModal.style.display = 'flex';

        // Ajustar el tamaño del contenedor de la cámara
        scannerContainer.style.width = '300px';  // Ajusta el ancho según tus necesidades
        scannerContainer.style.height = '200px'; // Ajusta la altura según tus necesidades

        Quagga.init({
            inputStream: {
                type: 'LiveStream',
                target: scannerContainer,
                constraints: {
                    facingMode: 'environment'
                }
            },
            decoder: {
                readers: ['code_128_reader']
            }
        }, function(err) {
            if (err) {
                console.error(err);
                return;
            }
            Quagga.start();
        });

        Quagga.onDetected(function(result) {
            const code = result.codeResult.code;
            callback(code);
            stopScanner();
        });
    }

    function stopScanner() {
        scannerModal.style.display = 'none';
        Quagga.stop();
    }

    document.getElementById('start-scan').addEventListener('click', function() {
        startScanner(function(code) {
            document.getElementById('part_number').value = code;
        });
    });

    document.getElementById('start-scan-search').addEventListener('click', function() {
        startScanner(function(code) {
            const searchInput = document.getElementById('search_query');
            searchInput.value = code;
            searchInput.form.submit();  // Enviar el formulario automáticamente

            // Desplazarse hacia abajo después de la búsqueda
            searchInput.form.addEventListener('submit', function(event) {
                event.preventDefault(); // Prevenir el envío múltiple del formulario
                fetch(searchInput.form.action, {
                    method: searchInput.form.method,
                    body: new FormData(searchInput.form)
                }).then(response => response.text()).then(html => {
                    document.documentElement.innerHTML = html;
                    window.scrollTo(0, document.body.scrollHeight); // Desplazarse hacia abajo
                });
            });
        });
    });

    closeScannerButton.addEventListener('click', stopScanner);

    const updateForms = document.querySelectorAll('.update-form');
    updateForms.forEach(form => {
        const inputs = form.querySelectorAll('input');
        const submitButton = form.querySelector('button.actualizar-button');
        const cancelButton = form.querySelector('.cancel-button');
        let originalValues = {};

        inputs.forEach(input => {
            originalValues[input.name] = input.value;
            input.addEventListener('input', () => {
                submitButton.style.display = 'inline-block';
                submitButton.disabled = false;
                cancelButton.style.display = 'inline-block';
            });
        });

        form.addEventListener('submit', function(event) {
            const confirmed = confirm('¿Estás seguro de que deseas realizar los cambios?');
            if (!confirmed) {
                event.preventDefault();
            }
        });

        cancelButton.addEventListener('click', () => {
            inputs.forEach(input => {
                input.value = originalValues[input.name];
            });
            submitButton.style.display = 'none';
            submitButton.disabled = true;
            cancelButton.style.display = 'none';
        });
    });
});
