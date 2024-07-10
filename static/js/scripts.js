document.addEventListener('DOMContentLoaded', (event) => {
    const deleteForms = document.querySelectorAll('.delete-form');

    deleteForms.forEach(form => {
        form.addEventListener('submit', function(event) {
            const confirmed = confirm('Are you sure you want to delete this part?');
            if (!confirmed) {
                event.preventDefault();
            }
        });
    });

    function initScanner(scannerContainerId, videoElementId, inputElementId) {
        const scannerContainer = document.getElementById(scannerContainerId);
        const videoElement = document.getElementById(videoElementId);
        const inputElement = document.getElementById(inputElementId);

        function stopScan() {
            const stream = videoElement.srcObject;
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            videoElement.srcObject = null;
            scannerContainer.style.display = 'none';
        }

        function startScan() {
            scannerContainer.style.display = 'block';
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                .then(stream => {
                    videoElement.srcObject = stream;
                })
                .catch(console.error);

            videoElement.addEventListener('loadeddata', (event) => {
                Quagga.init({
                    inputStream: {
                        name: "Live",
                        type: "LiveStream",
                        target: videoElement,
                        constraints: {
                            facingMode: "environment"
                        },
                    },
                    decoder: {
                        readers: ["code_128_reader"]
                    }
                }, (err) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    Quagga.start();
                });

                Quagga.onDetected((data) => {
                    inputElement.value = data.codeResult.code;
                    Quagga.stop();
                    stopScan();
                });
            });
        }

        return startScan;
    }

    const startPartScan = initScanner('scanner-container', 'scanner', 'part_number');
    const startSearchScan = initScanner('search-scanner-container', 'search-scanner', 'search_query');

    document.getElementById('start-scan').addEventListener('click', startPartScan);
    document.getElementById('start-search-scan').addEventListener('click', startSearchScan);
});
