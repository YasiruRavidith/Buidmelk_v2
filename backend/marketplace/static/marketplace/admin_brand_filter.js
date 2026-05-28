(function () {
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
  }

  function updateBrandOptions(categorySelect, brandSelect) {
    const categoryId = categorySelect.value;
    const currentValue = brandSelect.value;

    brandSelect.disabled = true;
    brandSelect.innerHTML = '<option value="">Loading...</option>';

    if (!categoryId) {
      brandSelect.innerHTML = '<option value="">---------</option>';
      brandSelect.disabled = false;
      return;
    }

    fetch(`/api/marketplace/brands/?category=${encodeURIComponent(categoryId)}`, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRFToken': getCookie('csrftoken'),
      },
      credentials: 'same-origin',
    })
      .then((response) => response.ok ? response.json() : [])
      .then((brands) => {
        const options = ['<option value="">---------</option>'];
        (brands || []).forEach((brand) => {
          options.push(`<option value="${brand.name}">${brand.name}</option>`);
        });

        brandSelect.innerHTML = options.join('');
        if (currentValue) {
          brandSelect.value = currentValue;
        }
        brandSelect.disabled = false;
      })
      .catch(() => {
        brandSelect.innerHTML = '<option value="">---------</option>';
        brandSelect.disabled = false;
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    const categorySelect = document.querySelector('#id_category');
    const brandSelect = document.querySelector('[data-brand-select="true"]');

    if (!categorySelect || !brandSelect) {
      return;
    }

    updateBrandOptions(categorySelect, brandSelect);
    categorySelect.addEventListener('change', function () {
      updateBrandOptions(categorySelect, brandSelect);
    });
  });
})();