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
});
