document.addEventListener('DOMContentLoaded', (event) => {
    const deleteForms = document.querySelectorAll('.delete-form');

    deleteForms.forEach(form => {
        form.addEventListener('submit', function(event) {
            const confirmed = confirm('Esta seguro de querer borrar esta parte?');
            if (!confirmed) {
                event.preventDefault();
            }
        });
    });
});
