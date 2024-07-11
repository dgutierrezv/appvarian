document.addEventListener('DOMContentLoaded', (event) => {
    const deleteForms = document.querySelectorAll('.delete-form');
    const scannerModal = document.getElementById('scanner-modal');
    const scannerContainer = document.querySelector('.scanner-container');
    const scannerVideo = document.getElementById('scanner');
    const closeScannerButton = document.getElementById('close-scanner');
    let scannerStream;

    deleteForms.forEach(form => {
        form.addEventListener('submit', function(event) {
            const confirmed = confirm('Esta seguro de querer borrar esta parte?');
            if (!confirmed) {
                event.preventDefault();
            }
        });
    });

    function startScanner(callback) {
        scannerModal.style.display = 'flex';
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(stream => {
                scannerStream = stream;
                scannerVideo.srcObject = stream;
                scannerVideo.setAttribute('playsinline', true); // required to tell iOS safari we don't want fullscreen
                scannerVideo.play();
                requestAnimationFrame(tick);
            });

        function tick() {
            if (scannerVideo.readyState === scannerVideo.HAVE_ENOUGH_DATA) {
                const canvas = document.createElement('canvas');
                canvas.width = scannerVideo.videoWidth;
                canvas.height = scannerVideo.videoHeight;
                const context = canvas.getContext('2d');
                context.drawImage(scannerVideo, 0, 0, canvas.width, canvas.height);
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                
                Quagga.decodeSingle({
                    src: imageData,
                    numOfWorkers: 0,  // Needs to be 0 when used within node
                    decoder: {
                        readers: ["code_128_reader"]
                    },
                    locate: true
                }, function(result) {
                    if (result && result.codeResult) {
                        callback(result.codeResult.code);
                        stopScanner();
                    } else {
                        requestAnimationFrame(tick);
                    }
                });
            } else {
                requestAnimationFrame(tick);
            }
        }
    }

    function stopScanner() {
        scannerModal.style.display = 'none';
        if (scannerStream) {
            scannerStream.getTracks().forEach(track => track.stop());
        }
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

    closeScannerButton.addEventListener('click', stopScanner);

    const updateForms = document.querySelectorAll('.update-form');
    updateForms.forEach(form => {
        const inputs = form.querySelectorAll('input');
        const submitButton = form.querySelector('button[type="submit"]');
        const cancelButton = form.querySelector('.cancel-button');
        let originalValues = {};

        inputs.forEach(input => {
            originalValues[input.name] = input.value;
            input.addEventListener('input', () => {
                submitButton.disabled = false;
                cancelButton.style.display = 'inline-block';
            });
        });

        cancelButton.addEventListener('click', () => {
            inputs.forEach(input => {
                input.value = originalValues[input.name];
            });
            submitButton.disabled = true;
            cancelButton.style.display = 'none';
        });
    });
});
